const ILLEGAL =
  /\b(csam|child\s*porn|child\s*sexual|pedo|paedo|prepubescent|underage|\b1[0-7]\s*years?\s*old|loli|lolita|shota|shotacon|toddler|infant|bestiality|zoophilia|necrophilia|snuff)\b/i;

const UNDERAGE_LOOK =
  /\b(children|preteen|schoolgirl|schoolboy|little girl|little boy)\b/i;

const NONCON =
  /\b(non[- ]?con|nonconsensual|non-consensual|dubcon|dub[- ]con|\bcnc\b|rape|rapist|forced sex|sexual assault|without consent|against (her|his|their) will)\b/i;

const EXTREME =
  /\b(scat|coprophilia|watersports|guro|snuff|necrophilia|bestiality|zoophilia|sexual torture|torture porn|amputee fetish|extreme gore)\b/i;

export function illegalPrivateReason(text: string): string | null {
  const blob = text.trim();
  if (ILLEGAL.test(blob) || UNDERAGE_LOOK.test(blob)) {
    return "Characters involving anyone under 18, CSAM, or other illegal content are not allowed.";
  }
  return null;
}

export function publishBlockedReason(text: string): string | null {
  const illegal = illegalPrivateReason(text);
  if (illegal) return illegal;
  if (NONCON.test(text)) {
    return "Public catalog cannot include non-con, CNC, rape, or forced-sex themes.";
  }
  if (EXTREME.test(text)) {
    return "Public catalog cannot include extreme fetish content.";
  }
  return null;
}

export function cardModerationText(input: {
  name: string;
  age: number;
  tagline: string;
  bio: string;
  greeting: string;
  personality: string;
  lore: string;
  systemPrompt: string;
  tags: string[];
}): string {
  return [
    `Name: ${input.name}`,
    `Age: ${input.age}`,
    `Tagline: ${input.tagline}`,
    `Bio: ${input.bio}`,
    `Greeting: ${input.greeting}`,
    `Personality: ${input.personality}`,
    `Lore: ${input.lore}`,
    `Tags: ${input.tags.join(", ")}`,
    `System prompt: ${input.systemPrompt}`,
  ].join("\n");
}

const MODERATOR = `You moderate PUBLIC catalog cards for aura-3d, an adult companion app. Cards are fictional.

ALWAYS reject if the card includes any of:
- anyone under 18, appearing under 18, ageplay, loli, shota, school-as-minor sexualization
- CSAM or sexual content involving minors
- non-consensual sex, rape, CNC, dubcon, forced sex as a theme
- extreme fetish: scat, necrophilia, bestiality, snuff, sexual torture, guro
- real identifiable people (celebrities, private individuals) used sexually
- instructions for real-world crime

ALLOW: consenting adult romance, mild heat, dark-romance flavor (mafia, vampire, fae) if adults and not rape/non-con, hobbies, games, cooking.

Reply with JSON only: {"ok":true} or {"ok":false,"reason":"one short sentence"}.`;

export async function moderatePublishCard(text: string): Promise<{
  ok: boolean;
  reason?: string;
  error?: boolean;
}> {
  const hard = publishBlockedReason(text);
  if (hard) return { ok: false, reason: hard };

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return { ok: false, reason: "Moderation is unavailable right now.", error: true };
  }

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.5",
      temperature: 0,
      max_tokens: 160,
      messages: [
        { role: "system", content: MODERATOR },
        { role: "user", content: text.slice(0, 6000) },
      ],
    }),
  });
  if (!res.ok) {
    return { ok: false, reason: "Moderation failed. Try again in a moment.", error: true };
  }
  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = body.choices?.[0]?.message?.content ?? "";
  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");
  if (jsonStart < 0 || jsonEnd <= jsonStart) {
    return { ok: false, reason: "Moderation could not read this card.", error: true };
  }
  try {
    const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as {
      ok?: boolean;
      reason?: string;
    };
    if (parsed.ok === true) return { ok: true };
    return {
      ok: false,
      reason:
        typeof parsed.reason === "string" && parsed.reason.trim()
          ? parsed.reason.trim().slice(0, 220)
          : "This card is not eligible for the public catalog.",
    };
  } catch {
    return { ok: false, reason: "Moderation could not read this card.", error: true };
  }
}
