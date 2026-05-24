import React, { forwardRef } from 'react';

// All styles are inline — html2canvas is no longer used for capture,
// but this component is kept for the live in-modal preview.

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

  // --- Last 30 days ---
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - 29 + i);
    return d.toISOString().slice(0, 10);
  });
  const last30Logged = last30.map(d => dates.includes(d));
  const last30Count = last30Logged.filter(Boolean).length;
  const last30Pct = Math.round((last30Count / 30) * 100);

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

  const typeLabel =
    habit.type === 'weekly'  ? 'Weekly habit'  :
    habit.type === 'monthly' ? 'Monthly habit' : 'Daily habit';

  const card = {
    width: '360px',
    height: '500px',
    background: 'linear-gradient(180deg, #312e81 0%, #1e1b4b 35%, #0d0c24 70%, #05050f 100%)',
    borderRadius: '24px',
    display: 'flex',
    flexDirection: 'column',
    padding: '32px 28px 24px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    boxSizing: 'border-box',
    position: 'relative',
    overflow: 'hidden',
  };

  const dotGrid = {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.15) 1px, transparent 1px)',
    backgroundSize: '24px 24px',
    pointerEvents: 'none',
  };

  return (
    <div ref={ref} style={card}>
      <div style={dotGrid} />

      {/* Habit name — centered, large */}
      <div style={{ textAlign: 'center', marginBottom: '6px' }}>
        <div style={{ fontSize: '28px', fontWeight: '800', color: 'white', lineHeight: 1.2 }}>
          {habit.name}
        </div>
        <div style={{ fontSize: '13px', color: 'rgba(165,180,252,0.65)', fontWeight: '500', marginTop: '6px' }}>
          {typeLabel}
        </div>
      </div>

      {/* Hero stat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {stat === 'streak' && (
          <>
            <div style={{ fontSize: '68px', marginBottom: '4px', lineHeight: 1 }}>🔥</div>
            <div style={{ fontSize: '80px', fontWeight: '800', color: 'white', lineHeight: 1, marginBottom: '8px' }}>
              {streakCount}
            </div>
            <div style={{ fontSize: '17px', color: 'rgba(203,213,225,0.7)', fontWeight: '500' }}>
              day streak
            </div>
          </>
        )}

        {stat === '7days' && (
          <>
            <div style={{ fontSize: '64px', fontWeight: '800', color: 'white', lineHeight: 1, marginBottom: '6px' }}>
              {last7Count}<span style={{ fontSize: '34px', color: 'rgba(203,213,225,0.45)', fontWeight: '600' }}>/7</span>
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(203,213,225,0.7)', fontWeight: '500', marginBottom: '18px' }}>
              days this week
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              {last7Logged.map((logged, i) => (
                <div key={i} style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: logged ? 'linear-gradient(135deg, #34d399, #10b981)' : 'rgba(255,255,255,0.1)',
                  border: logged ? 'none' : '1px solid rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {logged && <span style={{ color: 'white', fontSize: '12px', fontWeight: '700' }}>✓</span>}
                </div>
              ))}
            </div>
          </>
        )}

        {stat === '30days' && (
          <>
            <div style={{ fontSize: '80px', fontWeight: '800', color: 'white', lineHeight: 1, marginBottom: '8px' }}>
              {last30Count}
            </div>
            <div style={{ fontSize: '16px', color: 'rgba(203,213,225,0.7)', fontWeight: '500', marginBottom: '18px' }}>
              days in last 30
            </div>
            {/* 10×3 dot grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {Array.from({ length: 3 }, (_, row) => (
                <div key={row} style={{ display: 'flex', gap: '6px' }}>
                  {Array.from({ length: 10 }, (_, col) => {
                    const idx = row * 10 + col;
                    const logged = last30Logged[idx];
                    return (
                      <div key={col} style={{
                        width: '22px', height: '22px', borderRadius: '4px',
                        background: logged
                          ? 'linear-gradient(135deg, #6366f1, #818cf8)'
                          : 'rgba(255,255,255,0.08)',
                        border: logged ? 'none' : '1px solid rgba(255,255,255,0.12)',
                      }} />
                    );
                  })}
                </div>
              ))}
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(165,180,252,0.85)', fontWeight: '600', marginTop: '14px' }}>
              {last30Pct}% consistency
            </div>
          </>
        )}

        {stat === 'month' && (
          <>
            <div style={{ fontSize: '80px', fontWeight: '800', color: 'white', lineHeight: 1, marginBottom: '8px' }}>
              {monthCount}
            </div>
            <div style={{ fontSize: '16px', color: 'rgba(203,213,225,0.7)', fontWeight: '500', marginBottom: '20px' }}>
              days in {monthName}
            </div>
            <div style={{ width: '200px', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.12)', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{ width: `${monthPct}%`, height: '100%', borderRadius: '3px', background: 'linear-gradient(90deg, #6366f1, #818cf8)' }} />
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(165,180,252,0.85)', fontWeight: '600' }}>{monthPct}% consistency</div>
          </>
        )}

        {stat === 'year' && (
          <>
            <div style={{ fontSize: '80px', fontWeight: '800', color: 'white', lineHeight: 1, marginBottom: '8px' }}>
              {yearCount}
            </div>
            <div style={{ fontSize: '16px', color: 'rgba(203,213,225,0.7)', fontWeight: '500', marginBottom: '20px' }}>
              days in {yearStr}
            </div>
            <div style={{ width: '200px', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.12)', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{ width: `${yearPct}%`, height: '100%', borderRadius: '3px', background: 'linear-gradient(90deg, #6366f1, #818cf8)' }} />
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(165,180,252,0.85)', fontWeight: '600' }}>{yearPct}% consistency</div>
          </>
        )}
      </div>

      {/* Thin divider */}
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '16px 0 14px' }} />

      {/* Footer — H logo + brand + subtitle, all centered */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
        <div style={{
          width: '26px', height: '26px', borderRadius: '7px',
          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', fontWeight: '800', color: 'white',
        }}>H</div>
        <span style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(203,213,225,0.75)' }}>
          Habit Tracker
        </span>
        <span style={{ fontSize: '11px', color: 'rgba(148,163,184,0.5)', fontWeight: '400' }}>
          Log your progress, stay motivated
        </span>
      </div>
    </div>
  );
});

export default ShareableCard;
