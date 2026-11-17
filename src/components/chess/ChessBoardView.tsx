import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Chess, Square } from 'chess.js';
import { ChessPieceIcon } from './ChessPieceIcon';

interface Props {
  game: Chess;
  selectedSquare: Square | null;
  legalTargets: Set<Square>;
  lastMove: { from: Square; to: Square } | null;
  onSquarePress: (square: Square) => void;
  boardSize: number;
  disabled?: boolean;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

// Classic Wood Colors (Beige & Brown)
const COLOR_LIGHT = '#EDE0C8'; // Warm beige / maple
const COLOR_DARK = '#B58863';  // Warm brown / walnut
const COLOR_FRAME = '#452A18'; // Deep mahogany/walnut frame

export function ChessBoardView({
  game,
  selectedSquare,
  legalTargets,
  lastMove,
  onSquarePress,
  boardSize,
  disabled = false,
}: Props) {
  const squareSize = Math.floor(boardSize / 8);
  const board = game.board();

  // Find King square if currently in check
  let checkKingSquare: Square | null = null;
  if (game.isCheck()) {
    const turn = game.turn();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k' && piece.color === turn) {
          checkKingSquare = `${FILES[c]}${RANKS[r]}` as Square;
        }
      }
    }
  }

  return (
    <View style={[styles.outerFrame, { width: boardSize + 16, height: boardSize + 16 }]}>
      <View style={[styles.boardContainer, { width: boardSize, height: boardSize }]}>
        {RANKS.map((rank, rankIndex) => (
          <View key={rank} style={styles.rankRow}>
            {FILES.map((file, fileIndex) => {
              const square = `${file}${rank}` as Square;
              const isLight = (rankIndex + fileIndex) % 2 === 0;
              const piece = board[rankIndex][fileIndex];

              const isSelected = selectedSquare === square;
              const isTarget = legalTargets.has(square);
              const isLastMove = lastMove?.from === square || lastMove?.to === square;
              const isKingInCheck = checkKingSquare === square;

              let squareBg = isLight ? COLOR_LIGHT : COLOR_DARK;
              if (isSelected) {
                squareBg = 'rgba(245, 158, 11, 0.65)'; // Nova Amber
              } else if (isKingInCheck) {
                squareBg = 'rgba(239, 68, 68, 0.7)'; // Red check
              } else if (isLastMove) {
                squareBg = isLight ? '#F2EB9D' : '#C79E53'; // Warm move highlight
              }

              return (
                <TouchableOpacity
                  key={square}
                  activeOpacity={0.8}
                  disabled={disabled}
                  onPress={() => onSquarePress(square)}
                  style={[
                    styles.square,
                    {
                      width: squareSize,
                      height: squareSize,
                      backgroundColor: squareBg,
                    },
                  ]}>
                  {/* Coordinate letters/numbers */}
                  {fileIndex === 0 && (
                    <Text
                      style={[
                        styles.coordinateRank,
                        { color: isLight ? '#8B5A2B' : '#E8D5B5' },
                      ]}>
                      {rank}
                    </Text>
                  )}
                  {rankIndex === 7 && (
                    <Text
                      style={[
                        styles.coordinateFile,
                        { color: isLight ? '#8B5A2B' : '#E8D5B5' },
                      ]}>
                      {file}
                    </Text>
                  )}

                  {/* Chess Piece */}
                  {piece && (
                    <ChessPieceIcon
                      type={piece.type}
                      color={piece.color}
                      size={squareSize * 0.9}
                    />
                  )}

                  {/* Move Target Dot (empty square) */}
                  {isTarget && !piece && (
                    <View style={styles.targetDot} />
                  )}

                  {/* Capture Ring (occupied square) */}
                  {isTarget && piece && (
                    <View style={styles.captureRing} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerFrame: {
    backgroundColor: COLOR_FRAME,
    padding: 8,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#693E1D',
  },
  boardContainer: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  rankRow: {
    flexDirection: 'row',
  },
  square: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  coordinateRank: {
    position: 'absolute',
    top: 2,
    left: 3,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    opacity: 0.85,
  },
  coordinateFile: {
    position: 'absolute',
    bottom: 1,
    right: 3,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    opacity: 0.85,
  },
  targetDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(245, 158, 11, 0.85)',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  captureRing: {
    position: 'absolute',
    width: '90%',
    height: '90%',
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
});
