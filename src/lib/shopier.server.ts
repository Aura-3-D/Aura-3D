/** Server-only Shopier checkout (product links) + OSB fulfillment. */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getSql } from "@/lib/db";
import { COIN_PACKS, isCoinPack, type WalletState } from "./wallet";
import { buyPack, creditCoins } from "./wallet.server";

/** Fixed Shopier product pages for each pack. */
export const SHOPIER_PRODUCT_URLS: Record<number, string> = {
  100: "https://www.shopier.com/AuraCompanions/50519564",
  300: "https://www.shopier.com/AuraCompanions/50519535",
  1000: "https://www.shopier.com/AuraCompanions/50519515",
  5000: "https://www.shopier.com/AuraCompanions/50519487",
};

/** Shopier product IDs → coin amount (must match the products above). */
export const SHOPIER_PRODUCT_COINS: Record<string, number> = {
  "50519564": 100,
  "50519535": 300,
  "50519515": 1000,
  "50519487": 5000,
};

function envVar(name: string): string | null {
  try {
    const value = process.env[name];
    return typeof value === "string" && value.trim() ? value.trim() : null;
  } catch {
    return null;
  }
}

export function shopierPat(): string | null {
  return envVar("SHOPIER_PAT");
}

export function shopierOsbUser(): string | null {
  return envVar("SHOPIER_OSB_USERNAME");
}

export function shopierOsbPassword(): string | null {
  return envVar("SHOPIER_OSB_PASSWORD");
}

/** Live when we have product URLs (always) and ideally OSB for auto-credit. */
export function shopierConfigured(): boolean {
  return Object.keys(SHOPIER_PRODUCT_URLS).length > 0;
}

export function shopierOsbConfigured(): boolean {
  return Boolean(shopierOsbUser() && shopierOsbPassword());
}

type OrderRow = {
  id: string;
  user_id: string;
  coins: number;
  status: string;
};

export async function startCoinCheckout(
  userId: string,
  coins: number,
): Promise<
  | { ok: true; mode: "demo"; wallet: WalletState }
  | { ok: true; mode: "shopier"; url: string }
  | { ok: false; error: string }
> {
  if (!isCoinPack(coins)) return { ok: false, error: "Unknown pack." };
  const pack = COIN_PACKS.find((item) => item.coins === coins);
  if (!pack) return { ok: false, error: "Unknown pack." };

  const productUrl = SHOPIER_PRODUCT_URLS[coins];
  if (!productUrl) {
    // No Shopier product mapped → trial credit
    const bought = await buyPack(userId, coins);
    if (!bought.ok) return bought;
    return { ok: true, mode: "demo", wallet: bought.wallet };
  }

  // Force demo if SHOPIER_FORCE_DEMO=true
  if (envVar("SHOPIER_FORCE_DEMO") === "true") {
    const bought = await buyPack(userId, coins);
    if (!bought.ok) return bought;
    return { ok: true, mode: "demo", wallet: bought.wallet };
  }

  const orderId = `ac${randomBytes(12).toString("hex")}`;
  const total = String(pack.usd);

  const sql = await getSql();
  await sql`
    insert into shopier_orders (id, user_id, coins, amount, currency, status, random_nr)
    values (${orderId}, ${userId}, ${coins}, ${total}, ${"USD"}, 'pending', ${""})
  `;

  // Encode local order + user in the URL hash fragment is useless server-side.
  // Buyer must use the same email as their Aura account, OR put orderId in
  // Shopier "note to seller". We also store pending by user+coins for fallback.
  const url = productUrl;
  return { ok: true, mode: "shopier", url };
}

export async function fulfillShopierOrder(input: {
  platformOrderId: string;
  status: string;
  paymentId?: string;
}): Promise<{ ok: true; credited: boolean } | { ok: false; error: string; http: number }> {
  const orderId = input.platformOrderId.trim();
  if (!orderId) return { ok: false, error: "Missing order", http: 400 };

  const sql = await getSql();
  const rows = await sql<OrderRow>`
    select id, user_id, coins, status
    from shopier_orders
    where id = ${orderId}
    limit 1
  `;
  const order = rows[0];
  if (!order) return { ok: false, error: "Unknown order", http: 400 };

  const success = input.status.trim().toLowerCase() === "success";
  const paymentId = input.paymentId?.trim() || null;

  if (!success) {
    if (order.status === "pending") {
      await sql`
        update shopier_orders
        set status = 'failed',
            payment_id = ${paymentId}
        where id = ${orderId} and status = 'pending'
      `;
    }
    return { ok: true, credited: false };
  }

  if (order.status === "paid") return { ok: true, credited: false };

  const claimed = await sql<OrderRow>`
    update shopier_orders
    set status = 'paid',
        payment_id = ${paymentId},
        paid_at = now()
    where id = ${orderId} and status = 'pending'
    returning id, user_id, coins, status
  `;
  const won = claimed[0];
  if (!won) return { ok: true, credited: false };

  await creditCoins(won.user_id, won.coins);
  return { ok: true, credited: true };
}

/** Credit by Shopier product id + buyer email (OSB path). */
export async function fulfillByProductAndEmail(input: {
  productId: string;
  email: string;
  shopierOrderId: string;
}): Promise<{ ok: true; credited: boolean } | { ok: false; error: string; http: number }> {
  const coins = SHOPIER_PRODUCT_COINS[String(input.productId)];
  if (!coins) {
    return { ok: false, error: `Unknown product ${input.productId}`, http: 400 };
  }

  const email = input.email.trim().toLowerCase();
  if (!email) return { ok: false, error: "Missing email", http: 400 };

  const sql = await getSql();

  // Idempotent: if this Shopier order was already paid, skip
  const existing = await sql<{ id: string; status: string }>`
    select id, status from shopier_orders
    where payment_id = ${input.shopierOrderId}
    limit 1
  `;
  if (existing[0]?.status === "paid") {
    return { ok: true, credited: false };
  }

  const users = await sql<{ id: string }>`
    select id from "user" where lower(email) = ${email} limit 1
  `;
  const userId = users[0]?.id;
  if (!userId) {
    return { ok: false, error: `No user for email ${email}`, http: 404 };
  }

  // Prefer a pending local order for this user+pack
  const pending = await sql<OrderRow>`
    select id, user_id, coins, status
    from shopier_orders
    where user_id = ${userId}
      and coins = ${coins}
      and status = 'pending'
    order by id desc
    limit 1
  `;

  if (pending[0]) {
    return fulfillShopierOrder({
      platformOrderId: pending[0].id,
      status: "success",
      paymentId: input.shopierOrderId,
    });
  }

  // No pending row: create + credit immediately
  const orderId = `ac${randomBytes(12).toString("hex")}`;
  await sql`
    insert into shopier_orders (id, user_id, coins, amount, currency, status, random_nr, payment_id, paid_at)
    values (${orderId}, ${userId}, ${coins}, ${"0"}, ${"USD"}, 'paid', ${""}, ${input.shopierOrderId}, now())
  `;
  await creditCoins(userId, coins);
  return { ok: true, credited: true };
}

export function verifyOsbHash(resB64: string, hashHex: string): boolean {
  const user = shopierOsbUser();
  const pass = shopierOsbPassword();
  if (!user || !pass) return false;
  const expected = createHmac("sha256", pass)
    .update(resB64 + user)
    .digest("hex");
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(hashHex, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}