import { useEffect, useRef, useState, type FormEvent } from "react";
import { finishRagChat, sendRagChatTurn, type RagChatTurn } from "../api/ragChat";
import type { RagDocument } from "../api/types";
import { apiErrorText } from "../lib/apiError";
import { Alert, Button, inputCls } from "./ui";
import { IconClose } from "./icons";

const GREETING =
  "Salam! Sizin biznesiniz haqqında bilmək istəyirəm ki, agent müştərilərinizə düzgün cavab verə bilsin. Əvvəlcə, iş saatlarınız necədir?";

/**
 * Bilik bazasını yazı ilə deyil, söhbətlə doldurmaq üçün. Sahib sərbəst yazır, köməkçi
 * (Gemini) növbəti sualı verir; "Bitir" basanda bütün söhbət bir dəfəyə oxunub RAG
 * sənədlərinə çevrilir (RagChatController.finish) - hər mesajdan sonra yox, çünki ucuzdur
 * və sahib bitmiş nəticəyə bir dəfəyə baxıb düzəldə bilir.
 */
export function RagChatModal({
  tenantId,
  onClose,
  onSaved,
}: {
  tenantId: string;
  onClose: () => void;
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
  }, [history]);

  const hasOwnerTurn = history.some((t) => t.role === "user");

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    const next = [...history, { role: "user" as const, content: text }];
    setHistory(next);
    setInput("");
    setSending(true);
    setError(null);
    try {
      const reply = await sendRagChatTurn(tenantId, next);
      setHistory([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      setError(apiErrorText(e, "Cavab alınmadı."));
      setHistory(next); // sahibin mesajı qalır, yenidən yaza bilər
    } finally {
      setSending(false);
    }
  };

  const finish = async () => {
    setFinishing(true);
    setError(null);
    try {
      const docs = await finishRagChat(tenantId, history);
      setCreated(docs);
    } catch (e) {
      setError(apiErrorText(e, "Söhbətdən məlumat çıxarıla bilmədi."));
    } finally {
      setFinishing(false);
    }
  };

  const done = () => {
    if (created) onSaved(created);
    onClose();
  };

  if (created) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={done}>
        <div
          className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-surface p-6 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="mb-1 text-base font-semibold text-fg">
            {created.length === 0 ? "Heç nə tapılmadı" : `${created.length} məlumat əlavə edildi`}
          </h2>
          <p className="mb-4 text-sm text-fg-muted">
            {created.length === 0
              ? "Söhbətdə bilik bazasına yazılası konkret fakt tapılmadı. Bağlayıb yenidən sınaya bilərsiniz."
              : "Bilik bazasına yazıldı. İstəsəniz hər birini sonra ayrıca redaktə edə bilərsiniz."}
          </p>
          {created.length > 0 && (
            <ul className="mb-4 space-y-3">
              {created.map((d) => (
                <li key={d.id} className="rounded-md border border-border bg-surface-2 p-3">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-fg-muted">
                    {d.category || "Digər"}
                  </p>
                  <p className="text-sm text-fg">{d.content}</p>
                </li>
              ))}
            </ul>
          )}
          <div className="flex justify-end">
            <Button onClick={done}>Bağla</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-lg border border-border bg-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-fg">Söhbətlə doldur</h2>
            <p className="mt-0.5 text-xs text-fg-muted">
              Sərbəst yazın - biznesinizi tanıdın, köməkçi növbəti sualı verəcək.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Bağla"
            className="-mr-1 -mt-0.5 rounded p-1 text-fg-muted transition-colors hover:text-fg"
          >
            <IconClose width={16} height={16} />
          </button>
        </div>

        <div ref={scrollRef} className="mb-3 max-h-[45vh] min-h-[200px] space-y-3 overflow-y-auto pr-1">
          {history.map((turn, i) => (
            <div key={i} className={turn.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <p
                className={
                  turn.role === "user"
                    ? "max-w-[80%] rounded-lg rounded-br-sm bg-accent px-3 py-2 text-sm text-accent-fg"
                    : "max-w-[80%] rounded-lg rounded-bl-sm bg-surface-2 px-3 py-2 text-sm text-fg"
                }
              >
                {turn.content}
              </p>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <p className="rounded-lg rounded-bl-sm bg-surface-2 px-3 py-2 text-sm text-fg-faint">…</p>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-3">
            <Alert tone="err">{error}</Alert>
          </div>
        )}

        <form onSubmit={send} className="flex gap-2">
          <input
            autoFocus
            className={inputCls}
            placeholder="Yazın…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending || finishing}
          />
          <Button type="submit" disabled={!input.trim() || sending || finishing}>
            Göndər
          </Button>
        </form>

        <div className="mt-3 flex justify-end gap-2 border-t border-border pt-3">
          <Button variant="ghost" onClick={onClose} disabled={finishing}>
            Ləğv et
          </Button>
          <Button onClick={finish} loading={finishing} disabled={!hasOwnerTurn || sending}>
            Bitir və yadda saxla
          </Button>
        </div>
      </div>
    </div>
  );
}
