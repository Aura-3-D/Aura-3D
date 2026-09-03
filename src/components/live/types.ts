import type { Character, Mood } from "@/lib/characters";

export type LiveSceneProps = {
  character: Character;
  affection: number;
  speaking: boolean;
  amplitude: number;
  mood: Mood;
  pointer: { x: number; y: number };
};
