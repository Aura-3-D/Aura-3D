const ILLEGAL =
  /\b(csam|child\s*porn|child\s*sexual|loli|lolita|shota|shotacon|prepubescent|underage|bestiality|zoophilia|rape|non[- ]consensual|snuff|real[- ]person\s+nude)\b/i;

const UNDERAGE =
  /\b(child|children|kid|kids|toddler|infant|baby|preteen|under[- ]?18|\b1[0-7][- ]year|schoolgirl|schoolboy)\b/i;

const PORN =
  /\b(porn|pornography|\bxxx\b|hentai|explicit sex|sexual intercourse|sex act|genitalia|genitals|vagina|penis|fellatio|cunnilingus|anal sex|oral sex|ejaculat|\bcum\b|creampie)\b/i;

export function blockedImageReason(prompt: string): string | null {
  const text = prompt.trim();
  if (!text) return "Describe what to generate after /imagegen.";
  if (ILLEGAL.test(text) || UNDERAGE.test(text)) {
    return "That prompt isn't allowed. No illegal content, and no anyone under 18.";
  }
  if (PORN.test(text)) {
    return "Porn and explicit sexual acts aren't allowed in image gen.";
  }
  return null;
}

export const IMAGE_PROMPT_GUARD =
  "Do not generate pornography, sexual acts, genitalia, anyone under 18, real-person sexual deepfakes, or illegal content. Tasteful adult fashion is fine. Keep the image legal.";
