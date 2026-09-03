import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

export const toggleUpvote = createServerFn({ method: "POST" })
  .validator((input: { cardId?: string }) => ({
    cardId: String(input?.cardId ?? "").slice(0, 80),
  }))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    if (!data.cardId.startsWith("custom-p-")) {
      return { ok: false as const, error: "Only community cards can be upvoted." };
    }
    const sql = await getSql();
    const cards = await sql<{ id: string; user_id: string; removed_at: string | null }>`
      select id, user_id, removed_at::text as removed_at
      from published_characters
      where id = ${data.cardId}
      limit 1
    `;
    const card = cards[0];
    if (!card || card.removed_at) {
      return { ok: false as const, error: "That card is gone." };
    }
    if (card.user_id === context.userId) {
      return { ok: false as const, error: "You cannot upvote your own card." };
    }

    const existing = await sql<{ card_id: string }>`
      select card_id from card_votes
      where card_id = ${data.cardId} and user_id = ${context.userId}
      limit 1
    `;
    if (existing[0]) {
      await sql`
        delete from card_votes
        where card_id = ${data.cardId} and user_id = ${context.userId}
      `;
    } else {
      await sql`
        insert into card_votes (card_id, user_id)
        values (${data.cardId}, ${context.userId})
        on conflict (card_id, user_id) do nothing
      `;
    }
    const counted = await sql<{ n: number }>`
      select count(*)::int as n from card_votes where card_id = ${data.cardId}
    `;
    const upvotes = counted[0]?.n ?? 0;
    await sql`
      update published_characters set upvotes = ${upvotes} where id = ${data.cardId}
    `;
    return {
      ok: true as const,
      upvotes,
      voted: !existing[0],
    };
  });
