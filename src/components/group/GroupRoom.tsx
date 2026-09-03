import { useRef, useState } from "react";
import { LanguageSelect } from "@/components/hud/LanguageSelect";
import { AppNav } from "@/components/nav/AppNav";
import { Button } from "@/components/ui/button";
import { CHARACTER_LIST, bondScaleFor, parseMeta } from "@/lib/characters";
import { customAsCharacter } from "@/lib/custom-character";
import { t } from "@/lib/i18n";
import { useAura } from "@/lib/store";

export function GroupRoom() {
  const locale = useAura((s) => s.locale);
  const profile = useAura((s) => s.profile);
  const customCharacters = useAura((s) => s.customCharacters);
  const publishedCatalog = useAura((s) => s.publishedCatalog);
  const companions = useAura((s) => s.companions);
  const group = useAura((s) => s.group);
  const setGroupMembers = useAura((s) => s.setGroupMembers);
  const setTurnTaking = useAura((s) => s.setTurnTaking);
  const addGroupMessage = useAura((s) => s.addGroupMessage);
  const updateGroupMessage = useAura((s) => s.updateGroupMessage);
  const resetGroup = useAura((s) => s.resetGroup);
  const bumpTurn = useAura((s) => s.bumpTurn);
  const applyBond = useAura((s) => s.applyBond);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);

  const roster = [
    ...CHARACTER_LIST,
    ...customCharacters.map(customAsCharacter),
    ...publishedCatalog
      .filter((card) => !customCharacters.some((c) => c.id === card.id))
      .map(customAsCharacter),
  ];

  function resolve(id: string) {
    return roster.find((c) => c.id === id) ?? null;
  }

  function toggleMember(id: string) {
    const has = group.memberIds.includes(id);
    const next = has
      ? group.memberIds.filter((m) => m !== id)
      : [...group.memberIds, id].slice(0, 5);
    setGroupMembers(next);
  }

  async function speakFrom(
    botId: string,
    history: { role: "user" | "assistant"; content: string }[],
    depth = 0,
  ) {
    const bot = resolve(botId);
    if (!bot) return;
    const custom =
      customCharacters.find((c) => c.id === botId) ??
      publishedCatalog.find((c) => c.id === botId);
    const assistantId = addGroupMessage({
      role: "assistant",
      content: "",
      speakerId: botId,
      speakerName: bot.name,
    });
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        characterId: botId,
        affection: companions[botId]?.affection ?? 8,
        locale,
        profile,
        custom: custom ?? undefined,
        group: {
          names: group.memberIds.map((id) => resolve(id)?.name).filter(Boolean),
          turn: group.turnTaking,
        },
        messages: history,
      }),
    });
    const rawBody = await res.text();
    let payload: { text?: string; error?: string } | null = null;
    try {
      payload = JSON.parse(rawBody) as { text?: string; error?: string };
    } catch {
      payload = null;
    }
    const reply = payload?.text?.trim() ?? "";
    if (!res.ok || !reply) {
      throw new Error(
        payload?.error?.trim() ||
          (rawBody.trim() && !rawBody.trim().startsWith("<")
            ? rawBody.trim().slice(0, 240)
            : "") ||
          `Chat error ${res.status || "unknown"}`,
      );
    }
    const { clean, mood, bond } = parseMeta(reply);
    updateGroupMessage(assistantId, `${bot.name}: ${clean}`);
    applyBond(botId, Math.round((bond + depth) * bondScaleFor(botId)), mood);
    return `${bot.name}: ${clean}`;
  }

  async function send() {
    const trimmed = draft.trim();
    if (!trimmed || busyRef.current) return;
    if (group.memberIds.length < 2) {
      setError(t(locale, "groupEmpty"));
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setError(null);
    setDraft("");
    addGroupMessage({ role: "user", content: trimmed, speakerName: "You" });
    const base = [
      ...group.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user" as const, content: trimmed },
    ];
    try {
      const depth = trimmed.length >= 160 ? 2 : trimmed.length >= 72 ? 1 : 0;
      if (group.turnTaking) {
        const botId = group.memberIds[group.turnIndex % group.memberIds.length]!;
        await speakFrom(botId, base, depth);
        bumpTurn();
      } else {
        let thread = [...base];
        for (const botId of group.memberIds) {
          const line = await speakFrom(botId, thread, depth);
          if (line) thread = [...thread, { role: "assistant", content: line }];
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t(locale, "tooFast"));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return (
    <main className="relative min-h-dvh bg-bg text-fg">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#163056,transparent_55%)]" />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-5 py-8 sm:px-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium tracking-[0.28em] text-muted">
              aura-3d
            </p>
            <h1 className="font-display mt-2 text-4xl font-medium tracking-[-0.03em]">
              {t(locale, "navGroup")}
            </h1>
            <AppNav />
          </div>
          <LanguageSelect />
        </header>

        <p className="mt-6 text-sm text-muted">{t(locale, "pickBots")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {roster.map((c) => {
            const on = group.memberIds.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleMember(c.id)}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  on
                    ? "border-accent bg-accent/15 text-fg"
                    : "border-border text-muted"
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className={`rounded-full border px-3 py-1.5 text-sm ${
              group.turnTaking ? "border-accent text-fg" : "border-border text-muted"
            }`}
            onClick={() => setTurnTaking(true)}
          >
            {t(locale, "turnTaking")}
          </button>
          <button
            type="button"
            className={`rounded-full border px-3 py-1.5 text-sm ${
              !group.turnTaking ? "border-accent text-fg" : "border-border text-muted"
            }`}
            onClick={() => setTurnTaking(false)}
          >
            {t(locale, "allReply")}
          </button>
          <Button variant="ghost" size="sm" onClick={() => resetGroup()}>
            {t(locale, "groupReset")}
          </Button>
        </div>

        <div className="mt-6 min-h-[40vh] flex-1 space-y-3 overflow-y-auto">
          {group.messages.map((m) => (
            <p
              key={m.id}
              className={`max-w-[40rem] text-sm leading-relaxed ${
                m.role === "user" ? "text-fg" : "text-muted"
              }`}
            >
              {m.role === "user"
                ? m.content
                : m.content.startsWith(`${m.speakerName}:`)
                  ? m.content
                  : `${m.speakerName ?? ""}: ${m.content}`}
            </p>
          ))}
        </div>

        {error ? <p className="mt-2 text-sm text-heart">{error}</p> : null}

        <form
          className="sticky bottom-0 mt-4 flex gap-2 bg-bg/80 py-3 backdrop-blur"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <input
            value={draft}
            disabled={busy}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t(locale, "placeholder")}
            className="field flex-1"
          />
          <Button type="submit" disabled={busy}>
            {t(locale, "send")}
          </Button>
        </form>
      </div>
    </main>
  );
}
