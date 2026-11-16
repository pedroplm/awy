import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Character } from '@/types/chat';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useChat } from '@/context/ChatContext';
import { UsageModal } from './UsageModal';
import { getMarinaStageImage, getMarinaStageInfo } from '@/constants/characters';

interface Props {
  character: Character;
  onClearChat: () => void;
  onOpenRoster?: () => void;
}

export function CharacterHeader({ character, onClearChat, onOpenRoster }: Props) {
  const theme = useTheme();
  const { currentBarrier } = useChat();
  const [usageModalVisible, setUsageModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  const handleClearPress = () => {
    Alert.alert(
      'Reset Conversation',
      `Are you sure you want to clear your conversation history with ${character.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: onClearChat },
      ]
    );
  };

  const getStage = (barrier: number) => {
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
    if (barrier > 20) {
      return {
        level: 3,
        title: 'Receptiva & Conectada',
        color: '#8B5CF6',
        icon: 'key-outline' as const,
        description: 'Compartilha fragmentos do passado',
      };
    }
    return {
      level: 4,
      title: 'Desarmada & Vulnerável',
      color: '#10B981',
      icon: 'heart' as const,
      description: 'Vulnerabilidade real e afeto sincero',
    };
  };

  const hasMeter =
    character.hasBarrierMeter ||
    character.initialBarrier !== undefined ||
    currentBarrier !== null;
  const barrier = currentBarrier ?? character.initialBarrier ?? 98;
  const intimacy = Math.max(0, Math.min(100, 100 - barrier));
  const stage = getStage(barrier);

  const isMarina = character.id === 'marina' || character.id === 'helena';
  const currentAvatar = isMarina
    ? getMarinaStageImage(barrier)
    : character.avatarImage;
  const stageInfo = isMarina ? getMarinaStageInfo(barrier) : null;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background, borderBottomColor: theme.backgroundElement },
      ]}>
      {/* Top Profile Section */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.profileSection}
          onPress={onOpenRoster}
          activeOpacity={0.8}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={isMarina ? () => setImageModalVisible(true) : onOpenRoster}
            style={[
              styles.avatarBadge,
              { borderColor: character.accentColor, backgroundColor: theme.backgroundElement },
            ]}>
            {currentAvatar ? (
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
              <View style={styles.statusDot} />
              <Text style={[styles.statusText, { color: theme.textSecondary }]}>
                Always with you • Roleplay Active
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => setUsageModalVisible(true)}
            style={[styles.iconButton, { backgroundColor: theme.backgroundElement }]}
            accessibilityLabel="Ver consumo de tokens e limites da API">
            <Ionicons name="settings-outline" size={18} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleClearPress}
            style={[styles.iconButton, { backgroundColor: theme.backgroundElement }]}
            accessibilityLabel="Limpar histórico">
            <Ionicons name="trash-outline" size={18} color={theme.textSecondary} />
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
              onPress={isMarina ? () => setImageModalVisible(true) : undefined}
              style={styles.meterRightCol}>
              <Text style={[styles.intimacyLabel, { color: theme.textSecondary }]}>
                NÍVEL DE INTIMIDADE
              </Text>
              <View style={styles.intimacyValueRow}>
                <Ionicons name="heart" size={14} color={stage.color} />
                <Text style={[styles.intimacyPercentText, { color: stage.color }]}>
                  {intimacy}%
                </Text>
                {isMarina && (
                  <Ionicons
                    name="camera-outline"
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
      />

      {/* Full-size posture viewer modal for Marina */}
      {isMarina && (
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
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
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
