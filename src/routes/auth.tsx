import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Enter the System — Ascend" },
      { name: "description", content: "Awaken as a Hunter. Sign in to access your System." },
      { property: "og:title", content: "Enter the System — Ascend" },
      { property: "og:description", content: "Sign in and begin your ascent." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/hunter", replace: true });
    });
  }, [navigate]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { hunter_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Awakening complete. Enter the System.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/hunter", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw new Error(result.error.message ?? "Google sign-in failed");
      if (result.redirected) return;
      navigate({ to: "/hunter", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="pointer-events-none absolute inset-0 hex-bg opacity-30" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="font-mono text-[11px] tracking-[0.4em] text-secondary hologram-flicker">
            [ SYSTEM_ACCESS ]
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold uppercase tracking-tight text-primary rank-glow">
            {mode === "signin" ? "Awaken" : "Enlist"}
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            {mode === "signin"
              ? "Return, Hunter. The System has missed you."
              : "You have been chosen. Register as a Player."}
          </p>
        </div>

        <div className="glass-panel space-y-5 p-8">
          <button
            onClick={handleGoogle}
            disabled={busy}
            className="flex w-full items-center justify-center gap-3 border border-white/20 bg-white/5 py-3 font-mono text-xs tracking-[0.3em] text-on-surface transition hover:border-primary/60 hover:bg-primary/10 hover:text-primary disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            CONTINUE WITH GOOGLE
          </button>

          <div className="flex items-center gap-3 text-[10px] tracking-[0.3em] text-on-surface-variant/60">
            <div className="h-px flex-1 bg-white/10" />
            <span className="font-mono">OR</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={handleEmail} className="space-y-4">
            {mode === "signup" && (
              <label className="block">
                <span className="font-mono text-[10px] tracking-[0.3em] text-on-surface-variant">
                  HUNTER NAME
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sung Jin-Woo"
                  className="mt-1 w-full border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm text-on-surface outline-none transition focus:border-primary/60"
                />
              </label>
            )}
            <label className="block">
              <span className="font-mono text-[10px] tracking-[0.3em] text-on-surface-variant">
                EMAIL
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm text-on-surface outline-none transition focus:border-primary/60"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] tracking-[0.3em] text-on-surface-variant">
                PASSWORD
              </span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm text-on-surface outline-none transition focus:border-primary/60"
              />
            </label>

            <button
              type="submit"
              disabled={busy}
              className="w-full border border-primary bg-primary py-3 font-mono text-xs tracking-[0.4em] text-on-primary transition hover:bg-primary/90 disabled:opacity-50 glow-primary"
            >
              {busy ? "SYNCING…" : mode === "signin" ? "ENTER SYSTEM" : "AWAKEN"}
            </button>
          </form>

          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="w-full text-center font-mono text-[10px] tracking-[0.3em] text-on-surface-variant transition hover:text-primary"
          >
            {mode === "signin"
              ? "NO ACCOUNT? → REGISTER AS A PLAYER"
              : "ALREADY A HUNTER? → ENTER SYSTEM"}
          </button>
        </div>
      </div>
    </div>
  );
}
