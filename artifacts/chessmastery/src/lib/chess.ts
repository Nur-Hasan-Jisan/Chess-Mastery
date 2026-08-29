import { Chess } from 'chess.js';

export type Color = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type Piece = { color: Color; type: PieceType };
export type BoardState = (Piece | null)[][];
export type Move = { from: string; to: string; promotion?: PieceType; captured?: Piece; san?: string };

const files = 'abcdefgh';
const glyphs: Record<Color, Record<PieceType, string>> = {
  w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
};

export function pieceGlyph(piece: Piece | null) {
  return piece ? glyphs[piece.color][piece.type] : '';
}
export function coord(square: string) {
  return { x: files.indexOf(square[0]), y: 8 - Number(square[1]) };
}
export function square(x: number, y: number) { return `${files[x]}${8 - y}`; }
export function cloneBoard(board: BoardState): BoardState { return board.map((row) => row.map((piece) => piece ? { ...piece } : null)); }

export function initialBoard(): BoardState {
  const board: BoardState = Array.from({ length: 8 }, () => Array<Piece | null>(8).fill(null));
  const back: PieceType[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  back.forEach((type, x) => {
    board[0][x] = { color: 'b', type }; board[1][x] = { color: 'b', type: 'p' };
    board[6][x] = { color: 'w', type: 'p' }; board[7][x] = { color: 'w', type };
  });
  return board;
}

export function boardFromFen(fen: string): BoardState {
  const board: BoardState = Array.from({ length: 8 }, () => Array<Piece | null>(8).fill(null));
  const placement = fen.split(/\s+/)[0] || '';
  placement.split('/').forEach((rank, y) => {
    let x = 0;
    for (const symbol of rank) {
      if (/\d/.test(symbol)) x += Number(symbol);
      else {
        const color: Color = symbol === symbol.toUpperCase() ? 'w' : 'b';
        board[y][x] = { color, type: symbol.toLowerCase() as PieceType };
        x += 1;
      }
    }
  });
  return board;
}

function pseudoMoves(board: BoardState, from: string, includeCastle = true): string[] {
  const { x: fx, y: fy } = coord(from); const piece = board[fy]?.[fx]; if (!piece) return [];
  const out: string[] = [];
  const add = (x: number, y: number) => { if (x >= 0 && x < 8 && y >= 0 && y < 8 && board[y][x]?.color !== piece.color) out.push(square(x, y)); };
  if (piece.type === 'p') {
    const dir = piece.color === 'w' ? -1 : 1; const start = piece.color === 'w' ? 6 : 1;
    if (board[fy + dir]?.[fx] === null) { out.push(square(fx, fy + dir)); if (fy === start && board[fy + dir * 2]?.[fx] === null) out.push(square(fx, fy + dir * 2)); }
    [-1, 1].forEach((dx) => { const target = board[fy + dir]?.[fx + dx]; if (target && target.color !== piece.color) out.push(square(fx + dx, fy + dir)); });
  }
  if (piece.type === 'n') [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]].forEach(([x,y]) => add(fx+x, fy+y));
  if (piece.type === 'k') {
    for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) if (x || y) add(fx+x, fy+y);
    if (includeCastle && (from === 'e1' || from === 'e8')) {
      const row = piece.color === 'w' ? 7 : 0;
      if (!board[row][5] && !board[row][6] && board[row][7]?.type === 'r' && board[row][7]?.color === piece.color) out.push(square(6, row));
      if (!board[row][1] && !board[row][2] && !board[row][3] && board[row][0]?.type === 'r' && board[row][0]?.color === piece.color) out.push(square(2, row));
    }
  }
  const dirs = piece.type === 'b' ? [[1,1],[-1,1],[1,-1],[-1,-1]] : piece.type === 'r' ? [[1,0],[-1,0],[0,1],[0,-1]] : [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
  if (['b','r','q'].includes(piece.type)) dirs.forEach(([dx,dy]) => { let x=fx+dx,y=fy+dy; while(x>=0&&x<8&&y>=0&&y<8){ if(board[y][x]){ if(board[y][x]?.color!==piece.color)out.push(square(x,y)); break;} out.push(square(x,y)); x+=dx;y+=dy;} });
  return out;
}
function attacked(board: BoardState, target: string, by: Color) {
  const { x: tx, y: ty } = coord(target);
  return board.some((row, y) => row.some((piece, x) => {
    if (piece?.color !== by) return false;
    if (piece.type === 'p') return ty === y + (by === 'w' ? -1 : 1) && Math.abs(tx - x) === 1;
    return pseudoMoves(board, square(x,y), false).includes(target);
  }));
}
function inCheck(board: BoardState, color: Color) {
  let king = ''; board.forEach((row,y)=>row.forEach((p,x)=>{if(p?.color===color&&p.type==='k')king=square(x,y);}));
  return !!king && attacked(board, king, color === 'w' ? 'b' : 'w');
}
export function isInCheck(board: BoardState, color: Color) { return inCheck(board, color); }
export function legalTargets(board: BoardState, from: string, turn: Color) {
  const { x, y } = coord(from); if (board[y]?.[x]?.color !== turn) return [];
  return pseudoMoves(board, from).filter((to) => {
    if (!chessJsAllows(board, turn, from, to)) return false;
    const next = applyMove(board, { from, to }); return !inCheck(next, turn);
  });
}
export function legalMoves(board: BoardState, turn: Color): Move[] {
  const result: Move[] = [];
  board.forEach((row,y)=>row.forEach((p,x)=>{if(p?.color===turn){const from=square(x,y); legalTargets(board,from,turn).forEach(to=>result.push({from,to,captured:board[coord(to).y][coord(to).x]||undefined}));}}));
  return result;
}
export function applyMove(board: BoardState, move: Move): BoardState {
  const next = cloneBoard(board); const {x:fx,y:fy}=coord(move.from); const {x:tx,y:ty}=coord(move.to);
  const piece = next[fy][fx]; if (!piece) return next; next[fy][fx] = null; next[ty][tx] = piece;
  if (piece.type === 'k' && Math.abs(tx-fx)===2) {
    const rookFrom = tx > fx ? 7 : 0; const rookTo = tx > fx ? 5 : 3;
    next[ty][rookTo] = next[ty][rookFrom]; next[ty][rookFrom] = null;
  }
  if (piece.type === 'p' && (ty === 0 || ty === 7)) next[ty][tx] = { color: piece.color, type: move.promotion || 'q' };
  return next;
}
export function sanFor(board: BoardState, move: Move) {
  const {x:fx,y:fy}=coord(move.from); const piece=board[fy][fx]; if(!piece)return move.to;
  if(piece.type==='k'&&Math.abs(coord(move.to).x-fx)===2)return coord(move.to).x>fx?'O-O':'O-O-O';
  const capture = !!move.captured;
  const letter = piece.type === 'p' ? '' : piece.type.toUpperCase();
  return `${letter}${capture && piece.type==='p'?move.from[0]:''}${capture?'x':''}${move.to}${piece.type==='p'&& (coord(move.to).y===0||coord(move.to).y===7)?'=Q':''}`;
}
export function boardToFen(board: BoardState, turn: Color) {
  return board.map(row=>{let empty=0,out='';row.forEach(p=>{if(!p)empty++;else{if(empty){out+=empty;empty=0;}out+=p.color==='w'?p.type.toUpperCase():p.type;}});if(empty)out+=empty;return out;}).join('/')+` ${turn} - - 0 1`;
}
function chessJsAllows(board: BoardState, turn: Color, from: string, to: string) {
  try {
    const game = new Chess(`${boardToFen(board, turn).replace(' - -', ' KQkq -')}`);
    game.move({ from, to, promotion: 'q' });
    return true;
  } catch {
    return false;
  }
}
export function pgnFromHistory(history: Move[]) {
  return history.reduce((out, move, i) => `${out}${i % 2 === 0 ? `${Math.floor(i / 2) + 1}. ` : ''}${move.san || move.to}${i % 2 === 1 ? ' ' : ''}`, '').trim();
}