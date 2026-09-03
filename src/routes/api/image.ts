import { createFileRoute } from "@tanstack/react-router";
import {
  CHARACTERS,
  characterGender,
  isCharacterId,
} from "@/lib/characters";
import { parseCustomCard } from "@/lib/custom-character";
import { blockedImageReason, IMAGE_PROMPT_GUARD } from "@/lib/image-policy";
import { enrichImagePrompt } from "@/lib/image-prompt";
import { enforceRate, waitForKind, withRateHeaders } from "@/lib/rate-limit";

type Incoming = {
  prompt?: string;
  characterId?: string;
  custom?: unknown;
  profile?: { name?: string; personality?: string; interests?: string };
};

export const Route = createFileRoute("/api/image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const wait = await waitForKind("image");
        const limited = enforceRate(request, "image", wait);
        if (!limited.ok) return limited.response;

        let body: Incoming;
        try {
          body = (await request.json()) as Incoming;
        } catch {
          return withRateHeaders(
            Response.json({ error: "Invalid JSON" }, { status: 400 }),
            limited.headers,
          );
        }

        const prompt = (body.prompt ?? "").trim().slice(0, 800);
        const blocked = blockedImageReason(prompt);
        if (blocked) {
          return withRateHeaders(
            Response.json({ error: blocked }, { status: 400 }),
            limited.headers,
          );
        }

        const { getSessionUser } = await import("@/lib/auth/verify.server");
        const user = await getSessionUser();
        if (!user) {
          return withRateHeaders(
            Response.json({ error: "Sign in to generate images." }, { status: 401 }),
            limited.headers,
          );
        }
        const { consumeImage, undoImage } = await import("@/lib/wallet.server");
        const spent = await consumeImage(user.id);
        if (!spent.ok) {
          return withRateHeaders(
            Response.json({ error: spent.error }, { status: 402 }),
            limited.headers,
          );
        }

        const custom = parseCustomCard(body.custom);
        const builtIn = isCharacterId(body.characterId ?? "")
          ? CHARACTERS[body.characterId as keyof typeof CHARACTERS]
          : null;
        const gender = characterGender(builtIn?.id ?? custom?.id ?? "", {
          voiceId: custom?.voiceId,
          tags: custom?.tags,
        });
        const enriched = enrichImagePrompt(prompt, {
          userPersonality: String(body.profile?.personality ?? ""),
          companionPersonality: builtIn?.personality ?? custom?.personality ?? "",
          companionGender: gender,
        });

        const { fluxSchnellImage } = await import("@/lib/flux.server");
const result = await fluxSchnellImage(`${enriched}. ${IMAGE_PROMPT_GUARD}`);

if (!result.ok) {
  if (spent.charged) await undoImage(user.id, spent.spent);
  return withRateHeaders(
    Response.json({ error: result.error }, { status: result.status }),
    limited.headers
  );
}

return withRateHeaders(Response.json({ image: result.image }), limited.headers);
      },
    },
  },
});
