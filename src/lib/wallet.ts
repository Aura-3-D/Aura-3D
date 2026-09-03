import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";

export const COIN_PACKS = [
  { coins: 100, usd: 1 },
  { coins: 300, usd: 2.9 },
  { coins: 1000, usd: 9 },
  { coins: 5000, usd: 40 },
] as const;

export type CoinPack = (typeof COIN_PACKS)[number]["coins"];

export type WalletState = {
  coins: number;
  textCredit: number;
  textsUsed: number;
  voiceMsUsed: number;
  imagesUsed: number;
  textLimit: number;
  voiceMsLimit: number;
  imageLimit: number;
  infinite: boolean;
  day: string;
  paymentsReady?: boolean;
};

export function isCoinPack(value: number): value is CoinPack {
  return COIN_PACKS.some((pack) => pack.coins === value);
}

export const getMyWallet = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { loadWallet } = await import("./wallet.server");
    const { shopierConfigured } = await import("./shopier.server");
    const wallet = await loadWallet(context.userId);
    return { ...wallet, paymentsReady: shopierConfigured() };
  });

export const buyCoinPack = createServerFn({ method: "POST" })
  .validator((input: { coins?: number }) => ({
    coins: Number(input?.coins) || 0,
  }))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const { startCoinCheckout } = await import("./shopier.server");
    return startCoinCheckout(context.userId, data.coins);
  });
