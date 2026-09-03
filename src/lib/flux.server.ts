/** Server-only FLUX.1 [schnell] via fal.ai. Never import from client modules. */

const MAX_BYTES = 6 * 1024 * 1024;
const FAL_SCHNELL = "https://fal.run/fal-ai/flux/schnell";

function envVar(name: string): string | null {
  try {
    const value = process.env[name];
    return typeof value === "string" && value.trim() ? value.trim() : null;
  } catch {
    return null;
  }
}

export function falKey(): string | null {
  return envVar("FAL_KEY") || envVar("FAL_API_KEY");
}

type FalImage = { url?: string; content_type?: string };
type FalBody = { images?: FalImage[]; detail?: string; error?: string };

async function urlToDataImage(
  url: string,
): Promise<{ ok: true; image: string } | { ok: false; error: string; status: number }> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: { Accept: "image/*,application/octet-stream" },
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    return { ok: false, error: "Image download timed out.", status: 504 };
  }
  if (!res.ok) {
    return { ok: false, error: `Image download ${res.status}`, status: 502 };
  }
  const type = (res.headers.get("content-type") || "image/jpeg").split(";")[0].trim();
  const mime = type.startsWith("image/") ? type : "image/jpeg";
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength < 32 || buf.byteLength > MAX_BYTES) {
    return { ok: false, error: "Image gen returned an empty picture.", status: 502 };
  }
  return { ok: true, image: `data:${mime};base64,${buf.toString("base64")}` };
}

export async function fluxSchnellImage(
  prompt: string,
): Promise<{ ok: true; image: string } | { ok: false; error: string; status: number }> {
  const text = prompt.trim();
  if (!text) {
    return { ok: false, error: "Describe what to generate after /imagegen.", status: 400 };
  }

  const key = falKey();
  if (!key) {
    console.error("[image] FAL_KEY is not set on the server");
    return { ok: false, error: "Image gen is not configured.", status: 503 };
  }

  let res: Response;
  try {
    res = await fetch(FAL_SCHNELL, {
      method: "POST",
      headers: {
        Authorization: `Key ${key}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(9_000),
      body: JSON.stringify({
        prompt: text,
        image_size: "square_hd",
        num_inference_steps: 4,
        num_images: 1,
        output_format: "jpeg",
        enable_safety_checker: true,
        acceleration: "none",
      }),
    });
  } catch {
    return { ok: false, error: "Image gen timed out. Try again.", status: 504 };
  }

  const raw = await res.text().catch(() => "");
  let json: FalBody = {};
  try {
    json = raw ? (JSON.parse(raw) as FalBody) : {};
  } catch {
    json = {};
  }

  if (!res.ok) {
    const detail = (json.detail || json.error || raw)
      .toString()
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 240);
    const status = res.status === 402 || res.status === 401 ? res.status : 503;
    console.error("[image] fal schnell error", { status: res.status, detail });
    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: "Image API key rejected.", status: 401 };
    }
    if (res.status === 402) {
      return { ok: false, error: "Image provider is out of credit.", status: 402 };
    }
    return { ok: false, error: detail || `Image error ${res.status}`, status };
  }

  const url = json.images?.[0]?.url;
  if (!url) {
    console.error("[image] fal schnell empty images", raw.slice(0, 240));
    return { ok: false, error: "Image gen did not return a picture.", status: 502 };
  }

  return urlToDataImage(url);
}
