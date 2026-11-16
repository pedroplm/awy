import { useEffect, useState } from 'react';
import { UsageService, UsageStats, FREE_TIER_LIMITS } from '@/services/usage';

export function useUsage() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    UsageService.getUsageStats().then((data) => {
      if (isMounted) {
        setStats(data);
        setIsLoading(false);
      }
    });

    const unsubscribe = UsageService.subscribe((updated) => {
      if (isMounted) {
        setStats(updated);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const resetStats = async () => {
    const reset = await UsageService.resetStats();
    setStats(reset);
  };

  return {
    stats,
    isLoading,
    resetStats,
    limits: FREE_TIER_LIMITS,
  };
}
