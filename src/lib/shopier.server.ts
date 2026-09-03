/** Server-only Shopier HMAC, checkout form, and order fulfillment. */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getRequest } from "@tanstack/react-start/server";
import { getSql } from "@/lib/db";
import { COIN_PACKS, isCoinPack, type WalletState } from "./wallet";
import { buyPack, creditCoins } from "./wallet.server";

export const SHOPIER_PAY_URL = "https://www.shopier.com/ShowProduct/api_pay4.php";
export const SHOPIER_CURRENCY_USD = "1";
export const SHOPIER_PRODUCT_VIRTUAL = "1";

function envVar(name: string): string | null {
  try {
    const value = process.env[name];
    return typeof value === "string" && value.trim() ? value.trim() : null;
  } catch {
    return null;
  }
}

export function shopierApiKey(): string | null {
  return envVar("SHOPIER_API_KEY");
}

export function shopierApiSecret(): string | null {
  return envVar("SHOPIER_API_SECRET");
}

export function shopierWebsiteIndex(): string {
  return envVar("SHOPIER_WEBSITE_INDEX") || "1";
}

export function shopierConfigured(): boolean {
  return Boolean(shopierApiKey() && shopierApiSecret());
}

export function signShopierPayment(input: {
  randomNr: string;
  orderId: string;
  total: string;
  currency: string;
  secret: string;
}): string {
  return createHmac("sha256", input.secret)
    .update(input.randomNr + input.orderId + input.total + input.currency, "utf8")
    .digest("base64");
}

export function verifyShopierCallback(input: {
  randomNr: string;
  orderId: string;
  signature: string;
  secret: string;
}): boolean {
  const expected = createHmac("sha256", input.secret)
    .update(input.randomNr + input.orderId, "utf8")
    .digest();
  let given: Buffer;
  try {
    given = Buffer.from(input.signature, "base64");
  } catch {
    return false;
  }
  if (given.length === 0 || given.length !== expected.length) return false;
  return timingSafeEqual(given, expected);
}

function publicOrigin(): string {
  const request = getRequest();
  if (!request) return "";
  const url = new URL(request.url);
  const proto = (
    request.headers.get("x-forwarded-proto") || url.protocol.replace(":", "")
  )
    .split(",")[0]!
    .trim();
  const host = (
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    url.host
  )
    .split(",")[0]!
    .trim();
  return `${proto}://${host}`;
}

function numericId(userId: string): string {
  let n = 0;
  for (let i = 0; i < userId.length; i += 1) {
    n = (n * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return String(100000000 + (n % 900000000));
}

function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    first: (parts[0] || "Aura").slice(0, 40),
    last: (parts.slice(1).join(" ") || "Buyer").slice(0, 40),
  };
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
  | { ok: true; mode: "shopier"; action: string; fields: Record<string, string> }
  | { ok: false; error: string }
> {
  if (!isCoinPack(coins)) return { ok: false, error: "Unknown pack." };
  const pack = COIN_PACKS.find((item) => item.coins === coins);
  if (!pack) return { ok: false, error: "Unknown pack." };

  if (!shopierConfigured()) {
    const bought = await buyPack(userId, coins);
    if (!bought.ok) return bought;
    return { ok: true, mode: "demo", wallet: bought.wallet };
  }

  const key = shopierApiKey()!;
  const secret = shopierApiSecret()!;
  const orderId = `ac${randomBytes(12).toString("hex")}`;
  const randomNr = String(100000 + Math.floor(Math.random() * 900000));
  const total = pack.usd.toFixed(2);
  const currency = SHOPIER_CURRENCY_USD;
  const signature = signShopierPayment({
    randomNr,
    orderId,
    total,
    currency,
    secret,
  });

  const sql = await getSql();
  await sql`
    insert into shopier_orders (id, user_id, coins, amount, currency, status, random_nr)
    values (${orderId}, ${userId}, ${coins}, ${total}, ${currency}, 'pending', ${randomNr})
  `;

  const buyer = await sql<{ name: string; email: string }>`
    select name, email from "user" where id = ${userId} limit 1
  `;
  const { first, last } = splitName(buyer[0]?.name || "Aura");
  const email = (buyer[0]?.email || "buyer@aura-3d.app").slice(0, 80);
  const origin = publicOrigin();

  const fields: Record<string, string> = {
    API_key: key,
    website_index: shopierWebsiteIndex(),
    platform_order_id: orderId,
    product_name: `${coins} Aura-coin`,
    product_type: SHOPIER_PRODUCT_VIRTUAL,
    buyer_name: first,
    buyer_surname: last,
    buyer_email: email,
    buyer_account_age: "0",
    buyer_id_nr: numericId(userId),
    buyer_phone: "5555555555",
    billing_address: "Digital",
    billing_city: "Istanbul",
    billing_country: "TR",
    billing_postcode: "34000",
    shipping_address: "Digital",
    shipping_city: "Istanbul",
    shipping_country: "TR",
    shipping_postcode: "34000",
    total_order_value: total,
    currency,
    platform: "0",
    is_in_frame: "0",
    current_language: "0",
    modul_version: "1.0.4",
    random_nr: randomNr,
    signature,
    callback: origin ? `${origin}/api/shopier-callback` : "/api/shopier-callback",
  };

  return { ok: true, mode: "shopier", action: SHOPIER_PAY_URL, fields };
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
