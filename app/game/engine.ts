import type { Problem } from "./problems.generated";

export type GameStats = {
  correctChars: number;
  totalTyped: number;
  mistakes: number;
  correctWords: number;
};

export type GameState = {
  startedAt: number | null;
  durationMs: number;
  timeLeftMs: number;
  current: Problem;
  index: number;
  typedSoFar: string;
  done: boolean;
  stats: GameStats;
};

export function normalizeInputChar(ch: string): string {
  if (ch === "\n" || ch === "\r") return "";
  return ch;
}

export function makeInitialState(problem: Problem, durationSec = 60): GameState {
  return {
    startedAt: null,
    durationMs: durationSec * 1000,
    timeLeftMs: durationSec * 1000,
    current: problem,
    index: 0,
    typedSoFar: "",
    done: false,
    stats: { correctChars: 0, totalTyped: 0, mistakes: 0, correctWords: 0 },
  };
}

export function startGame(state: GameState, now: number): GameState {
  if (state.startedAt !== null) return state;
  return { ...state, startedAt: now };
}

export function tick(state: GameState, now: number): GameState {
  if (state.done) return state;
  if (state.startedAt === null) return state;

  const elapsed = now - state.startedAt;
  const left = Math.max(0, state.durationMs - elapsed);
  return { ...state, timeLeftMs: left, done: left === 0 };
}

export function applyChar(
  state: GameState,
  rawChar: string,
  pickNextProblem: () => Problem
): GameState {
  if (state.done) return state;

  const ch = normalizeInputChar(rawChar);
  if (!ch) return state;

  const target = state.current.bopomofo;
  const expected = target[state.index] ?? "";

  const totalTyped = state.stats.totalTyped + 1;

  if (ch === expected) {
    const nextIndex = state.index + 1;
    const finished = nextIndex >= target.length;

    const nextStats = {
      ...state.stats,
      totalTyped,
      correctChars: state.stats.correctChars + 1,
    };

    if (finished) {
      const nextProblem = pickNextProblem();
      return {
        ...state,
        current: nextProblem,
        index: 0,
        typedSoFar: "",
        stats: { ...nextStats, correctWords: state.stats.correctWords + 1 },
      };
    }

    return {
      ...state,
      index: nextIndex,
      typedSoFar: state.typedSoFar + ch,
      stats: nextStats,
    };
  }

  return {
    ...state,
    stats: {
      ...state.stats,
      totalTyped,
      mistakes: state.stats.mistakes + 1,
    },
  };
}

export function computeMetrics(state: GameState) {
  const elapsedMs =
    state.startedAt === null ? 0 : state.durationMs - state.timeLeftMs;

  const minutes = Math.max(1 / 60, elapsedMs / 60000);
  const cpm = state.stats.correctChars / minutes;
  const accuracy =
    state.stats.totalTyped === 0
      ? 1
      : state.stats.correctChars / state.stats.totalTyped;

  return { cpm, accuracy };
}
