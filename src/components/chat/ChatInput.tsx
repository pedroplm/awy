import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ROLEPLAY_QUICK_ACTIONS } from '@/constants/characters';

interface Props {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
  accentColor: string;
}

export function ChatInput({ onSendMessage, disabled = false, accentColor }: Props) {
  const [text, setText] = useState('');
  const theme = useTheme();

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSendMessage(text);
    setText('');
  };

  const handleQuickAction = (actionText: string) => {
    if (disabled) return;
    onSendMessage(actionText);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, borderTopColor: theme.backgroundElement }]}>
      {/* Quick Roleplay Action Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.actionsContainer}>
        {ROLEPLAY_QUICK_ACTIONS.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => handleQuickAction(item.actionText)}
            disabled={disabled}
            style={[
              styles.actionChip,
              { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
            ]}>
            <Text style={[styles.actionChipText, { color: theme.textSecondary }]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Input Bar */}
      <View style={styles.inputRow}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.backgroundElement,
              color: theme.text,
              borderColor: theme.backgroundSelected,
            },
          ]}
          value={text}
          onChangeText={setText}
          placeholder="Type a message or *action*..."
          placeholderTextColor={theme.textSecondary}
          multiline
          maxLength={1000}
          editable={!disabled}
        />

        <TouchableOpacity
          onPress={handleSend}
          disabled={!text.trim() || disabled}
          style={[
            styles.sendButton,
            {
              backgroundColor: text.trim() && !disabled ? accentColor : theme.backgroundSelected,
            },
          ]}>
          <Ionicons
            name="arrow-up"
            size={20}
            color={text.trim() && !disabled ? '#FFFFFF' : theme.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionsContainer: {
    gap: Spacing.two,
    paddingBottom: Spacing.two,
  },
  actionChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    borderRadius: 21,
    paddingHorizontal: Spacing.three + 2,
    paddingTop: Platform.OS === 'ios' ? 11 : 8,
    paddingBottom: Platform.OS === 'ios' ? 11 : 8,
    fontSize: 15,
    borderWidth: 1,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 1,
  },
});
