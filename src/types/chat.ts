export interface Character {
  id: string;
  name: string;
  avatar: string;
  tagline: string;
  personality: string;
  greeting: string;
  systemPrompt: string;
  accentColor: string;
  tags: string[];
  isCustom?: boolean;
}

export interface ChatMessage {
  id: string;
  characterId: string;
  sender: 'user' | 'character' | 'system';
  text: string;
  timestamp: number;
  status?: 'sending' | 'sent' | 'error';
}

export interface QuickAction {
  id: string;
  label: string;
  actionText: string;
}
