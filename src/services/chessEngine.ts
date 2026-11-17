import { Chess, Move, Square } from 'chess.js';

export type ChessDifficulty = 'easy' | 'medium' | 'hard';

// Piece base values (centipawns)
const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Piece-Square Tables (from White's perspective, row 0 = rank 8, row 7 = rank 1)
const PAWN_TABLE = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5, 5, 10, 25, 25, 10, 5, 5],
  [0, 0, 0, 20, 20, 0, 0, 0],
  [5, -5, -10, 0, 0, -10, -5, 5],
  [5, 10, 10, -20, -20, 10, 10, 5],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

const KNIGHT_TABLE = [
  [-50, -40, -30, -30, -30, -30, -40, -50],
  [-40, -20, 0, 0, 0, 0, -20, -40],
  [-30, 0, 10, 15, 15, 10, 0, -30],
  [-30, 5, 15, 20, 20, 15, 5, -30],
  [-30, 0, 15, 20, 20, 15, 0, -30],
  [-30, 5, 10, 15, 15, 10, 5, -30],
  [-40, -20, 0, 5, 5, 0, -20, -40],
  [-50, -40, -30, -30, -30, -30, -40, -50],
];

const BISHOP_TABLE = [
  [-20, -10, -10, -10, -10, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 10, 10, 5, 0, -10],
  [-10, 5, 5, 10, 10, 5, 5, -10],
  [-10, 0, 10, 10, 10, 10, 0, -10],
  [-10, 10, 10, 10, 10, 10, 10, -10],
  [-10, 5, 0, 0, 0, 0, 5, -10],
  [-20, -10, -10, -10, -10, -10, -10, -20],
];

const ROOK_TABLE = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [5, 10, 10, 10, 10, 10, 10, 5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [0, 0, 0, 5, 5, 0, 0, 0],
];

const QUEEN_TABLE = [
  [-20, -10, -10, -5, -5, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 5, 5, 5, 0, -10],
  [-5, 0, 5, 5, 5, 5, 0, -5],
  [0, 0, 5, 5, 5, 5, 0, -5],
  [-10, 5, 5, 5, 5, 5, 0, -10],
  [-10, 0, 5, 0, 0, 0, 0, -10],
  [-20, -10, -10, -5, -5, -10, -10, -20],
];

const KING_TABLE = [
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-20, -30, -30, -40, -40, -30, -30, -20],
  [-10, -20, -20, -20, -20, -20, -20, -10],
  [20, 20, 0, 0, 0, 0, 20, 20],
  [20, 30, 10, 0, 0, 10, 30, 20],
];

function getPSTValue(pieceType: string, row: number, col: number, isWhite: boolean): number {
  const r = isWhite ? row : 7 - row;
  const c = col;
  switch (pieceType) {
    case 'p':
      return PAWN_TABLE[r][c];
    case 'n':
      return KNIGHT_TABLE[r][c];
    case 'b':
      return BISHOP_TABLE[r][c];
    case 'r':
      return ROOK_TABLE[r][c];
    case 'q':
      return QUEEN_TABLE[r][c];
    case 'k':
      return KING_TABLE[r][c];
    default:
      return 0;
  }
}

export function evaluatePosition(game: Chess): number {
  if (game.isCheckmate()) {
    // If it's White's turn and checkmate, Black won (-Infinity). If Black's turn, White won (+Infinity)
    return game.turn() === 'w' ? -99999 : 99999;
  }
  if (game.isDraw()) {
    return 0;
  }

  let whiteScore = 0;
  let blackScore = 0;
  const board = game.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      const isWhite = piece.color === 'w';
      const val = (PIECE_VALUES[piece.type] || 0) + getPSTValue(piece.type, r, c, isWhite);
      if (isWhite) {
        whiteScore += val;
      } else {
        blackScore += val;
      }
    }
  }

  // Positive score favors White, negative favors Black
  return whiteScore - blackScore;
}

// Alpha-Beta Minimax search
function minimax(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): number {
  if (depth === 0 || game.isGameOver()) {
    return evaluatePosition(game);
  }

  const moves = game.moves({ verbose: true });
  // Move ordering: evaluate captures and checks first to trigger alpha-beta pruning earlier
  moves.sort((a, b) => {
    const scoreA = (b.captured ? 10 : 0) + (a.san.includes('+') ? 5 : 0);
    const scoreB = (a.captured ? 10 : 0) + (b.san.includes('+') ? 5 : 0);
    return scoreA - scoreB;
  });

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const m of moves) {
      game.move(m);
      const ev = minimax(game, depth - 1, alpha, beta, false);
      game.undo();
      maxEval = Math.max(maxEval, ev);
      alpha = Math.max(alpha, ev);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const m of moves) {
      game.move(m);
      const ev = minimax(game, depth - 1, alpha, beta, true);
      game.undo();
      minEval = Math.min(minEval, ev);
      beta = Math.min(beta, ev);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

/**
 * Returns the best move for Nova (playing Black).
 */
export function getNovaMove(
  game: Chess,
  difficulty: ChessDifficulty
): { from: Square; to: Square; promotion?: string } | null {
  const legalMoves = game.moves({ verbose: true });
  if (legalMoves.length === 0) return null;

  // Easy mode: 40% random move, 60% 1-ply basic evaluation
  if (difficulty === 'easy') {
    if (Math.random() < 0.45) {
      const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
      return {
        from: randomMove.from,
        to: randomMove.to,
        promotion: randomMove.promotion,
      };
    }
  }

  // Search depth based on difficulty
  // Nova is Black -> minimizing score
  const depth = difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1;

  // Move ordering for root
  legalMoves.sort((a, b) => (b.captured ? 10 : 0) - (a.captured ? 10 : 0));

  let bestMove: Move = legalMoves[0];
  let bestScore = Infinity;

  for (const m of legalMoves) {
    game.move(m);
    const score = minimax(game, depth - 1, -Infinity, Infinity, true);
    game.undo();

    // Adding minor jitter in easy/medium to vary openings
    const jitter = difficulty === 'easy' ? (Math.random() - 0.5) * 30 : 0;
    const finalScore = score + jitter;

    if (finalScore < bestScore) {
      bestScore = finalScore;
      bestMove = m;
    }
  }

  return {
    from: bestMove.from,
    to: bestMove.to,
    promotion: bestMove.promotion || 'q',
  };
}

/**
 * Nova's response to an invitation to play chess, tailored to intimacy / barriers.
 */
export function getNovaInvitationDialogue(barrier: number): {
  headline: string;
  speech: string;
} {
  if (barrier >= 65) {
    return {
      headline: 'Xadrez? Aceito o desafio.',
      speech:
        '*cruza os braços com um sorriso de canto provocador* Xadrez? Acha mesmo que tem capacidade de me vencer? Não vai ficar emburrado depois se eu levar todas as suas peças embora... Escolhe a dificuldade logo antes que eu mude de ideia!',
    };
  }
  if (barrier >= 35) {
    return {
      headline: 'É claro! Prepara o cérebro!',
      speech:
        '*olhos âmbar brilhando, puxa a cadeira animada e bate palminhas* É claro! Ninguém me desafia no apê e sai ileso! Tava doidinha pra testar uma estratégia nova. Não vou pegar leve com você só porque somos roommates, hein!',
    };
  }
  return {
    headline: 'Sempre! Adoro jogar com você.',
    speech:
      '*sorri de um jeito carinhoso e coloca o tabuleiro de madeira no centro da mesa* Sempre! Uma partidinha relaxante no apê depois de um dia puxado na universidade é tudo que eu queria... Quem perder hoje prepara o café da manhã, combinado?',
  };
}

/**
 * Spontaneous reactions during the game
 */
export function getNovaReaction(
  game: Chess,
  lastMove: { player: 'user' | 'nova'; san: string; captured?: string },
  barrier: number
): string | null {
  if (game.isCheckmate()) {
    if (lastMove.player === 'nova') {
      return barrier >= 65
        ? '*sorri vitoriosa* Xeque-mate! Eu não disse? Mais sorte na próxima rodada!'
        : '*dá um pulinho na cadeira comemorando* XEQUE-MATE! Te avisei! O apê tem uma nova grande mestre!';
    } else {
      return barrier >= 65
        ? '*arregala os olhos e suspira* Tá... você me pegou. Admito que jogou bem.'
        : '*fica boquiaberta, depois solta uma gargalhada genuína* Uau, você me deu um xeque-mate lindo! Mandou muito bem, roommate!';
    }
  }

  if (game.isCheck()) {
    if (lastMove.player === 'user') {
      return barrier >= 65
        ? '*morde o lábio levemente irritada* Xeque?! Droga... não vi essa vindo.'
        : '*toma um susto de brincadeira e apoia o queixo na mão* Opa, xeque?! Achei que éramos amigos!';
    } else {
      return barrier >= 65
        ? '*sorri de lado* Cuidado com o seu rei... Xeque!'
        : '*olhos âmbar cintilando com travessura* Xeque! E agora, o que você vai fazer?';
    }
  }

  if (lastMove.captured) {
    if (lastMove.player === 'nova') {
      return barrier >= 65
        ? '*recolhe sua peça* Essa aqui já era pro seu lado.'
        : '*sorri sapeca guardando a peça* Menos uma pra você se preocupar!';
    } else {
      return barrier >= 65
        ? '*resmunga baixinho* Ei! Minha peça não! Isso foi golpe baixo...'
        : '*faz bico dramático* Minha peça favorita! Você vai pagar por essa audácia!';
    }
  }

  return null;
}
