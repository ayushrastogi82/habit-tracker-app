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
  const last30Pct = Math.min(100, Math.round((last30Count / 30) * 100));

  // --- Best streak ---
  let bestStreak = 0;
  if (dates.length) {
    const sorted = [...dates].sort();
    let cur = 1;
    bestStreak = 1;
    for (let i = 1; i < sorted.length; i++) {
      const diff = (new Date(sorted[i]) - new Date(sorted[i - 1])) / 86400000;
      if (diff === 1) { cur++; bestStreak = Math.max(bestStreak, cur); }
      else if (diff > 1) cur = 1;
    }
  }

  // --- All time (since start) — UTC-safe, matches app logic ---
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

  // --- This month ---
  const monthStr = todayStr.slice(0, 7);
  const monthName = today.toLocaleDateString('en-US', { month: 'long' });
  const monthCount = dates.filter(d => d.startsWith(monthStr)).length;
  const daysElapsedThisMonth = today.getDate();
  const monthPct = daysElapsedThisMonth > 0 ? Math.min(100, Math.round((monthCount / daysElapsedThisMonth) * 100)) : 0;

  // --- This year ---
  const yearStr = todayStr.slice(0, 4);
  const yearCount = dates.filter(d => d.startsWith(yearStr)).length;
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const daysElapsedThisYear = Math.floor((today - startOfYear) / 86400000) + 1;
  const yearPct = daysElapsedThisYear > 0 ? Math.min(100, Math.round((yearCount / daysElapsedThisYear) * 100)) : 0;

  const wTarget = habit.weeklyTarget || 3;
  const mTarget = habit.monthlyTarget || 1;
  const typeLabel =
    habit.type === 'weekly'  ? `Weekly habit · ${wTarget}/wk`  :
    habit.type === 'monthly' ? `Monthly habit · ${mTarget}/mo` : 'Daily habit';

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
            <div style={{ fontSize: '16px', color: 'rgba(203,213,225,0.7)', fontWeight: '500', marginBottom: '20px' }}>
              day streak
            </div>
          </>
        )}

        {stat === '7days' && (
          <>
            <div style={{ fontSize: '80px', fontWeight: '800', color: 'white', lineHeight: 1, marginBottom: '8px' }}>
              {last7Count}
            </div>
            <div style={{ fontSize: '16px', color: 'rgba(203,213,225,0.7)', fontWeight: '500', marginBottom: '20px' }}>
              last 7 days
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {last7Logged.map((logged, i) => (
                <div key={i} style={{
                  width: '30px', height: '30px', borderRadius: '50%',
                  background: logged ? 'linear-gradient(135deg, #34d399, #10b981)' : 'rgba(255,255,255,0.1)',
                  border: logged ? 'none' : '1px solid rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {logged && <span style={{ color: 'white', fontSize: '13px', fontWeight: '700' }}>✓</span>}
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
            <div style={{ fontSize: '16px', color: 'rgba(203,213,225,0.7)', fontWeight: '500', marginBottom: '20px' }}>
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

        {stat === 'best' && (
          <>
            <div style={{ fontSize: '68px', marginBottom: '4px', lineHeight: 1 }}>🏆</div>
            <div style={{ fontSize: '80px', fontWeight: '800', color: 'white', lineHeight: 1, marginBottom: '8px' }}>
              {bestStreak}
            </div>
            <div style={{ fontSize: '16px', color: 'rgba(203,213,225,0.7)', fontWeight: '500', marginBottom: '20px' }}>
              day best streak
            </div>
          </>
        )}

        {stat === 'since' && (
          <>
            <div style={{ fontSize: '68px', marginBottom: '4px', lineHeight: 1 }}>🌟</div>
            <div style={{ fontSize: '80px', fontWeight: '800', color: 'white', lineHeight: 1, marginBottom: '8px' }}>
              {sinceCount}
            </div>
            <div style={{ fontSize: '16px', color: 'rgba(203,213,225,0.7)', fontWeight: '500', marginBottom: '20px' }}>
              days since {sinceLabel}
            </div>
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

        {stat === 'heatmap' && (() => {
          // Calendar-year heatmap — matches the expanded card year view
          const cardInnerW = 304; // 360px card - 56px padding
          const selectedYear = today.getFullYear();
          const jan1 = new Date(selectedYear, 0, 1);
          const leadingDays = jan1.getDay(); // Sunday-start
          const gridStart = new Date(selectedYear, 0, 1 - leadingDays);
          const dec31 = new Date(selectedYear, 11, 31);
          const TOTAL_WEEKS = Math.ceil(((dec31 - gridStart) / 86400000 + 1) / 7);
          const GAP = 1;
          const DOT = Math.floor((cardInnerW - (TOTAL_WEEKS - 1) * GAP) / TOTAL_WEEKS);

          const yearGrid = Array.from({ length: TOTAL_WEEKS }, (_, w) =>
            Array.from({ length: 7 }, (_, d) => {
              const date = new Date(gridStart);
              date.setDate(gridStart.getDate() + w * 7 + d);
              const ds = date.toISOString().slice(0, 10);
              const inYear = ds.startsWith(String(selectedYear));
              return { logged: inYear && dates.includes(ds), outOfYear: !inYear, isToday: ds === todayStr };
            })
          );
          const yearCount = yearGrid.flat().filter(c => !c.outOfYear && c.logged).length;
          const totalLogged = dates.length;

          return (
            <>
              <div style={{ display: 'flex', gap: `${GAP}px` }}>
                {yearGrid.map((week, wi) => (
                  <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: `${GAP}px` }}>
                    {week.map((day, di) => (
                      <div key={di} style={{
                        width: `${DOT}px`, height: `${DOT}px`, borderRadius: '1px',
                        background: day.outOfYear
                          ? 'transparent'
                          : day.logged
                          ? 'linear-gradient(135deg, #6366f1, #818cf8)'
                          : 'rgba(255,255,255,0.10)',
                        boxSizing: 'border-box',
                        ...(day.isToday && !day.logged && !day.outOfYear
                          ? { border: '1px solid #6366f1', background: 'transparent' }
                          : {}),
                      }} />
                    ))}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'white', marginTop: '16px' }}>
                {yearCount} {yearCount === 1 ? 'day' : 'days'} in {selectedYear}
                {totalLogged !== yearCount && (
                  <span style={{ fontSize: '14px', color: 'rgba(165,180,252,0.6)', fontWeight: '500' }}>
                    {' '}· {totalLogged} total
                  </span>
                )}
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(165,180,252,0.7)', fontWeight: '500', marginTop: '4px' }}>
                The pattern of showing up.
              </div>
            </>
          );
        })()}

        {stat === 'milestone' && (() => {
          const MILESTONES = [7, 21, 30, 50, 100, 200, 365];
          const MILESTONE_COPY = {
            7:   "Most people quit by day 3.\nYou're still here.",
            21:  "21 days in.\nYou're building something real.",
            30:  "A month.\nThis is becoming part of who you are.",
            50:  "50 days.\nQuiet consistency is underrated.",
            100: "100 days. That's not a streak —\nthat's a lifestyle.",
            200: "200 days. You showed up more\nthan most people ever will.",
            365: "A full year. Some people start habits.\nYou built one.",
          };
          const lastMilestone = [...MILESTONES].reverse().find(m => m <= dates.length) || null;
          const nextMilestone = MILESTONES.find(m => m > dates.length);
          return lastMilestone ? (
            <>
              <div style={{ fontSize: '80px', fontWeight: '800', color: 'white', lineHeight: 1, marginBottom: '8px' }}>
                {dates.length}
              </div>
              <div style={{ fontSize: '16px', color: 'rgba(203,213,225,0.7)', fontWeight: '500', marginBottom: '16px' }}>
                days of {habit.name}
              </div>
              <div style={{ fontSize: '15px', color: 'rgba(165,180,252,0.85)', fontWeight: '500', textAlign: 'center', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {MILESTONE_COPY[lastMilestone]}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '56px', marginBottom: '12px', lineHeight: 1 }}>🌱</div>
              <div style={{ fontSize: '16px', color: 'rgba(203,213,225,0.7)', fontWeight: '500', textAlign: 'center', lineHeight: 1.6, marginBottom: '8px' }}>
                Keep going —<br />your first milestone is at{' '}
                <span style={{ color: 'white', fontWeight: '700' }}>7 days</span>.
              </div>
              {nextMilestone && (
                <div style={{ fontSize: '13px', color: 'rgba(165,180,252,0.6)', fontWeight: '400' }}>
                  {nextMilestone - dates.length} days to go
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* Thin divider */}
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '16px 0 14px' }} />

      {/* Footer — H logo + "Habit Tracker" on one row, subtitle below */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <div style={{
            width: '22px', height: '22px', borderRadius: '6px',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: '800', color: 'white', flexShrink: 0,
          }}>B</div>
          <span style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(203,213,225,0.8)' }}>
            Beacon
          </span>
        </div>
        <span style={{ fontSize: '11px', color: 'rgba(148,163,184,0.5)', fontWeight: '400' }}>
          Habit tracking simplified
        </span>
      </div>
    </div>
  );
});

export default ShareableCard;
