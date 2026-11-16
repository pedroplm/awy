import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useChat } from '@/context/ChatContext';
import { useTheme } from '@/hooks/use-theme';
import { CharacterHeader } from '@/components/chat/CharacterHeader';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { ChatMessage } from '@/types/chat';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  const {
    activeCharacter,
    messages,
    isTyping,
    streamingMessage,
    sendMessage,
    clearMessages,
    isLoading,
  } = useChat();

  useEffect(() => {
    // Scroll to bottom when new messages arrive or when streaming updates
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, streamingMessage]);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={activeCharacter.accentColor} />
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.centerWrapper}>
          {/* Active Companion Header */}
          <CharacterHeader
            character={activeCharacter}
            onClearChat={clearMessages}
            onOpenRoster={() => router.push('/explore')}
          />

          {/* Chat Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MessageBubble message={item} character={activeCharacter} />
            )}
            contentContainerStyle={styles.messageListContent}
            style={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListFooterComponent={
              isTyping ? (
                <View style={styles.typingContainer}>
                  <View
                    style={[
                      styles.avatarBubble,
                      {
                        borderColor: activeCharacter.accentColor,
                        backgroundColor: theme.backgroundElement,
                      },
                    ]}>
                    <Text style={styles.avatarEmoji}>{activeCharacter.avatar}</Text>
                  </View>
                  <View
                    style={[
                      styles.typingBubble,
                      { backgroundColor: theme.backgroundElement },
                    ]}>
                    {streamingMessage ? (
                      <Text style={[styles.streamingText, { color: theme.text }]}>
                        {streamingMessage}
                      </Text>
                    ) : (
                      <View style={styles.dotRow}>
                        <ActivityIndicator size="small" color={activeCharacter.accentColor} />
                        <Text style={[styles.typingNotice, { color: theme.textSecondary }]}>
                          {activeCharacter.name} is typing...
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ) : undefined
            }
          />

          {/* Chat Input Bar */}
          <ChatInput
            onSendMessage={sendMessage}
            disabled={isTyping}
            accentColor={activeCharacter.accentColor}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  centerWrapper: {
    flex: 1,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: BottomTabInset,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingVertical: Spacing.two,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.three,
    marginVertical: Spacing.one,
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
  typingBubble: {
    maxWidth: '82%',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  typingNotice: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  streamingText: {
    fontSize: 15,
    lineHeight: 22,
  },
});
