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
}

// Backend GET /calls/{callId} call_transcripts cedvelinden transkript + AI xulaseni elave edir.
// Hazirki webhook axini her zeng ucun transkript yazmir - buna gore her iki sahe null ola biler.
// full_transcript sade metn blokudur (strukturlasdirilmis "speaker turns" deyil), buna gore
// panel de onu ham metn kimi gosterir, suni sekilde sethlere bolmur.
export interface CallDetail extends CallSummary {
  summary: string | null;
  transcript: string | null;
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

export type ReservationStatus = "PENDING" | "CONFIRMED" | "REJECTED";

// Backend (ReservationRequest) musterinin telefon nomresini saxlamir - reservasiya cedvelinde
// bu sahe yoxdur, buna gore panel de uydurma qiymet gostermir.
export interface Reservation {
  id: string;
  customerName: string;
  service: string;
  requestedAt: string; // ISO — sorgunun yaradildigi vaxt (backend: createdAt)
  // Backend-de sərbəst metndir (VARCHAR sutun, musterinin dediyi kimi yazilir, ISO tarix deyil) -
  // buna gore formatDateTime-a verilmir, ham metn kimi gosterilir.
  scheduledFor: string;
  status: ReservationStatus;
  sourceCallId?: string;
}

// Backend (com.starsoft.voint.rag) kateqoriyani sabit enum yox, sərbəst metn kimi saxlayir
// (mes. "pricing", "working-hours", "delivery", "deposit", "terms").
export interface RagDocument {
  id: string;
  category: string;
  content: string;
  source?: string;
  createdAt: string; // ISO
}

export interface RagDocumentInput {
  category: string;
  content: string;
  source?: string;
}

export interface AnalyticsOverview {
  totalCalls: number;
  resolutionRate: number; // 0..1
  reservationCount: number;
  avgDurationSec: number;
  callsByDay: { date: string; count: number }[];
}
