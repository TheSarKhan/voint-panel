import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Bot,
  User,
  Send,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  BookOpen,
} from "lucide-react";
import { finishRagChat, sendRagChatTurn, type RagChatTurn } from "../api/ragChat";
import type { RagDocument } from "../api/types";
import { apiErrorText } from "../lib/apiError";
import {
  GlassButton,
  GlassCard,
  StatusText,
} from "./kit";

const GREETING =
  "Salam! Şirkətiniz haqqında məlumat toplamaqda sizə kömək edəcəyəm ki, səsli AI agentiniz müştərilərə dəqiq və professional cavab versin. Zəhmət olmasa iş saatlarınız, ünvanınız və əsas xidmətləriniz haqqında qısa məlumat verin.";

const PROMPT_SUGGESTIONS = [
  "İş saatlarımız: Həftə içi 09:00 - 18:00, Şənbə 10:00 - 15:00",
  "Ünvanımız: Bakı ş., Nizami küç. 45 (Parkinq mövcuddur)",
  "Ödəniş: Nağd, kartla və taksitlə (BirKart, TamKart)",
  "Görüş və rezervasiya üçün öncədən qeydiyyat tələb olunur",
];

export function RagChatInternalView({
  tenantId,
  onBack,
  onSaved,
}: {
  tenantId: string;
  onBack: () => void;
  onSaved: (docs: RagDocument[]) => void;
}) {
  const [history, setHistory] = useState<RagChatTurn[]>([
    { role: "assistant", content: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<RagDocument[] | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [history, sending]);

  const hasUserTurn = history.some((t) => t.role === "user");

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending || finishing) return;

    const next = [...history, { role: "user" as const, content: text }];
    setHistory(next);
    setInput("");
    setSending(true);
    setError(null);

    try {
      const reply = await sendRagChatTurn(tenantId, next);
      setHistory([...next, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(apiErrorText(err, "Cavab alınmadı. Zəhmət olmasa yenidən yoxlayın."));
    } finally {
      setSending(false);
    }
  };

  const useSuggestion = (text: string) => {
    setInput(text);
  };

  const handleFinish = async () => {
    setFinishing(true);
    setError(null);
    try {
      const docs = await finishRagChat(tenantId, history);
      setCreated(docs);
    } catch (err) {
      setError(apiErrorText(err, "Söhbətdən bilik sənədləri çıxarıla bilmədi."));
    } finally {
      setFinishing(false);
    }
  };

  const handleDone = () => {
    if (created && created.length > 0) {
      onSaved(created);
    }
    onBack();
  };

  // ── RESULT REVIEW VIEW ──
  if (created) {
    return (
      <div className="space-y-6 font-sans max-w-4xl mx-auto py-4">
        <GlassCard className="p-8 bg-white/95 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#0a0a0a]">
                {created.length === 0
                  ? "Bilik bazası sənədi tapılmadı"
                  : `${created.length} yeni bilik sənədi formalaşdırıldı`}
              </h2>
              <p className="text-xs text-[#6b6b6b] mt-0.5">
                {created.length === 0
                  ? "Söhbətdə konkret fakt və qaydalar aşkar olunmadı. Yenidən cəhd edə bilərsiniz."
                  : "AI apardığınız dialoqdan aşağıdakı strukturlaşdırılmış bilik parçalarını çıxardı:"}
              </p>
            </div>
          </div>

          {created.length > 0 && (
            <div className="space-y-3">
              {created.map((doc, idx) => (
                <div
                  key={doc.id || idx}
                  className="p-4 rounded-2xl border border-[#e5e5e5] bg-[#fafafa] space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#0a0a0a] uppercase tracking-wider">
                      {doc.category || "Ümumi"}
                    </span>
                    <StatusText variant="ok">Hazır</StatusText>
                  </div>
                  <p className="text-xs sm:text-sm text-[#0a0a0a] leading-relaxed">
                    {doc.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-[#e5e5e5]">
            <GlassButton variant="secondary" onClick={() => setCreated(null)}>
              Söhbətə Qayıt
            </GlassButton>
            <GlassButton variant="primary" onClick={handleDone}>
              Bilik Bazasını Yenilə
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    );
  }

  // ── INTERNAL CHAT PAGE VIEW ──
  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto">
      {/* ── TOP NAVIGATION & HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e5e5e5] pb-6">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-medium text-[#6b6b6b] hover:text-[#0a0a0a] transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Bilik bazasına qayıt</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#0a0a0a] tracking-tight">
            Söhbətlə Bilik Bazası Doldurma
          </h1>
          <p className="text-xs sm:text-sm text-[#6b6b6b] mt-1">
            Köməkçi ilə təbii söhbət edərək şirkətinizin iş saatlarını, xidmətlərini və qaydalarını agentə öyrədin
          </p>
        </div>

        <div className="flex items-center gap-3">
          <GlassButton
            variant="primary"
            size="sm"
            onClick={handleFinish}
            disabled={!hasUserTurn || sending || finishing}
            leftIcon={<BookOpen className="h-4 w-4" />}
          >
            {finishing ? "Sənədlər çıxarılır..." : "Bitir və Sənədləri Yarat"}
          </GlassButton>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
          {error}
        </div>
      )}

      {/* ── CHAT CONTAINER ── */}
      <GlassCard className="bg-white/95 overflow-hidden flex flex-col h-[650px] shadow-sm">
        {/* Messages Scroll Area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-[#fafafa]/40"
        >
          {history.map((turn, idx) => {
            const isAssistant = turn.role === "assistant";
            return (
              <div
                key={idx}
                className={`flex gap-3.5 max-w-2xl ${
                  isAssistant ? "mr-auto items-start" : "ml-auto flex-row-reverse items-start"
                }`}
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                    isAssistant
                      ? "bg-[#0a0a0a] text-white"
                      : "bg-[#e5e5e5] text-[#0a0a0a]"
                  }`}
                >
                  {isAssistant ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>

                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isAssistant
                      ? "bg-white text-[#0a0a0a] border border-[#e5e5e5] shadow-xs"
                      : "bg-[#0a0a0a] text-white shadow-xs"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{turn.content}</p>
                </div>
              </div>
            );
          })}

          {sending && (
            <div className="flex gap-3.5 max-w-2xl mr-auto items-start">
              <div className="h-8 w-8 rounded-full bg-[#0a0a0a] text-white flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-[#e5e5e5] text-xs text-[#6b6b6b] flex items-center gap-1.5 shadow-xs">
                <span className="inline-block h-2 w-2 rounded-full bg-[#6b6b6b] animate-bounce" />
                <span className="inline-block h-2 w-2 rounded-full bg-[#6b6b6b] animate-bounce [animation-delay:0.2s]" />
                <span className="inline-block h-2 w-2 rounded-full bg-[#6b6b6b] animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>

        {/* Suggestion Pills */}
        <div className="p-3.5 border-t border-[#e5e5e5] bg-white flex flex-wrap gap-2 items-center">
          <span className="text-[11px] font-semibold text-[#6b6b6b] flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Nümunələr:
          </span>
          {PROMPT_SUGGESTIONS.map((sug, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => useSuggestion(sug)}
              className="text-[11px] bg-[#fafafa] hover:bg-[#0a0a0a] hover:text-white border border-[#e5e5e5] rounded-full px-3 py-1 text-[#0a0a0a] transition-all cursor-pointer truncate max-w-xs"
            >
              {sug}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={send}
          className="p-4 border-t border-[#e5e5e5] bg-white flex items-center gap-3"
        >
          <input
            type="text"
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending || finishing}
            placeholder="Biznesiniz haqqında sərbəst yazın..."
            className="flex-1 h-12 rounded-2xl border border-[#e5e5e5] px-4 text-xs sm:text-sm text-[#0a0a0a] placeholder:text-[#6b6b6b] focus:border-[#0a0a0a] focus:outline-none transition-colors"
          />

          <GlassButton
            type="submit"
            variant="primary"
            disabled={!input.trim() || sending || finishing}
            leftIcon={<Send className="h-4 w-4" />}
          >
            Göndər
          </GlassButton>
        </form>
      </GlassCard>
    </div>
  );
}
