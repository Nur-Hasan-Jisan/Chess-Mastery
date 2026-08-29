import { Check, ChevronRight, Lightbulb, RotateCcw } from 'lucide-react';
import type { OpeningStep, OpeningTrack } from '@/data/openings';

type Props = { track: OpeningTrack; step: number; total: number; status: 'ready' | 'retry' | 'complete'; mistakeMessage?: string; currentStep?: OpeningStep; onReset: () => void };
export function RuyLopezLesson({ track, step, total, status, mistakeMessage, currentStep, onReset }: Props) {
  return (
    <section className="animate-slide rounded-2xl border border-card-border bg-card p-5 shadow-sm" data-testid="lesson-panel">
      <div className="mb-5 flex items-start justify-between"><div><p className="mono mb-2 text-[10px] font-medium uppercase tracking-[.18em] text-accent">Opening lab / active line</p><h2 className="serif text-2xl">{track.name}</h2><p className="mt-1 text-xs text-muted-foreground">{track.family}</p></div><span className="rounded-full bg-secondary px-3 py-1 mono text-[10px] font-medium text-muted-foreground">{step}/{total}</span></div>
      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${Math.min(100, (step / total) * 100)}%` }} /></div>
      {status === 'retry' ? (
        <div className="rounded-xl border border-[#e6b9ae] bg-[#fff0ec] p-4" data-testid="status-lesson-retry"><p className="mb-1 flex items-center gap-2 font-extrabold text-[#a84236]"><RotateCcw size={16} /> Try Again</p><p className="text-sm leading-relaxed text-[#80524b]">{mistakeMessage || 'That move is legal, but not part of today’s line. Return to the position and find the principled move.'}</p></div>
      ) : status === 'complete' ? (
        <div className="rounded-xl border border-[#b7d5c5] bg-[#e6f1ea] p-4" data-testid="status-lesson-complete"><p className="mb-1 flex items-center gap-2 font-extrabold text-[#37664d]"><Check size={16} /> Line completed</p><p className="text-sm leading-relaxed text-[#466b57]">You kept the initiative through {track.name}. The line is ready for another spaced review.</p><button type="button" data-testid="button-restart-lesson" onClick={onReset} className="mt-3 flex items-center gap-1 text-xs font-extrabold text-[#37664d]">Run it again <ChevronRight size={13} /></button></div>
      ) : (
        <div data-testid="status-lesson-ready">
          <div className="mb-4 flex gap-3">
            <div className="mt-0.5 rounded-lg bg-[#f9e6b4] p-2 text-[#9a651c]"><Lightbulb size={17} /></div>
            <div>
              <p className="mono text-[10px] uppercase tracking-[.16em] text-accent">Your next idea</p>
              <h3 className="mt-1 font-extrabold">{currentStep?.label || 'Find the principled move'}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{currentStep?.annotation || track.description}</p>
            </div>
          </div>
          <p className="mono mb-3 text-[10px] uppercase tracking-[.16em] text-muted-foreground">Find {currentStep?.from} → {currentStep?.to} on the board</p>
        </div>
      )}
      <div className="mt-5 border-t border-border pt-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Move-by-move notes</p>
          <span className="text-[10px] text-muted-foreground">Why the move works</span>
        </div>
        <div className="scrollbar-thin max-h-[310px] space-y-1 overflow-y-auto pr-1" data-testid="list-opening-annotations">
          {track.steps.map((item, index) => {
            const completed = index < step;
            const active = index === step && status !== 'complete';
            return (
              <div key={`${item.from}-${item.to}-${index}`} className={`flex gap-3 rounded-xl p-2.5 transition ${active ? 'bg-[#fff3d3]' : completed ? 'bg-secondary/60' : 'opacity-55'}`} data-testid={`opening-annotation-${index + 1}`}>
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full mono text-[10px] font-bold ${active ? 'bg-accent text-white' : completed ? 'bg-[#b7d5c5] text-[#37664d]' : 'bg-secondary text-muted-foreground'}`}>
                  {completed ? <Check size={12} /> : index + 1}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="mono text-[9px] uppercase tracking-wider text-muted-foreground">{Math.floor(index / 2) + 1}{index % 2 === 0 ? 'W' : 'B'}</span>
                    <span className="text-xs font-extrabold">{item.label}</span>
                    <span className="mono text-[10px] text-muted-foreground">{item.from} → {item.to}</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{item.annotation}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}