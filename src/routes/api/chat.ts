import { createFileRoute } from "@tanstack/react-router";
import {
  CHARACTERS,
  affectionDirective,
  isCharacterId,
  profileDirective,
} from "@/lib/characters";
import { buildCustomPrompt, parseCustomCard } from "@/lib/custom-character";
import { isLocale, languageDirective } from "@/lib/i18n";
import { enforceRate, waitForKind, withRateHeaders } from "@/lib/rate-limit";

type Incoming = {
  characterId?: string;
  affection?: number;
  locale?: string;
  profile?: { name?: string; personality?: string; interests?: string };
  custom?: unknown;
  group?: { names?: string[]; turn?: boolean };
  messages?: { role?: string; content?: string }[];
};

function jsonError(error: string, status: number, headers: Headers) {
  return withRateHeaders(Response.json({ error, status }, { status }), headers);
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const wait = await waitForKind("text");
        const limited = enforceRate(request, "text", wait);
        if (!limited.ok) return limited.response;

        try {
          let body: Incoming;
          try {
            body = (await request.json()) as Incoming;
          } catch {
            return jsonError("Invalid JSON", 400, limited.headers);
          }

          const characterId = body.characterId ?? "";
          const custom = parseCustomCard(body.custom);
          const builtIn = isCharacterId(characterId) ? CHARACTERS[characterId] : null;
          const name = builtIn?.name ?? custom?.name;
          if (!name) {
            return jsonError("Unknown companion", 400, limited.headers);
          }

          const { getSessionUser } = await import("@/lib/auth/verify.server");
          const user = await getSessionUser();
          if (!user) {
            return jsonError("Sign in to talk.", 401, limited.headers);
          }
          const { consumeText } = await import("@/lib/wallet.server");
          const spent = await consumeText(user.id);
          if (!spent.ok) {
            return jsonError(spent.error, 402, limited.headers);
          }

          const { completeRoleplayChat, ROLEPLAY_SYSTEM } = await import(
            "@/lib/openrouter.server"
          );
          const systemPrompt = builtIn
            ? builtIn.systemPrompt
            : buildCustomPrompt(custom!);

          const affection = Math.max(0, Math.min(100, Number(body.affection) || 0));
          const history = (body.messages ?? [])
            .filter(
              (item) =>
                (item.role === "user" || item.role === "assistant") &&
                typeof item.content === "string" &&
                item.content.trim().length > 0,
            )
            .slice(-20)
            .map((item) => ({
              role: item.role as "user" | "assistant",
              content: item.content!.slice(0, 1200),
            }));

          if (history.length === 0) {
            return jsonError("Empty thread", 400, limited.headers);
          }

          const groupNames = (body.group?.names ?? [])
            .map((n) => String(n).slice(0, 40))
            .filter(Boolean)
            .slice(0, 6);
          const isGroup = groupNames.length > 1;
          if (!isGroup) {
            const last = history[history.length - 1];
            if (!last || last.role !== "user") {
              return jsonError("Last message must be from user", 400, limited.headers);
            }
          } else {
            history.push({
              role: "user",
              content: body.group?.turn
                ? `[Room] ${name}, it is only your turn. Reply as yourself, one voice. Do not speak for the others.`
                : `[Room] ${name}, reply as yourself to the latest human line. Do not speak for the others.`,
            });
          }

          const who = profileDirective({
            name: String(body.profile?.name ?? ""),
            personality: String(body.profile?.personality ?? ""),
            interests: String(body.profile?.interests ?? ""),
          });
          const groupBlock = isGroup
            ? `GROUP ROOM: You are ${name}. Also here: ${groupNames.join(", ")}. Never write their lines. Never mention the room instruction.`
            : "";
          const system = [
            ROLEPLAY_SYSTEM,
            systemPrompt,
            affectionDirective(affection),
            languageDirective(isLocale(body.locale) ? body.locale : "en"),
            who,
            groupBlock,
          ]
            .filter(Boolean)
            .join("\n\n");

          const result = await completeRoleplayChat({ system, messages: history });
          if (!result.ok) {
            console.error("[api/chat] LLM failed", {
              status: result.status,
              message: result.error,
            });
            const status = result.status === 402 ? 402 : result.status === 401 ? 401 : 503;
            return jsonError(result.error, status, limited.headers);
          }

          return withRateHeaders(
            Response.json(
              { text: result.text },
              {
                headers: {
                  "Cache-Control": "no-store",
                },
              },
            ),
            limited.headers,
          );
        } catch (err) {
          const message =
            err instanceof Error && err.message
              ? err.message.slice(0, 240)
              : "Chat failed";
          console.error("[api/chat] exception", {
            status: 503,
            message,
          });
          return jsonError(message, 503, limited.headers);
        }
      },
    },
  },
});
