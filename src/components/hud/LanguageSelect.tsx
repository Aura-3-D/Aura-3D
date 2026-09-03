import { LOCALES, LOCALE_META, t, type Locale } from "@/lib/i18n";
import { useAura } from "@/lib/store";
import { cn } from "@/lib/cn";
import { ChevronDown } from "lucide-react";

export function LanguageSelect({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const locale = useAura((s) => s.locale);
  const setLocale = useAura((s) => s.setLocale);

  return (
    <label className={cn("relative inline-flex items-center", className)}>
      <span className="sr-only">{t(locale, "language")}</span>
      <select
        value={locale}
        aria-label={t(locale, "language")}
        onChange={(event) => setLocale(event.target.value as Locale)}
        className={cn(
          "h-9 max-w-[10.5rem] cursor-pointer appearance-none rounded-full border border-border bg-bg/55 pe-8 ps-3 text-xs font-medium tracking-wide text-fg backdrop-blur-md outline-none focus-visible:ring-2 focus-visible:ring-fg/40",
          compact && "bg-bg-elevated/70",
        )}
      >
        {LOCALES.map((code) => (
          <option key={code} value={code}>
            {LOCALE_META[code].native}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute end-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
    </label>
  );
}
