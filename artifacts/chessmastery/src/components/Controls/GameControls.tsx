import { Download, FlipVertical2, FolderOpen, RotateCcw, Shield, Sparkles, Swords, Undo2, Volume2, VolumeX } from 'lucide-react';

export type BotPersonality = 'tactical' | 'solid' | 'novice';
type Props = {
  elo: number; side: 'w' | 'b'; bot: BotPersonality; engineOn: boolean;
  onElo: (value: number) => void; onSide: (side: 'w' | 'b') => void;
  onBot: (bot: BotPersonality) => void;
  onNew: () => void; onUndo: () => void; onFlip: () => void; onImport: () => void; onExport: () => void; onEngine: () => void;
};

export function GameControls({ elo, side, bot, engineOn, onElo, onSide, onBot, onNew, onUndo, onFlip, onImport, onExport, onEngine }: Props) {
  return (
    <section className="space-y-5" aria-label="Game controls">
      <div className="rounded-2xl border border-card-border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between"><span className="text-[11px] font-extrabold uppercase tracking-[.18em] text-muted-foreground">Your side</span><span className="mono text-xs text-accent">{side === 'w' ? 'WHITE' : 'BLACK'}</span></div>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" data-testid="button-side-white" onClick={() => onSide('w')} className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition ${side === 'w' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-secondary/40 text-foreground hover:bg-secondary'}`}>White</button>
          <button type="button" data-testid="button-side-black" onClick={() => onSide('b')} className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition ${side === 'b' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-secondary/40 text-foreground hover:bg-secondary'}`}>Black</button>
        </div>
      </div>
      <div className="rounded-2xl border border-card-border bg-card p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between"><span className="text-[11px] font-extrabold uppercase tracking-[.18em] text-muted-foreground">Opponent strength</span><span className="mono text-sm font-medium text-foreground">{elo}</span></div>
        <input aria-label="Engine Elo" data-testid="input-engine-elo" type="range" min="800" max="2200" step="50" value={elo} onChange={(e) => onElo(Number(e.target.value))} className="w-full accent-[#d85f4d]" />
        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground"><span>CASUAL</span><span>CLUB</span><span>MASTER</span></div>
      </div>
      <div className="rounded-2xl border border-card-border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between"><span className="text-[11px] font-extrabold uppercase tracking-[.18em] text-muted-foreground">Bot personality</span><span className="mono text-[9px] uppercase tracking-wider text-accent">Style</span></div>
        <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Bot personality presets">
          {([
            ['tactical', 'Tactical', Swords, 'Sharp'],
            ['solid', 'Solid', Shield, 'Steady'],
            ['novice', 'Novice', Sparkles, 'Unpredictable'],
          ] as const).map(([value, label, Icon, hint]) => (
            <button key={value} type="button" aria-pressed={bot === value} data-testid={`button-bot-${value}`} onClick={() => onBot(value)} className={`flex min-h-[68px] flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2 transition ${bot === value ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:bg-secondary'}`}>
              <Icon size={16} />
              <span className="text-[10px] font-extrabold">{label}</span>
              <span className={`text-[8px] ${bot === value ? 'text-primary-foreground/65' : 'text-muted-foreground'}`}>{hint}</span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">{bot === 'tactical' ? 'Prefers forcing moves and active pressure.' : bot === 'solid' ? 'Values structure, safety, and patient improvements.' : 'Plays at reduced strength with the occasional teaching blunder.'}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" data-testid="button-new-game" onClick={onNew} className="flex items-center justify-center gap-2 rounded-xl bg-accent px-3 py-3 text-sm font-extrabold text-accent-foreground shadow-sm transition hover:-translate-y-0.5"><RotateCcw size={15} /> New game</button>
        <button type="button" data-testid="button-undo-move" onClick={onUndo} className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-3 text-sm font-bold transition hover:bg-secondary"><Undo2 size={15} /> Undo</button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <button type="button" data-testid="button-flip-board" onClick={onFlip} className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card py-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"><FlipVertical2 size={16} /><span className="text-[10px] font-bold">Flip</span></button>
        <button type="button" data-testid="button-import-pgn" onClick={onImport} className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card py-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"><FolderOpen size={16} /><span className="text-[10px] font-bold">Import</span></button>
        <button type="button" data-testid="button-export-pgn" onClick={onExport} className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card py-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"><Download size={16} /><span className="text-[10px] font-bold">Export</span></button>
        <button type="button" data-testid="button-toggle-engine" onClick={onEngine} className={`flex flex-col items-center gap-1 rounded-xl border py-2 transition ${engineOn ? 'border-[#b7d5c5] bg-[#e6f1ea] text-[#37664d]' : 'border-border bg-card text-muted-foreground'}`}>{engineOn ? <Volume2 size={16} /> : <VolumeX size={16} />}<span className="text-[10px] font-bold">Engine</span></button>
      </div>
    </section>
  );
}