import { createFileRoute } from "@tanstack/react-router";
import { parseCustomCard } from "@/lib/custom-character";
import { illegalPrivateReason, cardModerationText } from "@/lib/publish-policy";

export const Route = createFileRoute("/api/workplace")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const card = parseCustomCard(body);
        if (!card) {
          return Response.json(
            { error: "Need a name (2+ letters) and a grown-up age." },
            { status: 400 },
          );
        }
        if (card.age < 18) {
          return Response.json({ error: "Characters must be 18 or older." }, { status: 400 });
        }
        const illegal = illegalPrivateReason(cardModerationText(card));
        if (illegal) {
          return Response.json({ error: illegal }, { status: 400 });
        }

        return Response.json({
          ok: true,
          card: { ...card, portrait: "" },
        });
      },
    },
  },
});
