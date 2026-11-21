import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Character } from '@/types/chat';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useChat } from '@/context/ChatContext';
import { UsageModal } from './UsageModal';
import { SaveSlotsModal } from './SaveSlotsModal';
import { MemoryDiaryModal } from './MemoryDiaryModal';
import { GalleryModal } from '../gallery/GalleryModal';
import {
  getMarinaStageImage,
  getMarinaStageInfo,
  getNovaStageImage,
  getNovaStageInfo,
} from '@/constants/characters';

interface Props {
  character: Character;
  onClearChat: () => void;
  onOpenRoster?: () => void;
  onBack?: () => void;
  onOpenChess?: () => void;
}

export function CharacterHeader({
  character,
  onClearChat,
  onOpenRoster,
  onBack,
  onOpenChess,
}: Props) {
  const router = useRouter();
  const theme = useTheme();
  const { currentBarrier, isTextOnlyMode, unsummarizedCount } = useChat();
  const [usageModalVisible, setUsageModalVisible] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [diaryModalVisible, setDiaryModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [galleryModalVisible, setGalleryModalVisible] = useState(false);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/explore');
    }
  };

  const handleClearPress = () => {
    Alert.alert(
      'Nova Conversa',
      `Deseja iniciar uma nova conversa com ${character.name}? Seu progresso atual continua salvo com segurança em um slot e você poderá voltar a ele a qualquer momento.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Começar Nova Conversa', onPress: onClearChat },
      ]
    );
  };

  const getStage = (barrier: number, charId?: string) => {
    if (charId === 'nova') {
      if (barrier >= 65) {
        return {
          level: 1,
          title: 'Roommate Espinhosa',
          color: '#F59E0B',
          icon: 'shield' as const,
          description: 'Territorial, regras rígidas e desconfiada',
        };
      }
      if (barrier >= 35) {
        return {
          level: 2,
          title: 'Roommate Energética',
          color: '#F59E0B',
          icon: 'sparkles' as const,
          description: 'Brincadeiras, cúmplice no apê e super incentivadora',
        };
      }
      if (barrier >= 10) {
        return {
          level: 3,
          title: 'Cofre Profundo',
          color: '#EC4899',
          icon: 'heart-outline' as const,
          description: 'Sensível, medo de abandono e vulnerabilidade',
        };
      }
      return {
        level: 4,
        title: 'Conexão Total',
        color: '#8B5CF6',
        icon: 'heart' as const,
        description: 'O apê é um lar, confiança e carinho puro',
      };
    }

    if (barrier > 80) {
      return {
        level: 1,
        title: 'Hostil & Cética',
        color: '#EF4444',
        icon: 'shield' as const,
        description: 'Defesas quase impenetráveis',
      };
    }
    if (barrier > 50) {
      return {
        level: 2,
        title: 'Observadora & Curiosa',
        color: '#F59E0B',
        icon: 'eye-outline' as const,
        description: 'Pequenos gestos de abertura',
      };
    }
    if (barrier > 30) {
      return {
        level: 3,
        title: 'Receptiva & Conectada',
        color: '#8B5CF6',
        icon: 'key-outline' as const,
        description: 'Compartilha fragmentos do passado',
      };
    }
    if (barrier > 10) {
      return {
        level: 4,
        title: 'Desarmada & Íntima',
        color: '#10B981',
        icon: 'heart-outline' as const,
        description: 'Vulnerabilidade real e afeto sincero',
      };
    }
    return {
      level: 5,
      title: 'Vínculo Puro & Entrega',
      color: '#EC4899',
      icon: 'heart' as const,
      description: 'Conexão profunda, afeto e cumplicidade total',
    };
  };

  const hasMeter =
    character.hasBarrierMeter ||
    character.initialBarrier !== undefined ||
    currentBarrier !== null;
  const barrier = currentBarrier ?? character.initialBarrier ?? 98;
  const intimacy = Math.max(0, Math.min(100, 100 - barrier));
  const stage = getStage(barrier, character.id);

  const isMarina = character.id === 'marina' || character.id === 'helena';
  const isNova = character.id === 'nova';
  const currentAvatar = isMarina
    ? getMarinaStageImage(barrier)
    : isNova
    ? getNovaStageImage(barrier)
    : character.avatarImage;
  const stageInfo = isMarina
    ? getMarinaStageInfo(barrier)
    : isNova
    ? getNovaStageInfo(barrier)
    : null;
  const hasImage = Boolean(currentAvatar);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background, borderBottomColor: theme.backgroundElement },
      ]}>
      {/* Top Profile Section */}
      <View style={styles.topRow}>
        <View style={styles.leftNavGroup}>
          <TouchableOpacity
            onPress={handleBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.backButton}
            accessibilityLabel="Voltar"
            activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileSection}
            onPress={onOpenRoster}
            activeOpacity={0.8}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={!isTextOnlyMode && hasImage ? () => setImageModalVisible(true) : onOpenRoster}
              style={[
                styles.avatarBadge,
                { borderColor: character.accentColor, backgroundColor: theme.backgroundElement },
              ]}>
              {!isTextOnlyMode && currentAvatar ? (
                <Image
                  source={currentAvatar}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
              ) : (
                <Text style={styles.avatarEmoji}>{character.avatar}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.infoCol}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, { color: theme.text }]}>{character.name}</Text>
                {character.isCustom && (
                  <View style={[styles.customBadge, { backgroundColor: character.accentColor }]}>
                    <Text style={styles.customBadgeText}>Custom</Text>
                  </View>
                )}
              </View>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    isTextOnlyMode && { backgroundColor: '#6366F1' },
                  ]}
                />
                <Text
                  style={[styles.statusText, { color: theme.textSecondary }]}
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  {isTextOnlyMode
                    ? 'Always with you • Modo Texto Ativo'
                    : 'Always with you • Roleplay Active'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.actions}>
          {onOpenChess && (
            <TouchableOpacity
              onPress={onOpenChess}
              style={[styles.iconButton, { backgroundColor: theme.backgroundElement }]}
              accessibilityLabel="Desafiar para partida de xadrez">
              <MaterialCommunityIcons name="chess-knight" size={19} color={character.accentColor} />
            </TouchableOpacity>
          )}

          {hasImage && (
            <TouchableOpacity
              onPress={() => setGalleryModalVisible(true)}
              style={[styles.iconButton, { backgroundColor: theme.backgroundElement }]}
              accessibilityLabel="Abrir álbum de memórias e galeria de fotos">
              <Ionicons name="images-outline" size={17} color={character.accentColor || theme.text} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => setDiaryModalVisible(true)}
            style={[styles.iconButton, { backgroundColor: theme.backgroundElement }]}
            accessibilityLabel="Abrir diário de lembranças e fatos conhecidos">
            <Ionicons name="book-outline" size={17} color={character.accentColor} />
            {unsummarizedCount > 0 && (
              <View style={[styles.headerUnsumDot, { backgroundColor: character.accentColor || '#8B5CF6' }]} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setUsageModalVisible(true)}
            style={[styles.iconButton, { backgroundColor: theme.backgroundElement }]}
            accessibilityLabel="Configurações e opções da conversa">
            <Ionicons name="settings-outline" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Intimacy & Barrier Meter UI */}
      {hasMeter && (
        <View style={[styles.meterCard, { backgroundColor: theme.backgroundElement }]}>
          <View style={styles.meterHeader}>
            <View style={styles.meterLeftCol}>
              <View style={styles.stageBadge}>
                <Ionicons name={stage.icon} size={13} color={stage.color} />
                <Text style={[styles.stageBadgeText, { color: stage.color }]}>
                  Nível {stage.level}: {stage.title}
                </Text>
              </View>
              <Text style={[styles.barrierSubtext, { color: theme.textSecondary }]}>
                🛡️ Barreiras: <Text style={{ fontWeight: '700', color: theme.text }}>{barrier}%</Text>
                {stageInfo && (
                  <Text style={{ color: character.accentColor, fontWeight: '600' }}>
                    {' '}• {stageInfo.title}
                  </Text>
                )}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={hasImage ? () => setGalleryModalVisible(true) : undefined}
              style={styles.meterRightCol}>
              <Text style={[styles.intimacyLabel, { color: theme.textSecondary }]}>
                NÍVEL DE INTIMIDADE
              </Text>
              <View style={styles.intimacyValueRow}>
                <Ionicons name="heart" size={14} color={stage.color} />
                <Text style={[styles.intimacyPercentText, { color: stage.color }]}>
                  {intimacy}%
                </Text>
                {hasImage && (
                  <Ionicons
                    name="images-outline"
                    size={14}
                    color={character.accentColor}
                    style={{ marginLeft: 2 }}
                  />
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Progress Bar Track */}
          <View style={[styles.progressTrack, { backgroundColor: theme.backgroundSelected }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${intimacy}%`, backgroundColor: stage.color },
              ]}
            />
            {/* Milestones at 20%, 50%, 80% */}
            <View style={[styles.milestoneLine, { left: '20%' }]} />
            <View style={[styles.milestoneLine, { left: '50%' }]} />
            <View style={[styles.milestoneLine, { left: '80%' }]} />
          </View>

          {/* Progress Milestones legend */}
          <View style={styles.milestonesLegend}>
            <Text style={[styles.milestoneText, { color: theme.textSecondary }]}>
              0% (Hostil)
            </Text>
            <Text style={[styles.milestoneText, { color: theme.textSecondary }]}>
              20%
            </Text>
            <Text style={[styles.milestoneText, { color: theme.textSecondary }]}>
              50%
            </Text>
            <Text style={[styles.milestoneText, { color: theme.textSecondary }]}>
              80% (Vulnerável)
            </Text>
          </View>
        </View>
      )}

      {/* Usage & Token Monitor Modal */}
      <UsageModal
        visible={usageModalVisible}
        onClose={() => setUsageModalVisible(false)}
        onOpenSaves={() => setSaveModalVisible(true)}
        onOpenGallery={() => setGalleryModalVisible(true)}
        onStartNewChat={handleClearPress}
      />

      {/* Save Slots & Timelines Modal */}
      <SaveSlotsModal
        visible={saveModalVisible}
        onClose={() => setSaveModalVisible(false)}
      />

      {/* Memory & Lore Diary Modal */}
      <MemoryDiaryModal
        visible={diaryModalVisible}
        onClose={() => setDiaryModalVisible(false)}
      />

      {/* Memory Album & Photo Gallery Modal */}
      <GalleryModal
        visible={galleryModalVisible}
        onClose={() => setGalleryModalVisible(false)}
        character={character}
      />

      {/* Full-size posture viewer modal */}
      {hasImage && (
        <Modal
          visible={imageModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setImageModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableOpacity
              style={styles.modalDismissOverlay}
              activeOpacity={1}
              onPress={() => setImageModalVisible(false)}
            />
            <View
              style={[
                styles.modalCard,
                { backgroundColor: theme.backgroundElement },
              ]}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>
                    {character.name}
                  </Text>
                  {stageInfo && (
                    <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                      Visual do Nível {stageInfo.tier}%: {stageInfo.title}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => setImageModalVisible(false)}
                  style={[
                    styles.modalCloseButton,
                    { backgroundColor: theme.backgroundSelected },
                  ]}>
                  <Ionicons name="close" size={20} color={theme.text} />
                </TouchableOpacity>
              </View>

              <Image
                source={currentAvatar}
                style={styles.modalImage}
                contentFit="contain"
              />

              <View
                style={[
                  styles.modalFooter,
                  { borderTopColor: theme.backgroundSelected },
                ]}>
                <Ionicons name="shield-outline" size={14} color={character.accentColor} />
                <Text style={[styles.modalFooterText, { color: theme.text }]}>
                  Barreiras: <Text style={{ fontWeight: '700', color: character.accentColor }}>{barrier}%</Text>
                </Text>
                <Text style={{ opacity: 0.5, color: theme.textSecondary }}>•</Text>
                <Ionicons name="heart" size={14} color="#F43F5E" />
                <Text style={[styles.modalFooterText, { color: theme.text }]}>
                  Intimidade: <Text style={{ fontWeight: '700', color: '#F43F5E' }}>{intimacy}%</Text>
                </Text>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftNavGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.two,
  },
  backButton: {
    paddingRight: Spacing.two,
    paddingVertical: Spacing.one,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.three,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  avatarEmoji: {
    fontSize: 22,
  },
  infoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
  },
  customBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    marginLeft: 6,
  },
  customBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerUnsumDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  meterCard: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 1,
    borderRadius: 12,
    gap: 6,
  },
  meterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meterLeftCol: {
    gap: 2,
  },
  stageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stageBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  barrierSubtext: {
    fontSize: 11,
  },
  meterRightCol: {
    alignItems: 'flex-end',
    gap: 1,
  },
  intimacyLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  intimacyValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  intimacyPercentText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  milestoneLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  milestonesLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  milestoneText: {
    fontSize: 9,
    fontWeight: '500',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalDismissOverlay: {
    ...StyleSheet.absoluteFill,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: 340,
    backgroundColor: '#000',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  modalFooterText: {
    fontSize: 12,
  },
});
