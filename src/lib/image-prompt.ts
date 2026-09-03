export function enrichImagePrompt(
  raw: string,
  ctx: {
    userPersonality: string;
    companionPersonality: string;
    companionGender: "male" | "female";
  },
): string {
  const userBit =
    ctx.userPersonality.trim() || "an adult, cinematic portrait, masterpiece";
  const youBit =
    ctx.companionPersonality.trim() ||
    (ctx.companionGender === "male"
      ? "handsome man, masterpiece"
      : "beautiful women, masterpiece");
  const usBit = `${userBit} with ${youBit}`;
  return raw
    .replace(/\bus\b/gi, `(${usBit})`)
    .replace(/\bme\b/gi, `(${userBit})`)
    .replace(/\byou\b/gi, `(${youBit})`);
}
