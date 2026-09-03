import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { useAura } from "@/lib/store";
import {
  getMyVip,
  listMintedCodes,
  mintAccessCode,
  redeemAccessCode,
  type VipState,
  type VipTier,
} from "@/lib/vip";

const MINT_TIERS: Exclude<VipTier, "free">[] = ["mini", "vip", "king", "developer"];

function tierKey(tier: string): "tierFree" | "tierMini" | "tierVip" | "tierKing" | "tierDev" {
  if (tier === "mini") return "tierMini";
  if (tier === "vip") return "tierVip";
  if (tier === "king") return "tierKing";
  if (tier === "developer") return "tierDev";
  return "tierFree";
}

export function SettingsPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const locale = useAura((s) => s.locale);
  const [vip, setVip] = useState<VipState | null>(null);
  const [code, setCode] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mintTier, setMintTier] = useState<Exclude<VipTier, "free">>("mini");
  const [mintDays, setMintDays] = useState(30);
  const [minted, setMinted] = useState<string | null>(null);
  const [codes, setCodes] = useState<
    { code: string; tier: string; durationDays: number; redeemed: boolean }[]
  >([]);

  useEffect(() => {
    if (!open) return;
    let live = true;
    setNote(null);
    setMinted(null);
    void getMyVip()
      .then((info) => {
        if (live) setVip(info);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !vip?.owner) return;
    let live = true;
    void listMintedCodes()
      .then((res) => {
        if (live) setCodes(res.codes);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [open, vip?.owner]);

  if (!open) return null;

  async function redeem() {
    setBusy(true);
    setNote(null);
    try {
      const res = await redeemAccessCode({ data: { code } });
      if (!res.ok) {
        setNote(res.error);
        return;
      }
      setVip(res.vip);
      setCode("");
      setNote(t(locale, "accessOk"));
    } catch {
      setNote(t(locale, "tooFast"));
    } finally {
      setBusy(false);
    }
  }

  async function mint() {
    setBusy(true);
    setNote(null);
    setMinted(null);
    try {
      const res = await mintAccessCode({ data: { tier: mintTier, days: mintDays } });
      if (!res.ok) {
        setNote(res.error);
        return;
      }
      setMinted(res.code);
      const listed = await listMintedCodes();
      setCodes(listed.codes);
    } catch {
      setNote(t(locale, "tooFast"));
    } finally {
      setBusy(false);
    }
  }

  const expires = vip?.expiresAt
    ? new Date(vip.expiresAt).toLocaleDateString()
    : null;

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-end bg-bg/50 p-3 pt-[max(4.5rem,env(safe-area-inset-top))] backdrop-blur-sm sm:p-5">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label={t(locale, "closePanel")}
        onClick={onClose}
      />
      <div className="relative max-h-[min(88dvh,40rem)] w-full max-w-md overflow-y-auto rounded-[24px] border border-border bg-bg-elevated p-5 shadow-[0_24px_80px_rgb(0_0_0/0.5)] sm:p-6">
        <p className="text-[11px] font-medium tracking-[0.28em] text-muted">
          {t(locale, "settings")}
        </p>
        <h2 className="font-display mt-1 text-3xl font-medium tracking-[-0.03em]">
          {t(locale, "settings")}
        </h2>

        <div className="mt-4 rounded-2xl border border-border bg-bg px-4 py-3">
          <p className="text-[11px] tracking-[0.2em] text-muted">
            {t(locale, "tierLabel")}
          </p>
          <p className="font-display mt-1 text-2xl">
            {t(locale, tierKey(vip?.tier ?? "free"))}
            {vip?.infinite ? " · ∞" : vip && vip.multiplier > 1 ? ` · ${vip.multiplier}×` : ""}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-subtle">
            {vip?.owner
              ? t(locale, "mintHint")
              : expires
                ? t(locale, "tierExpires", { date: expires })
                : t(locale, "accessHint")}
          </p>
        </div>

        <label className="mt-5 block text-xs tracking-wide text-muted">
          {t(locale, "accessCode")}
          <input
            value={code}
            maxLength={120}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => setCode(event.target.value)}
            className="mt-1.5 h-11 w-full rounded-[14px] border border-border bg-bg px-3 font-mono text-sm text-fg outline-none focus-visible:ring-2 focus-visible:ring-fg/30"
          />
        </label>
        <Button
          type="button"
          className="mt-3 w-full"
          disabled={busy || !code.trim()}
          onClick={() => void redeem()}
        >
          {t(locale, "accessRedeem")}
        </Button>

        {vip?.owner ? (
          <div className="mt-6 rounded-2xl border border-border bg-bg p-4">
            <p className="text-[11px] tracking-[0.2em] text-muted">
              {t(locale, "mintTitle")}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-subtle">
              {t(locale, "mintHint")}
            </p>
            <label className="mt-3 block text-xs tracking-wide text-muted">
              {t(locale, "tierLabel")}
              <select
                value={mintTier}
                onChange={(event) =>
                  setMintTier(event.target.value as Exclude<VipTier, "free">)
                }
                className="field mt-1.5"
              >
                {MINT_TIERS.map((tier) => (
                  <option key={tier} value={tier}>
                    {t(locale, tierKey(tier))}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 block text-xs tracking-wide text-muted">
              {t(locale, "mintDays")}
              <input
                type="number"
                min={1}
                max={730}
                value={mintDays}
                onChange={(event) => {
                  const n = Number(event.target.value);
                  setMintDays(Number.isFinite(n) ? Math.max(1, Math.min(730, n)) : 1);
                }}
                className="field mt-1.5"
              />
            </label>
            <Button
              type="button"
              className="mt-3 w-full"
              disabled={busy}
              onClick={() => void mint()}
            >
              {t(locale, "mintMake")}
            </Button>
            {minted ? (
              <button
                type="button"
                className="mt-3 w-full break-all rounded-xl border border-border bg-bg-elevated px-3 py-2 text-left font-mono text-xs text-fg"
                onClick={() => {
                  void navigator.clipboard?.writeText(minted).catch(() => undefined);
                }}
              >
                {t(locale, "mintMade")}: {minted}
              </button>
            ) : null}
            {codes.length ? (
              <ul className="mt-4 space-y-2">
                {codes.slice(0, 8).map((item) => (
                  <li
                    key={item.code}
                    className="rounded-xl border border-border px-3 py-2 font-mono text-[11px] leading-relaxed text-muted"
                  >
                    {item.code}
                    <span className="mt-0.5 block font-sans text-subtle">
                      {t(locale, tierKey(item.tier))} · {item.durationDays}d
                      {item.redeemed ? ` · ${t(locale, "mintUsed")}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {note ? <p className="mt-3 text-sm text-heart">{note}</p> : null}

        <Button type="button" variant="glass" className="mt-5 w-full" onClick={onClose}>
          {t(locale, "closePanel")}
        </Button>
      </div>
    </div>
  );
}
