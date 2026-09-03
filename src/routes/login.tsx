import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import {
  GROK_PROVIDERS,
  authClient,
  authEnabled,
  signIn,
} from "@/lib/auth/client";
import { LanguageSelect } from "@/components/hud/LanguageSelect";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { useAura } from "@/lib/store";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const locale = useAura((s) => s.locale);
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onEmail(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "up") {
        const { error: err } = await authClient.signUp.email({
          email: email.trim(),
          password,
          name: name.trim() || email.split("@")[0] || "guest",
        });
        if (err) throw new Error(err.message ?? "Sign-up failed");
      } else {
        const { error: err } = await authClient.signIn.email({
          email: email.trim(),
          password,
        });
        if (err) throw new Error(err.message ?? "Sign-in failed");
      }
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative grid min-h-dvh place-items-center bg-bg px-5 text-fg">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#163056,transparent_55%)]" />
      <div className="absolute end-4 top-4 z-10 sm:end-6 sm:top-6">
        <LanguageSelect />
      </div>
      <div className="relative w-full max-w-sm rounded-[28px] border border-border bg-bg-elevated p-6 shadow-[0_24px_80px_rgb(0_0_0/0.55)] sm:p-8">
        <p className="text-[11px] font-medium tracking-[0.28em] text-muted">
          aura-3d
        </p>
        <h1 className="font-display mt-2 text-4xl font-medium tracking-[-0.03em]">
          {t(locale, "signInTitle")}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {t(locale, "signInHint")}
        </p>

        {authEnabled ? (
          <div className="mt-6 grid gap-2">
            {GROK_PROVIDERS.filter((p) => p.idp === "google" || p.idp === "twitter").map(
              (p) => (
                <Button
                  key={p.providerId}
                  type="button"
                  variant="glass"
                  className="w-full"
                  onClick={() => void signIn(p.providerId, { callbackURL: "/" })}
                >
                  {t(locale, "continueWith")} {p.label}
                </Button>
              ),
            )}
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted">Sign-in is disabled.</p>
        )}

        <div className="my-6 flex items-center gap-3 text-xs tracking-wide text-subtle">
          <span className="h-px flex-1 bg-border" />
          {t(locale, "email")}
          <span className="h-px flex-1 bg-border" />
        </div>

        <form className="grid gap-3" onSubmit={(e) => void onEmail(e)}>
          {mode === "up" ? (
            <label className="block text-xs tracking-wide text-muted">
              {t(locale, "yourName")}
              <input
                className="field mt-1.5"
                value={name}
                autoComplete="name"
                onChange={(e) => setName(e.target.value)}
              />
            </label>
          ) : null}
          <label className="block text-xs tracking-wide text-muted">
            {t(locale, "email")}
            <input
              className="field mt-1.5"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block text-xs tracking-wide text-muted">
            {t(locale, "password")}
            <input
              className="field mt-1.5"
              type="password"
              required
              minLength={8}
              autoComplete={mode === "up" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error ? <p className="text-sm text-heart">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={busy || !authEnabled}>
            {mode === "up" ? t(locale, "createAccount") : t(locale, "signInEmail")}
          </Button>
        </form>

        <button
          type="button"
          className="mt-4 text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
          onClick={() => {
            setMode(mode === "up" ? "in" : "up");
            setError(null);
          }}
        >
          {mode === "up" ? t(locale, "haveAccount") : t(locale, "needAccount")}
        </button>

        <p className="mt-6 text-center text-xs text-subtle">
          <Link to="/" className="hover:text-fg">
            {t(locale, "back")}
          </Link>
        </p>
      </div>
    </main>
  );
}
