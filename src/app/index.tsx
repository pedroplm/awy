import React, { useRef, useEffect, useMemo } from 'react';
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
import { Image } from 'expo-image';

import { useChat } from '@/context/ChatContext';
import { useTheme } from '@/hooks/use-theme';
import { CharacterHeader } from '@/components/chat/CharacterHeader';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { TypingDots } from '@/components/chat/TypingDots';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { ChatMessage } from '@/types/chat';
import { getMarinaStageImage } from '@/constants/characters';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  const {
    activeCharacter,
    messages,
    isTyping,
    streamingMessage,
    isStreamingThinking,
    sendMessage,
    clearMessages,
    isLoading,
    currentBarrier,
  } = useChat();

  const isMarina = activeCharacter.id === 'marina' || activeCharacter.id === 'helena';
  const typingAvatarSource = isMarina
    ? getMarinaStageImage(currentBarrier ?? 98)
    : activeCharacter.avatarImage;

  // Track which messages represent 5% milestone barrier levels (95%, 90%, 85%, 80%, etc.)
  const milestoneMessageIds = useMemo(() => {
    const ids = new Set<string>();
    if (!isMarina) return ids;

    const MILESTONES = [95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5, 0];
    const seenMilestones = new Set<number>();

    for (const msg of messages) {
      if (msg.sender !== 'character') continue;
      const match = msg.text.match(
        /\[(?:Status Atual:\s*)?Barreiras?(?:\s*em\s*)?[:\s]+(\d+)%\]/i
      );
      if (!match) continue;
      const barrier = parseInt(match[1], 10);

      // Trigger card image only when hitting or crossing a 5% milestone (95, 90, 85, 80, etc.)
      for (const m of MILESTONES) {
        if (barrier <= m && !seenMilestones.has(m)) {
          ids.add(msg.id);
          seenMilestones.add(m);
          break;
        }
      }
    }
    return ids;
  }, [messages, isMarina]);

  const renderFormattedStream = (text: string) => {
    const cleaned = text.replace(/\[(?:Status Atual:\s*)?Barreiras?(?:\s*em\s*)?[:\s]+\d+%\]\s*/i, '');
    const parts = cleaned.split(/(\*[^*]+\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <Text
            key={index}
            style={[styles.actionText, { color: activeCharacter.accentColor }]}>
            {part}
          </Text>
        );
      }
      return (
        <Text key={index} style={{ color: theme.text }}>
          {part}
        </Text>
      );
    });
  };

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
              <MessageBubble
                message={item}
                character={activeCharacter}
                showCardImage={milestoneMessageIds.has(item.id)}
                isMilestoneUnlock={milestoneMessageIds.has(item.id)}
              />
            )}
            contentContainerStyle={styles.messageListContent}
            style={styles.messageList}
            showsVerticalScrollIndicator={true}
            indicatorStyle="white"
            scrollEventThrottle={16}
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
                    {typingAvatarSource ? (
                      <Image
                        source={typingAvatarSource}
                        style={styles.avatarImage}
                        contentFit="cover"
                      />
                    ) : (
                      <Text style={styles.avatarEmoji}>{activeCharacter.avatar}</Text>
                    )}
                  </View>
                  <View
                    style={[
                      styles.typingBubble,
                      { backgroundColor: theme.backgroundElement },
                    ]}>
                    {streamingMessage ? (
                      <View style={styles.streamContentCol}>
                        <Text style={styles.streamingText}>
                          {renderFormattedStream(streamingMessage)}
                        </Text>
                        {isStreamingThinking && (
                          <View style={styles.pauseDotsRow}>
                            <TypingDots color={activeCharacter.accentColor} size={6} />
                            <Text style={[styles.typingNotice, { color: theme.textSecondary }]}>
                              {activeCharacter.name} está pensando...
                            </Text>
                          </View>
                        )}
                      </View>
                    ) : (
                      <View style={styles.dotRow}>
                        <TypingDots color={activeCharacter.accentColor} size={7} />
                        <Text style={[styles.typingNotice, { color: theme.textSecondary }]}>
                          {activeCharacter.name} está pensando...
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
  streamContentCol: {
    gap: 6,
  },
  pauseDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  actionText: {
    fontStyle: 'italic',
    fontWeight: '500',
  },
  typingNotice: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  streamingText: {
    fontSize: 15,
    lineHeight: 22,
  },
});
