import { useCallback, useEffect, useState } from 'react';
import { UserSettings } from '../types/game';
import { loadSettings, saveSettings } from '../utils/storage';

export function useSettings() {
  const [settings, setSettingsState] = useState<UserSettings>(() =>
    loadSettings()
  );

  useEffect(() => {
    const root = document.documentElement;

    // Theme class
    if (settings.theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }

    // Color-blind mode data attribute for CSS token overrides
    root.setAttribute('data-cb-mode', settings.colorBlindMode);
  }, [settings.theme, settings.colorBlindMode]);

  const updateSettings = useCallback((partial: Partial<UserSettings>) => {
    setSettingsState((prev) => {
      const updated = { ...prev, ...partial };
      saveSettings(updated);
      return updated;
    });
  }, []);

  return {
    settings,
    updateSettings,
  };
}
