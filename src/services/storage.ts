import AsyncStorage from '@react-native-async-storage/async-storage';
import { Character, ChatMessage } from '@/types/chat';
import { MemoryEntry } from '@/types/rag';
import { SaveSlotMeta, SaveSlotData } from '@/types/save';

const STORAGE_KEYS = {
  MESSAGES_PREFIX: '@awy_messages_',
  CUSTOM_CHARACTERS: '@awy_custom_characters',
  ACTIVE_CHARACTER_ID: '@awy_active_character_id',
  TEXT_ONLY_MODE: '@awy_text_only_mode',
  MEMORIES_PREFIX: '@awy_memories_',
  SAVES_META_PREFIX: '@awy_saves_meta_',
  SAVE_DATA_PREFIX: '@awy_save_data_',
  ACTIVE_SAVE_PREFIX: '@awy_active_save_',
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

  async getTextOnlyMode(): Promise<boolean> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TEXT_ONLY_MODE);
      return data === 'true';
    } catch (err) {
      console.warn('Failed to get text-only mode preference:', err);
      return false;
    }
  },

  async saveTextOnlyMode(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TEXT_ONLY_MODE, enabled ? 'true' : 'false');
    } catch (err) {
      console.warn('Failed to save text-only mode preference:', err);
    }
  },

  async getMemories(characterId: string): Promise<MemoryEntry[]> {
    try {
      const data = await AsyncStorage.getItem(`${STORAGE_KEYS.MEMORIES_PREFIX}${characterId}`);
      if (!data) return [];
      return JSON.parse(data) as MemoryEntry[];
    } catch (err) {
      console.warn('Failed to load memories from storage:', err);
      return [];
    }
  },

  async saveMemories(characterId: string, memories: MemoryEntry[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.MEMORIES_PREFIX}${characterId}`,
        JSON.stringify(memories)
      );
    } catch (err) {
      console.warn('Failed to save memories to storage:', err);
    }
  },

  async clearMemories(characterId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${STORAGE_KEYS.MEMORIES_PREFIX}${characterId}`);
    } catch (err) {
      console.warn('Failed to clear memories:', err);
    }
  },

  async getSaveSlotsMeta(characterId: string): Promise<SaveSlotMeta[]> {
    try {
      const data = await AsyncStorage.getItem(`${STORAGE_KEYS.SAVES_META_PREFIX}${characterId}`);
      if (!data) return [];
      return JSON.parse(data) as SaveSlotMeta[];
    } catch (err) {
      console.warn('Failed to load save slots meta:', err);
      return [];
    }
  },

  async saveSaveSlotsMeta(characterId: string, metas: SaveSlotMeta[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.SAVES_META_PREFIX}${characterId}`,
        JSON.stringify(metas)
      );
    } catch (err) {
      console.warn('Failed to save save slots meta:', err);
    }
  },

  async getSaveSlotData(slotId: string): Promise<SaveSlotData | null> {
    try {
      const data = await AsyncStorage.getItem(`${STORAGE_KEYS.SAVE_DATA_PREFIX}${slotId}`);
      if (!data) return null;
      return JSON.parse(data) as SaveSlotData;
    } catch (err) {
      console.warn('Failed to load save slot data:', err);
      return null;
    }
  },

  async saveSaveSlotData(slotId: string, data: SaveSlotData): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.SAVE_DATA_PREFIX}${slotId}`,
        JSON.stringify(data)
      );
    } catch (err) {
      console.warn('Failed to save save slot data:', err);
    }
  },

  async deleteSaveSlotData(slotId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${STORAGE_KEYS.SAVE_DATA_PREFIX}${slotId}`);
    } catch (err) {
      console.warn('Failed to remove save slot data:', err);
    }
  },

  async getActiveSaveSlotId(characterId: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(`${STORAGE_KEYS.ACTIVE_SAVE_PREFIX}${characterId}`);
    } catch (err) {
      console.warn('Failed to get active save slot id:', err);
      return null;
    }
  },

  async saveActiveSaveSlotId(characterId: string, slotId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(`${STORAGE_KEYS.ACTIVE_SAVE_PREFIX}${characterId}`, slotId);
    } catch (err) {
      console.warn('Failed to save active save slot id:', err);
    }
  },
};
