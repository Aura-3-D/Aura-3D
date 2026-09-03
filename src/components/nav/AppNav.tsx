import { Link } from "@tanstack/react-router";
import { AuthChip } from "@/components/auth/AuthChip";
import { t } from "@/lib/i18n";
import { useAura } from "@/lib/store";

export function AppNav() {
  const locale = useAura((s) => s.locale);
  const link =
    "rounded-full px-3 py-2 text-sm text-muted transition-colors hover:text-fg";
  return (
    <nav className="mt-5 flex flex-wrap items-center gap-1">
      <Link to="/" className={link} activeProps={{ className: "text-fg" }}>
        {t(locale, "companions")}
      </Link>
      <Link to="/group" className={link} activeProps={{ className: "text-fg" }}>
        {t(locale, "navGroup")}
      </Link>
      <Link
        to="/workplace"
        className={link}
        activeProps={{ className: "text-fg" }}
      >
        {t(locale, "navWork")}
      </Link>
      <Link to="/shop" className={link} activeProps={{ className: "text-fg" }}>
        {t(locale, "navShop")}
      </Link>
      <div className="ms-auto hidden sm:block">
        <AuthChip />
      </div>
    </nav>
  );
}
