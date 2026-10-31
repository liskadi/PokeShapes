import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Send, Loader2, Check } from 'lucide-react';
import {
  getDefaultVersionSpriteUrl,
  getFallbackFrontSpriteUrl,
  getGenerationRoman,
} from '../api/pokeapi';
import { PokemonIndexEntry } from '../types/pokemon';

interface PokemonSearchProps {
  pokemonIndex: PokemonIndexEntry[];
  isIndexLoading: boolean;
  guessedIds: Set<number>;
  disabled: boolean;
  isSubmitting: boolean;
  guessesRemaining: number;
  onSubmitGuess: (pokemonId: number) => void;
}

export const PokemonSearch: React.FC<PokemonSearchProps> = ({
  pokemonIndex,
  isIndexLoading,
  guessedIds,
  disabled,
  isSubmitting,
  guessesRemaining,
  onSubmitGuess,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredResults = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    const numericQuery = trimmed.replace(/^#/, '');
    const isNumeric = /^\d+$/.test(numericQuery);

    const startsWithMatches: PokemonIndexEntry[] = [];
    const containsMatches: PokemonIndexEntry[] = [];

    for (const entry of pokemonIndex) {
      const nameLower = entry.displayName.toLowerCase();
      const slugLower = entry.name.toLowerCase();
      const idStr = String(entry.id);

      if (isNumeric && idStr.startsWith(numericQuery)) {
        startsWithMatches.push(entry);
      } else if (
        nameLower.startsWith(trimmed) ||
        slugLower.startsWith(trimmed)
      ) {
        startsWithMatches.push(entry);
      } else if (
        nameLower.includes(trimmed) ||
        slugLower.includes(trimmed) ||
        idStr === numericQuery
      ) {
        containsMatches.push(entry);
      }

      if (startsWithMatches.length + containsMatches.length >= 30) {
        break;
      }
    }

    return [...startsWithMatches, ...containsMatches].slice(0, 12);
  }, [query, pokemonIndex]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredResults.length, query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (entry: PokemonIndexEntry) => {
    if (disabled || isSubmitting || guessedIds.has(entry.id)) {
      return;
    }
    onSubmitGuess(entry.id);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredResults.length === 0) {
      if (e.key === 'ArrowDown' && filteredResults.length > 0) {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % filteredResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(
        (prev) => (prev - 1 + filteredResults.length) % filteredResults.length
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filteredResults[highlightedIndex];
      if (target && !guessedIds.has(target.id)) {
        handleSelect(target);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const isTyping = query.trim().length > 0 && !disabled;

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className={`game-card flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 bg-white dark:bg-[#141C2F] transition-all ${
          disabled
            ? 'opacity-65 cursor-not-allowed'
            : 'focus-within:!border-rose-500 dark:focus-within:!border-rose-500 focus-within:ring-4 focus-within:ring-rose-500/15'
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          className={`w-6 h-6 shrink-0 transition-transform ${
            isTyping ? 'animate-wiggle' : ''
          }`}
          aria-hidden="true"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="#F43F5E"
            stroke="#1E293B"
            strokeWidth="2"
          />
          <path
            d="M2,12 A10,10 0 0,0 22,12 Z"
            fill="#F8FAFC"
            stroke="#1E293B"
            strokeWidth="2"
          />
          <line
            x1="2"
            y1="12"
            x2="22"
            y2="12"
            stroke="#1E293B"
            strokeWidth="2.2"
          />
          <circle
            cx="12"
            cy="12"
            r="3.5"
            fill="#F8FAFC"
            stroke="#1E293B"
            strokeWidth="2"
          />
          <circle cx="12" cy="12" r="1.4" fill="#38BDF8" />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={query}
          disabled={disabled || isIndexLoading}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={
            disabled
              ? 'Round complete!'
              : isIndexLoading
              ? 'Loading Pokédex…'
              : `Who's that Pokémon? (${guessesRemaining} left)`
          }
          className="w-full bg-transparent text-base font-display font-bold text-slate-900 dark:text-white placeholder:font-sans placeholder:font-semibold placeholder:text-xs sm:placeholder:text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
          aria-label="Search and guess a Pokémon"
          aria-expanded={isOpen && filteredResults.length > 0}
          aria-autocomplete="list"
        />

        {isSubmitting || isIndexLoading ? (
          <Loader2 className="w-5 h-5 text-rose-500 animate-spin shrink-0" />
        ) : (
          query.trim().length > 0 &&
          filteredResults.length > 0 && (
            <button
              type="button"
              disabled={
                disabled ||
                guessedIds.has(filteredResults[highlightedIndex]?.id)
              }
              onClick={() => {
                const candidate = filteredResults[highlightedIndex];
                if (candidate) handleSelect(candidate);
              }}
              className="btn-tactile inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 border-rose-400 border-b-rose-700 disabled:bg-slate-400 text-white font-display font-bold text-xs shrink-0 cursor-pointer"
            >
              <span>Guess!</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          )
        )}
      </div>

      {isOpen && !disabled && query.trim().length > 0 && (
        <div className="absolute z-40 left-0 right-0 mt-2 rounded-2xl border-2 border-slate-300 dark:border-[#2C3B5E] bg-white dark:bg-[#141C2F] shadow-[0_8px_0_rgba(15,23,42,0.2)] dark:shadow-[0_8px_0_#070B14] overflow-hidden max-h-80 overflow-y-auto">
          {filteredResults.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
              No Pokémon found matching &ldquo;{query}&rdquo;
            </div>
          ) : (
            <ul
              role="listbox"
              className="divide-y-2 divide-slate-100 dark:divide-[#1E2942]"
            >
              {filteredResults.map((entry, idx) => {
                const alreadyGuessed = guessedIds.has(entry.id);
                const isHighlighted = idx === highlightedIndex;
                const versionSprite =
                  entry.spriteUrl || getDefaultVersionSpriteUrl(entry.id);

                return (
                  <li key={entry.id} role="option" aria-selected={isHighlighted}>
                    <button
                      type="button"
                      disabled={alreadyGuessed}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      onClick={() => handleSelect(entry)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left transition-colors cursor-pointer ${
                        alreadyGuessed
                          ? 'opacity-45 cursor-not-allowed bg-slate-50 dark:bg-[#0D1322]'
                          : isHighlighted
                          ? 'bg-rose-500/12 dark:bg-rose-500/20'
                          : 'hover:bg-slate-50 dark:hover:bg-[#19233A]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-11 h-11 rounded-2xl bg-slate-100 dark:bg-[#1E2B45] border border-slate-200 dark:border-[#31456E] flex items-center justify-center shrink-0 overflow-hidden">
                          <img
                            src={versionSprite}
                            alt={entry.displayName}
                            loading="lazy"
                            onError={(e) => {
                              const fallback = getFallbackFrontSpriteUrl(
                                entry.id
                              );
                              if (e.currentTarget.src !== fallback) {
                                e.currentTarget.src = fallback;
                              }
                            }}
                            className="w-10 h-10 object-contain [image-rendering:pixelated] scale-110 drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]"
                          />
                        </div>
                        <div>
                          <div className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{entry.displayName}</span>
                            <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
                              #{String(entry.id).padStart(4, '0')}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                            Generation {getGenerationRoman(entry.generation)}
                          </span>
                        </div>
                      </div>

                      {alreadyGuessed ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-slate-200 dark:bg-[#1E2942] text-slate-600 dark:text-slate-400">
                          <Check className="w-3 h-3" />
                          Guessed
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-display font-bold bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30">
                          Catch ↵
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
