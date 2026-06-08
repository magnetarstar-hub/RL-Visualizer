import React, { useRef, useEffect } from 'react';

function drawChart(canvas, data, smoothed, opts = {}) {
  if (!canvas || !data || data.length === 0) return;
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const pad = { top: 12, right: 12, bottom: 28, left: 48 };
  const W = width - pad.left - pad.right;
  const H = height - pad.top - pad.bottom;

  ctx.clearRect(0, 0, width, height);

  const vals = data;
  const minV = opts.min ?? Math.min(...vals);
  const maxV = opts.max ?? Math.max(...vals, minV + 0.001);
  const range = maxV - minV || 1;

  const toX = (i) => pad.left + (i / Math.max(vals.length - 1, 1)) * W;
  const toY = (v) => pad.top + H - ((v - minV) / range) * H;

  // Grid lines
  ctx.strokeStyle = 'rgba(148,163,184,0.07)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (i / 4) * H;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + W, y);
    ctx.stroke();
  }

  // Raw data — thin faded line
  if (vals.length > 1) {
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(99,102,241,0.25)';
    ctx.lineWidth = 1;
    vals.forEach((v, i) => {
      if (i === 0) ctx.moveTo(toX(i), toY(v));
      else ctx.lineTo(toX(i), toY(v));
    });
    ctx.stroke();
  }

  // Smoothed line
  if (smoothed && smoothed.length > 1) {
    ctx.beginPath();
    ctx.strokeStyle = opts.color || '#818cf8';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    smoothed.forEach((v, i) => {
      if (i === 0) ctx.moveTo(toX(i), toY(v));
      else ctx.lineTo(toX(i), toY(v));
    });
    ctx.stroke();

    // Fill under curve
    ctx.beginPath();
    smoothed.forEach((v, i) => {
      if (i === 0) ctx.moveTo(toX(i), toY(v));
      else ctx.lineTo(toX(i), toY(v));
    });
    ctx.lineTo(toX(smoothed.length - 1), pad.top + H);
    ctx.lineTo(toX(0), pad.top + H);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + H);
    const col = opts.color || '#818cf8';
    grad.addColorStop(0, col + '55');
    grad.addColorStop(1, col + '00');
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // Y-axis labels
  ctx.fillStyle = 'rgba(148,163,184,0.55)';
  ctx.font = '10px monospace';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const v = minV + ((4 - i) / 4) * range;
    const y = pad.top + (i / 4) * H;
    ctx.fillText(v.toFixed(1), pad.left - 6, y + 4);
  }

  // X-axis labels
  ctx.textAlign = 'center';
  const step = Math.max(1, Math.floor(vals.length / 5));
  for (let i = 0; i < vals.length; i += step) {
    const x = toX(i);
    ctx.fillText(i + 1, x, pad.top + H + 16);
  }

  // Axis
  ctx.strokeStyle = 'rgba(148,163,184,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad.left, pad.top);
  ctx.lineTo(pad.left, pad.top + H);
  ctx.lineTo(pad.left + W, pad.top + H);
  ctx.stroke();
}

function smooth(arr, w = 15) {
  return arr.map((_, i) => {
    const s = Math.max(0, i - w + 1);
    const slice = arr.slice(s, i + 1);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

export function RewardChart({ snapshot }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !snapshot) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.parentElement.clientWidth;
    canvas.width = w * dpr;
    canvas.height = 140 * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = '140px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    drawChart(canvas, snapshot.rewardHistory, smooth(snapshot.rewardHistory), {
      color: '#818cf8',
    });
  }, [snapshot?.rewardHistory?.length]); // eslint-disable-line

  return (
    <div style={{ width: '100%' }}>
      <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.6)', marginBottom: 4, fontFamily: 'monospace' }}>
        Episode Reward
      </div>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: 140 }} />
    </div>
  );
}

export function LengthChart({ snapshot }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !snapshot) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.parentElement.clientWidth;
    canvas.width = w * dpr;
    canvas.height = 120 * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = '120px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    drawChart(canvas, snapshot.episodeLengths, smooth(snapshot.episodeLengths, 10), {
      color: '#34d399',
      min: 0,
    });
  }, [snapshot?.episodeLengths?.length]); // eslint-disable-line

  return (
    <div style={{ width: '100%' }}>
      <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.6)', marginBottom: 4, fontFamily: 'monospace' }}>
        Steps per Episode
      </div>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: 120 }} />
    </div>
  );
}

export function EpsilonBar({ epsilon }) {
  const pct = Math.round(epsilon * 100);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4, color: 'rgba(148,163,184,0.7)', fontFamily: 'monospace' }}>
        <span>ε Exploration</span>
        <span>{pct}%</span>
      </div>
      <div style={{ height: 6, background: '#1e2a3a', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: `linear-gradient(90deg, #f59e0b, #ef4444)`,
          borderRadius: 3,
          transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  );
}
