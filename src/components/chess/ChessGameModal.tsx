import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Chess, Square, Move } from 'chess.js';

import { Character } from '@/types/chat';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  ChessDifficulty,
  getNovaMove,
  getNovaReaction,
} from '@/services/chessEngine';
import { getNovaStageImage } from '@/constants/characters';
import { ChessBoardView } from './ChessBoardView';
import { ChessPieceIcon } from './ChessPieceIcon';

interface Props {
  visible: boolean;
  character: Character;
  currentBarrier: number;
  initialDifficulty: ChessDifficulty;
  onClose: () => void;
  onGameFinish?: (result: 'user_win' | 'nova_win' | 'draw') => void;
}

export function ChessGameModal({
  visible,
  character,
  currentBarrier,
  initialDifficulty,
  onClose,
  onGameFinish,
}: Props) {
  const theme = useTheme();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const [difficulty, setDifficulty] = useState<ChessDifficulty>(initialDifficulty);
  const [game, setGame] = useState<Chess>(() => new Chess());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [isNovaThinking, setIsNovaThinking] = useState(false);
  const [novaDialogue, setNovaDialogue] = useState<string>(() =>
    initialDifficulty === 'easy'
      ? '*sorri descontraída* Sua vez! Vamos jogar relaxados, sem pressão.'
      : initialDifficulty === 'medium'
      ? '*arruma as peças pretas* As brancas começam! Vamos ver a sua abertura.'
      : '*olhar focado com postura de grande mestre* Pode fazer seu lance. Estou pronta.'
  );
  const [gameOverResult, setGameOverResult] = useState<'user' | 'nova' | 'draw' | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup pending timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Responsive Board Size (max 390px, fits mobile screens nicely)
  const boardSize = useMemo(() => {
    const horizontalMargin = 32;
    const verticalLimit = windowHeight * 0.48;
    return Math.floor(Math.min(windowWidth - horizontalMargin, 390, verticalLimit));
  }, [windowWidth, windowHeight]);

  // Legal targets for currently selected square
  const legalTargets = useMemo(() => {
    const targets = new Set<Square>();
    if (!selectedSquare || game.turn() !== 'w' || isNovaThinking) return targets;

    const moves = game.moves({ square: selectedSquare, verbose: true });
    for (const m of moves) {
      targets.add(m.to);
    }
    return targets;
  }, [selectedSquare, game, isNovaThinking]);

  // Track captured pieces
  const capturedPieces = useMemo(() => {
    const userCaptured: { type: Move['piece']; id: string }[] = []; // Black pieces captured by User
    const novaCaptured: { type: Move['piece']; id: string }[] = []; // White pieces captured by Nova

    const history = game.history({ verbose: true });
    history.forEach((m, idx) => {
      if (m.captured) {
        if (m.color === 'w') {
          userCaptured.push({ type: m.captured, id: `${m.captured}-${idx}` });
        } else {
          novaCaptured.push({ type: m.captured, id: `${m.captured}-${idx}` });
        }
      }
    });

    return { userCaptured, novaCaptured };
  }, [game]);

  // Nova AI move trigger
  const triggerNovaMove = useCallback((currentGame: Chess) => {
    setIsNovaThinking(true);
    setNovaDialogue('*analisando o tabuleiro com a mão no queixo...*');

    timerRef.current = setTimeout(() => {
      const move = getNovaMove(currentGame, difficulty);
      if (move) {
        try {
          const executed = currentGame.move({
            from: move.from,
            to: move.to,
            promotion: move.promotion || 'q',
          });

          setLastMove({ from: move.from, to: move.to });
          setGame(new Chess(currentGame.fen()));

          // Check if Nova won
          if (currentGame.isCheckmate()) {
            setGameOverResult('nova');
            setNovaDialogue(
              currentBarrier >= 65
                ? '*sorri triunfante* XEQUE-MATE! Falei que você não ia me vencer!'
                : '*dá pulinhos na cadeira* XEQUE-MATE! O apê tem uma nova rainha do xadrez!'
            );
            onGameFinish?.('nova_win');
          } else if (currentGame.isDraw()) {
            setGameOverResult('draw');
            setNovaDialogue('*solta o ar* Empate! Foi uma partida bem disputada, admito.');
            onGameFinish?.('draw');
          } else {
            // Nova's in-game reaction
            const reaction = getNovaReaction(
              currentGame,
              { player: 'nova', san: executed.san, captured: executed.captured },
              currentBarrier
            );
            if (reaction) {
              setNovaDialogue(reaction);
            } else {
              setNovaDialogue('Sua vez, roommate! O que vai fazer agora?');
            }
          }
        } catch (err) {
          console.warn('Nova move error:', err);
        }
      }
      setIsNovaThinking(false);
    }, 750);
  }, [difficulty, currentBarrier, onGameFinish]);

  // Handle Square Selection / Movement
  const handleSquarePress = (square: Square) => {
    if (isNovaThinking || gameOverResult || game.turn() !== 'w') return;

    const pieceOnSquare = game.get(square);

    // If tapping another of the user's white pieces, switch selection
    if (pieceOnSquare && pieceOnSquare.color === 'w') {
      setSelectedSquare(square);
      return;
    }

    // If a piece is already selected and user taps a valid target
    if (selectedSquare && legalTargets.has(square)) {
      try {
        const executed = game.move({
          from: selectedSquare,
          to: square,
          promotion: 'q', // auto queen promotion
        });

        const newGame = new Chess(game.fen());
        setGame(newGame);
        setLastMove({ from: selectedSquare, to: square });
        setSelectedSquare(null);

        // Check user win
        if (newGame.isCheckmate()) {
          setGameOverResult('user');
          setNovaDialogue(
            currentBarrier >= 65
              ? '*olha perplexa pro rei caído* Não acredito... você me deu xeque-mate?! Ok, parabéns.'
              : '*boquiaberta, depois abre um sorriso radiante* Uau! Xeque-mate lindo! Você joga muito bem!'
          );
          onGameFinish?.('user_win');
          return;
        }

        if (newGame.isDraw()) {
          setGameOverResult('draw');
          setNovaDialogue('Empate! Ninguém levou o ponto hoje.');
          onGameFinish?.('draw');
          return;
        }

        // Check if user delivered check or captured
        const userReaction = getNovaReaction(
          newGame,
          { player: 'user', san: executed.san, captured: executed.captured },
          currentBarrier
        );
        if (userReaction) {
          setNovaDialogue(userReaction);
        }

        // Trigger Nova's reply
        triggerNovaMove(newGame);
      } catch (err) {
        console.warn('User move error:', err);
      }
    } else {
      setSelectedSquare(null);
    }
  };

  const handleRestart = () => {
    Alert.alert('Reiniciar Partida', 'Deseja recomeçar o jogo do início?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Reiniciar',
        style: 'destructive',
        onPress: () => {
          if (timerRef.current) clearTimeout(timerRef.current);
          const newGame = new Chess();
          setGame(newGame);
          setSelectedSquare(null);
          setLastMove(null);
          setIsNovaThinking(false);
          setGameOverResult(null);
          setNovaDialogue('Tabuleiro resetado! As brancas começam. Boa sorte!');
        },
      },
    ]);
  };

  const avatarSource =
    character.id === 'nova'
      ? getNovaStageImage(currentBarrier)
      : character.avatarImage;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header Bar */}
        <View style={[styles.headerBar, { borderBottomColor: theme.backgroundElement }]}>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.headerTitleGroup}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Partida de Xadrez</Text>
            <Text style={[styles.headerSubtitle, { color: character.accentColor }]}>
              Modo {difficulty.toUpperCase()} • Nova vs Você
            </Text>
          </View>

          <View style={styles.headerRightActions}>
            <TouchableOpacity
              onPress={handleRestart}
              style={[styles.headerIconBtn, { backgroundColor: theme.backgroundElement }]}>
              <Ionicons name="refresh" size={18} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Top Player (Nova - Black) */}
          <View style={[styles.playerCard, { backgroundColor: theme.backgroundElement }]}>
            <View style={styles.playerInfoRow}>
              <View style={[styles.avatarBadge, { borderColor: character.accentColor }]}>
                {avatarSource ? (
                  <Image source={avatarSource} style={styles.avatarImg} contentFit="cover" />
                ) : (
                  <Text style={styles.avatarEmoji}>{character.avatar}</Text>
                )}
              </View>

              <View style={styles.playerTextCol}>
                <View style={styles.playerNameRow}>
                  <Text style={[styles.playerName, { color: theme.text }]}>
                    {character.name} (Pretas)
                  </Text>
                  {isNovaThinking && (
                    <View style={styles.thinkingBadge}>
                      <Ionicons name="time" size={12} color="#F59E0B" />
                      <Text style={styles.thinkingText}>Pensando...</Text>
                    </View>
                  )}
                </View>

                {/* Captured White Pieces by Nova */}
                <View style={styles.capturedRow}>
                  {capturedPieces.novaCaptured.map((p) => (
                    <ChessPieceIcon key={p.id} type={p.type} color="w" size={16} />
                  ))}
                  {capturedPieces.novaCaptured.length === 0 && (
                    <Text style={[styles.emptyCapturedText, { color: theme.textSecondary }]}>
                      Nenhuma peça capturada
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Nova Speech Bubble */}
            <View style={[styles.speechBubble, { backgroundColor: theme.backgroundSelected }]}>
              <Ionicons
                name="chatbubble-ellipses"
                size={14}
                color={character.accentColor}
                style={{ marginTop: 2 }}
              />
              <Text style={[styles.speechText, { color: theme.text }]}>
                {novaDialogue}
              </Text>
            </View>
          </View>

          {/* Wooden Chessboard */}
          <View style={styles.boardWrapper}>
            <ChessBoardView
              game={game}
              selectedSquare={selectedSquare}
              legalTargets={legalTargets}
              lastMove={lastMove}
              onSquarePress={handleSquarePress}
              boardSize={boardSize}
              disabled={isNovaThinking || Boolean(gameOverResult)}
            />
          </View>

          {/* Bottom Player (User - White) */}
          <View style={[styles.playerCard, { backgroundColor: theme.backgroundElement }]}>
            <View style={styles.playerInfoRow}>
              <View style={[styles.avatarBadgeUser, { backgroundColor: '#6366F1' }]}>
                <Ionicons name="person" size={20} color="#FFFFFF" />
              </View>

              <View style={styles.playerTextCol}>
                <View style={styles.playerNameRow}>
                  <Text style={[styles.playerName, { color: theme.text }]}>Você (Brancas)</Text>
                  {game.turn() === 'w' && !gameOverResult && (
                    <View style={[styles.turnBadge, { backgroundColor: '#10B981' }]}>
                      <Text style={styles.turnBadgeText}>SUA VEZ</Text>
                    </View>
                  )}
                </View>

                {/* Captured Black Pieces by User */}
                <View style={styles.capturedRow}>
                  {capturedPieces.userCaptured.map((p) => (
                    <ChessPieceIcon key={p.id} type={p.type} color="b" size={16} />
                  ))}
                  {capturedPieces.userCaptured.length === 0 && (
                    <Text style={[styles.emptyCapturedText, { color: theme.textSecondary }]}>
                      Nenhuma peça capturada
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Difficulty Selector Bar */}
          <View style={styles.difficultyBar}>
            {(['easy', 'medium', 'hard'] as ChessDifficulty[]).map((d) => (
              <TouchableOpacity
                key={d}
                onPress={() => {
                  setDifficulty(d);
                  handleRestart();
                }}
                style={[
                  styles.diffPill,
                  difficulty === d
                    ? [styles.diffPillActive, { backgroundColor: character.accentColor }]
                    : { backgroundColor: theme.backgroundElement },
                ]}>
                <Text
                  style={[
                    styles.diffPillText,
                    { color: difficulty === d ? '#FFFFFF' : theme.textSecondary },
                  ]}>
                  {d === 'easy' ? 'Fácil' : d === 'medium' ? 'Médio' : 'Difícil'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Game Over Banner Overlay */}
        {gameOverResult && (
          <View style={styles.gameOverOverlay}>
            <View style={[styles.gameOverCard, { backgroundColor: theme.backgroundElement }]}>
              <Ionicons
                name={
                  gameOverResult === 'user'
                    ? 'trophy'
                    : gameOverResult === 'nova'
                    ? 'skull'
                    : 'flag'
                }
                size={44}
                color={
                  gameOverResult === 'user'
                    ? '#F59E0B'
                    : gameOverResult === 'nova'
                    ? '#EF4444'
                    : '#6366F1'
                }
              />
              <Text style={[styles.gameOverTitle, { color: theme.text }]}>
                {gameOverResult === 'user'
                  ? 'Vitória Sua!'
                  : gameOverResult === 'nova'
                  ? 'Vitória da Nova!'
                  : 'Empate!'}
              </Text>
              <Text style={[styles.gameOverDialogue, { color: theme.textSecondary }]}>
                {novaDialogue}
              </Text>

              <View style={styles.gameOverActions}>
                <TouchableOpacity
                  onPress={onClose}
                  style={[styles.gameOverBtn, { borderColor: theme.backgroundSelected }]}>
                  <Text style={[styles.gameOverBtnText, { color: theme.text }]}>Voltar ao Chat</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    const newGame = new Chess();
                    setGame(newGame);
                    setSelectedSquare(null);
                    setLastMove(null);
                    setGameOverResult(null);
                    setNovaDialogue('Revanche iniciada! Pode jogar.');
                  }}
                  style={[styles.gameOverBtnPrimary, { backgroundColor: character.accentColor }]}>
                  <Text style={styles.gameOverBtnPrimaryText}>Jogar Novamente</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: Spacing.one,
  },
  headerTitleGroup: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
    alignItems: 'center',
  },
  playerCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  playerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  avatarBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1E24',
  },
  avatarBadgeUser: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarEmoji: {
    fontSize: 22,
  },
  playerTextCol: {
    flex: 1,
    gap: 3,
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerName: {
    fontSize: 15,
    fontWeight: '700',
  },
  thinkingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  thinkingText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  turnBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  turnBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  capturedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 18,
  },
  emptyCapturedText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  speechBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 12,
  },
  speechText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  boardWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.one,
  },
  difficultyBar: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
    maxWidth: 420,
    width: '100%',
  },
  diffPill: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diffPillActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  diffPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  gameOverOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
    zIndex: 10,
  },
  gameOverCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  gameOverTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  gameOverDialogue: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  gameOverActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    width: '100%',
    marginTop: Spacing.two,
  },
  gameOverBtn: {
    flex: 1,
    paddingVertical: Spacing.three,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameOverBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  gameOverBtnPrimary: {
    flex: 1.2,
    paddingVertical: Spacing.three,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameOverBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
