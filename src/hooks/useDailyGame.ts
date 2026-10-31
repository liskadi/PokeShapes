import { useCallback, useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { fetchPokemonDetails, fetchPokemonIndex } from '../api/pokeapi';
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
  clearAllUserData,
  createDefaultStats,
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
  const [selectedDailyDateKey, setSelectedDailyDateKey] =
    useState<string>(currentDateKey);

  const [pokemonIndex, setPokemonIndex] = useState<PokemonIndexEntry[]>([]);
  const [isIndexLoading, setIsIndexLoading] = useState<boolean>(true);

  const [dailyState, setDailyState] = useState<DailyGameState>(() =>
    loadDailyState(currentDateKey, true)
  );
  const [stats, setStats] = useState<AllStats>(() => loadStats(currentDateKey));
  const [polyDex, setPolyDex] = useState<PolyDexMap>(() => loadPolyDex());

  const [targetDetailsMap, setTargetDetailsMap] = useState<
    Record<number, PokemonDetails>
  >({});
  const [isSubmittingGuess, setIsSubmittingGuess] = useState<boolean>(false);

  useEffect(() => {
    setSelectedDailyDateKey(currentDateKey);
    setDailyState(loadDailyState(currentDateKey, true));
    setStats(loadStats(currentDateKey));
  }, [currentDateKey]);

  const selectArchiveDate = useCallback(
    (dateKey: string) => {
      soundEngine.playClick(soundEnabled);
      setSelectedDailyDateKey(dateKey);
      setDailyState(loadDailyState(dateKey, dateKey === currentDateKey));
    },
    [currentDateKey, soundEnabled]
  );

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

  const currentModeState: ModeGameState = dailyState.modes[activeMode];
  const activeShapeConfig = getModeShapeConfig(activeMode);

  const targetPokemonId = currentModeState.targetPokemonId;
  const targetPokemon: PokemonDetails | null =
    targetDetailsMap[targetPokemonId] || null;

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

  const wrongGuessesCount = currentModeState.guesses.filter(
    (g) => !g.isCorrect
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

  const submitGuess = useCallback(
    async (guessedPokemonId: number) => {
      if (
        isSubmittingGuess ||
        currentModeState.status !== 'playing' ||
        !targetPokemon ||
        currentModeState.guesses.some((g) => g.pokemon.id === guessedPokemonId)
      ) {
        return;
      }

      setIsSubmittingGuess(true);
      try {
        const guessedDetails = await fetchPokemonDetails(guessedPokemonId);
        const isCorrect = guessedDetails.id === targetPokemon.id;

        const newGuess: GuessRecord = {
          pokemon: guessedDetails,
          isCorrect,
          guessNumber: currentModeState.guesses.length + 1,
        };

        const updatedGuesses = [...currentModeState.guesses, newGuess];
        let nextStatus: GameStatus = 'playing';

        if (isCorrect) {
          nextStatus = 'won';
        } else if (updatedGuesses.length >= MAX_GUESSES) {
          nextStatus = 'lost';
        }

        const updatedModeState: ModeGameState = {
          ...currentModeState,
          guesses: updatedGuesses,
          status: nextStatus,
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

        if (isToday && (nextStatus === 'won' || nextStatus === 'lost')) {
          setStats(
            recordDailyGameResult(
              stats,
              activeMode,
              dailyState.dateKey,
              nextStatus === 'won',
              updatedGuesses.length,
              nextModes
            )
          );
        }

        if (isToday && nextStatus === 'won') {
          setPolyDex(
            recordPolyDexCatch(
              polyDex,
              targetPokemon.id,
              activeMode,
              dailyState.dateKey
            )
          );
        }

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
      dailyState,
      currentDateKey,
      activeMode,
      stats,
      polyDex,
      soundEnabled,
    ]
  );

  const giveUpCurrentGame = useCallback(() => {
    if (currentModeState.status !== 'playing') return;

    const updatedModeState: ModeGameState = {
      ...currentModeState,
      status: 'lost',
      gaveUp: true,
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
      setStats(
        recordDailyGameResult(
          stats,
          activeMode,
          dailyState.dateKey,
          false,
          currentModeState.guesses.length || MAX_GUESSES,
          nextModes
        )
      );
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

  const resetAllGameData = useCallback(async () => {
    await clearAllUserData();
    setSelectedDailyDateKey(currentDateKey);
    setDailyState(loadDailyState(currentDateKey, true));
    setStats(createDefaultStats());
    setPolyDex({});
  }, [currentDateKey]);

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
    resetAllGameData,
    stats,
    polyDex,
  };
}
