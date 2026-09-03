import { Heart } from "lucide-react";
import { stageFor } from "@/lib/characters";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";
import { useAura } from "@/lib/store";

export function AffectionBar({
  value,
  accent,
  compact = false,
}: {
  value: number;
  accent: string;
  compact?: boolean;
}) {
  const locale = useAura((s) => s.locale);
  const stage = stageFor(value);
  const intimate = value >= 80;
  return (
    <div className={cn("flex items-center gap-3", compact && "gap-2")}>
      <Heart
        className={cn("size-4 shrink-0", intimate ? "fill-heart text-heart" : "text-fg")}
        strokeWidth={1.75}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs font-medium tracking-wide text-fg">
            {t(locale, stage.key)}
          </span>
          <span className="font-mono text-[11px] tabular-nums text-muted">
            {Math.round(value)}
          </span>
        </div>
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-fg/12">
          <div
            className="h-full rounded-full transition-[width] duration-500 ease-smooth-out"
            style={{
              width: `${Math.max(2, value)}%`,
              background: intimate ? "var(--color-heart)" : accent,
            }}
          />
        </div>
      </div>
    </div>
  );
}
