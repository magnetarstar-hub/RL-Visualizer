import React, { useMemo } from 'react';
import { CELL, ACTIONS } from '../engine/rlEngine';

const CELL_SIZE = 62;

const CELL_COLORS = {
  [CELL.EMPTY]: '#0d1117',
  [CELL.WALL]: '#1c2333',
  [CELL.START]: '#0d2d5e',
  [CELL.GOAL]: '#0d3d1e',
  [CELL.TRAP]: '#3d0d0d',
};

const CELL_BORDER = {
  [CELL.EMPTY]: '#1e2a3a',
  [CELL.WALL]: '#2d3748',
  [CELL.START]: '#1a4a8a',
  [CELL.GOAL]: '#1a6a3a',
  [CELL.TRAP]: '#8a1a1a',
};

function valueToColor(v, minV, maxV) {
  if (maxV === minV) return 'rgba(99,102,241,0.15)';
  const t = Math.max(0, Math.min(1, (v - minV) / (maxV - minV)));
  if (t < 0.5) {
    const s = t * 2;
    return `rgba(99,102,241,${0.08 + s * 0.35})`;
  } else {
    const s = (t - 0.5) * 2;
    return `rgba(52,211,153,${0.2 + s * 0.45})`;
  }
}

function PolicyArrow({ action, size = 16 }) {
  const label = ACTIONS[action]?.label || '';
  return (
    <span style={{
      fontSize: size,
      color: 'rgba(148,163,184,0.85)',
      lineHeight: 1,
      display: 'block',
      textAlign: 'center',
      fontFamily: 'monospace',
    }}>
      {label}
    </span>
  );
}

export default function GridView({
  snapshot,
  showHeatmap,
  showPolicy,
  manualMode,
  manualGrid,
  brushCell,
  onCellClick,
}) {
  const grid = manualMode ? manualGrid?.grid : snapshot?.grid;
  const cols = manualMode ? manualGrid?.cols : snapshot?.cols;
  const rows = manualMode ? manualGrid?.rows : snapshot?.rows;

  const valueStats = useMemo(() => {
    if (!snapshot?.valueGrid) return { min: 0, max: 1 };
    const vals = snapshot.valueGrid.filter(v => isFinite(v));
    return { min: Math.min(...vals), max: Math.max(...vals) };
  }, [snapshot?.valueGrid]);

  if (!grid || !cols || !rows) return null;

  const width = cols * CELL_SIZE;
  const height = rows * CELL_SIZE;

  return (
    <div style={{ overflowX: 'auto', overflowY: 'auto' }}>
      <div
        style={{
          position: 'relative',
          width,
          height,
          flexShrink: 0,
          borderRadius: 8,
          overflow: 'hidden',
          border: '1px solid #1e2a3a',
        }}
      >
        {grid.map((row, y) =>
          row.map((cellType, x) => {
            const stateId = y * cols + x;
            const isAgent = !manualMode &&
              snapshot?.agentPos?.x === x && snapshot?.agentPos?.y === y;
            const isWall = cellType === CELL.WALL;
            const value = snapshot?.valueGrid?.[stateId] ?? 0;
            const policy = snapshot?.policyGrid?.[stateId];

            const heatColor = (!manualMode && showHeatmap && !isWall)
              ? valueToColor(value, valueStats.min, valueStats.max)
              : 'transparent';

            return (
              <div
                key={`${x}-${y}`}
                onClick={() => manualMode && onCellClick?.(x, y)}
                style={{
                  position: 'absolute',
                  left: x * CELL_SIZE,
                  top: y * CELL_SIZE,
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  background: CELL_COLORS[cellType] || CELL_COLORS[0],
                  border: `1px solid ${CELL_BORDER[cellType] || '#1e2a3a'}`,
                  boxSizing: 'border-box',
                  cursor: manualMode ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  transition: 'background 0.15s',
                  userSelect: 'none',
                }}
              >
                {/* Heatmap overlay */}
                {showHeatmap && !isWall && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: heatColor,
                    transition: 'background 0.3s',
                  }} />
                )}

                {/* Cell content */}
                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                  {cellType === CELL.GOAL && (
                    <span style={{ fontSize: 26 }}>🏆</span>
                  )}
                  {cellType === CELL.START && (
                    <span style={{ fontSize: 22 }}>🚩</span>
                  )}
                  {cellType === CELL.TRAP && (
                    <span style={{ fontSize: 22 }}>💀</span>
                  )}
                  {cellType === CELL.WALL && (
                    <div style={{
                      width: CELL_SIZE - 2,
                      height: CELL_SIZE - 2,
                      background: 'repeating-linear-gradient(45deg, #1c2333 0px, #1c2333 4px, #161e2e 4px, #161e2e 8px)',
                    }} />
                  )}
                </div>

                {/* Policy arrow */}
                {showPolicy && !isWall && !manualMode &&
                  cellType !== CELL.GOAL && cellType !== CELL.TRAP &&
                  policy !== undefined && (
                  <div style={{ position: 'relative', zIndex: 2, marginTop: 2 }}>
                    <PolicyArrow action={policy} size={14} />
                  </div>
                )}

                {/* Value label */}
                {showHeatmap && !isWall && !manualMode &&
                  cellType !== CELL.GOAL && cellType !== CELL.TRAP && (
                  <div style={{
                    position: 'absolute',
                    bottom: 3,
                    right: 4,
                    zIndex: 2,
                    fontSize: 9,
                    color: 'rgba(148,163,184,0.55)',
                    fontFamily: 'monospace',
                  }}>
                    {value.toFixed(2)}
                  </div>
                )}

                {/* Agent */}
                {isAgent && (
                  <div style={{
                    position: 'absolute',
                    zIndex: 10,
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: 'radial-gradient(circle at 35% 35%, #a78bfa, #6d28d9)',
                      boxShadow: '0 0 12px rgba(139,92,246,0.8), 0 0 24px rgba(139,92,246,0.4)',
                      border: '2px solid rgba(196,181,253,0.8)',
                      animation: 'agentPulse 1s ease-in-out infinite alternate',
                    }} />
                  </div>
                )}

                {/* Manual mode brush preview */}
                {manualMode && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0,
                    transition: 'opacity 0.1s',
                    background: 'rgba(139,92,246,0.15)',
                  }}
                    className="cell-hover"
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
