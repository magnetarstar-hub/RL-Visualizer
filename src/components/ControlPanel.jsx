import React, { useState } from 'react';
import { CELL, PRESETS } from '../engine/rlEngine';

const BRUSH_OPTIONS = [
  { type: CELL.WALL, label: '🧱 Wall', color: '#2d3748' },
  { type: CELL.TRAP, label: '💀 Trap', color: '#3d0d0d' },
  { type: CELL.EMPTY, label: '⬜ Clear', color: '#0d1117' },
];

function Slider({ label, value, min, max, step = 0.001, format, onChange }) {
  const display = format ? format(value) : value;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.7)', fontFamily: 'monospace' }}>{label}</span>
        <span style={{ fontSize: 11, color: '#818cf8', fontFamily: 'monospace' }}>{display}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#818cf8' }}
      />
    </div>
  );
}

function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{
      display: 'flex',
      background: '#0d1117',
      borderRadius: 8,
      padding: 3,
      gap: 2,
      marginBottom: 16,
      border: '1px solid #1e2a3a',
    }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            flex: 1,
            padding: '6px 8px',
            borderRadius: 6,
            border: 'none',
            background: active === t.id ? '#1e2a3a' : 'transparent',
            color: active === t.id ? '#c4b5fd' : 'rgba(148,163,184,0.5)',
            fontSize: 12,
            cursor: 'pointer',
            fontFamily: 'monospace',
            transition: 'all 0.15s',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: 10,
        color: 'rgba(148,163,184,0.4)',
        fontFamily: 'monospace',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginBottom: 10,
        paddingBottom: 4,
        borderBottom: '1px solid #1e2a3a',
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

export default function ControlPanel({
  isRunning,
  speed, setSpeed,
  params, updateParam,
  envMode, setEnvMode,
  selectedPreset,
  manualGrid,
  brushCell, setBrushCell,
  onStart, onStop, onReset,
  onLoadPreset,
  onGenerateAuto,
  onApplyManual,
  onResizeManual,
  showHeatmap, setShowHeatmap,
  showPolicy, setShowPolicy,
}) {
  const [autoRows, setAutoRows] = useState(7);
  const [autoCols, setAutoCols] = useState(8);
  const [autoWalls, setAutoWalls] = useState(0.22);
  const [autoTraps, setAutoTraps] = useState(3);

  return (
    <div style={{
      width: 260,
      minWidth: 260,
      background: '#0a0f1a',
      borderRight: '1px solid #1e2a3a',
      padding: 16,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
    }}>

      {/* ── Training Controls ── */}
      <Section title="Training">
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          <button
            onClick={isRunning ? onStop : onStart}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: 6,
              border: 'none',
              background: isRunning ? '#3d0d0d' : '#0d3d1e',
              color: isRunning ? '#fca5a5' : '#6ee7b7',
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontWeight: 600,
            }}
          >
            {isRunning ? '⏸ Pause' : '▶ Train'}
          </button>
          <button
            onClick={onReset}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #1e2a3a',
              background: 'transparent',
              color: 'rgba(148,163,184,0.6)',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'monospace',
            }}
          >
            ↺
          </button>
        </div>

        <Slider
          label="Speed"
          value={speed}
          min={10} max={500} step={10}
          format={v => `${v}ms`}
          onChange={setSpeed}
        />
        <Slider
          label="Steps/frame"
          value={params.stepsPerFrame}
          min={1} max={50} step={1}
          format={v => `${v}x`}
          onChange={v => updateParam('stepsPerFrame', v)}
        />
      </Section>

      {/* ── Visualization ── */}
      <Section title="Visualization">
        {[
          { key: 'heatmap', label: '🌡 Value Heatmap', val: showHeatmap, set: setShowHeatmap },
          { key: 'policy', label: '→ Policy Arrows', val: showPolicy, set: setShowPolicy },
        ].map(({ key, label, val, set }) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
            <div
              onClick={() => set(v => !v)}
              style={{
                width: 32, height: 18, borderRadius: 9,
                background: val ? '#6d28d9' : '#1e2a3a',
                position: 'relative',
                transition: 'background 0.2s',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <div style={{
                position: 'absolute',
                top: 2, left: val ? 16 : 2,
                width: 14, height: 14,
                borderRadius: '50%',
                background: '#fff',
                transition: 'left 0.2s',
              }} />
            </div>
            <span style={{ fontSize: 12, color: 'rgba(148,163,184,0.75)', fontFamily: 'monospace' }}>{label}</span>
          </label>
        ))}
      </Section>

      {/* ── Hyperparameters ── */}
      <Section title="Hyperparameters">
        <Slider label="Learning Rate (α)" value={params.alpha} min={0.01} max={0.5} step={0.01} format={v => v.toFixed(2)} onChange={v => updateParam('alpha', v)} />
        <Slider label="Discount (γ)" value={params.gamma} min={0.5} max={0.999} step={0.001} format={v => v.toFixed(3)} onChange={v => updateParam('gamma', v)} />
        <Slider label="ε Decay" value={params.epsilonDecay} min={0.9} max={0.9999} step={0.0001} format={v => v.toFixed(4)} onChange={v => updateParam('epsilonDecay', v)} />
        <Slider label="ε Min" value={params.epsilonMin} min={0.01} max={0.3} step={0.01} format={v => v.toFixed(2)} onChange={v => updateParam('epsilonMin', v)} />
        <Slider label="Max Steps/Ep" value={params.maxStepsPerEpisode} min={50} max={500} step={10} format={v => `${v}`} onChange={v => updateParam('maxStepsPerEpisode', v)} />
      </Section>

      {/* ── Environment ── */}
      <Section title="Environment">
        <TabBar
          tabs={[
            { id: 'preset', label: '📦 Preset' },
            { id: 'auto', label: '🎲 Auto' },
            { id: 'manual', label: '✏️ Draw' },
          ]}
          active={envMode}
          onChange={setEnvMode}
        />

        {envMode === 'preset' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Object.entries(PRESETS).map(([key, p]) => (
              <button
                key={key}
                onClick={() => onLoadPreset(key)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: `1px solid ${selectedPreset === key ? '#4c1d95' : '#1e2a3a'}`,
                  background: selectedPreset === key ? '#1a0d3a' : 'transparent',
                  color: selectedPreset === key ? '#c4b5fd' : 'rgba(148,163,184,0.6)',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}

        {envMode === 'auto' && (
          <div>
            <Slider label="Columns" value={autoCols} min={5} max={14} step={1} format={v => `${v}`} onChange={setAutoCols} />
            <Slider label="Rows" value={autoRows} min={4} max={10} step={1} format={v => `${v}`} onChange={setAutoRows} />
            <Slider label="Wall Density" value={autoWalls} min={0.05} max={0.4} step={0.01} format={v => `${Math.round(v*100)}%`} onChange={setAutoWalls} />
            <Slider label="Traps" value={autoTraps} min={0} max={8} step={1} format={v => `${v}`} onChange={setAutoTraps} />
            <button
              onClick={() => onGenerateAuto(autoCols, autoRows, autoWalls, autoTraps)}
              style={{
                width: '100%', padding: '8px 0', borderRadius: 6,
                border: 'none', background: '#0d2d5e',
                color: '#93c5fd', fontSize: 12, cursor: 'pointer',
                fontFamily: 'monospace', fontWeight: 600, marginTop: 4,
              }}
            >
              🎲 Generate
            </button>
          </div>
        )}

        {envMode === 'manual' && (
          <div>
            <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)', fontFamily: 'monospace', marginBottom: 8 }}>
              Brush Tool:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
              {BRUSH_OPTIONS.map(b => (
                <button
                  key={b.type}
                  onClick={() => setBrushCell(b.type)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: `1px solid ${brushCell === b.type ? '#6d28d9' : '#1e2a3a'}`,
                    background: brushCell === b.type ? '#2d1a5e' : 'transparent',
                    color: brushCell === b.type ? '#c4b5fd' : 'rgba(148,163,184,0.6)',
                    fontSize: 12,
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                    textAlign: 'left',
                  }}
                >
                  {b.label}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)', fontFamily: 'monospace', marginBottom: 6 }}>
              Grid Size:
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {[
                { label: 'Cols', val: manualGrid?.cols ?? 6, min: 4, max: 14, setter: v => onResizeManual(v, manualGrid?.rows) },
                { label: 'Rows', val: manualGrid?.rows ?? 5, min: 3, max: 10, setter: v => onResizeManual(manualGrid?.cols, v) },
              ].map(({ label, val, min, max, setter }) => (
                <div key={label} style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.4)', fontFamily: 'monospace', marginBottom: 3 }}>{label}</div>
                  <input
                    type="number" value={val} min={min} max={max}
                    onChange={e => setter(Number(e.target.value))}
                    style={{
                      width: '100%', padding: '4px 6px', borderRadius: 5,
                      border: '1px solid #1e2a3a', background: '#0d1117',
                      color: '#e2e8f0', fontFamily: 'monospace', fontSize: 12,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              ))}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.35)', fontFamily: 'monospace', marginBottom: 8 }}>
              🚩 Start (bottom-left) and 🏆 Goal (top-right) are fixed.
            </div>
            <button
              onClick={onApplyManual}
              style={{
                width: '100%', padding: '8px 0', borderRadius: 6,
                border: 'none', background: '#0d2d5e',
                color: '#93c5fd', fontSize: 12, cursor: 'pointer',
                fontFamily: 'monospace', fontWeight: 600,
              }}
            >
              ✓ Apply & Reset
            </button>
          </div>
        )}
      </Section>

    </div>
  );
}
