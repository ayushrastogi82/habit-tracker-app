import React, { useState } from 'react';
import ShareableCard from './ShareableCard';

const SLIDES = [
  { id: 0, theme: 'dark' },   // Problem — guilt
  { id: 1, theme: 'dark' },   // Bridge — 3 beliefs
  { id: 2, theme: 'dark' },   // Belief 1 — one tap
  { id: 3, theme: 'dark' },   // Belief 2 — come back + grid
  { id: 4, theme: 'dark' },   // Belief 3 — share card
];

// Demo habit for share card — 42-day streak ending today
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

// Activity grid — 7 rows × 10 cols, real-life pattern with gaps
const GRID_ROWS = 7;
const GRID_COLS = 10;
const GRID_DATA = Array.from({ length: GRID_ROWS }, (_, row) =>
  Array.from({ length: GRID_COLS }, (_, col) => {
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

function SlidePanel({ slideIndex, isDark, onAdvance, onBack, onSkip, exiting, totalSlides, darkMode }) {
  const isFirst = slideIndex === 0;
  const isLast = slideIndex === totalSlides - 1;

  const backdropClass = isDark
    ? 'bg-gray-950'
    : darkMode
    ? 'bg-gray-900'
    : 'bg-white';

  return (
    <div
      className={`relative shrink-0 w-full h-full flex flex-col items-center justify-between px-6 py-10 ${backdropClass} transition-opacity duration-300 ${exiting ? 'opacity-0' : 'opacity-100'}`}
      style={{ minWidth: '100%' }}
      onClick={onAdvance}
    >
      {/* Back button */}
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

      {/* Skip link */}
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
        {slideIndex === 0 && <Slide1Content />}
        {slideIndex === 1 && <Slide2Content />}
        {slideIndex === 2 && <Slide3Content />}
        {slideIndex === 3 && <Slide4Content darkMode={darkMode} />}
        {slideIndex === 4 && <Slide5Content />}
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

// Slide 1 — The Problem (always dark)
function Slide1Content() {
  return (
    <>
      <div className="flex flex-col items-center gap-0.5">
        <div className="text-[20px] font-bold tracking-widest uppercase text-indigo-400">Beacon</div>
        <div className="text-xs font-medium text-gray-500">Habit tracking simplified</div>
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-[28px] font-bold leading-tight text-gray-100">
          Millions track habits in notes.
        </p>
        <p className="text-[28px] font-bold leading-tight text-indigo-400">
          Not because they're lazy.
        </p>
      </div>
      <p className="text-base leading-relaxed text-gray-400">
        Because habit apps made them feel{' '}
        <span className="text-gray-200 font-medium">guilty for being human.</span>
      </p>
    </>
  );
}

// Slide 2 — Bridge: 3 beliefs (always dark, minimal)
function Slide2Content() {
  return (
    <>
      <div className="flex flex-col items-center gap-0.5">
        <div className="text-[20px] font-bold tracking-widest uppercase text-indigo-400">Beacon</div>
        <div className="text-xs font-medium text-gray-500">Habit tracking simplified</div>
      </div>
      <div className="flex flex-col gap-4">
        <p className="text-[32px] font-bold leading-tight text-white">
          We built Beacon on
        </p>
        <p className="text-[32px] font-bold leading-tight text-indigo-400">
          3 beliefs.
        </p>
      </div>
    </>
  );
}

// Slide 3 — Belief 1: One tap to log (always dark)
function Slide3Content() {
  const habits = [
    { name: 'Morning Run 🏃', days: '42 of 48 days', logged: true },
    { name: 'Read 📚', days: '18 of 48 days', logged: false },
    { name: 'Meditate 🧘', days: '33 of 48 days', logged: true },
  ];
  return (
    <>
      <div className="flex flex-col items-center gap-0.5">
        <div className="text-[20px] font-bold tracking-widest uppercase text-indigo-400">Beacon</div>
        <div className="text-xs font-medium text-gray-500">Habit tracking simplified</div>
      </div>
      <div className="flex flex-col gap-2 text-left w-full">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Belief 1</p>
        <p className="text-[26px] font-bold leading-tight text-white">
          Logging should be easier than notes.
        </p>
      </div>
      <p className="text-base font-semibold text-gray-300 text-left w-full">
        One tap to log. That's it.
      </p>
      {/* Mock habit cards */}
      <div className="w-full flex flex-col gap-2">
        {habits.map((h, i) => (
          <div key={i} className="w-full rounded-xl bg-gray-800 border border-gray-700 px-3 py-2.5 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-gray-100 truncate">{h.name}</div>
              <div className="text-xs text-gray-500">Daily · {h.days}</div>
            </div>
            {h.logged ? (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full border-2 border-indigo-400 shrink-0" />
            )}
          </div>
        ))}
      </div>
    </>
  );
}

// Slide 4 — Belief 2: Miss a day, come back (dark + grid)
function Slide4Content({ darkMode }) {
  return (
    <>
      <div className="flex flex-col items-center gap-0.5">
        <div className="text-[20px] font-bold tracking-widest uppercase text-indigo-400">Beacon</div>
        <div className="text-xs font-medium text-gray-500">Habit tracking simplified</div>
      </div>
      <div className="flex flex-col gap-2 text-left w-full">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Belief 2</p>
        <p className="text-[26px] font-bold leading-tight text-white">
          Miss a day? Just come back when you're ready.
        </p>
      </div>
      <p className="text-sm text-gray-400 leading-relaxed text-left w-full">
        Logged days are{' '}
        <span className="text-gray-200 font-medium">far more important than streaks.</span>
        {' '}We'll always be here.
      </p>
      {/* Activity grid */}
      <div className="w-full rounded-2xl border border-gray-800 bg-gray-900 p-4">
        <div className="text-[10px] font-semibold mb-2 uppercase tracking-wider text-left text-gray-500">Your progress, always</div>
        <div className="flex gap-1 justify-center">
          {Array.from({ length: GRID_COLS }, (_, col) => (
            <div key={col} className="flex flex-col gap-1">
              {Array.from({ length: GRID_ROWS }, (_, row) => (
                <div
                  key={row}
                  className={`w-[18px] h-[18px] rounded-sm ${GRID_DATA[row][col] ? 'bg-indigo-500' : 'bg-gray-700'}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// Slide 5 — Belief 3: Share (always dark + share card)
function Slide5Content() {
  const CARD_W = 360;
  const CARD_H = 500;
  const SCALE = 0.62;

  return (
    <>
      <div className="flex flex-col items-center gap-0.5">
        <div className="text-[20px] font-bold tracking-widest uppercase text-indigo-400">Beacon</div>
        <div className="text-xs font-medium text-gray-500">Habit tracking simplified</div>
      </div>
      <div className="flex flex-col gap-2 text-left w-full">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Belief 3</p>
        <p className="text-[26px] font-bold leading-tight text-white">
          Progress shared is progress doubled.
        </p>
      </div>
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
          <ShareableCard habit={DEMO_HABIT} stat="month" />
        </div>
      </div>
    </>
  );
}
