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
  language: "az" | "en" | "ru" | "tr";
}

export interface Tenant {
  id: string;
  name: string;
  config: TenantConfig;
}

export type CallStatus = "COMPLETED" | "MISSED" | "HANDED_OFF" | "IN_PROGRESS";

export interface TranscriptLine {
  speaker: "agent" | "customer";
  text: string;
  ts: string; // "00:12"
}

export interface CallSummary {
  id: string;
  callerNumber: string;
  callerName?: string;
  startedAt: string; // ISO
  durationSec: number;
  status: CallStatus;
  resolved: boolean;
  topic: string;
}

export interface CallDetail extends CallSummary {
  summary: string;
  transcript: TranscriptLine[];
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

export interface Reservation {
  id: string;
  customerName: string;
  phone: string;
  service: string;
  requestedAt: string; // ISO — sorgu vaxti
  scheduledFor: string; // ISO — rezervasiya vaxti
  note?: string;
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
