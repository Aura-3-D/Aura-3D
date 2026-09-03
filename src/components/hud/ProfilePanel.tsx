import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { useAura } from "@/lib/store";
import { getMyTrust, type TrustInfo } from "@/lib/trust";

export function ProfilePanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const locale = useAura((s) => s.locale);
  const profile = useAura((s) => s.profile);
  const setProfile = useAura((s) => s.setProfile);
  const [draft, setDraft] = useState(profile);
  const [trust, setTrust] = useState<TrustInfo | null>(null);

  useEffect(() => {
    if (open) setDraft(profile);
  }, [open, profile]);

  useEffect(() => {
    if (!open) return;
    let live = true;
    void getMyTrust()
      .then((info) => {
        if (live) setTrust(info);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-end bg-bg/50 p-3 pt-[max(4.5rem,env(safe-area-inset-top))] backdrop-blur-sm sm:p-5">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label={t(locale, "closePanel")}
        onClick={onClose}
      />
      <form
        className="relative w-full max-w-md rounded-[24px] border border-border bg-bg-elevated p-5 shadow-[0_24px_80px_rgb(0_0_0/0.5)] sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          setProfile({
            name: draft.name.trim().slice(0, 80),
            personality: draft.personality.trim().slice(0, 600),
            interests: draft.interests.trim().slice(0, 600),
          });
          onClose();
        }}
      >
        <p className="text-[11px] font-medium tracking-[0.28em] text-muted">
          {t(locale, "you")}
        </p>
        <h2 className="font-display mt-1 text-3xl font-medium tracking-[-0.03em]">
          {t(locale, "profileTitle")}
        </h2>
        <p className="mt-2 text-sm text-muted">{t(locale, "profileHint")}</p>
        <div className="mt-4 overflow-visible rounded-2xl border border-border bg-bg px-4 py-3">
          <p className="text-[11px] tracking-[0.2em] text-muted">
            {t(locale, "trust")}
          </p>
          <p className="font-display mt-1 text-3xl tabular-nums">
            {trust ? trust.score : 0}
          </p>
          <p className="mt-1 text-xs leading-relaxed break-words text-subtle">
            {t(locale, "trustHint")}
          </p>
          {trust?.frozen ? (
            <p className="mt-2 text-xs leading-relaxed text-heart">
              {t(locale, "trustFrozen")}
            </p>
          ) : null}
        </div>
        <label className="mt-5 block text-xs tracking-wide text-muted">
          {t(locale, "yourName")}
          <input
            value={draft.name}
            maxLength={80}
            onChange={(event) =>
              setDraft((current) => ({ ...current, name: event.target.value }))
            }
            className="mt-1.5 h-11 w-full rounded-[14px] border border-border bg-bg px-3 text-sm text-fg outline-none focus-visible:ring-2 focus-visible:ring-fg/30"
          />
        </label>
        <label className="mt-4 block text-xs tracking-wide text-muted">
          {t(locale, "yourPersonality")}
          <textarea
            value={draft.personality}
            maxLength={600}
            rows={3}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                personality: event.target.value,
              }))
            }
            className="mt-1.5 w-full resize-none rounded-[14px] border border-border bg-bg px-3 py-2.5 text-sm text-fg outline-none focus-visible:ring-2 focus-visible:ring-fg/30"
          />
        </label>
        <label className="mt-4 block text-xs tracking-wide text-muted">
          {t(locale, "yourInterests")}
          <textarea
            value={draft.interests}
            maxLength={600}
            rows={3}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                interests: event.target.value,
              }))
            }
            className="mt-1.5 w-full resize-none rounded-[14px] border border-border bg-bg px-3 py-2.5 text-sm text-fg outline-none focus-visible:ring-2 focus-visible:ring-fg/30"
          />
        </label>
        <div className="mt-5 flex gap-2">
          <Button type="submit" className="flex-1">
            {t(locale, "profileSave")}
          </Button>
          <Button type="button" variant="glass" onClick={onClose}>
            {t(locale, "closePanel")}
          </Button>
        </div>
      </form>
    </div>
  );
}
