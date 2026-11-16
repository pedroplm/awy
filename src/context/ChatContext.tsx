import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Character, ChatMessage } from '@/types/chat';
import { DEFAULT_CHARACTERS } from '@/constants/characters';
import { StorageService } from '@/services/storage';
import { AIService } from '@/services/ai';

interface ChatContextType {
  characters: Character[];
  activeCharacter: Character;
  messages: ChatMessage[];
  isTyping: boolean;
  streamingMessage: string;
  isStreamingThinking: boolean;
  sendMessage: (text: string) => Promise<void>;
  selectCharacter: (characterId: string) => Promise<void>;
  addCustomCharacter: (characterData: Omit<Character, 'id' | 'isCustom'>) => Promise<Character>;
  deleteCharacter: (characterId: string) => Promise<void>;
  clearMessages: () => Promise<void>;
  isLoading: boolean;
  currentBarrier: number | null;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [characters, setCharacters] = useState<Character[]>(DEFAULT_CHARACTERS);
  const [activeCharacter, setActiveCharacter] = useState<Character>(DEFAULT_CHARACTERS[0]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const [isStreamingThinking, setIsStreamingThinking] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize characters and active character
  useEffect(() => {
    async function init() {
      try {
        const customChars = await StorageService.getCustomCharacters();
        const combined = [...DEFAULT_CHARACTERS, ...customChars];
        setCharacters(combined);

        const savedId = await StorageService.getActiveCharacterId();
        const normalizedId = savedId === 'helena' ? 'marina' : savedId;
        const selected = combined.find((c) => c.id === normalizedId) || combined[0];
        setActiveCharacter(selected);

        // Load messages for selected character
        const loadedMessages = await StorageService.getMessages(selected.id);
        if (loadedMessages.length === 0) {
          // Initialize with character's greeting
          const initialGreeting: ChatMessage = {
            id: 'init_' + Date.now(),
            characterId: selected.id,
            sender: 'character',
            text: selected.greeting,
            timestamp: Date.now(),
          };
          setMessages([initialGreeting]);
          await StorageService.saveMessages(selected.id, [initialGreeting]);
        } else {
          setMessages(loadedMessages);
        }
      } catch (err) {
        console.warn('Error initializing chat context:', err);
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, []);

  const selectCharacter = useCallback(
    async (characterId: string) => {
      const found = characters.find((c) => c.id === characterId);
      if (!found || found.id === activeCharacter.id) return;

      setActiveCharacter(found);
      await StorageService.saveActiveCharacterId(found.id);

      const loadedMessages = await StorageService.getMessages(found.id);
      if (loadedMessages.length === 0) {
        const initialGreeting: ChatMessage = {
          id: 'init_' + Date.now(),
          characterId: found.id,
          sender: 'character',
          text: found.greeting,
          timestamp: Date.now(),
        };
        setMessages([initialGreeting]);
        await StorageService.saveMessages(found.id, [initialGreeting]);
      } else {
        setMessages(loadedMessages);
      }
    },
    [characters, activeCharacter]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isTyping) return;

      const userMsg: ChatMessage = {
        id: 'msg_' + Date.now() + '_user',
        characterId: activeCharacter.id,
        sender: 'user',
        text: text.trim(),
        timestamp: Date.now(),
      };

      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      await StorageService.saveMessages(activeCharacter.id, newMessages);

      setIsTyping(true);
      setStreamingMessage('');
      setIsStreamingThinking(false);

      let accumulated = '';
      try {
        const fullReply = await AIService.generateResponse({
          character: activeCharacter,
          history: newMessages,
          userMessage: text,
          onToken: (token) => {
            accumulated += token;
            setStreamingMessage(accumulated);
          },
          onPause: (isThinking) => {
            setIsStreamingThinking(isThinking);
          },
        });

        const charMsg: ChatMessage = {
          id: 'msg_' + Date.now() + '_char',
          characterId: activeCharacter.id,
          sender: 'character',
          text: fullReply,
          timestamp: Date.now(),
        };

        const finalMessages = [...newMessages, charMsg];
        setMessages(finalMessages);
        await StorageService.saveMessages(activeCharacter.id, finalMessages);
      } catch (err) {
        console.error('Failed to generate response:', err);
      } finally {
        setIsTyping(false);
        setStreamingMessage('');
        setIsStreamingThinking(false);
      }
    },
    [activeCharacter, isTyping, messages]
  );

  const addCustomCharacter = useCallback(
    async (characterData: Omit<Character, 'id' | 'isCustom'>): Promise<Character> => {
      const newChar: Character = {
        ...characterData,
        id: 'custom_' + Date.now(),
        isCustom: true,
      };

      const updated = [...characters, newChar];
      setCharacters(updated);

      const customOnly = updated.filter((c) => c.isCustom);
      await StorageService.saveCustomCharacters(customOnly);

      return newChar;
    },
    [characters]
  );

  const deleteCharacter = useCallback(
    async (characterId: string) => {
      const filtered = characters.filter((c) => c.id !== characterId);
      setCharacters(filtered);

      const customOnly = filtered.filter((c) => c.isCustom);
      await StorageService.saveCustomCharacters(customOnly);
      await StorageService.clearMessages(characterId);

      if (activeCharacter.id === characterId) {
        const fallback = filtered[0] || DEFAULT_CHARACTERS[0];
        await selectCharacter(fallback.id);
      }
    },
    [characters, activeCharacter, selectCharacter]
  );

  const clearMessages = useCallback(async () => {
    await StorageService.clearMessages(activeCharacter.id);
    const initialGreeting: ChatMessage = {
      id: 'init_' + Date.now(),
      characterId: activeCharacter.id,
      sender: 'character',
      text: activeCharacter.greeting,
      timestamp: Date.now(),
    };
    setMessages([initialGreeting]);
    await StorageService.saveMessages(activeCharacter.id, [initialGreeting]);
  }, [activeCharacter]);

  const currentBarrier = React.useMemo(() => {
    if (!activeCharacter.hasBarrierMeter && activeCharacter.initialBarrier === undefined) {
      return null;
    }
    for (let i = messages.length - 1; i >= 0; i--) {
      const match = messages[i].text.match(/\[(?:Status Atual:\s*)?Barreiras?(?:\s*em\s*)?[:\s]+(\d+)%\]/i);
      if (match) {
        return Math.min(100, Math.max(0, parseInt(match[1], 10)));
      }
    }
    return activeCharacter.initialBarrier ?? 98;
  }, [activeCharacter, messages]);

  return (
    <ChatContext.Provider
      value={{
        characters,
        activeCharacter,
        messages,
        isTyping,
        streamingMessage,
        isStreamingThinking,
        sendMessage,
        selectCharacter,
        addCustomCharacter,
        deleteCharacter,
        clearMessages,
        isLoading,
        currentBarrier,
      }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
