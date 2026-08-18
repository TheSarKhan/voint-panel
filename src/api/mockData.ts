import type {
  AnalyticsOverview,
  AuthUser,
  CallDetail,
  Customer,
  RagDocument,
  Tenant,
} from "./types";

// ————— Mock "verilənlər bazası" — yaddaşda saxlanılır, səhifə yenilənəndə sıfırlanır —————

export const MOCK_TENANT_ID = "tenant-ces";

export const mockUser: AuthUser = {
  id: "user-1",
  email: "admin@ces.az",
  name: "CES Admin",
  tenantId: MOCK_TENANT_ID,
  role: "OWNER",
};

export const mockTenant: Tenant = {
  id: MOCK_TENANT_ID,
  name: "CES Klinikası",
  config: {
    greetingText:
      "Salam, CES Klinikasına xoş gəlmisiniz! Mən sizin virtual assistentinizəm. Sizə necə kömək edə bilərəm?",
    workingHours: "B.e–Cümə 09:00–18:00, Şənbə 10:00–14:00",
    handoffNumber: "+994 12 555 01 02",
    language: "az",
    sttDomain: "",
    sttTopic: "",
    sttVocabulary: "CES, texnika icarəsi, ekskavator, buldozer",
  },
};

export const mockCalls: CallDetail[] = [
  {
    id: "call-101",
    callerNumber: "+994 50 234 56 78",
    languageDetected: "az",
    startedAt: "2026-07-23T10:14:00Z",
    durationSec: 184,
    status: "RESOLVED",
    resolved: true,
    openQuestionCount: 0,
    unansweredQuestions: [],
    summary:
      "Müştəri diş təmizliyi qiymətini soruşdu. Agent qiymət məlumatını təqdim etdi və növbəti həftə üçün rezervasiya təklif etdi. Müştəri cümə günü saat 15:00-a yazıldı.",
    transcript:
      "Agent: Salam, CES Klinikasına xoş gəlmisiniz! Sizə necə kömək edə bilərəm?\n" +
      "Müştəri: Salam, diş təmizliyi neçəyədir?\n" +
      "Agent: Professional diş təmizliyi 60 manatdır. İstəsəniz sizin üçün vaxt ayıra bilərəm.\n" +
      "Müştəri: Bəli, cümə günü mümkündürmü?\n" +
      "Agent: Cümə günü saat 15:00 boşdur. Adınızı və nömrənizi qeyd edirəm. Rezervasiyanız təsdiqləndi.\n" +
      "Müştəri: Çox sağ olun!",
  },
  {
    id: "call-102",
    callerNumber: "+994 55 111 22 33",
    languageDetected: "az",
    startedAt: "2026-07-23T09:02:00Z",
    durationSec: 95,
    status: "RESOLVED",
    resolved: true,
    openQuestionCount: 0,
    unansweredQuestions: [],
    summary:
      "Müştəri klinikanın iş saatlarını soruşdu. Agent iş qrafikini bildirdi. Əlavə sual olmadı.",
    transcript:
      "Agent: Salam, CES Klinikasına xoş gəlmisiniz!\n" +
      "Müştəri: Şənbə günü işləyirsiniz?\n" +
      "Agent: Bəli, şənbə günləri 10:00-dan 14:00-a kimi işləyirik.\n" +
      "Müştəri: Aydındır, təşəkkürlər.",
  },
  {
    id: "call-103",
    callerNumber: "+994 70 987 65 43",
    languageDetected: "az",
    startedAt: "2026-07-22T16:40:00Z",
    durationSec: 261,
    status: "HANDOFF",
    resolved: false,
    openQuestionCount: 0,
    unansweredQuestions: [],
    summary:
      "Müştəri əvvəlki müayinə ilə bağlı narazılıq bildirdi. Agent mövzunu həll edə bilmədi və zəngi operatora yönləndirdi.",
    transcript:
      "Agent: Salam, CES Klinikasına xoş gəlmisiniz!\n" +
      "Müştəri: Keçən həftə müayinədən sonra problem yaşadım, kiminləsə danışmaq istəyirəm.\n" +
      "Agent: Çox üzr istəyirik. Sizi dərhal məsul əməkdaşımıza yönləndirirəm, xahiş edirəm xətdə qalın.",
  },
  {
    id: "call-104",
    callerNumber: "+994 51 444 55 66",
    languageDetected: "az",
    startedAt: "2026-07-22T11:20:00Z",
    durationSec: 142,
    status: "RESOLVED",
    resolved: true,
    openQuestionCount: 0,
    unansweredQuestions: [],
    summary:
      "Müştəri ortodont konsultasiyası üçün vaxt istədi. Agent bazar ertəsi 11:30 təklif etdi, müştəri qəbul etdi.",
    transcript:
      "Agent: Salam, CES Klinikasına xoş gəlmisiniz!\n" +
      "Müştəri: Ortodonta yazılmaq istəyirəm.\n" +
      "Agent: Əlbəttə. Bazar ertəsi saat 11:30 uyğundur?\n" +
      "Müştəri: Bəli, uyğundur.\n" +
      "Agent: Qeyd etdim. Görüşənədək!",
  },
  {
    id: "call-105",
    callerNumber: "+994 77 321 09 87",
    languageDetected: undefined,
    startedAt: "2026-07-21T14:05:00Z",
    durationSec: 0,
    status: "ONGOING",
    resolved: false,
    openQuestionCount: 0,
    unansweredQuestions: [],
    summary: null,
    transcript: null,
  },
  {
    id: "call-106",
    callerNumber: "+994 50 234 56 78",
    languageDetected: "az",
    startedAt: "2026-07-20T13:30:00Z",
    durationSec: 118,
    status: "RESOLVED",
    resolved: true,
    openQuestionCount: 0,
    unansweredQuestions: [],
    summary:
      "Müştəri klinikanın ünvanını və parkinq imkanını soruşdu. Agent məlumat verdi.",
    transcript:
      "Agent: Salam, CES Klinikasına xoş gəlmisiniz!\n" +
      "Müştəri: Ünvanınız haradır?\n" +
      "Agent: Nizami küçəsi 12, Bakı. Binanın arxasında pulsuz parkinq var.",
  },
];

export const mockCustomers: Customer[] = [
  {
    id: "cust-1",
    phone: "+994 50 234 56 78",
    name: "Aysel Məmmədova",
    note: "Daimi müştəri, diş təmizliyi",
    lastContactAt: "2026-07-23T10:14:00Z",
    callCount: 4,
  },
  {
    id: "cust-2",
    phone: "+994 55 111 22 33",
    name: "Rasim Quliyev",
    lastContactAt: "2026-07-23T09:02:00Z",
    callCount: 1,
  },
  {
    id: "cust-3",
    phone: "+994 51 444 55 66",
    name: "Nigar Əliyeva",
    note: "Ortodont konsultasiyası",
    lastContactAt: "2026-07-22T11:20:00Z",
    callCount: 2,
  },
  {
    id: "cust-4",
    phone: "+994 70 987 65 43",
    name: "Adsız müştəri",
    note: "Şikayət — operator izləməlidir",
    lastContactAt: "2026-07-22T16:40:00Z",
    callCount: 1,
  },
];

export const mockRagDocuments: RagDocument[] = [
  {
    id: "rag-1",
    category: "pricing",
    content:
      "Diş təmizliyi — 60 AZN\nDiş ağardılması — 150 AZN\nPlomb — 40-80 AZN\nİmplant konsultasiyası — pulsuz",
    source: "mock",
    active: true,
    hitCount: 0,
    lastUsedAt: null,
    createdAt: "2026-07-18T12:00:00Z",
  },
  {
    id: "rag-2",
    category: "services",
    content:
      "Terapevtik stomatologiya, ortodontiya, implantologiya, uşaq stomatologiyası, professional gigiyena.",
    source: "mock",
    active: true,
    hitCount: 0,
    lastUsedAt: null,
    createdAt: "2026-07-18T12:05:00Z",
  },
  {
    id: "rag-3",
    category: "faq",
    content:
      "S: Parkinq varmı? C: Bəli, binanın arxasında pulsuz parkinq.\nS: Sığorta qəbul edirsiniz? C: Paşa və Atəşgah sığortaları qəbul olunur.",
    source: "mock",
    active: true,
    hitCount: 0,
    lastUsedAt: null,
    createdAt: "2026-07-15T09:30:00Z",
  },
  {
    id: "rag-4",
    category: "working-hours",
    content: "Bazar ertəsi – Cümə: 09:00–18:00\nŞənbə: 10:00–14:00\nBazar: bağlı",
    source: "mock",
    active: true,
    hitCount: 0,
    lastUsedAt: null,
    createdAt: "2026-07-10T08:00:00Z",
  },
];

export const mockAnalytics: AnalyticsOverview = {
  totalCalls: 128,
  resolutionRate: 0.82,
  reservationCount: 34,
  avgDurationSec: 156,
  callsByDay: [
    { date: "2026-07-17", count: 14 },
    { date: "2026-07-18", count: 18 },
    { date: "2026-07-19", count: 9 },
    { date: "2026-07-20", count: 21 },
    { date: "2026-07-21", count: 17 },
    { date: "2026-07-22", count: 26 },
    { date: "2026-07-23", count: 23 },
  ],
};

export const DEMO_EMAIL = "admin@ces.az";
export const DEMO_PASSWORD = "voint123";
export const MOCK_TOKEN = "mock-jwt-token.voint-demo";
