import { createFileRoute } from "@tanstack/react-router";

function field(source: Record<string, string>, ...names: string[]): string {
  for (const name of names) {
    const value = source[name];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

async function readPayload(request: Request): Promise<Record<string, string>> {
  const ctype = request.headers.get("content-type") || "";
  const out: Record<string, string> = {};
  if (ctype.includes("application/json")) {
    const json = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!json || typeof json !== "object") return out;
    for (const [key, value] of Object.entries(json)) {
      if (typeof value === "string" || typeof value === "number") out[key] = String(value);
    }
    return out;
  }
  const form = await request.formData();
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

export const Route = createFileRoute("/api/shopier-callback")({
  server: {
    handlers: {
      GET: async () => {
        return new Response(null, {
          status: 302,
          headers: { Location: "/shop" },
        });
      },
      POST: async ({ request }) => {
        try {
          const payload = await readPayload(request);
          const randomNr = field(payload, "random_nr");
          const orderId = field(payload, "platform_order_id");
          const signature = field(payload, "signature");
          const status = field(payload, "status");
          const paymentId = field(payload, "payment_id");

          const { shopierApiSecret, verifyShopierCallback, fulfillShopierOrder } = await import(
            "@/lib/shopier.server"
          );
          const secret = shopierApiSecret();
          if (!secret) {
            console.error("[shopier] SHOPIER_API_SECRET is not set on the server");
            return Response.json({ error: "Shopier is not configured", status: 503 }, { status: 503 });
          }
          if (!randomNr || !orderId || !signature) {
            console.error("[shopier] callback missing fields", {
              hasRandom: Boolean(randomNr),
              hasOrder: Boolean(orderId),
              hasSignature: Boolean(signature),
            });
            return Response.json({ error: "Invalid signature" }, { status: 400 });
          }

          const valid = verifyShopierCallback({
            randomNr,
            orderId,
            signature,
            secret,
          });
          if (!valid) {
            console.error("[shopier] invalid HMAC", { orderId, status });
            return Response.json({ error: "Invalid signature" }, { status: 400 });
          }

          const result = await fulfillShopierOrder({
            platformOrderId: orderId,
            status,
            paymentId,
          });
          if (!result.ok) {
            console.error("[shopier] fulfill failed", result.error, orderId);
            return Response.json({ error: result.error }, { status: result.http });
          }

          console.info("[shopier] callback ok", {
            orderId,
            status: status || "unknown",
            credited: result.credited,
          });
          return Response.json({ status: "success" });
        } catch (err) {
          const message = err instanceof Error ? err.message : "callback failed";
          console.error("[shopier] callback error", message);
          return Response.json({ error: message }, { status: 503 });
        }
      },
    },
  },
});
