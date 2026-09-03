import { createFileRoute } from "@tanstack/react-router";
import { Shop } from "@/components/shop/Shop";

export const Route = createFileRoute("/shop")({
  component: Shop,
});
