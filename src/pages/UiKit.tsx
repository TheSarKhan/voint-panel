/**
 * Daxili istinad seyfesi (/ui) — butun UI kit komponentleri, variantlari ve hallari.
 * Sidebar-da gorunmur; yalniz birbasa link ile acilir.
 */
import {
  useState,
  type ComponentType,
  type ReactNode,
  type SVGProps,
} from "react";
import * as AllIcons from "../components/icons";
import { IconLogo, IconLogoSmall, Wordmark } from "../components/Logo";
import {
  IconCheck,
  IconCopy,
  IconDownload,
  IconEdit,
  IconMore,
  IconPhone,
  IconPlus,
  IconTrash,
  IconUser,
} from "../components/icons";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Checkbox,
  CheckboxGroup,
  DateInput,
  Divider,
  DropdownMenu,
  EmptyState,
  ErrorText,
  Field,
  FieldGroup,
  FileUpload,
  FormRow,
  HelpText,
  Input,
  Label,
  Modal,
  NumberInput,
  PageHeader,
  Pagination,
  Radio,
  RadioGroup,
  SearchInput,
  Select,
  Skeleton,
  SkeletonText,
  Spinner,
  StatCard,
  StatusText,
  Switch,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
  TableContainer,
  TableEmpty,
  Tabs,
  Textarea,
  TimeInput,
  Tooltip,
  btnDanger,
  btnGhost,
  btnPrimary,
  btnSecondary,
  inputCls,
} from "../components/ui";
import { colors } from "../theme/tokens";

const iconEntries = Object.entries(AllIcons) as Array<
  [string, ComponentType<SVGProps<SVGSVGElement>>]
>;

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-border pt-8">
      <h2 className="text-lg font-semibold tracking-tight text-fg">{title}</h2>
      {description && (
        <p className="mt-1 max-w-2xl text-sm text-fg-muted">{description}</p>
      )}
      <div className="mt-5 space-y-6">{children}</div>
    </section>
  );
}

function Block({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-medium text-fg">{title}</h3>
      {children}
    </div>
  );
}

export function UiKitPage() {
  const [tab, setTab] = useState("hamisi");
  const [page, setPage] = useState(3);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [switch1, setSwitch1] = useState(true);
  const [switch2, setSwitch2] = useState(false);
  const [checks, setChecks] = useState<string[]>(["az"]);
  const [radio, setRadio] = useState("gunduz");
  const [num, setNum] = useState<number | "">(3);
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState("Agent qiymət sorğularına necə cavab versin…");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  return (
    <div className="space-y-10 pb-16">
      <PageHeader
        title="UI Kit"
        subtitle="Voint dizayn sisteminin bütün komponentləri, variantları və halları. Daxili istinad səhifəsi."
      />

      {/* ---------------------------------------------------------- */}
      <Section
        title="Brend"
        description="Loqo — “i” hərfinin nöqtəsi yerinə üç səs qövsü. Yalnız monoxrom istifadə olunur."
      >
        <div className="flex flex-wrap items-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-accent-fg">
              <IconLogo width={24} height={24} />
            </span>
            <span className="text-xs text-fg-faint">IconLogo · 24px</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-accent-fg">
              <IconLogo width={17} height={17} />
            </span>
            <span className="text-xs text-fg-faint">Sidebar · 17px</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md border border-border">
              <IconLogoSmall width={16} height={16} />
            </span>
            <span className="text-xs text-fg-faint">IconLogoSmall · 16px</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Wordmark size="1.75rem" />
            <span className="text-xs text-fg-faint">Wordmark</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Wordmark size="1rem" className="text-fg-muted" />
            <span className="text-xs text-fg-faint">Wordmark · kiçik</span>
          </div>
        </div>
      </Section>

      {/* ---------------------------------------------------------- */}
      <Section
        title="Rənglər"
        description="Monoxrom palitra. Semantik rənglər yalnız vəziyyət üçündür — aksent ağa yaxın qalır."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {Object.entries(colors).map(([name, hex]) => (
            <div key={name} className="min-w-0">
              <div
                className="h-14 w-full rounded-md border border-border"
                style={{ background: hex }}
              />
              <p className="mt-1.5 truncate text-xs font-medium text-fg">
                {name}
              </p>
              <p className="text-xs text-fg-faint tabular-nums">{hex}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ---------------------------------------------------------- */}
      <Section title="Tipoqrafiya">
        <div className="space-y-3">
          <p className="text-xl font-semibold tracking-tight text-fg">
            Səhifə başlığı — 20px / semibold
          </p>
          <p className="text-base font-semibold text-fg">
            Bölmə başlığı — 16px / semibold
          </p>
          <p className="text-sm text-fg">Əsas mətn — 14px / normal</p>
          <p className="text-sm text-fg-muted">
            İkinci dərəcəli mətn — 14px / fg-muted
          </p>
          <p className="text-xs text-fg-faint">
            Köməkçi mətn — 12px / fg-faint
          </p>
          <p className="text-sm tabular-nums text-fg">
            Rəqəmlər: 0123456789 · 12 349 ₼ · 04:37
          </p>
        </div>
      </Section>

      {/* ---------------------------------------------------------- */}
      <Section
        title="Düymələr"
        description="Dörd variant, iki ölçü, yüklənmə və yalnız-ikon halları."
      >
        <Block title="Variantlar">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Yadda saxla</Button>
            <Button variant="secondary">İxrac et</Button>
            <Button variant="ghost">Ləğv et</Button>
            <Button variant="danger">Sil</Button>
          </div>
        </Block>

        <Block title="Ölçülər və ikonlar">
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" icon={IconPlus}>
              Kiçik
            </Button>
            <Button size="md" icon={IconPlus}>
              Orta
            </Button>
            <Button size="sm" variant="ghost" icon={IconDownload}>
              Yüklə
            </Button>
            <Button variant="danger" icon={IconTrash}>
              Sil
            </Button>
          </div>
        </Block>

        <Block title="Hallar">
          <div className="flex flex-wrap items-center gap-3">
            <Button loading>Saxlanılır</Button>
            <Button variant="secondary" loading>
              Yüklənir
            </Button>
            <Button disabled>Deaktiv</Button>
            <Button variant="ghost" disabled>
              Deaktiv
            </Button>
          </div>
        </Block>

        <Block title="Yalnız ikon">
          <div className="flex flex-wrap items-center gap-3">
            <Button iconOnly icon={IconEdit} aria-label="Redaktə et" />
            <Button
              iconOnly
              variant="secondary"
              icon={IconCopy}
              aria-label="Kopyala"
            />
            <Button
              iconOnly
              variant="ghost"
              icon={IconMore}
              aria-label="Daha çox"
            />
            <Button
              iconOnly
              variant="danger"
              icon={IconTrash}
              aria-label="Sil"
            />
            <Button iconOnly size="sm" variant="ghost" icon={IconCheck} aria-label="Təsdiqlə" />
          </div>
        </Block>

        <Block title="Köhnə class sabitləri (mövcud səhifələr üçün)">
          <div className="flex flex-wrap items-center gap-3">
            <button className={btnPrimary}>btnPrimary</button>
            <button className={btnSecondary}>btnSecondary</button>
            <button className={btnGhost}>btnGhost</button>
            <button className={btnDanger}>btnDanger</button>
          </div>
        </Block>
      </Section>

      {/* ---------------------------------------------------------- */}
      <Section
        title="Vəziyyət və bildirişlər"
        description="Vəziyyət heç bir çərçivə, fon və ya etiket qutusunda göstərilmir — yalnız sadə rəngli mətn. Yanıb-sönən göstərici yoxdur."
      >
        <Block title="Vəziyyət mətni">
          <div className="flex flex-wrap items-center gap-6">
            <StatusText tone="ok">Həll olundu</StatusText>
            <StatusText tone="warn">Operatora ötürüldü</StatusText>
            <StatusText tone="err">Rədd edildi</StatusText>
            <StatusText>Davam edir</StatusText>
          </div>
          <div className="mt-4 rounded-md border border-border bg-surface">
            <TableContainer>
              <Table>
                <THead>
                  <TH>Nömrə</TH>
                  <TH>Müddət</TH>
                  <TH>Status</TH>
                </THead>
                <TBody>
                  <TR>
                    <TD className="text-fg">+994 50 123 45 67</TD>
                    <TD className="text-fg-muted">02:14</TD>
                    <TD>
                      <StatusText tone="ok">Həll olundu</StatusText>
                    </TD>
                  </TR>
                  <TR>
                    <TD className="text-fg">+994 55 987 65 43</TD>
                    <TD className="text-fg-muted">00:48</TD>
                    <TD>
                      <StatusText tone="warn">Operatora ötürüldü</StatusText>
                    </TD>
                  </TR>
                </TBody>
              </Table>
            </TableContainer>
          </div>
        </Block>

        <Block title="Alert / Callout">
          <div className="space-y-3">
            <Alert tone="info" title="Məlumat">
              Agent yeni RAG sənədlərini 5 dəqiqə ərzində mənimsəyir.
            </Alert>
            <Alert tone="ok" title="Uğurlu">
              Ayarlar yadda saxlanıldı.
            </Alert>
            <Alert tone="warn" title="Diqqət">
              İş saatları təyin edilməyib — agent bütün gün cavab verəcək.
            </Alert>
            <Alert tone="err" title="Xəta" onDismiss={() => undefined}>
              Zənglər yüklənə bilmədi. Bağlantını yoxlayın.
            </Alert>
            <Alert tone="info">Başlıqsız qısa bildiriş.</Alert>
          </div>
        </Block>
      </Section>

      {/* ---------------------------------------------------------- */}
      <Section
        title="Form elementləri"
        description="Hamısı etiket, mecburi nişanı, köməkçi mətn, xəta və deaktiv halını dəstəkləyir. Klaviatura fokusu görünəndir."
      >
        <Block title="Mətn sahələri">
          <FormRow>
            <Input label="Biznes adı" placeholder="Məs.: CES Rental" required />
            <Input
              label="Telefon"
              type="tel"
              icon={IconPhone}
              placeholder="+994 12 345 67 89"
            />
            <Input
              label="E-poçt"
              type="email"
              defaultValue="admin@ces.az"
              help="Bildirişlər bu ünvana göndərilir."
            />
            <Input
              label="Şifrə"
              type="password"
              revealable
              defaultValue="voint123"
            />
            <Input
              label="Vergi nömrəsi"
              defaultValue="12345"
              error="Vergi nömrəsi 10 rəqəmdən ibarət olmalıdır."
            />
            <Input label="Abunə kodu" defaultValue="VOINT-PRO" disabled />
          </FormRow>
        </Block>

        <Block title="Axtarış">
          <div className="max-w-sm">
            <SearchInput
              value={search}
              onChange={setSearch}
              label="Müştəri axtar"
              placeholder="Ad və ya nömrə…"
            />
          </div>
        </Block>

        <Block title="Çoxsətirli mətn">
          <div className="max-w-xl">
            <Textarea
              label="Agent təlimatı"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              showCount
              help="Agent bu təlimata əsasən danışır."
            />
          </div>
        </Block>

        <Block title="Seçim">
          <FormRow>
            <Select
              label="Dil"
              defaultValue="az"
              options={[
                { value: "az", label: "Azərbaycan dili" },
                { value: "ru", label: "Rus dili" },
                { value: "en", label: "İngilis dili" },
              ]}
            />
            <Select
              label="Zaman qurşağı"
              placeholder="Seçin…"
              defaultValue=""
              options={[
                { value: "baku", label: "Asia/Baku (UTC+4)" },
                { value: "istanbul", label: "Europe/Istanbul (UTC+3)" },
              ]}
              help="Rezervasiyalar bu qurşağa görə hesablanır."
            />
            <Select
              label="Plan"
              defaultValue="pro"
              options={[{ value: "pro", label: "Pro" }]}
              disabled
            />
            <Select
              label="Operator"
              defaultValue="yoxdur"
              options={[{ value: "yoxdur", label: "Təyin edilməyib" }]}
              error="Ötürmə üçün operator seçilməlidir."
            />
          </FormRow>
        </Block>

        <Block title="Seçim qutuları və radio">
          <div className="grid gap-8 sm:grid-cols-3">
            <CheckboxGroup
              legend="Dəstəklənən dillər"
              value={checks}
              onChange={setChecks}
              options={[
                { value: "az", label: "Azərbaycan dili" },
                { value: "ru", label: "Rus dili" },
                { value: "en", label: "İngilis dili" },
                { value: "tr", label: "Türk dili", disabled: true },
              ]}
              help="Ən azı bir dil seçilməlidir."
            />
            <RadioGroup
              legend="İş rejimi"
              name="rejim"
              value={radio}
              onChange={setRadio}
              options={[
                {
                  value: "gunduz",
                  label: "Yalnız iş saatları",
                  description: "09:00 – 18:00 arası cavab verir",
                },
                {
                  value: "hemise",
                  label: "24/7",
                  description: "Hər zaman cavab verir",
                },
                { value: "elave", label: "Xüsusi cədvəl", disabled: true },
              ]}
            />
            <div className="space-y-4">
              <Switch
                checked={switch1}
                onChange={setSwitch1}
                label="Operatora ötürmə"
                description="Agent cavab tapmayanda zəngi ötürsün"
              />
              <Switch
                checked={switch2}
                onChange={setSwitch2}
                label="Zəng qeydiyyatı"
                description="Səs yazıları saxlanılsın"
              />
              <Switch
                checked={false}
                onChange={() => undefined}
                label="SMS bildirişləri"
                description="Bu planda mövcud deyil"
                disabled
              />
              <Checkbox
                label="Şərtləri qəbul edirəm"
                description="Xidmət şərtləri və məxfilik siyasəti"
                defaultChecked
              />
              <Radio name="tekradio" label="Tək radio" defaultChecked />
            </div>
          </div>
        </Block>

        <Block title="Tarix, saat və rəqəm">
          <FormRow columns={3}>
            <DateInput label="Başlanğıc tarixi" defaultValue="2026-07-01" />
            <TimeInput label="Açılış saatı" defaultValue="09:00" />
            <NumberInput
              label="Maksimum zəng müddəti (dəq)"
              value={num}
              onChange={setNum}
              min={1}
              max={30}
              help="1–30 dəqiqə arası."
            />
          </FormRow>
        </Block>

        <Block title="Fayl yükləmə">
          <div className="max-w-xl">
            <FileUpload
              label="RAG sənədləri"
              files={files}
              onChange={setFiles}
              accept=".pdf,.txt,.docx"
              maxSizeMb={10}
              help="Qiymət siyahısı, xidmətlər, FAQ — agent bu sənədlərdən oxuyur."
            />
          </div>
        </Block>

        <Block title="Sahə köməkçiləri">
          <div className="max-w-xl space-y-4">
            <FieldGroup
              legend="Əlaqə məlumatları"
              description="Müştərilərə göstərilən açıq məlumatlar."
            >
              <Field label="Köhnə Field API" required help="Mövcud səhifələr bu formanı istifadə edir.">
                <input className={inputCls} placeholder="inputCls ilə" />
              </Field>
            </FieldGroup>
            <div>
              <Label required>Ayrıca Label</Label>
              <input className={inputCls} placeholder="Sərbəst input" />
              <HelpText>Bu, HelpText komponentidir.</HelpText>
            </div>
            <div>
              <Label>Xəta nümunəsi</Label>
              <input className={`${inputCls} border-err/60`} defaultValue="—" />
              <ErrorText>Bu, ErrorText komponentidir.</ErrorText>
            </div>
          </div>
        </Block>
      </Section>

      {/* ---------------------------------------------------------- */}
      <Section title="Məlumat göstərmə">
        <Block title="Statistika kartları">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Ümumi zəng" value="1 284" hint="Son 30 gün" />
            <StatCard label="Həll olunma" value="87%" hint="+4% keçən aya nisbətən" />
            <StatCard label="Orta müddət" value="02:41" />
            <StatCard label="Rezervasiya" value="63" hint="19-u gözləyir" />
          </div>
        </Block>

        <Block title="Kart">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="Agent ayarları"
                description="Səsli agentin davranışı"
                actions={
                  <Button size="sm" variant="ghost" icon={IconEdit}>
                    Redaktə
                  </Button>
                }
              />
              <CardBody>
                <p className="text-sm text-fg-muted">
                  Kart başlıq, məzmun və altlıq hissələrindən ibarətdir.
                </p>
              </CardBody>
              <CardFooter>
                <Button size="sm" variant="ghost">
                  Ləğv et
                </Button>
                <Button size="sm">Yadda saxla</Button>
              </CardFooter>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-fg">Sadə kart (yalnız p-5).</p>
              <Divider className="my-4" />
              <p className="text-sm text-fg-muted">Divider ilə ayrılmış bölmə.</p>
            </Card>
          </div>
        </Block>

        <Block title="Cədvəl">
          <Card>
            <TableContainer>
              <Table>
                <THead>
                  <TH>Müştəri</TH>
                  <TH>Nömrə</TH>
                  <TH
                    sortable
                    sortDir={sortDir}
                    onSort={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
                  >
                    Tarix
                  </TH>
                  <TH>Status</TH>
                  <TH className="text-right">Əməliyyat</TH>
                </THead>
                <TBody>
                  {[
                    { n: "Elçin Məmmədov", p: "+994 50 111 22 33", t: "27 iyul, 14:20", s: "ok" as const, l: "Həll olundu" },
                    { n: "Aysel Quliyeva", p: "+994 55 444 55 66", t: "27 iyul, 11:05", s: "warn" as const, l: "Ötürüldü" },
                    { n: "Rəşad Əliyev", p: "+994 70 777 88 99", t: "26 iyul, 18:42", s: "err" as const, l: "Cavabsız" },
                  ].map((r) => (
                    <TR key={r.p}>
                      <TD className="font-medium text-fg">{r.n}</TD>
                      <TD className="text-fg-muted">{r.p}</TD>
                      <TD className="text-fg-muted">{r.t}</TD>
                      <TD>
                        <StatusText tone={r.s}>{r.l}</StatusText>
                      </TD>
                      <TD className="text-right">
                        <DropdownMenu
                          align="right"
                          trigger={
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-fg-muted">
                              <IconMore width={15} height={15} />
                            </span>
                          }
                          items={[
                            { label: "Bax", icon: IconUser, onSelect: () => undefined },
                            { label: "Kopyala", icon: IconCopy, onSelect: () => undefined },
                            { label: "Sil", icon: IconTrash, danger: true, onSelect: () => undefined },
                          ]}
                        />
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </TableContainer>
            <Pagination
              page={page}
              pageCount={12}
              onChange={setPage}
              totalLabel="248 nəticədən 21–30"
            />
          </Card>
        </Block>

        <Block title="Boş cədvəl">
          <Card>
            <TableContainer>
              <Table>
                <THead>
                  <TH>Müştəri</TH>
                  <TH>Nömrə</TH>
                  <TH>Status</TH>
                </THead>
                <TBody>
                  <TableEmpty colSpan={3} message="Hələ zəng qeydə alınmayıb." />
                </TBody>
              </Table>
            </TableContainer>
          </Card>
        </Block>

        <Block title="Boş hal, yüklənmə və skelet">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <EmptyState
                icon={AllIcons.IconDatabase}
                title="Məlumat yoxdur"
                message="Agentin düzgün cavab verməsi üçün biznes məlumatlarınızı əlavə edin."
                action={
                  <Button size="sm" icon={IconPlus}>
                    Yeni sənəd
                  </Button>
                }
              />
            </Card>
            <Card>
              <Spinner />
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton height={10} className="w-1/2" />
                  <Skeleton height={10} className="w-1/3" />
                </div>
              </div>
              <SkeletonText lines={3} className="mt-4" />
            </Card>
          </div>
        </Block>
      </Section>

      {/* ---------------------------------------------------------- */}
      <Section title="Naviqasiya və üst qatlar">
        <Block title="Tablar">
          <Tabs
            items={[
              { value: "hamisi", label: "Hamısı", count: 248 },
              { value: "hell", label: "Həll olunmuş", count: 214 },
              { value: "oturulmus", label: "Ötürülmüş", count: 27 },
              { value: "cavabsiz", label: "Cavabsız", count: 7 },
            ]}
            value={tab}
            onChange={setTab}
          />
          <p className="mt-3 text-sm text-fg-muted">
            Seçilmiş tab: <span className="text-fg">{tab}</span>
          </p>
        </Block>

        <Block title="Tooltip və menyu">
          <div className="flex flex-wrap items-center gap-6">
            <Tooltip label="Zəngi operatora ötür">
              <Button variant="ghost" icon={IconPhone}>
                Ötür
              </Button>
            </Tooltip>
            <Tooltip label="Aşağıda görünür" side="bottom">
              <span className="text-sm text-fg-muted underline decoration-dotted underline-offset-4">
                Üzərinə gətirin
              </span>
            </Tooltip>
            <DropdownMenu
              trigger={
                <span className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm text-fg-muted">
                  Əməliyyatlar
                  <AllIcons.IconChevronDown width={14} height={14} />
                </span>
              }
              items={[
                { label: "İxrac et", icon: IconDownload, onSelect: () => undefined },
                { label: "Redaktə et", icon: IconEdit, onSelect: () => undefined },
                { label: "Arxivləşdir", disabled: true, onSelect: () => undefined },
                { label: "Sil", icon: IconTrash, danger: true, onSelect: () => undefined },
              ]}
            />
          </div>
        </Block>

        <Block title="Modal">
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            Modalı aç
          </Button>
          {modalOpen && (
            <Modal
              title="Yeni sənəd"
              onClose={() => setModalOpen(false)}
              footer={
                <>
                  <Button variant="ghost" onClick={() => setModalOpen(false)}>
                    Ləğv et
                  </Button>
                  <Button onClick={() => setModalOpen(false)}>Əlavə et</Button>
                </>
              }
            >
              <div className="space-y-4">
                <Input label="Kateqoriya" placeholder="qiymətlər" required />
                <Textarea
                  label="Məzmun"
                  rows={5}
                  placeholder="Agentin biləcəyi məlumatı bura yazın…"
                />
                <p className="text-xs text-fg-faint">
                  Escape düyməsi bağlayır, fokus modal daxilində qalır.
                </p>
              </div>
            </Modal>
          )}
        </Block>
      </Section>

      {/* ---------------------------------------------------------- */}
      <Section
        title="İkonlar"
        description={`${iconEntries.length} ikon — 24×24 şəbəkə, 1.7 xətt qalınlığı, yalnız kontur.`}
      >
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {iconEntries.map(([name, Icon]) => (
            <div
              key={name}
              className="flex flex-col items-center gap-2 rounded-md border border-border bg-surface px-2 py-3"
            >
              <Icon width={20} height={20} className="text-fg" />
              <span className="w-full truncate text-center text-[10px] text-fg-faint">
                {name.replace("Icon", "")}
              </span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
