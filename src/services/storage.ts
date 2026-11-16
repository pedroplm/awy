import AsyncStorage from '@react-native-async-storage/async-storage';
import { Character, ChatMessage } from '@/types/chat';

const STORAGE_KEYS = {
  MESSAGES_PREFIX: '@awy_messages_',
  CUSTOM_CHARACTERS: '@awy_custom_characters',
  ACTIVE_CHARACTER_ID: '@awy_active_character_id',
};

export const StorageService = {
  async getMessages(characterId: string): Promise<ChatMessage[]> {
    try {
      const data = await AsyncStorage.getItem(`${STORAGE_KEYS.MESSAGES_PREFIX}${characterId}`);
      if (!data) return [];
      return JSON.parse(data) as ChatMessage[];
    } catch (err) {
      console.warn('Failed to load messages from storage:', err);
      return [];
    }
  },

  async saveMessages(characterId: string, messages: ChatMessage[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.MESSAGES_PREFIX}${characterId}`,
        JSON.stringify(messages)
      );
    } catch (err) {
      console.warn('Failed to save messages to storage:', err);
    }
  },

  async clearMessages(characterId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${STORAGE_KEYS.MESSAGES_PREFIX}${characterId}`);
    } catch (err) {
      console.warn('Failed to clear messages:', err);
    }
  },

  async getCustomCharacters(): Promise<Character[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_CHARACTERS);
      if (!data) return [];
      return JSON.parse(data) as Character[];
    } catch (err) {
      console.warn('Failed to load custom characters:', err);
      return [];
    }
  },

  async saveCustomCharacters(characters: Character[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_CHARACTERS, JSON.stringify(characters));
    } catch (err) {
      console.warn('Failed to save custom characters:', err);
    }
  },

  async getActiveCharacterId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_CHARACTER_ID);
    } catch (err) {
      console.warn('Failed to get active character id:', err);
      return null;
    }
  },

  async saveActiveCharacterId(id: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_CHARACTER_ID, id);
    } catch (err) {
      console.warn('Failed to save active character id:', err);
    }
  },
};
