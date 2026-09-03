import { Link } from "@tanstack/react-router";
import { ArrowLeft, RotateCcw, Volume2, VolumeX } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from "react";
import { ChatDock } from "@/components/chat/ChatDock";
import { AffectionBar } from "@/components/hud/AffectionBar";
import { LanguageSelect } from "@/components/hud/LanguageSelect";
import { ReportControl } from "@/components/hud/ReportControl";
import { UpvoteControl } from "@/components/hud/UpvoteControl";
import type { LiveSceneProps } from "@/components/live/types";
import { Button } from "@/components/ui/button";
import {
  CHARACTERS,
  bondScaleFor,
  isCharacterId,
  parseMeta,
  stripPartialMeta,
  type Character,
} from "@/lib/characters";
import { customAsCharacter } from "@/lib/custom-character";
import { getPublished } from "@/lib/publish";
import {
  createAnalyser,
  getRecognitionCtor,
  playUrl,
  type SpeechRecognitionLike,
} from "@/lib/speech";
import { blockedImageReason } from "@/lib/image-policy";
import { LOCALE_META, t } from "@/lib/i18n";
import { useAura } from "@/lib/store";

type SceneComp = (props: LiveSceneProps) => ReactElement | null;

export function CompanionRoom({ id }: { id: string }) {
  const customCharacters = useAura((s) => s.customCharacters);
  const publishedCatalog = useAura((s) => s.publishedCatalog);
  const cachePublished = useAura((s) => s.cachePublished);
  const builtIn = isCharacterId(id) ? CHARACTERS[id] : undefined;
  const custom =
    customCharacters.find((c) => c.id === id) ??
    publishedCatalog.find((c) => c.id === id);
  const character: Character | undefined = builtIn ?? (custom ? customAsCharacter(custom) : undefined);
  const companion = useAura((s) => s.companions[id]);
  const voiceEnabled = useAura((s) => s.voiceEnabled);
  const autoSpeak = useAura((s) => s.autoSpeak);
  const locale = useAura((s) => s.locale);
  const profile = useAura((s) => s.profile);
  const addMessage = useAura((s) => s.addMessage);
  const updateMessage = useAura((s) => s.updateMessage);
  const applyBond = useAura((s) => s.applyBond);
  const setMood = useAura((s) => s.setMood);
  const resetCompanion = useAura((s) => s.resetCompanion);
  const setVoiceEnabled = useAura((s) => s.setVoiceEnabled);
  const setAffection = useAura((s) => s.setAffection);

  const [Scene, setScene] = useState<SceneComp | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState("Listening…");
  const [speaking, setSpeaking] = useState(false);
  const [amplitude, setAmplitude] = useState(0);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<ReturnType<typeof createAnalyser> | null>(null);
  const ampRaf = useRef<number | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const listenLock = useRef(false);
  const busyRef = useRef(false);

  const [canListen, setCanListen] = useState(false);
  const affection = companion?.affection ?? 8;
  const mood = companion?.mood ?? "idle";
  const messages = companion?.messages ?? [];

  useEffect(() => {
    setCanListen(getRecognitionCtor() !== null);
  }, []);

  useEffect(() => {
    if (builtIn || custom) return;
    let live = true;
    void getPublished({ data: id }).then((res) => {
      if (live && res.card) cachePublished(res.card);
    });
    return () => {
      live = false;
    };
  }, [builtIn, cachePublished, custom, id]);

  useEffect(() => {
    let active = true;
    void import("@/components/live/LiveScene").then((mod) => {
      if (active) setScene(() => mod.LiveScene);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;
    try {
      analyserRef.current = createAnalyser(audio);
    } catch {
      analyserRef.current = null;
    }
    return () => {
      audio.pause();
      audio.src = "";
      analyserRef.current?.ctx.close().catch(() => undefined);
      if (ampRaf.current) cancelAnimationFrame(ampRaf.current);
      recRef.current?.stop();
    };
  }, []);

  const pumpAmplitude = useCallback(() => {
    const read = analyserRef.current?.read;
    if (!read) return;
    const tick = () => {
      setAmplitude(read());
      ampRaf.current = requestAnimationFrame(tick);
    };
    if (ampRaf.current) cancelAnimationFrame(ampRaf.current);
    ampRaf.current = requestAnimationFrame(tick);
  }, []);

  const stopAmplitude = useCallback(() => {
    if (ampRaf.current) cancelAnimationFrame(ampRaf.current);
    ampRaf.current = null;
    setAmplitude(0);
  }, []);

  const speak = useCallback(
    async (text: string) => {
      if (!voiceEnabled || !autoSpeak || !text.trim()) return;
      const audio = audioRef.current;
      if (!audio) return;
      try {
        await analyserRef.current?.resume();
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            voiceId: character?.voiceId ?? "eve",
            language: locale,
          }),
        });
        if (!res.ok) throw new Error("tts");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setSpeaking(true);
        pumpAmplitude();
        try {
          await playUrl(audio, url);
        } finally {
          URL.revokeObjectURL(url);
          setSpeaking(false);
          stopAmplitude();
        }
      } catch {
        setSpeaking(false);
        stopAmplitude();
      }
    },
    [autoSpeak, character?.voiceId, locale, pumpAmplitude, stopAmplitude, voiceEnabled],
  );

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busyRef.current || !character) return;

      const affectionMatch = trimmed.match(/^TestingAffection=(\d{1,3})$/i);
      if (affectionMatch) {
        const next = setAffection(id, Number(affectionMatch[1]));
        addMessage(id, { role: "user", content: trimmed });
        addMessage(id, {
          role: "assistant",
          content: t(locale, "affectionSet", { n: next }),
        });
        return;
      }

      if (trimmed.toLowerCase().startsWith("/imagegen")) {
        const prompt = trimmed.slice("/imagegen".length).trim();
        const blocked = blockedImageReason(prompt);
        addMessage(id, { role: "user", content: trimmed });
        if (blocked) {
          addMessage(id, { role: "assistant", content: blocked });
          return;
        }
        busyRef.current = true;
        setBusyLabel(t(locale, "makingImage"));
        setBusy(true);
        setError(null);
        const assistantId = addMessage(id, {
          role: "assistant",
          content: t(locale, "makingThat"),
        });
        try {
          const res = await fetch("/api/image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt,
              characterId: id,
              custom: custom ?? undefined,
              profile,
            }),
          });
          const payload = (await res.json().catch(() => null)) as {
            image?: string;
            error?: string;
          } | null;
          if (!res.ok || !payload?.image) {
            throw new Error(payload?.error || t(locale, "imageFailed"));
          }
          updateMessage(id, assistantId, t(locale, "here"), payload.image);
        } catch (err) {
          const message =
            err instanceof Error ? err.message : t(locale, "imageFailed");
          updateMessage(id, assistantId, message);
          setError(message);
        } finally {
          busyRef.current = false;
          setBusy(false);
          setBusyLabel(t(locale, "listening"));
        }
        return;
      }

      busyRef.current = true;
      setError(null);
      setBusyLabel(t(locale, "listening"));
      setBusy(true);
      addMessage(id, { role: "user", content: trimmed });
      const assistantId = addMessage(id, { role: "assistant", content: "" });
      const history = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: trimmed },
      ].filter(
        (item) =>
          !/^TestingAffection=/i.test(item.content) &&
          !item.content.toLowerCase().startsWith("/imagegen"),
      );
      let spokenText: string | null = null;
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            characterId: id,
            affection,
            locale,
            profile,
            custom: custom ?? undefined,
            messages: history,
          }),
        });
        const rawBody = await res.text();
        let payload: { text?: string; error?: string } | null = null;
        try {
          payload = JSON.parse(rawBody) as { text?: string; error?: string };
        } catch {
          payload = null;
        }
        const reply = payload?.text?.trim() ?? "";
        if (!res.ok || !reply) {
          const detail =
            payload?.error?.trim() ||
            (rawBody.trim() && !rawBody.trim().startsWith("<")
              ? rawBody.trim().slice(0, 240)
              : "") ||
            `Chat error ${res.status || "unknown"}`;
          updateMessage(id, assistantId, detail);
          setError(detail);
          return;
        }
        updateMessage(id, assistantId, stripPartialMeta(reply));
        const { clean, spoken, mood: nextMood, bond } = parseMeta(reply);
        updateMessage(id, assistantId, clean);
        const depth = trimmed.length >= 160 ? 2 : trimmed.length >= 72 ? 1 : 0;
        applyBond(id, Math.round((bond + depth) * bondScaleFor(id)), nextMood);
        spokenText = spoken || clean;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong";
        setError(message);
        updateMessage(id, assistantId, message);
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
      if (spokenText) {
        try {
          await speak(spokenText);
        } catch (ttsErr) {
          const ttsMessage = ttsErr instanceof Error ? ttsErr.message : "tts";
          console.warn("[tts] skipped, keeping chat text", ttsMessage);
        }
      }
    },
    [
      addMessage,
      affection,
      applyBond,
      id,
      locale,
      messages,
      profile,
      setAffection,
      custom,
      speak,
      updateMessage,
    ],
  );

  const toggleMic = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setError(t(locale, "noMic"));
      return;
    }
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    analyserRef.current?.resume().catch(() => undefined);
    const rec = new Ctor();
    rec.lang = LOCALE_META[locale].stt;
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (event) => {
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result && result.isFinal) finalText += result[0].transcript;
      }
      if (finalText.trim() && !listenLock.current) {
        listenLock.current = true;
        setListening(false);
        rec.stop();
        void send(finalText.trim());
      }
    };
    rec.onerror = () => {
      setListening(false);
    };
    rec.onend = () => {
      setListening(false);
      listenLock.current = false;
    };
    recRef.current = rec;
    listenLock.current = false;
    try {
      rec.start();
      setListening(true);
      setError(null);
    } catch {
      setError(t(locale, "micFail"));
    }
  }, [listening, locale, send]);

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    setPointer({
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y)),
    });
  };

  if (!character) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg text-muted">
        <p className="text-[11px] font-medium tracking-[0.28em]">aura-3d</p>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-dvh overflow-hidden bg-bg text-fg"
      onPointerMove={onPointerMove}
    >
      {Scene ? (
        <Scene
          character={character}
          affection={affection}
          speaking={speaking}
          amplitude={amplitude}
          mood={mood}
          pointer={pointer}
        />
      ) : (
        <img
          src={character.portrait}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
      )}
      <div className="aura-vignette" />
      <div className="aura-grain" />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-5">
        <div className="pointer-events-auto flex items-center gap-2">
          <Button variant="glass" size="iconSm" asChild>
            <Link to="/" aria-label={t(locale, "back")}>
              <ArrowLeft />
            </Link>
          </Button>
          <div className="rounded-full border border-border bg-bg/55 px-3 py-1.5 backdrop-blur-md">
            <p className="text-sm font-medium leading-none">{character.name}</p>
          </div>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <UpvoteControl
            cardId={id}
            mine={publishedCatalog.find((c) => c.id === id)?.mine}
            upvotes={publishedCatalog.find((c) => c.id === id)?.upvotes ?? 0}
            voted={publishedCatalog.find((c) => c.id === id)?.voted ?? false}
          />
          <ReportControl
            cardId={id}
            mine={publishedCatalog.find((c) => c.id === id)?.mine}
          />
          <LanguageSelect compact />
          <Button
            variant="glass"
            size="iconSm"
            aria-label={voiceEnabled ? t(locale, "mute") : t(locale, "unmute")}
            onClick={() => setVoiceEnabled(!voiceEnabled)}
          >
            {voiceEnabled ? <Volume2 /> : <VolumeX />}
          </Button>
          <Button
            variant="glass"
            size="iconSm"
            aria-label={t(locale, "reset")}
            onClick={() => {
              audioRef.current?.pause();
              resetCompanion(id);
              setMood(id, "idle");
              setError(null);
              setSpeaking(false);
              stopAmplitude();
            }}
          >
            <RotateCcw />
          </Button>
        </div>
      </header>

      <div className="pointer-events-none absolute inset-x-0 top-16 z-20 px-4 sm:top-20 sm:px-6">
        <div className="pointer-events-auto mx-auto w-full max-w-sm rounded-2xl border border-border bg-bg/50 px-3 py-2.5 backdrop-blur-md">
          <AffectionBar value={affection} accent={character.accent} />
        </div>
      </div>

      <ChatDock
        messages={messages}
        busy={busy}
        busyLabel={busyLabel}
        listening={listening}
        canListen={canListen}
        error={error}
        onSend={send}
        onToggleMic={toggleMic}
      />
    </div>
  );
}
