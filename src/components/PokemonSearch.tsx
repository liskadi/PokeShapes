import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Send, Loader2, Check } from 'lucide-react';
import { getGenerationRoman } from '../api/pokeapi';
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

  // Filter Pokemon by name or National Dex number (#)
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

  // Close dropdown on outside click
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

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className={`flex items-center gap-2 rounded-2xl border-2 px-3.5 py-2.5 bg-white dark:bg-slate-900 transition-all shadow-lg shadow-slate-900/5 ${
          disabled
            ? 'border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed'
            : 'border-slate-300 dark:border-slate-700 focus-within:border-rose-500 dark:focus-within:border-rose-500 focus-within:ring-4 focus-within:ring-rose-500/15'
        }`}
      >
        <Search className="w-5 h-5 text-slate-400 shrink-0" />
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
              ? 'Round complete! Check your stats or switch shape modes above.'
              : isIndexLoading
              ? 'Loading Pokédex database from PokéAPI…'
              : `Who's that Pokémon? (${guessesRemaining} ${
                  guessesRemaining === 1 ? 'guess' : 'guesses'
                } left — wrong guess adds +10 shapes)`
          }
          className="w-full bg-transparent text-sm sm:text-base font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:bg-slate-400 text-white font-display font-bold text-xs transition-colors shrink-0"
            >
              <span>Guess</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          )
        )}
      </div>

      {/* Autocomplete Suggestions Dropdown */}
      {isOpen && !disabled && query.trim().length > 0 && (
        <div className="absolute z-40 left-0 right-0 mt-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
          {filteredResults.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
              No Pokémon found matching &ldquo;{query}&rdquo;
            </div>
          ) : (
            <ul role="listbox" className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {filteredResults.map((entry, idx) => {
                const alreadyGuessed = guessedIds.has(entry.id);
                const isHighlighted = idx === highlightedIndex;

                return (
                  <li key={entry.id} role="option" aria-selected={isHighlighted}>
                    <button
                      type="button"
                      disabled={alreadyGuessed}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      onClick={() => handleSelect(entry)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left transition-colors ${
                        alreadyGuessed
                          ? 'opacity-45 cursor-not-allowed bg-slate-50 dark:bg-slate-950/50'
                          : isHighlighted
                          ? 'bg-rose-500/10 dark:bg-rose-500/20'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 flex items-center justify-center shrink-0">
                          <img
                            src={entry.officialArtworkUrl}
                            alt={entry.displayName}
                            loading="lazy"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div>
                          <div className="font-display font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{entry.displayName}</span>
                            <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
                              #{String(entry.id).padStart(4, '0')}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            Generation {getGenerationRoman(entry.generation)}
                          </span>
                        </div>
                      </div>

                      {alreadyGuessed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          <Check className="w-3 h-3" />
                          Guessed
                        </span>
                      ) : (
                        <span className="text-xs font-mono font-semibold text-rose-500 dark:text-rose-400">
                          Select ↵
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
