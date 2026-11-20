import { ChatMessage } from './chat';
import { MemoryEntry } from './rag';

export interface SaveSlotMeta {
  id: string;
  characterId: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  barrier: number | null;
  messageCount: number;
  memoryCount: number;
  lastMessagePreview: string;
  isAutoBackup?: boolean;
}

export interface SaveSlotData extends SaveSlotMeta {
  messages: ChatMessage[];
  memories: MemoryEntry[];
}
