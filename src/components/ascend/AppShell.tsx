import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const NAV = [
  { to: "/hunter", label: "Profile", icon: "person" },
  { to: "/quests", label: "Quests", icon: "checklist_rtl" },
  { to: "/habits", label: "Habits", icon: "workspace_premium" },
  { to: "/raids", label: "Raids", icon: "military_tech" },
] as const;

export function AppShell({
  children,
  level,
  rank,
}: {
  children: ReactNode;
  level: number;
  rank: string;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const qc = useQueryClient();

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="relative min-h-screen bg-background text-on-surface pb-32 md:pb-16">
      <div className="pointer-events-none fixed inset-0 hex-bg opacity-30" />

      <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-background/80 px-5 backdrop-blur-xl md:px-10 shadow-[0_0_15px_rgba(221,183,255,0.08)]">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between">
          <Link to="/hunter" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center border border-primary/40 bg-surface-container">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                bolt
              </span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-lg font-bold uppercase tracking-widest text-primary drop-shadow-[0_0_10px_rgba(221,183,255,0.5)]">
                LEVEL {level}
              </span>
              <span className="font-mono text-[10px] tracking-[0.3em] text-on-surface-variant">
                {rank.toUpperCase()}-RANK HUNTER
              </span>
            </div>
          </Link>

          <nav className="hidden gap-8 md:flex">
            {NAV.map((n) => {
              const active = pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`font-mono text-[12px] tracking-[0.25em] transition ${
                    active
                      ? "border-b-2 border-primary pb-1 text-primary"
                      : "text-on-surface-variant hover:text-primary"
                  }`}
                >
                  {n.label.toUpperCase()}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={signOut}
            aria-label="Sign out"
            className="text-on-surface-variant transition hover:text-primary"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-[1200px] px-5 pt-24 md:px-10">{children}</main>

      <nav className="fixed bottom-0 z-50 flex h-20 w-full items-center justify-around border-t border-white/10 bg-surface-container-lowest/90 px-4 pb-safe backdrop-blur-md md:hidden">
        {NAV.map((n) => {
          const active = pathname === n.to;
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`flex flex-col items-center justify-center pt-2 transition ${
                active
                  ? "border-t-2 border-primary text-primary drop-shadow-[0_0_8px_rgba(221,183,255,0.8)]"
                  : "text-on-surface-variant/50 hover:bg-white/5"
              }`}
            >
              <span className="material-symbols-outlined">{n.icon}</span>
              <span className="mt-1 font-mono text-[9px] tracking-[0.2em]">
                {n.label.toUpperCase()}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
