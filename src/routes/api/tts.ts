import { createFileRoute } from "@tanstack/react-router";

type Incoming = {
  text?: string;
  voiceId?: string;
  language?: string;
};

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.XAI_API_KEY;
        if (!apiKey) {
          return Response.json(
            { error: "Voice is not available in this environment" },
            { status: 503 },
          );
        }

        let body: Incoming;
        try {
          body = (await request.json()) as Incoming;
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const text = (body.text ?? "").trim().slice(0, 900);
        if (!text) {
          return Response.json({ error: "Missing text" }, { status: 400 });
        }

        const { getSessionUser } = await import("@/lib/auth/verify.server");
        const user = await getSessionUser();
        if (user) {
          const { consumeVoice, estimateVoiceMs } = await import("@/lib/wallet.server");
          const used = await consumeVoice(user.id, estimateVoiceMs(text));
          if (!used.ok) {
            return Response.json({ error: used.error }, { status: 402 });
          }
        }

        const voiceId = (body.voiceId ?? "eve").toLowerCase().replace(/[^a-z0-9_-]/g, "");
        const allowed = new Set(["en", "tr", "ru", "de", "ar", "es"]);
        const raw = (body.language ?? "en").toLowerCase();
        const language = allowed.has(raw) ? raw : "en";

        try {
          const res = await fetch("https://api.x.ai/v1/tts", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              text,
              voice_id: voiceId,
              language,
            }),
          });

          if (!res.ok) {
            const detail = await res.text().catch(() => "");
            console.error("[tts] provider error", {
              status: res.status,
              message: detail.slice(0, 240),
            });
            return Response.json(
              { error: `TTS error ${res.status}`, detail: detail.slice(0, 240) },
              { status: 503 },
            );
          }

          const audio = await res.arrayBuffer();
          const contentType = res.headers.get("content-type") || "audio/mpeg";
          return new Response(audio, {
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "no-store",
            },
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error("[tts] exception", { status: 503, message });
          return Response.json({ error: message || "TTS failed" }, { status: 503 });
        }
      },
    },
  },
});
