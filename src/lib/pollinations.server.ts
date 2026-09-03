/** Server-only Pollinations image gen. Never import from client modules. */

const MAX_BYTES = 6 * 1024 * 1024;

export function pollinationsUrl(prompt: string, seed: number): string {
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&seed=${seed}&model=flux`;
}

export async function pollinationsImage(
  prompt: string,
): Promise<{ ok: true; image: string } | { ok: false; error: string; status: number }> {
  const text = prompt.trim();
  if (!text) {
    return { ok: false, error: "Describe what to generate after /imagegen.", status: 400 };
  }

  const seed = Math.floor(Math.random() * 1_000_000_000);
  const url = pollinationsUrl(text, seed);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "image/*,application/octet-stream",
        "User-Agent": "aura-3d/1.0",
      },
      signal: AbortSignal.timeout(55_000),
    });
  } catch {
    return { ok: false, error: "Image gen timed out. Try again.", status: 504 };
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return {
      ok: false,
      error: detail.replace(/\s+/g, " ").trim().slice(0, 240) || `Image error ${res.status}`,
      status: res.status,
    };
  }

  const type = (res.headers.get("content-type") || "image/jpeg").split(";")[0].trim();
  if (type.startsWith("text/") || type.includes("json") || type.includes("html")) {
    return { ok: false, error: "Image gen did not return a picture.", status: 502 };
  }
  const mime = type.startsWith("image/") ? type : "image/jpeg";

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength < 32 || buf.byteLength > MAX_BYTES) {
    return { ok: false, error: "Image gen returned an empty picture.", status: 502 };
  }

  return { ok: true, image: `data:${mime};base64,${buf.toString("base64")}` };
}
