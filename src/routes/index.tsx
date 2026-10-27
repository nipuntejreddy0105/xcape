import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SCRAM — Outdoor GPS Chase Game" },
      { name: "description", content: "Host or join a real-time outdoor GPS game. Stay in the zone." },
      { property: "og:title", content: "SCRAM — Outdoor GPS Chase Game" },
      { property: "og:description", content: "Host or join a real-time outdoor GPS game." },
    ],
  }),
  component: Index,
});

function Index() {
  const name = "Player";
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col bg-primary p-5 text-primary-foreground">
      <h1 className="mt-6 font-display text-7xl uppercase leading-none">Scram</h1>
      <p className="mt-auto font-display text-5xl uppercase leading-none">Hi, {name}</p>
      <p className="mb-8 mt-2 text-lg font-semibold">Ready to run?</p>
      <div className="flex flex-col gap-3 pb-6">
        <Link to="/game" className="brutal-card py-5 text-center font-display text-2xl uppercase">
          Host a game
        </Link>
        <Link to="/game" className="brutal-card-dark py-5 text-center font-display text-2xl uppercase">
          Join with a code
        </Link>
      </div>
    </main>
  );
}
