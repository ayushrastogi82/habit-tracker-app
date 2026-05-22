import React from 'react';

const APP_URL = 'DailyDots.app';

// Compute streak from dates array
function getStreak(dates) {
  if (!dates || dates.length === 0) return { current: 0, longest: 0 };
  const sorted = [...dates].sort();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);
  const yday = new Date(today); yday.setDate(today.getDate() - 1);
  const ydayStr = yday.toISOString().slice(0, 10);
  const loggedToday = dates.includes(todayStr);
  const loggedYday = dates.includes(ydayStr);
  if (!loggedToday && !loggedYday) return { current: 0, longest: calcLongest(sorted) };
  let current = 0;
  const ref = loggedToday ? today : yday;
  const check = new Date(ref);
  while (true) {
    const s = check.toISOString().slice(0, 10);
    if (!dates.includes(s)) break;
    current++;
    check.setDate(check.getDate() - 1);
  }
  return { current, longest: Math.max(current, calcLongest(sorted)) };
}
function calcLongest(sorted) {
  if (!sorted.length) return 0;
  let longest = 1, cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (curr - prev) / 86400000;
    if (diff === 1) { cur++; longest = Math.max(longest, cur); }
    else cur = 1;
  }
  return longest;
}
function getLast30(dates) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let count = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    if (dates.includes(d.toISOString().slice(0, 10))) count++;
  }
  return count;
}
function getThisMonth(dates) {
  const now = new Date();
  const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return dates.filter(d => d.startsWith(prefix)).length;
}
function getThisWeek(dates) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return { days, logged: days.filter(d => dates.includes(d)).length };
}

// Dark premium card — Spotify Wrapped vibe
const ShareableCard = React.forwardRef(function ShareableCard({ habit, habits, cardType = 'streak', format = 'square' }, ref) {
  const isPortrait = format === 'portrait';
  const isAll = cardType === 'all';
  const w = 400;
  const h = isPortrait ? 500 : 400;

  // Compute stats for the focused habit
  const dates = habit?.dates || [];
  const streak = getStreak(dates);
  const last30 = getLast30(dates);
  const thisMonth = getThisMonth(dates);
  const { days: weekDays, logged: weekLogged } = getThisWeek(dates);
  const weekTarget = habit?.weeklyTarget || 7;
  const monthTarget = habit?.monthlyTarget || 1;

  // Hero content per card type
  const hero = (() => {
    if (isAll) return null;
    switch (cardType) {
      case 'streak': return { emoji: '🔥', number: streak.current, unit: 'day streak', sub: streak.current === streak.longest ? '🏆 Personal best!' : `Best: ${streak.longest}d`, pct: streak.longest > 0 ? Math.round((streak.current / streak.longest) * 100) : 100 };
      case 'week':   return { emoji: '📅', number: `${weekLogged}/${weekDays.length}`, unit: 'days this week', sub: weekLogged >= weekTarget ? '✅ Goal met!' : `Goal: ${weekTarget} days`, pct: Math.round((weekLogged / weekDays.length) * 100) };
      case 'month':  return { emoji: '📆', number: thisMonth, unit: 'days this month', sub: thisMonth >= monthTarget ? '✅ Goal met!' : `Goal: ${monthTarget} days`, pct: Math.round((thisMonth / new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()) * 100) };
      case '30days': return { emoji: '📊', number: last30, unit: 'days in 30', sub: `${Math.round((last30 / 30) * 100)}% consistency`, pct: Math.round((last30 / 30) * 100) };
      default: return { emoji: '✨', number: streak.current, unit: 'day streak', sub: '', pct: 50 };
    }
  })();

  const cardStyle = {
    width: `${w}px`,
    height: `${h}px`,
    background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
    borderRadius: '16px',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
  };

  // Dot grid overlay
  const DotGrid = () => (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
      backgroundSize: '22px 22px',
    }} />
  );

  // Glow accent behind hero
  const Glow = () => (
    <div style={{
      position: 'absolute', top: isPortrait ? '28%' : '22%', left: '50%',
      transform: 'translateX(-50%)',
      width: '180px', height: '180px',
      background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)',
      pointerEvents: 'none',
    }} />
  );

  if (isAll) {
    // All habits overview card
    const allStats = (habits || []).slice(0, 5).map(h => {
      const s = getStreak(h.dates || []);
      return { name: h.name, streak: s.current, longest: s.longest };
    });
    return (
      <div ref={ref} style={cardStyle}>
        <DotGrid />
        <Glow />
        {/* Top brand */}
        <div style={{ padding: '20px 24px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(165,180,252,0.8)', textTransform: 'uppercase' }}>✦ Habit Tracker</span>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>My Progress</span>
        </div>
        {/* Hero */}
        <div style={{ textAlign: 'center', padding: '16px 24px 12px', position: 'relative' }}>
          <div style={{ fontSize: '40px', marginBottom: '4px' }}>📊</div>
          <div style={{ fontSize: '42px', fontWeight: 900, lineHeight: 1, color: 'white', letterSpacing: '-2px' }}>{habits?.length || 0}</div>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>habits tracked</div>
        </div>
        {/* Habit list */}
        <div style={{ flex: 1, padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden' }}>
          {allStats.map((h, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '8px 12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</span>
              {h.streak > 0
                ? <span style={{ fontSize: '12px', fontWeight: 700, color: '#6ee7b7', background: 'rgba(16,185,129,0.15)', padding: '2px 8px', borderRadius: '20px' }}>🔥 {h.streak}d streak</span>
                : <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>no streak</span>}
            </div>
          ))}
        </div>
        {/* Footer */}
        <div style={{ padding: '12px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', color: 'rgba(165,180,252,0.5)', letterSpacing: '0.05em' }}>Build yours →</span>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(165,180,252,0.7)', letterSpacing: '0.05em' }}>{APP_URL}</span>
        </div>
      </div>
    );
  }

  // Single-habit card
  return (
    <div ref={ref} style={cardStyle}>
      <DotGrid />
      <Glow />
      {/* Top brand */}
      <div style={{ padding: isPortrait ? '24px 24px 0' : '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(165,180,252,0.8)', textTransform: 'uppercase' }}>✦ Habit Tracker</span>
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
      </div>
      {/* Hero */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px 24px', position: 'relative', textAlign: 'center' }}>
        <div style={{ fontSize: isPortrait ? '56px' : '48px', marginBottom: '8px', filter: 'drop-shadow(0 0 20px rgba(99,102,241,0.4))' }}>{hero.emoji}</div>
        <div style={{ fontSize: isPortrait ? '72px' : '64px', fontWeight: 900, lineHeight: 1, letterSpacing: '-3px', color: 'white', textShadow: '0 0 40px rgba(99,102,241,0.5)' }}>{hero.number}</div>
        <div style={{ fontSize: '18px', fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginTop: '6px', letterSpacing: '0.02em' }}>{hero.unit}</div>
        {/* Habit name */}
        <div style={{ marginTop: '16px', fontSize: '15px', fontWeight: 700, color: '#a5b4fc', letterSpacing: '0.08em', textTransform: 'uppercase', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{habit?.name}</div>
        {/* Sub text */}
        <div style={{ marginTop: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{hero.sub}</div>
        {/* Progress bar */}
        <div style={{ marginTop: '20px', width: '100%', maxWidth: '260px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: '999px', background: 'linear-gradient(90deg, #818cf8, #6366f1)', width: `${Math.min(100, hero.pct)}%`, transition: 'width 0.3s' }} />
        </div>
        <div style={{ marginTop: '6px', fontSize: '11px', color: 'rgba(165,180,252,0.6)' }}>{hero.pct}%</div>
      </div>
      {/* Footer */}
      <div style={{ padding: isPortrait ? '0 24px 24px' : '0 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '10px', color: 'rgba(165,180,252,0.5)', letterSpacing: '0.05em' }}>Build yours →</span>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(165,180,252,0.7)', letterSpacing: '0.05em' }}>{APP_URL}</span>
      </div>
    </div>
  );
});

export default ShareableCard;
