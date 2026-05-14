import { useState, useEffect, useRef } from "react";
import { Button } from "../shared/Button.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { analyzeSquad, sendTeamChat } from "../../services/ai.js";

const OPENING =
  "Ask about tactics, players, formations—or tap a suggestion below.";

const SUGGESTIONS = [
  "Where is this squad weakest?",
  "Suggest a starting XI mindset for this roster.",
  "Which young or high-potential players should I prioritise?",
];

export function TeamAiChatSection({ teamId, playerCount, isOwner }) {
  const { error: showError } = useToast();
  const [messages, setMessages] = useState([{ role: "assistant", content: OPENING }]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    setMessages([{ role: "assistant", content: OPENING }]);
    setInput("");
  }, [teamId]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isSending, isReportLoading]);

  const sendUserMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || !teamId || isSending || isReportLoading) return;

    const userMsg = { role: "user", content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setIsSending(true);
    try {
      const res = await sendTeamChat({ messages: next, teamId });
      const reply =
        typeof res.reply === "string" ? res.reply : String(res.reply ?? "");
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (err) {
      showError(err.message || "Message failed");
      setMessages([
        ...next,
        {
          role: "assistant",
          content: "Could not get a reply. Try again in a moment.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const runFullSquadReport = async () => {
    if (!teamId || playerCount < 1 || isReportLoading || isSending) return;
    const userMsg = {
      role: "user",
      content: "Generate a full tactical squad analysis report.",
    };
    const withUser = [...messages, userMsg];
    setMessages(withUser);
    setIsReportLoading(true);
    try {
      const res = await analyzeSquad(teamId);
      const text =
        typeof res.analysis === "string"
          ? res.analysis
          : String(res.analysis ?? "");
      setMessages([...withUser, { role: "assistant", content: text }]);
    } catch (err) {
      showError(err.message || "Report failed");
      setMessages([
        ...withUser,
        {
          role: "assistant",
          content: "Squad report could not be generated.",
        },
      ]);
    } finally {
      setIsReportLoading(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    void sendUserMessage(input);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendUserMessage(input);
    }
  };

  if (!isOwner) return null;

  return (
    <section className="bg-app-elevated rounded-lg border border-app-border flex flex-col min-h-[22rem] max-h-[32rem]">
      <div className="px-4 py-3 border-b border-app-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shrink-0">
        <h2 className="text-lg font-semibold text-app-text">Team assistant</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            isLoading={isReportLoading}
            disabled={playerCount < 1 || isSending}
            onClick={() => void runFullSquadReport()}
          >
            Full squad report
          </Button>
        </div>
      </div>

      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0"
        role="log"
        aria-live="polite"
      >
        {messages.map((m, i) => (
          <div
            key={`msg-${i}`}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[90%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap leading-relaxed ${
                m.role === "user"
                  ? "bg-app-text text-app-bg"
                  : "bg-app-elevated-light text-app-text-secondary border border-app-border"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {(isSending || isReportLoading) && (
          <div className="flex justify-start">
            <div className="rounded-lg px-3 py-2 text-sm text-app-text-muted border border-app-border bg-app-elevated-light">
              …
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-2 border-t border-app-border flex flex-wrap gap-2 shrink-0">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            disabled={isSending || isReportLoading}
            onClick={() => void sendUserMessage(s)}
            className="text-xs px-2 py-1 rounded-md border border-app-border text-app-text-secondary hover:bg-app-elevated-light hover:text-app-text transition-colors disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      <form
        onSubmit={onSubmit}
        className="p-3 border-t border-app-border flex gap-2 shrink-0"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Message…"
          rows={2}
          disabled={isSending || isReportLoading}
          className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm bg-app-bg border border-app-border text-app-text placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-app-text resize-none"
        />
        <Button
          type="submit"
          variant="primary"
          className="self-end shrink-0"
          disabled={isSending || isReportLoading || !input.trim()}
          isLoading={isSending}
        >
          Send
        </Button>
      </form>
    </section>
  );
}
