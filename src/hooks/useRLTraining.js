import { useState, useRef, useCallback, useEffect } from 'react';
import {
  GridEnvironment, QLearningAgent,
  generateRandomEnv, PRESETS, CELL, ACTIONS
} from '../engine/rlEngine';

const DEFAULT_PARAMS = {
  alpha: 0.1,
  gamma: 0.95,
  epsilon: 1.0,
  epsilonDecay: 0.995,
  epsilonMin: 0.05,
  maxStepsPerEpisode: 200,
  stepsPerFrame: 5,
};

export function useRLTraining() {
  const [envConfig, setEnvConfig] = useState(PRESETS.simple);
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(50); // ms per frame
  const [envMode, setEnvMode] = useState('preset'); // 'preset' | 'auto' | 'manual'
  const [selectedPreset, setSelectedPreset] = useState('simple');
  const [brushCell, setBrushCell] = useState(CELL.WALL);

  // Training state (ref for perf, mirrored to state for renders)
  const agentRef = useRef(null);
  const envRef = useRef(null);
  const currentStateRef = useRef(null);
  const episodeStepsRef = useRef(0);
  const episodeRewardRef = useRef(0);
  const rafRef = useRef(null);
  const lastFrameRef = useRef(0);

  const [snapshot, setSnapshot] = useState(null);
  const [manualGrid, setManualGrid] = useState(() => {
    const g = PRESETS.simple.grid.map(r => [...r]);
    return { grid: g, cols: PRESETS.simple.cols, rows: PRESETS.simple.rows };
  });

  // ── Initialize / reset ───────────────────────────────────
  const initTraining = useCallback((cfg = envConfig, p = params) => {
    stopTraining();
    const env = new GridEnvironment(cfg);
    const agent = new QLearningAgent(env.numStates(), ACTIONS.length, p);
    envRef.current = env;
    agentRef.current = agent;
    currentStateRef.current = env.reset();
    episodeStepsRef.current = 0;
    episodeRewardRef.current = 0;
    publishSnapshot();
  }, [envConfig, params]); // eslint-disable-line

  const publishSnapshot = useCallback(() => {
    const env = envRef.current;
    const agent = agentRef.current;
    if (!env || !agent) return;
    const ns = env.numStates();
    setSnapshot({
      grid: env.grid.map(r => [...r]),
      cols: env.cols,
      rows: env.rows,
      agentPos: { ...env.agentPos },
      episode: agent.episodeCount,
      step: agent.stepCount,
      epsilon: agent.epsilon,
      recentSuccess: agent.recentSuccessRate(),
      rewardHistory: [...agent.totalRewards],
      smoothedRewards: agent.smoothedRewards(),
      episodeLengths: [...agent.episodeLengths],
      valueGrid: agent.valueGrid(ns),
      policyGrid: agent.policyGrid(ns),
      qTable: agent.Q.map(row => [...row]),
      lastEpisodeReward: agent.totalRewards[agent.totalRewards.length - 1] ?? 0,
      successCount: agent.successCount,
    });
  }, []);

  // ── Single episode step ──────────────────────────────────
  const runStep = useCallback(() => {
    const env = envRef.current;
    const agent = agentRef.current;
    if (!env || !agent) return;

    const state = currentStateRef.current;
    const action = agent.chooseAction(state);
    const { nextState, reward, done } = env.step(action);
    agent.update(state, action, reward, nextState);
    currentStateRef.current = nextState;
    episodeStepsRef.current++;
    episodeRewardRef.current += reward;

    const maxSteps = params.maxStepsPerEpisode;
    if (done || episodeStepsRef.current >= maxSteps) {
      const success = done && env.grid[env.agentPos.y][env.agentPos.x] === 3;
      agent.endEpisode(episodeRewardRef.current, episodeStepsRef.current, success);
      currentStateRef.current = env.reset();
      episodeStepsRef.current = 0;
      episodeRewardRef.current = 0;
    }
  }, [params.maxStepsPerEpisode]);

  // ── Animation loop ───────────────────────────────────────
  const loop = useCallback((ts) => {
    if (!isRunning) return;
    const elapsed = ts - lastFrameRef.current;
    if (elapsed >= speed) {
      lastFrameRef.current = ts;
      for (let i = 0; i < params.stepsPerFrame; i++) runStep();
      publishSnapshot();
    }
    rafRef.current = requestAnimationFrame(loop);
  }, [isRunning, speed, params.stepsPerFrame, runStep, publishSnapshot]);

  useEffect(() => {
    if (isRunning) {
      lastFrameRef.current = performance.now();
      rafRef.current = requestAnimationFrame(loop);
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isRunning, loop]);

  // ── Controls ─────────────────────────────────────────────
  const startTraining = useCallback(() => {
    if (!envRef.current || !agentRef.current) initTraining();
    setIsRunning(true);
  }, [initTraining]);

  const stopTraining = useCallback(() => {
    setIsRunning(false);
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  }, []);

  const resetTraining = useCallback(() => {
    stopTraining();
    initTraining(envConfig, params);
  }, [stopTraining, initTraining, envConfig, params]);

  // ── Env building ─────────────────────────────────────────
  const loadPreset = useCallback((key) => {
    stopTraining();
    setSelectedPreset(key);
    const cfg = PRESETS[key];
    setEnvConfig(cfg);
    setManualGrid({ grid: cfg.grid.map(r => [...r]), cols: cfg.cols, rows: cfg.rows });
    initTraining(cfg, params);
  }, [stopTraining, params, initTraining]);

  const generateAuto = useCallback((cols = 8, rows = 7, wallDensity = 0.22, traps = 3) => {
    stopTraining();
    const cfg = generateRandomEnv(cols, rows, wallDensity, traps);
    setEnvConfig(cfg);
    setManualGrid({ grid: cfg.grid.map(r => [...r]), cols: cfg.cols, rows: cfg.rows });
    initTraining(cfg, params);
  }, [stopTraining, params, initTraining]);

  const applyManualGrid = useCallback(() => {
    stopTraining();
    const cfg = { ...manualGrid };
    setEnvConfig(cfg);
    initTraining(cfg, params);
  }, [stopTraining, manualGrid, params, initTraining]);

  const toggleManualCell = useCallback((x, y) => {
    setManualGrid(prev => {
      const grid = prev.grid.map(r => [...r]);
      // Don't overwrite start/goal with wall
      const cur = grid[y][x];
      if (cur === CELL.START || cur === CELL.GOAL) return prev;
      grid[y][x] = cur === brushCell ? CELL.EMPTY : brushCell;
      return { ...prev, grid };
    });
  }, [brushCell]);

  const resizeManualGrid = useCallback((cols, rows) => {
    setManualGrid(prev => {
      const grid = Array.from({ length: rows }, (_, y) =>
        Array.from({ length: cols }, (_, x) =>
          (y < prev.rows && x < prev.cols) ? prev.grid[y][x] : CELL.EMPTY
        )
      );
      // Ensure start and goal exist
      if (!grid.flat().includes(CELL.START)) grid[rows - 1][0] = CELL.START;
      if (!grid.flat().includes(CELL.GOAL)) grid[0][cols - 1] = CELL.GOAL;
      return { cols, rows, grid };
    });
  }, []);

  const updateParam = useCallback((key, value) => {
    setParams(p => ({ ...p, [key]: value }));
  }, []);

  // Initialize on mount
  useEffect(() => {
    initTraining(PRESETS.simple, DEFAULT_PARAMS);
  }, []); // eslint-disable-line

  return {
    snapshot,
    isRunning,
    speed, setSpeed,
    params, updateParam,
    envMode, setEnvMode,
    selectedPreset,
    manualGrid,
    brushCell, setBrushCell,
    // actions
    startTraining,
    stopTraining,
    resetTraining,
    loadPreset,
    generateAuto,
    applyManualGrid,
    toggleManualCell,
    resizeManualGrid,
    envConfig,
  };
}
