import { Activity, Cpu, Gauge } from 'lucide-react';

export type EngineLine = {
  rank: number;
  score: number | null;
  mate: number | null;
  moves: string[];
  depth: number;
};

export type EngineEvaluation = {
  score: number | null;
  mate: number | null;
  lines: EngineLine[];
  depth: number;
  ply: number;
};

type EvaluationBarProps = {
  evaluation: EngineEvaluation;
  ready: boolean;
};

function evaluationLabel(evaluation: EngineEvaluation) {
  if (evaluation.mate !== null) return `${evaluation.mate > 0 ? '+' : evaluation.mate < 0 ? '-' : ''}M${Math.abs(evaluation.mate)}`;
  if (evaluation.score === null) return '—';
  return `${evaluation.score > 0 ? '+' : ''}${evaluation.score.toFixed(1)}`;
}

function whiteAdvantagePercent(evaluation: EngineEvaluation) {
  if (evaluation.mate !== null) return evaluation.mate > 0 ? 100 : 0;
  if (evaluation.score === null) return 50;
  return Math.max(4, Math.min(96, 50 + evaluation.score * 10));
}

function formatPv(moves: string[]) {
  return moves.slice(0, 8).map((move) => `${move.slice(0, 2)}–${move.slice(2, 4)}`).join('  ');
}

export function EvaluationBar({ evaluation, ready }: EvaluationBarProps) {
  const whitePercent = whiteAdvantagePercent(evaluation);
  return (
    <div className="flex w-9 shrink-0 flex-col items-center gap-2" data-testid="engine-evaluation-bar">
      <span className={`mono text-[10px] font-bold ${evaluation.score !== null && evaluation.score < 0 ? 'text-[#a84236]' : 'text-foreground'}`} aria-label={`Engine evaluation ${evaluationLabel(evaluation)}`}>
        {evaluationLabel(evaluation)}
      </span>
      <div className="relative flex h-full min-h-[280px] w-5 overflow-hidden rounded-md border border-primary/20 bg-primary shadow-inner" title={`Engine evaluation ${evaluationLabel(evaluation)}`}>
        <div className="absolute inset-x-0 bottom-0 bg-card transition-all duration-500" style={{ height: `${whitePercent}%` }} />
        <span className="absolute bottom-1 left-0 right-0 text-center text-[8px] font-black text-primary/55">W</span>
        <span className="absolute left-0 right-0 top-1 text-center text-[8px] font-black text-primary-foreground/55">B</span>
      </div>
      <span className="mono text-[8px] uppercase tracking-wider text-muted-foreground">{ready ? 'SF' : '—'}</span>
    </div>
  );
}

type EngineAnalysisProps = {
  evaluation: EngineEvaluation;
  ready: boolean;
  enabled: boolean;
  reviewing: boolean;
};

export function EngineAnalysis({ evaluation, ready, enabled, reviewing }: EngineAnalysisProps) {
  return (
    <section className="rounded-2xl border border-card-border bg-card p-4 shadow-sm" data-testid="engine-analysis-panel">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="mono mb-1 text-[10px] uppercase tracking-[.18em] text-accent">Stockfish / live analysis</p>
          <h2 className="serif text-2xl">The position says…</h2>
        </div>
        <span className={`flex items-center gap-1 rounded-full px-2 py-1 mono text-[9px] font-bold uppercase tracking-wider ${ready && enabled ? 'bg-[#e6f1ea] text-[#37664d]' : 'bg-secondary text-muted-foreground'}`}>
          <Activity size={11} /> {reviewing ? 'Reviewing' : ready && enabled ? 'Live' : enabled ? 'Starting' : 'Paused'}
        </span>
      </div>
      <div className="mb-4 flex items-center justify-between rounded-xl bg-secondary/65 px-3 py-2.5">
        <div className="flex items-center gap-2 text-xs font-bold"><Gauge size={15} className="text-accent" /> Evaluation</div>
        <span className="mono text-lg font-bold" data-testid="text-engine-evaluation">{evaluationLabel(evaluation)}</span>
      </div>
      <div className="mb-2 flex items-center justify-between">
        <p className="mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Top 3 lines</p>
        <span className="mono text-[9px] text-muted-foreground">{evaluation.depth ? `depth ${evaluation.depth}` : 'waiting'}</span>
      </div>
      <div className="space-y-1.5" data-testid="list-engine-lines">
        {evaluation.lines.length ? evaluation.lines.slice(0, 3).map((line) => (
          <div key={line.rank} className="flex items-start gap-2 rounded-lg bg-background px-2.5 py-2">
            <span className="mono mt-0.5 w-3 text-[10px] font-bold text-accent">{line.rank}</span>
            <div className="min-w-0">
              <p className="mono truncate text-[10px] font-medium text-foreground">{formatPv(line.moves) || 'Calculating…'}</p>
              <p className="mt-0.5 text-[9px] text-muted-foreground">{line.mate !== null ? `Mate in ${Math.abs(line.mate)}` : line.score === null ? '—' : `${line.score > 0 ? '+' : ''}${line.score.toFixed(1)} evaluation`}</p>
            </div>
          </div>
        )) : (
          <div className="flex items-center gap-2 rounded-lg bg-background px-2.5 py-3 text-xs text-muted-foreground">
            <Cpu size={14} className="shrink-0 text-accent" />
            {enabled ? 'Stockfish is warming up…' : 'Turn Engine on to analyze this position.'}
          </div>
        )}
      </div>
    </section>
  );
}