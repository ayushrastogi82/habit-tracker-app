/**
 * Draws the shareable habit card directly to a Canvas using the 2D API.
 * Returns the canvas element ready for .toBlob().
 *
 * Layout (360 × 500):
 *   Top area    — habit name (large, centered) + type label
 *   Hero area   — stat-specific content (emoji, number, dots, bars)
 *   Footer      — H logo + "Habit Tracker" + subtitle, all centered
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
  const last30Pct    = Math.min(100, Math.round((last30Count / 30) * 100));

  // Best streak
  let bestStreak = 0;
  if (dates.length) {
    const sorted = [...dates].sort();
    let cur = 1; bestStreak = 1;
    for (let i = 1; i < sorted.length; i++) {
      const diff = (new Date(sorted[i]) - new Date(sorted[i - 1])) / 86400000;
      if (diff === 1)      { cur++; bestStreak = Math.max(bestStreak, cur); }
      else if (diff > 1)   { cur = 1; }
    }
  }

  // All time (since start) — UTC-safe, matches app logic
  const dateToUTC = (s) => { const [y,m,d] = s.split('-').map(Number); return Date.UTC(y, m-1, d); };
  const nowUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const creation = new Date(parseInt(habit.startDate || habit.id));
  const creationUTC = Date.UTC(creation.getFullYear(), creation.getMonth(), creation.getDate());
  const earliestUTC = dates.length ? dateToUTC([...dates].sort()[0]) : creationUTC;
  const startUTC = Math.min(earliestUTC, creationUTC);
  const sinceCount = dates.length;
  const totalDaysSince = Math.max(1, (nowUTC - startUTC) / 86400000 + 1);
  const startDateObj = new Date(startUTC);
  const sinceLabel = startDateObj.toLocaleDateString('en-US',
    { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }
  );
  const sincePct = Math.min(100, Math.round((sinceCount / totalDaysSince) * 100));

  // This month
  const monthStr  = todayStr.slice(0, 7);
  const monthName = today.toLocaleDateString('en-US', { month: 'long' });
  const monthCount = dates.filter(d => d.startsWith(monthStr)).length;
  const daysElapsedThisMonth = today.getDate();
  const monthPct = daysElapsedThisMonth > 0
    ? Math.min(100, Math.round((monthCount / daysElapsedThisMonth) * 100)) : 0;

  // This year
  const yearStr  = todayStr.slice(0, 4);
  const yearCount = dates.filter(d => d.startsWith(yearStr)).length;
  const daysElapsedThisYear =
    Math.floor((today - new Date(today.getFullYear(), 0, 1)) / 86400000) + 1;
  const yearPct = daysElapsedThisYear > 0
    ? Math.min(100, Math.round((yearCount / daysElapsedThisYear) * 100)) : 0;

  const wTarget = habit.weeklyTarget || 3;
  const mTarget = habit.monthlyTarget || 1;
  const typeLabel =
    habit.type === 'weekly'  ? `Weekly habit · ${wTarget}/wk`  :
    habit.type === 'monthly' ? `Monthly habit · ${mTarget}/mo` : 'Daily habit';

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

  // ── Background — top lighter indigo → bottom near-black ───────────────────
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0,    '#312e81');   // indigo-900 — lighter at top
  bg.addColorStop(0.35, '#1e1b4b');   // indigo-950
  bg.addColorStop(0.70, '#0d0c24');   // near-black purple
  bg.addColorStop(1,    '#05050f');   // almost black
  ctx.fillStyle = bg;
  rr(0, 0, W, H, 24);
  ctx.fill();

  // ── Dot grid ───────────────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(99,102,241,0.15)';
  for (let x = 12; x < W; x += 24) {
    for (let y = 12; y < H; y += 24) {
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Habit name (centered, large) ───────────────────────────────────────────
  ctx.fillStyle = 'white';
  ctx.font = `800 30px ${SYS}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(truncate(habit.name, W - 48), W / 2, 78);

  // ── Type label (centered, muted) ───────────────────────────────────────────
  ctx.fillStyle = 'rgba(165,180,252,0.65)';
  ctx.font = `500 13px ${SYS}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(typeLabel, W / 2, 100);

  // ── Hero stat section (centred between y=110 and y=400) ────────────────────
  const heroMid = 258;

  if (stat === 'streak') {
    ctx.font = '70px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔥', W / 2, heroMid - 72);

    ctx.fillStyle = 'white';
    ctx.font = `800 86px ${SYS}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(streakCount), W / 2, heroMid + 16);

    ctx.fillStyle = 'rgba(203,213,225,0.7)';
    ctx.font = `500 16px ${SYS}`;
    ctx.fillText('day streak', W / 2, heroMid + 72);
  }

  if (stat === '7days') {
    const label = 'last 7 days';

    // Big number
    ctx.fillStyle = 'white';
    ctx.font = `800 86px ${SYS}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(last7Count), W / 2, heroMid - 52);

    // Subtitle
    ctx.fillStyle = 'rgba(203,213,225,0.7)';
    ctx.font = `500 16px ${SYS}`;
    ctx.fillText(label, W / 2, heroMid + 10);

    // 7 dots
    const dotR = 15, gap = 10;
    const total = 7 * (dotR * 2) + 6 * gap;
    const sx = (W - total) / 2 + dotR;
    const dotY = heroMid + 52;
    last7Logged.forEach((logged, i) => {
      const cx = sx + i * (dotR * 2 + gap);
      ctx.beginPath();
      ctx.arc(cx, dotY, dotR, 0, Math.PI * 2);
      if (logged) {
        const g = ctx.createRadialGradient(cx, dotY - 4, 2, cx, dotY, dotR);
        g.addColorStop(0, '#34d399');
        g.addColorStop(1, '#10b981');
        ctx.fillStyle = g;
        ctx.fill();
        ctx.strokeStyle = 'white'; ctx.lineWidth = 2;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - 5, dotY); ctx.lineTo(cx - 1, dotY + 5); ctx.lineTo(cx + 5, dotY - 5);
        ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1;
        ctx.stroke();
      }
    });
  }

  if (stat === '30days') {
    ctx.fillStyle = 'white';
    ctx.font = `800 86px ${SYS}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(last30Count), W / 2, heroMid - 68);

    ctx.fillStyle = 'rgba(203,213,225,0.7)';
    ctx.font = `500 16px ${SYS}`;
    ctx.fillText('days in last 30', W / 2, heroMid - 18);

    const dW = 22, dH = 22, dR = 4, gX = 6, gY = 6;
    const gridW = 10 * dW + 9 * gX;
    const gridH = 3  * dH + 2 * gY;
    const gx0 = (W - gridW) / 2;
    const gy0 = heroMid + 6;
    last30Logged.forEach((logged, i) => {
      const col = i % 10, row = Math.floor(i / 10);
      const x = gx0 + col * (dW + gX);
      const y = gy0 + row * (dH + gY);
      if (logged) {
        const g = ctx.createLinearGradient(x, y, x + dW, y + dH);
        g.addColorStop(0, '#6366f1'); g.addColorStop(1, '#818cf8');
        ctx.fillStyle = g;
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
      }
      rr(x, y, dW, dH, dR); ctx.fill();
    });

    ctx.fillStyle = 'rgba(165,180,252,0.85)';
    ctx.font = `600 14px ${SYS}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`${last30Pct}% consistency`, W / 2, gy0 + gridH + 18);
  }

  if (stat === 'best') {
    ctx.font = '70px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏆', W / 2, heroMid - 72);

    ctx.fillStyle = 'white';
    ctx.font = `800 86px ${SYS}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(bestStreak), W / 2, heroMid + 16);

    ctx.fillStyle = 'rgba(203,213,225,0.7)';
    ctx.font = `500 16px ${SYS}`;
    ctx.fillText('day best streak', W / 2, heroMid + 72);
  }

  if (stat === 'since') {
    // Rocket emoji
    ctx.font = '70px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🌟', W / 2, heroMid - 72);

    // Big count — same size as other cards
    ctx.fillStyle = 'white';
    ctx.font = `800 86px ${SYS}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(sinceCount), W / 2, heroMid + 16);

    // "days since May 1, 2024"
    ctx.fillStyle = 'rgba(203,213,225,0.7)';
    ctx.font = `500 16px ${SYS}`;
    ctx.textAlign = 'center';
    ctx.fillText(`days since ${sinceLabel}`, W / 2, heroMid + 72);
  }

  if (stat === 'month' || stat === 'year') {
    const count = stat === 'month' ? monthCount : yearCount;
    const label = stat === 'month' ? `days in ${monthName}` : `days in ${yearStr}`;
    const pct   = stat === 'month' ? monthPct : yearPct;

    ctx.fillStyle = 'white';
    ctx.font = `800 86px ${SYS}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(count), W / 2, heroMid - 52);

    ctx.fillStyle = 'rgba(203,213,225,0.7)';
    ctx.font = `500 16px ${SYS}`;
    ctx.fillText(label, W / 2, heroMid - 2);

    const barW = 200, barH = 6, barR = 3;
    const barX = (W - barW) / 2, barY = heroMid + 26;
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    rr(barX, barY, barW, barH, barR); ctx.fill();
    if (pct > 0) {
      const fg = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      fg.addColorStop(0, '#6366f1'); fg.addColorStop(1, '#818cf8');
      ctx.fillStyle = fg;
      rr(barX, barY, barW * pct / 100, barH, barR); ctx.fill();
    }

    ctx.fillStyle = 'rgba(165,180,252,0.85)';
    ctx.font = `600 14px ${SYS}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`${pct}% consistency`, W / 2, heroMid + 52);
  }

  if (stat === 'heatmap') {
    // Dynamic grid width: use whichever is earlier — habit creation date OR first logged date
    const habitCreation = new Date(parseInt(habit.startDate || habit.id));
    const earliestDateStr = dates.length ? [...dates].sort()[0] : null;
    let earliestDay = habitCreation;
    if (earliestDateStr) {
      const [ey, em, ed] = earliestDateStr.split('-').map(Number);
      const logDate = new Date(ey, em - 1, ed);
      if (logDate < earliestDay) earliestDay = logDate;
    }
    const daysOld = Math.ceil((today - earliestDay) / 86400000);
    const weeksOld = Math.ceil(daysOld / 7);
    const totalWeeks = Math.min(15, Math.max(1, weeksOld));
    const weekLabel = totalWeeks === 1 ? 'last week' : `last ${totalWeeks} weeks`;

    const dow = today.getDay();
    const startDay = new Date(today);
    startDay.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1) - (totalWeeks - 1) * 7);

    const grid = Array.from({ length: totalWeeks }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => {
        const date = new Date(startDay);
        date.setDate(startDay.getDate() + w * 7 + d);
        const ds = date.toISOString().slice(0, 10);
        return { logged: dates.includes(ds), isFuture: ds > todayStr };
      })
    );

    const dotW = 14, dotH = 14, dotR = 3, gapX = 3, gapY = 3;
    const gridW = totalWeeks * dotW + (totalWeeks - 1) * gapX;
    const gridH = 7 * dotH + 6 * gapY;  // 116
    const gx0 = (W - gridW) / 2;
    const gy0 = heroMid - gridH / 2 - 28;

    grid.forEach((week, wi) => {
      week.forEach((day, di) => {
        if (day.isFuture) return;
        const x = gx0 + wi * (dotW + gapX);
        const y = gy0 + di * (dotH + gapY);
        if (day.logged) {
          const g = ctx.createLinearGradient(x, y, x + dotW, y + dotH);
          g.addColorStop(0, '#6366f1'); g.addColorStop(1, '#818cf8');
          ctx.fillStyle = g;
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.08)';
        }
        rr(x, y, dotW, dotH, dotR); ctx.fill();
      });
    });

    const heatmapCount = grid.flat().filter(d => !d.isFuture && d.logged).length;
    ctx.fillStyle = 'white';
    ctx.font = `700 19px ${SYS}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`${heatmapCount} ${heatmapCount === 1 ? 'day' : 'days'} in ${weekLabel}`, W / 2, gy0 + gridH + 26);

    ctx.fillStyle = 'rgba(165,180,252,0.7)';
    ctx.font = `500 13px ${SYS}`;
    ctx.fillText('The pattern of showing up.', W / 2, gy0 + gridH + 50);
  }

  if (stat === 'milestone') {
    const MILESTONES = [7, 21, 30, 50, 100, 200, 365];
    const MILESTONE_COPY = {
      7:   ['Most people quit by day 3.', "You're still here."],
      21:  ['21 days in.', "You're building something real."],
      30:  ['A month.', 'This is becoming part of who you are.'],
      50:  ['50 days.', 'Quiet consistency is underrated.'],
      100: ["100 days. That's not a streak —", "that's a lifestyle."],
      200: ['200 days. You showed up more', 'than most people ever will.'],
      365: ['A full year. Some people start habits.', 'You built one.'],
    };
    const lastMilestone = [...MILESTONES].reverse().find(m => m <= dates.length) || null;
    const nextMilestone = MILESTONES.find(m => m > dates.length);

    if (lastMilestone) {
      ctx.fillStyle = 'white';
      ctx.font = `800 86px ${SYS}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(lastMilestone), W / 2, heroMid - 40);

      ctx.fillStyle = 'rgba(203,213,225,0.7)';
      ctx.font = `500 16px ${SYS}`;
      ctx.fillText(`days of ${habit.name}`, W / 2, heroMid + 22);

      const copy = MILESTONE_COPY[lastMilestone];
      ctx.fillStyle = 'rgba(165,180,252,0.85)';
      ctx.font = `500 14px ${SYS}`;
      ctx.fillText(copy[0], W / 2, heroMid + 60);
      ctx.fillText(copy[1], W / 2, heroMid + 80);
    } else {
      ctx.font = '60px serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🌱', W / 2, heroMid - 44);

      ctx.fillStyle = 'rgba(203,213,225,0.7)';
      ctx.font = `500 16px ${SYS}`;
      ctx.fillText('Keep going —', W / 2, heroMid + 14);
      ctx.fillText('your first milestone is at', W / 2, heroMid + 38);

      ctx.fillStyle = 'white';
      ctx.font = `700 16px ${SYS}`;
      ctx.fillText('7 days', W / 2, heroMid + 62);

      if (nextMilestone) {
        ctx.fillStyle = 'rgba(165,180,252,0.6)';
        ctx.font = `500 13px ${SYS}`;
        ctx.fillText(`${nextMilestone - dates.length} days to go`, W / 2, heroMid + 88);
      }
    }
  }

  // ── Footer — centered logo + brand + subtitle ──────────────────────────────
  const footerY = 418;

  // Thin divider
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(32, footerY, W - 64, 1);

  // B logo + "Beacon" on same row, centered together
  const logoSize = 22, logoR = 6;
  const appNameText = 'Beacon';
  ctx.font = `700 13px ${SYS}`;
  const nameW = ctx.measureText(appNameText).width;
  const gap7  = 7;
  const rowW  = logoSize + gap7 + nameW;
  const rowX  = (W - rowW) / 2;
  const rowY  = footerY + 12;

  // Logo box
  const logoGrad = ctx.createLinearGradient(rowX, rowY, rowX + logoSize, rowY + logoSize);
  logoGrad.addColorStop(0, '#6366f1');
  logoGrad.addColorStop(1, '#4f46e5');
  ctx.fillStyle = logoGrad;
  rr(rowX, rowY, logoSize, logoSize, logoR);
  ctx.fill();

  ctx.fillStyle = 'white';
  ctx.font = `800 11px ${SYS}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('B', rowX + logoSize / 2, rowY + logoSize / 2 + 0.5);

  // App name — vertically centred with logo
  ctx.fillStyle = 'rgba(203,213,225,0.8)';
  ctx.font = `700 13px ${SYS}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(appNameText, rowX + logoSize + gap7, rowY + logoSize / 2);

  // Subtitle below
  ctx.fillStyle = 'rgba(148,163,184,0.5)';
  ctx.font = `400 11px ${SYS}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Habit tracking simplified', W / 2, rowY + logoSize + 18);

  return canvas;
}
