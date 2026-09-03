import { SHARED_RULES, type Character } from "./characters";

export const CUSTOM_PREFIX = "custom-";
export const VOICE_IDS = [
  "eve",
  "leo",
  "iris",
  "rex",
  "ara",
  "luna",
  "atlas",
  "orion",
  "carina",
  "liora",
  "sal",
  "marina",
  "liv",
] as const;

export type CustomCard = {
  schema: "aura-3d-character-v1";
  id: string;
  name: string;
  age: number;
  voiceId: string;
  tagline: string;
  bio: string;
  greeting: string;
  personality: string;
  lore: string;
  systemPrompt: string;
  tags: string[];
  kind: "realistic" | "fantastic";
  accent: string;
  portrait: string;
  createdAt: number;
  mine?: boolean;
  upvotes?: number;
  voted?: boolean;
};

export function isCustomId(value: string): boolean {
  return value.startsWith(CUSTOM_PREFIX) && value.length < 80;
}

export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
  return `${CUSTOM_PREFIX}${base || "oc"}-${Math.random().toString(36).slice(2, 6)}`;
}

function clip(value: unknown, max: number): string {
  return String(value ?? "")
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, max);
}

export function parseCustomCard(raw: unknown): CustomCard | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const name = clip(o.name, 40);
  if (name.length < 2) return null;
  const age = Math.max(18, Math.min(80, Number(o.age) || 24));
  const voiceRaw = clip(o.voiceId, 24).toLowerCase();
  const voiceId = (VOICE_IDS as readonly string[]).includes(voiceRaw)
    ? voiceRaw
    : "eve";
  const kind = o.kind === "fantastic" ? "fantastic" : "realistic";
  const tags = Array.isArray(o.tags)
    ? o.tags
        .map((tag) => clip(tag, 24).toLowerCase())
        .filter(Boolean)
        .slice(0, 8)
    : [kind];
  if (!tags.includes(kind)) tags.unshift(kind);
  const id = isCustomId(clip(o.id, 80)) ? clip(o.id, 80) : slugify(name);
  const portrait = clip(o.portrait, 400_000);
  return {
    schema: "aura-3d-character-v1",
    id,
    name,
    age,
    voiceId,
    tagline: clip(o.tagline, 120) || "A custom companion.",
    bio: clip(o.bio, 400),
    greeting: clip(o.greeting, 400) || `Hi. I'm ${name}.`,
    personality: clip(o.personality, 600),
    lore: clip(o.lore, 800),
    systemPrompt: clip(o.systemPrompt, 2500),
    tags,
    kind,
    accent: /^#[0-9a-fA-F]{6}$/.test(clip(o.accent, 7))
      ? clip(o.accent, 7)
      : "#9ec4ea",
    portrait: portrait.startsWith("data:image/") || portrait.startsWith("/")
      ? portrait
      : "",
    createdAt: Number(o.createdAt) || Date.now(),
  };
}

export function customAsCharacter(card: CustomCard): Character {
  return {
    id: card.id,
    name: card.name,
    age: card.age,
    voiceId: card.voiceId,
    tagline: card.tagline,
    bio: card.bio,
    greeting: card.greeting,
    portrait: card.portrait || "/favicon.svg",
    video: "",
    accent: card.accent,
    mouth: { x: 0.5, y: 0.6 },
    lore: card.lore,
    personality: card.personality,
    systemPrompt: buildCustomPrompt(card),
  };
}

export function buildCustomPrompt(card: CustomCard): string {
  const body =
    card.systemPrompt.trim() ||
    `You are ${card.name}, ${card.age}. ${card.personality}\n${card.lore}`;
  return `${body}

${SHARED_RULES}

Stay the character on this card. Do not invent underage anyone. Obey the intimacy gate when it is attached.`;
}

export function exportCard(card: CustomCard, withPortrait = false): string {
  const out: CustomCard = {
    ...card,
    portrait: withPortrait ? card.portrait : "",
  };
  return JSON.stringify(out, null, 2);
}
