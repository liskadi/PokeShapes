import { useEffect, useState } from 'react';
import { getLocalDateKey } from '../utils/dailySeed';

export interface MidnightRolloverState {
  currentDateKey: string;
  countdownFormatted: string;
}

function formatCountdownToMidnight(now: Date): string {
  const tomorrowMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    0,
    0
  );
  const diffMs = Math.max(0, tomorrowMidnight.getTime() - now.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0'),
  ].join(':');
}

export function useMidnightRollover(
  onDayRollover?: (newDateKey: string) => void
): MidnightRolloverState {
  const [currentDateKey, setCurrentDateKey] = useState<string>(() =>
    getLocalDateKey()
  );
  const [countdownFormatted, setCountdownFormatted] = useState<string>(() =>
    formatCountdownToMidnight(new Date())
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      const now = new Date();
      const latestKey = getLocalDateKey(now);
      setCountdownFormatted(formatCountdownToMidnight(now));

      if (latestKey !== currentDateKey) {
        setCurrentDateKey(latestKey);
        onDayRollover?.(latestKey);
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [currentDateKey, onDayRollover]);

  return {
    currentDateKey,
    countdownFormatted,
  };
}
