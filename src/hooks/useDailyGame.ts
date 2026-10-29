import { useCallback, useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  comparePokemonAttributes,
  fetchPokemonDetails,
  fetchPokemonIndex,
} from '../api/pokeapi';
import {
  AllStats,
  DailyGameState,
  GameMode,
  GameStatus,
  getModeShapeConfig,
  GuessRecord,
  MAX_GUESSES,
  ModeGameState,
  PolyDexMap,
} from '../types/game';
import { PokemonDetails, PokemonIndexEntry } from '../types/pokemon';
import {
  getDailyTargets,
  getOffsetDateKey,
  getPuzzleNumber,
} from '../utils/dailySeed';
import { soundEngine } from '../utils/sound';
import {
  loadDailyState,
  loadPolyDex,
  loadStats,
  recordDailyGameResult,
  recordPolyDexCatch,
  saveDailyState,
} from '../utils/storage';
import { BackgroundPrewarmTask } from './useGeometrize';

interface UseDailyGameParams {
  currentDateKey: string;
  soundEnabled: boolean;
}

export function useDailyGame({
  currentDateKey,
  soundEnabled,
}: UseDailyGameParams) {
  const [activeMode, setActiveMode] = useState<GameMode>('triangles');

  // 2.3 Active Daily Date Key (defaults to Today `currentDateKey`, or any Past Archive Date)
  const [selectedDailyDateKey, setSelectedDailyDateKey] =
    useState<string>(currentDateKey);

  // Master Pokemon directory for autocomplete
  const [pokemonIndex, setPokemonIndex] = useState<PokemonIndexEntry[]>([]);
  const [isIndexLoading, setIsIndexLoading] = useState<boolean>(true);

  // Daily state for the selected daily date (Today or Archive Date)
  const [dailyState, setDailyState] = useState<DailyGameState>(() =>
    loadDailyState(currentDateKey, true)
  );

  // Lifetime statistics & Personal PolyDex Collection
  const [stats, setStats] = useState<AllStats>(() => loadStats(currentDateKey));
  const [polyDex, setPolyDex] = useState<PolyDexMap>(() => loadPolyDex());

  // Target Pokemon details cache
  const [targetDetailsMap, setTargetDetailsMap] = useState<
    Record<number, PokemonDetails>
  >({});
  const [isSubmittingGuess, setIsSubmittingGuess] = useState<boolean>(false);

  // Re-sync Daily State & Stats whenever currentDateKey rolls over at midnight
  useEffect(() => {
    setSelectedDailyDateKey(currentDateKey);
    const freshDaily = loadDailyState(currentDateKey, true);
    setDailyState(freshDaily);
    setStats(loadStats(currentDateKey));
  }, [currentDateKey]);

  // Switch between Today or any Past Archive Date
  const selectArchiveDate = useCallback(
    (dateKey: string) => {
      soundEngine.playClick(soundEnabled);
      setSelectedDailyDateKey(dateKey);
      const isToday = dateKey === currentDateKey;
      setDailyState(loadDailyState(dateKey, isToday));
    },
    [currentDateKey, soundEnabled]
  );

  // Load master Pokemon index on mount
  useEffect(() => {
    let mounted = true;
    setIsIndexLoading(true);
    fetchPokemonIndex()
      .then((entries) => {
        if (mounted) {
          setPokemonIndex(entries);
          setIsIndexLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setIsIndexLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Active mode state for the currently selected Daily / Archive date
  const currentModeState: ModeGameState = dailyState.modes[activeMode];
  const activeShapeConfig = getModeShapeConfig(activeMode);

  const targetPokemonId = currentModeState.targetPokemonId;
  const targetPokemon: PokemonDetails | null =
    targetDetailsMap[targetPokemonId] || null;

  // 2.3 Yesterday's Champions metadata
  const yesterdayDateKey = useMemo(
    () => getOffsetDateKey(currentDateKey, -1),
    [currentDateKey]
  );
  const yesterdayPuzzleNumber = useMemo(
    () => getPuzzleNumber(yesterdayDateKey),
    [yesterdayDateKey]
  );
  const yesterdayTargets = useMemo(
    () => getDailyTargets(yesterdayDateKey),
    [yesterdayDateKey]
  );

  // Preload target Pokemon details for all 3 daily modes + yesterday's modes
  useEffect(() => {
    const idsToLoad = new Set<number>([
      dailyState.modes.circles.targetPokemonId,
      dailyState.modes.triangles.targetPokemonId,
      dailyState.modes.lines.targetPokemonId,
      yesterdayTargets.circles,
      yesterdayTargets.triangles,
      yesterdayTargets.lines,
      targetPokemonId,
    ]);

    idsToLoad.forEach((id) => {
      if (!targetDetailsMap[id]) {
        fetchPokemonDetails(id)
          .then((details) => {
            setTargetDetailsMap((prev) => ({ ...prev, [id]: details }));
          })
          .catch((err) => {
            console.error(`Failed to load target Pokémon #${id}:`, err);
          });
      }
    });
  }, [dailyState, yesterdayTargets, targetPokemonId, targetDetailsMap]);

  // 3.2 Background Prewarm Tasks for the other 2 Daily Modes
  const backgroundPrewarmTasks = useMemo<BackgroundPrewarmTask[]>(() => {
    const tasks: BackgroundPrewarmTask[] = [];
    (['circles', 'triangles', 'lines'] as GameMode[]).forEach((m) => {
      if (m === activeMode) return;
      const mState = dailyState.modes[m];
      const details = targetDetailsMap[mState.targetPokemonId];
      if (details?.officialArtworkUrl) {
        tasks.push({
          dateKey: mState.dateKey,
          mode: m,
          pokemonId: mState.targetPokemonId,
          officialArtworkUrl: details.officialArtworkUrl,
          seed: mState.geometrizeSeed,
        });
      }
    });
    return tasks;
  }, [activeMode, dailyState.modes, targetDetailsMap]);

  // Compute how many shapes are currently unlocked by mode-specific rules:
  // Circles: 20 + 20 * wrong, Triangles: 20 + 10 * wrong, Lines: 50 + 25 * wrong
  const wrongGuessesCount = currentModeState.guesses.filter(
    (g) => !g.comparison.isCorrect
  ).length;

  const unlockedShapeCount =
    currentModeState.status === 'playing'
      ? Math.min(
          activeShapeConfig.maxShapes,
          activeShapeConfig.initialShapes +
            wrongGuessesCount * activeShapeConfig.increment
        )
      : activeShapeConfig.maxShapes;

  const guessesRemaining = Math.max(
    0,
    MAX_GUESSES - currentModeState.guesses.length
  );

  // Submit a Pokemon guess
  const submitGuess = useCallback(
    async (guessedPokemonId: number) => {
      if (
        isSubmittingGuess ||
        currentModeState.status !== 'playing' ||
        !targetPokemon
      ) {
        return;
      }

      if (
        currentModeState.guesses.some(
          (g) => g.pokemon.id === guessedPokemonId
        )
      ) {
        return;
      }

      setIsSubmittingGuess(true);
      try {
        const guessedDetails = await fetchPokemonDetails(guessedPokemonId);
        const comparison = comparePokemonAttributes(
          guessedDetails,
          targetPokemon
        );

        const nextGuessNumber = currentModeState.guesses.length + 1;
        const nextWrongCount = comparison.isCorrect
          ? wrongGuessesCount
          : wrongGuessesCount + 1;
        const shapesUnlockedAfter = comparison.isCorrect
          ? activeShapeConfig.maxShapes
          : Math.min(
              activeShapeConfig.maxShapes,
              activeShapeConfig.initialShapes +
                nextWrongCount * activeShapeConfig.increment
            );

        const newGuess: GuessRecord = {
          pokemon: guessedDetails,
          comparison,
          guessNumber: nextGuessNumber,
          shapesUnlockedAfter,
          timestamp: Date.now(),
        };

        const updatedGuesses = [...currentModeState.guesses, newGuess];
        let nextStatus: GameStatus = 'playing';

        if (comparison.isCorrect) {
          nextStatus = 'won';
        } else if (updatedGuesses.length >= MAX_GUESSES) {
          nextStatus = 'lost';
        }

        const updatedModeState: ModeGameState = {
          ...currentModeState,
          guesses: updatedGuesses,
          status: nextStatus,
          completedAt:
            nextStatus !== 'playing' ? Date.now() : currentModeState.completedAt,
        };

        const isToday = dailyState.dateKey === currentDateKey;
        const nextModes = {
          ...dailyState.modes,
          [activeMode]: updatedModeState,
        };
        const nextDailyState: DailyGameState = {
          ...dailyState,
          modes: nextModes,
        };
        setDailyState(nextDailyState);
        saveDailyState(nextDailyState, isToday);

        // Playing past archive puzzles does NOT affect Stats, Streaks, PolyDex, or Trainer Rank!
        if (isToday && (nextStatus === 'won' || nextStatus === 'lost')) {
          const updatedStats = recordDailyGameResult(
            stats,
            activeMode,
            dailyState.dateKey,
            nextStatus === 'won',
            updatedGuesses.length,
            nextModes,
            true
          );
          setStats(updatedStats);
        }

        if (isToday && nextStatus === 'won') {
          const updatedDex = recordPolyDexCatch(
            polyDex,
            targetPokemon.id,
            activeMode,
            dailyState.dateKey
          );
          setPolyDex(updatedDex);
        }

        // Audio & visual feedback
        if (nextStatus === 'won') {
          soundEngine.playWinFanfare(soundEnabled);
          if (soundEnabled && targetPokemon.cryUrl) {
            setTimeout(() => {
              soundEngine.playPokemonCry(targetPokemon.cryUrl, true);
            }, 420);
          }
          confetti({
            particleCount: 85,
            spread: 70,
            origin: { y: 0.6 },
          });
        } else if (nextStatus === 'lost') {
          soundEngine.playGameOver(soundEnabled);
        } else {
          soundEngine.playWrongGuess(soundEnabled);
        }
      } catch (err) {
        console.error('Error submitting guess:', err);
      } finally {
        setIsSubmittingGuess(false);
      }
    },
    [
      isSubmittingGuess,
      currentModeState,
      targetPokemon,
      wrongGuessesCount,
      activeShapeConfig,
      dailyState,
      currentDateKey,
      activeMode,
      stats,
      polyDex,
      soundEnabled,
    ]
  );

  /**
   * 2.5 Give Up / Reveal Answer
   * Playing past archive puzzles does NOT affect Stats or Streaks!
   */
  const giveUpCurrentGame = useCallback(() => {
    if (currentModeState.status !== 'playing') return;

    const updatedModeState: ModeGameState = {
      ...currentModeState,
      status: 'lost',
      gaveUp: true,
      completedAt: Date.now(),
    };

    const isToday = dailyState.dateKey === currentDateKey;
    const nextModes = {
      ...dailyState.modes,
      [activeMode]: updatedModeState,
    };
    const nextDailyState: DailyGameState = {
      ...dailyState,
      modes: nextModes,
    };
    setDailyState(nextDailyState);
    saveDailyState(nextDailyState, isToday);

    if (isToday) {
      const updatedStats = recordDailyGameResult(
        stats,
        activeMode,
        dailyState.dateKey,
        false,
        currentModeState.guesses.length || MAX_GUESSES,
        nextModes,
        true
      );
      setStats(updatedStats);
    }

    soundEngine.playGameOver(soundEnabled);
  }, [
    currentModeState,
    dailyState,
    currentDateKey,
    activeMode,
    stats,
    soundEnabled,
  ]);

  const selectMode = useCallback(
    (mode: GameMode) => {
      soundEngine.playClick(soundEnabled);
      setActiveMode(mode);
    },
    [soundEnabled]
  );

  return {
    activeMode,
    selectMode,
    selectedDailyDateKey,
    selectArchiveDate,
    dailyState,
    currentModeState,
    targetPokemon,
    targetDetailsMap,
    yesterdayDateKey,
    yesterdayPuzzleNumber,
    yesterdayTargets,
    backgroundPrewarmTasks,
    pokemonIndex,
    isIndexLoading,
    unlockedShapeCount,
    wrongGuessesCount,
    guessesRemaining,
    isSubmittingGuess,
    submitGuess,
    giveUpCurrentGame,
    stats,
    polyDex,
  };
}
