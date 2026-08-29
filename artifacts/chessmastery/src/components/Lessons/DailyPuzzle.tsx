import { Eye, EyeOff, Lightbulb, RotateCcw, Sparkles } from 'lucide-react';
import type { Puzzle } from '@/data/openings';

type Props = {
  puzzles: Puzzle[];
  puzzle: Puzzle;
  index: number;
  status: 'ready' | 'retry' | 'complete';
  hintVisible: boolean;
  answerVisible: boolean;
  wrongSquare?: string;
  onSelect: (index: number) => void;
  onHint: () => void;
  onAnswer: () => void;
  onReset: () => void;
};

export function DailyPuzzle({ puzzles, puzzle, index, status, hintVisible, answerVisible, wrongSquare, onSelect, onHint, onAnswer, onReset }: Props) {
  return (
    <section className="space-y-4" data-testid="daily-puzzle-panel">
      <div className="rounded-2xl border border-card-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="mono mb-1 text-[10px] uppercase tracking-[.18em] text-accent">Daily puzzle / tactics</p>
            <h2 className="serif text-2xl">{puzzle.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{puzzle.description}</p>
          </div>
          <span className="rounded-full bg-secondary px-2.5 py-1 mono text-[10px] font-bold text-muted-foreground">{puzzle.theme}</span>
        </div>
        <div className="mb-4 flex gap-2">
          {puzzles.map((item, itemIndex) => (
            <button key={item.id} type="button" data-testid={`button-puzzle-${item.theme.toLowerCase()}`} onClick={() => onSelect(itemIndex)} className={`flex-1 rounded-lg border px-2 py-2 text-[10px] font-extrabold uppercase tracking-wider transition ${itemIndex === index ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:bg-secondary'}`}>{item.theme}</button>
          ))}
        </div>
        {status === 'retry' && <div className="mb-4 rounded-xl border border-[#e6b9ae] bg-[#fff0ec] p-3 text-sm text-[#a84236]" data-testid="status-puzzle-retry"><p className="font-extrabold">Not quite. Find the forcing move.</p><p className="mt-1 text-xs text-[#80524b]">The red square marks the move that needs another look. Scan for the {puzzle.theme.toLowerCase()} idea: {puzzle.answer.annotation}</p></div>}
        {status === 'complete' && <div className="mb-4 rounded-xl border border-[#b7d5c5] bg-[#e6f1ea] p-3 text-sm text-[#37664d]" data-testid="status-puzzle-complete"><p className="font-extrabold">Tactic found.</p><p className="mt-1 text-xs text-[#466b57]">{puzzle.answer.annotation}</p></div>}
        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" aria-pressed={hintVisible} data-testid="button-show-piece" onClick={onHint} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-extrabold transition ${hintVisible ? 'border-accent bg-[#fff3d3] text-[#8a5f1c]' : 'border-border bg-background hover:bg-secondary'}`}><Lightbulb size={14} /> {hintVisible ? 'Piece highlighted' : 'Show piece'}</button>
          <button type="button" aria-pressed={answerVisible} data-testid="button-show-answer" onClick={onAnswer} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-extrabold transition ${answerVisible ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:bg-secondary'}`}><Eye size={14} /> {answerVisible ? 'Answer revealed' : 'Show answer'}</button>
        </div>
        {hintVisible && <p className="mt-3 flex items-start gap-2 rounded-lg bg-secondary p-3 text-xs leading-relaxed text-muted-foreground" data-testid="text-puzzle-hint"><Sparkles size={14} className="mt-0.5 shrink-0 text-accent" />{puzzle.hint}</p>}
        {answerVisible && <div className="mt-3 flex items-start gap-2 rounded-lg bg-primary p-3 text-primary-foreground" data-testid="text-puzzle-answer"><EyeOff size={14} className="mt-0.5 shrink-0 text-[#e6b65e]" /><div><p className="mono text-[10px] uppercase tracking-wider text-[#e6b65e]">Solution</p><p className="mt-0.5 font-extrabold">{puzzle.answerLine}</p><p className="mt-1 text-xs text-primary-foreground/70">{puzzle.answer.annotation}</p></div></div>}
        {wrongSquare && <span className="sr-only" data-testid="text-puzzle-wrong-square">Review square {wrongSquare}</span>}
        <button type="button" data-testid="button-reset-puzzle" onClick={onReset} className="mt-4 flex items-center gap-1 text-xs font-extrabold text-muted-foreground hover:text-foreground"><RotateCcw size={13} /> Reset puzzle</button>
      </div>
    </section>
  );
}