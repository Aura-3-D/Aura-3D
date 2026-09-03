export type RateKind = "text" | "image" | "workplace";

const WINDOW_MS: Record<RateKind, number> = {
  text: 2_000,
  image: 10_000,
  workplace: 0,
};

type Bucket = Map<string, number>;

function buckets(): Record<RateKind, Bucket> {
  const g = globalThis as typeof globalThis & {
    __auraRate?: Record<RateKind, Bucket>;
  };
  if (!g.__auraRate) {
    g.__auraRate = {
      text: new Map(),
      image: new Map(),
      workplace: new Map(),
    };
  }
  return g.__auraRate;
}

function cookieSid(request: Request): { sid: string; setCookie?: string } {
  const raw = request.headers.get("cookie") ?? "";
  const match = raw.match(/(?:^|;\s*)aura-sid=([a-zA-Z0-9_-]{8,64})/);
  if (match?.[1]) return { sid: match[1] };
  const sid = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  return {
    sid,
    setCookie: `aura-sid=${sid}; Path=/; Max-Age=31536000; SameSite=Lax`,
  };
}

function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim().slice(0, 80);
  return request.headers.get("x-real-ip")?.slice(0, 80) || "local";
}

export function enforceRate(
  request: Request,
  kind: RateKind,
  waitMs?: number,
): { ok: true; headers: Headers } | { ok: false; response: Response } {
  const { setCookie } = cookieSid(request);
  const wait = waitMs ?? WINDOW_MS[kind];
  const key = clientIp(request);
  const now = Date.now();
  const store = buckets()[kind];
  const last = store.get(key) ?? 0;
  const headers = new Headers();
  if (setCookie) headers.set("Set-Cookie", setCookie);

  if (wait <= 0) {
    return { ok: true, headers };
  }

  if (now - last < wait) {
    const retry = Math.ceil((wait - (now - last)) / 1000);
    headers.set("Retry-After", String(Math.max(1, retry)));
    headers.set("Content-Type", "application/json");
    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          error: `Too fast. Wait ${retry}s.`,
          retryAfter: retry,
          kind,
        }),
        { status: 429, headers },
      ),
    };
  }

  store.set(key, now);
  if (store.size > 4000) {
    const cutoff = now - 10 * 60_000;
    for (const [k, at] of store) {
      if (at < cutoff) store.delete(k);
    }
  }
  return { ok: true, headers };
}

export function withRateHeaders(base: Response, extra: Headers): Response {
  extra.forEach((value, key) => {
    if (!base.headers.has(key)) base.headers.set(key, value);
  });
  return base;
}

export async function waitForKind(kind: RateKind): Promise<number> {
  try {
    const { getSessionUser } = await import("@/lib/auth/verify.server");
    const { loadVip, waitMs, BASE_CHAT_MS, BASE_IMAGE_MS } = await import(
      "@/lib/vip.server"
    );
    const user = await getSessionUser();
    if (!user) return kind === "workplace" ? 0 : kind === "image" ? BASE_IMAGE_MS : BASE_CHAT_MS;
    const vip = await loadVip(user.id);
    if (kind === "workplace") return 0;
    const base = kind === "image" ? BASE_IMAGE_MS : BASE_CHAT_MS;
    return waitMs(base, vip);
  } catch {
    return kind === "workplace" ? 0 : kind === "image" ? 10_000 : 2_000;
  }
}
