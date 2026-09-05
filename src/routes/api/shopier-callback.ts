import { createFileRoute } from "@tanstack/react-router";

async function readOsbBody(request: Request): Promise<{
  res?: string;
  hash?: string;
  form: Record<string, string>;
}> {
  const ctype = request.headers.get("content-type") || "";
  const form: Record<string, string> = {};

  if (ctype.includes("application/json")) {
    const json = (await request.json().catch(() => null)) as unknown;
    if (Array.isArray(json)) {
      // OSB often sends [{ value: base64 }, { value: hash }]
      const res = String((json[0] as { value?: string })?.value ?? "");
      const hash = String((json[1] as { value?: string })?.value ?? "");
      return { res, hash, form };
    }
    if (json && typeof json === "object") {
      for (const [k, v] of Object.entries(json as Record<string, unknown>)) {
        if (typeof v === "string" || typeof v === "number") form[k] = String(v);
      }
      return {
        res: form.res || form[0],
        hash: form.hash || form[1],
        form,
      };
    }
    return { form };
  }

  const fd = await request.formData();
  for (const [k, v] of fd.entries()) {
    if (typeof v === "string") form[k] = v;
  }
  // form-urlencoded array style: 0[value], 1[value]
  const res =
    form.res ||
    form["0"] ||
    form["0[value]"] ||
    form["[0][value]"] ||
    "";
  const hash =
    form.hash ||
    form["1"] ||
    form["1[value]"] ||
    form["[1][value]"] ||
    "";
  return { res, hash, form };
}

export const Route = createFileRoute("/api/shopier-callback")({
  server: {
    handlers: {
      GET: async () =>
        new Response(null, {
          status: 302,
          headers: { Location: "/shop?paid=1" },
        }),

      POST: async ({ request }) => {
        try {
          const { res, hash, form } = await readOsbBody(request);
          const {
            verifyOsbHash,
            fulfillByProductAndEmail,
            shopierOsbConfigured,
          } = await import("@/lib/shopier.server");

          if (!shopierOsbConfigured()) {
            console.error("[shopier] OSB credentials not set");
            return new Response("success", { status: 200 });
          }

          if (!res || !hash || !verifyOsbHash(res, hash)) {
            console.error("[shopier] OSB hash failed", {
              hasRes: Boolean(res),
              hasHash: Boolean(hash),
            });
            return new Response("unauthorized", { status: 401 });
          }

          let payload: Record<string, unknown> = {};
          try {
            payload = JSON.parse(
              Buffer.from(res, "base64").toString("utf8"),
            ) as Record<string, unknown>;
          } catch {
            console.error("[shopier] OSB payload decode failed");
            return new Response("bad payload", { status: 400 });
          }

          const email = String(payload.email ?? "").trim();
          const productId = String(
            payload.productid ?? payload.productId ?? "",
          ).trim();
          const orderId = String(
            payload.orderid ?? payload.orderId ?? "",
          ).trim();

          // productlist can hold multiple ids — take first match
          let resolvedProduct = productId;
          if (!resolvedProduct && payload.productlist) {
            const list = String(payload.productlist);
            resolvedProduct = list.split(/[,;|\s]+/).filter(Boolean)[0] || "";
          }

          const result = await fulfillByProductAndEmail({
            productId: resolvedProduct,
            email,
            shopierOrderId: orderId || `osb-${Date.now()}`,
          });

          if (!result.ok) {
            console.error("[shopier] fulfill", result.error, {
              email,
              productId: resolvedProduct,
              orderId,
            });
            // Still return success so Shopier does not retry forever on unknown users
            return new Response("success", { status: 200 });
          }

          console.info("[shopier] OSB ok", {
            email,
            productId: resolvedProduct,
            orderId,
            credited: result.credited,
          });
          return new Response("success", { status: 200 });
        } catch (err) {
          console.error(
            "[shopier] callback error",
            err instanceof Error ? err.message : err,
          );
          return new Response("error", { status: 503 });
        }
      },
    },
  },
});