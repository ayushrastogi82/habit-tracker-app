/**
 * Draws the shareable habit card directly onto a Canvas using the 2D API.
 * Returns the canvas element (not yet converted to blob).
 *
 * This bypasses html2canvas entirely — no DOM capture, no font/gradient
 * rendering quirks. Everything is drawn programmatically at 3× pixel density
 * so the result looks crisp on Retina / high-DPI screens.
 */
export function drawCardToCanvas(habit, stat, appUrl) {
  const SCALE = 3;
  const W = 360;
  const H = 500;

  const canvas = document.createElement('canvas');
  canvas.width  = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE, SCALE);

  // ── Computed stats ─────────────────────────────────────────────────────────
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);
  const dates = habit.dates || [];

  // Streak
  const sortedDesc = [...dates].sort().reverse();
  let streakCount = 0;
  if (sortedDesc.length) {
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    const mostRecent = sortedDesc[0];
    if (mostRecent === todayStr || mostRecent === yesterdayStr) {
      streakCount = 1;
      let check = new Date(mostRecent === todayStr ? today : yesterday);
      for (let i = 1; i < sortedDesc.length; i++) {
        check.setDate(check.getDate() - 1);
        if (sortedDesc[i] === check.toISOString().slice(0, 10)) streakCount++;
        else break;
      }
    }
  }

  // Last 7 days
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - 6 + i);
    return d.toISOString().slice(0, 10);
  });
  const last7Logged = last7.map(d => dates.includes(d));
  const last7Count  = last7Logged.filter(Boolean).length;

  // Last 30 days
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - 29 + i);
    return d.toISOString().slice(0, 10);
  });
  const last30Logged = last30.map(d => dates.includes(d));
  const last30Count  = last30Logged.filter(Boolean).length;
  const last30Pct    = Math.round((last30Count / 30) * 100);

  // This month
  const monthStr  = todayStr.slice(0, 7);
  const monthName = today.toLocaleDateString('en-US', { month: 'long' });
  const monthCount = dates.filter(d => d.startsWith(monthStr)).length;
  const daysElapsedThisMonth = today.getDate();
  const monthPct = daysElapsedThisMonth > 0
    ? Math.round((monthCount / daysElapsedThisMonth) * 100)
    : 0;

  // This year
  const yearStr  = todayStr.slice(0, 4);
  const yearCount = dates.filter(d => d.startsWith(yearStr)).length;
  const daysElapsedThisYear =
    Math.floor((today - new Date(today.getFullYear(), 0, 1)) / 86400000) + 1;
  const yearPct = daysElapsedThisYear > 0
    ? Math.round((yearCount / daysElapsedThisYear) * 100)
    : 0;

  const typeLabel =
    habit.type === 'weekly' ? 'Weekly' :
    habit.type === 'monthly' ? 'Monthly' : 'Daily';

  // ── Helpers ────────────────────────────────────────────────────────────────
  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function truncate(text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) return text;
    while (text.length > 1 && ctx.measureText(text + '…').width > maxWidth) {
      text = text.slice(0, -1);
    }
    return text + '…';
  }

  const SYS = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

  // ── Background ─────────────────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0f172a');
  bg.addColorStop(1, '#1e1b4b');
  ctx.fillStyle = bg;
  rr(0, 0, W, H, 24);
  ctx.fill();

  // ── Dot grid ───────────────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(99,102,241,0.18)';
  for (let x = 12; x < W; x += 24) {
    for (let y = 12; y < H; y += 24) {
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Brand ──────────────────────────────────────────────────────────────────
  const brandGrad = ctx.createLinearGradient(32, 32, 56, 56);
  brandGrad.addColorStop(0, '#6366f1');
  brandGrad.addColorStop(1, '#4f46e5');
  ctx.fillStyle = brandGrad;
  rr(32, 32, 24, 24, 6);
  ctx.fill();

  ctx.fillStyle = 'white';
  ctx.font = `800 13px ${SYS}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('H', 44, 44.5);

  ctx.fillStyle = 'rgba(165,180,252,0.85)';
  ctx.font = `600 10.5px ${SYS}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('HABIT TRACKER', 64, 44);

  // ── Habit name + type ──────────────────────────────────────────────────────
  ctx.fillStyle = 'white';
  ctx.font = `800 26px ${SYS}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(truncate(habit.name, W - 64), 32, 108);

  ctx.fillStyle = 'rgba(165,180,252,0.7)';
  ctx.font = `500 13px ${SYS}`;
  ctx.fillText(typeLabel, 32, 128);

  // ── Hero stat (vertically centred between y=150 and y=415) ─────────────────
  const heroMid = 283; // midpoint between 150 and 415

  if (stat === 'streak') {
    // Flame emoji
    ctx.font = '54px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔥', W / 2, heroMid - 65);

    ctx.fillStyle = 'white';
    ctx.font = `800 80px ${SYS}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(streakCount), W / 2, heroMid + 12);

    ctx.fillStyle = 'rgba(203,213,225,0.7)';
    ctx.font = `500 16px ${SYS}`;
    ctx.fillText('day streak', W / 2, heroMid + 64);
  }

  if (stat === '7days') {
    // Count / 7
    ctx.fillStyle = 'white';
    ctx.font = `800 64px ${SYS}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const countW = ctx.measureText(String(last7Count)).width;
    const slashX  = W / 2 - countW / 2 - 2;
    ctx.fillText(String(last7Count), W / 2 - 22, heroMid - 52);

    ctx.fillStyle = 'rgba(203,213,225,0.45)';
    ctx.font = `600 32px ${SYS}`;
    ctx.textBaseline = 'middle';
    ctx.fillText('/7', W / 2 + countW / 2 - 10, heroMid - 52);

    ctx.fillStyle = 'rgba(203,213,225,0.7)';
    ctx.font = `500 14px ${SYS}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('days this week', W / 2, heroMid - 4);

    // 7 dots
    const dotR  = 14;
    const gap   = 8;
    const total = 7 * (dotR * 2) + 6 * gap;
    const sx    = (W - total) / 2 + dotR;
    const dotY  = heroMid + 48;
    last7Logged.forEach((logged, i) => {
      const cx = sx + i * (dotR * 2 + gap);
      ctx.beginPath();
      ctx.arc(cx, dotY, dotR, 0, Math.PI * 2);
      if (logged) {
        const g = ctx.createRadialGradient(cx, dotY - 4, 2, cx, dotY, dotR);
        g.addColorStop(0, '#34d399');
        g.addColorStop(1, '#10b981');
        ctx.fillStyle = g;
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
        return;
      }
      ctx.fill();
      // Check mark
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - 5, dotY);
      ctx.lineTo(cx - 1, dotY + 4);
      ctx.lineTo(cx + 5, dotY - 4);
      ctx.stroke();
    });
  }

  if (stat === '30days') {
    ctx.fillStyle = 'white';
    ctx.font = `800 80px ${SYS}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(last30Count), W / 2, heroMid - 70);

    ctx.fillStyle = 'rgba(203,213,225,0.7)';
    ctx.font = `500 16px ${SYS}`;
    ctx.fillText('days in last 30', W / 2, heroMid - 20);

    // 10 × 3 grid
    const dW = 22, dH = 22, dR = 4, gX = 6, gY = 6;
    const gridW = 10 * dW + 9 * gX;
    const gridH = 3  * dH + 2 * gY;
    const gx0 = (W - gridW) / 2;
    const gy0 = heroMid + 2;

    last30Logged.forEach((logged, i) => {
      const col = i % 10;
      const row = Math.floor(i / 10);
      const x = gx0 + col * (dW + gX);
      const y = gy0 + row * (dH + gY);
      if (logged) {
        const g = ctx.createLinearGradient(x, y, x + dW, y + dH);
        g.addColorStop(0, '#6366f1');
        g.addColorStop(1, '#818cf8');
        ctx.fillStyle = g;
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
      }
      rr(x, y, dW, dH, dR);
      ctx.fill();
    });

    ctx.fillStyle = 'rgba(165,180,252,0.85)';
    ctx.font = `600 14px ${SYS}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${last30Pct}% consistency`, W / 2, gy0 + gridH + 18);
  }

  if (stat === 'month' || stat === 'year') {
    const count   = stat === 'month' ? monthCount : yearCount;
    const label   = stat === 'month' ? `days in ${monthName}` : `days in ${yearStr}`;
    const pct     = stat === 'month' ? monthPct : yearPct;

    ctx.fillStyle = 'white';
    ctx.font = `800 80px ${SYS}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(count), W / 2, heroMid - 56);

    ctx.fillStyle = 'rgba(203,213,225,0.7)';
    ctx.font = `500 16px ${SYS}`;
    ctx.fillText(label, W / 2, heroMid - 4);

    // Progress bar
    const barW = 200, barH = 6, barR = 3;
    const barX = (W - barW) / 2;
    const barY = heroMid + 24;
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    rr(barX, barY, barW, barH, barR);
    ctx.fill();
    if (pct > 0) {
      const fg = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      fg.addColorStop(0, '#6366f1');
      fg.addColorStop(1, '#818cf8');
      ctx.fillStyle = fg;
      rr(barX, barY, barW * pct / 100, barH, barR);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(165,180,252,0.85)';
    ctx.font = `600 14px ${SYS}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${pct}% consistency`, W / 2, heroMid + 52);
  }

  // ── Divider ────────────────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(32, 438, W - 64, 1);

  // ── CTA ────────────────────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(203,213,225,0.6)';
  ctx.font = `400 12px ${SYS}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Start tracking your habits →', 32, 460);

  ctx.fillStyle = '#818cf8';
  ctx.font = `700 13px ${SYS}`;
  ctx.fillText(appUrl, 32, 478);

  return canvas;
}
