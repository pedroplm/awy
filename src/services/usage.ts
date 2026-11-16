import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UsageStats {
  totalPromptTokens: number;
  totalCandidateTokens: number;
  totalTokens: number;
  totalRequests: number;
  requestsToday: number;
  lastRequestDate: string; // YYYY-MM-DD
  estimatedCostUSD: number;
  lastPromptTokens: number;
  lastCandidateTokens: number;
  lastTimestamp: number;
}

const STORAGE_KEY = '@awy_api_usage_stats';

// Pricing for Gemini 2.5 / 3.5 Flash-Lite:
// Input: $0.075 per 1,000,000 tokens ($0.000000075 per token)
// Output: $0.30 per 1,000,000 tokens ($0.00000030 per token)
const PRICE_PER_INPUT_TOKEN = 0.075 / 1000000;
const PRICE_PER_OUTPUT_TOKEN = 0.30 / 1000000;

// Google AI Studio Free Tier limits for Gemini Flash-Lite
export const FREE_TIER_LIMITS = {
  requestsPerDay: 1500,
  requestsPerMinute: 15,
  tokensPerMinute: 1000000,
};

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

const defaultStats: UsageStats = {
  totalPromptTokens: 0,
  totalCandidateTokens: 0,
  totalTokens: 0,
  totalRequests: 0,
  requestsToday: 0,
  lastRequestDate: getTodayString(),
  estimatedCostUSD: 0,
  lastPromptTokens: 0,
  lastCandidateTokens: 0,
  lastTimestamp: 0,
};

type Listener = (stats: UsageStats) => void;
const listeners = new Set<Listener>();

let memoryCachedStats: UsageStats | null = null;

export const UsageService = {
  async getUsageStats(): Promise<UsageStats> {
    if (memoryCachedStats) {
      return memoryCachedStats;
    }

    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (!data) {
        memoryCachedStats = { ...defaultStats, lastRequestDate: getTodayString() };
        return memoryCachedStats;
      }

      const parsed: UsageStats = JSON.parse(data);
      const today = getTodayString();

      // Reset daily requests counter if day changed
      if (parsed.lastRequestDate !== today) {
        parsed.requestsToday = 0;
        parsed.lastRequestDate = today;
      }

      memoryCachedStats = parsed;
      return parsed;
    } catch (err) {
      console.warn('Failed to load usage stats:', err);
      memoryCachedStats = { ...defaultStats };
      return memoryCachedStats;
    }
  },

  async recordUsage(
    promptTokens: number,
    candidateTokens: number,
    _model?: string
  ): Promise<UsageStats> {
    const current = await this.getUsageStats();
    const today = getTodayString();

    const isNewDay = current.lastRequestDate !== today;
    const requestsToday = isNewDay ? 1 : (current.requestsToday || 0) + 1;

    const totalPromptTokens = (current.totalPromptTokens || 0) + promptTokens;
    const totalCandidateTokens = (current.totalCandidateTokens || 0) + candidateTokens;
    const totalTokens = totalPromptTokens + totalCandidateTokens;

    const addedCost =
      promptTokens * PRICE_PER_INPUT_TOKEN + candidateTokens * PRICE_PER_OUTPUT_TOKEN;
    const estimatedCostUSD = (current.estimatedCostUSD || 0) + addedCost;

    const updated: UsageStats = {
      totalPromptTokens,
      totalCandidateTokens,
      totalTokens,
      totalRequests: (current.totalRequests || 0) + 1,
      requestsToday,
      lastRequestDate: today,
      estimatedCostUSD,
      lastPromptTokens: promptTokens,
      lastCandidateTokens: candidateTokens,
      lastTimestamp: Date.now(),
    };

    memoryCachedStats = updated;

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save usage stats:', err);
    }

    // Notify all active listeners
    listeners.forEach((listener) => {
      try {
        listener(updated);
      } catch (err) {
        console.warn('Error in usage listener:', err);
      }
    });

    return updated;
  },

  async resetStats(): Promise<UsageStats> {
    const resetData: UsageStats = {
      ...defaultStats,
      lastRequestDate: getTodayString(),
      lastTimestamp: Date.now(),
    };

    memoryCachedStats = resetData;

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(resetData));
    } catch (err) {
      console.warn('Failed to reset usage stats:', err);
    }

    listeners.forEach((listener) => {
      try {
        listener(resetData);
      } catch (err) {
        console.warn('Error in usage listener:', err);
      }
    });

    return resetData;
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
