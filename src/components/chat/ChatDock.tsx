import { Mic, MicOff, Send } from "lucide-react";
import { useEffect, useRef, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";
import { useAura } from "@/lib/store";
import type { ChatMessage } from "@/lib/store";

type ChatDockProps = {
  messages: ChatMessage[];
  busy: boolean;
  busyLabel?: string;
  listening: boolean;
  canListen: boolean;
  error: string | null;
  onSend: (text: string) => void;
  onToggleMic: () => void;
};

export function ChatDock({
  messages,
  busy,
  busyLabel = "Listening…",
  listening,
  canListen,
  error,
  onSend,
  onToggleMic,
}: ChatDockProps) {
  const locale = useAura((s) => s.locale);
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    const value = inputRef.current?.value.trim() ?? "";
    if (!value || busy) return;
    onSend(value);
    if (inputRef.current) inputRef.current.value = "";
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const recent = messages.slice(-8);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
      <div className="pointer-events-auto mx-auto w-full max-w-2xl rounded-[28px] border border-border bg-bg/72 p-3 shadow-[0_20px_60px_rgb(0_0_0/0.45)] backdrop-blur-xl sm:p-4">
        <div
          ref={scroller}
          className="mb-3 max-h-[28vh] space-y-2.5 overflow-y-auto pr-1 sm:max-h-[32vh]"
        >
          {recent.map((message) => (
            <div
              key={message.id}
              className={cn(
                "max-w-[92%] text-sm leading-relaxed text-pretty",
                message.role === "user"
                  ? "ml-auto text-right text-muted"
                  : "text-fg",
              )}
            >
              {message.content}
              {message.image ? (
                <img
                  src={message.image}
                  alt=""
                  className="mt-2 max-h-56 w-full rounded-2xl object-cover"
                />
              ) : null}
            </div>
          ))}
          {busy ? (
            <p className="text-sm text-muted">{busyLabel}</p>
          ) : null}
        </div>

        {error ? (
          <p className="mb-2 text-xs text-heart" role="status">
            {error}
          </p>
        ) : null}

        <form onSubmit={submit} className="flex items-end gap-2">
          <Button
            type="button"
            variant={listening ? "heart" : "glass"}
            size="icon"
            aria-pressed={listening}
            aria-label={listening ? t(locale, "stopListen") : t(locale, "speak")}
            disabled={!canListen}
            onClick={onToggleMic}
          >
            {listening ? <MicOff /> : <Mic />}
          </Button>
          <label className="sr-only" htmlFor="aura-composer">
            {t(locale, "message")}
          </label>
          <textarea
            id="aura-composer"
            ref={inputRef}
            rows={1}
            disabled={busy}
            onKeyDown={onKeyDown}
            placeholder={
              listening ? t(locale, "placeholderListening") : t(locale, "placeholder")
            }
            suppressHydrationWarning
            className="min-h-11 max-h-28 flex-1 resize-none rounded-[16px] border border-border bg-bg-elevated px-3.5 py-2.5 text-sm text-fg outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-fg/30"
          />
          <Button type="submit" size="icon" disabled={busy} aria-label={t(locale, "send")}>
            <Send />
          </Button>
        </form>
      </div>
    </div>
  );
}
