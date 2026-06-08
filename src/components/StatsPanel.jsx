import React from 'react';
import { ACTIONS } from '../engine/rlEngine';
import { RewardChart, LengthChart, EpsilonBar } from './Charts';

function StatCard({ label, value, sub, color = '#818cf8' }) {
  return (
    <div style={{
      background: '#0a0f1a',
      border: '1px solid #1e2a3a',
      borderRadius: 8,
      padding: '10px 12px',
      minWidth: 0,
    }}>
      <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.45)', fontFamily: 'monospace', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color, fontFamily: 'monospace', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.35)', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function QTableMini({ qTable, cols, rows, selectedState }) {
  if (!qTable || qTable.length === 0) return null;
  const state = selectedState ?? 0;
  const qRow = qTable[state] ?? [0, 0, 0, 0];
  const maxQ = Math.max(...qRow);

  return (
    <div>
      <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.4)', fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
        Q-Values (state {state})
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
        {ACTIONS.map((a, i) => {
          const q = qRow[i];
          const isMax = q === maxQ;
          const norm = maxQ !== 0 ? Math.max(0, q / maxQ) : 0;
          return (
            <div key={a.id} style={{
              background: isMax ? '#1a0d3a' : '#0d1117',
              border: `1px solid ${isMax ? '#4c1d95' : '#1e2a3a'}`,
              borderRadius: 6,
              padding: '6px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>{a.label}</span>
              <div style={{ flex: 1 }}>
                <div style={{ height: 4, background: '#1e2a3a', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.round(norm * 100)}%`,
                    background: isMax ? '#818cf8' : '#374151',
                    borderRadius: 2,
                    transition: 'width 0.3s',
                  }} />
                </div>
                <div style={{ fontSize: 9, color: 'rgba(148,163,184,0.5)', fontFamily: 'monospace', marginTop: 2 }}>
                  {q.toFixed(3)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function StatsPanel({ snapshot, params }) {
  if (!snapshot) {
    return (
      <div style={{ padding: 24, color: 'rgba(148,163,184,0.4)', fontFamily: 'monospace', fontSize: 13 }}>
        Press ▶ Train to begin...
      </div>
    );
  }

  const {
    episode, step, epsilon, recentSuccess, successCount,
    rewardHistory, episodeLengths, qTable, cols, rows,
    agentPos,
  } = snapshot;

  const lastReward = rewardHistory[rewardHistory.length - 1] ?? 0;
  const avgLen = episodeLengths.length > 0
    ? Math.round(episodeLengths.slice(-20).reduce((a, b) => a + b, 0) / Math.min(episodeLengths.length, 20))
    : 0;
  const selectedState = agentPos ? agentPos.y * (cols ?? 6) + agentPos.x : 0;

  return (
    <div style={{
      width: 280,
      minWidth: 280,
      background: '#0a0f1a',
      borderLeft: '1px solid #1e2a3a',
      padding: 16,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
    }}>

      {/* Stat Cards */}
      <div>
        <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.4)', fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
          Training Stats
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <StatCard label="Episodes" value={episode.toLocaleString()} color="#818cf8" />
          <StatCard label="Total Steps" value={step > 999 ? `${(step / 1000).toFixed(1)}k` : step} color="#a78bfa" />
          <StatCard label="Successes" value={successCount} color="#34d399" />
          <StatCard label="Success Rate" value={`${Math.round(recentSuccess * 100)}%`} sub="last 50 ep" color={recentSuccess > 0.6 ? '#34d399' : recentSuccess > 0.3 ? '#f59e0b' : '#f87171'} />
          <StatCard label="Last Reward" value={lastReward.toFixed(2)} color={lastReward > 0 ? '#34d399' : '#f87171'} />
          <StatCard label="Avg Steps" value={avgLen} sub="last 20 ep" color="#93c5fd" />
        </div>
      </div>

      {/* Epsilon */}
      <EpsilonBar epsilon={epsilon} />

      {/* Reward Chart */}
      {rewardHistory.length > 1 && <RewardChart snapshot={snapshot} />}

      {/* Steps Chart */}
      {episodeLengths.length > 1 && <LengthChart snapshot={snapshot} />}

      {/* Q-Table */}
      <QTableMini qTable={qTable} cols={cols} rows={rows} selectedState={selectedState} />

      {/* Legend */}
      <div>
        <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.4)', fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
          Legend
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {[
            { color: '#6d28d9', label: 'Agent', desc: 'Current position' },
            { color: '#1a6a3a', label: '🏆 Goal', desc: '+10 reward' },
            { color: '#8a1a1a', label: '💀 Trap', desc: '-5 reward' },
            { color: '#1a4a8a', label: '🚩 Start', desc: 'Reset point' },
          ].map(({ color, label, desc }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.7)', fontFamily: 'monospace' }}>{label}</span>
              <span style={{ fontSize: 10, color: 'rgba(148,163,184,0.35)', fontFamily: 'monospace', marginLeft: 'auto' }}>{desc}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #1e2a3a', paddingTop: 5, marginTop: 3 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 16, height: 6, borderRadius: 2, background: 'linear-gradient(90deg, rgba(99,102,241,0.2), rgba(52,211,153,0.6))' }} />
                <span style={{ fontSize: 10, color: 'rgba(148,163,184,0.4)', fontFamily: 'monospace' }}>Low → High value</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
