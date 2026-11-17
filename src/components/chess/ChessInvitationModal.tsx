import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Character } from '@/types/chat';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ChessDifficulty, getNovaInvitationDialogue } from '@/services/chessEngine';
import { getNovaStageImage } from '@/constants/characters';

interface Props {
  visible: boolean;
  character: Character;
  currentBarrier: number;
  onClose: () => void;
  onStartGame: (difficulty: ChessDifficulty) => void;
}

export function ChessInvitationModal({
  visible,
  character,
  currentBarrier,
  onClose,
  onStartGame,
}: Props) {
  const theme = useTheme();
  const [selectedDifficulty, setSelectedDifficulty] = useState<ChessDifficulty>('medium');

  const dialogue = getNovaInvitationDialogue(currentBarrier);
  const avatarSource =
    character.id === 'nova'
      ? getNovaStageImage(currentBarrier)
      : character.avatarImage;

  const handleStart = () => {
    onStartGame(selectedDifficulty);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.dismissOverlay}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={[styles.dialogCard, { backgroundColor: theme.backgroundElement }]}>
          {/* Top Badge & Close Button */}
          <View style={styles.headerRow}>
            <View style={styles.badgeRow}>
              <Ionicons name="game-controller" size={16} color={character.accentColor} />
              <Text style={[styles.badgeText, { color: character.accentColor }]}>
                DESAFIO DE XADREZ • ROOMMATE
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.backgroundSelected }]}>
              <Ionicons name="close" size={18} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Nova Avatar & Speech Box */}
          <View style={styles.novaSpeechRow}>
            <View style={[styles.avatarBorder, { borderColor: character.accentColor }]}>
              {avatarSource ? (
                <Image source={avatarSource} style={styles.avatarImg} contentFit="cover" />
              ) : (
                <Text style={styles.avatarEmoji}>{character.avatar}</Text>
              )}
            </View>

            <View style={styles.speechBubble}>
              <Text style={[styles.speechHeadline, { color: character.accentColor }]}>
                {dialogue.headline}
              </Text>
              <Text style={[styles.speechText, { color: theme.text }]}>
                {dialogue.speech}
              </Text>
            </View>
          </View>

          {/* Difficulty Selector */}
          <View style={styles.difficultySection}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              ESCOLHA O NÍVEL DA NOVA:
            </Text>

            <View style={styles.difficultyOptions}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedDifficulty('easy')}
                style={[
                  styles.difficultyBtn,
                  selectedDifficulty === 'easy'
                    ? [styles.difficultyBtnActive, { borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.15)' }]
                    : { borderColor: theme.backgroundSelected },
                ]}>
                <Ionicons
                  name="happy-outline"
                  size={20}
                  color={selectedDifficulty === 'easy' ? '#10B981' : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.difficultyLabel,
                    { color: selectedDifficulty === 'easy' ? '#10B981' : theme.text },
                  ]}>
                  Fácil
                </Text>
                <Text style={[styles.difficultyDesc, { color: theme.textSecondary }]}>
                  Casual & Divertido
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedDifficulty('medium')}
                style={[
                  styles.difficultyBtn,
                  selectedDifficulty === 'medium'
                    ? [styles.difficultyBtnActive, { borderColor: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.15)' }]
                    : { borderColor: theme.backgroundSelected },
                ]}>
                <Ionicons
                  name="shield-outline"
                  size={20}
                  color={selectedDifficulty === 'medium' ? '#F59E0B' : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.difficultyLabel,
                    { color: selectedDifficulty === 'medium' ? '#F59E0B' : theme.text },
                  ]}>
                  Médio
                </Text>
                <Text style={[styles.difficultyDesc, { color: theme.textSecondary }]}>
                  Equilibrado
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedDifficulty('hard')}
                style={[
                  styles.difficultyBtn,
                  selectedDifficulty === 'hard'
                    ? [styles.difficultyBtnActive, { borderColor: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.15)' }]
                    : { borderColor: theme.backgroundSelected },
                ]}>
                <Ionicons
                  name="flame"
                  size={20}
                  color={selectedDifficulty === 'hard' ? '#EF4444' : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.difficultyLabel,
                    { color: selectedDifficulty === 'hard' ? '#EF4444' : theme.text },
                  ]}>
                  Difícil
                </Text>
                <Text style={[styles.difficultyDesc, { color: theme.textSecondary }]}>
                  Grande Mestre
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.cancelBtn, { borderColor: theme.backgroundSelected }]}>
              <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>
                Agora Não
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleStart}
              style={[styles.startBtn, { backgroundColor: character.accentColor }]}>
              <Ionicons name="play" size={18} color="#FFFFFF" />
              <Text style={styles.startBtnText}>Começar Partida</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  dismissOverlay: {
    ...StyleSheet.absoluteFill,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 24,
    padding: Spacing.four,
    gap: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  novaSpeechRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  avatarBorder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1E24',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarEmoji: {
    fontSize: 26,
  },
  speechBubble: {
    flex: 1,
    gap: 4,
  },
  speechHeadline: {
    fontSize: 16,
    fontWeight: '800',
  },
  speechText: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  difficultySection: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  difficultyOptions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  difficultyBtn: {
    flex: 1,
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.two,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 4,
  },
  difficultyBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  difficultyLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  difficultyDesc: {
    fontSize: 10,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  startBtn: {
    flex: 1.5,
    flexDirection: 'row',
    paddingVertical: Spacing.three,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
