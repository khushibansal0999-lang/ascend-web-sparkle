import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dismissLevelEvent } from "@/lib/ascend.functions";
import { RANK_LABEL, type RankCode } from "@/lib/progression";

interface Props {
  event: {
    id: string;
    prev_level: number;
    new_level: number;
    prev_rank: RankCode | null;
    new_rank: RankCode | null;
  };
}

export function LevelUpModal({ event }: Props) {
  const qc = useQueryClient();
  const dismiss = useServerFn(dismissLevelEvent);
  const m = useMutation({
    mutationFn: () => dismiss({ data: { eventId: event.id } }),
    onSuccess: () => qc.invalidateQueries(),
  });

  const rankChanged = event.new_rank !== event.prev_rank;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 px-4 backdrop-blur-xl"
      onClick={() => m.mutate()}
    >
      <div className="pointer-events-none absolute inset-0 hex-bg opacity-40" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[140px]" />

      <div
        className="glass-panel relative z-10 w-full max-w-lg border-primary/40 p-10 text-center glow-primary"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-mono text-xs tracking-[0.5em] text-secondary hologram-flicker">
          [ SYSTEM_NOTIFICATION ]
        </p>
        <h2 className="mt-6 font-display text-2xl uppercase tracking-widest text-on-surface">
          You have grown stronger
        </h2>
        <div className="my-8 flex items-center justify-center gap-6">
          <div className="text-center">
            <p className="font-mono text-[10px] tracking-[0.3em] text-on-surface-variant">LEVEL</p>
            <p className="font-display text-6xl font-bold text-on-surface-variant/40 line-through">
              {event.prev_level}
            </p>
          </div>
          <span className="material-symbols-outlined text-4xl text-primary">arrow_forward</span>
          <div className="text-center">
            <p className="font-mono text-[10px] tracking-[0.3em] text-primary">NEW</p>
            <p className="font-display text-7xl font-bold text-primary rank-glow">
              {event.new_level}
            </p>
          </div>
        </div>

        {rankChanged && event.new_rank && (
          <div className="mb-6 border border-tertiary/40 bg-tertiary/5 py-4">
            <p className="font-mono text-[10px] tracking-[0.4em] text-tertiary">
              [ RANK PROMOTION ]
            </p>
            <p className="mt-2 font-display text-2xl uppercase tracking-widest text-tertiary">
              {RANK_LABEL[event.new_rank]}
            </p>
          </div>
        )}

        <button
          onClick={() => m.mutate()}
          disabled={m.isPending}
          className="mt-4 w-full border border-primary bg-primary py-4 font-mono text-xs tracking-[0.4em] text-on-primary transition hover:bg-primary/90 glow-primary"
        >
          ACKNOWLEDGE
        </button>
      </div>
    </div>
  );
}
