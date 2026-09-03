import { useEffect } from "react";
import { LOCALE_META } from "@/lib/i18n";
import { useAura } from "@/lib/store";

export function PersistHydrate() {
  const locale = useAura((s) => s.locale);

  useEffect(() => {
    void useAura.persist.rehydrate();
  }, []);

  useEffect(() => {
    const meta = LOCALE_META[locale];
    document.documentElement.lang = locale;
    document.documentElement.dir = meta.dir;
  }, [locale]);

  return null;
}
