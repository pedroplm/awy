import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage } from '@/types/chat';
import { getCharacterGallery } from '@/constants/gallery';

const GALLERY_STORAGE_KEY_PREFIX = '@awy_gallery_unlocked_';

export const GalleryService = {
  async getUnlockedPhotoIds(characterId: string): Promise<string[]> {
    try {
      const charKey = characterId === 'helena' ? 'marina' : characterId;
      const raw = await AsyncStorage.getItem(`${GALLERY_STORAGE_KEY_PREFIX}${charKey}`);
      if (!raw) return [];
      return JSON.parse(raw) as string[];
    } catch (err) {
      console.warn('Failed to load gallery unlocks:', err);
      return [];
    }
  },

  async saveUnlockedPhotoIds(characterId: string, photoIds: string[]): Promise<void> {
    try {
      const charKey = characterId === 'helena' ? 'marina' : characterId;
      await AsyncStorage.setItem(
        `${GALLERY_STORAGE_KEY_PREFIX}${charKey}`,
        JSON.stringify(Array.from(new Set(photoIds)))
      );
    } catch (err) {
      console.warn('Failed to save gallery unlocks:', err);
    }
  },

  async unlockPhoto(characterId: string, photoId: string): Promise<string[]> {
    const existing = await this.getUnlockedPhotoIds(characterId);
    if (!existing.includes(photoId)) {
      const updated = [...existing, photoId];
      await this.saveUnlockedPhotoIds(characterId, updated);
      return updated;
    }
    return existing;
  },

  /**
   * Scans current messages and barrier levels to retroactively unlock any photo
   * the player has encountered or whose conditions have been satisfied.
   */
  async syncUnlockedFromMessages(
    characterId: string,
    messages: ChatMessage[],
    currentBarrier: number | null
  ): Promise<string[]> {
    const charKey = characterId === 'helena' ? 'marina' : characterId;
    const existing = await this.getUnlockedPhotoIds(charKey);
    const toUnlock = new Set<string>(existing);

    // Initial photo unlock if any message exists
    if (messages.length > 0) {
      if (charKey === 'nova') toUnlock.add('nova_100');
      if (charKey === 'marina') toUnlock.add('marina_90');
    }

    // Determine lowest barrier reached across all messages
    let lowestBarrier = currentBarrier !== null ? currentBarrier : 100;
    for (const msg of messages) {
      const match = msg.text.match(
        /\[(?:Status Atual:\s*)?Barreiras?(?:\s*em\s*)?[:\s]+(\d+)%/i
      );
      if (match) {
        const val = parseInt(match[1], 10);
        if (!isNaN(val) && val < lowestBarrier) {
          lowestBarrier = val;
        }
      }
    }

    if (charKey === 'nova') {
      // Barrier milestone unlocks for Nova
      if (lowestBarrier <= 90) toUnlock.add('nova_90');
      if (lowestBarrier <= 80) toUnlock.add('nova_car');
      if (lowestBarrier <= 70) toUnlock.add('nova_sofa');
      if (lowestBarrier <= 60) toUnlock.add('nova_shy');
      if (lowestBarrier <= 50) {
        toUnlock.add('nova_happy_home');
        toUnlock.add('nova_layed_thinking');
      }
      if (lowestBarrier <= 40) toUnlock.add('nova_grass');
      if (lowestBarrier <= 30) {
        toUnlock.add('nova_hugging');
        toUnlock.add('nova_morning_bed_close');
      }
      if (lowestBarrier <= 20) toUnlock.add('nova_night_bed');
      if (lowestBarrier <= 10) toUnlock.add('nova_kiss');
      if (lowestBarrier <= 0) toUnlock.add('nova_0');

      // Scan character messages for situational triggers
      for (const msg of messages) {
        if (msg.sender !== 'character') continue;
        const text = msg.text.toLowerCase();

        if (/(carro|carona|dirigir|estrada|transito|trânsito|passageir)/i.test(text)) {
          toUnlock.add('nova_car');
        }
        if (/(janela|chuva la fora|olhando pela janela|vidro molhado)/i.test(text)) {
          toUnlock.add('nova_window');
        }
        if (/(sofa|sofá|assistir|filme|televisao|sala de estar)/i.test(text)) {
          toUnlock.add('nova_sofa');
        }
        if (/(grama|parque|jardim|deitad.*na grama|ao ar livre|ar livre)/i.test(text)) {
          toUnlock.add('nova_grass');
        }
        if (/(abraco|abraço|abracar|abraçar|apertad.*peito)/i.test(text)) {
          toUnlock.add('nova_hugging');
        }
        if (/(beijo|beijar|selar.*labios|lábios|boca)/i.test(text)) {
          toUnlock.add('nova_kiss');
        }
        if (/(noite|dormir|cama|quarto|coberta|sonho)/i.test(text)) {
          toUnlock.add('nova_night_bed');
        }
        if (/(acordar|bom dia|manha|manhã|cedo.*cama)/i.test(text)) {
          toUnlock.add('nova_morning_bed');
          if (lowestBarrier <= 40) {
            toUnlock.add('nova_morning_bed_close');
          }
        }
        if (/(tímida|timida|corada|vergonha|sem graca|sem graça)/i.test(text)) {
          toUnlock.add('nova_shy');
        }
        if (/(pulinhos|alegria no apê|sorriso radiante|gargalha|comemorando)/i.test(text)) {
          toUnlock.add('nova_happy_home');
          toUnlock.add('nova_happy');
        }
        if (/(campus|faculdade|corredores|aula)/i.test(text) && /(animad|feliz|sorri)/i.test(text)) {
          toUnlock.add('nova_happy_university');
        }
        if (/(teto|olhando para cima|pensativa|futuro)/i.test(text)) {
          toUnlock.add('nova_layed_thinking');
        }
        if (/(em cima de voce|por cima de você|sem distâncias|olhar intenso)/i.test(text) || lowestBarrier <= 15) {
          toUnlock.add('nova_on_top');
        }
      }
    } else if (charKey === 'marina') {
      // Barrier milestone unlocks for Marina
      if (lowestBarrier <= 80) toUnlock.add('marina_80');
      if (lowestBarrier <= 70) toUnlock.add('marina_70');
      if (lowestBarrier <= 60) toUnlock.add('marina_60');
      if (lowestBarrier <= 40) toUnlock.add('marina_40');
      if (lowestBarrier <= 30) toUnlock.add('marina_30');
      if (lowestBarrier <= 20) toUnlock.add('marina_20');
      if (lowestBarrier <= 10) toUnlock.add('marina_10');
    }

    const updatedList = Array.from(toUnlock);
    if (updatedList.length !== existing.length) {
      await this.saveUnlockedPhotoIds(charKey, updatedList);
    }
    return updatedList;
  },

  /**
   * Helper to get stats on gallery completion (e.g. 7 of 18 unlocked)
   */
  async getGalleryStats(characterId: string) {
    const gallery = getCharacterGallery(characterId);
    const unlocked = await this.getUnlockedPhotoIds(characterId);
    const total = gallery.length;
    const unlockedCount = gallery.filter((p) => unlocked.includes(p.id)).length;
    const percent = total > 0 ? Math.round((unlockedCount / total) * 100) : 0;
    return {
      total,
      unlockedCount,
      percent,
    };
  },
};
