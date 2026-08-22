// voint-backend /api/v1 modelleri (frontend gorunusu)

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  user: AuthUser;
}

export interface TenantConfig {
  greetingText: string;
  workingHours: string;
  handoffNumber: string;
  // Backend (languageConfig) sərbəst metn sutunudur - sabit enum deyil. CES seed-inde hetta
  // sade kod deyil, JSON blok saxlanilir (mes. {"default":"az","supported":["az","ru","en"]}),
  // buna gore panel bunu strukturlasdirilmamis metn kimi qebul edir/gonderir.
  language: string;
  // Səs tanımanın (Soniox STT) bu tenant-a xas köməkçiləri - VapiAssistantProvisioner
  // bunları hər müəssisənin öz şirkət adları/məhsulları/jarqonu ilə vergüllə ayrılmış
  // customVocabulary siyahısına çevirir. Ümumi dilin sözləri deyil - nadir/sahəyə xas sözlər.
  sttDomain: string;
  sttTopic: string;
  sttVocabulary: string;
}

export interface Tenant {
  id: string;
  name: string;
  config: TenantConfig;
}

// Backend (com.starsoft.voint.call.CallStatus) enum - ONGOING (zeng davam edir),
// RESOLVED (agent tereflinden hell olundu), HANDOFF (operatora yonlendirildi).
export type CallStatus = "ONGOING" | "RESOLVED" | "HANDOFF";

export interface CallSummary {
  id: string;
  callerNumber: string;
  languageDetected?: string; // backend: language_detected — evez olunmus "topic" sahesinin yerine
  startedAt: string; // ISO
  durationSec: number;
  status: CallStatus;
  resolved: boolean; // frontend-de derive olunur: status === "RESOLVED"
  /** Bu zengde hele baglanmamis cavabsiz sual sayi — siyahida isareleme ucun. */
  openQuestionCount: number;
  customerId?: string | null;
  customerName?: string | null;
}

// Zeng bitenden sonra Gemini transkripti oxuyur ve agentin cavablaya bilmediyi suallari cixarir.
// Bilik bazasindaki bosluq burada gorunur: sual baglananda cavab RAG-a sened kimi dusur.
export type QuestionStatus = "OPEN" | "ANSWERED" | "DISMISSED";

export interface UnansweredQuestion {
  id: string;
  tenantId: string;
  callId: string;
  question: string;
  /** Sohbetin hansi meqaminda sorusulub — operator kontekstsiz suali anlamir. */
  context: string | null;
  status: QuestionStatus;
  /** Cavab RAG-a elave olunanda yaranan senedin id-si. */
  ragDocumentId: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

/** AI-nin teklif etdiyi cavab qaralamasi. Hec ne saxlanilmir — operator tesdiqleyene qeder. */
export interface DraftAnswer {
  answer: string;
  /** Qaralamanin soykendiyi movcud bilik bazasi parcalari. */
  usedKnowledge: string[];
  /** AI-nin bilmediyi ve operatorun doldurmali oldugu konkret melumatlar. */
  missingFacts: string[];
}

// Backend GET /calls/{callId} call_transcripts cedvelinden transkript + AI xulaseni elave edir.
// Hazirki webhook axini her zeng ucun transkript yazmir - buna gore her iki sahe null ola biler.
// full_transcript sade metn blokudur (strukturlasdirilmis "speaker turns" deyil), buna gore
// panel de onu ham metn kimi gosterir, suni sekilde sethlere bolmur.
export interface CallDetail extends CallSummary {
  summary: string | null;
  transcript: string | null;
  /** Eyni söhbətin AI-təmizlənmiş versiyası (STT kəsişmə/səhv artefaktları çıxarılıb) - null-dursa hələ təhlil olunmayıb, panel xam transkripti göstərir. */
  cleanedTranscript: string | null;
  unansweredQuestions: UnansweredQuestion[];
  customerNotes?: string | null;
}

export interface Customer {
  id: string;
  phone: string;
  name: string;
  note?: string;
  lastContactAt: string; // ISO
  callCount: number;
}

export interface CustomerInput {
  phone: string;
  name: string;
  note?: string;
}

// Backend (com.starsoft.voint.rag) kateqoriyani sabit enum yox, sərbəst metn kimi saxlayir
// (mes. "pricing", "working-hours", "delivery", "deposit", "terms").
export interface RagDocument {
  id: string;
  category: string;
  content: string;
  source?: string;
  /** false = dayandırılıb - agent bu məlumatdan istifadə etmir, amma silinməyib. */
  active: boolean;
  /** Bu parçanın real zənglərdə neçə dəfə agentin kontekstinə düşdüyü. */
  hitCount: number;
  lastUsedAt: string | null; // ISO
  createdAt: string; // ISO
}

export interface RagDocumentInput {
  category: string;
  content: string;
  source?: string;
}

export interface AnalyticsOverview {
  totalCalls: number;
  resolvedCalls: number;
  handoffCalls: number;
  ongoingCalls: number;
  resolutionRate: number; // 0..1
  reservationCount: number;
  avgDurationSec: number;
  callsByDay: { date: string; count: number }[];
  /** Hər callsByDay nöqtəsinin əhatə etdiyi gün sayı - 1 = gündəlik, 7 = həftəlik bucket. */
  bucketDays: number;
}
