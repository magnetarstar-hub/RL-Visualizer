import React, { useState } from 'react';
import { useRLTraining } from './hooks/useRLTraining';
import GridView from './components/GridView';
import ControlPanel from './components/ControlPanel';
import StatsPanel from './components/StatsPanel';
import './App.css';

export default function App() {
  const rl = useRLTraining();
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showPolicy, setShowPolicy] = useState(true);

  const isManualMode = rl.envMode === 'manual';

  return (
    <div style={{
      minHeight: '100vh',
      background: '#060a12',
      color: '#e2e8f0',
      fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* Header */}
      <header style={{
        height: 52,
        background: '#0a0f1a',
        borderBottom: '1px solid #1e2a3a',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 16,
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'linear-gradient(135deg, #6d28d9, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14,
          }}>
            🧠
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.02em' }}>
              RL Visualizer
            </div>
            <div style={{ fontSize: 9, color: 'rgba(148,163,184,0.4)', letterSpacing: '0.1em' }}>
              Q-LEARNING · GRID WORLD
            </div>
          </div>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {rl.snapshot && (
            <>
              <Pill label="Episode" value={rl.snapshot.episode.toLocaleString()} />
              <Pill label="epsilon" value={`${(rl.snapshot.epsilon * 100).toFixed(0)}%`} color={rl.isRunning ? '#f59e0b' : '#818cf8'} />
              <Pill label="Success" value={`${Math.round(rl.snapshot.recentSuccess * 100)}%`} color={rl.snapshot.recentSuccess > 0.5 ? '#34d399' : '#f87171'} />
            </>
          )}
          <StatusDot running={rl.isRunning} />
        </div>
      </header>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* Left panel */}
        <ControlPanel
          isRunning={rl.isRunning}
          speed={rl.speed} setSpeed={rl.setSpeed}
          params={rl.params} updateParam={rl.updateParam}
          envMode={rl.envMode} setEnvMode={rl.setEnvMode}
          selectedPreset={rl.selectedPreset}
          manualGrid={rl.manualGrid}
          brushCell={rl.brushCell} setBrushCell={rl.setBrushCell}
          onStart={rl.startTraining}
          onStop={rl.stopTraining}
          onReset={rl.resetTraining}
          onLoadPreset={rl.loadPreset}
          onGenerateAuto={rl.generateAuto}
          onApplyManual={rl.applyManualGrid}
          onResizeManual={rl.resizeManualGrid}
          showHeatmap={showHeatmap} setShowHeatmap={setShowHeatmap}
          showPolicy={showPolicy} setShowPolicy={setShowPolicy}
        />

        {/* Center - Grid */}
        <main style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          gap: 16,
          overflow: 'auto',
          minWidth: 0,
        }}>

          {/* Mode badge */}
          <div style={{ alignSelf: 'flex-start', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{
              fontSize: 10,
              fontFamily: 'monospace',
              color: isManualMode ? '#fbbf24' : '#818cf8',
              background: isManualMode ? 'rgba(251,191,36,0.1)' : 'rgba(129,140,248,0.1)',
              border: `1px solid ${isManualMode ? 'rgba(251,191,36,0.2)' : 'rgba(129,140,248,0.2)'}`,
              padding: '3px 10px',
              borderRadius: 100,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              {isManualMode ? 'Draw Mode' : rl.isRunning ? 'Training' : 'Paused'}
            </span>
            {isManualMode && (
              <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.4)', fontFamily: 'monospace' }}>
                Click cells to paint, then Apply to train
              </span>
            )}
          </div>

          {/* Grid */}
          <div style={{
            background: '#0a0f1a',
            border: '1px solid #1e2a3a',
            borderRadius: 12,
            padding: 20,
            boxShadow: '0 0 40px rgba(99,102,241,0.06)',
          }}>
            <GridView
              snapshot={rl.snapshot}
              showHeatmap={showHeatmap}
              showPolicy={showPolicy}
              manualMode={isManualMode}
              manualGrid={rl.manualGrid}
              brushCell={rl.brushCell}
              onCellClick={rl.toggleManualCell}
            />
          </div>

          {/* Info bar */}
          {rl.snapshot && !isManualMode && (
            <div style={{
              display: 'flex',
              gap: 20,
              fontSize: 11,
              fontFamily: 'monospace',
              color: 'rgba(148,163,184,0.45)',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}>
              <span>Agent: ({rl.snapshot.agentPos && rl.snapshot.agentPos.x}, {rl.snapshot.agentPos && rl.snapshot.agentPos.y})</span>
              <span>Grid: {rl.snapshot.cols} x {rl.snapshot.rows}</span>
              <span>States: {rl.snapshot.cols * rl.snapshot.rows}</span>
              <span>Q-table: {rl.snapshot.cols * rl.snapshot.rows} x 4 actions</span>
            </div>
          )}

          {/* RL explanation card */}
          <div style={{
            maxWidth: 560,
            width: '100%',
            background: '#0a0f1a',
            border: '1px solid #1e2a3a',
            borderRadius: 10,
            padding: '12px 16px',
          }}>
            <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.4)', fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              How Q-Learning Works
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                ['🎲', 'Agent explores randomly at first (epsilon-greedy policy)'],
                ['🔄', 'Each step updates Q(s,a) toward observed reward + future value'],
                ['📉', 'Epsilon decays over time: more exploitation, less exploration'],
                ['🏆', 'Eventually learns the optimal path to reach the goal'],
              ].map(([icon, text]) => (
                <div key={text} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 12, flexShrink: 0 }}>{icon}</span>
                  <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.55)', fontFamily: 'monospace', lineHeight: 1.5 }}>{text}</span>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: 10,
              padding: '6px 10px',
              background: '#060a12',
              borderRadius: 6,
              fontFamily: 'monospace',
              fontSize: 11,
              color: '#818cf8',
              border: '1px solid #1e2a3a',
            }}>
              Q(s,a) = Q(s,a) + alpha * [r + gamma * max Q(s',*) - Q(s,a)]
            </div>
          </div>
        </main>

        {/* Right panel */}
        <StatsPanel snapshot={rl.snapshot} params={rl.params} />
      </div>
    </div>
  );
}

function Pill({ label, value, color = '#818cf8' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      background: '#0d1117', border: '1px solid #1e2a3a',
      borderRadius: 6, padding: '3px 10px',
    }}>
      <span style={{ fontSize: 9, color: 'rgba(148,163,184,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color }}>{value}</span>
    </div>
  );
}

function StatusDot({ running }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{
        width: 7, height: 7, borderRadius: '50%',
        background: running ? '#34d399' : '#374151',
        boxShadow: running ? '0 0 6px #34d399' : 'none',
      }} />
      <span style={{ fontSize: 10, color: 'rgba(148,163,184,0.4)', letterSpacing: '0.06em' }}>
        {running ? 'LEARNING' : 'IDLE'}
      </span>
    </div>
  );
}
