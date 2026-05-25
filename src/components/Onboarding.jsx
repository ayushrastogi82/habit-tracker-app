import React, { useState } from 'react';
import ShareableCard from './ShareableCard';

const SLIDES = [
  { id: 0, backdropBlur: '', theme: 'light' },
  { id: 1, backdropBlur: '', theme: 'light' },
  { id: 2, backdropBlur: '', theme: 'dark' },
];

// Demo habit for the share card on slide 3 — 42-day streak ending today
const today = new Date(); today.setHours(0, 0, 0, 0);
const DEMO_HABIT = {
  id: '1000000000000',
  name: 'Morning Run 🏃',
  type: 'daily',
  startDate: '1000000000000',
  dates: Array.from({ length: 42 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - 41 + i);
    return d.toISOString().slice(0, 10);
  }),
};

// GitHub-style activity grid — 7 rows (days) × 10 cols (weeks), ~70% fill
const GRID_ROWS = 7;
const GRID_COLS = 10;
const GRID_DATA = Array.from({ length: GRID_ROWS }, (_, row) =>
  Array.from({ length: GRID_COLS }, (_, col) => {
    // Last 2 cols fully filled, earlier cols ~75% filled with a pattern
    if (col >= GRID_COLS - 2) return 1;
    return ((row * 3 + col * 7) % 4) !== 0 ? 1 : 0;
  })
);

export default function Onboarding({ onDone, darkMode }) {
  const [slide, setSlide] = useState(0);
  const [exiting, setExiting] = useState(false);

  const advance = () => {
    if (slide < SLIDES.length - 1) setSlide(s => s + 1);
    else handleDone();
  };

  const goBack = () => {
    if (slide > 0) setSlide(s => s - 1);
  };

  const handleDone = () => {
    setExiting(true);
    setTimeout(onDone, 320);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" style={{ touchAction: 'none' }}>
      <div
        className="flex h-full w-full"
        style={{ transform: `translateX(-${slide * 100}%)`, transition: 'transform 320ms cubic-bezier(0.4,0,0.2,1)' }}
      >
        {SLIDES.map((s, i) => (
          <SlidePanel
            key={s.id}
            slideIndex={i}
            isDark={s.theme === 'dark'}
            backdropClass={s.backdropClass}
            backdropBlur={s.backdropBlur}
            onAdvance={advance}
            onBack={goBack}
            onSkip={handleDone}
            exiting={exiting}
            totalSlides={SLIDES.length}
            darkMode={darkMode}
          />
        ))}
      </div>
    </div>
  );
}

function SlidePanel({ slideIndex, isDark, backdropBlur, onAdvance, onBack, onSkip, exiting, totalSlides, darkMode }) {
  const isFirst = slideIndex === 0;
  const isLast = slideIndex === totalSlides - 1;

  // Slide 3 always dark; slides 1 & 2 follow system dark mode
  const backdropClass = isDark
    ? 'bg-gray-950'
    : darkMode
    ? 'bg-gray-900'
    : 'bg-white';

  return (
    <div
      className={`relative shrink-0 w-full h-full flex flex-col items-center justify-between px-6 py-10 ${backdropClass} ${backdropBlur} transition-opacity duration-300 ${exiting ? 'opacity-0' : 'opacity-100'}`}
      style={{ minWidth: '100%' }}
      onClick={onAdvance}
    >
      {/* Back button — slides 2 & 3 */}
      {!isFirst && (
        <button
          onClick={(e) => { e.stopPropagation(); onBack(); }}
          className={`absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-full z-10 transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-white/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Skip link — slides 1 & 2 */}
      {!isLast && (
        <button
          onClick={(e) => { e.stopPropagation(); onSkip(); }}
          className={`absolute top-4 right-4 text-sm font-medium px-3 py-1.5 rounded-lg z-10 transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Skip
        </button>
      )}

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 w-full max-w-xs text-center">
        {slideIndex === 0 && <Slide1Content darkMode={darkMode} />}
        {slideIndex === 1 && <Slide2Content darkMode={darkMode} />}
        {slideIndex === 2 && <Slide3Content />}
      </div>

      {/* Bottom: dots + CTA */}
      <div className="w-full flex flex-col items-center gap-5">
        <div className="flex items-center gap-2">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === slideIndex
                  ? `w-6 h-1.5 ${isDark ? 'bg-indigo-400' : 'bg-indigo-600'}`
                  : `w-1.5 h-1.5 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`
              }`}
            />
          ))}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onAdvance(); }}
          className={`w-full py-4 rounded-2xl text-base font-semibold transition-all active:scale-95 ${
            isDark
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
              : 'bg-indigo-600 text-white shadow-sm'
          }`}
        >
          {isLast ? 'Start Logging →' : 'Next →'}
        </button>
      </div>
    </div>
  );
}

function Slide1Content({ darkMode }) {
  return (
    <>
      <div className="flex flex-col items-center gap-0.5">
        <div className="text-[22px] font-bold tracking-widest uppercase text-indigo-400">Beacon</div>
        <div className={`text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No BS Habit Tracker</div>
      </div>
      <div className="flex flex-col gap-3">
        <p className={`text-[28px] font-bold leading-tight ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
          Most habit apps promise to change your life.
        </p>
        <p className={`text-[28px] font-bold leading-tight ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
          We don't.
        </p>
      </div>
      <p className={`text-base leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        You build the habit.{' '}
        <span className={darkMode ? 'text-gray-200 font-medium' : 'text-gray-700 font-medium'}>
          We help you show up.
        </span>
      </p>
    </>
  );
}

function Slide2Content({ darkMode }) {
  return (
    <>
      <div className="flex flex-col items-center gap-0.5">
        <div className="text-[22px] font-bold tracking-widest uppercase text-indigo-400">Beacon</div>
        <div className={`text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No BS Habit Tracker</div>
      </div>
      <div className="flex flex-col gap-2">
        <p className={`text-[28px] font-bold leading-tight ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>One tap to log.</p>
        <p className={`text-[22px] font-semibold leading-tight ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>That's the whole app.</p>
      </div>

      {/* Mock habit card */}
      <div className={`w-full rounded-2xl shadow-lg border px-4 py-3 flex items-center gap-3 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className="flex-1 min-w-0">
          <div className={`font-bold text-sm mb-0.5 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Morning Run 🏃</div>
          <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Daily · 42d streak 🔗</div>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-sm shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      {/* GitHub-style activity grid */}
      <div className={`w-full rounded-2xl shadow-sm border p-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className={`text-[10px] font-semibold mb-2 uppercase tracking-wider text-left ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Activity</div>
        <div className="flex gap-1 justify-center">
          {Array.from({ length: GRID_COLS }, (_, col) => (
            <div key={col} className="flex flex-col gap-1">
              {Array.from({ length: GRID_ROWS }, (_, row) => (
                <div
                  key={row}
                  className={`w-[18px] h-[18px] rounded-sm ${GRID_DATA[row][col] ? 'bg-indigo-500' : darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function Slide3Content() {
  const CARD_W = 360;
  const CARD_H = 500;
  const SCALE = 0.62;

  return (
    <>
      <div className="flex flex-col items-center gap-0.5">
        <div className="text-[22px] font-bold tracking-widest uppercase text-indigo-400">Beacon</div>
        <div className="text-xs font-medium text-gray-500">No BS Habit Tracker</div>
      </div>

      <div className="flex flex-col gap-1">
        {['No coaching.', 'No AI.', 'No BS.'].map((line, i) => (
          <p key={i} className="text-[30px] font-bold leading-tight text-white" style={{ opacity: 1 - i * 0.08 }}>
            {line}
          </p>
        ))}
      </div>

      <p className="text-sm text-gray-400 leading-relaxed">
        Share your progress. Let the numbers speak.
      </p>

      {/* Scaled share card preview */}
      <div
        style={{
          width: `${CARD_W * SCALE}px`,
          height: `${CARD_H * SCALE}px`,
          overflow: 'hidden',
          borderRadius: '16px',
          flexShrink: 0,
          boxShadow: '0 20px 60px rgba(99,102,241,0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ transform: `scale(${SCALE})`, transformOrigin: 'top left', width: `${CARD_W}px`, height: `${CARD_H}px` }}>
          <ShareableCard habit={DEMO_HABIT} stat="streak" />
        </div>
      </div>
    </>
  );
}
