import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Ascend — Awaken your inner Hunter" },
      {
        name: "description",
        content:
          "The System has chosen you. A Solo Leveling-inspired habit tracker where discipline becomes XP, stats, and rank.",
      },
      { property: "og:title", content: "Ascend — Awaken. Level. Ascend." },
      {
        property: "og:description",
        content: "Turn habits and quests into levels, stats, and ranks. Rise from E to S.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.replace("/hunter");
      else setChecking(false);
    });
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="font-mono text-xs tracking-[0.4em] text-primary hologram-flicker">
          [ SYSTEM.SYNC ]
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-on-surface">
      <div className="pointer-events-none absolute inset-0 hex-bg opacity-40" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />

      <header className="relative z-10 flex items-center justify-between border-b border-white/5 px-6 py-5 md:px-12">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center border border-primary/40 bg-primary/10">
            <span className="material-symbols-outlined text-primary">bolt</span>
          </div>
          <span className="font-display text-lg font-semibold uppercase tracking-[0.3em] text-primary">
            Ascend
          </span>
        </div>
        <Link
          to="/auth"
          className="border border-primary/40 px-5 py-2 font-mono text-[11px] tracking-[0.3em] text-primary transition hover:bg-primary hover:text-on-primary"
        >
          ENTER SYSTEM
        </Link>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-6 py-24 text-center md:py-32">
        <p className="font-mono text-xs tracking-[0.4em] text-secondary hologram-flicker">
          [ SYSTEM_NOTIFICATION ]
        </p>
        <h1 className="mt-6 font-display text-5xl font-bold uppercase leading-[1.05] tracking-tight text-on-surface md:text-7xl">
          You have been chosen<br />
          as a <span className="text-primary rank-glow">Player.</span>
        </h1>
        <p className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-on-surface-variant">
          Every habit you clear grants XP. Every quest raises your stats. Every level pulls you
          closer to <span className="text-tertiary">S-Rank</span>.
        </p>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/auth"
            className="group relative overflow-hidden border border-primary bg-primary px-10 py-4 font-mono text-xs tracking-[0.4em] text-on-primary transition hover:bg-primary/90 glow-primary"
          >
            ACCEPT THE QUEST
          </Link>
          <a
            href="#stats"
            className="border border-white/20 px-10 py-4 font-mono text-xs tracking-[0.4em] text-on-surface-variant transition hover:border-primary/60 hover:text-primary"
          >
            SYSTEM DETAILS
          </a>
        </div>

        <div id="stats" className="mt-32 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { k: "5 STATS", d: "STR · VIT · INT · DISC · WILL", i: "insights" },
            { k: "6 RANKS", d: "From E-Rank to S-Rank Sovereign", i: "military_tech" },
            { k: "∞ QUESTS", d: "Daily missions and weekly raids", i: "military_tech" },
          ].map((f) => (
            <div key={f.k} className="glass-panel p-6 text-left">
              <span className="material-symbols-outlined text-primary">{f.i}</span>
              <h3 className="mt-3 font-display text-xl font-semibold uppercase tracking-wider text-on-surface">
                {f.k}
              </h3>
              <p className="mt-2 text-sm text-on-surface-variant">{f.d}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/5 px-6 py-6 text-center font-mono text-[10px] tracking-[0.3em] text-on-surface-variant/50">
        [ ASCEND SYSTEM v1.0 · MONARCH PROTOCOL ]
      </footer>
    </div>
  );
}
