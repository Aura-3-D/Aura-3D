import { createFileRoute } from "@tanstack/react-router";
import { GroupRoom } from "@/components/group/GroupRoom";

export const Route = createFileRoute("/group")({
  component: GroupRoom,
});
