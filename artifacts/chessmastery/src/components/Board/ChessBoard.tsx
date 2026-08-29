import { useMemo } from 'react';
import { Chessboard } from 'react-chessboard';
import { BoardState, Color, boardToFen, legalTargets } from '@/lib/chess';

type ChessBoardProps = {
  board: BoardState;
  turn: Color;
  orientation: Color;
  selected: string | null;
  lastMove?: { from: string; to: string };
  lessonTargets?: string[];
  dangerSquares?: string[];
  onSquareClick: (square: string) => void;
  onMoveAttempt: (from: string, to: string) => boolean;
  disabled?: boolean;
};

export function ChessBoard({ board, turn, orientation, selected, lastMove, lessonTargets = [], dangerSquares = [], onSquareClick, onMoveAttempt, disabled }: ChessBoardProps) {
  const targets = useMemo(() => selected ? legalTargets(board, selected, turn) : [], [board, selected, turn]);
  const squareStyles: Record<string, React.CSSProperties> = {};
  [...targets, ...lessonTargets].forEach((target) => { squareStyles[target] = { background: 'radial-gradient(circle, rgba(38,43,61,.35) 0 23%, transparent 25%)' }; });
  if (lastMove) {
    squareStyles[lastMove.from] = { ...(squareStyles[lastMove.from] || {}), backgroundColor: 'rgba(232,182,93,.35)' };
    squareStyles[lastMove.to] = { ...(squareStyles[lastMove.to] || {}), backgroundColor: 'rgba(232,182,93,.5)' };
  }
  if (selected) squareStyles[selected] = { ...(squareStyles[selected] || {}), boxShadow: 'inset 0 0 0 4px #e2a64a' };
  dangerSquares.forEach((target) => { squareStyles[target] = { ...(squareStyles[target] || {}), backgroundColor: 'rgba(188, 67, 57, .48)', boxShadow: 'inset 0 0 0 4px rgba(150, 44, 38, .72)' }; });
  return (
    <div className="board-shadow w-full overflow-hidden rounded-[10px] border-[5px] border-[#262b3d] bg-[#262b3d]" data-testid="board-chess">
      <Chessboard
        options={{
          position: boardToFen(board, turn),
          boardOrientation: orientation === 'w' ? 'white' : 'black',
          showNotation: true,
          allowDrawingArrows: false,
          allowDragging: !disabled,
          animationDurationInMs: 220,
          squareStyles,
          lightSquareStyle: { backgroundColor: '#eadfc4' },
          darkSquareStyle: { backgroundColor: '#b2785e' },
          boardStyle: { borderRadius: '5px', overflow: 'hidden' },
          onSquareClick: ({ square }) => onSquareClick(square),
          onPieceDrop: ({ sourceSquare, targetSquare }) => !disabled && !!targetSquare && onMoveAttempt(sourceSquare, targetSquare),
        }}
      />
    </div>
  );
}