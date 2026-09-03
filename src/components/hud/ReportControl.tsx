import { Flag } from "lucide-react";
import { useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { t, type Locale } from "@/lib/i18n";
import { reportPublished, type ReportReason } from "@/lib/report";
import { useAura } from "@/lib/store";

const REASON_KEYS: {
  key: ReportReason;
  label: "reportIllegal" | "reportNoncon" | "reportExtreme" | "reportOther";
}[] = [
  { key: "illegal", label: "reportIllegal" },
  { key: "noncon", label: "reportNoncon" },
  { key: "extreme", label: "reportExtreme" },
  { key: "other", label: "reportOther" },
];

function halt(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
}

export function ReportControl({
  cardId,
  mine,
}: {
  cardId: string;
  mine?: boolean;
}) {
  const locale: Locale = useAura((s) => s.locale);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  if (mine || !cardId.startsWith("custom-p-")) return null;

  async function send(reason: ReportReason) {
    setBusy(true);
    setNote(null);
    try {
      const res = await reportPublished({ data: { cardId, reason } });
      if (!res.ok) {
        setNote(res.error);
        return;
      }
      setNote(t(locale, "reportReceived"));
      setOpen(false);
    } catch {
      setNote(t(locale, "tooFast"));
    } finally {
      setBusy(false);
    }
  }

  const overlay =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[70] flex items-end justify-center bg-bg/55 p-4 pt-[max(1rem,env(safe-area-inset-top))] sm:items-center"
            onClick={(event) => {
              halt(event);
              if (!busy) setOpen(false);
            }}
          >
            <div
              className="w-full max-w-sm rounded-[24px] border border-border bg-bg-elevated p-4 shadow-[0_24px_80px_rgb(0_0_0/0.5)]"
              onClick={halt}
            >
              <p className="text-[11px] font-medium tracking-[0.28em] text-muted">
                {t(locale, "report")}
              </p>
              <div className="mt-3 grid gap-1">
                {REASON_KEYS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    disabled={busy}
                    className="block w-full rounded-xl px-3 py-3 text-left text-sm text-fg hover:bg-fg/8 disabled:opacity-40"
                    onClick={(event) => {
                      halt(event);
                      void send(item.key);
                    }}
                  >
                    {t(locale, item.label)}
                  </button>
                ))}
              </div>
              <Button
                type="button"
                variant="glass"
                className="mt-3 w-full"
                disabled={busy}
                onClick={(event) => {
                  halt(event);
                  setOpen(false);
                }}
              >
                {t(locale, "closePanel")}
              </Button>
            </div>
          </div>,
          document.body,
        )
      : null;

  const toast =
    note && !open && typeof document !== "undefined"
      ? createPortal(
          <p className="fixed inset-x-4 bottom-6 z-[70] mx-auto max-w-sm rounded-2xl border border-border bg-bg-elevated px-4 py-3 text-center text-xs leading-relaxed text-muted shadow-[0_16px_40px_rgb(0_0_0/0.45)] sm:inset-x-auto sm:end-5 sm:bottom-8 sm:text-start">
            {note}
          </p>,
          document.body,
        )
      : null;

  return (
    <div className="relative">
      <Button
        type="button"
        variant="glass"
        size="iconSm"
        aria-label={t(locale, "report")}
        disabled={busy}
        onClick={(event) => {
          halt(event);
          setNote(null);
          setOpen((value) => !value);
        }}
      >
        <Flag />
      </Button>
      {overlay}
      {toast}
    </div>
  );
}
