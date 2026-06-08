# RL Visualizer — Q-Learning Grid World

A React web app that visualizes Q-Learning reinforcement learning in real time.

## Features

- **Live Training Visualization**: Watch the agent (purple dot) learn to navigate the grid
- **Value Heatmap**: See state values update in real time as the agent learns
- **Policy Arrows**: Display the learned optimal action for each cell
- **3 Environment Modes**:
  - **Preset**: 3 hand-crafted environments (Simple, Maze, Danger Zone)
  - **Auto-Generate**: Randomly generates valid mazes with configurable size/density
  - **Manual Draw**: Click to paint walls, traps, and clear cells on a custom grid
- **Tunable Hyperparameters**: alpha, gamma, epsilon, decay, max steps
- **Live Charts**: Episode reward and steps-per-episode charts with smoothing
- **Q-Table Display**: See exact Q-values for the agent's current state

## Getting Started

```bash
npm install
npm start
```

Open http://localhost:3000

## How to Use

1. **Press "Train"** to start training immediately on the Simple Path preset
2. **Watch** the purple agent explore, and the heatmap fill in with values
3. **After ~200 episodes**, the agent should reliably reach the goal
4. Try switching to the **Maze** or **Danger Zone** preset to see harder tasks
5. Use **Auto-Generate** to create random environments
6. Switch to **Draw Mode** to build your own custom maze

## Algorithm

Q-Learning with epsilon-greedy exploration:

```
Q(s,a) ← Q(s,a) + α [r + γ max_a' Q(s',a') − Q(s,a)]
```

- **α** (alpha): learning rate — how fast values update
- **γ** (gamma): discount factor — how much future rewards matter
- **ε** (epsilon): exploration rate — decays from 1.0 to minimum over time

## Rewards

- Goal (🏆): +10
- Trap (💀): -5
- Empty step: -0.05
- Wall collision: -0.1

## Project Structure

```
src/
├── engine/
│   └── rlEngine.js        # Q-Learning agent + GridEnvironment + presets
├── hooks/
│   └── useRLTraining.js   # Training loop (requestAnimationFrame) + state mgmt
├── components/
│   ├── GridView.jsx        # Grid renderer with heatmap + policy overlay
│   ├── ControlPanel.jsx    # Left sidebar: controls, params, env builder
│   ├── StatsPanel.jsx      # Right sidebar: stats, charts, Q-table
│   └── Charts.jsx          # Canvas-based reward/length charts
└── App.js                  # Main layout + header
```
