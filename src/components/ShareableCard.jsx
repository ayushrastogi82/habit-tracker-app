import React, { forwardRef } from 'react';

// All styles are inline — html2canvas doesn't reliably capture Tailwind classes

const ShareableCard = forwardRef(function ShareableCard({ habit, stat, appUrl }, ref) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);

  // --- Streak ---
  const dates = habit.dates || [];
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
        const expected = check.toISOString().slice(0, 10);
        if (sortedDesc[i] === expected) streakCount++;
        else break;
      }
    }
  }

  // --- Last 7 days ---
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - 6 + i);
    return d.toISOString().slice(0, 10);
  });
  const last7Logged = last7.map(d => dates.includes(d));
  const last7Count = last7Logged.filter(Boolean).length;

  // --- This month ---
  const monthStr = todayStr.slice(0, 7);
  const monthName = today.toLocaleDateString('en-US', { month: 'long' });
  const monthCount = dates.filter(d => d.startsWith(monthStr)).length;
  const daysElapsedThisMonth = today.getDate();
  const monthPct = daysElapsedThisMonth > 0 ? Math.round((monthCount / daysElapsedThisMonth) * 100) : 0;

  // --- This year ---
  const yearStr = todayStr.slice(0, 4);
  const yearCount = dates.filter(d => d.startsWith(yearStr)).length;
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const daysElapsedThisYear = Math.floor((today - startOfYear) / 86400000) + 1;
  const yearPct = daysElapsedThisYear > 0 ? Math.round((yearCount / daysElapsedThisYear) * 100) : 0;

  const habitTypeLabel = habit.type === 'weekly' ? 'Weekly' : habit.type === 'monthly' ? 'Monthly' : 'Daily';

  // Card styles
  const card = {
    width: '360px',
    height: '500px',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
    borderRadius: '24px',
    display: 'flex',
    flexDirection: 'column',
    padding: '32px 28px 24px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    boxSizing: 'border-box',
    position: 'relative',
    overflow: 'hidden',
  };

  // Subtle dot-grid background
  const dotGrid = {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.15) 1px, transparent 1px)',
    backgroundSize: '24px 24px',
    pointerEvents: 'none',
  };

  return (
    <div ref={ref} style={card}>
      {/* Dot grid */}
      <div style={dotGrid} />

      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '24px' }}>
        <div style={{
          width: '24px', height: '24px', borderRadius: '6px',
          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', fontWeight: '800', color: 'white',
        }}>H</div>
        <span style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(165,180,252,0.8)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Habit Tracker
        </span>
      </div>

      {/* Habit name + type */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '26px', fontWeight: '800', color: 'white', lineHeight: 1.2, marginBottom: '4px' }}>
          {habit.name}
        </div>
        <div style={{ fontSize: '13px', color: 'rgba(165,180,252,0.7)', fontWeight: '500' }}>
          {habitTypeLabel}
        </div>
      </div>

      {/* Hero stat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {stat === 'streak' && (
          <>
            <div style={{ fontSize: '56px', marginBottom: '4px' }}>🔥</div>
            <div style={{ fontSize: '72px', fontWeight: '800', color: 'white', lineHeight: 1, marginBottom: '8px' }}>
              {streakCount}
            </div>
            <div style={{ fontSize: '16px', color: 'rgba(203,213,225,0.7)', fontWeight: '500' }}>
              {streakCount === 1 ? 'day streak' : 'day streak'}
            </div>
          </>
        )}

        {stat === '7days' && (
          <>
            <div style={{ fontSize: '56px', fontWeight: '800', color: 'white', lineHeight: 1, marginBottom: '6px' }}>
              {last7Count}<span style={{ fontSize: '32px', color: 'rgba(203,213,225,0.5)', fontWeight: '600' }}>/7</span>
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(203,213,225,0.7)', fontWeight: '500', marginBottom: '16px' }}>
              days this week
            </div>
            {/* 7 dots */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              {last7Logged.map((logged, i) => (
                <div key={i} style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: logged
                    ? 'linear-gradient(135deg, #34d399, #10b981)'
                    : 'rgba(255,255,255,0.1)',
                  border: logged ? 'none' : '1px solid rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {logged && <span style={{ color: 'white', fontSize: '12px', fontWeight: '700' }}>✓</span>}
                </div>
              ))}
            </div>
          </>
        )}

        {stat === 'month' && (
          <>
            <div style={{ fontSize: '72px', fontWeight: '800', color: 'white', lineHeight: 1, marginBottom: '8px' }}>
              {monthCount}
            </div>
            <div style={{ fontSize: '16px', color: 'rgba(203,213,225,0.7)', fontWeight: '500', marginBottom: '20px' }}>
              days in {monthName}
            </div>
            {/* Progress bar */}
            <div style={{ width: '200px', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.12)', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{ width: `${monthPct}%`, height: '100%', borderRadius: '3px', background: 'linear-gradient(90deg, #6366f1, #818cf8)' }} />
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(165,180,252,0.8)', fontWeight: '600' }}>{monthPct}% consistency</div>
          </>
        )}

        {stat === 'year' && (
          <>
            <div style={{ fontSize: '72px', fontWeight: '800', color: 'white', lineHeight: 1, marginBottom: '8px' }}>
              {yearCount}
            </div>
            <div style={{ fontSize: '16px', color: 'rgba(203,213,225,0.7)', fontWeight: '500', marginBottom: '20px' }}>
              days in {yearStr}
            </div>
            {/* Progress bar */}
            <div style={{ width: '200px', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.12)', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{ width: `${yearPct}%`, height: '100%', borderRadius: '3px', background: 'linear-gradient(90deg, #6366f1, #818cf8)' }} />
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(165,180,252,0.8)', fontWeight: '600' }}>{yearPct}% consistency</div>
          </>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '20px 0 16px' }} />

      {/* CTA + URL */}
      <div>
        <div style={{ fontSize: '13px', color: 'rgba(203,213,225,0.6)', marginBottom: '2px' }}>
          Start tracking your habits →
        </div>
        <div style={{ fontSize: '14px', fontWeight: '700', color: '#818cf8' }}>
          {appUrl}
        </div>
      </div>
    </div>
  );
});

export default ShareableCard;
