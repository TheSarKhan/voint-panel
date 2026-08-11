import { useEffect, useState, type FormEvent } from "react";
import {
  changeUserRole,
  createUser,
  deleteUser,
  listAssignableRoles,
  listUsers,
  resetPassword,
  setUserStatus,
  updateUser,
  type AssignableRole,
  type PanelUser,
} from "../api/users";
import { IconCheck, IconEdit, IconKey, IconLock, IconMore, IconPlus, IconTrash } from "../components/icons";
import {
  Alert,
  Button,
  Card,
  DropdownMenu,
  EmptyState,
  Input,
  InlineSpinner,
  Modal,
  PageHeader,
  Select,
  Spinner,
  StatusText,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "../components/ui";
import { formatDateTime } from "../lib/format";
import { useTenantId } from "../lib/useTenantId";
import { apiErrorText } from "../lib/apiError";

interface FormState {
  email: string;
  fullName: string;
  roleId: string;
}

const emptyForm: FormState = { email: "", fullName: "", roleId: "" };

export function TeamPage() {
  const tenantId = useTenantId();
  const [users, setUsers] = useState<PanelUser[] | null>(null);
  const [roles, setRoles] = useState<AssignableRole[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [editing, setEditing] = useState<PanelUser | "new" | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [roleTarget, setRoleTarget] = useState<PanelUser | null>(null);
  const [roleChoice, setRoleChoice] = useState("");

  const [credentials, setCredentials] = useState<{ email: string; password: string; emailed: boolean } | null>(null);

  const load = () => Promise.all([listUsers(tenantId), listAssignableRoles(tenantId)]).then(([u, r]) => {
    setUsers(u);
    setRoles(r);
  });

  useEffect(() => {
    load().catch((e) => setError(apiErrorText(e, "İstifadəçilər yüklənə bilmədi.")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const openNew = () => {
    setForm({ ...emptyForm, roleId: roles[0]?.id ?? "" });
    setFormError(null);
    setEditing("new");
  };

  const openEdit = (u: PanelUser) => {
    setForm({ email: u.email, fullName: u.fullName ?? "", roleId: u.roleId });
    setFormError(null);
    setEditing(u);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      if (editing === "new") {
        const created = await createUser(tenantId, {
          email: form.email.trim(),
          fullName: form.fullName.trim() || undefined,
          roleId: form.roleId,
        });
        setUsers((prev) => (prev ? [created.user, ...prev] : [created.user]));
        setEditing(null);
        setCredentials({ email: created.user.email, password: created.password, emailed: created.emailed });
      } else if (editing) {
        const updated = await updateUser(tenantId, editing.id, {
          email: form.email.trim(),
          fullName: form.fullName.trim() || undefined,
        });
        setUsers((prev) => (prev ? prev.map((u) => (u.id === updated.id ? updated : u)) : prev));
        setEditing(null);
      }
    } catch (e) {
      setFormError(apiErrorText(e, "Yadda saxlamaq mümkün olmadı."));
    } finally {
      setSaving(false);
    }
  };

  const act = async (id: string, fn: () => Promise<unknown>) => {
    setBusyId(id);
    setError(null);
    try {
      await fn();
      await load();
    } catch (e) {
      setError(apiErrorText(e, "Əməliyyat alınmadı."));
    } finally {
      setBusyId(null);
    }
  };

  const handleResetPassword = (u: PanelUser) =>
    act(u.id, async () => {
      const res = await resetPassword(tenantId, u.id);
      setCredentials({ email: u.email, password: res.password, emailed: res.emailed });
    });

  const handleToggleStatus = (u: PanelUser) =>
    act(u.id, () => setUserStatus(tenantId, u.id, u.status === "ACTIVE" ? "BLOCKED" : "ACTIVE"));

  const handleDelete = (u: PanelUser) => {
    if (!window.confirm(`${u.email} hesabını silmək istədiyinizə əminsiniz?`)) return;
    void act(u.id, () => deleteUser(tenantId, u.id));
  };

  const openRoleChange = (u: PanelUser) => {
    setRoleTarget(u);
    setRoleChoice(u.roleId);
  };

  const handleChangeRole = async (e: FormEvent) => {
    e.preventDefault();
    if (!roleTarget) return;
    await act(roleTarget.id, () => changeUserRole(tenantId, roleTarget.id, roleChoice));
    setRoleTarget(null);
  };

  if (error && !users) return <p className="text-sm text-err">{error}</p>;
  if (!users) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Komanda"
        subtitle="Bu müəssisəyə daxil ola bilən hesablar"
        actions={
          <Button onClick={openNew} icon={IconPlus} disabled={roles.length === 0}>
            Yeni işçi
          </Button>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert tone="err">{error}</Alert>
        </div>
      )}

      <Card>
        {users.length === 0 ? (
          <EmptyState message="Hələ heç bir işçi əlavə edilməyib." />
        ) : (
          <Table>
            <THead>
              <TH>Ad / e-poçt</TH>
              <TH>Rol</TH>
              <TH>Vəziyyət</TH>
              <TH>Son giriş</TH>
              <TH />
            </THead>
            <TBody>
              {users.map((u) => (
                <TR key={u.id}>
                  <TD>
                    <p className="font-medium text-fg">{u.fullName || u.email}</p>
                    {u.fullName && <p className="text-xs text-fg-faint">{u.email}</p>}
                  </TD>
                  <TD>
                    <button
                      onClick={() => openRoleChange(u)}
                      className="text-fg-muted underline decoration-dotted underline-offset-2 hover:text-fg"
                    >
                      {u.roleName ?? "—"}
                    </button>
                  </TD>
                  <TD>
                    <StatusText tone={u.status === "ACTIVE" ? "ok" : "err"}>
                      {u.status === "ACTIVE" ? "Aktiv" : "Bloklanıb"}
                    </StatusText>
                  </TD>
                  <TD>
                    <span className="text-fg-muted">
                      {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "—"}
                    </span>
                  </TD>
                  <TD className="text-right">
                    {busyId === u.id ? (
                      <span className="flex h-8 w-8 items-center justify-center">
                        <InlineSpinner />
                      </span>
                    ) : (
                      <DropdownMenu
                        trigger={
                          <span className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-fg-muted transition-colors hover:border-border-strong hover:text-fg">
                            <IconMore width={16} height={16} />
                          </span>
                        }
                        items={[
                          { label: "Redaktə et", icon: IconEdit, onSelect: () => openEdit(u) },
                          { label: "Şifrəni sıfırla", icon: IconKey, onSelect: () => handleResetPassword(u) },
                          {
                            label: u.status === "ACTIVE" ? "Blokla" : "Aktivləşdir",
                            icon: u.status === "ACTIVE" ? IconLock : IconCheck,
                            onSelect: () => handleToggleStatus(u),
                          },
                          {
                            label: "Sil",
                            icon: IconTrash,
                            danger: true,
                            onSelect: () => handleDelete(u),
                          },
                        ]}
                      />
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      {editing !== null && (
        <Modal title={editing === "new" ? "Yeni işçi" : "İşçini redaktə et"} onClose={() => setEditing(null)}>
          <form onSubmit={handleSave} className="space-y-4">
            {formError && <Alert tone="err">{formError}</Alert>}
            <Input
              label="Ad"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
            <Input
              label="E-poçt"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            {editing === "new" && (
              <Select
                label="Rol"
                required
                value={form.roleId}
                onChange={(e) => setForm({ ...form, roleId: e.target.value })}
                options={roles.map((r) => ({ value: r.id, label: r.name }))}
                help={roles.find((r) => r.id === form.roleId)?.description}
              />
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                Ləğv et
              </Button>
              <Button type="submit" loading={saving}>
                Yadda saxla
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {roleTarget && (
        <Modal title="Rolu dəyiş" onClose={() => setRoleTarget(null)} size="sm">
          <form onSubmit={handleChangeRole} className="space-y-4">
            <Select
              label="Yeni rol"
              value={roleChoice}
              onChange={(e) => setRoleChoice(e.target.value)}
              options={roles.map((r) => ({ value: r.id, label: r.name }))}
              help={roles.find((r) => r.id === roleChoice)?.description}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setRoleTarget(null)}>
                Ləğv et
              </Button>
              <Button type="submit" loading={busyId === roleTarget.id}>
                Dəyiş
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {credentials && (
        <Modal title="Hesab yaradıldı" onClose={() => setCredentials(null)} size="sm">
          <div className="space-y-3">
            <p className="text-sm text-fg-muted">
              {credentials.email} üçün şifrə yaradıldı
              {credentials.emailed ? " və e-poçtla göndərildi." : ", amma e-poçt göndərilmədi — bunu özünüz ötürün."}
              {" "}Bu, yalnız bir dəfə göstərilir.
            </p>
            <p className="rounded-md border border-border bg-surface-2 px-3 py-2 font-mono text-sm text-fg">
              {credentials.password}
            </p>
            <div className="flex justify-end pt-2">
              <Button onClick={() => setCredentials(null)}>Bağla</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
