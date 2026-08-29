import { useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, BookOpen, ChevronLeft, ChevronRight, CircleHelp, Crown, Crosshair, History, Menu, X, Zap } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { ChessBoard } from '@/components/Board/ChessBoard';
import { BotPersonality, GameControls } from '@/components/Controls/GameControls';
import { EngineAnalysis, EngineEvaluation, EvaluationBar } from '@/components/Analysis/EngineAnalysis';
import { PostGameReview, ReviewMoment } from '@/components/Analysis/PostGameReview';
import { DailyPuzzle } from '@/components/Lessons/DailyPuzzle';
import { OpeningLibrary } from '@/components/Lessons/OpeningLibrary';
import { RuyLopezLesson } from '@/components/Lessons/RuyLopezLesson';
import { dailyPuzzles, openingTracks } from '@/data/openings';
import { BoardState, Color, Move, applyMove, boardFromFen, boardToFen, initialBoard, isInCheck, legalMoves, legalTargets, pieceGlyph, pgnFromHistory, sanFor } from '@/lib/chess';

type StoredProfile = { elo: number; side: Color; bot: BotPersonality; wins: number; losses: number; draws: number; streak: number };
type StoredMistake = { openingId: string; step: number; expected: string; actual: string; count: number; correctStreak?: number };
type EngineRequest = { kind: 'bot' | 'analysis'; turn: Color; ply: number };
const defaultProfile: StoredProfile = { elo: 1200, side: 'w', bot: 'tactical', wins: 3, losses: 1, draws: 1, streak: 2 };
const emptyEngineEvaluation: EngineEvaluation = { score: null, mate: null, lines: [], depth: 0, ply: 0 };

const botSettings: Record<BotPersonality, { skill: number; depthBias: number; eloLimit?: number }> = {
  tactical: { skill: 18, depthBias: 1 },
  solid: { skill: 20, depthBias: 2 },
  novice: { skill: 4, depthBias: -2, eloLimit: 1050 },
};

function readProfile(): StoredProfile {
  try {
    const parsed = JSON.parse(localStorage.getItem('chessmastery-profile') || '{}');
    const bot = ['tactical', 'solid', 'novice'].includes(parsed?.bot) ? parsed.bot : defaultProfile.bot;
    return { ...defaultProfile, ...parsed, bot };
  } catch { return defaultProfile; }
}
function readMistakes(): StoredMistake[] {
  try {
    const parsed = JSON.parse(localStorage.getItem('chessmastery-weak-points') || '[]');
    return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item.openingId === 'string' && typeof item.step === 'number') : [];
  } catch { return []; }
}

function parseEngineInfo(line: string) {
  const depth = Number(line.match(/\bdepth\s+(\d+)/)?.[1] || 0);
  const rank = Number(line.match(/\bmultipv\s+(\d+)/)?.[1] || 1);
  const scoreMatch = line.match(/\bscore\s+(cp|mate)\s+(-?\d+)/);
  const pv = line.match(/\bpv\s+(.+)$/)?.[1]?.trim().split(/\s+/).filter(Boolean) || [];
  if (!scoreMatch || !pv.length) return null;
  return {
    depth,
    rank,
    scoreCp: scoreMatch[1] === 'cp' ? Number(scoreMatch[2]) : null,
    mate: scoreMatch[1] === 'mate' ? Number(scoreMatch[2]) : null,
    moves: pv,
  };
}

function chooseFallbackMove(moves: Move[], bot: BotPersonality, seed: number) {
  if (bot === 'tactical') {
    const captures = moves.filter((move) => move.captured);
    if (captures.length) return captures[seed % captures.length];
  }
  if (bot === 'solid') {
    const quietMoves = moves.filter((move) => !move.captured);
    if (quietMoves.length) return quietMoves[seed % quietMoves.length];
  }
  return moves[seed % moves.length];
}

function AppShell() {
  const [profile, setProfile] = useState<StoredProfile>(readProfile);
  const [mode, setMode] = useState<'play' | 'lesson' | 'puzzle'>('play');
  const [board, setBoard] = useState<BoardState>(initialBoard);
  const [positions, setPositions] = useState<BoardState[]>([initialBoard()]);
  const [history, setHistory] = useState<Move[]>([]);
  const [turn, setTurn] = useState<Color>('w');
  const [orientation, setOrientation] = useState<Color>(profile.side);
  const [selected, setSelected] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const [engineOn, setEngineOn] = useState(true);
  const engineRef = useRef<Worker | null>(null);
  const engineRequestRef = useRef<EngineRequest | null>(null);
  const [stockfishReady, setStockfishReady] = useState(false);
  const [engineMove, setEngineMove] = useState<string | null>(null);
  const [engineEvaluation, setEngineEvaluation] = useState<EngineEvaluation>(emptyEngineEvaluation);
  const [advantageHistory, setAdvantageHistory] = useState<number[]>([0]);
  const [selectedOpeningId, setSelectedOpeningId] = useState(openingTracks[0].id);
  const [lessonStep, setLessonStep] = useState(0);
  const [lessonStatus, setLessonStatus] = useState<'ready' | 'retry' | 'complete'>('ready');
  const [mistakes, setMistakes] = useState<StoredMistake[]>(readMistakes);
  const [mistakeSquare, setMistakeSquare] = useState<string | undefined>();
  const [mistakeMessage, setMistakeMessage] = useState('');
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [puzzleStatus, setPuzzleStatus] = useState<'ready' | 'retry' | 'complete'>('ready');
  const [puzzleHintVisible, setPuzzleHintVisible] = useState(false);
  const [puzzleAnswerVisible, setPuzzleAnswerVisible] = useState(false);
  const [result, setResult] = useState<'playing' | 'win' | 'loss' | 'draw'>('playing');
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [browseIndex, setBrowseIndex] = useState<number | null>(null);
  const [notice, setNotice] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => { localStorage.setItem('chessmastery-profile', JSON.stringify(profile)); }, [profile]);
  useEffect(() => { localStorage.setItem('chessmastery-weak-points', JSON.stringify(mistakes)); }, [mistakes]);
  useEffect(() => {
    try {
      const worker = new Worker(new URL('./engine/stockfishWorker.js', import.meta.url), { type: 'module' });
      engineRef.current = worker;
      worker.onmessage = (event) => {
        const line = event.data;
        if (typeof line === 'string' && line.includes('uciok')) setStockfishReady(true);
        if (line?.type === 'ready') setStockfishReady(true);
        if (typeof line === 'string' && line.startsWith('bestmove')) {
          const request = engineRequestRef.current;
          engineRequestRef.current = null;
          if (request?.kind === 'bot') setEngineMove(line.split(/\s+/)[1] || null);
        }
        if (typeof line === 'string' && line.startsWith('info ')) {
          const info = parseEngineInfo(line);
          const request = engineRequestRef.current;
          if (info && request) {
            const whiteScore = info.scoreCp === null ? null : (request.turn === 'w' ? info.scoreCp : -info.scoreCp) / 100;
            const whiteMate = info.mate === null ? null : request.turn === 'w' ? info.mate : -info.mate;
            setEngineEvaluation((current) => {
              const nextLine = { rank: info.rank, score: whiteScore, mate: whiteMate, moves: info.moves, depth: info.depth };
              const lines = [...current.lines.filter((item) => item.rank !== info.rank), nextLine].sort((a, b) => a.rank - b.rank);
              const primary = lines.find((item) => item.rank === 1) || nextLine;
              return { score: primary.score, mate: primary.mate, lines, depth: Math.max(current.depth, info.depth), ply: request.ply };
            });
          }
        }
        if (line?.type === 'error') { setStockfishReady(false); setNotice(`Stockfish unavailable: ${line.reason}`); }
      };
      worker.postMessage('uci');
      return () => { worker.terminate(); engineRef.current = null; engineRequestRef.current = null; };
    } catch {
      return undefined;
    }
  }, []);
  const shownBoard = browseIndex === null ? board : positions[browseIndex] || board;
  const lastMove = history.length ? history[history.length - 1] : undefined;
  const pgn = pgnFromHistory(history);
  const captured = useMemo(() => history.filter((move) => move.captured), [history]);
  const selectedOpening = openingTracks.find((track) => track.id === selectedOpeningId) || openingTracks[0];
  const puzzle = dailyPuzzles[puzzleIndex];
  const humanTurn = mode !== 'play' || turn === profile.side;
  const legalTargetSquares = selected && humanTurn && browseIndex === null ? legalTargets(board, selected, turn) : [];
  const reviewMoments = useMemo<ReviewMoment[]>(() => history.map((move, index) => {
    const before = advantageHistory[index] ?? 0;
    const after = advantageHistory[index + 1] ?? before;
    const swing = after - before;
    const moverSwing = index % 2 === 0 ? swing : -swing;
    const label: ReviewMoment['label'] = moverSwing >= 1.5 ? 'Brilliant' : moverSwing >= -0.25 ? 'Good' : moverSwing >= -0.8 ? 'Inaccuracy' : moverSwing >= -1.6 ? 'Mistake' : 'Blunder';
    return { ply: index + 1, san: move.san || move.to, mover: index % 2 === 0 ? 'White' : 'Black', label, swing: moverSwing };
  }), [history, advantageHistory]);

  function resetGame(keepMode = false) {
    const start = initialBoard();
    setBoard(start); setPositions([start]); setHistory([]); setTurn('w'); setSelected(null); setThinking(false); setBrowseIndex(null); setResult('playing');
    setEngineMove(null); setEngineEvaluation(emptyEngineEvaluation); setAdvantageHistory([0]);
    setMistakeSquare(undefined); setMistakeMessage('');
    if (!keepMode) { setMode('play'); setLessonStep(0); setLessonStatus('ready'); }
  }
  function chooseSide(side: Color) { setProfile((p) => ({ ...p, side })); setOrientation(side); resetGame(); }

  function startLesson(openingId = selectedOpeningId) {
    const track = openingTracks.find((item) => item.id === openingId) || openingTracks[0];
    const weakPoint = mistakes.find((item) => item.openingId === track.id);
    const resumeAt = Math.min(weakPoint?.step ?? 0, track.steps.length);
    let current = initialBoard();
    const seededHistory: Move[] = [];
    const seededPositions: BoardState[] = [current];
    for (let index = 0; index < resumeAt; index += 1) {
      const step = track.steps[index];
      const targetPiece = current[8 - Number(step.to[1])]?.['abcdefgh'.indexOf(step.to[0])] || undefined;
      const move: Move = { from: step.from, to: step.to, captured: targetPiece, san: sanFor(current, { from: step.from, to: step.to, captured: targetPiece }) };
      current = applyMove(current, move);
      seededHistory.push(move);
      seededPositions.push(current);
    }
    setSelectedOpeningId(track.id); setMode('lesson');
    setBoard(current); setPositions(seededPositions); setHistory(seededHistory); setTurn(resumeAt % 2 ? 'b' : 'w'); setSelected(null); setThinking(false); setBrowseIndex(null); setResult('playing');
    setEngineMove(null); setEngineEvaluation(emptyEngineEvaluation); setAdvantageHistory([0]);
    setLessonStep(resumeAt); setLessonStatus('ready'); setMistakeSquare(undefined); setMistakeMessage('');
  }

  function startPuzzle(index = puzzleIndex) {
    const item = dailyPuzzles[index];
    const start = boardFromFen(item.fen);
    setPuzzleIndex(index); setMode('puzzle'); setBoard(start); setPositions([start]); setHistory([]); setTurn(item.side); setOrientation(item.side); setSelected(null); setThinking(false); setBrowseIndex(null); setResult('playing');
    setEngineMove(null); setEngineEvaluation(emptyEngineEvaluation); setAdvantageHistory([0]);
    setPuzzleStatus('ready'); setPuzzleHintVisible(false); setPuzzleAnswerVisible(false); setMistakeSquare(undefined); setMistakeMessage('');
  }

  function makeMove(move: Move) {
    const san = sanFor(board, move);
    const next = applyMove(board, move);
    const nextTurn = turn === 'w' ? 'b' : 'w';
    const nextMoves = mode === 'play' ? legalMoves(next, nextTurn) : [];
    if (mode === 'play' && !nextMoves.length) {
      const nextResult = isInCheck(next, nextTurn) ? (nextTurn === profile.side ? 'loss' : 'win') : 'draw';
      setResult(nextResult);
      setProfile((current) => nextResult === 'win' ? { ...current, wins: current.wins + 1, streak: current.streak + 1 } : nextResult === 'loss' ? { ...current, losses: current.losses + 1, streak: 0 } : { ...current, draws: current.draws + 1 });
    }
    setBoard(next); setPositions((all) => [...all, next]); setHistory((all) => [...all, { ...move, san }]); setTurn(nextTurn); setSelected(null); setBrowseIndex(null);
  }

  function requestEngine(kind: EngineRequest['kind'], position: BoardState, side: Color, ply: number, depth: number, skill: number, elo: number) {
    if (!engineRef.current) return;
    engineRef.current.postMessage('stop');
    engineRequestRef.current = { kind, turn: side, ply };
    setEngineEvaluation({ ...emptyEngineEvaluation, ply });
    engineRef.current.postMessage('setoption name MultiPV value 3');
    engineRef.current.postMessage('setoption name UCI_LimitStrength value true');
    engineRef.current.postMessage(`setoption name UCI_Elo value ${elo}`);
    engineRef.current.postMessage(`setoption name Skill Level value ${skill}`);
    engineRef.current.postMessage(`position fen ${boardToFen(position, side)}`);
    engineRef.current.postMessage(`go depth ${depth}`);
  }

  function attemptMove(from: string, to: string) {
    if (browseIndex !== null || thinking || result !== 'playing' || (mode === 'lesson' && lessonStatus === 'complete')) return false;
    const targetPiece = board[8 - Number(to[1])]?.['abcdefgh'.indexOf(to[0])] || undefined;
    if (mode === 'lesson') {
      const expected = selectedOpening.steps[lessonStep];
      const legal = legalTargets(board, from, turn).includes(to);
      if (!expected || from !== expected.from || to !== expected.to || !legal) {
        const actual = `${from}–${to}`;
        setMistakes((items) => {
          const existing = items.find((item) => item.openingId === selectedOpening.id && item.step === lessonStep);
          if (existing) return items.map((item) => item === existing ? { ...item, actual, count: item.count + 1, correctStreak: 0 } : item);
          return [...items, { openingId: selectedOpening.id, step: lessonStep, expected: expected ? `${expected.from}–${expected.to}` : 'unknown', actual, count: 1, correctStreak: 0 }];
        });
        setMistakeSquare(to || from);
        setMistakeMessage(
          legal
            ? `That move is legal, but ${expected?.label?.toLowerCase() || 'the key idea'} is the move to remember here. ${expected?.annotation || ''}`
            : `That move is not legal from this position. Find the highlighted theoretical move. ${expected?.annotation || ''}`,
        );
        setLessonStatus('retry'); setSelected(null); return false;
      }
      makeMove({ from, to, captured: targetPiece });
      setMistakes((items) => items.flatMap((item) => {
        if (item.openingId !== selectedOpening.id || item.step !== lessonStep) return [item];
        const correctStreak = (item.correctStreak || 0) + 1;
        return correctStreak >= 2 ? [] : [{ ...item, correctStreak }];
      }));
      const next = lessonStep + 1;
      setLessonStep(next); setLessonStatus(next >= selectedOpening.steps.length ? 'complete' : 'ready'); setMistakeSquare(undefined); setMistakeMessage('');
      return true;
    }
    if (mode === 'puzzle') {
      const expected = puzzle.answer;
      if (from !== expected.from || to !== expected.to || !legalTargets(board, from, turn).includes(to)) {
        setMistakeSquare(to || from); setPuzzleStatus('retry'); setSelected(null); return false;
      }
      makeMove({ from, to, captured: targetPiece }); setPuzzleStatus('complete'); setMistakeSquare(undefined); setSelected(null);
      return true;
    }
    if (!humanTurn || !legalTargets(board, from, turn).includes(to)) return false;
    makeMove({ from, to, captured: targetPiece });
    return true;
  }

  function handleSquareClick(sq: string) {
    if (browseIndex !== null || thinking || result !== 'playing') return;
    if (mode === 'lesson' || mode === 'puzzle') {
      const from = selected;
      if (!from) { if (legalTargets(board, sq, turn).length) setSelected(sq); return; }
      attemptMove(from, sq);
      return;
    }
    if (!humanTurn) return;
    if (selected && legalTargetSquares.includes(sq)) { attemptMove(selected, sq); return; }
    if (legalTargets(board, sq, turn).length) setSelected(sq); else setSelected(null);
  }

  useEffect(() => {
    if (mode !== 'play' || !engineOn || result !== 'playing' || turn === profile.side || browseIndex !== null || history.length > 80) return;
    const moves = legalMoves(board, turn); if (!moves.length) return;
    setThinking(true);
    const capture = moves.filter((move) => move.captured);
    const delay = capture.length ? 700 : 1200 + (profile.elo % 4) * 260;
    const settings = botSettings[profile.bot];
    const timer = window.setTimeout(() => {
      if (stockfishReady && engineRef.current) {
        requestEngine('bot', board, turn, history.length, Math.min(15, Math.max(4, Math.floor(profile.elo / 250) + settings.depthBias)), settings.skill, settings.eloLimit || profile.elo);
      } else {
        const pick = chooseFallbackMove(moves, profile.bot, profile.elo + history.length * 13);
        makeMove(pick); setThinking(false);
      }
    }, delay);
    return () => { window.clearTimeout(timer); engineRef.current?.postMessage('stop'); };
  }, [board, turn, profile.side, profile.bot, profile.elo, engineOn, mode, browseIndex, history.length, result, stockfishReady]);

  useEffect(() => {
    if (mode !== 'play' || !engineOn || !stockfishReady || !engineRef.current) return;
    const reviewing = browseIndex !== null;
    if (!reviewing && turn !== profile.side && result === 'playing') return;
    const analysisTurn = reviewing ? (browseIndex % 2 ? 'b' : 'w') : turn;
    const analysisBoard = reviewing ? positions[browseIndex] || board : board;
    const ply = reviewing ? browseIndex : history.length;
    const timer = window.setTimeout(() => requestEngine('analysis', analysisBoard, analysisTurn, ply, 11, 20, profile.elo), 100);
    return () => { window.clearTimeout(timer); engineRef.current?.postMessage('stop'); };
  }, [board, positions, turn, profile.side, profile.elo, engineOn, mode, browseIndex, history.length, result, stockfishReady]);

  useEffect(() => {
    if (mode !== 'play' || engineEvaluation.score === null) return;
    setAdvantageHistory((current) => {
      const next = [...current];
      next[engineEvaluation.ply] = engineEvaluation.score as number;
      return next;
    });
  }, [engineEvaluation, mode]);

  useEffect(() => {
    if (!engineMove || mode !== 'play' || turn === profile.side || result !== 'playing') return;
    const moves = legalMoves(board, turn);
    const bestMove = moves.find((candidate) => `${candidate.from}${candidate.to}` === engineMove.slice(0, 4));
    const shouldTeachBlunder = profile.bot === 'novice' && history.length > 0 && history.length % 7 === 0;
    const alternatives = shouldTeachBlunder ? moves.filter((candidate) => `${candidate.from}${candidate.to}` !== engineMove.slice(0, 4) && !candidate.captured) : [];
    const move = alternatives.length ? alternatives[history.length % alternatives.length] : bestMove;
    setEngineMove(null);
    if (move) { makeMove(move); setThinking(false); }
  }, [engineMove, mode, turn, profile.side, profile.bot, result, board, history.length]);

  function undo() {
    if (!history.length) return;
    const remove = mode === 'play' && history.length > 1 ? 2 : 1;
    const nextHistory = history.slice(0, Math.max(0, history.length - remove));
    setHistory(nextHistory); setPositions(positions.slice(0, nextHistory.length + 1)); setBoard(positions[Math.max(0, nextHistory.length)]); setTurn(nextHistory.length % 2 ? 'b' : 'w'); setSelected(null); setBrowseIndex(null);
    setEngineMove(null); setEngineEvaluation(emptyEngineEvaluation); setAdvantageHistory((values) => values.slice(0, nextHistory.length + 1));
  }
  function exportPgn() {
    const body = `[Event "ChessMastery Practice"]\n[Site "Local studio"]\n\n${pgn || '*'}\n`;
    navigator.clipboard?.writeText(body).then(() => setNotice('PGN copied to clipboard')).catch(() => {
      const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([body], { type: 'text/plain' })); link.download = 'chessmastery-game.pgn'; link.click(); setNotice('PGN downloaded');
    });
    window.setTimeout(() => setNotice(''), 2500);
  }
  function importPgn() {
    const tokens = importText.replace(/\[[^\]]*\]/g, '').replace(/\{[^}]*\}/g, '').replace(/\d+\.(\.\.)?/g, ' ').split(/\s+/).filter((token) => token && !['1-0','0-1','1/2-1/2','*'].includes(token));
    let current = initialBoard(); const imported: Move[] = []; const importedPositions = [current];
    for (const token of tokens) {
      const candidate = legalMoves(current, imported.length % 2 ? 'b' : 'w').find((move) => sanFor(current, move).replace(/[+#]/g, '') === token.replace(/[+#]/g, ''));
      if (!candidate) continue;
      const move = { ...candidate, san: sanFor(current, candidate) }; current = applyMove(current, move); imported.push(move); importedPositions.push(current);
    }
    if (!imported.length) { setNotice('No legal moves found in that PGN'); return; }
    setMode('play'); setResult('playing'); setBoard(current); setPositions(importedPositions); setHistory(imported); setTurn(imported.length % 2 ? 'b' : 'w'); setBrowseIndex(null); setImportOpen(false); setImportText(''); setEngineMove(null); setEngineEvaluation(emptyEngineEvaluation); setAdvantageHistory([0]); setNotice(`Loaded ${imported.length} moves`);
    window.setTimeout(() => setNotice(''), 2500);
  }

  return (
    <div className="grain min-h-[100dvh] bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border/70 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm"><Crown size={19} strokeWidth={1.8} /></div><div><div className="serif text-[19px] font-bold leading-none">ChessMastery</div><div className="mono mt-1 text-[9px] uppercase tracking-[.18em] text-muted-foreground">Personal grandmaster studio</div></div></div>
          <nav className="hidden items-center gap-1 rounded-xl bg-secondary/70 p-1 md:flex" aria-label="Primary navigation">
            <button type="button" data-testid="button-mode-play" onClick={() => { setMode('play'); resetGame(true); }} className={`rounded-lg px-4 py-2 text-sm font-bold transition ${mode === 'play' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Practice game</button>
            <button type="button" data-testid="button-mode-lessons" onClick={() => startLesson()} className={`rounded-lg px-4 py-2 text-sm font-bold transition ${mode === 'lesson' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}><span className="flex items-center gap-2"><BookOpen size={14} /> Opening lab</span></button>
            <button type="button" data-testid="button-mode-puzzle" onClick={() => startPuzzle()} className={`rounded-lg px-4 py-2 text-sm font-bold transition ${mode === 'puzzle' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}><span className="flex items-center gap-2"><Crosshair size={14} /> Daily puzzle</span></button>
          </nav>
          <div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-xs font-extrabold">Mira S.</p><p className="mono text-[9px] uppercase tracking-wider text-muted-foreground">Session {profile.streak} day streak</p></div><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e6b65e] text-sm font-extrabold text-primary" data-testid="avatar-profile">MS</div><button type="button" className="md:hidden" data-testid="button-mobile-menu" aria-label="Open menu" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)}><Menu size={19} /></button></div>
        </div>
        {mobileMenuOpen && <div className="border-t border-border/70 px-4 py-3 md:hidden"><div className="grid grid-cols-3 gap-2"><button type="button" data-testid="button-mobile-mode-play" onClick={() => { setMode('play'); resetGame(true); setMobileMenuOpen(false); }} className={`rounded-lg px-3 py-2 text-sm font-bold ${mode === 'play' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>Practice</button><button type="button" data-testid="button-mobile-mode-lessons" onClick={() => { startLesson(); setMobileMenuOpen(false); }} className={`rounded-lg px-3 py-2 text-sm font-bold ${mode === 'lesson' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>Openings</button><button type="button" data-testid="button-mobile-mode-puzzle" onClick={() => { startPuzzle(); setMobileMenuOpen(false); }} className={`rounded-lg px-3 py-2 text-sm font-bold ${mode === 'puzzle' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>Puzzle</button></div></div>}
      </header>
      <main className="mx-auto max-w-[1440px] px-4 py-7 md:px-8 md:py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 animate-rise">
          <div><div className="mb-2 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.2em] text-accent"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> {mode === 'play' ? 'Focused practice' : mode === 'lesson' ? 'Guided study' : 'Tactical awareness'}</div><h1 className="serif text-4xl leading-none tracking-[-.02em] md:text-5xl">{mode === 'play' ? 'Make the next move count.' : mode === 'lesson' ? 'Build your opening instinct.' : 'See the move before it lands.'}</h1><p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">{mode === 'play' ? 'A quiet board, a worthy opponent, and just enough pressure to make you sharper.' : mode === 'lesson' ? `A move-by-move ${selectedOpening.name} study. No memorising the tree — learn why the position breathes.` : 'A short daily position built around a Fork, Pin, or Skewer. Find the forcing move, then make it count.'}</p></div>
          <div className="flex items-center gap-2 rounded-xl border border-card-border bg-card px-3 py-2 shadow-sm" data-testid="status-session"><span className={`h-2 w-2 rounded-full ${thinking ? 'animate-[soft-pulse_1.4s_ease-in-out_infinite] bg-accent' : 'bg-[#5f9e7a]'}`} /><span className="mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">{thinking ? 'Engine is thinking' : 'Local session active'}</span></div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,730px)_320px_minmax(230px,1fr)]">
          <section className="animate-rise delay-1 min-w-0">
            {mode === 'lesson' && <div className="mb-4 flex items-center justify-between"><p className="mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Lesson position / move {Math.floor(lessonStep / 2) + 1}</p><button type="button" data-testid="button-reset-lesson" onClick={() => startLesson(selectedOpeningId)} className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground"><Zap size={13} /> Reset line</button></div>}
            {mode === 'puzzle' && <div className="mb-4 flex items-center justify-between"><p className="mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Daily position / {puzzle.theme}</p><span className="mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">{puzzle.side === 'w' ? 'White to move' : 'Black to move'}</span></div>}
             <div className="mx-auto flex max-w-[680px] items-stretch gap-2"><div className="min-w-0 flex-1"><ChessBoard board={shownBoard} turn={turn} orientation={orientation} selected={selected} lastMove={lastMove} lessonTargets={mode === 'lesson' && lessonStep < selectedOpening.steps.length ? [selectedOpening.steps[lessonStep].to] : mode === 'puzzle' && puzzleHintVisible ? [puzzle.answer.from] : []} dangerSquares={mistakeSquare ? [mistakeSquare] : []} onSquareClick={handleSquareClick} onMoveAttempt={attemptMove} disabled={browseIndex !== null || thinking || result !== 'playing' || (mode === 'play' && !humanTurn) || (mode === 'lesson' && lessonStatus === 'complete') || (mode === 'puzzle' && puzzleStatus === 'complete')} /></div>{mode === 'play' && <EvaluationBar evaluation={engineEvaluation} ready={stockfishReady} />}</div>
            <div className="mx-auto mt-4 flex max-w-[680px] items-center justify-between"><div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">{profile.side === 'w' ? '♔' : '♚'}</div><div><p className="text-xs font-extrabold">Mira S.</p><p className="mono text-[9px] uppercase tracking-wider text-muted-foreground">{profile.side === 'w' ? 'White' : 'Black'} · {profile.elo}</p></div></div><div className="text-right"><p className="mono text-[10px] uppercase tracking-wider text-muted-foreground">{result !== 'playing' ? 'Game complete' : thinking ? 'Engine is thinking' : turn === profile.side ? 'Your move' : 'Opponent to move'}</p><p className={`mt-1 text-xs font-bold ${result === 'win' ? 'text-[#37664d]' : result === 'loss' ? 'text-[#a84236]' : 'text-foreground'}`} data-testid="status-game-result">{result === 'win' ? 'A composed win.' : result === 'loss' ? 'A useful lesson.' : result === 'draw' ? 'A balanced draw.' : thinking ? (stockfishReady ? 'Stockfish analyzing' : 'Local fallback engine') : 'Evaluation · balanced'}</p></div></div>
             {mode === 'play' && result !== 'playing' && <PostGameReview history={history} advantageHistory={advantageHistory} moments={reviewMoments} result={result} onNewGame={() => resetGame()} />}
          </section>
          <aside className="animate-rise delay-2 space-y-5">
             {mode === 'lesson' ? <div className="space-y-4"><OpeningLibrary tracks={openingTracks} selectedId={selectedOpening.id} completedSteps={lessonStep} weakPointCount={mistakes.filter((item) => item.openingId === selectedOpening.id).length} onSelect={(id) => startLesson(id)} /><RuyLopezLesson track={selectedOpening} step={lessonStep} total={selectedOpening.steps.length} status={lessonStatus} mistakeMessage={mistakeMessage} currentStep={selectedOpening.steps[lessonStep]} onReset={() => startLesson(selectedOpening.id)} /></div> : mode === 'puzzle' ? <DailyPuzzle puzzles={dailyPuzzles} puzzle={puzzle} index={puzzleIndex} status={puzzleStatus} hintVisible={puzzleHintVisible} answerVisible={puzzleAnswerVisible} wrongSquare={mistakeSquare} onSelect={(index) => startPuzzle(index)} onHint={() => setPuzzleHintVisible((value) => !value)} onAnswer={() => setPuzzleAnswerVisible((value) => !value)} onReset={() => startPuzzle(puzzleIndex)} /> : <div className="space-y-5"><EngineAnalysis evaluation={engineEvaluation} ready={stockfishReady} enabled={engineOn} reviewing={browseIndex !== null} /><GameControls elo={profile.elo} side={profile.side} bot={profile.bot} engineOn={engineOn} onElo={(elo) => setProfile((p) => ({ ...p, elo }))} onSide={chooseSide} onBot={(bot) => setProfile((p) => ({ ...p, bot }))} onNew={() => resetGame()} onUndo={undo} onFlip={() => setOrientation((value) => value === 'w' ? 'b' : 'w')} onImport={() => setImportOpen(true)} onExport={exportPgn} onEngine={() => setEngineOn((value) => !value)} /></div>}
            <div className="rounded-2xl border border-card-border bg-card p-4 shadow-sm"><div className="mb-3 flex items-center justify-between"><span className="text-[11px] font-extrabold uppercase tracking-[.18em] text-muted-foreground">Captured</span><span className="mono text-[10px] text-muted-foreground">{captured.length} pieces</span></div><div className="flex min-h-7 flex-wrap gap-1 text-xl" data-testid="text-captured-pieces">{captured.length ? captured.map((move, i) => <span key={`${move.to}-${i}`} className="opacity-70">{move.captured && pieceGlyph(move.captured)}</span>) : <span className="text-xs text-muted-foreground">The board is still intact.</span>}</div></div>
          </aside>
          <aside className="animate-rise delay-3 hidden min-w-0 xl:block">
            <div className="mb-5 flex items-center justify-between"><h2 className="serif text-2xl">Game notes</h2><CircleHelp size={16} className="text-muted-foreground" /></div>
            <div className="rounded-2xl border border-card-border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-border px-4 py-3"><span className="text-[11px] font-extrabold uppercase tracking-[.16em] text-muted-foreground">Move history</span><span className="mono text-[10px] text-muted-foreground">{history.length} plies</span></div>
              <div className="scrollbar-thin max-h-[245px] overflow-y-auto p-2" data-testid="list-move-history">{history.length ? history.map((move, i) => <button type="button" data-testid={`button-history-move-${i + 1}`} key={`${move.from}-${move.to}-${i}`} onClick={() => setBrowseIndex(i + 1)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-secondary ${browseIndex === i + 1 ? 'bg-secondary' : ''}`}><span className="mono w-7 text-[10px] text-muted-foreground">{i % 2 === 0 ? `${Math.floor(i / 2) + 1}.` : ''}</span><span className="font-bold">{move.san}</span><span className="mono ml-auto text-[10px] text-muted-foreground">{move.from}–{move.to}</span></button>) : <div className="px-3 py-8 text-center"><History className="mx-auto mb-2 text-muted-foreground" size={20} /><p className="text-xs leading-relaxed text-muted-foreground">Your decisions will appear here.</p></div>}</div>
              <div className="flex items-center justify-between border-t border-border p-3">{browseIndex !== null ? <><button type="button" data-testid="button-history-previous" disabled={browseIndex <= 0} onClick={() => setBrowseIndex(Math.max(0, browseIndex - 1))} className="flex items-center gap-1 text-xs font-bold text-muted-foreground disabled:opacity-35"><ChevronLeft size={14} /> Previous</button><span className="mono text-[10px] text-muted-foreground">Position {browseIndex}/{history.length}</span><button type="button" data-testid="button-history-next" disabled={browseIndex >= history.length} onClick={() => setBrowseIndex(Math.min(history.length, browseIndex + 1))} className="flex items-center gap-1 text-xs font-bold text-muted-foreground disabled:opacity-35">Next <ChevronRight size={14} /></button></> : <span className="mono text-[10px] text-muted-foreground">{pgn || 'No moves yet'}</span>}</div>
            </div>
            <div className="mt-5 rounded-2xl bg-primary p-5 text-primary-foreground"><div className="mb-5 flex items-start justify-between"><div><p className="mono text-[10px] uppercase tracking-[.18em] text-[#e6b65e]">Your practice</p><p className="serif mt-1 text-2xl">Quiet consistency.</p></div><BarChart3 size={18} className="text-[#e6b65e]" /></div><div className="grid grid-cols-3 gap-2 border-t border-primary-foreground/15 pt-4"><div><p className="mono text-lg text-[#e6b65e]" data-testid="text-wins">{profile.wins}</p><p className="text-[10px] uppercase tracking-wider text-primary-foreground/60">Wins</p></div><div><p className="mono text-lg text-[#e6b65e]" data-testid="text-streak">{profile.streak}</p><p className="text-[10px] uppercase tracking-wider text-primary-foreground/60">Streak</p></div><div><p className="mono text-lg text-[#e6b65e]">{profile.draws}</p><p className="text-[10px] uppercase tracking-wider text-primary-foreground/60">Draws</p></div></div></div>
          </aside>
        </div>
      </main>
      {notice && <div className="fixed bottom-5 left-1/2 z-30 -translate-x-1/2 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-lg" role="status" data-testid="status-notice">{notice}</div>}
      {importOpen && <div className="fixed inset-0 z-40 flex items-center justify-center bg-primary/40 p-4 backdrop-blur-sm"><div className="w-full max-w-lg animate-rise rounded-2xl border border-card-border bg-card p-5 shadow-xl" role="dialog" aria-modal="true" data-testid="dialog-import-pgn"><div className="mb-4 flex items-start justify-between"><div><p className="mono text-[10px] uppercase tracking-[.18em] text-accent">Bring your study in</p><h2 className="serif mt-1 text-2xl">Import a PGN</h2></div><button type="button" data-testid="button-close-import" onClick={() => setImportOpen(false)} aria-label="Close import"><X size={18} /></button></div><textarea data-testid="textarea-import-pgn" value={importText} onChange={(e) => setImportText(e.target.value)} placeholder={'[Event "Ruy Lopez"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bb5 a6'} className="min-h-44 w-full resize-y rounded-xl border border-input bg-background p-3 mono text-xs leading-relaxed outline-none ring-accent focus:ring-2" /><div className="mt-4 flex justify-end gap-2"><button type="button" data-testid="button-cancel-import" onClick={() => setImportOpen(false)} className="rounded-xl px-4 py-2.5 text-sm font-bold text-muted-foreground hover:bg-secondary">Cancel</button><button type="button" data-testid="button-load-pgn" onClick={importPgn} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-foreground hover:opacity-90">Load game</button></div></div></div>}
    </div>
  );
}

export default function App() {
  return <ErrorBoundary><AppShell /></ErrorBoundary>;
}