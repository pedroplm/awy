import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Character } from '@/types/chat';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  character: Character;
  onClearChat: () => void;
  onOpenRoster?: () => void;
}

export function CharacterHeader({ character, onClearChat, onOpenRoster }: Props) {
  const theme = useTheme();

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

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background, borderBottomColor: theme.backgroundElement },
      ]}>
      <TouchableOpacity
        style={styles.profileSection}
        onPress={onOpenRoster}
        activeOpacity={0.8}>
        <View
          style={[
            styles.avatarBadge,
            { borderColor: character.accentColor, backgroundColor: theme.backgroundElement },
          ]}>
          <Text style={styles.avatarEmoji}>{character.avatar}</Text>
        </View>

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
          onPress={handleClearPress}
          style={[styles.iconButton, { backgroundColor: theme.backgroundElement }]}>
          <Ionicons name="trash-outline" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
});
