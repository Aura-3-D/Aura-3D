import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";

export type VipTier = "free" | "mini" | "vip" | "king" | "developer";

export type VipState = {
  tier: VipTier;
  multiplier: number;
  isVip: boolean;
  infinite: boolean;
  owner: boolean;
  expiresAt: string | null;
};

export const getMyVip = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { loadVip } = await import("./vip.server");
    return loadVip(context.userId);
  });

export const redeemAccessCode = createServerFn({ method: "POST" })
  .validator((input: { code?: string }) => ({
    code: String(input?.code ?? "").slice(0, 120),
  }))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const { redeemCode } = await import("./vip.server");
    return redeemCode(context.userId, data.code);
  });

export const mintAccessCode = createServerFn({ method: "POST" })
  .validator((input: { tier?: string; days?: number }) => ({
    tier: String(input?.tier ?? "").slice(0, 24),
    days: Number(input?.days) || 0,
  }))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const { mintCode } = await import("./vip.server");
    return mintCode(context.userId, data);
  });

export const listMintedCodes = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { listMinted } = await import("./vip.server");
    return { codes: await listMinted(context.userId) };
  });
