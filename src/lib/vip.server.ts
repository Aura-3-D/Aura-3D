/** Server-only. Never statically import this module from client code. */
import { getSql } from "@/lib/db";
import type { VipState, VipTier } from "./vip";

export const VIP_TIERS = ["free", "mini", "vip", "king", "developer"] as const;

const TIER_MULT: Record<VipTier, number> = {
  free: 1,
  mini: 2,
  vip: 6,
  king: 20,
  developer: 0,
};

export const BASE_PUBLISH_MS = 30 * 60_000;
export const BASE_WORKPLACE_MS = 0;
export const BASE_CHAT_MS = 2_000;
export const BASE_IMAGE_MS = 10_000;

const OWNER_CODE =
  "Aura-i_am_the_owner_and_i_will_write=123456789_and_be_happy";

const CODE_RE = /^Aura-[A-Za-z0-9]{4}(?:-[A-Za-z0-9]{4}){5}$/;
const ALPH =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

type VipRow = {
  user_id: string;
  tier: string;
  multiplier: number;
  is_vip: boolean;
  owner: boolean;
  vip_expires_at: string | null;
};

export function isVipTier(value: string): value is VipTier {
  return (VIP_TIERS as readonly string[]).includes(value);
}

export function isMintTier(value: string): value is Exclude<VipTier, "free"> {
  return value !== "free" && isVipTier(value);
}

export function isAccessCode(value: string): boolean {
  return CODE_RE.test(value);
}

function group4(): string {
  let out = "";
  for (let i = 0; i < 4; i++) {
    out += ALPH[Math.floor(Math.random() * ALPH.length)]!;
  }
  return out;
}

export function generateAccessCode(): string {
  return `Aura-${[0, 1, 2, 3, 4, 5].map(() => group4()).join("-")}`;
}

function asState(row: {
  tier: string;
  multiplier: number;
  is_vip: boolean;
  owner: boolean;
  vip_expires_at: string | null;
}): VipState {
  const tier: VipTier = isVipTier(row.tier) ? row.tier : "free";
  const infinite = Boolean(row.owner) || tier === "developer" || row.multiplier === 0;
  return {
    tier,
    multiplier: infinite ? 0 : Math.max(1, row.multiplier || TIER_MULT[tier]),
    isVip: Boolean(row.is_vip) || infinite,
    infinite,
    owner: Boolean(row.owner),
    expiresAt: row.vip_expires_at ? String(row.vip_expires_at) : null,
  };
}

const FREE: VipState = {
  tier: "free",
  multiplier: 1,
  isVip: false,
  infinite: false,
  owner: false,
  expiresAt: null,
};

export function waitMs(baseMs: number, vip: VipState): number {
  if (vip.infinite || baseMs <= 0) return 0;
  const m = Math.max(1, vip.multiplier);
  return Math.max(0, Math.round(baseMs / m));
}

export async function loadVip(userId: string): Promise<VipState> {
  const sql = await getSql();
  const existing = await sql<VipRow>`
    select user_id, tier, multiplier, is_vip, owner,
           vip_expires_at::text as vip_expires_at
    from user_vip
    where user_id = ${userId}
    limit 1
  `;
  if (!existing[0]) {
    await sql`
      insert into user_vip (user_id, tier, multiplier, is_vip, owner)
      values (${userId}, 'free', 1, false, false)
      on conflict (user_id) do nothing
    `;
    return { ...FREE };
  }
  const row = existing[0];
  if (row.owner) return asState(row);
  if (row.vip_expires_at) {
    const exp = Date.parse(row.vip_expires_at);
    if (Number.isFinite(exp) && exp <= Date.now()) {
      await sql`
        update user_vip
        set tier = 'free', multiplier = 1, is_vip = false, vip_expires_at = null
        where user_id = ${userId} and owner = false
      `;
      return { ...FREE, owner: false };
    }
  }
  return asState(row);
}

async function setVip(
  userId: string,
  patch: {
    tier: VipTier;
    owner?: boolean;
    days?: number | null;
  },
): Promise<VipState> {
  const sql = await getSql();
  await loadVip(userId);
  const infinite = patch.tier === "developer" || Boolean(patch.owner);
  const multiplier = infinite ? 0 : TIER_MULT[patch.tier];
  const isVip = infinite || patch.tier === "vip" || patch.tier === "king";
  let expires: string | null = null;
  if (patch.owner) {
    expires = null;
  } else if (typeof patch.days === "number" && patch.days > 0) {
    expires = new Date(Date.now() + patch.days * 86_400_000).toISOString();
  }
  await sql`
    update user_vip
    set tier = ${patch.tier},
        multiplier = ${multiplier},
        is_vip = ${isVip},
        owner = coalesce(${patch.owner ?? null}::boolean, owner),
        vip_expires_at = ${expires}::timestamptz
    where user_id = ${userId}
  `;
  return loadVip(userId);
}

export async function redeemCode(
  userId: string,
  raw: string,
): Promise<{ ok: true; vip: VipState } | { ok: false; error: string }> {
  const code = raw.trim();
  if (!code) return { ok: false, error: "Enter an access code." };

  if (code === OWNER_CODE) {
    const sql = await getSql();
    const claimed = await sql<{ value: string }>`
      select value from app_meta where key = 'owner_user_id' limit 1
    `;
    if (claimed[0] && claimed[0].value !== userId) {
      return { ok: false, error: "That code is already claimed." };
    }
    if (!claimed[0]) {
      await sql`
        insert into app_meta (key, value)
        values ('owner_user_id', ${userId})
        on conflict (key) do nothing
      `;
      const again = await sql<{ value: string }>`
        select value from app_meta where key = 'owner_user_id' limit 1
      `;
      if (again[0] && again[0].value !== userId) {
        return { ok: false, error: "That code is already claimed." };
      }
    }
    const vip = await setVip(userId, {
      tier: "developer",
      owner: true,
      days: null,
    });
    return { ok: true, vip };
  }

  if (!isAccessCode(code)) {
    return { ok: false, error: "That code is not valid." };
  }

  const sql = await getSql();
  const rows = await sql<{
    code: string;
    tier: string;
    duration_days: number;
    is_redeemed: boolean;
  }>`
    select code, tier, duration_days, is_redeemed
    from access_codes
    where code = ${code}
    limit 1
  `;
  const row = rows[0];
  if (!row) return { ok: false, error: "That code is not valid." };
  if (row.is_redeemed) return { ok: false, error: "That code is already used." };
  if (!isMintTier(row.tier)) return { ok: false, error: "That code is not valid." };

  const taken = await sql<{ code: string }>`
    update access_codes
    set is_redeemed = true, redeemed_by = ${userId}, redeemed_at = now()
    where code = ${code} and is_redeemed = false
    returning code
  `;
  if (!taken[0]) return { ok: false, error: "That code is already used." };

  const days = Math.max(1, Math.min(730, Number(row.duration_days) || 1));
  const vip = await setVip(userId, { tier: row.tier, days });
  return { ok: true, vip };
}

export async function mintCode(
  userId: string,
  input: { tier: string; days: number },
): Promise<{ ok: true; code: string } | { ok: false; error: string }> {
  const vip = await loadVip(userId);
  if (!vip.owner) return { ok: false, error: "Owner only." };
  if (!isMintTier(input.tier)) {
    return { ok: false, error: "Pick Mini-VIP, VIP, King, or Developer." };
  }
  const days = Math.round(Number(input.days));
  if (!Number.isFinite(days) || days < 1 || days > 730) {
    return { ok: false, error: "Days must be 1 to 730." };
  }

  const sql = await getSql();
  for (let i = 0; i < 8; i++) {
    const code = generateAccessCode();
    try {
      await sql`
        insert into access_codes (code, tier, multiplier, duration_days, created_by)
        values (${code}, ${input.tier}, ${TIER_MULT[input.tier]}, ${days}, ${userId})
      `;
      return { ok: true, code };
    } catch {
      // collision — retry
    }
  }
  return { ok: false, error: "Could not mint a code. Try again." };
}

export async function listMinted(userId: string): Promise<
  {
    code: string;
    tier: string;
    durationDays: number;
    redeemed: boolean;
    createdAt: string;
  }[]
> {
  const vip = await loadVip(userId);
  if (!vip.owner) return [];
  const sql = await getSql();
  const rows = await sql<{
    code: string;
    tier: string;
    duration_days: number;
    is_redeemed: boolean;
    created_at: string;
  }>`
    select code, tier, duration_days, is_redeemed,
           created_at::text as created_at
    from access_codes
    where created_by = ${userId}
    order by created_at desc
    limit 40
  `;
  return rows.map((row) => ({
    code: row.code,
    tier: row.tier,
    durationDays: row.duration_days,
    redeemed: row.is_redeemed,
    createdAt: row.created_at,
  }));
}
