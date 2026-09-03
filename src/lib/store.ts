import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type CharacterId, type Mood, isCharacterId } from "./characters";
import { characterCopy, isGreetingText } from "./character-copy";
import { isCustomId, parseCustomCard, type CustomCard } from "./custom-character";
import { isLocale, type Locale } from "./i18n";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  at: number;
  image?: string;
};

export type CompanionSave = {
  affection: number;
  mood: Mood;
  messages: ChatMessage[];
};

export type UserProfile = {
  name: string;
  personality: string;
  interests: string;
};

const EMPTY_PROFILE: UserProfile = {
  name: "",
  personality: "",
  interests: "",
};

export type GroupMessage = ChatMessage & {
  speakerId?: string;
  speakerName?: string;
};

export type GroupSave = {
  memberIds: string[];
  turnTaking: boolean;
  turnIndex: number;
  messages: GroupMessage[];
};

type AuraState = {
  locale: Locale;
  voiceEnabled: boolean;
  autoSpeak: boolean;
  acceptedTerms: boolean;
  profile: UserProfile;
  companions: Record<string, CompanionSave>;
  customCharacters: CustomCard[];
  publishedCatalog: CustomCard[];
  group: GroupSave;
  setLocale: (value: Locale) => void;
  setVoiceEnabled: (value: boolean) => void;
  setAutoSpeak: (value: boolean) => void;
  acceptTerms: () => void;
  setProfile: (value: Partial<UserProfile>) => void;
  addMessage: (
    id: string,
    message: Omit<ChatMessage, "id" | "at"> & { id?: string },
  ) => string;
  updateMessage: (
    id: string,
    messageId: string,
    content: string,
    image?: string,
  ) => void;
  applyBond: (id: string, delta: number, mood?: Mood) => number;
  setAffection: (id: string, value: number) => number;
  setMood: (id: string, mood: Mood) => void;
  resetCompanion: (id: string) => void;
  upsertCustom: (card: CustomCard) => void;
  removeCustom: (id: string) => void;
  setPublishedCatalog: (cards: CustomCard[]) => void;
  cachePublished: (card: CustomCard) => void;
  dropPublished: (id: string) => void;
  setGroupMembers: (ids: string[]) => void;
  setTurnTaking: (value: boolean) => void;
  addGroupMessage: (message: Omit<GroupMessage, "id" | "at"> & { id?: string }) => string;
  updateGroupMessage: (messageId: string, content: string) => void;
  resetGroup: () => void;
  bumpTurn: () => void;
};

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function freshCompanion(id: string, locale: Locale = "en"): CompanionSave {
  if (isCharacterId(id)) {
    const copy = characterCopy(id, locale);
    return {
      affection: 8,
      mood: "idle",
      messages: [
        {
          id: uid(),
          role: "assistant",
          content: copy.greeting,
          at: Date.now(),
        },
      ],
    };
  }
  return { affection: 8, mood: "idle", messages: [] };
}

function emptyGroup(): GroupSave {
  return { memberIds: [], turnTaking: true, turnIndex: 0, messages: [] };
}

function syncGreetings(
  companions: Record<string, CompanionSave>,
  locale: Locale,
): Record<string, CompanionSave> {
  const next = { ...companions };
  for (const id of Object.keys(next) as CharacterId[]) {
    if (!isCharacterId(id)) continue;
    const save = next[id];
    if (!save || save.messages.length !== 1) continue;
    const first = save.messages[0];
    if (!first || first.role !== "assistant") continue;
    if (!isGreetingText(id, first.content)) continue;
    next[id] = {
      ...save,
      messages: [{ ...first, content: characterCopy(id, locale).greeting }],
    };
  }
  return next;
}

function initialCompanions(): Record<string, CompanionSave> {
  return {
    lily: freshCompanion("lily"),
    alex: freshCompanion("alex"),
    anna: freshCompanion("anna"),
    john: freshCompanion("john"),
    ani: freshCompanion("ani"),
    lyra: freshCompanion("lyra"),
    mike: freshCompanion("mike"),
    henry: freshCompanion("henry"),
    emily: freshCompanion("emily"),
    mika: freshCompanion("mika"),
    valentine: freshCompanion("valentine"),
    luca: freshCompanion("luca"),
    nora: freshCompanion("nora"),
    rafael: freshCompanion("rafael"),
    sora: freshCompanion("sora"),
    cassian: freshCompanion("cassian"),
    ivy: freshCompanion("ivy"),
    thorne: freshCompanion("thorne"),
  };
}

export const useAura = create<AuraState>()(
  persist(
    (set, get) => ({
      locale: "en",
      voiceEnabled: true,
      autoSpeak: true,
      acceptedTerms: false,
      profile: { ...EMPTY_PROFILE },
      companions: initialCompanions(),
      customCharacters: [],
      publishedCatalog: [],
      group: emptyGroup(),
      setLocale: (locale) =>
        set((state) => ({
          locale,
          companions: syncGreetings(state.companions, locale),
        })),
      setVoiceEnabled: (voiceEnabled) => set({ voiceEnabled }),
      setAutoSpeak: (autoSpeak) => set({ autoSpeak }),
      acceptTerms: () => set({ acceptedTerms: true }),
      setProfile: (value) =>
        set((state) => ({
          profile: {
            name: value.name ?? state.profile.name,
            personality: value.personality ?? state.profile.personality,
            interests: value.interests ?? state.profile.interests,
          },
        })),
      addMessage: (id, message) => {
        const messageId = message.id ?? uid();
        set((state) => {
          const current = state.companions[id] ?? freshCompanion(id);
          return {
            companions: {
              ...state.companions,
              [id]: {
                ...current,
                messages: [
                  ...current.messages,
                  {
                    id: messageId,
                    role: message.role,
                    content: message.content,
                    at: Date.now(),
                    ...(message.image ? { image: message.image } : {}),
                  },
                ].slice(-40),
              },
            },
          };
        });
        return messageId;
      },
      updateMessage: (id, messageId, content, image) => {
        set((state) => {
          const current = state.companions[id];
          if (!current) return state;
          return {
            companions: {
              ...state.companions,
              [id]: {
                ...current,
                messages: current.messages.map((item) =>
                  item.id === messageId
                    ? {
                        ...item,
                        content,
                        ...(image !== undefined ? { image } : {}),
                      }
                    : item,
                ),
              },
            },
          };
        });
      },
      applyBond: (id, delta, mood) => {
        const current = get().companions[id] ?? freshCompanion(id);
        const affection = Math.max(0, Math.min(100, current.affection + delta));
        set((state) => ({
          companions: {
            ...state.companions,
            [id]: {
              ...(state.companions[id] ?? current),
              affection,
              mood: mood ?? state.companions[id]?.mood ?? "idle",
            },
          },
        }));
        return affection;
      },
      setAffection: (id, value) => {
        const affection = Math.max(0, Math.min(100, Math.round(value)));
        set((state) => {
          const current = state.companions[id] ?? freshCompanion(id);
          return {
            companions: {
              ...state.companions,
              [id]: { ...current, affection },
            },
          };
        });
        return affection;
      },
      setMood: (id, mood) => {
        set((state) => {
          const current = state.companions[id] ?? freshCompanion(id);
          return {
            companions: {
              ...state.companions,
              [id]: { ...current, mood },
            },
          };
        });
      },
      resetCompanion: (id) => {
        set((state) => {
          const custom = state.customCharacters.find((card) => card.id === id);
          const base = freshCompanion(id, state.locale);
          if (custom) {
            base.messages = [
              {
                id: uid(),
                role: "assistant",
                content: custom.greeting,
                at: Date.now(),
              },
            ];
          }
          return {
            companions: { ...state.companions, [id]: base },
          };
        });
      },
      upsertCustom: (card) => {
        set((state) => {
          const list = state.customCharacters.filter((item) => item.id !== card.id);
          list.unshift(card);
          const greetingSave = {
            affection: state.companions[card.id]?.affection ?? 8,
            mood: state.companions[card.id]?.mood ?? ("idle" as Mood),
            messages:
              state.companions[card.id]?.messages?.length
                ? state.companions[card.id]!.messages
                : [
                    {
                      id: uid(),
                      role: "assistant" as const,
                      content: card.greeting,
                      at: Date.now(),
                    },
                  ],
          };
          return {
            customCharacters: list.slice(0, 12),
            companions: { ...state.companions, [card.id]: greetingSave },
          };
        });
      },
      removeCustom: (id) => {
        set((state) => {
          const companions = { ...state.companions };
          delete companions[id];
          return {
            customCharacters: state.customCharacters.filter((card) => card.id !== id),
            companions,
            group: {
              ...state.group,
              memberIds: state.group.memberIds.filter((member) => member !== id),
            },
          };
        });
      },
      setPublishedCatalog: (cards) => set({ publishedCatalog: cards }),
      cachePublished: (card) => {
        set((state) => {
          const list = state.publishedCatalog.filter((item) => item.id !== card.id);
          list.unshift(card);
          const existing = state.companions[card.id];
          return {
            publishedCatalog: list.slice(0, 80),
            companions: {
              ...state.companions,
              [card.id]: existing ?? {
                affection: 8,
                mood: "idle" as Mood,
                messages: [
                  {
                    id: uid(),
                    role: "assistant" as const,
                    content: card.greeting,
                    at: Date.now(),
                  },
                ],
              },
            },
          };
        });
      },
      dropPublished: (id) => {
        set((state) => ({
          publishedCatalog: state.publishedCatalog.filter((card) => card.id !== id),
        }));
      },
      setGroupMembers: (ids) => {
        set((state) => ({
          group: {
            ...state.group,
            memberIds: ids.slice(0, 5),
            turnIndex: 0,
          },
        }));
      },
      setTurnTaking: (turnTaking) => {
        set((state) => ({ group: { ...state.group, turnTaking } }));
      },
      addGroupMessage: (message) => {
        const messageId = message.id ?? uid();
        set((state) => ({
          group: {
            ...state.group,
            messages: [
              ...state.group.messages,
              {
                id: messageId,
                role: message.role,
                content: message.content,
                at: Date.now(),
                speakerId: message.speakerId,
                speakerName: message.speakerName,
              },
            ].slice(-80),
          },
        }));
        return messageId;
      },
      updateGroupMessage: (messageId, content) => {
        set((state) => ({
          group: {
            ...state.group,
            messages: state.group.messages.map((item) =>
              item.id === messageId ? { ...item, content } : item,
            ),
          },
        }));
      },
      resetGroup: () => {
        set((state) => ({
          group: { ...state.group, messages: [], turnIndex: 0 },
        }));
      },
      bumpTurn: () => {
        set((state) => {
          const n = state.group.memberIds.length || 1;
          return {
            group: {
              ...state.group,
              turnIndex: (state.group.turnIndex + 1) % n,
            },
          };
        });
      },
    }),
    {
      name: "aura-save-v1",
      skipHydration: true,
      partialize: (state) => ({
        locale: state.locale,
        voiceEnabled: state.voiceEnabled,
        autoSpeak: state.autoSpeak,
        acceptedTerms: state.acceptedTerms,
        profile: state.profile,
        customCharacters: state.customCharacters.map((card) => ({
          ...card,
          portrait: card.portrait.startsWith("data:") ? "" : card.portrait,
        })),
        group: {
          memberIds: state.group.memberIds,
          turnTaking: state.group.turnTaking,
          turnIndex: state.group.turnIndex,
          messages: state.group.messages.map(({ image: _image, ...message }) => message),
        },
        companions: Object.fromEntries(
          Object.entries(state.companions).map(([key, save]) => [
            key,
            {
              ...save,
              messages: save.messages.map(({ image: _image, ...message }) => message),
            },
          ]),
        ) as Record<CharacterId, CompanionSave>,
      }),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<AuraState>;
        const companions = { ...current.companions };
        if (saved.companions) {
          for (const key of Object.keys(saved.companions)) {
            if (!isCharacterId(key) && !isCustomId(key)) continue;
            companions[key] = saved.companions[key] ?? companions[key];
          }
        }
        const customCharacters: CustomCard[] = [];
        if (Array.isArray(saved.customCharacters)) {
          for (const item of saved.customCharacters) {
            const card = parseCustomCard(item);
            if (card) customCharacters.push(card);
          }
        }
        const savedGroup = saved.group;
        return {
          ...current,
          locale: isLocale(saved.locale) ? saved.locale : current.locale,
          voiceEnabled: saved.voiceEnabled ?? current.voiceEnabled,
          autoSpeak: saved.autoSpeak ?? current.autoSpeak,
          acceptedTerms: saved.acceptedTerms === true,
          profile: {
            name: String(saved.profile?.name ?? current.profile.name).slice(0, 80),
            personality: String(
              saved.profile?.personality ?? current.profile.personality,
            ).slice(0, 600),
            interests: String(
              saved.profile?.interests ?? current.profile.interests,
            ).slice(0, 600),
          },
          customCharacters,
          group: {
            memberIds: Array.isArray(savedGroup?.memberIds)
              ? savedGroup.memberIds.filter((id) => typeof id === "string").slice(0, 5)
              : current.group.memberIds,
            turnTaking: savedGroup?.turnTaking !== false,
            turnIndex: Number(savedGroup?.turnIndex) || 0,
            messages: Array.isArray(savedGroup?.messages)
              ? savedGroup.messages.slice(-80)
              : [],
          },
          companions,
        };
      },
    },
  ),
);
