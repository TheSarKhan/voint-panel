import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Megaphone,
  Plus,
  Play,
  Pause,
  Upload,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  FileSpreadsheet,
  PhoneOutgoing,
} from "lucide-react";
import {
  listCampaigns,
  createCampaign,
  deleteCampaign,
  startCampaign,
  pauseCampaign,
  importContactsFile,
  type Campaign,
  type CampaignType,
  type CampaignInput,
} from "../api/campaigns";
import { useTenantId } from "../lib/useTenantId";
import { apiErrorText } from "../lib/apiError";
import { formatDate } from "../lib/format";
import {
  GlassButton,
  GlassCard,
  GlassInput,
  GlassTextarea,
  GlassModal,
} from "../components/kit";
import { Spinner } from "../components/ui";

const CAMPAIGN_PRESETS: Record<CampaignType, { label: string; prompt: string; greeting: string }> = {
  SALES_OUTBOUND: {
    label: "📞 Satış və Xüsusi Təklif",
    greeting: "Salam! Sizə şirkətimizdən zəng edirik. Yeni məhsullarımız və cari endirimlərimiz haqqında məlumat vermək istərdik.",
    prompt: "Müştəri ilə nəzakətlə salamlaş. Kampaniya çərçivəsində mövcud endirim və yeni təkliflərimiz haqqında qısa məlumat ver. Maraqlanıb-maraqlanmadığını soruş. Əgər maraqlanarsa təfərrüatları qeyd et və menecerin əlaqə saxlayacağını bildir.",
  },
  APPOINTMENT_REMINDER: {
    label: "⏰ Görüş və Rezervasiya Xatırlatması",
    greeting: "Salam! Sabahkı qəbulunuz/rezervasiyanız ilə bağlı xatırlatma üçün zəng edirik.",
    prompt: "Müştəriyə sabah saat neçədə qəbulunun/görüşünün olduğunu xatırlat. Gələ biləcəyini təsdiqləyib-təsdiqləmədiyini soruş. Əgər vaxtı dəyişmək istəsə uyğun vaxtı öyrən və qeyd et.",
  },
  PAYMENT_REMINDER: {
    label: "💳 Ödəniş və Borc Xatırlatması",
    greeting: "Salam! Xidmət və ya icarə haqqı ödənişi ilə bağlı xatırlatma üçün əlaqə saxlayırıq.",
    prompt: "Müştəriyə cari müddət üzrə ödəniş haqqını nəzakətlə xatırlat. Ödənişin nə vaxt ediləcəyini öyrən və qeyd et. Kobudluq etmə, tam nəzakətli və işgüzar dildə danış.",
  },
  FEEDBACK_SURVEY: {
    label: "⭐ Xidmət Keyfiyyəti və Rəy Sorğusu",
    greeting: "Salam! Son aldığınız xidmət və ya məhsulumuz haqqında fikirlərinizi öyrənmək üçün zəng edirik.",
    prompt: "Müştəridən son xidmətdən nə dərəcədə razı qaldığını (1-dən 5-ə qədər bal ilə) soruş. Təklif və ya narazılığı varsa qeyd et və təşəkkür edərək sağollaş.",
  },
  WINBACK: {
    label: "🔄 Müştəri Qaytarma (Reaktivasiya)",
    greeting: "Salam! Uzun müddətdir sizi görmürük, xüsusi olaraq sizin üçün hədiyyə endirimimiz var!",
    prompt: "Köhnə müştəriyə ona xüsusi 20% geri dönüş endirimi təqdim et. Nə vaxt yaxınlaşa biləcəyini və ya xidmət sifariş etmək istədiyini soruş.",
  },
};

export function CampaignsPage() {
  const tenantId = useTenantId();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Create Campaign Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formType, setFormType] = useState<CampaignType>("SALES_OUTBOUND");
  const [formName, setFormName] = useState("");
  const [formPrompt, setFormPrompt] = useState(CAMPAIGN_PRESETS.SALES_OUTBOUND.prompt);
  const [formGreeting, setFormGreeting] = useState(CAMPAIGN_PRESETS.SALES_OUTBOUND.greeting);
  const [formStartHours, setFormStartHours] = useState("10:00");
  const [formEndHours, setFormEndHours] = useState("18:00");
  const [formRetries, setFormRetries] = useState(2);
  const [creating, setCreating] = useState(false);

  // Upload Contacts Modal
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [uploading, setUploading] = useState(false);

  const loadData = async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listCampaigns(tenantId);
      setCampaigns(data);
    } catch (err) {
      setError(apiErrorText(err, "Kampaniyalar yüklənərkən xəta baş verdi"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [tenantId]);

  // When formType changes in wizard, update prompt and greeting presets
  const handleTypeChange = (type: CampaignType) => {
    setFormType(type);
    setFormPrompt(CAMPAIGN_PRESETS[type].prompt);
    setFormGreeting(CAMPAIGN_PRESETS[type].greeting);
  };

  // Create Campaign
  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!tenantId || !formName.trim()) return;

    setCreating(true);
    setError(null);
    try {
      const payload: CampaignInput = {
        name: formName.trim(),
        campaignType: formType,
        agentPrompt: formPrompt,
        greetingText: formGreeting,
        callingHoursStart: formStartHours,
        callingHoursEnd: formEndHours,
        maxRetries: formRetries,
        concurrencyLimit: 2,
      };

      const created = await createCampaign(tenantId, payload);
      setCampaigns([created, ...campaigns]);
      setCreateModalOpen(false);
      setFormName("");
      setSuccess(`"${created.name}" kampaniyası uğurla yaradıldı. İndi Excel/CSV ilə nömrələri yükləyə bilərsiniz.`);
    } catch (err) {
      setError(apiErrorText(err, "Kampaniya yaradılarkən xəta baş verdi"));
    } finally {
      setCreating(false);
    }
  };

  // Start Campaign
  const handleStart = async (c: Campaign) => {
    if (!tenantId) return;
    try {
      const updated = await startCampaign(tenantId, c.id);
      setCampaigns((prev) => prev.map((x) => (x.id === c.id ? updated : x)));
      setSuccess(`"${c.name}" kampaniyası işə salındı! Zənglər çıxarılır.`);
    } catch (err) {
      setError(apiErrorText(err, "Kampaniyanı başlatmaq mümkün olmadı"));
    }
  };

  // Pause Campaign
  const handlePause = async (c: Campaign) => {
    if (!tenantId) return;
    try {
      const updated = await pauseCampaign(tenantId, c.id);
      setCampaigns((prev) => prev.map((x) => (x.id === c.id ? updated : x)));
    } catch (err) {
      setError(apiErrorText(err, "Kampaniyanı dayandırmaq mümkün olmadı"));
    }
  };

  // Delete Campaign
  const handleDelete = async (c: Campaign) => {
    if (!tenantId) return;
    if (!confirm(`"${c.name}" kampaniyasını silmək istədiyinizdən əminsiniz?`)) return;

    try {
      await deleteCampaign(tenantId, c.id);
      setCampaigns((prev) => prev.filter((x) => x.id !== c.id));
    } catch (err) {
      setError(apiErrorText(err, "Kampaniya silinərkən xəta baş verdi"));
    }
  };

  // Import Contacts
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tenantId || !selectedCampaign) return;

    setUploading(true);
    setError(null);
    try {
      const contacts = await importContactsFile(tenantId, selectedCampaign.id, file);
      setSuccess(`"${file.name}" faylından ${contacts.length} nömrə kampaniyaya yükləndi!`);
      setUploadModalOpen(false);
      await loadData();
    } catch (err) {
      setError(apiErrorText(err, "Nömrələr yüklənərkən xəta baş verdi"));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    if (statusFilter === "ALL") return campaigns;
    return campaigns.filter((c) => c.status === statusFilter);
  }, [campaigns, statusFilter]);

  // Overall Stats
  const stats = useMemo(() => {
    const total = campaigns.length;
    const active = campaigns.filter((c) => c.status === "RUNNING").length;
    const totalContacts = campaigns.reduce((acc, c) => acc + c.totalContacts, 0);
    const successfulCalls = campaigns.reduce((acc, c) => acc + c.successfulCount, 0);
    const conversionRate = totalContacts > 0 ? Math.round((successfulCalls / totalContacts) * 100) : 0;

    return { total, active, totalContacts, successfulCalls, conversionRate };
  }, [campaigns]);

  return (
    <div className="space-y-6 pb-12">
      {/* ── HEADER ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0a0a0a] text-[#39ff14]">
              <PhoneOutgoing className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0a0a0a]">
                Çıxan Zənglər (Outbound Kampaniyalar)
              </h1>
              <p className="text-xs sm:text-sm text-[#6b6b6b]">
                Kütləvi zənglər, AI satış təklifləri, borc/görüş xatırlatmaları və rəy sorğuları
              </p>
            </div>
          </div>
        </div>

        <GlassButton onClick={() => setCreateModalOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          <span>Yeni Kampaniya Yarat</span>
        </GlassButton>
      </div>

      {/* ── ALERTS ── */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs sm:text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs sm:text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <GlassCard className="p-4">
          <span className="text-xs font-medium text-[#6b6b6b]">Aktiv Kampaniyalar</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">{stats.active}</span>
            <span className="text-xs text-[#6b6b6b]">/ {stats.total} ümumi</span>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <span className="text-xs font-medium text-[#6b6b6b]">Yüklənmiş Nömrələr</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#0a0a0a]">{stats.totalContacts}</span>
            <span className="text-xs text-[#6b6b6b]">əlaqə</span>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <span className="text-xs font-medium text-[#6b6b6b]">Uğurlu Cavab / Nəticə</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-600">{stats.successfulCalls}</span>
            <span className="text-xs text-[#6b6b6b]">zəng</span>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <span className="text-xs font-medium text-[#6b6b6b]">Orta Uğur / Konversiya</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#0a0a0a]">{stats.conversionRate}%</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
        </GlassCard>
      </div>

      {/* ── FILTER TABS ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: "ALL", label: "Bütün Kampaniyalar" },
          { id: "RUNNING", label: "🟢 Aktiv (Zəng gedir)" },
          { id: "DRAFT", label: "📝 Qaralama" },
          { id: "PAUSED", label: "⏸️ Dayandırılmış" },
          { id: "COMPLETED", label: "✅ Tamamlanmış" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all ${
              statusFilter === tab.id
                ? "bg-[#0a0a0a] text-white shadow-sm"
                : "border border-[#e5e5e5] bg-white text-[#6b6b6b] hover:bg-[#f5f5f5]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── CAMPAIGNS LIST ── */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Spinner />
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <Megaphone className="mx-auto h-10 w-10 text-[#9e9e9e]" />
            <h3 className="mt-3 text-sm font-semibold text-[#0a0a0a]">Kampaniya tapılmadı</h3>
            <p className="mt-1 text-xs text-[#6b6b6b] max-w-sm mx-auto">
              Müştərilərinizə kütləvi və ya fərdi səsli zənglər çıxarmaq üçün ilk kampaniyanızı yaradın.
            </p>
            <GlassButton onClick={() => setCreateModalOpen(true)} className="mt-4 gap-1.5">
              <Plus className="h-4 w-4" />
              <span>Yeni Kampaniya Yarat</span>
            </GlassButton>
          </GlassCard>
        ) : (
          filteredCampaigns.map((c) => {
            const progress = c.totalContacts > 0 ? Math.round((c.contactedCount / c.totalContacts) * 100) : 0;

            return (
              <GlassCard key={c.id} className="p-5 hover:border-black/30 transition-all">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  {/* Left: Info */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base font-bold text-[#0a0a0a]">{c.name}</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          c.status === "RUNNING"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : c.status === "PAUSED"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : c.status === "COMPLETED"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {c.status === "RUNNING" && "🟢 Zənglər Gedir"}
                        {c.status === "PAUSED" && "⏸️ Dayandırılıb"}
                        {c.status === "COMPLETED" && "✅ Tamamlandı"}
                        {c.status === "DRAFT" && "📝 Qaralama"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#6b6b6b]">
                      <span className="font-medium text-[#404040]">
                        {CAMPAIGN_PRESETS[c.campaignType]?.label || c.campaignType}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {c.callingHoursStart} - {c.callingHoursEnd}
                      </span>
                      <span>•</span>
                      <span>Yaradılıb: {formatDate(c.createdAt)}</span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Upload Contacts */}
                    <button
                      onClick={() => {
                        setSelectedCampaign(c);
                        setUploadModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#e5e5e5] bg-white px-3 py-1.5 text-xs font-medium text-[#0a0a0a] hover:bg-[#f5f5f5] transition-all shadow-sm"
                    >
                      <Upload className="h-3.5 w-3.5 text-[#6b6b6b]" />
                      <span>Nömrələr Yüklə ({c.totalContacts})</span>
                    </button>

                    {/* Start / Pause */}
                    {c.status === "RUNNING" ? (
                      <button
                        onClick={() => handlePause(c)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition-all shadow-sm"
                      >
                        <Pause className="h-3.5 w-3.5" />
                        <span>Dayandır</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStart(c)}
                        disabled={c.totalContacts === 0}
                        className={`inline-flex items-center gap-1.5 rounded-xl bg-[#0a0a0a] px-3.5 py-1.5 text-xs font-semibold text-[#39ff14] hover:bg-black/90 transition-all shadow-sm ${
                          c.totalContacts === 0 ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>Kampaniyanı Başlat</span>
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(c)}
                      className="rounded-xl p-2 text-[#9e9e9e] hover:bg-red-50 hover:text-red-600 transition-all"
                      title="Kampaniyanı sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar & Dialing Stats */}
                <div className="mt-4 pt-3 border-t border-[#f0f0f0]">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-[#404040]">
                      İcra vəziyyəti: {c.contactedCount} / {c.totalContacts} nömrə ({progress}%)
                    </span>
                    <span className="text-[#6b6b6b]">
                      Uğurlu: <b className="text-emerald-600">{c.successfulCount}</b> | Cavabsız/Məşğul: <b className="text-amber-600">{c.failedCount}</b>
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#f0f0f0]">
                    <div
                      className="h-full rounded-full bg-[#0a0a0a] transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </GlassCard>
            );
          })
        )}
      </div>

      {/* ── CREATE CAMPAIGN WIZARD MODAL ── */}
      <GlassModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Yeni Çıxan Zəng Kampaniyası Yarat"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#0a0a0a]">Kampaniyanın Adı *</label>
            <GlassInput
              required
              placeholder="Məs: Yaz Endirimləri və Yeni Xidmətlər"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#0a0a0a]">Kampaniyanın Növü və Məqsədi *</label>
            <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(CAMPAIGN_PRESETS) as CampaignType[]).map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => handleTypeChange(type)}
                  className={`rounded-xl border p-2.5 text-left text-xs transition-all ${
                    formType === type
                      ? "border-black bg-[#0a0a0a] text-white shadow-sm"
                      : "border-[#e5e5e5] bg-white text-[#404040] hover:bg-[#f5f5f5]"
                  }`}
                >
                  <div className="font-semibold">{CAMPAIGN_PRESETS[type].label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#0a0a0a]">AI Salamlama Mətni (Açılış Cümləsi)</label>
            <GlassTextarea
              rows={2}
              value={formGreeting}
              onChange={(e) => setFormGreeting(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#0a0a0a]">AI Agentin Davranış və Satış Təlimatı (Prompt)</label>
            <GlassTextarea
              rows={3}
              value={formPrompt}
              onChange={(e) => setFormPrompt(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="text-xs font-semibold text-[#0a0a0a]">Zəng Başlama</label>
              <GlassInput
                type="time"
                value={formStartHours}
                onChange={(e) => setFormStartHours(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#0a0a0a]">Zəng Bitmə</label>
              <GlassInput
                type="time"
                value={formEndHours}
                onChange={(e) => setFormEndHours(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#0a0a0a]">Təkrar Yığma</label>
              <GlassInput
                type="number"
                min={0}
                max={5}
                value={formRetries}
                onChange={(e) => setFormRetries(parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-[#e5e5e5]">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="rounded-xl border border-[#e5e5e5] bg-white px-4 py-2 text-xs sm:text-sm font-medium text-[#6b6b6b] hover:bg-[#f5f5f5]"
            >
              Ləğv et
            </button>
            <GlassButton type="submit" disabled={creating}>
              <span>{creating ? "Yaradılır..." : "Kampaniyanı Yarat"}</span>
            </GlassButton>
          </div>
        </form>
      </GlassModal>

      {/* ── UPLOAD CONTACTS MODAL ── */}
      <GlassModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title={`Nömrələr Yüklə — ${selectedCampaign?.name}`}
      >
        <div className="space-y-4">
          <div className="rounded-xl border-2 border-dashed border-[#d0d0d0] p-6 text-center hover:border-black transition-all">
            <FileSpreadsheet className="mx-auto h-10 w-10 text-[#6b6b6b]" />
            <p className="mt-2 text-xs sm:text-sm font-semibold text-[#0a0a0a]">
              Excel (.xlsx, .xls) və ya CSV (.csv) faylı seçin
            </p>
            <p className="mt-1 text-xs text-[#888]">
              Cədvəl sütunları: <b>Telefon nömrəsi</b>, <b>Müştəri Adı</b> (istəyə bağlı), <b>Fərdi qeyd</b> (istəyə bağlı).
            </p>

            <label className="mt-4 inline-block cursor-pointer">
              <input
                type="file"
                accept=".xlsx,.xls,.csv,.txt"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <div className="inline-flex items-center gap-2 rounded-xl bg-[#0a0a0a] px-4 py-2 text-xs font-semibold text-white hover:bg-black/90 transition-all shadow-sm">
                {uploading ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Nömrələr oxunur...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5 text-[#39ff14]" />
                    <span>Faylı Yüklə</span>
                  </>
                )}
              </div>
            </label>
          </div>

          <div className="rounded-xl bg-[#fafafa] p-3 text-xs text-[#6b6b6b]">
            💡 <b>Nümunə Format:</b>
            <div className="mt-1 font-mono text-[11px] bg-white p-2 rounded border border-[#e5e5e5]">
              0501234567, Əli Məmmədov, Borc: 150 AZN<br />
              0559876543, Leyla Həsənova, Qəbul vaxtı: 14:30
            </div>
          </div>
        </div>
      </GlassModal>
    </div>
  );
}
