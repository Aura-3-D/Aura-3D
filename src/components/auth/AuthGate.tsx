import { Navigate, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (pathname === "/login") {
    if (!isPending && user) return <Navigate to="/" />;
    return <>{children}</>;
  }

  if (isPending) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg text-muted">
        <p className="text-[11px] font-medium tracking-[0.28em]">aura-3d</p>
      </div>
    );
  }

  if (!user) return <RedirectToSignIn />;
  return <>{children}</>;
}
