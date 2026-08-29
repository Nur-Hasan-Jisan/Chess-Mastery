import { BarChart3, CheckCircle2, RotateCcw } from 'lucide-react';
import type { Move } from '@/lib/chess';

export type ReviewMoment = {
  ply: number;
  san: string;
  mover: 'White' | 'Black';
  label: 'Brilliant' | 'Good' | 'Inaccuracy' | 'Mistake' | 'Blunder';
  swing: number;
};

type Props = {
  history: Move[];
  advantageHistory: number[];
  moments: ReviewMoment[];
  result: 'win' | 'loss' | 'draw';
  onNewGame: () => void;
};

const labelStyles: Record<ReviewMoment['label'], string> = {
  Brilliant: 'bg-[#e6f1ea] text-[#37664d]',
  Good: 'bg-secondary text-foreground',
  Inaccuracy: 'bg-[#fff3d3] text-[#8a5f1c]',
  Mistake: 'bg-[#ffe7d5] text-[#a45c2b]',
  Blunder: 'bg-[#fff0ec] text-[#a84236]',
};

function graphPoints(values: number[]) {
  const usable = values.length ? values : [0];
  return usable.map((value, index) => {
    const x = usable.length === 1 ? 20 : 20 + (index / (usable.length - 1)) * 600;
    const y = 86 - (Math.max(-5, Math.min(5, value)) / 5) * 60;
    return `${x},${y}`;
  }).join(' ');
}

export function PostGameReview({ history, advantageHistory, moments, result, onNewGame }: Props) {
  return (
    <section className="mt-5 rounded-2xl border border-card-border bg-card p-5 shadow-sm" data-testid="post-game-review">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mono mb-1 text-[10px] uppercase tracking-[.18em] text-accent">Post-game review / engine report</p>
          <h2 className="serif text-2xl">Where the game turned</h2>
          <p className="mt-1 text-sm text-muted-foreground">Stockfish tracks the advantage swing after every recorded turn.</p>
        </div>
        <button type="button" onClick={onNewGame} data-testid="button-review-new-game" className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-extrabold text-primary-foreground hover:opacity-90"><RotateCcw size={13} /> New game</button>
      </div>
      <div className="mb-5 rounded-xl border border-border bg-background p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-bold"><BarChart3 size={14} className="text-accent" /> Advantage graph</span>
          <span className="mono text-[9px] uppercase tracking-wider text-muted-foreground">{result === 'win' ? 'Win' : result === 'loss' ? 'Loss' : 'Draw'} · White perspective</span>
        </div>
        <svg className="h-36 w-full" viewBox="0 0 640 110" role="img" aria-label="Advantage swing graph">
          <line x1="20" x2="620" y1="86" y2="86" stroke="currentColor" strokeOpacity=".12" />
          <line x1="20" x2="620" y1="26" y2="26" stroke="currentColor" strokeOpacity=".08" strokeDasharray="3 4" />
          <line x1="20" x2="620" y1="56" y2="56" stroke="currentColor" strokeOpacity=".08" strokeDasharray="3 4" />
          <polyline points={graphPoints(advantageHistory)} fill="none" stroke="#d85f4d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {advantageHistory.map((value, index) => {
            const x = advantageHistory.length === 1 ? 20 : 20 + (index / (advantageHistory.length - 1)) * 600;
            const y = 86 - (Math.max(-5, Math.min(5, value)) / 5) * 60;
            return <circle key={index} cx={x} cy={y} r="2.5" fill="#262b3d" />;
          })}
        </svg>
        <div className="flex justify-between mono text-[9px] text-muted-foreground"><span>White advantage</span><span>Even</span><span>Black advantage</span></div>
      </div>
      <div className="mb-2 flex items-center justify-between">
        <p className="mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Turn classification</p>
        <span className="mono text-[9px] text-muted-foreground">{history.length} plies reviewed</span>
      </div>
      <div className="scrollbar-thin max-h-52 space-y-1 overflow-y-auto" data-testid="list-review-moments">
        {moments.length ? moments.map((moment) => (
          <div key={moment.ply} className="flex items-center gap-2 rounded-lg bg-background px-2.5 py-2">
            <span className="mono w-8 text-[9px] text-muted-foreground">{Math.ceil(moment.ply / 2)}{moment.mover === 'White' ? '.' : '…'}</span>
            <span className="min-w-0 flex-1 truncate text-xs font-bold">{moment.san} <span className="font-normal text-muted-foreground">· {moment.mover}</span></span>
            <span className={`flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-extrabold ${labelStyles[moment.label]}`}>{moment.label === 'Brilliant' && <CheckCircle2 size={10} />}{moment.label}</span>
            <span className={`mono hidden w-10 text-right text-[9px] sm:block ${moment.swing >= 0 ? 'text-[#37664d]' : 'text-[#a84236]'}`}>{moment.swing >= 0 ? '+' : ''}{moment.swing.toFixed(1)}</span>
          </div>
        )) : <p className="rounded-lg bg-background px-3 py-5 text-center text-xs text-muted-foreground">Make a few moves to build the review.</p>}
      </div>
    </section>
  );
}