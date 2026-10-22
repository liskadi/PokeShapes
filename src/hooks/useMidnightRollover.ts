import { useEffect, useState } from 'react';
import { getLocalDateKey } from '../utils/dailySeed';

export interface MidnightRolloverState {
  currentDateKey: string;
  countdownFormatted: string; // "HH:MM:SS"
  secondsUntilMidnight: number;
}

function computeCountdown(now: Date): {
  formatted: string;
  secondsRemaining: number;
} {
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

  const formatted = [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0'),
  ].join(':');

  return {
    formatted,
    secondsRemaining: totalSeconds,
  };
}

/**
 * Watches the local calendar clock every second:
 * 1. Provides a live HH:MM:SS countdown to the next midnight reset.
 * 2. Automatically detects when the calendar day rolls over at 00:00:00
 *    and updates `currentDateKey` so the Daily Puzzle refreshes live.
 */
export function useMidnightRollover(
  onDayRollover?: (newDateKey: string) => void
): MidnightRolloverState {
  const [currentDateKey, setCurrentDateKey] = useState<string>(() =>
    getLocalDateKey()
  );
  const [countdown, setCountdown] = useState(() =>
    computeCountdown(new Date())
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      const now = new Date();
      const latestKey = getLocalDateKey(now);
      setCountdown(computeCountdown(now));

      if (latestKey !== currentDateKey) {
        setCurrentDateKey(latestKey);
        if (onDayRollover) {
          onDayRollover(latestKey);
        }
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [currentDateKey, onDayRollover]);

  return {
    currentDateKey,
    countdownFormatted: countdown.formatted,
    secondsUntilMidnight: countdown.secondsRemaining,
  };
}
