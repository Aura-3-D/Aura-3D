import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { parseCustomCard } from "@/lib/custom-character";
import {
  cardModerationText,
  moderatePublishCard,
} from "@/lib/publish-policy";
import { addTrust, freezePublisher, loadTrust } from "@/lib/trust";

const REASONS = ["illegal", "noncon", "extreme", "other"] as const;
export type ReportReason = (typeof REASONS)[number];

function isReason(value: unknown): value is ReportReason {
  return typeof value === "string" && (REASONS as readonly string[]).includes(value);
}

type PublishedRow = {
  id: string;
  user_id: string;
  name: string;
  age: number;
  tagline: string;
  bio: string;
  greeting: string;
  personality: string;
  lore: string;
  system_prompt: string;
  tags: string;
  removed_at: string | null;
};

function moderationBlob(card: PublishedRow): string {
  let tags: string[] = [];
  try {
    const parsed = JSON.parse(card.tags);
    if (Array.isArray(parsed)) tags = parsed.map(String);
  } catch {
    tags = [];
  }
  const parsedCard = parseCustomCard({
    id: card.id,
    name: card.name,
    age: card.age,
    tagline: card.tagline,
    bio: card.bio,
    greeting: card.greeting,
    personality: card.personality,
    lore: card.lore,
    systemPrompt: card.system_prompt,
    tags,
  });
  return parsedCard
    ? cardModerationText(parsedCard)
    : `${card.name}\n${card.tagline}\n${card.bio}\n${card.system_prompt}`;
}

async function hideIfFive(cardId: string): Promise<boolean> {
  const sql = await getSql();
  const counted = await sql<{ n: number }>`
    select count(*)::int as n from card_reports where card_id = ${cardId}
  `;
  if ((counted[0]?.n ?? 0) < 5) return false;
  await sql`
    update published_characters
    set removed_at = now()
    where id = ${cardId} and removed_at is null
  `;
  return true;
}

export const reportPublished = createServerFn({ method: "POST" })
  .validator((input: { cardId?: string; reason?: string }) => ({
    cardId: String(input?.cardId ?? "").slice(0, 80),
    reason: isReason(input?.reason) ? input.reason : "other",
  }))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const reporterId = context.userId;
    await loadTrust(reporterId);

    if (!data.cardId.startsWith("custom-p-")) {
      return { ok: false as const, error: "Only community cards can be reported." };
    }

    const sql = await getSql();
    const cards = await sql<PublishedRow>`
      select id, user_id, name, age, tagline, bio, greeting, personality, lore,
             system_prompt, tags, removed_at::text as removed_at
      from published_characters
      where id = ${data.cardId}
      limit 1
    `;
    const card = cards[0];
    if (!card) {
      return { ok: false as const, error: "That card is gone." };
    }
    if (card.user_id === reporterId) {
      return { ok: false as const, error: "You cannot report your own card." };
    }
    if (card.removed_at) {
      return { ok: true as const, received: true };
    }

    const prior = await sql<{ id: string; verdict: string }>`
      select id, verdict from card_reports
      where card_id = ${data.cardId} and reporter_id = ${reporterId}
      limit 1
    `;
    const existing = prior[0];
    if (existing && existing.verdict !== "pending") {
      return { ok: true as const, received: true };
    }

    let reportId = existing?.id;
    if (!reportId) {
      const recent = await sql<{ n: number }>`
        select count(*)::int as n
        from card_reports
        where reporter_id = ${reporterId}
          and created_at > now() - interval '1 hour'
      `;
      if ((recent[0]?.n ?? 0) >= 5) {
        return {
          ok: false as const,
          error: "Too many reports this hour. Wait, then try again.",
        };
      }
      reportId = `rep-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      try {
        await sql`
          insert into card_reports (id, card_id, reporter_id, reason, verdict)
          values (${reportId}, ${data.cardId}, ${reporterId}, ${data.reason}, 'pending')
        `;
      } catch {
        const again = await sql<{ id: string; verdict: string }>`
          select id, verdict from card_reports
          where card_id = ${data.cardId} and reporter_id = ${reporterId}
          limit 1
        `;
        if (again[0] && again[0].verdict !== "pending") {
          return { ok: true as const, received: true };
        }
        reportId = again[0]?.id ?? reportId;
      }
    }

    await hideIfFive(data.cardId);

    const verdict = await moderatePublishCard(moderationBlob(card));
    if (verdict.error) {
      return { ok: true as const, received: true };
    }
    if (verdict.ok) {
      await sql`
        update card_reports set verdict = 'dismissed' where id = ${reportId}
      `;
      await addTrust(reporterId, -50);
      return { ok: true as const, received: true };
    }

    await sql`
      update published_characters
      set removed_at = now()
      where id = ${data.cardId} and removed_at is null
    `;
    await sql`
      update card_reports set verdict = 'upheld' where id = ${reportId}
    `;
    await addTrust(reporterId, 100);
    await addTrust(card.user_id, -10000);
    await freezePublisher(card.user_id);
    return { ok: true as const, received: true };
  });
