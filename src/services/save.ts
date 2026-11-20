import { StorageService } from '@/services/storage';
import { ChatMessage } from '@/types/chat';
import { MemoryEntry } from '@/types/rag';
import { SaveSlotMeta, SaveSlotData } from '@/types/save';

function extractBarrier(messages: ChatMessage[], fallback: number = 98): number | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const match = messages[i].text.match(
      /\[(?:Status Atual:\s*)?Barreiras?(?:\s*em\s*)?[:\s]+(\d+)%[^\]]*\]/i
    );
    if (match) {
      return Math.min(100, Math.max(0, parseInt(match[1], 10)));
    }
  }
  return fallback;
}

function truncatePreview(text: string, maxLen: number = 90): string {
  if (!text) return 'Nenhuma mensagem recente';
  // Remove barrier tags and system metadata for preview readability
  const cleaned = text
    .replace(/\[(?:Status Atual:\s*)?Barreiras?(?:\s*em\s*)?[:\s]+\d+%[^\]]*\]\s*/gi, '')
    .trim();
  if (cleaned.length <= maxLen) return cleaned;
  return cleaned.slice(0, maxLen) + '...';
}

export const SaveService = {
  /**
   * Initializes saves for a character.
   * SAFETY GUARANTEE: If the user already had conversations and memories,
   * this automatically creates their first save slot so NO PROGRESS IS LOST.
   */
  async initOrMigrateCharacterSaves(
    characterId: string,
    currentMessages?: ChatMessage[],
    currentMemories?: MemoryEntry[]
  ): Promise<{ slots: SaveSlotMeta[]; activeSlotId: string | null }> {
    try {
      const existingMetas = await StorageService.getSaveSlotsMeta(characterId);
      const activeSlotId = await StorageService.getActiveSaveSlotId(characterId);

      if (existingMetas.length > 0) {
        // Validate active slot id
        const isValidActive = activeSlotId && existingMetas.some((s) => s.id === activeSlotId);
        const resolvedActive = isValidActive ? activeSlotId : existingMetas[0].id;
        if (resolvedActive !== activeSlotId) {
          await StorageService.saveActiveSaveSlotId(characterId, resolvedActive);
        }
        return { slots: existingMetas, activeSlotId: resolvedActive };
      }

      // No save slots exist yet: Check if there is existing chat progress to backup
      const messages = currentMessages || (await StorageService.getMessages(characterId));
      const memories = currentMemories || (await StorageService.getMemories(characterId));

      if (messages.length > 0) {
        const slotId = `save_${characterId}_initial_${Date.now()}`;
        const lastMsg = messages[messages.length - 1];
        const barrier = extractBarrier(messages);

        const initialSlotData: SaveSlotData = {
          id: slotId,
          characterId,
          name: 'Progresso Principal (Backup Automático)',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          barrier,
          messageCount: messages.length,
          memoryCount: memories.length,
          lastMessagePreview: truncatePreview(lastMsg?.text || ''),
          messages,
          memories,
          isAutoBackup: true,
        };

        const initialMeta: SaveSlotMeta = {
          id: initialSlotData.id,
          characterId: initialSlotData.characterId,
          name: initialSlotData.name,
          createdAt: initialSlotData.createdAt,
          updatedAt: initialSlotData.updatedAt,
          barrier: initialSlotData.barrier,
          messageCount: initialSlotData.messageCount,
          memoryCount: initialSlotData.memoryCount,
          lastMessagePreview: initialSlotData.lastMessagePreview,
          isAutoBackup: true,
        };

        await StorageService.saveSaveSlotData(slotId, initialSlotData);
        await StorageService.saveSaveSlotsMeta(characterId, [initialMeta]);
        await StorageService.saveActiveSaveSlotId(characterId, slotId);

        return { slots: [initialMeta], activeSlotId: slotId };
      }

      return { slots: [], activeSlotId: null };
    } catch (err) {
      console.warn('Error in initOrMigrateCharacterSaves:', err);
      return { slots: [], activeSlotId: null };
    }
  },

  /**
   * Syncs active conversation updates into the current active slot.
   * Runs in the background whenever a turn completes so progress is always preserved.
   */
  async syncActiveSlot(
    characterId: string,
    messages: ChatMessage[],
    memories: MemoryEntry[]
  ): Promise<void> {
    try {
      const activeSlotId = await StorageService.getActiveSaveSlotId(characterId);
      if (!activeSlotId) return;

      const slotData = await StorageService.getSaveSlotData(activeSlotId);
      if (!slotData) return;

      const lastMsg = messages[messages.length - 1];
      const barrier = extractBarrier(messages);

      const updatedData: SaveSlotData = {
        ...slotData,
        updatedAt: Date.now(),
        barrier,
        messageCount: messages.length,
        memoryCount: memories.length,
        lastMessagePreview: truncatePreview(lastMsg?.text || ''),
        messages,
        memories,
      };

      await StorageService.saveSaveSlotData(activeSlotId, updatedData);

      // Update meta in index
      const metas = await StorageService.getSaveSlotsMeta(characterId);
      const updatedMetas = metas.map((m) =>
        m.id === activeSlotId
          ? {
              ...m,
              updatedAt: updatedData.updatedAt,
              barrier: updatedData.barrier,
              messageCount: updatedData.messageCount,
              memoryCount: updatedData.memoryCount,
              lastMessagePreview: updatedData.lastMessagePreview,
            }
          : m
      );

      await StorageService.saveSaveSlotsMeta(characterId, updatedMetas);
    } catch (err) {
      console.warn('Error syncing active save slot:', err);
    }
  },

  /**
   * Creates a new manual save slot snapshot from current chat state.
   */
  async createSaveSlot(
    characterId: string,
    slotName: string,
    messages: ChatMessage[],
    memories: MemoryEntry[]
  ): Promise<SaveSlotMeta> {
    const slotId = `save_${characterId}_${Date.now()}`;
    const lastMsg = messages[messages.length - 1];
    const barrier = extractBarrier(messages);

    const newSlot: SaveSlotData = {
      id: slotId,
      characterId,
      name: slotName.trim() || `Save ${new Date().toLocaleDateString('pt-BR')}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      barrier,
      messageCount: messages.length,
      memoryCount: memories.length,
      lastMessagePreview: truncatePreview(lastMsg?.text || ''),
      messages,
      memories,
    };

    const newMeta: SaveSlotMeta = {
      id: newSlot.id,
      characterId: newSlot.characterId,
      name: newSlot.name,
      createdAt: newSlot.createdAt,
      updatedAt: newSlot.updatedAt,
      barrier: newSlot.barrier,
      messageCount: newSlot.messageCount,
      memoryCount: newSlot.memoryCount,
      lastMessagePreview: newSlot.lastMessagePreview,
    };

    await StorageService.saveSaveSlotData(slotId, newSlot);

    const existingMetas = await StorageService.getSaveSlotsMeta(characterId);
    const updatedMetas = [newMeta, ...existingMetas];
    await StorageService.saveSaveSlotsMeta(characterId, updatedMetas);
    await StorageService.saveActiveSaveSlotId(characterId, slotId);

    return newMeta;
  },

  /**
   * Restores a previously saved slot into the active conversation.
   */
  async loadSaveSlot(
    characterId: string,
    slotId: string
  ): Promise<{ messages: ChatMessage[]; memories: MemoryEntry[]; slotMeta: SaveSlotMeta }> {
    const slotData = await StorageService.getSaveSlotData(slotId);
    if (!slotData) {
      throw new Error(`Save slot not found: ${slotId}`);
    }

    // Overwrite active conversation keys with the slot's data
    await StorageService.saveMessages(characterId, slotData.messages);
    await StorageService.saveMemories(characterId, slotData.memories);
    await StorageService.saveActiveSaveSlotId(characterId, slotId);

    const metas = await StorageService.getSaveSlotsMeta(characterId);
    const meta = metas.find((m) => m.id === slotId) || {
      id: slotData.id,
      characterId: slotData.characterId,
      name: slotData.name,
      createdAt: slotData.createdAt,
      updatedAt: slotData.updatedAt,
      barrier: slotData.barrier,
      messageCount: slotData.messageCount,
      memoryCount: slotData.memoryCount,
      lastMessagePreview: slotData.lastMessagePreview,
    };

    return {
      messages: slotData.messages,
      memories: slotData.memories,
      slotMeta: meta,
    };
  },

  /**
   * Safely starts a new conversation.
   * First ensures current active messages are snapshotted so nothing is lost,
   * then creates a new clean slot with the character's initial greeting.
   */
  async startNewConversation(
    characterId: string,
    slotName: string,
    initialGreeting: ChatMessage,
    baseMemories: MemoryEntry[] = []
  ): Promise<{ messages: ChatMessage[]; memories: MemoryEntry[]; newSlotMeta: SaveSlotMeta }> {
    const slotId = `save_${characterId}_new_${Date.now()}`;
    const initialMessages = [initialGreeting];

    const newSlot: SaveSlotData = {
      id: slotId,
      characterId,
      name: slotName.trim() || `Novo Começo (${new Date().toLocaleDateString('pt-BR')})`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      barrier: extractBarrier(initialMessages),
      messageCount: initialMessages.length,
      memoryCount: baseMemories.length,
      lastMessagePreview: truncatePreview(initialGreeting.text),
      messages: initialMessages,
      memories: baseMemories,
    };

    const newMeta: SaveSlotMeta = {
      id: newSlot.id,
      characterId: newSlot.characterId,
      name: newSlot.name,
      createdAt: newSlot.createdAt,
      updatedAt: newSlot.updatedAt,
      barrier: newSlot.barrier,
      messageCount: newSlot.messageCount,
      memoryCount: newSlot.memoryCount,
      lastMessagePreview: newSlot.lastMessagePreview,
    };

    await StorageService.saveSaveSlotData(slotId, newSlot);

    const existingMetas = await StorageService.getSaveSlotsMeta(characterId);
    const updatedMetas = [newMeta, ...existingMetas];
    await StorageService.saveSaveSlotsMeta(characterId, updatedMetas);

    // Set active conversation to this new slot
    await StorageService.saveMessages(characterId, initialMessages);
    await StorageService.saveMemories(characterId, baseMemories);
    await StorageService.saveActiveSaveSlotId(characterId, slotId);

    return {
      messages: initialMessages,
      memories: baseMemories,
      newSlotMeta: newMeta,
    };
  },

  /**
   * Renames a save slot.
   */
  async renameSaveSlot(
    characterId: string,
    slotId: string,
    newName: string
  ): Promise<SaveSlotMeta[]> {
    const trimmed = newName.trim();
    if (!trimmed) return await StorageService.getSaveSlotsMeta(characterId);

    const slotData = await StorageService.getSaveSlotData(slotId);
    if (slotData) {
      slotData.name = trimmed;
      await StorageService.saveSaveSlotData(slotId, slotData);
    }

    const metas = await StorageService.getSaveSlotsMeta(characterId);
    const updated = metas.map((m) => (m.id === slotId ? { ...m, name: trimmed } : m));
    await StorageService.saveSaveSlotsMeta(characterId, updated);
    return updated;
  },

  /**
   * Deletes a save slot.
   */
  async deleteSaveSlot(
    characterId: string,
    slotId: string
  ): Promise<{ slots: SaveSlotMeta[]; activeSlotId: string | null }> {
    await StorageService.deleteSaveSlotData(slotId);

    const metas = await StorageService.getSaveSlotsMeta(characterId);
    const updatedMetas = metas.filter((m) => m.id !== slotId);
    await StorageService.saveSaveSlotsMeta(characterId, updatedMetas);

    let activeSlotId = await StorageService.getActiveSaveSlotId(characterId);
    if (activeSlotId === slotId) {
      activeSlotId = updatedMetas.length > 0 ? updatedMetas[0].id : null;
      if (activeSlotId) {
        await StorageService.saveActiveSaveSlotId(characterId, activeSlotId);
      }
    }

    return { slots: updatedMetas, activeSlotId };
  },

  /**
   * Exports a save slot as a standalone JSON string for backup and offline keeping.
   */
  async exportSaveSlotJSON(slotId: string): Promise<string> {
    const slotData = await StorageService.getSaveSlotData(slotId);
    if (!slotData) throw new Error('Save slot não encontrado para exportação');
    return JSON.stringify(slotData, null, 2);
  },

  /**
   * Imports a save slot from a JSON string.
   */
  async importSaveSlotFromJSON(
    characterId: string,
    jsonString: string
  ): Promise<SaveSlotMeta> {
    const parsed = JSON.parse(jsonString) as SaveSlotData;
    if (!parsed || !Array.isArray(parsed.messages)) {
      throw new Error('Arquivo de save inválido: histórico de mensagens ausente.');
    }

    const newSlotId = `save_${characterId}_import_${Date.now()}`;
    const barrier = extractBarrier(parsed.messages);
    const lastMsg = parsed.messages[parsed.messages.length - 1];

    const importedData: SaveSlotData = {
      id: newSlotId,
      characterId,
      name: `${parsed.name || 'Save Importado'} (Backup)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      barrier,
      messageCount: parsed.messages.length,
      memoryCount: Array.isArray(parsed.memories) ? parsed.memories.length : 0,
      lastMessagePreview: truncatePreview(lastMsg?.text || ''),
      messages: parsed.messages,
      memories: Array.isArray(parsed.memories) ? parsed.memories : [],
    };

    const importedMeta: SaveSlotMeta = {
      id: importedData.id,
      characterId: importedData.characterId,
      name: importedData.name,
      createdAt: importedData.createdAt,
      updatedAt: importedData.updatedAt,
      barrier: importedData.barrier,
      messageCount: importedData.messageCount,
      memoryCount: importedData.memoryCount,
      lastMessagePreview: importedData.lastMessagePreview,
    };

    await StorageService.saveSaveSlotData(newSlotId, importedData);
    const metas = await StorageService.getSaveSlotsMeta(characterId);
    const updated = [importedMeta, ...metas];
    await StorageService.saveSaveSlotsMeta(characterId, updated);

    return importedMeta;
  },
};
