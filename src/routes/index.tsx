import { createFileRoute } from "@tanstack/react-router";
import { Studio } from "@/components/studio/Studio";

export const Route = createFileRoute("/")({
  ssr: false,
  component: Home,
});

function Home() {
  return <Studio />;
}
