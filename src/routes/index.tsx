import { createFileRoute } from "@tanstack/react-router";
import { Lobby } from "@/components/lobby/Lobby";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <Lobby />;
}
