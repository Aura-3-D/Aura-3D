import { useEffect, useState } from "react";
import { LanguageSelect } from "@/components/hud/LanguageSelect";
import { AppNav } from "@/components/nav/AppNav";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { useAura } from "@/lib/store";
import { COIN_PACKS, buyCoinPack, getMyWallet, type WalletState } from "@/lib/wallet";

export function Shop() {
  const locale = useAura((s) => s.locale);
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    void getMyWallet()
      .then((info) => {
        if (live) setWallet(info);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    const paid = new URLSearchParams(window.location.search).get("paid");
    if (paid === "1" || paid === "ok" || paid === "success") {
      setNote(t(locale, "shopPaid"));
    } else if (paid === "0" || paid === "fail") {
      setNote(t(locale, "shopPayFail"));
    }
  }, [locale]);

  async function buy(coins: number) {
    setBusy(coins);
    setNote(null);
    try {
      const res = await buyCoinPack({ data: { coins } });
      if (!res.ok) {
        setNote(res.error);
        return;
      }
      if (res.mode === "shopier" && "url" in res && res.url) {
        window.location.href = res.url;
        return;
      }
      if (res.mode === "demo" && "wallet" in res) {
        setWallet(res.wallet);
      }
    } catch {
      setNote(t(locale, "tooFast"));
    } finally {
      setBusy(null);
    }
  }

  const paymentsReady = Boolean(wallet?.paymentsReady);
  const textLeft = wallet
    ? wallet.infinite
      ? "∞"
      : Math.max(0, wallet.textLimit - wallet.textsUsed)
    : "—";
  const voiceLeft = wallet
    ? wallet.infinite
      ? "∞"
      : Math.max(0, Math.ceil((wallet.voiceMsLimit - wallet.voiceMsUsed) / 60_000))
    : "—";
  const imageLeft = wallet
    ? wallet.infinite
      ? "∞"
      : Math.max(0, wallet.imageLimit - wallet.imagesUsed)
    : "—";

  return (
    <main className="relative min-h-dvh bg-bg text-fg">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#163056,transparent_55%)]" />
      <div className="relative mx-auto w-full max-w-3xl px-5 py-8 sm:px-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium tracking-[0.28em] text-muted">
              aura-3d
            </p>
            <h1 className="font-display mt-2 text-4xl font-medium tracking-[-0.03em]">
              {t(locale, "shopTitle")}
            </h1>
            <AppNav />
          </div>
          <LanguageSelect />
        </header>

        <p className="mt-6 max-w-xl text-sm text-muted">{t(locale, "shopHint")}</p>
        <p className="mt-2 text-xs text-subtle">
          {t(locale, paymentsReady ? "shopLive" : "shopDemo")}
        </p>
        <p className="mt-1 text-xs text-subtle">{t(locale, "coinRates")}</p>

        <div className="mt-6 rounded-[24px] border border-border bg-bg-elevated px-5 py-4">
          <p className="text-[11px] tracking-[0.2em] text-muted">{t(locale, "coins")}</p>
          <p className="font-display mt-1 text-4xl">{wallet?.coins ?? "—"}</p>
          <p className="mt-2 text-sm text-subtle">
            {t(locale, "dailyLeft", {
              text: String(textLeft),
              voice: String(voiceLeft),
              image: String(imageLeft),
            })}
          </p>
        </div>

        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {COIN_PACKS.map((pack) => (
            <li
              key={pack.coins}
              className="rounded-[24px] border border-border bg-bg-elevated p-5"
            >
              <p className="font-display text-3xl">{pack.coins}</p>
              <p className="mt-1 text-sm text-muted">
                {t(locale, "coins")} · ${pack.usd}
              </p>
              <Button
                type="button"
                className="mt-4 w-full"
                disabled={busy !== null}
                onClick={() => void buy(pack.coins)}
              >
                {busy === pack.coins
                  ? "…"
                  : t(locale, paymentsReady ? "shopPay" : "shopBuy")}
              </Button>
            </li>
          ))}
        </ul>

        {note ? (
          <p
            className={`mt-4 text-sm ${
              note === t(locale, "shopPaid") ? "text-subtle" : "text-heart"
            }`}
          >
            {note}
          </p>
        ) : null}
      </div>
    </main>
  );
}