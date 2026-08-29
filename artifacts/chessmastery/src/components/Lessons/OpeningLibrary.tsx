import { BookOpen, Check, Target } from 'lucide-react';
import type { OpeningTrack } from '@/data/openings';

type Props = {
  tracks: OpeningTrack[];
  selectedId: string;
  completedSteps: number;
  weakPointCount: number;
  onSelect: (id: string) => void;
};

export function OpeningLibrary({ tracks, selectedId, completedSteps, weakPointCount, onSelect }: Props) {
  return (
    <section className="rounded-2xl border border-card-border bg-card p-4 shadow-sm" data-testid="opening-library">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="mono mb-1 text-[10px] uppercase tracking-[.18em] text-accent">Spaced repetition / library</p>
          <h2 className="serif text-2xl">Choose a line</h2>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold text-muted-foreground" data-testid="text-opening-weak-points">
          <Target size={12} /> {weakPointCount} active {weakPointCount === 1 ? 'weak point' : 'weak points'}
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2" role="list" aria-label="Opening tracks">
        {tracks.map((track) => {
          const active = track.id === selectedId;
          return (
            <button
              key={track.id}
              type="button"
              data-testid={`button-opening-${track.id}`}
              onClick={() => onSelect(track.id)}
              className={`group rounded-xl border p-3 text-left transition hover:-translate-y-0.5 ${active ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'border-border bg-background hover:bg-secondary'}`}
              role="listitem"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: active ? 'rgba(255,255,255,.14)' : `${track.color}20`, color: active ? 'inherit' : track.color }}>
                  {active ? <Check size={15} /> : <BookOpen size={15} />}
                </span>
                <span className={`mono text-[9px] uppercase tracking-wider ${active ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{track.difficulty}</span>
              </div>
              <p className="font-extrabold">{track.name}</p>
              <p className={`mt-0.5 text-[10px] uppercase tracking-wider ${active ? 'text-primary-foreground/65' : 'text-muted-foreground'}`}>{track.family} · {track.steps.length} plies</p>
              <p className={`mt-2 text-xs leading-relaxed ${active ? 'text-primary-foreground/75' : 'text-muted-foreground'}`}>{track.description}</p>
              <div className={`mt-3 flex items-center gap-2 ${active ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                <div className={`h-1 flex-1 overflow-hidden rounded-full ${active ? 'bg-white/20' : 'bg-secondary'}`}><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${active ? Math.min(100, (completedSteps / track.steps.length) * 100) : 0}%` }} /></div>
                <span className="mono text-[9px]">{active ? `${completedSteps}/${track.steps.length}` : 'Start'}</span>
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <span className="mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Current progress</span>
        <span className="mono text-xs font-bold text-accent" data-testid="text-opening-progress">{completedSteps}/{tracks.find((track) => track.id === selectedId)?.steps.length ?? 0}</span>
      </div>
    </section>
  );
}