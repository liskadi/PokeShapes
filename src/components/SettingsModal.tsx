import React from 'react';
import {
  Contrast,
  Moon,
  Palette,
  Settings,
  Sparkles,
  Sun,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { ColorBlindMode, UserSettings } from '../types/game';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (partial: Partial<UserSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const colorBlindOptions: {
    id: ColorBlindMode;
    label: string;
    description: string;
    swatches: string[];
  }[] = [
    {
      id: 'none',
      label: 'Standard Pokédex Palette',
      description: 'Default emerald, amber, and crimson semantic indicators',
      swatches: ['#10B981', '#F59E0B', '#F43F5E'],
    },
    {
      id: 'deuteranopia',
      label: 'Deuteranopia / Protanopia Safe',
      description: 'High-contrast Royal Blue, Orange, and Slate palette (Red-Green safe)',
      swatches: ['#3B82F6', '#F97316', '#64748B'],
    },
    {
      id: 'tritanopia',
      label: 'Tritanopia Safe',
      description: 'Distinct Teal-Cyan, Magenta, and Slate palette (Blue-Yellow safe)',
      swatches: ['#06B6D4', '#D946EF', '#64748B'],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-pop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="settings-modal-title"
                className="font-display font-extrabold text-lg text-slate-900 dark:text-white"
              >
                Game Settings & Accessibility
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Customize appearance, color-blind mode, and gameplay preferences
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* 1. Light / Dark Theme Mode */}
          <div>
            <label className="text-xs font-display font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2.5">
              Appearance Theme
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onUpdateSettings({ theme: 'dark' })}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all ${
                  settings.theme === 'dark'
                    ? 'border-rose-500 bg-rose-500/10 text-slate-900 dark:text-white'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <Moon className="w-5 h-5 text-indigo-400 shrink-0" />
                <div>
                  <div className="font-display font-bold text-sm">Dark Mode</div>
                  <div className="text-[11px] opacity-75">Cyber Pokédex UI</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ theme: 'light' })}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all ${
                  settings.theme === 'light'
                    ? 'border-rose-500 bg-rose-500/10 text-slate-900 dark:text-white'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <Sun className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <div className="font-display font-bold text-sm">Light Mode</div>
                  <div className="text-[11px] opacity-75">Silph Co. Lab UI</div>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Color Blind Mode */}
          <div>
            <label className="text-xs font-display font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2.5">
              <Palette className="w-3.5 h-3.5 text-rose-500" />
              <span>Color Blind Mode</span>
            </label>
            <div className="space-y-2">
              {colorBlindOptions.map((option) => {
                const isSelected = settings.colorBlindMode === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() =>
                      onUpdateSettings({ colorBlindMode: option.id })
                    }
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-rose-500 bg-rose-500/10'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="pr-3">
                      <div className="font-display font-bold text-sm text-slate-900 dark:text-white">
                        {option.label}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {option.description}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {option.swatches.map((hex) => (
                        <span
                          key={hex}
                          className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Toggle Switches */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            {/* High-Contrast Scanner Canvas */}
            <div className="flex items-center justify-between gap-4 py-1.5">
              <div className="flex items-start gap-3">
                <Contrast className="w-5 h-5 text-sky-500 mt-0.5 shrink-0" />
                <div>
                  <div className="font-display font-bold text-sm text-slate-900 dark:text-white">
                    High-Contrast Scanner Backdrop
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Use a pure pitch-black background behind geometrized shapes for maximum contrast
                  </div>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.highContrastCanvas}
                onClick={() =>
                  onUpdateSettings({
                    highContrastCanvas: !settings.highContrastCanvas,
                  })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  settings.highContrastCanvas
                    ? 'bg-rose-500'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                    settings.highContrastCanvas
                      ? 'translate-x-5'
                      : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Shape Pop-In Animations */}
            <div className="flex items-center justify-between gap-4 py-1.5">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <div className="font-display font-bold text-sm text-slate-900 dark:text-white">
                    Animate Shape Additions
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Smoothly animate each new batch of geometric shapes (+20 Circles, +10 Triangles, +25 Lines)
                  </div>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.animateShapes}
                onClick={() =>
                  onUpdateSettings({ animateShapes: !settings.animateShapes })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  settings.animateShapes
                    ? 'bg-rose-500'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                    settings.animateShapes ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Sound Effects */}
            <div className="flex items-center justify-between gap-4 py-1.5">
              <div className="flex items-start gap-3">
                {settings.soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-purple-500 mt-0.5 shrink-0" />
                ) : (
                  <VolumeX className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                )}
                <div>
                  <div className="font-display font-bold text-sm text-slate-900 dark:text-white">
                    Pokédex Audio & Normalized Cries
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Play retro synthesized Pokédex sound effects and volume-normalized Pokémon cries on round completion
                  </div>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.soundEnabled}
                onClick={() =>
                  onUpdateSettings({ soundEnabled: !settings.soundEnabled })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  settings.soundEnabled
                    ? 'bg-rose-500'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                    settings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
