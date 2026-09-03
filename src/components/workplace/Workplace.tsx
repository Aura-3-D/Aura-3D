import { Link } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LanguageSelect } from "@/components/hud/LanguageSelect";
import { SettingsPanel } from "@/components/hud/SettingsPanel";
import { AppNav } from "@/components/nav/AppNav";
import { Button } from "@/components/ui/button";
import { CHARACTER_LIST } from "@/lib/characters";
import {
  exportCard,
  parseCustomCard,
  slugify,
  VOICE_IDS,
  type CustomCard,
} from "@/lib/custom-character";
import { t } from "@/lib/i18n";
import { unpublishCharacter, listPublished } from "@/lib/publish";
import { useAura } from "@/lib/store";

const emptyDraft = (): Omit<CustomCard, "id" | "schema" | "createdAt"> => ({
  name: "",
  age: 24,
  voiceId: "eve",
  tagline: "",
  bio: "",
  greeting: "",
  personality: "",
  lore: "",
  systemPrompt: "",
  tags: ["realistic"],
  kind: "realistic",
  accent: "#9ec4ea",
  portrait: "",
});

export function Workplace() {
  const locale = useAura((s) => s.locale);
  const customCharacters = useAura((s) => s.customCharacters);
  const publishedCatalog = useAura((s) => s.publishedCatalog);
  const upsertCustom = useAura((s) => s.upsertCustom);
  const removeCustom = useAura((s) => s.removeCustom);
  const dropPublished = useAura((s) => s.dropPublished);
  const setPublishedCatalog = useAura((s) => s.setPublishedCatalog);
  const [draft, setDraft] = useState(emptyDraft);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    let live = true;
    void listPublished()
      .then((res) => {
        if (live) setPublishedCatalog(res.cards);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [setPublishedCatalog]);

  function setField<K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function create() {
    setError(null);
    setBusy(true);
    const card = parseCustomCard({
      ...draft,
      id: slugify(draft.name),
      tags: draft.tags,
    });
    if (!card) {
      setBusy(false);
      setError("Need a name.");
      return;
    }
    try {
      const res = await fetch("/api/workplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(card),
      });
      const payload = (await res.json().catch(() => null)) as {
        error?: string;
        card?: CustomCard;
      } | null;
      if (!res.ok || !payload?.card) {
        throw new Error(payload?.error || t(locale, "tooFast"));
      }
      upsertCustom({ ...payload.card, portrait: draft.portrait });
      setDraft(emptyDraft());
    } catch (err) {
      setError(err instanceof Error ? err.message : t(locale, "tooFast"));
    } finally {
      setBusy(false);
    }
  }

  function download(card: CustomCard) {
    const blob = new Blob([exportCard(card, false)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${card.name.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function onImport(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const card = parseCustomCard({
          ...parsed,
          id: parsed.id && String(parsed.id).startsWith("custom-")
            ? parsed.id
            : slugify(String(parsed.name ?? "oc")),
        });
        if (!card) throw new Error("Bad JSON");
        upsertCustom(card);
        setError(null);
      } catch {
        setError("Bad JSON");
      }
    };
    reader.readAsText(file);
  }

  const fileRef = useRef<HTMLInputElement>(null);

  async function publish(_card: CustomCard) {
    setError(t(locale, "publishOff"));
  }

  async function unpublish(id: string) {
    setError(null);
    try {
      await unpublishCharacter({ data: id });
      dropPublished(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : t(locale, "tooFast"));
    }
  }

  return (
    <main className="relative min-h-dvh bg-bg text-fg">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#163056,transparent_55%)]" />
      <div className="relative mx-auto w-full max-w-3xl px-5 py-8 sm:px-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium tracking-[0.28em] text-muted">
              aura-3d
            </p>
            <h1 className="font-display mt-2 text-4xl font-medium tracking-[-0.03em]">
              {t(locale, "workplaceTitle")}
            </h1>
            <AppNav />
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="glass"
                size="iconSm"
                className="rounded-full"
                aria-label={t(locale, "settings")}
                onClick={() => setSettingsOpen(true)}
              >
                <Settings />
              </Button>
              <LanguageSelect />
            </div>
          </div>
        </header>
        <p className="mt-6 max-w-xl text-sm text-muted">{t(locale, "workplaceHint")}</p>
        <p className="mt-1 text-xs text-subtle">{t(locale, "createOnce")}</p>
        <p className="mt-1 text-xs text-subtle">{t(locale, "publishHint")}</p>
        <p className="mt-1 text-xs text-subtle">{t(locale, "publishMin")}</p>

        <div className="mt-6 grid gap-3">
          <Field label={t(locale, "fieldName")}>
            <input
              value={draft.name}
              maxLength={40}
              onChange={(e) => setField("name", e.target.value)}
              className="field"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t(locale, "fieldAge")}>
              <input
                type="number"
                min={18}
                max={80}
                value={draft.age}
                onChange={(e) => setField("age", Number(e.target.value))}
                className="field"
              />
            </Field>
            <Field label={t(locale, "fieldVoice")}>
              <select
                value={draft.voiceId}
                onChange={(e) => setField("voiceId", e.target.value)}
                className="field"
              >
                {VOICE_IDS.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label={t(locale, "fieldKind")}>
            <select
              value={draft.kind}
              onChange={(e) =>
                setField("kind", e.target.value === "fantastic" ? "fantastic" : "realistic")
              }
              className="field"
            >
              <option value="realistic">{t(locale, "realistic")}</option>
              <option value="fantastic">{t(locale, "fantastic")}</option>
            </select>
          </Field>
          <Field label={t(locale, "fieldTagline")}>
            <input
              value={draft.tagline}
              maxLength={120}
              onChange={(e) => setField("tagline", e.target.value)}
              className="field"
            />
          </Field>
          <Field label={t(locale, "fieldGreeting")}>
            <textarea
              value={draft.greeting}
              rows={2}
              onChange={(e) => setField("greeting", e.target.value)}
              className="field min-h-[4.5rem]"
            />
          </Field>
          <Field label={t(locale, "fieldBio")}>
            <textarea
              value={draft.bio}
              rows={2}
              onChange={(e) => setField("bio", e.target.value)}
              className="field min-h-[4.5rem]"
            />
          </Field>
          <Field label={t(locale, "fieldPersonality")}>
            <textarea
              value={draft.personality}
              rows={2}
              onChange={(e) => setField("personality", e.target.value)}
              className="field min-h-[4.5rem]"
            />
          </Field>
          <Field label={t(locale, "fieldLore")}>
            <textarea
              value={draft.lore}
              rows={2}
              onChange={(e) => setField("lore", e.target.value)}
              className="field min-h-[4.5rem]"
            />
          </Field>
          <Field label={t(locale, "fieldPrompt")}>
            <textarea
              value={draft.systemPrompt}
              rows={4}
              onChange={(e) => setField("systemPrompt", e.target.value)}
              className="field min-h-[7rem]"
            />
          </Field>
          <Field label={t(locale, "fieldTags")}>
            <input
              value={draft.tags.join(", ")}
              onChange={(e) =>
                setField(
                  "tags",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
              className="field"
            />
          </Field>
        </div>

        {error ? <p className="mt-4 text-sm text-heart">{error}</p> : null}

        <div className="mt-6 flex flex-wrap gap-2">
          <Button type="button" disabled={busy} onClick={() => void create()}>
            {t(locale, "makeCharacter")}
          </Button>
          <Button
            type="button"
            variant="glass"
            onClick={() => fileRef.current?.click()}
          >
            {t(locale, "importJson")}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onImport(file);
              event.target.value = "";
            }}
          />
        </div>

        <h2 className="font-display mt-12 text-2xl">{t(locale, "yourOcs")}</h2>
        <ul className="mt-4 space-y-3">
          {customCharacters.map((card) => (
            <li
              key={card.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-bg-elevated px-4 py-3"
            >
              <Link to="/c/$id" params={{ id: card.id }} className="min-w-0">
                <p className="truncate font-medium">{card.name}</p>
                <p className="truncate text-sm text-muted">{card.tagline}</p>
              </Link>
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="glass"
                  size="sm"
                  disabled={publishingId === card.id}
                  onClick={() => void publish(card)}
                >
                  {publishingId === card.id
                    ? t(locale, "publishing")
                    : t(locale, "publish")}
                </Button>
                <Button variant="glass" size="sm" onClick={() => download(card)}>
                  {t(locale, "exportJson")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCustom(card.id)}
                >
                  {t(locale, "deleteCharacter")}
                </Button>
              </div>
            </li>
          ))}
        </ul>

        {publishedCatalog.some((c) => c.mine) || publishedCatalog.length ? (
          <>
            <h2 className="font-display mt-12 text-2xl">{t(locale, "community")}</h2>
            <ul className="mt-4 space-y-3">
              {publishedCatalog.map((card) => (
                <li
                  key={card.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-bg-elevated px-4 py-3"
                >
                  <Link to="/c/$id" params={{ id: card.id }} className="min-w-0">
                    <p className="truncate font-medium">{card.name}</p>
                    <p className="truncate text-sm text-muted">
                      {t(locale, "published")} · {card.tagline}
                    </p>
                  </Link>
                  {card.mine ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void unpublish(card.id)}
                    >
                      {t(locale, "unpublish")}
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          </>
        ) : null}

        <h2 className="font-display mt-10 text-2xl">{t(locale, "companions")}</h2>
        <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CHARACTER_LIST.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="w-full rounded-xl border border-border px-3 py-2 text-left text-sm hover:bg-fg/5"
                onClick={() => download({
                  schema: "aura-3d-character-v1",
                  id: `custom-${c.id}-copy`,
                  name: c.name,
                  age: c.age,
                  voiceId: c.voiceId,
                  tagline: c.tagline,
                  bio: c.bio,
                  greeting: c.greeting,
                  personality: c.personality,
                  lore: c.lore,
                  systemPrompt: c.systemPrompt,
                  tags: [c.id],
                  kind: "realistic",
                  accent: c.accent,
                  portrait: "",
                  createdAt: Date.now(),
                })}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs tracking-wide text-muted">
      {label}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
