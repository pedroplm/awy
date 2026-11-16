import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Character } from '@/types/chat';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  character: Character;
  isActive: boolean;
  onSelect: () => void;
  onDelete?: () => void;
}

export function CharacterCard({ character, isActive, onSelect, onDelete }: Props) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: isActive ? character.accentColor : theme.backgroundSelected,
          borderWidth: isActive ? 2 : 1,
        },
      ]}>
      <View style={styles.topRow}>
        <View
          style={[
            styles.avatarBubble,
            { borderColor: character.accentColor, backgroundColor: theme.background },
          ]}>
          <Text style={styles.avatarEmoji}>{character.avatar}</Text>
        </View>

        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: theme.text }]}>{character.name}</Text>
            {character.isCustom && (
              <View style={[styles.customBadge, { backgroundColor: character.accentColor }]}>
                <Text style={styles.customBadgeText}>Custom</Text>
              </View>
            )}
          </View>
          <Text style={[styles.tagline, { color: theme.textSecondary }]} numberOfLines={2}>
            {character.tagline}
          </Text>
        </View>

        {character.isCustom && onDelete && (
          <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
            <Ionicons name="close-circle" size={22} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>

      <Text style={[styles.personalityText, { color: theme.text }]} numberOfLines={3}>
        {character.personality}
      </Text>

      {/* Tags */}
      <View style={styles.tagsRow}>
        {character.tags.map((tag, idx) => (
          <View
            key={idx}
            style={[styles.tagPill, { backgroundColor: theme.backgroundSelected }]}>
            <Text style={[styles.tagText, { color: theme.textSecondary }]}>#{tag}</Text>
          </View>
        ))}
      </View>

      {/* Action Button */}
      <TouchableOpacity
        onPress={onSelect}
        style={[
          styles.actionButton,
          {
            backgroundColor: isActive ? character.accentColor : theme.backgroundSelected,
          },
        ]}>
        <Text
          style={[
            styles.actionButtonText,
            { color: isActive ? '#FFFFFF' : theme.text },
          ]}>
          {isActive ? 'Currently Chatting ✓' : 'Chat with ' + character.name}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: Spacing.four,
    marginBottom: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  avatarBubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.three,
  },
  avatarEmoji: {
    fontSize: 26,
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  name: {
    fontSize: 18,
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
  tagline: {
    fontSize: 13,
    marginTop: 2,
  },
  deleteButton: {
    padding: Spacing.one,
  },
  personalityText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.three,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    marginBottom: Spacing.four,
  },
  tagPill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionButton: {
    paddingVertical: Spacing.two + 2,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
