import { createFileRoute } from "@tanstack/react-router";
import { Workplace } from "@/components/workplace/Workplace";

export const Route = createFileRoute("/workplace")({
  component: Workplace,
});
