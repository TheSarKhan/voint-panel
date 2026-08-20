import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  TrendingUp,
  FileText,
  Sliders,
  Search,
  Plus,
  ArrowRight,
  RefreshCw,
  PhoneIncoming,
  LayoutGrid,
  Play,
  Pause,
  RotateCcw,
  Bot,
  User,
  Calculator,
  Download,
  Trash2,
  Volume2,
  Layers,
  Send,
} from "lucide-react";
import {
  GlassButton,
  GlassCard,
  StatCardGlass,
  AudioWaveformPlayer,
  TranscriptViewer,
  GlassInput,
  GlassSelect,
  GlassSwitch,
  GlassTextarea,
  GlassTabs,
  StatusText,
  GlassModal,
  GlassDrawer,
  GlassTableContainer,
  GlassTable,
  GlassTHead,
  GlassTH,
  GlassTBody,
  GlassTR,
  GlassTD,
  GlobalSilkCanvas,
  SpotlightCard,
  LiquidAudioOrb,
  RadialGauge,
  TactileSegmentedControl,
} from "../components/kit";

interface ScenarioCall {
  id: string;
  phone: string;
  callerName: string;
  time: string;
  durationSeconds: number;
  durationFormatted: string;
  intent: string;
  statusVariant: "ok" | "warn" | "err";
  statusLabel: string;
  transcript: { speaker: "customer" | "agent"; text: string; timeOffset: number; timeStr: string }[];
  summary: {
    result: string;
    customerType: string;
    actionNeeded: string;
  };
}

const SCENARIOS: ScenarioCall[] = [
  {
    id: "1",
    phone: "+994 50 214 88 12",
    callerName: "Rəşad Əliyev",
    time: "11:42",
    durationSeconds: 38,
    durationFormatted: "0:38",
    intent: "Rezervasiya təsdiqi",
    statusVariant: "ok",
    statusLabel: "Uğurlu",
    transcript: [
      {
        speaker: "customer",
        text: "Salam, sabah saat 19:00 üçün 4 nəfərlik masa rezerv etmək olar?",
        timeOffset: 0,
        timeStr: "11:42:04",
      },
      {
        speaker: "agent",
        text: "Salam! Bəli, sabah 19:00 üçün əsas zalda masamız mövcuddur. Adınızı və əlaqə nömrənizi qeyd edirəm.",
        timeOffset: 8,
        timeStr: "11:42:12",
      },
      {
        speaker: "customer",
        text: "Əla, Rəşad adına qeyd edin zəhmət olmasa.",
        timeOffset: 20,
        timeStr: "11:42:25",
      },
      {
        speaker: "agent",
        text: "Oldu, Rəşad bəy. Rezervasiya qeydə alındı və təsdiq SMS-i bu nömrənizə göndərildi. Təşəkkür edirik!",
        timeOffset: 30,
        timeStr: "11:42:38",
      },
    ],
    summary: {
      result: "Masa rezervasiyası təsdiqləndi",
      customerType: "Daimi müştəri (3-cü zəng)",
      actionNeeded: "Avtomatik SMS göndərildi",
    },
  },
  {
    id: "2",
    phone: "+994 55 412 00 33",
    callerName: "Leyla Məmmədova",
    time: "11:15",
    durationSeconds: 22,
    durationFormatted: "0:22",
    intent: "Qiymət və iş saatı",
    statusVariant: "ok",
    statusLabel: "Uğurlu",
    transcript: [
      {
        speaker: "customer",
        text: "Salam, bu gün neçəyə qədər işləyirsiniz və çatdırılma var?",
        timeOffset: 0,
        timeStr: "11:15:02",
      },
      {
        speaker: "agent",
        text: "Salam! Bu gün saat 23:00-a qədər xidmətinizdəyik. Bakı daxili çatdırılma 45 dəqiqə ərzində həyata keçirilir.",
        timeOffset: 6,
        timeStr: "11:15:08",
      },
      {
        speaker: "customer",
        text: "Çox sağ olun, təşəkkürlər.",
        timeOffset: 16,
        timeStr: "11:15:18",
      },
    ],
    summary: {
      result: "İş saatı və çatdırılma cavablandırıldı",
      customerType: "Yeni müştəri",
      actionNeeded: "Tələb olunmur",
    },
  },
  {
    id: "3",
    phone: "+994 70 890 11 22",
    callerName: "Kamran Qasımov",
    time: "10:30",
    durationSeconds: 30,
    durationFormatted: "0:30",
    intent: "Şikayət / Menecer tələbi",
    statusVariant: "warn",
    statusLabel: "İnsana yönləndirildi",
    transcript: [
      {
        speaker: "customer",
        text: "Salam, dünənki texnika icarəsi ilə bağlı menecerlə danışmaq istəyirəm, nasazlıq çıxdı.",
        timeOffset: 0,
        timeStr: "10:30:05",
      },
      {
        speaker: "agent",
        text: "Salam! Narahatlığınız üçün üzr istəyirik. Sizi dərhal texniki xidmət menecerinə yönləndirirəm, xətdə qalın zəhmət olmasa.",
        timeOffset: 10,
        timeStr: "10:30:15",
      },
    ],
    summary: {
      result: "Texniki menecerə yönləndirildi",
      customerType: "Korporativ icarəçi (CES)",
      actionNeeded: "Menecer cavab verdi (Transfer)",
    },
  },
];

export function UiKitPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  // Tactile Segmented Time Range state
  const [selectedRange, setSelectedRange] = useState<"today" | "week" | "month">("week");

  // Interactive Live Call Simulator state
  const [selectedCallIdx, setSelectedCallIdx] = useState(0);
  const currentScenario = SCENARIOS[selectedCallIdx];
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);

  // Dynamic Radial Gauges values
  const [resolutionRate] = useState(96.8);
  const [capacityUsage] = useState(74);

  // Interactive ROI Calculator state
  const [calcMinutes, setCalcMinutes] = useState(800);

  // Form states
  const [inputValue, setInputValue] = useState("CES Texnika MMC");
  const [passwordValue, setPasswordValue] = useState("adminpass2026");
  const [switch1, setSwitch1] = useState(true);
  const [switch2, setSwitch2] = useState(false);
  const [selectValue, setSelectValue] = useState("az");

  // Modal & Drawer states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerCall, setDrawerCall] = useState<any>(null);

  // Table search & sort
  const [tableSearch, setTableSearch] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Playback timer for live call simulator
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isPlaying) {
      timer = setInterval(() => {
        setPlaybackTime((prev) => {
          if (prev >= currentScenario.durationSeconds) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, currentScenario.durationSeconds]);

  const handleSelectScenario = (idx: number) => {
    setSelectedCallIdx(idx);
    setIsPlaying(false);
    setPlaybackTime(0);
  };

  const handleOpenDrawer = (call: any) => {
    setDrawerCall(call);
    setIsDrawerOpen(true);
  };

  const navTabs = [
    { id: "all", label: "Hamısına Baxış", icon: <LayoutGrid className="h-3.5 w-3.5" /> },
    { id: "3d", label: "3D Spotlight & Tərəzilər", icon: <Layers className="h-3.5 w-3.5" /> },
    { id: "stats", label: "Metrik Kartları", icon: <TrendingUp className="h-3.5 w-3.5" /> },
    { id: "audio", label: "Səs & Dialoq Alətləri", icon: <Volume2 className="h-3.5 w-3.5" /> },
    { id: "table", label: "Məlumat Cədvəli", icon: <FileText className="h-3.5 w-3.5" /> },
    { id: "calculator", label: "Qənaət Kalkulyatoru", icon: <Calculator className="h-3.5 w-3.5" /> },
    { id: "buttons", label: "Düymələr", icon: <Plus className="h-3.5 w-3.5" /> },
    { id: "forms", label: "Form Sahələri", icon: <Sliders className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="min-h-screen bg-white text-[#0a0a0a] selection:bg-[#39ff14] selection:text-black p-4 sm:p-8 md:p-12 font-sans relative overflow-hidden">
      {/* ── 3D THREE.JS WEBGL SILK CANVAS IN BACKGROUND (MOUSE TRACKING) ── */}
      <GlobalSilkCanvas />

      <div className="max-w-6xl mx-auto space-y-12 relative z-10">
        {/* ============================================================ */}
        {/* 1. HERO / SƏHİFƏ BAŞLIĞI                                     */}
        {/* ============================================================ */}
        <div className="border-b border-[#e5e5e5] pb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="hero-animate-1 m-0 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[#0a0a0a]">
                Müəssisə Paneli UI-Kit
              </h1>

              <p className="hero-animate-2 mt-3 text-base text-[#6b6b6b] leading-relaxed">
                Voint platformasının tam UI komponentlər sistemi: 3D Spotlight Kartları, Üzvi Maye Səs Kürəsi,
                Dairəvi Tərəzilər, Taktil Keçidlər, Məlumat Cədvəli, Stat Kartları, Audio Pleyer və Form Elementləri.
              </p>
            </div>

            <div className="hero-animate-3 flex flex-wrap items-center gap-3">
              <GlassButton
                variant="secondary"
                onClick={() => {
                  setIsLoadingDemo(true);
                  setTimeout(() => setIsLoadingDemo(false), 1000);
                }}
                isLoading={isLoadingDemo}
                leftIcon={<RefreshCw className="h-4 w-4" />}
              >
                Yenilə
              </GlassButton>

              <GlassButton
                variant="primary-cta"
                onClick={() => setIsModalOpen(true)}
              >
                Modalı Yoxla
              </GlassButton>
            </div>
          </div>

          {/* ── TACTILE SEGMENTED CONTROLS (TIME RANGE SWITCHER) ── */}
          <div className="hero-animate-4 mt-8 flex flex-wrap items-center justify-between gap-4">
            <TactileSegmentedControl
              options={[
                { value: "today", label: "Bu gün" },
                { value: "week", label: "Son 7 gün" },
                { value: "month", label: "Bu ay" },
              ]}
              value={selectedRange}
              onChange={(val) => setSelectedRange(val as any)}
              size="md"
            />

            <div className="text-xs text-[#6b6b6b] flex items-center gap-3">
              <span className="font-mono font-medium text-[#0a0a0a]">CES Texnika</span>
              <span className="h-3 w-px bg-[#e5e5e5]" />
              <span>Canlı status: <StatusText variant="ok">Aktiv Operator</StatusText></span>
            </div>
          </div>

          {/* Navigation Filter Tabs */}
          <div className="mt-6 flex items-center justify-start overflow-x-auto pb-1">
            <GlassTabs
              tabs={navTabs}
              activeTab={activeTab}
              onChange={setActiveTab}
            />
          </div>
        </div>

        {/* ============================================================ */}
        {/* UI RULES / QADAĞALAR XÜLASƏSİ                                 */}
        {/* ============================================================ */}
        <div className="p-6 rounded-3xl border border-[#e5e5e5] bg-[#fafafa]">
          <h3 className="text-sm font-semibold text-[#0a0a0a] tracking-tight">
            Voint UI Kit Qaydaları və Standartları
          </h3>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-white border border-[#e5e5e5]">
              <span className="font-semibold text-red-600 block mb-2">❌ Qadağandır</span>
              <ul className="space-y-1.5 text-[#6b6b6b]">
                <li>Nöqtə və ya bullet dot ilə ayırma (ayırıcı nöqtə)</li>
                <li>Status həbləri / badge çərçivələri</li>
                <li>Pulsasiya edən nöqtələr</li>
                <li>Neon purple / bənövşəyi rənglər</li>
                <li>AI-slop (parıltı emoji, süni çiplər)</li>
                <li>Eyebrow (lüzumsuz kiçik etiketlər)</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#e5e5e5]">
              <span className="font-semibold text-emerald-600 block mb-2">✅ Tələb Olunur</span>
              <ul className="space-y-1.5 text-[#6b6b6b]">
                <li>Status = Düz rəngli təmiz mətn</li>
                <li>100% Poppins tipoqrafiyası</li>
                <li>Təmiz Ağ / Kağız əsas tema</li>
                <li>3D Spotlight Tilt kartları</li>
                <li>Üzvi Maye Səs Kürəsi (Liquid Orb)</li>
                <li>Dairəvi tərəzilər & Taktil keçidlər</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#e5e5e5]">
              <span className="font-semibold text-[#0a0a0a] block mb-1">🎨 Əsas Palitra</span>
              <div className="space-y-1.5 text-[#6b6b6b]">
                <div className="flex justify-between"><span>Paper (Ağ):</span><span className="font-mono text-[#0a0a0a]">#ffffff</span></div>
                <div className="flex justify-between"><span>Ink (Qara):</span><span className="font-mono text-[#0a0a0a]">#0a0a0a</span></div>
                <div className="flex justify-between"><span>Line (Xətt):</span><span className="font-mono text-[#0a0a0a]">#e5e5e5</span></div>
                <div className="flex justify-between"><span>Muted:</span><span className="font-mono text-[#0a0a0a]">#6b6b6b</span></div>
                <div className="flex justify-between"><span>Acid Green (CTA):</span><span className="font-mono text-[#0a0a0a]">#39ff14</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. 3D SPOTLIGHT CARDS & CIRCULAR RADIAL GAUGES (1 & 5)       */}
        {/* ============================================================ */}
        {(activeTab === "all" || activeTab === "3d") && (
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-[#0a0a0a] tracking-tight">
                3D Spotlight Kartları & Dairəvi Dinamik Tərəzilər
              </h2>
              <p className="text-xs text-[#6b6b6b] mt-0.5">
                Siçanı kartların üzərində hərəkət etdirin: kartlar 3D bucaq altında əyilir və kursorun altında işıq şüası hərəkət edir.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 3D Spotlight Card 1: AI Resolution Rate Gauge */}
              <SpotlightCard className="flex flex-col items-center justify-between text-center p-8">
                <div className="w-full flex items-center justify-between text-xs text-[#6b6b6b] mb-4">
                  <span className="font-medium text-[#0a0a0a]">AI Dəqiqlik Nisbəti</span>
                  <StatusText variant="ok">+4.2% artım</StatusText>
                </div>

                <RadialGauge
                  value={resolutionRate}
                  size={140}
                  strokeWidth={10}
                  color="#0a0a0a"
                  sublabel="Uğurlu zənglər"
                />

                <div className="mt-6 w-full pt-4 border-t border-[#e5e5e5] flex justify-between text-xs text-[#6b6b6b]">
                  <span>1,482 zəngdən 1,435-i</span>
                  <span className="font-mono text-[#0a0a0a]">0 insana ötürmə</span>
                </div>
              </SpotlightCard>

              {/* 3D Spotlight Card 2: Voice Latency Gauge */}
              <SpotlightCard className="flex flex-col items-center justify-between text-center p-8">
                <div className="w-full flex items-center justify-between text-xs text-[#6b6b6b] mb-4">
                  <span className="font-medium text-[#0a0a0a]">Səs Gecikməsi (TTFT)</span>
                  <StatusText variant="ok">Əla (290ms)</StatusText>
                </div>

                <RadialGauge
                  value={88}
                  size={140}
                  strokeWidth={10}
                  color="#16a34a"
                  label="Cavab Sürəti"
                  sublabel="290 ms"
                />

                <div className="mt-6 w-full pt-4 border-t border-[#e5e5e5] flex justify-between text-xs text-[#6b6b6b]">
                  <span>Gemini 2.5 Flash</span>
                  <span className="font-mono text-[#0a0a0a]">Soniox + ElevenLabs</span>
                </div>
              </SpotlightCard>

              {/* 3D Spotlight Card 3: Monthly Minute Cap Usage */}
              <SpotlightCard className="flex flex-col items-center justify-between text-center p-8">
                <div className="w-full flex items-center justify-between text-xs text-[#6b6b6b] mb-4">
                  <span className="font-medium text-[#0a0a0a]">Paket Dəqiqə İstifadəsi</span>
                  <span className="text-[#6b6b6b]">592 / 800 dəq</span>
                </div>

                <RadialGauge
                  value={capacityUsage}
                  size={140}
                  strokeWidth={10}
                  color="#0a0a0a"
                  sublabel="Aylıq limit"
                />

                <div className="mt-6 w-full pt-4 border-t border-[#e5e5e5] flex justify-between text-xs text-[#6b6b6b]">
                  <span>Qalan: 208 dəq</span>
                  <span className="font-mono text-[#0a0a0a]">350 ₼ paket</span>
                </div>
              </SpotlightCard>
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* 3. STANDART METRİK KARTLARI (SPARKLINE CARDS)                */}
        {/* ============================================================ */}
        {(activeTab === "all" || activeTab === "stats") && (
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-[#0a0a0a] tracking-tight">
                Metrik və KPI Kartları
              </h2>
              <p className="text-xs text-[#6b6b6b] mt-0.5">
                Canlı SVG sparkline trend xətti və rəngli faiz göstəriciləri (heç bir badge və nöqtə olmadan).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCardGlass
                title="Ümumi zənglər"
                value="1,482"
                change={{ value: "+18.4%", trend: "up", label: "bu həftə" }}
                icon={<PhoneIncoming className="h-5 w-5" />}
                chartData={[10, 15, 18, 22, 28, 35, 42, 50, 68]}
              />

              <StatCardGlass
                title="Orta zəng müddəti"
                value="1 dəq 42 san"
                change={{ value: "-12.0%", trend: "down", label: "daha sürətli" }}
                icon={<Clock className="h-5 w-5" />}
                chartData={[45, 42, 38, 32, 28, 25, 22, 20, 18]}
              />

              <StatCardGlass
                title="AI dəqiqliyi"
                value="96.8%"
                change={{ value: "+4.2%", trend: "up", label: "dəqiqlik" }}
                icon={<TrendingUp className="h-5 w-5" />}
                chartData={[80, 82, 85, 88, 91, 94, 95, 96, 98]}
              />

              <StatCardGlass
                title="Qənaət edilən vaxt"
                value="148 saat"
                change={{ value: "+24 saat", trend: "up", label: "ötən aya görə" }}
                icon={<Clock className="h-5 w-5" />}
                chartData={[20, 35, 45, 60, 75, 90, 110, 130, 148]}
              />
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* 4. ÜZVİ MAYE SƏS KÜRƏSİ (LIQUID AUDIO ORB)                   */}
        {/* ============================================================ */}
        {(activeTab === "all" || activeTab === "audio") && (
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-[#0a0a0a] tracking-tight">
                Üzvi Maye Səs Kürəsi & Canlı Səs Sintezi
              </h2>
              <p className="text-xs text-[#6b6b6b] mt-0.5">
                Səs oynadılan zaman maye formasını dəyişən, nəfəs alan və canlı ekvalayzer dalğaları ilə reaksiya verən üzvi kürə.
              </p>
            </div>

            <SpotlightCard className="p-8 bg-white/95">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                {/* Left Column: Interactive Liquid Audio Orb */}
                <div className="md:col-span-5 flex flex-col items-center justify-center p-6 border-b md:border-b-0 md:border-r border-[#e5e5e5]">
                  <LiquidAudioOrb
                    isActive={isPlaying}
                    size="lg"
                    label={isPlaying ? "Canlı Zəng Səsləndirilir (Klikləyin)" : "Səsi Başlatmaq üçün Klikləyin"}
                    onClick={() => setIsPlaying(!isPlaying)}
                  />

                  <div className="mt-6 flex items-center gap-2">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0a0a0a] text-white hover:bg-black/85 text-xs font-medium transition-all shadow-sm cursor-pointer"
                    >
                      {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      <span>{isPlaying ? "Səsi Dayandır" : "Səsi Dinlə"}</span>
                    </button>

                    <button
                      onClick={() => setPlaybackTime(0)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e5e5] bg-white hover:bg-[#f5f5f5] text-[#0a0a0a] transition-colors cursor-pointer"
                      title="Yenidən başlat"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Right Column: Live Call Data & Transcript Sync */}
                <div className="md:col-span-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-semibold text-[#0a0a0a]">
                        {currentScenario.callerName} ({currentScenario.phone})
                      </h4>
                      <span className="text-xs text-[#6b6b6b]">Mövzu: {currentScenario.intent}</span>
                    </div>

                    <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#f5f5f5] border border-[#e5e5e5]">
                      {SCENARIOS.map((sc, i) => (
                        <button
                          key={sc.id}
                          onClick={() => handleSelectScenario(i)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                            selectedCallIdx === i
                              ? "bg-[#0a0a0a] text-white shadow-xs"
                              : "text-[#6b6b6b] hover:text-[#0a0a0a]"
                          }`}
                        >
                          Zəng #{i + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Transcript bubbles */}
                  <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                    {currentScenario.transcript.map((msg, idx) => {
                      const isAgent = msg.speaker === "agent";
                      const isCurrentlyActive =
                        isPlaying &&
                        playbackTime >= msg.timeOffset &&
                        (idx === currentScenario.transcript.length - 1 ||
                          playbackTime < currentScenario.transcript[idx + 1].timeOffset);

                      return (
                        <motion.div
                          key={idx}
                          animate={{
                            scale: isCurrentlyActive ? 1.01 : 1,
                            backgroundColor: isCurrentlyActive ? "#ffffff" : isAgent ? "#ffffff" : "#f5f5f5",
                          }}
                          className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all duration-200 ${
                            isCurrentlyActive
                              ? "border-[#0a0a0a] shadow-sm ring-1 ring-[#0a0a0a]/10"
                              : "border-[#e5e5e5]"
                          }`}
                        >
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${
                              isAgent
                                ? "bg-[#0a0a0a] text-white"
                                : "bg-[#e5e5e5] text-[#0a0a0a]"
                            }`}
                          >
                            {isAgent ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center justify-between text-[11px] mb-1">
                              <span className="font-medium text-[#0a0a0a]">
                                {isAgent ? "Voint AI" : currentScenario.callerName}
                              </span>
                              <span className="font-mono text-[#6b6b6b]">{msg.timeStr}</span>
                            </div>
                            <p className="text-xs sm:text-sm text-[#0a0a0a] leading-relaxed">
                              {msg.text}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </SpotlightCard>
          </section>
        )}

        {/* ============================================================ */}
        {/* 5. AUDIO WAVEFORM PLAYER & TRANSCRIPT VIEWER                  */}
        {/* ============================================================ */}
        {(activeTab === "all" || activeTab === "audio") && (
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-[#0a0a0a] tracking-tight">
                Audio Dalğası Pleyeri & Transkripsiya İdarəedicisi
              </h2>
              <p className="text-xs text-[#6b6b6b] mt-0.5">
                Daxili scrub xətti, sürət dəyişdirici (1x, 1.5x, 2x), axtarış və kopyalama funksiyaları.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-5 space-y-4">
                <AudioWaveformPlayer
                  title="Zəng #C-9021, Rəşad Əliyev"
                  durationSeconds={134}
                />

                <GlassCard className="p-5 bg-white border-[#e5e5e5]">
                  <h4 className="text-xs font-semibold text-[#0a0a0a]">
                    Texniki parametrlər
                  </h4>
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-[#e5e5e5]">
                      <span className="text-[#6b6b6b]">Model:</span>
                      <span className="font-medium text-[#0a0a0a]">Gemini 2.5 Flash</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[#e5e5e5]">
                      <span className="text-[#6b6b6b]">STT:</span>
                      <span className="font-medium text-[#0a0a0a]">Soniox stt-rt-v5</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[#e5e5e5]">
                      <span className="text-[#6b6b6b]">TTS:</span>
                      <span className="font-medium text-[#0a0a0a]">ElevenLabs eleven_v3</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-[#6b6b6b]">İlk kəlmə (TTFT):</span>
                      <StatusText variant="ok">290ms</StatusText>
                    </div>
                  </div>
                </GlassCard>
              </div>

              <div className="lg:col-span-7">
                <TranscriptViewer
                  intent="Masa rezervasiyası"
                  summary="Müştəri sabah saat 19:00 üçün 4 nəfərlik masa rezerv etdi. Təsdiq SMS-i göndərildi."
                />
              </div>
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* 6. DİNAMİK QƏNAƏT & ROI KALKULYATORU                         */}
        {/* ============================================================ */}
        {(activeTab === "all" || activeTab === "calculator") && (
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-[#0a0a0a] tracking-tight">
                İnteraktiv Qənaət və Maya Kalkulyatoru
              </h2>
              <p className="text-xs text-[#6b6b6b] mt-0.5">
                Dəqiqə həcmini tənzimləyərək real vaxtda xalis qənaəti hesablayın.
              </p>
            </div>

            <SpotlightCard className="p-6 sm:p-8 bg-white/95">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-6 space-y-6">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#0a0a0a]">Aylıq Zəng Dəqiqəsi:</span>
                      <span className="text-2xl font-bold font-mono text-[#0a0a0a]">
                        {calcMinutes.toLocaleString()} dəqiqə
                      </span>
                    </div>

                    <input
                      type="range"
                      min={100}
                      max={4000}
                      step={50}
                      value={calcMinutes}
                      onChange={(e) => setCalcMinutes(Number(e.target.value))}
                      className="w-full mt-3 accent-[#0a0a0a] h-2 bg-[#e5e5e5] rounded-lg cursor-pointer"
                    />

                    <div className="flex justify-between text-xs text-[#6b6b6b] mt-1.5 font-mono">
                      <span>100 dəq</span>
                      <span>2,000 dəq</span>
                      <span>4,000 dəq</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#6b6b6b] leading-relaxed">
                    * İnsan operatoru maya xərci aylıq 700 ₼ təşkil edir və gündə 8 saat işləyir. Voint AI isə 24/7 rejimdə fasiləsiz işləyir.
                  </p>
                </div>

                <div className="md:col-span-6 grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[#fafafa] border border-[#e5e5e5]">
                    <span className="text-xs text-[#6b6b6b]">İnsan Operator Maya</span>
                    <span className="mt-1 text-xl font-bold text-[#0a0a0a] block">
                      {Math.round(calcMinutes * 0.9 + 350)} ₼/ay
                    </span>
                    <span className="text-[11px] text-[#6b6b6b] mt-0.5 block">Əmək haqqı + avadanlıq</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#fafafa] border border-[#e5e5e5]">
                    <span className="text-xs text-[#6b6b6b]">Voint AI Xərci</span>
                    <span className="mt-1 text-xl font-bold text-emerald-600 block">
                      {Math.min(350, Math.round(calcMinutes * 0.44))} ₼/ay
                    </span>
                    <span className="text-[11px] text-[#6b6b6b] mt-0.5 block">Dəqiqə paketi daxilində</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#fafafa] border border-[#e5e5e5] col-span-2 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-[#6b6b6b]">Aylıq Xalis Qənaət:</span>
                      <div className="text-2xl font-bold text-[#0a0a0a] mt-0.5">
                        +{Math.round((calcMinutes * 0.9 + 350) - Math.min(350, calcMinutes * 0.44))} ₼ / ay
                      </div>
                    </div>

                    <StatusText variant="ok" className="text-sm">
                      ~68% Qənaət
                    </StatusText>
                  </div>
                </div>
              </div>
            </SpotlightCard>
          </section>
        )}

        {/* ============================================================ */}
        {/* 7. MƏLUMAT CƏDVƏLİ                                           */}
        {/* ============================================================ */}
        {(activeTab === "all" || activeTab === "table") && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-[#0a0a0a] tracking-tight">
                  Məlumat Cədvəli
                </h2>
                <p className="text-xs text-[#6b6b6b] mt-0.5">
                  Vəziyyət sütununda heç bir badge və ya nöqtə yoxdur — yalnız təmiz rəngli status mətni.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6b6b6b]" />
                  <input
                    type="text"
                    placeholder="Müştəri və ya mövzu axtar..."
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    className="h-9 w-56 rounded-full border border-[#e5e5e5] bg-white pl-9 pr-4 text-xs text-[#0a0a0a] placeholder:text-[#6b6b6b] focus:border-[#0a0a0a] focus:outline-none transition-colors"
                  />
                </div>

                <GlassButton
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="h-3.5 w-3.5" />}
                >
                  Yeni Zəng
                </GlassButton>
              </div>
            </div>

            <GlassTableContainer>
              <GlassTable>
                <GlassTHead>
                  <tr>
                    <GlassTH>Zəng ID</GlassTH>
                    <GlassTH>Müştəri</GlassTH>
                    <GlassTH
                      sortable
                      sortDirection={sortDir}
                      onSort={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
                    >
                      Müddət
                    </GlassTH>
                    <GlassTH>Mövzu</GlassTH>
                    <GlassTH>Vəziyyət</GlassTH>
                    <GlassTH className="text-right">Əməliyyat</GlassTH>
                  </tr>
                </GlassTHead>

                <GlassTBody>
                  {SCENARIOS.filter(
                    (c) =>
                      c.phone.includes(tableSearch) ||
                      c.callerName.toLowerCase().includes(tableSearch.toLowerCase()) ||
                      c.intent.toLowerCase().includes(tableSearch.toLowerCase())
                  ).map((call) => (
                    <GlassTR
                      key={call.id}
                      clickable
                      onClick={() => handleOpenDrawer(call)}
                    >
                      <GlassTD>
                        <span className="font-mono text-xs text-[#6b6b6b] font-medium">
                          #{call.id}
                        </span>
                      </GlassTD>

                      <GlassTD>
                        <div>
                          <div className="font-medium text-[#0a0a0a]">{call.callerName}</div>
                          <div className="text-xs font-mono text-[#6b6b6b]">{call.phone}</div>
                        </div>
                      </GlassTD>

                      <GlassTD>
                        <span className="font-mono text-xs text-[#0a0a0a]">
                          {call.durationFormatted}
                        </span>
                      </GlassTD>

                      <GlassTD>
                        <span className="text-[#0a0a0a]">{call.intent}</span>
                      </GlassTD>

                      {/* Plain Status Text — NO badges, NO dots */}
                      <GlassTD>
                        <StatusText variant={call.statusVariant}>
                          {call.statusLabel}
                        </StatusText>
                      </GlassTD>

                      <GlassTD className="text-right">
                        <GlassButton
                          size="xs"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDrawer(call);
                          }}
                          rightIcon={<ArrowRight className="h-3 w-3" />}
                        >
                          Baxış
                        </GlassButton>
                      </GlassTD>
                    </GlassTR>
                  ))}
                </GlassTBody>
              </GlassTable>
            </GlassTableContainer>
          </section>
        )}

        {/* ============================================================ */}
        {/* 8. DÜYMƏLƏR VƏ ÖLÇÜLƏR                                       */}
        {/* ============================================================ */}
        {(activeTab === "all" || activeTab === "buttons") && (
          <section className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-[#0a0a0a] tracking-tight">
                Düymələr
              </h2>
              <p className="text-xs text-[#6b6b6b] mt-0.5">
                Landing səhifəsi ilə eyni tərzi daşıyan əsas qara, ikincil çərçivəli və xüsusi CTA variantları.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <GlassCard className="p-5 space-y-4">
                <span className="text-xs font-semibold text-[#0a0a0a]">
                  Əsas CTA (Landing Stili)
                </span>
                <p className="text-xs text-[#6b6b6b]">
                  Sağında yaşıl ox ikonu olan əsas qara düymə.
                </p>
                <div>
                  <GlassButton variant="primary-cta" className="w-full">
                    Zəng Başlat
                  </GlassButton>
                </div>
              </GlassCard>

              <GlassCard className="p-5 space-y-4">
                <span className="text-xs font-semibold text-[#0a0a0a]">
                  İkincil Düymə
                </span>
                <p className="text-xs text-[#6b6b6b]">
                  Zərif çərçivəli və ağ fonda standart əməliyyat düyməsi.
                </p>
                <div>
                  <GlassButton variant="secondary" className="w-full">
                    Məlumatları İxrac Et
                  </GlassButton>
                </div>
              </GlassCard>

              <GlassCard className="p-5 space-y-4">
                <span className="text-xs font-semibold text-red-600">
                  Təhlükəli / Silmə
                </span>
                <p className="text-xs text-[#6b6b6b]">
                  Silmə və ləğvetmə əməliyyatları üçün zərif qırmızı düymə.
                </p>
                <div>
                  <GlassButton variant="danger" className="w-full" leftIcon={<Trash2 className="h-3.5 w-3.5" />}>
                    Qeydi Sil
                  </GlassButton>
                </div>
              </GlassCard>
            </div>

            <GlassCard className="p-6">
              <h4 className="text-xs font-semibold text-[#0a0a0a] mb-4">
                Düymə Ölçüləri (XS, SM, MD, LG, Icon)
              </h4>
              <div className="flex flex-wrap items-center gap-3">
                <GlassButton size="xs" variant="secondary">
                  Ölçü XS
                </GlassButton>
                <GlassButton size="sm" variant="secondary">
                  Ölçü SM
                </GlassButton>
                <GlassButton size="md" variant="primary">
                  Ölçü MD
                </GlassButton>
                <GlassButton size="lg" variant="primary-cta">
                  Ölçü LG
                </GlassButton>
                <GlassButton size="icon" variant="secondary">
                  <Download className="h-4 w-4" />
                </GlassButton>
              </div>
            </GlassCard>
          </section>
        )}

        {/* ============================================================ */}
        {/* 9. FORMLAR VƏ GİRİŞ SAHƏLƏRİ                                 */}
        {/* ============================================================ */}
        {(activeTab === "all" || activeTab === "forms") && (
          <section className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-[#0a0a0a] tracking-tight">
                Form Sahələri və Giriş Elementləri
              </h2>
              <p className="text-xs text-[#6b6b6b] mt-0.5">
                Təmiz çərçivəli giriş sahələri, şifrə göstəricisi, seçim siyahıları və açarlar.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <GlassCard className="p-5 space-y-4 bg-white/95">
                <GlassInput
                  label="Müştəri adı"
                  placeholder="Məsələn: CES Texnika MMC"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  helperText="Panel daxilində görünəcək rəsmi ad"
                />

                <GlassInput
                  label="Şifrə"
                  isPassword
                  value={passwordValue}
                  onChange={(e) => setPasswordValue(e.target.value)}
                  helperText="Ən azı 8 simvol"
                />
              </GlassCard>

              <GlassCard className="p-5 space-y-4 bg-white/95">
                <GlassSelect
                  label="Əsas dil"
                  value={selectValue}
                  onChange={(e) => setSelectValue(e.target.value)}
                  helperText="Zəng qəbul edilərkən danışılacaq dil"
                >
                  <option value="az">Azərbaycan dili</option>
                  <option value="en">İngilis dili</option>
                  <option value="ru">Rus dili</option>
                </GlassSelect>

                <div className="space-y-3 pt-2">
                  <GlassSwitch
                    checked={switch1}
                    onChange={setSwitch1}
                    label="Zəng audio yazısı"
                    description="Müştəriyə bildiriş oxunur"
                  />
                  <GlassSwitch
                    checked={switch2}
                    onChange={setSwitch2}
                    label="Operatordan kömək"
                    description="AI çatmadıqda insana yönləndir"
                  />
                </div>
              </GlassCard>

              <GlassCard className="p-5 space-y-4 bg-white/95">
                <GlassTextarea
                  label="Sistem təlimatı (System Prompt)"
                  rows={4}
                  defaultValue="Sən Voint şirkətinin rəsmi AI səsli köməkçisisən. Müştərilərlə nəzakətlə danış, sualları şirkətin bilik bazasından cavabla."
                  helperText="Gemini 2.5 Flash tərəfindən icra olunur"
                />

                <div className="flex justify-end pt-1">
                  <GlassButton variant="primary" size="sm">
                    Yadda Saxla
                  </GlassButton>
                </div>
              </GlassCard>
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* 10. VƏZİYYƏT (STATUS) NÜMUNƏLƏRİ                             */}
        {/* ============================================================ */}
        {activeTab === "all" && (
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-[#0a0a0a] tracking-tight">
                Vəziyyət Nümunələri (Düz Rəngli Mətn)
              </h2>
              <p className="text-xs text-[#6b6b6b] mt-0.5">
                Heç bir badge, fon və ya nöqtə yoxdur — status yalnız oxunaqlı rəngli mətndir.
              </p>
            </div>

            <GlassCard className="p-6">
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <StatusText variant="ok">Uğurlu / Aktiv</StatusText>
                <StatusText variant="warn">Təsdiq gözləyir</StatusText>
                <StatusText variant="err">Kəsildi / Xəta</StatusText>
                <StatusText variant="info">Yönləndirildi</StatusText>
                <StatusText variant="muted">Arxivdədir</StatusText>
              </div>
            </GlassCard>
          </section>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL                                                        */}
      {/* ============================================================ */}
      <GlassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Yeni kampaniya yarat"
        subtitle="Müştəri siyahısına avtomatik çıxan zənglər üçün"
        size="md"
        footer={
          <>
            <GlassButton variant="ghost" onClick={() => setIsModalOpen(false)}>
              Ləğv et
            </GlassButton>
            <GlassButton
              variant="primary-cta"
              onClick={() => setIsModalOpen(false)}
              rightIcon={<Send className="h-3.5 w-3.5" />}
            >
              Başlat
            </GlassButton>
          </>
        }
      >
        <div className="space-y-4">
          <GlassInput
            label="Kampaniya adı"
            placeholder="Məs: May ayı yeniləmə zəngləri"
            defaultValue="Xatırlatma Zəngi #01"
          />
          <GlassSelect label="Hədəf seqment">
            <option>Son 30 gündə sifariş verənlər (84 nəfər)</option>
            <option>Görüş təyin olunmuş müştərilər (12 nəfər)</option>
          </GlassSelect>
          <GlassTextarea
            label="Zəngin məqsədi"
            rows={3}
            defaultValue="Müştəriyə xidmət müddətinin bitdiyini xatırla və təsdiq etsə fakturanı yönləndir."
          />
        </div>
      </GlassModal>

      {/* ============================================================ */}
      {/* DRAWER                                                       */}
      {/* ============================================================ */}
      <GlassDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={drawerCall ? `Zəng #${drawerCall.id}` : "Zəng Detalları"}
        subtitle={drawerCall ? `${drawerCall.callerName} (${drawerCall.phone})` : ""}
        width="md"
        footer={
          <>
            <GlassButton variant="ghost" onClick={() => setIsDrawerOpen(false)}>
              Bağla
            </GlassButton>
            <GlassButton
              variant="secondary"
              onClick={() => setIsDrawerOpen(false)}
              leftIcon={<Download className="h-3.5 w-3.5" />}
            >
              İxrac Et
            </GlassButton>
          </>
        }
      >
        {drawerCall && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[#fafafa] border border-[#e5e5e5]">
                <span className="text-xs text-[#6b6b6b] block">
                  Müddət
                </span>
                <span className="text-base font-semibold text-[#0a0a0a] font-mono mt-0.5 block">
                  {drawerCall.durationFormatted}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#fafafa] border border-[#e5e5e5]">
                <span className="text-xs text-[#6b6b6b] block">
                  Vəziyyət
                </span>
                <div className="mt-0.5">
                  <StatusText variant={drawerCall.statusVariant}>
                    {drawerCall.statusLabel}
                  </StatusText>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-[#0a0a0a] mb-2">
                Dialoq transkripsiyası
              </h4>
              <div className="space-y-3">
                {drawerCall.transcript.map((t: any, i: number) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl border text-xs leading-relaxed ${
                      t.speaker === "agent"
                        ? "bg-white border-[#e5e5e5]"
                        : "bg-[#f5f5f5] border-[#e5e5e5]"
                    }`}
                  >
                    <div className="font-medium text-[#0a0a0a] mb-1">
                      {t.speaker === "agent" ? "Voint AI" : drawerCall.callerName}
                    </div>
                    <div className="text-[#0a0a0a]">{t.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </GlassDrawer>
    </div>
  );
}
