import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ChatMessage, Character } from '@/types/chat';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  getMarinaStageImage,
  getMarinaStageInfo,
} from '@/constants/characters';

interface Props {
  message: ChatMessage;
  character: Character;
  showCardImage?: boolean;
  isMilestoneUnlock?: boolean;
}

export function MessageBubble({
  message,
  character,
  showCardImage,
  isMilestoneUnlock,
}: Props) {
  const isUser = message.sender === 'user';
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  // Parse barrier tag if present in character response: e.g. [Barreiras: 94%] or [Status Atual: Barreiras em 98%]
  const barrierMatch = !isUser
    ? message.text.match(/\[(?:Status Atual:\s*)?Barreiras?(?:\s*em\s*)?[:\s]+(\d+)%\]\s*/i)
    : null;
  const barrierValue = barrierMatch ? parseInt(barrierMatch[1], 10) : null;
  const displayText = barrierMatch ? message.text.replace(barrierMatch[0], '') : message.text;

  // Resolve dynamic avatar / milestone stage for Marina
  const isMarina = character.id === 'marina' || character.id === 'helena';
  const effectiveBarrier = barrierValue ?? 98;
  const avatarSource = isMarina
    ? getMarinaStageImage(effectiveBarrier)
    : character.avatarImage;
  const stageInfo = isMarina ? getMarinaStageInfo(effectiveBarrier) : null;

  // Display the full-bleed card image ONLY on milestone barrier messages (95%, 90%, 85%, 80%, etc.)
  const hasCardImage = !isUser && isMarina && Boolean(showCardImage) && Boolean(avatarSource);

  // Helper to parse roleplay asterisks: e.g. *gently smiles* into italicized text
  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*[^*]+\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <Text
            key={index}
            style={[
              styles.actionText,
              { color: isUser ? '#E0E7FF' : character.accentColor },
            ]}>
            {part}
          </Text>
        );
      }
      return (
        <Text
          key={index}
          style={[
            styles.dialogueText,
            { color: isUser ? '#FFFFFF' : theme.text },
          ]}>
          {part}
        </Text>
      );
    });
  };

  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.characterContainer,
      ]}>
      {!isUser && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={isMarina ? () => setModalVisible(true) : undefined}
          style={[
            styles.avatarBubble,
            { borderColor: character.accentColor, backgroundColor: theme.backgroundElement },
          ]}>
          {avatarSource ? (
            <Image
              source={avatarSource}
              style={styles.avatarImage}
              contentFit="cover"
            />
          ) : (
            <Text style={styles.avatarEmoji}>{character.avatar}</Text>
          )}
        </TouchableOpacity>
      )}

      {hasCardImage ? (
        // Rich Visual Card Bubble: Full-bleed image occupying the top, dialogue spoken below
        <View
          style={[
            styles.cardBubble,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: isMilestoneUnlock
                ? character.accentColor
                : theme.backgroundSelected,
              borderWidth: isMilestoneUnlock ? 1.5 : 1,
            },
          ]}>
          {/* Top Image occupying the full width of the message */}
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => setModalVisible(true)}
            style={styles.cardImageContainer}>
            <Image
              source={avatarSource}
              style={styles.cardImage}
              contentFit="cover"
              transition={250}
            />

            {/* Overlays on top of the image */}
            <View style={styles.cardImageTopOverlay}>
              {isMilestoneUnlock && stageInfo ? (
                <View
                  style={[
                    styles.milestonePill,
                    { backgroundColor: character.accentColor },
                  ]}>
                  <Ionicons name="sparkles" size={12} color="#FFFFFF" />
                  <Text style={styles.milestonePillText}>
                    Nova Postura ({stageInfo.tier}%)
                  </Text>
                </View>
              ) : (
                <View style={{ flex: 1 }} />
              )}

              {barrierValue !== null && (
                <View style={styles.barrierGlassPill}>
                  <Ionicons name="shield-outline" size={11} color="#FBBF24" />
                  <Text style={styles.barrierGlassText}>
                    Defesas:{' '}
                    <Text style={{ fontWeight: '700', color: '#FBBF24' }}>
                      {barrierValue}%
                    </Text>
                  </Text>
                  <Text style={styles.barrierGlassDivider}>•</Text>
                  <Ionicons name="heart" size={11} color="#F43F5E" />
                  <Text style={styles.barrierGlassText}>
                    {Math.max(0, 100 - barrierValue)}%
                  </Text>
                </View>
              )}
            </View>

            {/* Tap to expand hint on bottom right */}
            <View style={styles.cardImageBottomOverlay}>
              <View style={styles.expandHintBadge}>
                <Ionicons name="expand-outline" size={12} color="#FFFFFF" />
                <Text style={styles.expandHintText}>Toque para ampliar</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Message Content spoken underneath the image */}
          <View style={styles.cardBody}>
            <Text style={styles.messageContent}>{renderFormattedText(displayText)}</Text>
            <Text style={[styles.timestamp, { color: theme.textSecondary }]}>
              {formattedTime}
            </Text>
          </View>
        </View>
      ) : (
        // Standard Bubble for user messages or companions without stage cards
        <View
          style={[
            styles.bubble,
            isUser
              ? [styles.userBubble, { backgroundColor: '#6366F1' }]
              : [styles.characterBubble, { backgroundColor: theme.backgroundElement }],
          ]}>
          {barrierValue !== null && (
            <View
              style={[
                styles.barrierBadge,
                {
                  backgroundColor: theme.backgroundSelected,
                  borderColor: character.accentColor,
                },
              ]}>
              <Ionicons name="shield-outline" size={11} color={character.accentColor} />
              <Text style={[styles.barrierBadgeText, { color: theme.textSecondary }]}>
                Defesas:{' '}
                <Text style={{ fontWeight: '700', color: character.accentColor }}>
                  {barrierValue}%
                </Text>
              </Text>
              <Text style={[styles.barrierDivider, { color: theme.textSecondary }]}>•</Text>
              <Ionicons name="heart" size={11} color="#F43F5E" />
              <Text style={[styles.barrierBadgeText, { color: theme.textSecondary }]}>
                Intimidade:{' '}
                <Text style={{ fontWeight: '700', color: '#F43F5E' }}>
                  {Math.max(0, 100 - barrierValue)}%
                </Text>
              </Text>
            </View>
          )}

          <Text style={styles.messageContent}>{renderFormattedText(displayText)}</Text>
          <Text
            style={[
              styles.timestamp,
              { color: isUser ? '#C7D2FE' : theme.textSecondary },
            ]}>
            {formattedTime}
          </Text>
        </View>
      )}

      {/* Full-view modal for character milestone posture */}
      {isMarina && (
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableOpacity
              style={styles.modalDismissOverlay}
              activeOpacity={1}
              onPress={() => setModalVisible(false)}
            />
            <View
              style={[
                styles.modalCard,
                { backgroundColor: theme.backgroundElement },
              ]}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderInfo}>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>
                    {character.name}
                  </Text>
                  {stageInfo && (
                    <Text
                      style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                      Nível {stageInfo.tier}% • {stageInfo.title} ({stageInfo.expression})
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={[
                    styles.modalCloseButton,
                    { backgroundColor: theme.backgroundSelected },
                  ]}>
                  <Ionicons name="close" size={20} color={theme.text} />
                </TouchableOpacity>
              </View>

              <Image
                source={avatarSource}
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
                  Barreiras:{' '}
                  <Text style={{ fontWeight: '700', color: character.accentColor }}>
                    {barrierValue ?? 98}%
                  </Text>
                </Text>
                <Text style={[styles.barrierDivider, { color: theme.textSecondary }]}>•</Text>
                <Ionicons name="heart" size={14} color="#F43F5E" />
                <Text style={[styles.modalFooterText, { color: theme.text }]}>
                  Intimidade:{' '}
                  <Text style={{ fontWeight: '700', color: '#F43F5E' }}>
                    {Math.max(0, 100 - (barrierValue ?? 98))}%
                  </Text>
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
    marginVertical: Spacing.one + 2,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.three,
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  characterContainer: {
    justifyContent: 'flex-start',
  },
  avatarBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.two,
    marginTop: 2,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  avatarEmoji: {
    fontSize: 18,
  },
  // Rich visual novel card bubble
  cardBubble: {
    maxWidth: Platform.OS === 'web' ? 480 : '88%',
    width: '100%',
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  cardImageContainer: {
    width: '100%',
    height: Platform.OS === 'web' ? 280 : 250,
    backgroundColor: '#1E1E24',
    position: 'relative',
    justifyContent: 'space-between',
  },
  cardImage: {
    ...StyleSheet.absoluteFill,
  },
  cardImageTopOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    zIndex: 2,
    gap: 6,
  },
  milestonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  milestonePillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  barrierGlassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  barrierGlassText: {
    color: '#FFFFFF',
    fontSize: 11,
  },
  barrierGlassDivider: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10,
  },
  cardImageBottomOverlay: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 8,
    zIndex: 2,
  },
  expandHintBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  expandHintText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 10,
    fontWeight: '500',
  },
  cardBody: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two + 2,
    gap: 6,
  },
  // Standard simple bubble for user and standard companions
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    gap: 4,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  characterBubble: {
    borderBottomLeftRadius: 4,
  },
  barrierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 4,
  },
  barrierBadgeText: {
    fontSize: 11,
  },
  barrierDivider: {
    fontSize: 10,
    opacity: 0.6,
  },
  messageContent: {
    fontSize: 15,
    lineHeight: 22,
  },
  actionText: {
    fontStyle: 'italic',
    fontWeight: '500',
  },
  dialogueText: {
    fontWeight: '400',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalDismissOverlay: {
    ...StyleSheet.absoluteFill,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
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
  modalHeaderInfo: {
    flex: 1,
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
    height: 360,
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
