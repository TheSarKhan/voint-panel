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
import { getRagDocuments } from "../api/rag";
import { getQuestions } from "../api/questions";
import type { RagDocument } from "../api/types";
import { apiErrorText } from "../lib/apiError";
import { useTenantStore } from "../store/tenant";
import {
  GlassButton,
  GlassCard,
  StatusText,
} from "./kit";

function getIndustryScenarios(businessName: string, domain?: string): string[] {
  const text = `${businessName} ${domain ?? ""}`.toLowerCase();

  if (text.includes("klinik") || text.includes("dental") || text.includes("stomatolog") || text.includes("tibb") || text.includes("sağlam")) {
    return [
      "Sığorta qəbul olunurmu (Paşa Sığorta, Atəşgah, Qala)?",
      "Kəskin diş ağrısı ilə zəng edənə təcili növbəsiz baxış varmı?",
      "İmplantasiya və plomblara neçə il rəsmi zəmanət verilir?",
      "Uşaq müayinəsi üçün xüsusi həkim və anesteziya şərtləri nədir?",
    ];
  }

  if (text.includes("texnika") || text.includes("avto") || text.includes("kran") || text.includes("icarə") || text.includes("servis") || text.includes("ces")) {
    return [
      "Texnikanın çatdırılması və operator xərci icarə qiymətinə daxildir?",
      "İcarə zamanı texnika sıradan çıxarsa nə qədər müddətə dəyişdirilir?",
      "Minimum icarə müddəti və ilkin beh (depozit) qaydası necədir?",
      "Rayonlara və şəhərdən kənar obyektlərə göndəriş mümkündürmü?",
    ];
  }

  if (text.includes("restoran") || text.includes("kafe") || text.includes("lounge") || text.includes("pub") || text.includes("catering")) {
    return [
      "Masa bronu üçün depozit tələb olunurmu və neçə gün əvvəl edilməlidir?",
      "Terras və ya VIP otaq üçün xüsusi minimum hesab limiti varmı?",
      "Menyuda vegetarian, halal və ya allergiyalı şəxslər üçün seçimlər varmı?",
      "Ad günü və korporativ tədbirlərdə tort gətirmək və ya xüsusi endirim varmı?",
    ];
  }

  // General B2B / Services
  return [
    "Müştəri görüşə 15 dəqiqədən çox gecikərsə və ya gəlməzsə qayda necədir?",
    "Xidmətlər üçün taksit (BirKart, TamKart) və ya hissə-hissə ödəniş varmı?",
    "Qeyri-iş vaxtı və ya bayram günlərində təcili əlaqə nömrəsi mövcuddurmu?",
    "Görülən xidmətə zəmanət verilirmi və şikayətlər necə araşdırılır?",
  ];
}

export function RagChatInternalView({
  tenantId,
  onBack,
  onSaved,
}: {
  tenantId: string;
  onBack: () => void;
  onSaved: (docs: RagDocument[]) => void;
}) {
  const tenant = useTenantStore((s) => s.tenant);
  const [history, setHistory] = useState<RagChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<RagDocument[] | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [scenarios, setScenarios] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize smart starting prompt based on existing knowledge base gaps and tenant profile
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getRagDocuments(tenantId).catch(() => []),
      getQuestions(tenantId, "OPEN").catch(() => []),
    ]).then(([docs, questions]) => {
      if (cancelled) return;

      const businessName = tenant?.name ?? "müəssisəniz";
      const domain = tenant?.config?.sttDomain;
      const dynamicPills = getIndustryScenarios(businessName, domain);
      setScenarios(dynamicPills);

      let openingMessage = "";
      if (questions.length > 0) {
        openingMessage = `Salam! ${businessName} üçün bilik bazasını analiz etdim. Real zənglərdə müştərilərin cavab ala bilmədiyi bu sual qeydə alınıb: "${questions[0].question}". Bu situasiyaya agentin necə cavab verməsini istərdiniz?`;
      } else if (docs.length > 0) {
        openingMessage = `Salam! ${businessName} üçün mövcud bilik bazasını nəzərdən keçirdim (əsas məlumatlar artıq məlumdur). Gəlin müştərilərinizin zəngdə verə biləcəyi ən vacib fərdi situasiyaları aydınlaşdıraq: Məsələn, ${dynamicPills[0].toLowerCase()}`;
      } else {
        openingMessage = `Salam! ${businessName} üçün səsli AI agentə sahənizə uyğun məlumat öyrətməkdə sizə kömək edəcəyəm. Gəlin əsas xidmətləriniz, iş qrafikiniz, qiymət siyasətiniz və müştərilərə tətbiq olunan xüsusi qaydalardan başlayaq.`;
      }

      setHistory([{ role: "assistant", content: openingMessage }]);
      setInitialized(true);
    });

    return () => {
      cancelled = true;
    };
  }, [tenantId, tenant]);

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
            Ağıllı Bilik Bazası Köməkçisi
          </h1>
          <p className="text-xs sm:text-sm text-[#6b6b6b] mt-1">
            {tenant?.name ? `${tenant.name} sahəsinə uyğun ` : ""}təkrarsız, dərin və spesifik müştəri situasiyalarını agentə öyrədin
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

        {/* Dynamic Industry Scenario Suggestion Pills */}
        <div className="p-3.5 border-t border-[#e5e5e5] bg-white flex flex-wrap gap-2 items-center">
          <span className="text-[11px] font-semibold text-[#6b6b6b] flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Sahəyə xas suallar:
          </span>
          {scenarios.map((sug, idx) => (
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
            disabled={sending || finishing || !initialized}
            placeholder="Məsələ haqqında qaydanı və ya cavabı yazın..."
            className="flex-1 h-12 rounded-2xl border border-[#e5e5e5] px-4 text-xs sm:text-sm text-[#0a0a0a] placeholder:text-[#6b6b6b] focus:border-[#0a0a0a] focus:outline-none transition-colors"
          />

          <GlassButton
            type="submit"
            variant="primary"
            disabled={!input.trim() || sending || finishing || !initialized}
            leftIcon={<Send className="h-4 w-4" />}
          >
            Göndər
          </GlassButton>
        </form>
      </GlassCard>
    </div>
  );
}
