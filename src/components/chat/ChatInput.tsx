import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
  accentColor: string;
}

export function ChatInput({ onSendMessage, disabled = false, accentColor }: Props) {
  const [text, setText] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSendMessage(text);
    setText('');
  };

  const bottomPadding = isKeyboardVisible
    ? Spacing.two
    : Math.max(Spacing.two, insets.bottom);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
          borderTopColor: theme.backgroundElement,
          paddingBottom: bottomPadding,
        },
      ]}>
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
    paddingTop: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 82, // Approximately 3 lines maximum height
    borderRadius: 20,
    paddingHorizontal: Spacing.three + 2,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 15,
    lineHeight: 20,
    borderWidth: 1,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 1,
  },
});
