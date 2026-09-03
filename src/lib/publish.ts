import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { parseCustomCard, type CustomCard } from "@/lib/custom-character";
import {
  cardModerationText,
  moderatePublishCard,
} from "@/lib/publish-policy";
import { loadTrust } from "@/lib/trust";

export type PublishedCard = CustomCard & {
  mine: boolean;
  upvotes: number;
  voted: boolean;
};

type Row = {
  id: string;
  user_id: string;
  name: string;
  age: number;
  voice_id: string;
  tagline: string;
  bio: string;
  greeting: string;
  personality: string;
  lore: string;
  system_prompt: string;
  tags: string;
  kind: string;
  accent: string;
  portrait: string;
  created_at: string;
  upvotes: number;
  voted: number;
};

function rowToCard(row: Row, userId: string): PublishedCard | null {
  let tags: string[] = [];
  try {
    const parsed = JSON.parse(row.tags);
    if (Array.isArray(parsed)) tags = parsed.map(String);
  } catch {
    tags = [];
  }
  const card = parseCustomCard({
    id: row.id,
    name: row.name,
    age: row.age,
    voiceId: row.voice_id,
    tagline: row.tagline,
    bio: row.bio,
    greeting: row.greeting,
    personality: row.personality,
    lore: row.lore,
    systemPrompt: row.system_prompt,
    tags,
    kind: row.kind,
    accent: row.accent,
    portrait: row.portrait,
    createdAt: Date.parse(row.created_at) || Date.now(),
  });
  if (!card) return null;
  return {
    ...card,
    mine: row.user_id === userId,
    upvotes: Number(row.upvotes) || 0,
    voted: Number(row.voted) > 0,
  };
}

function portraitForDb(portrait: string): string {
  if (!portrait) return "";
  if (portrait.startsWith("/") && portrait.length < 400) return portrait;
  if (portrait.startsWith("data:image/") && portrait.length < 180_000) {
    return portrait;
  }
  return "";
}

const SELECT_CARD = `
      select id, user_id, name, age, voice_id, tagline, bio, greeting,
             personality, lore, system_prompt, tags, kind, accent, portrait,
             created_at::text as created_at, upvotes,
             (select count(*)::int from card_votes v
               where v.card_id = published_characters.id and v.user_id = $1) as voted
`;

export const listPublished = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await loadTrust(context.userId);
    const sql = await getSql();
    const rows = await sql.query<Row>(
      `${SELECT_CARD}
      from published_characters
      where removed_at is null
      order by upvotes desc, created_at desc
      limit 80`,
      [context.userId],
    );
    const cards: PublishedCard[] = [];
    for (const row of rows) {
      const card = rowToCard(row, context.userId);
      if (card) cards.push(card);
    }
    return { cards };
  });

export const getPublished = createServerFn({ method: "POST" })
  .validator((id: string) => String(id ?? "").slice(0, 80))
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    const rows = await sql.query<Row>(
      `${SELECT_CARD}
      from published_characters
      where id = $2 and removed_at is null
      limit 1`,
      [context.userId, id],
    );
    const row = rows[0];
    if (!row) return { card: null as PublishedCard | null };
    return { card: rowToCard(row, context.userId) };
  });

export const publishCharacter = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const parsed = parseCustomCard(data);
    if (!parsed) {
      return { ok: false as const, error: "Need a complete grown-up character." };
    }
    if (parsed.age < 18) {
      return { ok: false as const, error: "Published characters must be 18 or older." };
    }
    if (parsed.greeting.trim().length < 30) {
      return {
        ok: false as const,
        error: "Greeting must be at least 30 characters to publish.",
      };
    }
    if (parsed.personality.trim().length < 100) {
      return {
        ok: false as const,
        error: "Personality must be at least 100 characters to publish.",
      };
    }
    if (parsed.systemPrompt.trim().length < 100) {
      return {
        ok: false as const,
        error: "System prompt must be at least 100 characters to publish.",
      };
    }

    const trust = await loadTrust(context.userId);
    if (trust.publish_frozen || trust.score <= -10000) {
      return {
        ok: false as const,
        error: "Publishing is frozen on this account.",
      };
    }

    const { loadVip, waitMs, BASE_PUBLISH_MS } = await import("@/lib/vip.server");
    const vip = await loadVip(context.userId);
    const cooldown = waitMs(BASE_PUBLISH_MS, vip);
    if (cooldown > 0) {
      const sqlWait = await getSql();
      const recent = await sqlWait<{ created_at: string }>`
        select created_at::text as created_at
        from published_characters
        where user_id = ${context.userId}
        order by created_at desc
        limit 1
      `;
      const last = recent[0]?.created_at ? Date.parse(recent[0].created_at) : 0;
      if (Number.isFinite(last) && last > 0) {
        const elapsed = Date.now() - last;
        if (elapsed < cooldown) {
          const mins = Math.max(1, Math.ceil((cooldown - elapsed) / 60_000));
          return {
            ok: false as const,
            error: `Public publish cooldown: wait ${mins} min. Private cards have no wait.`,
          };
        }
      }
    }

    const blob = cardModerationText(parsed);
    const verdict = await moderatePublishCard(blob);
    if (!verdict.ok) {
      return {
        ok: false as const,
        error: verdict.reason ?? "This card cannot be published.",
      };
    }

    const sql = await getSql();
    const id = `custom-p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const portrait = portraitForDb(parsed.portrait);
    const tags = JSON.stringify(parsed.tags);
    await sql`
      insert into published_characters (
        id, user_id, name, age, voice_id, tagline, bio, greeting,
        personality, lore, system_prompt, tags, kind, accent, portrait, upvotes
      ) values (
        ${id}, ${context.userId}, ${parsed.name}, ${parsed.age}, ${parsed.voiceId},
        ${parsed.tagline}, ${parsed.bio}, ${parsed.greeting}, ${parsed.personality},
        ${parsed.lore}, ${parsed.systemPrompt}, ${tags}, ${parsed.kind},
        ${parsed.accent}, ${portrait}, 0
      )
    `;
    return {
      ok: true as const,
      card: {
        ...parsed,
        id,
        portrait,
        mine: true,
        upvotes: 0,
        voted: false,
      } satisfies PublishedCard,
    };
  });

export const unpublishCharacter = createServerFn({ method: "POST" })
  .validator((id: string) => String(id ?? "").slice(0, 80))
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    await sql`
      update published_characters
      set removed_at = now()
      where id = ${id} and user_id = ${context.userId} and removed_at is null
    `;
    return { ok: true as const };
  });
