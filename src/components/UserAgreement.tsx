import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { LanguageSelect } from "@/components/hud/LanguageSelect";
import { t } from "@/lib/i18n";
import { useAura } from "@/lib/store";

export function UserAgreement({ children }: { children: ReactNode }) {
  const accepted = useAura((s) => s.acceptedTerms);
  const acceptTerms = useAura((s) => s.acceptTerms);
  const locale = useAura((s) => s.locale);
  const [ready, setReady] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let live = true;
    void Promise.resolve(useAura.persist.rehydrate()).then(() => {
      if (live) setReady(true);
    });
    return () => {
      live = false;
    };
  }, []);

  if (ready && accepted) return children;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-bg px-5">
      <div className="aura-grain pointer-events-none absolute inset-0" />
      <div className="absolute end-4 top-4 z-[90] sm:end-6 sm:top-6">
        <LanguageSelect />
      </div>
      <div className="relative w-full max-w-lg rounded-[28px] border border-border bg-bg-elevated p-6 shadow-[0_24px_80px_rgb(0_0_0/0.55)] sm:p-8">
        <p className="text-[11px] font-medium tracking-[0.28em] text-muted">
          {t(locale, "agreementKicker")}
        </p>
        <h1 className="font-display mt-2 text-4xl font-medium tracking-[-0.03em]">
          {t(locale, "agreementTitle")}
        </h1>
        <div className="mt-5 space-y-3 text-sm leading-relaxed text-fg/85">
          <p>{t(locale, "agreementP1")}</p>
          <p>{t(locale, "agreementP2")}</p>
          <p>{t(locale, "agreementP3")}</p>
          <p className="text-muted">{t(locale, "agreementP4")}</p>
        </div>
        <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => setChecked(event.target.checked)}
            suppressHydrationWarning
            className="mt-1 size-4 accent-[#6b93c9]"
          />
          <span>{t(locale, "agreementCheck")}</span>
        </label>
        <Button
          className="mt-5 w-full"
          disabled={!checked}
          onClick={() => acceptTerms()}
        >
          {t(locale, "enterAura")}
        </Button>
      </div>
    </div>
  );
}
