import { Link } from "@tanstack/react-router";
import { Coins, Settings } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CHARACTER_TAGS, isCharacterId, stageFor } from "@/lib/characters";
import { characterCopy, searchCharacters } from "@/lib/character-copy";
import { t } from "@/lib/i18n";
import { listPublished } from "@/lib/publish";
import { useAura } from "@/lib/store";
import { AffectionBar } from "@/components/hud/AffectionBar";
import { LanguageSelect } from "@/components/hud/LanguageSelect";
import { ProfilePanel } from "@/components/hud/ProfilePanel";
import { ReportControl } from "@/components/hud/ReportControl";
import { SettingsPanel } from "@/components/hud/SettingsPanel";
import { UpvoteControl } from "@/components/hud/UpvoteControl";
import { AuthChip } from "@/components/auth/AuthChip";
import { AppNav } from "@/components/nav/AppNav";
import { Button } from "@/components/ui/button";
import { customAsCharacter } from "@/lib/custom-character";
import { getMyWallet } from "@/lib/wallet";

export function Lobby() {
  const companions = useAura((s) => s.companions);
  const locale = useAura((s) => s.locale);
  const customCharacters = useAura((s) => s.customCharacters);
  const publishedCatalog = useAura((s) => s.publishedCatalog);
  const setPublishedCatalog = useAura((s) => s.setPublishedCatalog);
  const [query, setQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [coins, setCoins] = useState<number | null>(null);

  useEffect(() => {
    let live = true;
    void listPublished()
      .then((res) => {
        if (live) setPublishedCatalog(res.cards);
      })
      .catch(() => undefined);
    void getMyWallet()
      .then((info) => {
        if (live) setCoins(info.coins);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [setPublishedCatalog]);

  const list = useMemo(() => {
    const built = searchCharacters(query, locale);
    const seen = new Set(built.map((c) => c.id));
    const published = [...publishedCatalog].sort(
      (a, b) => (b.upvotes ?? 0) - (a.upvotes ?? 0),
    );
    const localOnly = customCharacters.filter(
      (card) => !published.some((p) => p.id === card.id),
    );
    const extras = [...published, ...localOnly]
      .filter((card) => {
        if (seen.has(card.id)) return false;
        seen.add(card.id);
        return true;
      })
      .map(customAsCharacter);
    const q = query.trim().toLowerCase();
    const extra = q
      ? extras.filter((c) =>
          [c.name, c.tagline, c.bio, c.personality, c.lore]
            .join(" ")
            .toLowerCase()
            .includes(q),
        )
      : extras;
    return [...extra, ...built];
  }, [query, locale, customCharacters, publishedCatalog]);

  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-bg text-fg">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#163056,transparent_55%)]" />
      <div className="aura-grain" />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-5 pb-10 pt-8 sm:px-8">
        <header className="flex items-start justify-between gap-6">
          <div>
            <p className="text-[11px] font-medium tracking-[0.28em] text-muted">
              {t(locale, "companions")}
            </p>
            <h1 className="font-display mt-2 text-5xl font-medium tracking-[-0.03em] text-balance sm:text-6xl">
              aura-3d
            </h1>
            <AppNav />
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-2">
              <div className="sm:hidden">
                <AuthChip />
              </div>
              <Button
                variant="glass"
                size="sm"
                className="rounded-full"
                asChild
              >
                <Link to="/shop" aria-label={t(locale, "navShop")}>
                  <Coins />
                  <span className="tabular-nums text-xs">
                    {coins ?? "—"}
                  </span>
                </Link>
              </Button>
              <Button
                variant="glass"
                size="iconSm"
                className="rounded-full"
                aria-label={t(locale, "settings")}
                onClick={() => setSettingsOpen(true)}
              >
                <Settings />
              </Button>
              <Button
                variant="glass"
                size="sm"
                className="rounded-full"
                onClick={() => setProfileOpen(true)}
              >
                {t(locale, "you")}
              </Button>
              <LanguageSelect />
            </div>
            <p className="hidden max-w-[16rem] text-right text-sm leading-snug text-muted sm:block">
              {t(locale, "lobbyTagline")}
            </p>
          </div>
        </header>

        <label className="sr-only" htmlFor="aura-search">
          {t(locale, "search")}
        </label>
        <input
          id="aura-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t(locale, "search")}
          className="mt-8 h-12 w-full rounded-full border border-border bg-bg-elevated/80 px-5 text-sm text-fg outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-fg/30"
        />

        <section className="mt-8 grid flex-1 grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
          {list.map((character) => {
            const save = companions[character.id];
            const affection = save?.affection ?? 8;
            const stage = stageFor(affection);
            const copy = isCharacterId(character.id)
              ? characterCopy(character.id, locale)
              : { tagline: character.tagline };
            const tags = CHARACTER_TAGS[character.id as keyof typeof CHARACTER_TAGS] ?? [];
            const publishedCard = publishedCatalog.find((c) => c.id === character.id);
            const published = Boolean(publishedCard);
            const kind =
              character.tagline && tags.includes("fantastic")
                ? "fantastic"
                : customCharacters.find((c) => c.id === character.id)?.kind ??
                  publishedCatalog.find((c) => c.id === character.id)?.kind ??
                  (tags.includes("fantastic") ? "fantastic" : "realistic");
            return (
              <Link
                key={character.id}
                to="/c/$id"
                params={{ id: character.id }}
                className="group relative block rounded-[28px] bg-bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/40"
              >
                {published ? (
                  <div className="pointer-events-auto absolute end-3 top-3 z-10 flex items-center gap-1.5">
                    <UpvoteControl
                      cardId={character.id}
                      mine={publishedCard?.mine}
                      upvotes={publishedCard?.upvotes ?? 0}
                      voted={publishedCard?.voted ?? false}
                      onChange={(next) => {
                        setPublishedCatalog(
                          publishedCatalog.map((card) =>
                            card.id === character.id
                              ? { ...card, upvotes: next.upvotes, voted: next.voted }
                              : card,
                          ),
                        );
                      }}
                    />
                    <ReportControl cardId={character.id} mine={publishedCard?.mine} />
                  </div>
                ) : null}
                <div className="relative aspect-[3/4] overflow-hidden rounded-[28px]">
                  <img
                    src={character.portrait || "/favicon.svg"}
                    alt={character.name}
                    className="size-full object-cover transition-transform duration-500 ease-smooth-out group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                    <p className="text-[11px] tracking-[0.18em] text-muted">
                      {character.age} · {t(locale, stage.key)} · {t(locale, kind)}
                      {published ? ` · ${t(locale, "community")}` : ""}
                    </p>
                    <h2 className="font-display mt-1 text-3xl font-medium tracking-[-0.03em] xl:text-2xl">
                      {character.name}
                    </h2>
                    <p className="mt-2 max-w-[18ch] text-sm leading-snug text-fg/80">
                      {copy.tagline}
                    </p>
                    <div className="mt-4">
                      <AffectionBar
                        value={affection}
                        accent={character.accent}
                        compact
                      />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>

        {list.length === 0 ? (
          <p className="mt-10 text-center text-sm text-muted">
            {t(locale, "noResults")}
          </p>
        ) : null}

        <p className="mt-8 text-center text-sm text-subtle sm:text-left">
          {t(locale, "lobbyFooter")}
        </p>
      </div>
      <ProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </main>
  );
}
