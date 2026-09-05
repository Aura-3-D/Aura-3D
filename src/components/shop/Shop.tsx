// delete postToShopier(...) entirely

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
    setWallet(res.wallet);
  } catch {
    setNote(t(locale, "tooFast"));
  } finally {
    setBusy(null);
  }
}