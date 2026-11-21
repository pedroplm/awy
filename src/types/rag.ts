export type MemoryCategory =
  | 'user_fact'      // Facts about the user (name, age, profession, routine)
  | 'preference'     // Likes, dislikes, favorite foods, songs, hobbies
  | 'relationship'   // Agreements, promises made, emotional milestones
  | 'character_lore' // Pre-seeded or user-defined character lore and background
  | 'event';         // Notable shared experiences in the story

export type MemorySource =
  | 'auto_extracted'
  | 'user_lore'
  | 'pre_seeded'
  | 'summary'
  | 'manual';

export interface MemoryEntry {
  id: string;
  characterId: string;
  content: string;
  category: MemoryCategory;
  importance: number; // 1 to 5 (5 being critical, e.g. user name or core boundary)
  timestamp: number;
  source: MemorySource;
  keywords: string[];
}

export interface RetrievalResult {
  entry: MemoryEntry;
  score: number;
}
