export type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

type RecognitionCtor = new () => SpeechRecognitionLike;

export function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function detectSpeechLang(text: string): "tr" | "en" {
  if (/[çğıöşüÇĞİÖŞÜ]/.test(text)) return "tr";
  const trHints = /\b(ve|bir|ben|sen|merhaba|neden|nasıl|çok|değil|misin|misın)\b/i;
  if (trHints.test(text) && !/[A-Za-z]{4,}/.test(text.replace(trHints, ""))) {
    return "tr";
  }
  return "en";
}

export async function playUrl(
  audio: HTMLAudioElement,
  url: string,
): Promise<void> {
  audio.pause();
  audio.currentTime = 0;
  audio.src = url;
  await audio.play();
  await new Promise<void>((resolve, reject) => {
    const onEnded = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("audio failed"));
    };
    const cleanup = () => {
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
  });
}

export function createAnalyser(audio: HTMLAudioElement): {
  ctx: AudioContext;
  analyser: AnalyserNode;
  read: () => number;
  resume: () => Promise<void>;
} {
  const AudioCtx =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) {
    throw new Error("AudioContext unavailable");
  }
  const ctx = new AudioCtx();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  analyser.smoothingTimeConstant = 0.72;
  const source = ctx.createMediaElementSource(audio);
  source.connect(analyser);
  analyser.connect(ctx.destination);
  const time = new Uint8Array(analyser.fftSize);
  const read = () => {
    analyser.getByteTimeDomainData(time);
    let sum = 0;
    for (let i = 0; i < time.length; i++) {
      const v = (time[i]! - 128) / 128;
      sum += v * v;
    }
    return Math.min(1, Math.max(0, Math.sqrt(sum / time.length) * 2.6 - 0.035));
  };
  return {
    ctx,
    analyser,
    read,
    resume: () => (ctx.state === "suspended" ? ctx.resume() : Promise.resolve()),
  };
}
