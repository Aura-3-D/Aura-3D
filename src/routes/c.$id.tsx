import { createFileRoute, redirect } from "@tanstack/react-router";
import { CompanionRoom } from "@/components/companion/CompanionRoom";
import { isCharacterId } from "@/lib/characters";
import { isCustomId } from "@/lib/custom-character";

export const Route = createFileRoute("/c/$id")({
  beforeLoad: ({ params }) => {
    if (!isCharacterId(params.id) && !isCustomId(params.id)) {
      throw redirect({ to: "/" });
    }
  },
  component: CompanionPage,
});

function CompanionPage() {
  const { id } = Route.useParams();
  if (!isCharacterId(id) && !isCustomId(id)) return null;
  return <CompanionRoom id={id} />;
}
