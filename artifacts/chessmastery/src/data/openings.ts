import type { Color } from '@/lib/chess';

export type OpeningStep = {
  from: string;
  to: string;
  label: string;
  annotation: string;
};

export type OpeningTrack = {
  id: string;
  name: string;
  family: string;
  description: string;
  difficulty: 'Foundational' | 'Club' | 'Advanced';
  color: string;
  steps: OpeningStep[];
};

export type Puzzle = {
  id: string;
  name: string;
  theme: 'Fork' | 'Pin' | 'Skewer';
  description: string;
  fen: string;
  side: Color;
  answer: OpeningStep;
  answerLine: string;
  hint: string;
};

export const openingTracks: OpeningTrack[] = [
  {
    id: 'ruy-lopez',
    name: 'Ruy Lopez',
    family: 'Spanish Game',
    description: 'A patient fight for the centre that turns pressure into initiative.',
    difficulty: 'Foundational',
    color: '#d85f4d',
    steps: [
      { from: 'e2', to: 'e4', label: 'Claim the centre', annotation: 'Open lines for the queen and king bishop while taking space.' },
      { from: 'e7', to: 'e5', label: 'Meet the centre', annotation: 'Black mirrors the claim and keeps the position principled.' },
      { from: 'g1', to: 'f3', label: 'Develop with tempo', annotation: 'The knight attacks e5 and makes Black answer a question.' },
      { from: 'b8', to: 'c6', label: 'Defend and develop', annotation: 'The knight supports e5 and prepares to meet the bishop.' },
      { from: 'f1', to: 'b5', label: 'The Spanish bishop', annotation: 'Pin the c6 knight to the king and build long-term pressure.' },
      { from: 'a7', to: 'a6', label: 'Ask the bishop', annotation: 'Gain a useful tempo and make White decide where the bishop belongs.' },
      { from: 'b5', to: 'a4', label: 'Keep the tension', annotation: 'Retreat without giving up the pin idea or the diagonal.' },
      { from: 'g8', to: 'f6', label: 'Finish development', annotation: 'Challenge e4 and prepare to castle into a sound position.' },
      { from: 'e1', to: 'g1', label: 'Castle early', annotation: 'The king finds safety and the rook joins the centre.' },
      { from: 'f8', to: 'e7', label: 'Prepare to castle', annotation: 'Develop the bishop quietly and keep the structure flexible.' },
      { from: 'f1', to: 'e1', label: 'Centralise the rook', annotation: 'The rook supports e4 and makes the centre harder to challenge.' },
      { from: 'b7', to: 'b5', label: 'Gain queenside space', annotation: 'Black gains space and asks the bishop one more question.' },
      { from: 'a4', to: 'b3', label: 'Keep the bishop', annotation: 'The bishop stays on the long diagonal and watches f7.' },
      { from: 'd7', to: 'd6', label: 'Build a solid shell', annotation: 'Support e5 and give the dark bishop a reliable home.' },
    ],
  },
  {
    id: 'italian-game',
    name: 'Italian Game',
    family: 'Giuoco Piano',
    description: 'Fast development and a direct look at the vulnerable f7 square.',
    difficulty: 'Foundational',
    color: '#7c9b6f',
    steps: [
      { from: 'e2', to: 'e4', label: 'Open the board', annotation: 'Take central space and free the bishops.' },
      { from: 'e7', to: 'e5', label: 'Hold the centre', annotation: 'Match White and contest the key central squares.' },
      { from: 'g1', to: 'f3', label: 'Attack e5', annotation: 'Develop with tempo and make Black defend the centre.' },
      { from: 'b8', to: 'c6', label: 'Natural defence', annotation: 'Develop while keeping the e5 pawn protected.' },
      { from: 'f1', to: 'c4', label: 'Target f7', annotation: 'The bishop points at the weakest square in Black’s camp.' },
      { from: 'f8', to: 'c5', label: 'Mirror the idea', annotation: 'Black develops actively and keeps an eye on f2.' },
      { from: 'c2', to: 'c3', label: 'Prepare the centre', annotation: 'Support d4 and give the queen a clear route.' },
      { from: 'g8', to: 'f6', label: 'Challenge e4', annotation: 'Develop and put immediate pressure on White’s centre.' },
      { from: 'd2', to: 'd4', label: 'Strike now', annotation: 'Open the centre before Black can castle comfortably.' },
      { from: 'e5', to: 'd4', label: 'Accept the tension', annotation: 'Black clarifies the centre and tests White’s preparation.' },
    ],
  },
  {
    id: 'sicilian-defense',
    name: 'Sicilian Defense',
    family: 'Open Sicilian',
    description: 'An asymmetrical battle where both sides play for more than a draw.',
    difficulty: 'Club',
    color: '#b47a4e',
    steps: [
      { from: 'e2', to: 'e4', label: 'Take the centre', annotation: 'White claims space and opens the most active diagonals.' },
      { from: 'c7', to: 'c5', label: 'Fight asymmetrically', annotation: 'Challenge d4 from the flank and create an imbalanced game.' },
      { from: 'g1', to: 'f3', label: 'Develop naturally', annotation: 'Support d4 and prepare the central break.' },
      { from: 'd7', to: 'd6', label: 'Support the centre', annotation: 'Keep e5 available while making c5 harder to undermine.' },
      { from: 'd2', to: 'd4', label: 'Open the Sicilian', annotation: 'White refuses a quiet game and forces central exchanges.' },
      { from: 'c5', to: 'd4', label: 'Clarify the centre', annotation: 'Black trades the c-pawn for active piece play.' },
      { from: 'f3', to: 'd4', label: 'Recapture with tempo', annotation: 'The knight lands on a powerful central square.' },
      { from: 'g8', to: 'f6', label: 'Pressure e4', annotation: 'Develop while questioning White’s central foothold.' },
      { from: 'b1', to: 'c3', label: 'Support the knight', annotation: 'Add control over d5 and prepare to meet ...e5.' },
      { from: 'e7', to: 'e5', label: 'Claim a second centre', annotation: 'Black creates a principled Najdorf-style crossroads.' },
    ],
  },
  {
    id: 'queens-gambit',
    name: "Queen's Gambit",
    family: 'Queen’s Pawn',
    description: 'A classical offer of a pawn to establish a commanding centre.',
    difficulty: 'Advanced',
    color: '#8b78a9',
    steps: [
      { from: 'd2', to: 'd4', label: 'Own the centre', annotation: 'Take space and make the c-pawn’s future meaningful.' },
      { from: 'd7', to: 'd5', label: 'Contest d4', annotation: 'Black meets White’s ambition directly.' },
      { from: 'c2', to: 'c4', label: 'Offer the gambit', annotation: 'Tempt ...dxc4, or use the pressure to build a broad centre.' },
      { from: 'e7', to: 'e6', label: 'Decline with structure', annotation: 'The solid Queen’s Gambit Declined keeps d5 supported.' },
      { from: 'b1', to: 'c3', label: 'Develop into the centre', annotation: 'The knight supports d5 pressure and prepares e4.' },
      { from: 'g8', to: 'f6', label: 'Challenge d4', annotation: 'Black develops and keeps White from an effortless centre.' },
      { from: 'c1', to: 'g5', label: 'Pin the defender', annotation: 'The bishop makes ...Be7 and ...O-O more deliberate.' },
      { from: 'f8', to: 'e7', label: 'Break the pin', annotation: 'Develop and prepare to unpin the king safely.' },
      { from: 'e2', to: 'e3', label: 'Support the centre', annotation: 'Open the light bishop and make d4 harder to challenge.' },
      { from: 'e8', to: 'g8', label: 'Castle to safety', annotation: 'Black connects the rooks before the central position opens.' },
    ],
  },
];

export const dailyPuzzles: Puzzle[] = [
  {
    id: 'knight-fork',
    name: 'The double attack',
    theme: 'Fork',
    description: 'One knight move checks the king and wins a rook.',
    fen: '6k1/7r/8/3N4/8/8/8/6K1 w - - 0 1',
    side: 'w',
    answer: { from: 'd5', to: 'f6', label: 'Nf6+', annotation: 'The knight checks the king while attacking the rook on h7.' },
    answerLine: 'Nf6+',
    hint: 'Look for a knight check that attacks a second valuable piece.',
  },
  {
    id: 'bishop-pin',
    name: 'Clear the defender',
    theme: 'Pin',
    description: 'Use the bishop to remove the pinned rook with check.',
    fen: '6k1/5r2/8/8/2B5/8/8/6K1 w - - 0 1',
    side: 'w',
    answer: { from: 'c4', to: 'f7', label: 'Bxf7+', annotation: 'The bishop captures with check and wins the pinned defender.' },
    answerLine: 'Bxf7+',
    hint: 'The bishop on c4 has a direct diagonal toward the rook on f7.',
  },
  {
    id: 'rook-skewer',
    name: 'The long skewer',
    theme: 'Skewer',
    description: 'Check the king and collect the queen behind it.',
    fen: '4k3/8/8/8/8/8/4q3/4R1K1 w - - 0 1',
    side: 'w',
    answer: { from: 'e1', to: 'e2', label: 'Rxe2+', annotation: 'The rook takes the queen and opens a file check toward the king.' },
    answerLine: 'Rxe2+',
    hint: 'The king and queen are lined up on the e-file. Start with a forcing capture.',
  },
];