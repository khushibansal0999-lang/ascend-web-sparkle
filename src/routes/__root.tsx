import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="glass-panel max-w-md p-10 text-center">
        <p className="font-mono text-xs tracking-[0.3em] text-primary">[ SYSTEM ]</p>
        <h1 className="mt-4 font-display text-7xl font-bold text-primary rank-glow">404</h1>
        <h2 className="mt-4 font-display text-xl uppercase tracking-widest text-on-surface">
          Dungeon not found
        </h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          This gate has collapsed or never opened.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-none border border-primary/40 bg-primary/10 px-6 py-3 font-mono text-xs tracking-[0.3em] text-primary transition hover:bg-primary hover:text-on-primary"
        >
          RETURN
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="glass-panel max-w-md p-10 text-center">
        <p className="font-mono text-xs tracking-[0.3em] text-error">[ SYSTEM_FAULT ]</p>
        <h1 className="mt-4 font-display text-xl uppercase tracking-widest text-on-surface">
          The system encountered an anomaly
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">Rebooting may resolve the fault.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="border border-primary/40 bg-primary/10 px-6 py-3 font-mono text-xs tracking-[0.3em] text-primary transition hover:bg-primary hover:text-on-primary"
          >
            RETRY
          </button>
          <a
            href="/"
            className="border border-white/10 px-6 py-3 font-mono text-xs tracking-[0.3em] text-on-surface-variant transition hover:border-primary/40 hover:text-primary"
          >
            HOME
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Ascend — Turn your discipline into a leveling system" },
      {
        name: "description",
        content:
          "A Solo Leveling–inspired habit tracker. Every real-life quest you clear grants XP, stats, and rank. Awaken your inner Hunter.",
      },
      { name: "author", content: "Ascend" },
      { property: "og:title", content: "Ascend — Awaken. Level. Ascend." },
      {
        property: "og:description",
        content: "The System has chosen you. Track habits, clear quests, ascend the ranks.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [queryClient, router]);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}
