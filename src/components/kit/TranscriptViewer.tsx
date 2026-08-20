import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  User,
  Search,
  Copy,
  Check,
} from "lucide-react";
import { GlassCard } from "./GlassCard";
import { GlassButton } from "./GlassButton";
import { cx } from "./styles";

export interface MessageItem {
  id: string;
  speaker: "customer" | "agent";
  text: string;
  time: string;
  latencyMs?: number;
}

export interface TranscriptViewerProps {
  messages?: MessageItem[];
  intent?: string;
  summary?: string;
  className?: string;
}

const DEFAULT_MESSAGES: MessageItem[] = [
  {
    id: "1",
    speaker: "customer",
    text: "Salam, sabah saat 19:00 üçün 4 nəfərlik masa rezerv etmək istəyirdim.",
    time: "11:42:04",
  },
  {
    id: "2",
    speaker: "agent",
    text: "Salam! Bəli, sabah 19:00 üçün əsas zalda və terrasda masamız mövcuddur. Adınızı və əlaqə nömrənizi qeyd edirəm zəhmət olmasa.",
    time: "11:42:07",
    latencyMs: 290,
  },
  {
    id: "3",
    speaker: "customer",
    text: "Əla, Rəşad adına terrasda qeyd edin.",
    time: "11:42:15",
  },
  {
    id: "4",
    speaker: "agent",
    text: "Oldu, Rəşad bəy. Sabah saat 19:00 üçün terrasda 4 nəfərlik rezervasiyanız təsdiqləndi. Təsdiq SMS-i bu nömrənizə göndərildi. Təşəkkür edirik!",
    time: "11:42:18",
    latencyMs: 310,
  },
];

export function TranscriptViewer({
  messages = DEFAULT_MESSAGES,
  intent = "Masa Rezervasiyası Sorğusu",
  summary = "Müştəri 4 nəfərlik masa rezerv etdi. Təsdiq SMS-i göndərildi.",
  className,
}: TranscriptViewerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  const filteredMessages = messages.filter((m) =>
    m.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopy = () => {
    const fullText = messages
      .map(
        (m) =>
          `[${m.time}] ${m.speaker === "agent" ? "Voint AI" : "Müştəri"}: ${m.text}`
      )
      .join("\n");
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <GlassCard className={cx("flex flex-col bg-white border-[#e5e5e5]", className)}>
      {/* Header with Search & Copy */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b border-[#e5e5e5] bg-[#fafafa]">
        <div>
          <h4 className="text-sm font-semibold text-[#0a0a0a]">
            Dialoq Transkripsiyası
          </h4>
          <p className="text-xs text-[#6b6b6b] mt-0.5">
            {messages.length} replika, Soniox STT
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6b6b6b]" />
            <input
              type="text"
              placeholder="Axtar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8.5 w-36 sm:w-44 rounded-full border border-[#e5e5e5] bg-white pl-8 pr-3 text-xs text-[#0a0a0a] placeholder:text-[#6b6b6b] focus:border-[#0a0a0a] focus:outline-none transition-colors"
            />
          </div>

          <GlassButton
            size="xs"
            variant="secondary"
            onClick={handleCopy}
            leftIcon={
              copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )
            }
          >
            {copied ? "Kopyalandı" : "Kopyala"}
          </GlassButton>
        </div>
      </div>

      {/* Summary Box */}
      <div className="p-4 border-b border-[#e5e5e5] bg-white">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-[#0a0a0a]">Mövzu:</span>
          <span className="text-[#6b6b6b]">{intent}</span>
        </div>
        <p className="text-xs text-[#6b6b6b] mt-1">{summary}</p>
      </div>

      {/* Chat Messages Flow */}
      <div className="p-5 sm:p-6 space-y-4 max-h-[400px] overflow-y-auto bg-[#fafafa]">
        <AnimatePresence>
          {filteredMessages.map((msg, idx) => {
            const isAgent = msg.speaker === "agent";

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className={cx(
                  "flex items-start gap-3",
                  isAgent ? "flex-row-reverse" : "flex-row"
                )}
              >
                {/* Avatar Icon */}
                <div
                  className={cx(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs",
                    isAgent
                      ? "bg-[#0a0a0a] text-white"
                      : "bg-[#e5e5e5] text-[#0a0a0a]"
                  )}
                >
                  {isAgent ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={cx(
                    "max-w-[84%] sm:max-w-[72%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed border",
                    isAgent
                      ? "bg-white border-[#e5e5e5] text-[#0a0a0a] rounded-tr-xs shadow-xs"
                      : "bg-[#f5f5f5] border-[#e5e5e5] text-[#0a0a0a] rounded-tl-xs"
                  )}
                >
                  <div className="flex items-center justify-between gap-4 mb-1 text-[11px] text-[#6b6b6b]">
                    <span className="font-medium text-[#0a0a0a]">
                      {isAgent ? "Voint AI" : "Müştəri"}
                    </span>
                    <div className="flex items-center gap-2 font-mono text-[10px]">
                      {isAgent && msg.latencyMs && (
                        <span className="text-emerald-600">{msg.latencyMs}ms</span>
                      )}
                      <span>{msg.time}</span>
                    </div>
                  </div>

                  <p className="text-[#0a0a0a]">{msg.text}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </GlassCard>
  );
}
