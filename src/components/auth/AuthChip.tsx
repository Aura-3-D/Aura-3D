import { Link } from "@tanstack/react-router";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { t } from "@/lib/i18n";
import { useAura } from "@/lib/store";

export function AuthChip() {
  const locale = useAura((s) => s.locale);
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return <div className="h-9 w-9 animate-pulse rounded-full bg-fg/10" />;
  }
  if (!user) {
    return (
      <Link
        to="/login"
        className="rounded-full border border-border px-3 py-2 text-sm text-muted hover:text-fg"
      >
        {t(locale, "signInTitle")}
      </Link>
    );
  }
  return (
    <div className="max-w-[12rem] truncate text-fg [&_button]:text-muted [&_span]:text-xs">
      <UserButton />
    </div>
  );
}
