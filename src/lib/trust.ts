import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

export type TrustInfo = {
  score: number;
  frozen: boolean;
};

type TrustRow = {
  user_id: string;
  score: number;
  last_day: string;
  publish_frozen: boolean;
};

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return 0;
  return Math.min(30, Math.round((b - a) / 86_400_000));
}

export async function loadTrust(userId: string): Promise<TrustRow> {
  const sql = await getSql();
  const existing = await sql<TrustRow>`
    select user_id, score, last_day::text as last_day, publish_frozen
    from user_trust
    where user_id = ${userId}
    limit 1
  `;
  const today = todayUtc();
  if (!existing[0]) {
    await sql`
      insert into user_trust (user_id, score, last_day, publish_frozen)
      values (${userId}, 0, ${today}::date, false)
      on conflict (user_id) do nothing
    `;
    return {
      user_id: userId,
      score: 0,
      last_day: today,
      publish_frozen: false,
    };
  }
  const row = existing[0];
  const last = String(row.last_day).slice(0, 10);
  const extra = daysBetween(last, today);
  if (extra > 0) {
    const score = row.score + extra;
    await sql`
      update user_trust
      set score = ${score}, last_day = ${today}::date
      where user_id = ${userId}
    `;
    return { ...row, score, last_day: today };
  }
  return row;
}

export async function addTrust(userId: string, delta: number): Promise<number> {
  const row = await loadTrust(userId);
  const score = row.score + delta;
  const sql = await getSql();
  const frozen = row.publish_frozen || score <= -10000;
  await sql`
    update user_trust
    set score = ${score}, publish_frozen = ${frozen}
    where user_id = ${userId}
  `;
  return score;
}

export async function freezePublisher(userId: string): Promise<void> {
  await loadTrust(userId);
  const sql = await getSql();
  await sql`
    update user_trust
    set publish_frozen = true
    where user_id = ${userId}
  `;
}

export const getMyTrust = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const row = await loadTrust(context.userId);
    return {
      score: row.score,
      frozen: row.publish_frozen,
    } satisfies TrustInfo;
  });
