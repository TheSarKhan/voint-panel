import { useEffect, useMemo, useState } from "react";
import {
  copyRoleFromTemplate,
  createRole,
  deleteRole,
  getCatalog,
  listRoleTemplates,
  listRoles,
  updateRole,
  type PermissionCatalog,
  type RoleDetail,
} from "../api/roles";
import {
  copyDepartmentFromTemplate,
  createDepartment,
  deleteDepartment,
  getDepartmentRoles,
  listDepartmentTemplates,
  listDepartments,
  updateDepartment,
  type Department,
  type DepartmentCopyResult,
} from "../api/departments";
import { listUsers, type PanelUser } from "../api/users";
import { PermissionMatrix } from "../components/PermissionMatrix";
import {
  IconArrowLeft,
  IconChevronDown,
  IconChevronRight,
  IconEdit,
  IconPlus,
  IconTrash,
} from "../components/icons";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  inputCls,
  Modal,
  PageHeader,
  Select,
  Spinner,
  StatusText,
  Table,
  TableContainer,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "../components/ui";
import { useTenantId } from "../lib/useTenantId";
import { apiErrorText } from "../lib/apiError";

const UNGROUPED_ID = "";

type Group = {
  id: string;
  name: string;
  description: string | null;
  roles: RoleDetail[];
  real: boolean;
};

/**
 * Bu müəssisənin öz departamentləri və rolları — hər işçiyə nə edə biləcəyini deyən matris.
 * Ekran iki mərtəbəlidir: əvvəlcə departamentlər, sonra onların içindəki rollar.
 */
export function RolesPage() {
  const tenantId = useTenantId();

  const [catalog, setCatalog] = useState<PermissionCatalog | null>(null);
  const [roles, setRoles] = useState<RoleDetail[] | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<PanelUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [openId, setOpenId] = useState<string | null>(null);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);

  const [departmentForm, setDepartmentForm] = useState<Department | "new" | null>(null);
  const [roleForm, setRoleForm] = useState<RoleDetail | "new" | null>(null);
  const [importOpen, setImportOpen] = useState<false | string>(false);
  const [importDepartmentOpen, setImportDepartmentOpen] = useState(false);

  const load = async () => {
    const [list, deps, us] = await Promise.all([
      listRoles(tenantId),
      listDepartments(tenantId),
      listUsers(tenantId),
    ]);
    setRoles(list);
    setDepartments(deps);
    setUsers(us);
  };

  useEffect(() => {
    setOpenId(null);
    setExpandedRole(null);
    getCatalog(tenantId).then(setCatalog).catch(() => setError("İcazə siyahısı yüklənmədi."));
    load().catch(() => setError("Rollar yüklənmədi."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const groups: Group[] = useMemo(() => {
    const all = roles ?? [];
    const out: Group[] = departments.map((d) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      roles: all.filter((r) => r.departmentId === d.id),
      real: true,
    }));
    const loose = all.filter(
      (r) => !r.departmentId || !departments.some((d) => d.id === r.departmentId),
    );
    if (loose.length > 0) {
      out.push({
        id: UNGROUPED_ID,
        name: "Departamentsiz",
        description: "Hələ bir departamentə aid edilməyib.",
        roles: loose,
        real: false,
      });
    }
    return out;
  }, [roles, departments]);

  const open = openId === null ? null : (groups.find((g) => g.id === openId) ?? null);
  const usersOf = (roleId: string) => users.filter((u) => u.roleId === roleId);

  const removeRole = async (role: RoleDetail) => {
    if (!confirm(`"${role.name}" rolu silinsin?`)) return;
    setError(null);
    try {
      await deleteRole(tenantId, role.id);
      await load();
    } catch (e) {
      setError(apiErrorText(e, "Silinmədi."));
    }
  };

  const removeDepartment = async (group: Group) => {
    const warning =
      group.roles.length > 0
        ? `"${group.name}" silinsin? İçindəki ${group.roles.length} rol silinmir — sadəcə departamentsiz qalır.`
        : `"${group.name}" silinsin?`;
    if (!confirm(warning)) return;
    setError(null);
    try {
      await deleteDepartment(tenantId, group.id);
      setOpenId(null);
      await load();
    } catch (e) {
      setError(apiErrorText(e, "Silinmədi."));
    }
  };

  if (!catalog || !roles) {
    return (
      <div>
        <PageHeader title="Rollar" subtitle="İşçilərin nə edə biləcəyini müəyyən edir" />
        {error ? <Alert tone="err">{error}</Alert> : <Spinner />}
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Rollar" subtitle="İşçilərin nə edə biləcəyini müəyyən edir" />

      <div className="space-y-4">
        {error && <Alert tone="err">{error}</Alert>}

        {open === null ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-fg-muted">
                Departamentlər rolları qruplaşdırır. Rollar onların içindədir.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => setImportOpen("")}>
                  Rolu şablondan gətir
                </Button>
                <Button variant="secondary" onClick={() => setImportDepartmentOpen(true)}>
                  Departamenti şablondan gətir
                </Button>
                <Button icon={IconPlus} onClick={() => setDepartmentForm("new")}>
                  Yeni departament
                </Button>
              </div>
            </div>

            {groups.length === 0 ? (
              <Card>
                <CardBody>
                  <p className="text-sm text-fg-faint">
                    Hələ departament yoxdur. Birini yarat — rollar onun içində saxlanılacaq.
                  </p>
                </CardBody>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {groups.map((g) => {
                  const userCount = g.roles.reduce((n, r) => n + r.userCount, 0);
                  const enter = () => {
                    setOpenId(g.id);
                    setExpandedRole(null);
                  };
                  return (
                    <div
                      key={g.id || "ungrouped"}
                      role="button"
                      tabIndex={0}
                      onClick={enter}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          enter();
                        }
                      }}
                      className="cursor-pointer rounded-lg border border-border bg-surface p-5 text-left transition-colors hover:border-border-strong hover:bg-surface-2/60 focus:outline-none focus-visible:border-border-strong focus-visible:ring-1 focus-visible:ring-border-strong"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-sm font-medium text-fg">{g.name}</span>
                        {g.real ? (
                          <div className="-mt-1 -mr-1 flex shrink-0 gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={IconEdit}
                              iconOnly
                              aria-label="Adı dəyiş"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDepartmentForm(departments.find((d) => d.id === g.id) ?? "new");
                              }}
                            />
                            <Button
                              variant="danger"
                              size="sm"
                              icon={IconTrash}
                              iconOnly
                              aria-label="Sil"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeDepartment(g);
                              }}
                            />
                          </div>
                        ) : (
                          <IconChevronRight width={14} height={14} className="mt-1 shrink-0 text-fg-faint" />
                        )}
                      </div>
                      {g.description && <p className="mt-1.5 text-xs text-fg-muted">{g.description}</p>}
                      <p className="mt-4 text-xs text-fg-faint">
                        {g.roles.length} rol · {userCount} istifadəçi
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                setOpenId(null);
                setExpandedRole(null);
              }}
              className="inline-flex items-center gap-2 text-sm text-fg-muted transition-colors hover:text-fg"
            >
              <IconArrowLeft width={14} height={14} />
              Departamentlər
            </button>

            <Card>
              <CardHeader
                title={open.name}
                description={open.description ?? undefined}
                actions={
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setImportOpen(open.real ? open.id : "")}
                    >
                      Şablondan köçür
                    </Button>
                    <Button size="sm" icon={IconPlus} onClick={() => setRoleForm("new")}>
                      Yeni rol
                    </Button>
                  </div>
                }
              />
              <CardBody className="p-0">
                {open.roles.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-fg-faint">Bu departamentdə hələ rol yoxdur.</p>
                ) : (
                  <TableContainer>
                    <Table>
                      <THead>
                        <TH className="w-10" />
                        <TH>Rol</TH>
                        <TH>Təsvir</TH>
                        <TH>İstifadəçi</TH>
                        <TH className="text-right">Əməliyyat</TH>
                      </THead>
                      <TBody>
                        {open.roles.map((r) => {
                          const isOpen = expandedRole === r.id;
                          const holders = usersOf(r.id);
                          return [
                            <TR key={r.id}>
                              <TD>
                                <button
                                  type="button"
                                  aria-label={isOpen ? "Bağla" : "İcazələrə bax"}
                                  aria-expanded={isOpen}
                                  onClick={() => setExpandedRole(isOpen ? null : r.id)}
                                  className="flex h-7 w-7 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
                                >
                                  {isOpen ? (
                                    <IconChevronDown width={14} height={14} />
                                  ) : (
                                    <IconChevronRight width={14} height={14} />
                                  )}
                                </button>
                              </TD>
                              <TD className="font-medium text-fg">
                                <span className="flex items-baseline gap-2">
                                  {r.name}
                                  {r.system && <StatusText tone="neutral">sistem</StatusText>}
                                </span>
                              </TD>
                              <TD className="text-fg-muted">{r.description || "—"}</TD>
                              <TD className="tabular-nums text-fg-muted">{r.userCount}</TD>
                              <TD className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button variant="ghost" size="sm" icon={IconEdit} onClick={() => setRoleForm(r)}>
                                    Redaktə
                                  </Button>
                                  {!r.system && (
                                    <Button
                                      variant="danger"
                                      size="sm"
                                      icon={IconTrash}
                                      iconOnly
                                      aria-label="Sil"
                                      onClick={() => removeRole(r)}
                                    />
                                  )}
                                </div>
                              </TD>
                            </TR>,

                            isOpen && (
                              <TR key={`${r.id}-detail`}>
                                <TD colSpan={5} className="bg-surface-2/40 p-0">
                                  <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-[1fr_18rem]">
                                    <div>
                                      <h4 className="mb-3 text-sm font-medium text-fg">İcazələr</h4>
                                      <PermissionMatrix
                                        catalog={catalog}
                                        value={r.permissions}
                                        onChange={() => {}}
                                        disabled
                                      />
                                      <p className="mt-2 text-xs text-fg-faint">
                                        Burada yalnız baxılır. Dəyişmək üçün — Redaktə.
                                      </p>
                                    </div>

                                    <div>
                                      <h4 className="mb-3 text-sm font-medium text-fg">Bu roldakı işçilər</h4>
                                      {holders.length === 0 ? (
                                        <p className="text-sm text-fg-faint">Bu rolda işçi yoxdur.</p>
                                      ) : (
                                        <ul className="space-y-2.5">
                                          {holders.map((u) => (
                                            <li key={u.id}>
                                              <span className="block text-sm text-fg">
                                                {u.fullName || u.email}
                                              </span>
                                              <span className="flex items-baseline gap-2">
                                                {u.fullName && (
                                                  <span className="text-xs text-fg-muted">{u.email}</span>
                                                )}
                                                {u.status !== "ACTIVE" && (
                                                  <StatusText tone="err">bloklanıb</StatusText>
                                                )}
                                              </span>
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                    </div>
                                  </div>
                                </TD>
                              </TR>
                            ),
                          ];
                        })}
                      </TBody>
                    </Table>
                  </TableContainer>
                )}
              </CardBody>
            </Card>
          </>
        )}
      </div>

      {departmentForm && (
        <DepartmentFormModal
          tenantId={tenantId}
          department={departmentForm === "new" ? null : departmentForm}
          onClose={() => setDepartmentForm(null)}
          onSaved={async () => {
            setDepartmentForm(null);
            await load();
          }}
        />
      )}

      {roleForm && (
        <RoleFormModal
          tenantId={tenantId}
          role={roleForm === "new" ? null : roleForm}
          catalog={catalog}
          departments={departments}
          presetDepartmentId={roleForm === "new" ? (open?.id ?? "") : ""}
          onClose={() => setRoleForm(null)}
          onSaved={async () => {
            setRoleForm(null);
            await load();
          }}
        />
      )}

      {importOpen !== false && (
        <ImportTemplateModal
          tenantId={tenantId}
          departments={departments}
          presetDepartmentId={importOpen}
          onClose={() => setImportOpen(false)}
          onImported={async () => {
            setImportOpen(false);
            await load();
          }}
        />
      )}

      {importDepartmentOpen && (
        <ImportDepartmentModal
          tenantId={tenantId}
          onClose={() => setImportDepartmentOpen(false)}
          onImported={async () => {
            setImportDepartmentOpen(false);
            await load();
          }}
        />
      )}
    </div>
  );
}

function DepartmentFormModal({
  tenantId,
  department,
  onClose,
  onSaved,
}: {
  tenantId: string;
  department: Department | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(department?.name ?? "");
  const [description, setDescription] = useState(department?.description ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const payload = { name: name.trim(), description: description.trim() || undefined };
      if (department) {
        await updateDepartment(tenantId, department.id, payload);
      } else {
        await createDepartment(tenantId, payload);
      }
      onSaved();
    } catch (e) {
      setError(apiErrorText(e, "Yadda saxlanmadı."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={department ? "Departamenti redaktə et" : "Yeni departament"} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-fg-muted">Departament rolları qruplaşdırır. Rolun icazələrinə təsir etmir.</p>
        <Field label="Ad">
          <input className={inputCls} placeholder="Dəstək" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Təsvir">
          <input
            className={inputCls}
            placeholder="Müştəri sorğuları"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        {error && <p className="text-sm text-err">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Ləğv et
          </Button>
          <Button loading={busy} disabled={!name.trim()} onClick={submit}>
            {department ? "Yadda saxla" : "Yarat"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/** Rol yaratmaq və redaktə etmək — icazə matrisi burada, yalnız burada dəyişdirilir. */
function RoleFormModal({
  tenantId,
  role,
  catalog,
  departments,
  presetDepartmentId,
  onClose,
  onSaved,
}: {
  tenantId: string;
  role: RoleDetail | null;
  catalog: PermissionCatalog;
  departments: Department[];
  presetDepartmentId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [departmentId, setDepartmentId] = useState(role ? (role.departmentId ?? "") : presetDepartmentId);
  const [permissions, setPermissions] = useState<Record<string, string[]>>(
    role ? { ...role.permissions } : {},
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        departmentId: departmentId || null,
        permissions,
      };
      if (role) {
        await updateRole(tenantId, role.id, payload);
      } else {
        await createRole(tenantId, payload);
      }
      onSaved();
    } catch (e) {
      setError(apiErrorText(e, "Yadda saxlanmadı."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal size="xl" title={role ? role.name : "Yeni rol"} onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Ad">
            <input
              className={inputCls}
              placeholder="Dəstək əməkdaşı"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="Təsvir">
            <input
              className={inputCls}
              placeholder="Nə edə bilir"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <Select
            label="Departament"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            options={[
              { value: "", label: "— seçilməyib —" },
              ...departments.map((d) => ({ value: d.id, label: d.name })),
            ]}
          />
        </div>

        {role?.system && (
          <Alert tone="info">Sistem rolu: adını və icazələrini dəyişə bilərsən, amma silmək olmaz.</Alert>
        )}

        <PermissionMatrix catalog={catalog} value={permissions} onChange={setPermissions} />

        {error && <p className="text-sm text-err">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Ləğv et
          </Button>
          <Button loading={busy} disabled={!name.trim()} onClick={submit}>
            {role ? "Yadda saxla" : "Yarat"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/** Platform rol şablonunu bu müəssisəyə köçürür. */
function ImportTemplateModal({
  tenantId,
  departments,
  presetDepartmentId,
  onClose,
  onImported,
}: {
  tenantId: string;
  departments: Department[];
  presetDepartmentId: string;
  onClose: () => void;
  onImported: () => void;
}) {
  const [templates, setTemplates] = useState<RoleDetail[] | null>(null);
  const [templateId, setTemplateId] = useState("");
  const [departmentId, setDepartmentId] = useState(presetDepartmentId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listRoleTemplates(tenantId)
      .then((list) => {
        setTemplates(list);
        setTemplateId(list[0]?.id ?? "");
      })
      .catch(() => setError("Şablonlar yüklənmədi."));
  }, [tenantId]);

  const chosen = templates?.find((t) => t.id === templateId);
  const grants = chosen ? Object.values(chosen.permissions).reduce((n, a) => n + a.length, 0) : 0;

  const importIt = async () => {
    setBusy(true);
    setError(null);
    try {
      await copyRoleFromTemplate(tenantId, templateId, departmentId || undefined);
      onImported();
    } catch (e) {
      setError(apiErrorText(e, "Gətirilmədi."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Rolu şablondan gətir" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-fg-muted">
          Hazır rol şablonunun surəti bu müəssisəyə əlavə olunur. Sonra sərbəst dəyişə bilərsən — şablona təsir etmir.
        </p>

        {!templates ? (
          <Spinner />
        ) : templates.length === 0 ? (
          <Alert tone="info">Hələ şablon yoxdur.</Alert>
        ) : (
          <>
            <Select
              label="Departament"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              options={[
                { value: "", label: "— seçilməyib —" },
                ...departments.map((d) => ({ value: d.id, label: d.name })),
              ]}
            />
            <Select
              label="Şablon"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              options={templates.map((t) => ({ value: t.id, label: t.name }))}
              help={chosen ? `${grants} icazə${chosen.description ? ` · ${chosen.description}` : ""}` : undefined}
            />
          </>
        )}

        {error && <p className="text-sm text-err">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Ləğv et
          </Button>
          <Button loading={busy} disabled={!templateId} onClick={importIt}>
            Gətir
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Bütöv bir platform departamentini — və seçilmiş rollarını — bu müəssisəyə köçürür.
 * Rollar defolt hamısı seçili gəlir. Ad toqquşması xəta vermir.
 */
function ImportDepartmentModal({
  tenantId,
  onClose,
  onImported,
}: {
  tenantId: string;
  onClose: () => void;
  onImported: () => void;
}) {
  const [templateDepartments, setTemplateDepartments] = useState<Department[] | null>(null);
  const [departmentId, setDepartmentId] = useState("");
  const [templateRoles, setTemplateRoles] = useState<RoleDetail[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DepartmentCopyResult | null>(null);

  useEffect(() => {
    listDepartmentTemplates(tenantId)
      .then((deps) => {
        setTemplateDepartments(deps);
        setDepartmentId(deps[0]?.id ?? "");
      })
      .catch(() => setError("Şablon departamentlər yüklənmədi."));
  }, [tenantId]);

  useEffect(() => {
    if (!departmentId) {
      setTemplateRoles(null);
      return;
    }
    let cancelled = false;
    setTemplateRoles(null);
    getDepartmentRoles(tenantId, departmentId)
      .then((roles) => {
        if (cancelled) return;
        setTemplateRoles(roles);
        setSelected(new Set(roles.map((r) => r.id)));
      })
      .catch(() => {
        if (!cancelled) setError("Rollar yüklənmədi.");
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId, departmentId]);

  const toggle = (roleId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) next.delete(roleId);
      else next.add(roleId);
      return next;
    });
  };

  const importIt = async () => {
    setBusy(true);
    setError(null);
    try {
      setResult(await copyDepartmentFromTemplate(tenantId, departmentId, Array.from(selected)));
    } catch (e) {
      setError(apiErrorText(e, "Köçürülmədi."));
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    return (
      <Modal title="Departament köçürüldü" onClose={onImported}>
        <div className="space-y-4">
          <p className="text-sm text-fg-muted">
            <span className="text-fg">{result.department.name}</span> departamenti yaradıldı.
          </p>
          {result.copiedRoles.length === 0 ? (
            <p className="text-sm text-fg-faint">Heç bir rol köçürülmədi.</p>
          ) : (
            <ul className="space-y-1 text-sm text-fg-muted">
              {result.copiedRoles.map((r) => (
                <li key={r.id}>{r.name}</li>
              ))}
            </ul>
          )}
          <div className="flex justify-end">
            <Button onClick={onImported}>Bağla</Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Departamenti şablondan gətir" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-fg-muted">
          Platform departamentinin surəti — və içindəki seçdiyin rollar — bu müəssisəyə əlavə olunur.
        </p>

        {!templateDepartments ? (
          <Spinner />
        ) : templateDepartments.length === 0 ? (
          <Alert tone="info">Hələ departament şablonu yoxdur.</Alert>
        ) : (
          <Select
            label="Departament"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            options={templateDepartments.map((d) => ({ value: d.id, label: d.name }))}
          />
        )}

        {departmentId &&
          (!templateRoles ? (
            <Spinner />
          ) : templateRoles.length === 0 ? (
            <p className="text-sm text-fg-faint">Bu departamentdə rol yoxdur.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-fg-faint">Köçürüləcək rollar</p>
              {templateRoles.map((r) => (
                <label key={r.id} className="flex items-center gap-2 text-sm text-fg">
                  <input
                    type="checkbox"
                    checked={selected.has(r.id)}
                    onChange={() => toggle(r.id)}
                    className="h-4 w-4 accent-accent"
                  />
                  {r.name}
                </label>
              ))}
            </div>
          ))}

        {error && <p className="text-sm text-err">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Ləğv et
          </Button>
          <Button loading={busy} disabled={!departmentId} onClick={importIt}>
            Gətir
          </Button>
        </div>
      </div>
    </Modal>
  );
}
