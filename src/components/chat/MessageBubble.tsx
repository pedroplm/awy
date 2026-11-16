import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChatMessage, Character } from '@/types/chat';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  message: ChatMessage;
  character: Character;
}

export function MessageBubble({ message, character }: Props) {
  const isUser = message.sender === 'user';
  const theme = useTheme();

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
              { color: isUser ? '#E0E7FF' : '#9333EA' },
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
        <View
          style={[
            styles.avatarBubble,
            { borderColor: character.accentColor, backgroundColor: theme.backgroundElement },
          ]}>
          <Text style={styles.avatarEmoji}>{character.avatar}</Text>
        </View>
      )}

      <View
        style={[
          styles.bubble,
          isUser
            ? [styles.userBubble, { backgroundColor: '#6366F1' }]
            : [styles.characterBubble, { backgroundColor: theme.backgroundElement }],
        ]}>
        <Text style={styles.messageContent}>{renderFormattedText(message.text)}</Text>
        <Text
          style={[
            styles.timestamp,
            { color: isUser ? '#C7D2FE' : theme.textSecondary },
          ]}>
          {formattedTime}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.one,
    flexDirection: 'row',
    alignItems: 'flex-end',
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
    marginBottom: Spacing.one,
  },
  avatarEmoji: {
    fontSize: 18,
  },
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
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  characterBubble: {
    borderBottomLeftRadius: 4,
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
    marginTop: 4,
    alignSelf: 'flex-end',
  },
});
