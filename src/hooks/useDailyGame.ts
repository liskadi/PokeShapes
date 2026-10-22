import { useCallback, useEffect, useState } from 'react';
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
  GuessRecord,
  INITIAL_SHAPES,
  MAX_GUESSES,
  MAX_SHAPES,
  ModeGameState,
  PlayCategory,
  SHAPES_PER_WRONG_GUESS,
} from '../types/game';
import { PokemonDetails, PokemonIndexEntry } from '../types/pokemon';
import { createPracticeTarget } from '../utils/dailySeed';
import { soundEngine } from '../utils/sound';
import {
  loadDailyState,
  loadStats,
  recordDailyGameResult,
  saveDailyState,
} from '../utils/storage';

interface UseDailyGameParams {
  currentDateKey: string;
  soundEnabled: boolean;
}

export function useDailyGame({
  currentDateKey,
  soundEnabled,
}: UseDailyGameParams) {
  const [activeMode, setActiveMode] = useState<GameMode>('triangles');
  const [playCategory, setPlayCategory] = useState<PlayCategory>('daily');

  // Master Pokemon directory for autocomplete
  const [pokemonIndex, setPokemonIndex] = useState<PokemonIndexEntry[]>([]);
  const [isIndexLoading, setIsIndexLoading] = useState<boolean>(true);

  // Daily state for all 3 modes (Circles, Triangles, Lines)
  const [dailyState, setDailyState] = useState<DailyGameState>(() =>
    loadDailyState(currentDateKey)
  );

  // Optional Practice mode state per shape mode
  const [practiceStates, setPracticeStates] = useState<
    Record<GameMode, ModeGameState>
  >(() => {
    const c = createPracticeTarget();
    const t = createPracticeTarget(c.pokemonId);
    const l = createPracticeTarget(t.pokemonId);
    return {
      circles: {
        mode: 'circles',
        dateKey: c.sessionKey,
        targetPokemonId: c.pokemonId,
        geometrizeSeed: c.seed,
        guesses: [],
        status: 'playing',
      },
      triangles: {
        mode: 'triangles',
        dateKey: t.sessionKey,
        targetPokemonId: t.pokemonId,
        geometrizeSeed: t.seed,
        guesses: [],
        status: 'playing',
      },
      lines: {
        mode: 'lines',
        dateKey: l.sessionKey,
        targetPokemonId: l.pokemonId,
        geometrizeSeed: l.seed,
        guesses: [],
        status: 'playing',
      },
    };
  });

  // Lifetime statistics
  const [stats, setStats] = useState<AllStats>(() => loadStats(currentDateKey));

  // Target Pokemon details cache for active modes
  const [targetDetailsMap, setTargetDetailsMap] = useState<
    Record<number, PokemonDetails>
  >({});
  const [isSubmittingGuess, setIsSubmittingGuess] = useState<boolean>(false);

  // Re-sync Daily State & Stats whenever currentDateKey rolls over at midnight
  useEffect(() => {
    if (dailyState.dateKey !== currentDateKey) {
      const freshDaily = loadDailyState(currentDateKey);
      setDailyState(freshDaily);
      setStats(loadStats(currentDateKey));
    }
  }, [currentDateKey, dailyState.dateKey]);

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

  // Active mode state (either Daily or Practice)
  const currentModeState: ModeGameState =
    playCategory === 'daily'
      ? dailyState.modes[activeMode]
      : practiceStates[activeMode];

  const targetPokemonId = currentModeState.targetPokemonId;
  const targetPokemon: PokemonDetails | null =
    targetDetailsMap[targetPokemonId] || null;

  // Preload target Pokemon details for all 3 daily modes + active practice mode
  useEffect(() => {
    const idsToLoad = new Set<number>([
      dailyState.modes.circles.targetPokemonId,
      dailyState.modes.triangles.targetPokemonId,
      dailyState.modes.lines.targetPokemonId,
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
  }, [dailyState, targetPokemonId, targetDetailsMap]);

  // Compute how many shapes are currently unlocked by game rules:
  // Starts at 15 shapes. Each wrong guess adds +10 shapes up to 105 shapes.
  const wrongGuessesCount = currentModeState.guesses.filter(
    (g) => !g.comparison.isCorrect
  ).length;

  const unlockedShapeCount =
    currentModeState.status === 'playing'
      ? Math.min(
          MAX_SHAPES,
          INITIAL_SHAPES + wrongGuessesCount * SHAPES_PER_WRONG_GUESS
        )
      : MAX_SHAPES;

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

      // Prevent duplicate guesses of the same Pokemon
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
          ? MAX_SHAPES
          : Math.min(
              MAX_SHAPES,
              INITIAL_SHAPES + nextWrongCount * SHAPES_PER_WRONG_GUESS
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

        if (playCategory === 'daily') {
          const nextModes = {
            ...dailyState.modes,
            [activeMode]: updatedModeState,
          };
          const nextDailyState: DailyGameState = {
            ...dailyState,
            modes: nextModes,
          };
          setDailyState(nextDailyState);
          saveDailyState(nextDailyState);

          if (nextStatus === 'won' || nextStatus === 'lost') {
            const updatedStats = recordDailyGameResult(
              stats,
              activeMode,
              dailyState.dateKey,
              nextStatus === 'won',
              updatedGuesses.length,
              nextModes
            );
            setStats(updatedStats);
          }
        } else {
          setPracticeStates((prev) => ({
            ...prev,
            [activeMode]: updatedModeState,
          }));
        }

        // Audio & visual feedback
        if (nextStatus === 'won') {
          soundEngine.playWinFanfare(soundEnabled);
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
      playCategory,
      dailyState,
      activeMode,
      stats,
      soundEnabled,
    ]
  );

  // Start a new random puzzle in Practice mode
  const startNewPracticePuzzle = useCallback(
    (mode: GameMode = activeMode) => {
      soundEngine.playClick(soundEnabled);
      const nextTarget = createPracticeTarget(
        practiceStates[mode].targetPokemonId
      );
      setPracticeStates((prev) => ({
        ...prev,
        [mode]: {
          mode,
          dateKey: nextTarget.sessionKey,
          targetPokemonId: nextTarget.pokemonId,
          geometrizeSeed: nextTarget.seed,
          guesses: [],
          status: 'playing',
        },
      }));
    },
    [activeMode, practiceStates, soundEnabled]
  );

  const selectMode = useCallback(
    (mode: GameMode) => {
      soundEngine.playClick(soundEnabled);
      setActiveMode(mode);
    },
    [soundEnabled]
  );

  const selectPlayCategory = useCallback(
    (category: PlayCategory) => {
      soundEngine.playClick(soundEnabled);
      setPlayCategory(category);
    },
    [soundEnabled]
  );

  return {
    activeMode,
    selectMode,
    playCategory,
    selectPlayCategory,
    dailyState,
    currentModeState,
    targetPokemon,
    pokemonIndex,
    isIndexLoading,
    unlockedShapeCount,
    wrongGuessesCount,
    guessesRemaining,
    isSubmittingGuess,
    submitGuess,
    startNewPracticePuzzle,
    stats,
  };
}
