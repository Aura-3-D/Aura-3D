/** Server-only wallet + daily usage. Never statically import from client code. */
import { getSql } from "@/lib/db";
import { loadVip } from "@/lib/vip.server";
import { isCoinPack, type WalletState } from "./wallet";

export const BASE_TEXT_DAILY = 60;
export const BASE_VOICE_MS_DAILY = 2 * 60_000;
export const BASE_IMAGE_DAILY = 3;
export const COIN_PER_TEXT = 1;
export const COIN_PER_VOICE_MIN = 4;
export const COIN_PER_IMAGE = 5;

type WalletRow = {
  coins: number;
  text_credit: number;
};

type UsageRow = {
  day: string;
  texts: number;
  voice_ms: number;
  images: number;
};

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export function estimateVoiceMs(text: string): number {
  const chars = text.trim().length;
  return Math.max(1500, Math.round((chars / 14) * 1000));
}

async function ensureRows(userId: string): Promise<void> {
  const sql = await getSql();
  await sql`
    insert into user_wallet (user_id, coins, text_credit)
    values (${userId}, 0, 0)
    on conflict (user_id) do nothing
  `;
  await sql`
    insert into user_usage (user_id, day, texts, voice_ms, images)
    values (${userId}, ${todayStamp()}::date, 0, 0, 0)
    on conflict (user_id) do nothing
  `;
  const usage = await sql<UsageRow>`
    select day::text as day, texts, voice_ms, images
    from user_usage where user_id = ${userId} limit 1
  `;
  const day = usage[0]?.day?.slice(0, 10);
  if (day && day !== todayStamp()) {
    await sql`
      update user_usage
      set day = ${todayStamp()}::date, texts = 0, voice_ms = 0, images = 0
      where user_id = ${userId}
    `;
  }
}

function limitsFor(multiplier: number, infinite: boolean) {
  if (infinite) {
    return { textLimit: 0, voiceMsLimit: 0, imageLimit: 0, infinite: true };
  }
  const m = Math.max(1, multiplier);
  return {
    textLimit: BASE_TEXT_DAILY * m,
    voiceMsLimit: BASE_VOICE_MS_DAILY * m,
    imageLimit: BASE_IMAGE_DAILY * m,
    infinite: false,
  };
}

export async function loadWallet(userId: string): Promise<WalletState> {
  await ensureRows(userId);
  const sql = await getSql();
  const vip = await loadVip(userId);
  const caps = limitsFor(vip.multiplier, vip.infinite);
  const wallet = await sql<WalletRow>`
    select coins, text_credit from user_wallet where user_id = ${userId} limit 1
  `;
  const usage = await sql<UsageRow>`
    select day::text as day, texts, voice_ms, images
    from user_usage where user_id = ${userId} limit 1
  `;
  return {
    coins: wallet[0]?.coins ?? 0,
    textCredit: wallet[0]?.text_credit ?? 0,
    textsUsed: usage[0]?.texts ?? 0,
    voiceMsUsed: usage[0]?.voice_ms ?? 0,
    imagesUsed: usage[0]?.images ?? 0,
    textLimit: caps.textLimit,
    voiceMsLimit: caps.voiceMsLimit,
    imageLimit: caps.imageLimit,
    infinite: caps.infinite,
    day: (usage[0]?.day ?? todayStamp()).slice(0, 10),
  };
}

async function addCoins(userId: string, coins: number, textCredit = 0): Promise<void> {
  const sql = await getSql();
  await sql`
    update user_wallet
    set coins = coins + ${coins},
        text_credit = text_credit + ${textCredit},
        updated_at = now()
    where user_id = ${userId}
  `;
}

export async function creditCoins(userId: string, coins: number): Promise<void> {
  if (coins <= 0) return;
  await ensureRows(userId);
  await addCoins(userId, coins);
}

export async function buyPack(
  userId: string,
  coins: number,
): Promise<{ ok: true; wallet: WalletState } | { ok: false; error: string }> {
  if (!isCoinPack(coins)) return { ok: false, error: "Unknown pack." };
  await ensureRows(userId);
  await addCoins(userId, coins);
  return { ok: true, wallet: await loadWallet(userId) };
}

export async function consumeText(
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string; spent: number }> {
  const state = await loadWallet(userId);
  if (state.infinite) return { ok: true };
  if (state.textsUsed < state.textLimit) {
    const sql = await getSql();
    await sql`update user_usage set texts = texts + 1 where user_id = ${userId}`;
    return { ok: true };
  }
  if (state.textCredit > 0) {
    const sql = await getSql();
    await sql`
      update user_wallet
      set text_credit = text_credit - 1, updated_at = now()
      where user_id = ${userId} and text_credit > 0
    `;
    await sql`update user_usage set texts = texts + 1 where user_id = ${userId}`;
    return { ok: true };
  }
  if (state.coins >= COIN_PER_TEXT) {
    const sql = await getSql();
    await sql`
      update user_wallet
      set coins = coins - ${COIN_PER_TEXT},
          updated_at = now()
      where user_id = ${userId} and coins >= ${COIN_PER_TEXT}
    `;
    await sql`update user_usage set texts = texts + 1 where user_id = ${userId}`;
    return { ok: true };
  }
  return {
    ok: false,
    error: "Daily text limit reached. Buy Aura-coin to keep talking.",
    spent: 0,
  };
}

export async function consumeImage(
  userId: string,
): Promise<{ ok: true; spent: number; charged: boolean } | { ok: false; error: string }> {
  const state = await loadWallet(userId);
  if (state.infinite) return { ok: true, spent: 0, charged: false };
  if (state.imagesUsed < state.imageLimit) {
    const sql = await getSql();
    await sql`update user_usage set images = images + 1 where user_id = ${userId}`;
    return { ok: true, spent: 0, charged: true };
  }
  if (state.coins < COIN_PER_IMAGE) {
    return { ok: false, error: "Daily image limit reached. 5 Aura-coin per extra image." };
  }
  const sql = await getSql();
  await sql`
    update user_wallet
    set coins = coins - ${COIN_PER_IMAGE}, updated_at = now()
    where user_id = ${userId} and coins >= ${COIN_PER_IMAGE}
  `;
  await sql`update user_usage set images = images + 1 where user_id = ${userId}`;
  return { ok: true, spent: COIN_PER_IMAGE, charged: true };
}

export async function consumeVoice(
  userId: string,
  voiceMs: number,
): Promise<{ ok: true; spent: number } | { ok: false; error: string }> {
  const amount = Math.max(0, Math.round(voiceMs));
  if (amount <= 0) return { ok: true, spent: 0 };
  const state = await loadWallet(userId);
  if (state.infinite) {
    const sql = await getSql();
    await sql`update user_usage set voice_ms = voice_ms + ${amount} where user_id = ${userId}`;
    return { ok: true, spent: 0 };
  }
  const freeLeft = Math.max(0, state.voiceMsLimit - state.voiceMsUsed);
  const extra = Math.max(0, amount - freeLeft);
  const minutes = extra > 0 ? Math.ceil(extra / 60_000) : 0;
  const cost = minutes * COIN_PER_VOICE_MIN;
  if (cost > 0 && state.coins < cost) {
    return {
      ok: false,
      error: "Daily voice limit reached. 2 Aura-coin per extra minute.",
    };
  }
  const sql = await getSql();
  if (cost > 0) {
    await sql`
      update user_wallet
      set coins = coins - ${cost}, updated_at = now()
      where user_id = ${userId} and coins >= ${cost}
    `;
  }
  await sql`update user_usage set voice_ms = voice_ms + ${amount} where user_id = ${userId}`;
  return { ok: true, spent: cost };
}

export async function refundCoins(userId: string, coins: number): Promise<void> {
  if (coins <= 0) return;
  await addCoins(userId, coins);
}

export async function undoImage(userId: string, spent: number): Promise<void> {
  if (spent > 0) await addCoins(userId, spent);
  const sql = await getSql();
  await sql`
    update user_usage
    set images = greatest(images - 1, 0)
    where user_id = ${userId}
  `;
}
