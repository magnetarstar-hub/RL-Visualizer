// ============================================================
// RL Engine — Grid World + Q-Learning
// ============================================================

export const CELL = {
  EMPTY: 0,
  WALL: 1,
  START: 2,
  GOAL: 3,
  TRAP: 4,
};

export const ACTIONS = [
  { id: 0, label: '↑', dx: 0, dy: -1 },
  { id: 1, label: '→', dx: 1, dy: 0 },
  { id: 2, label: '↓', dx: 0, dy: 1 },
  { id: 3, label: '←', dx: -1, dy: 0 },
];

export const REWARDS = {
  [CELL.GOAL]: 10,
  [CELL.TRAP]: -5,
  [CELL.EMPTY]: -0.05,
  [CELL.START]: -0.05,
};

// ── Default preset environments ──────────────────────────────
export const PRESETS = {
  simple: {
    name: 'Simple Path',
    cols: 6,
    rows: 5,
    grid: [
      [0,0,0,0,0,0],
      [0,1,1,0,1,0],
      [0,0,0,0,1,3],
      [0,1,1,1,1,0],
      [2,0,0,0,0,0],
    ],
  },
  maze: {
    name: 'Maze',
    cols: 8,
    rows: 7,
    grid: [
      [0,0,1,0,0,0,0,3],
      [0,1,0,0,1,1,0,1],
      [0,1,0,1,0,0,0,0],
      [0,0,0,0,0,1,1,0],
      [1,1,1,1,0,0,0,0],
      [0,4,0,0,0,1,0,4],
      [2,0,0,0,0,0,0,0],
    ],
  },
  traps: {
    name: 'Danger Zone',
    cols: 7,
    rows: 6,
    grid: [
      [2,0,0,4,0,0,3],
      [0,1,0,1,0,1,0],
      [0,4,0,0,0,4,0],
      [0,0,0,1,0,0,0],
      [0,1,4,0,4,1,0],
      [0,0,0,0,0,0,0],
    ],
  },
};

// ── Environment class ─────────────────────────────────────────
export class GridEnvironment {
  constructor(config) {
    this.grid = config.grid.map(r => [...r]);
    this.rows = config.rows;
    this.cols = config.cols;
    this.startPos = this.findCell(CELL.START) || { x: 0, y: config.rows - 1 };
    this.goalPos = this.findCell(CELL.GOAL);
    this.agentPos = { ...this.startPos };
  }

  findCell(type) {
    for (let y = 0; y < this.rows; y++)
      for (let x = 0; x < this.cols; x++)
        if (this.grid[y][x] === type) return { x, y };
    return null;
  }

  reset() {
    this.agentPos = { ...this.startPos };
    return this.stateId(this.agentPos);
  }

  stateId({ x, y }) { return y * this.cols + x; }
  posFromId(id) { return { x: id % this.cols, y: Math.floor(id / this.cols) }; }
  numStates() { return this.rows * this.cols; }

  step(actionId) {
    const { dx, dy } = ACTIONS[actionId];
    const nx = this.agentPos.x + dx;
    const ny = this.agentPos.y + dy;

    // Wall or out-of-bounds → stay
    if (nx < 0 || nx >= this.cols || ny < 0 || ny >= this.rows || this.grid[ny][nx] === CELL.WALL) {
      const sid = this.stateId(this.agentPos);
      return { nextState: sid, reward: -0.1, done: false };
    }

    this.agentPos = { x: nx, y: ny };
    const cellType = this.grid[ny][nx];
    const reward = REWARDS[cellType] ?? -0.05;
    const done = cellType === CELL.GOAL || cellType === CELL.TRAP;
    return { nextState: this.stateId(this.agentPos), reward, done };
  }

  isValidPos({ x, y }) {
    return x >= 0 && x < this.cols && y >= 0 && y < this.rows && this.grid[y][x] !== CELL.WALL;
  }
}

// ── Q-Learning agent ──────────────────────────────────────────
export class QLearningAgent {
  constructor(numStates, numActions, params = {}) {
    this.numStates = numStates;
    this.numActions = numActions;
    this.alpha = params.alpha ?? 0.1;      // learning rate
    this.gamma = params.gamma ?? 0.95;     // discount factor
    this.epsilon = params.epsilon ?? 1.0;  // exploration rate
    this.epsilonDecay = params.epsilonDecay ?? 0.995;
    this.epsilonMin = params.epsilonMin ?? 0.05;
    this.Q = Array.from({ length: numStates }, () => new Array(numActions).fill(0));
    this.stepCount = 0;
    this.episodeCount = 0;
    this.totalRewards = [];
    this.episodeLengths = [];
    this.successCount = 0;
  }

  chooseAction(state) {
    if (Math.random() < this.epsilon) {
      return Math.floor(Math.random() * this.numActions);
    }
    return this.Q[state].indexOf(Math.max(...this.Q[state]));
  }

  update(state, action, reward, nextState) {
    const maxNext = Math.max(...this.Q[nextState]);
    const tdTarget = reward + this.gamma * maxNext;
    const tdError = tdTarget - this.Q[state][action];
    this.Q[state][action] += this.alpha * tdError;
    this.stepCount++;
    return Math.abs(tdError);
  }

  decayEpsilon() {
    this.epsilon = Math.max(this.epsilonMin, this.epsilon * this.epsilonDecay);
  }

  endEpisode(totalReward, steps, success) {
    this.totalRewards.push(totalReward);
    this.episodeLengths.push(steps);
    if (success) this.successCount++;
    this.episodeCount++;
    this.decayEpsilon();
  }

  // Best action for each state (for visualization)
  policyGrid(numStates) {
    return Array.from({ length: numStates }, (_, s) => {
      const qs = this.Q[s];
      return qs.indexOf(Math.max(...qs));
    });
  }

  // Max Q-value per state (value function)
  valueGrid(numStates) {
    return Array.from({ length: numStates }, (_, s) =>
      Math.max(...this.Q[s])
    );
  }

  // Recent success rate (last 50 episodes)
  recentSuccessRate() {
    const n = Math.min(50, this.totalRewards.length);
    if (n === 0) return 0;
    const recent = this.totalRewards.slice(-n);
    return recent.filter(r => r > 0).length / n;
  }

  // Smoothed reward
  smoothedRewards(window = 20) {
    const result = [];
    for (let i = 0; i < this.totalRewards.length; i++) {
      const start = Math.max(0, i - window + 1);
      const slice = this.totalRewards.slice(start, i + 1);
      result.push(slice.reduce((a, b) => a + b, 0) / slice.length);
    }
    return result;
  }
}

// ── Auto-generate random environment ─────────────────────────
export function generateRandomEnv(cols = 8, rows = 7, wallDensity = 0.2, trapCount = 2) {
  const grid = Array.from({ length: rows }, () => new Array(cols).fill(CELL.EMPTY));

  // Place start bottom-left, goal top-right
  const start = { x: 0, y: rows - 1 };
  const goal = { x: cols - 1, y: 0 };
  grid[start.y][start.x] = CELL.START;
  grid[goal.y][goal.x] = CELL.GOAL;

  const reserved = new Set([`${start.x},${start.y}`, `${goal.x},${goal.y}`]);
  const randFreeCell = () => {
    let x, y, key;
    let tries = 0;
    do {
      x = Math.floor(Math.random() * cols);
      y = Math.floor(Math.random() * rows);
      key = `${x},${y}`;
      tries++;
    } while (reserved.has(key) && tries < 200);
    return { x, y, key };
  };

  // Place walls
  const wallCount = Math.floor(cols * rows * wallDensity);
  for (let i = 0; i < wallCount; i++) {
    const { x, y, key } = randFreeCell();
    if (!reserved.has(key)) {
      grid[y][x] = CELL.WALL;
      reserved.add(key);
    }
  }

  // Place traps
  for (let i = 0; i < trapCount; i++) {
    const { x, y, key } = randFreeCell();
    if (!reserved.has(key)) {
      grid[y][x] = CELL.TRAP;
      reserved.add(key);
    }
  }

  // Verify path exists with BFS
  if (!hasPath(grid, start, goal, cols, rows)) {
    return generateRandomEnv(cols, rows, wallDensity, trapCount); // retry
  }

  return { cols, rows, grid };
}

function hasPath(grid, start, goal, cols, rows) {
  const visited = new Set();
  const queue = [start];
  visited.add(`${start.x},${start.y}`);
  while (queue.length) {
    const { x, y } = queue.shift();
    if (x === goal.x && y === goal.y) return true;
    for (const { dx, dy } of ACTIONS) {
      const nx = x + dx, ny = y + dy;
      const key = `${nx},${ny}`;
      if (nx >= 0 && nx < cols && ny >= 0 && ny < rows &&
          grid[ny][nx] !== CELL.WALL && !visited.has(key)) {
        visited.add(key);
        queue.push({ x: nx, y: ny });
      }
    }
  }
  return false;
}
