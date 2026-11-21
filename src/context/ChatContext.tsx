import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Character, ChatMessage } from '@/types/chat';
import { DEFAULT_CHARACTERS } from '@/constants/characters';
import { StorageService } from '@/services/storage';
import { AIService } from '@/services/ai';
import { RagService } from '@/services/rag';
import { SaveService } from '@/services/save';
import { SaveSlotMeta } from '@/types/save';
import { MemoryEntry, MemoryCategory } from '@/types/rag';

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
  isTextOnlyMode: boolean;
  setTextOnlyMode: (enabled: boolean) => Promise<void>;
  // Save Slot management
  saveSlots: SaveSlotMeta[];
  activeSaveSlotId: string | null;
  createSaveSlot: (name?: string) => Promise<SaveSlotMeta>;
  loadSaveSlot: (slotId: string) => Promise<void>;
  startNewConversation: (slotName?: string) => Promise<void>;
  deleteSaveSlot: (slotId: string) => Promise<void>;
  renameSaveSlot: (slotId: string, newName: string) => Promise<void>;
  exportSaveSlot: (slotId: string) => Promise<string>;
  importSaveSlot: (jsonString: string) => Promise<SaveSlotMeta>;
  refreshSaveSlots: () => Promise<void>;
  // Memory & Diary management
  memories: MemoryEntry[];
  unsummarizedCount: number;
  refreshMemories: () => Promise<void>;
  addMemory: (content: string, category?: MemoryCategory, importance?: number) => Promise<MemoryEntry>;
  updateMemory: (memoryId: string, updates: Partial<Pick<MemoryEntry, 'content' | 'category' | 'importance'>>) => Promise<void>;
  deleteMemory: (memoryId: string) => Promise<void>;
  summarizeRecentMessages: (force?: boolean) => Promise<{ addedCount: number; message: string }>;
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
  const [isTextOnlyMode, setIsTextOnlyMode] = useState<boolean>(false);
  const [saveSlots, setSaveSlots] = useState<SaveSlotMeta[]>([]);
  const [activeSaveSlotId, setActiveSaveSlotId] = useState<string | null>(null);
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [unsummarizedCount, setUnsummarizedCount] = useState<number>(0);

  // Initialize characters, active character, and preferences
  useEffect(() => {
    async function init() {
      try {
        const textOnlyPref = await StorageService.getTextOnlyMode();
        setIsTextOnlyMode(textOnlyPref);

        const customChars = await StorageService.getCustomCharacters();
        const combined = [...DEFAULT_CHARACTERS, ...customChars];
        setCharacters(combined);

        const savedId = await StorageService.getActiveCharacterId();
        const normalizedId = savedId === 'helena' ? 'marina' : savedId;
        const selected = combined.find((c) => c.id === normalizedId) || combined[0];
        setActiveCharacter(selected);

        // Load messages for selected character
        const loadedMessages = await StorageService.getMessages(selected.id);
        let currentMsgs: ChatMessage[] = [];
        if (loadedMessages.length === 0) {
          // Initialize with character's greeting
          const initialGreeting: ChatMessage = {
            id: 'init_' + Date.now(),
            characterId: selected.id,
            sender: 'character',
            text: selected.greeting,
            timestamp: Date.now(),
          };
          currentMsgs = [initialGreeting];
          setMessages([initialGreeting]);
          await StorageService.saveMessages(selected.id, [initialGreeting]);
        } else {
          currentMsgs = loadedMessages;
          setMessages(loadedMessages);
        }

        // Load memories and calculate unsummarized messages count
        const charMemories = await RagService.getCharacterMemories(selected.id);
        setMemories(charMemories);
        const unsum = await RagService.getUnsummarizedCount(selected.id, currentMsgs);
        setUnsummarizedCount(unsum);

        // Safe Save Slot Initialization / Migration (keeps existing progress intact)
        const saveState = await SaveService.initOrMigrateCharacterSaves(
          selected.id,
          currentMsgs,
          charMemories
        );
        setSaveSlots(saveState.slots);
        setActiveSaveSlotId(saveState.activeSlotId);
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
      let effectiveMsgs: ChatMessage[] = [];
      if (loadedMessages.length === 0) {
        const initialGreeting: ChatMessage = {
          id: 'init_' + Date.now(),
          characterId: found.id,
          sender: 'character',
          text: found.greeting,
          timestamp: Date.now(),
        };
        effectiveMsgs = [initialGreeting];
        setMessages([initialGreeting]);
        await StorageService.saveMessages(found.id, [initialGreeting]);
      } else {
        effectiveMsgs = loadedMessages;
        setMessages(loadedMessages);
      }

      // Load memories and calculate unsummarized messages count for new character
      const charMemories = await RagService.getCharacterMemories(found.id);
      setMemories(charMemories);
      const unsum = await RagService.getUnsummarizedCount(found.id, effectiveMsgs);
      setUnsummarizedCount(unsum);

      // Safe Save Slot Initialization / Migration for newly selected character
      const saveState = await SaveService.initOrMigrateCharacterSaves(
        found.id,
        effectiveMsgs,
        charMemories
      );
      setSaveSlots(saveState.slots);
      setActiveSaveSlotId(saveState.activeSlotId);
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

      // Asynchronously extract and register user memories in RAG
      RagService.extractAndSaveMemories(activeCharacter.id, text, 'user').catch((err) =>
        console.warn('RAG extraction error (user):', err)
      );

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

        // Asynchronously extract any mutual agreements or key character promises
        RagService.extractAndSaveMemories(activeCharacter.id, fullReply, 'character').catch(
          (err) => console.warn('RAG extraction error (character):', err)
        );

        // In background: calculate unsummarized count, trigger auto-summarization if batch size reached, and sync save slot
        (async () => {
          try {
            const currentUnsum = await RagService.getUnsummarizedCount(activeCharacter.id, finalMessages);
            setUnsummarizedCount(currentUnsum);

            if (currentUnsum >= 14) {
              const summaryResult = await RagService.summarizeRecentConversation(
                activeCharacter.id,
                activeCharacter.name,
                finalMessages,
                false
              );
              if (summaryResult.addedCount > 0) {
                const fresh = await RagService.getCharacterMemories(activeCharacter.id);
                setMemories(fresh);
                const updatedUnsum = await RagService.getUnsummarizedCount(activeCharacter.id, finalMessages);
                setUnsummarizedCount(updatedUnsum);
              }
            }

            const currentMems = await StorageService.getMemories(activeCharacter.id);
            setMemories(currentMems);
            await SaveService.syncActiveSlot(activeCharacter.id, finalMessages, currentMems);
            const updatedSlots = await StorageService.getSaveSlotsMeta(activeCharacter.id);
            setSaveSlots(updatedSlots);
          } catch (bgErr) {
            console.warn('Background memory & save sync error:', bgErr);
          }
        })();
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

      // If custom lore or knowledge was provided, seed it into RAG memory
      if (characterData.lore) {
        await RagService.seedCharacterLore(newChar.id, characterData.lore);
      }

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
      // Clean up RAG memories for deleted character
      await RagService.clearMemories(characterId);

      if (activeCharacter.id === characterId) {
        const fallback = filtered[0] || DEFAULT_CHARACTERS[0];
        await selectCharacter(fallback.id);
      }
    },
    [characters, activeCharacter, selectCharacter]
  );

  const refreshSaveSlots = useCallback(async () => {
    const mems = await StorageService.getMemories(activeCharacter.id);
    const saveState = await SaveService.initOrMigrateCharacterSaves(activeCharacter.id, messages, mems);
    setSaveSlots(saveState.slots);
    setActiveSaveSlotId(saveState.activeSlotId);
  }, [activeCharacter.id, messages]);

  const createSaveSlot = useCallback(
    async (name?: string): Promise<SaveSlotMeta> => {
      const mems = await StorageService.getMemories(activeCharacter.id);
      const slotName =
        name?.trim() ||
        `Save (${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})`;
      const created = await SaveService.createSaveSlot(activeCharacter.id, slotName, messages, mems);
      setActiveSaveSlotId(created.id);
      const updated = await StorageService.getSaveSlotsMeta(activeCharacter.id);
      setSaveSlots(updated);
      return created;
    },
    [activeCharacter.id, messages]
  );

  const loadSaveSlot = useCallback(
    async (slotId: string): Promise<void> => {
      const loaded = await SaveService.loadSaveSlot(activeCharacter.id, slotId);
      setMessages(loaded.messages);
      setMemories(loaded.memories);
      const unsum = await RagService.getUnsummarizedCount(activeCharacter.id, loaded.messages);
      setUnsummarizedCount(unsum);
      setActiveSaveSlotId(slotId);
      const updated = await StorageService.getSaveSlotsMeta(activeCharacter.id);
      setSaveSlots(updated);
    },
    [activeCharacter.id]
  );

  const startNewConversation = useCallback(
    async (slotName?: string): Promise<void> => {
      const initialGreeting: ChatMessage = {
        id: 'init_' + Date.now(),
        characterId: activeCharacter.id,
        sender: 'character',
        text: activeCharacter.greeting,
        timestamp: Date.now(),
      };
      // Pull pre-seeded base character lore
      const baseLore = await RagService.getCharacterMemories(activeCharacter.id);
      const cleanLore = baseLore.filter(
        (m) => m.source === 'pre_seeded' || m.source === 'user_lore'
      );

      const newName =
        slotName?.trim() ||
        `Novo Começo (${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})`;

      const res = await SaveService.startNewConversation(
        activeCharacter.id,
        newName,
        initialGreeting,
        cleanLore
      );

      setMessages(res.messages);
      setMemories(cleanLore);
      setUnsummarizedCount(0);
      setActiveSaveSlotId(res.newSlotMeta.id);
      const updated = await StorageService.getSaveSlotsMeta(activeCharacter.id);
      setSaveSlots(updated);
    },
    [activeCharacter]
  );

  const deleteSaveSlot = useCallback(
    async (slotId: string): Promise<void> => {
      const res = await SaveService.deleteSaveSlot(activeCharacter.id, slotId);
      setSaveSlots(res.slots);
      setActiveSaveSlotId(res.activeSlotId);
      if (res.activeSlotId && res.activeSlotId !== slotId) {
        // If current slot was deleted, restore the newly active slot
        const loaded = await SaveService.loadSaveSlot(activeCharacter.id, res.activeSlotId);
        setMessages(loaded.messages);
      }
    },
    [activeCharacter.id]
  );

  const renameSaveSlot = useCallback(
    async (slotId: string, newName: string): Promise<void> => {
      const updated = await SaveService.renameSaveSlot(activeCharacter.id, slotId, newName);
      setSaveSlots(updated);
    },
    [activeCharacter.id]
  );

  const exportSaveSlot = useCallback(
    async (slotId: string): Promise<string> => {
      return await SaveService.exportSaveSlotJSON(slotId);
    },
    []
  );

  const importSaveSlot = useCallback(
    async (jsonString: string): Promise<SaveSlotMeta> => {
      const imported = await SaveService.importSaveSlotFromJSON(activeCharacter.id, jsonString);
      const updated = await StorageService.getSaveSlotsMeta(activeCharacter.id);
      setSaveSlots(updated);
      const freshMems = await StorageService.getMemories(activeCharacter.id);
      setMemories(freshMems);
      return imported;
    },
    [activeCharacter.id]
  );

  const refreshMemories = useCallback(async () => {
    const mems = await RagService.getCharacterMemories(activeCharacter.id);
    setMemories(mems);
    const unsum = await RagService.getUnsummarizedCount(activeCharacter.id, messages);
    setUnsummarizedCount(unsum);
  }, [activeCharacter.id, messages]);

  const addMemory = useCallback(
    async (content: string, category: MemoryCategory = 'user_fact', importance: number = 4) => {
      const created = await RagService.addManualMemory(activeCharacter.id, content, category, importance);
      const fresh = await RagService.getCharacterMemories(activeCharacter.id);
      setMemories(fresh);
      await SaveService.syncActiveSlot(activeCharacter.id, messages, fresh);
      return created;
    },
    [activeCharacter.id, messages]
  );

  const updateMemory = useCallback(
    async (
      memoryId: string,
      updates: Partial<Pick<MemoryEntry, 'content' | 'category' | 'importance'>>
    ) => {
      await RagService.updateMemory(activeCharacter.id, memoryId, updates);
      const fresh = await RagService.getCharacterMemories(activeCharacter.id);
      setMemories(fresh);
      await SaveService.syncActiveSlot(activeCharacter.id, messages, fresh);
    },
    [activeCharacter.id, messages]
  );

  const deleteMemory = useCallback(
    async (memoryId: string) => {
      await RagService.deleteMemory(activeCharacter.id, memoryId);
      const fresh = await RagService.getCharacterMemories(activeCharacter.id);
      setMemories(fresh);
      await SaveService.syncActiveSlot(activeCharacter.id, messages, fresh);
    },
    [activeCharacter.id, messages]
  );

  const summarizeRecentMessages = useCallback(
    async (force: boolean = true) => {
      const res = await RagService.summarizeRecentConversation(
        activeCharacter.id,
        activeCharacter.name,
        messages,
        force
      );
      if (res.addedCount > 0) {
        const fresh = await RagService.getCharacterMemories(activeCharacter.id);
        setMemories(fresh);
        await SaveService.syncActiveSlot(activeCharacter.id, messages, fresh);
        const updatedSlots = await StorageService.getSaveSlotsMeta(activeCharacter.id);
        setSaveSlots(updatedSlots);
      }
      const unsum = await RagService.getUnsummarizedCount(activeCharacter.id, messages);
      setUnsummarizedCount(unsum);
      return res;
    },
    [activeCharacter.id, activeCharacter.name, messages]
  );

  const clearMessages = useCallback(async () => {
    // Non-destructive: creates a new clean session while existing progress is safely kept in its slot
    await startNewConversation(`Reset (${new Date().toLocaleDateString('pt-BR')})`);
  }, [startNewConversation]);

  const currentBarrier = React.useMemo(() => {
    if (!activeCharacter.hasBarrierMeter && activeCharacter.initialBarrier === undefined) {
      return null;
    }
    for (let i = messages.length - 1; i >= 0; i--) {
      const match = messages[i].text.match(/\[(?:Status Atual:\s*)?Barreiras?(?:\s*em\s*)?[:\s]+(\d+)%[^\]]*\]/i);
      if (match) {
        return Math.min(100, Math.max(0, parseInt(match[1], 10)));
      }
    }
    return activeCharacter.initialBarrier ?? 98;
  }, [activeCharacter, messages]);

  const setTextOnlyMode = useCallback(async (enabled: boolean) => {
    setIsTextOnlyMode(enabled);
    await StorageService.saveTextOnlyMode(enabled);
  }, []);

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
        isTextOnlyMode,
        setTextOnlyMode,
        saveSlots,
        activeSaveSlotId,
        createSaveSlot,
        loadSaveSlot,
        startNewConversation,
        deleteSaveSlot,
        renameSaveSlot,
        exportSaveSlot,
        importSaveSlot,
        refreshSaveSlots,
        memories,
        unsummarizedCount,
        refreshMemories,
        addMemory,
        updateMemory,
        deleteMemory,
        summarizeRecentMessages,
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
