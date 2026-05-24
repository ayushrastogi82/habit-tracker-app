import React, { useState } from 'react';

const SLIDES = [
  {
    id: 0,
    backdropClass: 'bg-white/90',
    backdropBlur: 'backdrop-blur-sm',
    theme: 'light',
  },
  {
    id: 1,
    backdropClass: 'bg-white/75',
    backdropBlur: 'backdrop-blur-[2px]',
    theme: 'light',
  },
  {
    id: 2,
    backdropClass: 'bg-gray-950',
    backdropBlur: '',
    theme: 'dark',
  },
];

// Static heatmap for slide 2 — 4 rows × 7 cols, partially filled
const HEATMAP_DATA = [
  [1, 1, 0, 1, 1, 1, 0],
  [1, 0, 1, 1, 0, 1, 1],
  [1, 1, 1, 0, 1, 1, 0],
  [0, 1, 1, 1, 1, 0, 1],
];

export default function Onboarding({ onDone, darkMode }) {
  const [slide, setSlide] = useState(0);
  const [exiting, setExiting] = useState(false);

  const advance = () => {
    if (slide < SLIDES.length - 1) {
      setSlide(s => s + 1);
    } else {
      handleDone();
    }
  };

  const handleDone = () => {
    setExiting(true);
    setTimeout(onDone, 350);
  };

  const current = SLIDES[slide];
  const isDark = current.theme === 'dark';

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      style={{ touchAction: 'none' }}
    >
      {/* Sliding panel container */}
      <div
        className="flex h-full w-full transition-transform duration-350 ease-in-out"
        style={{ transform: `translateX(-${slide * 100}%)`, transitionDuration: '320ms' }}
      >
        {SLIDES.map((s, i) => (
          <SlidePanel
            key={s.id}
            slideIndex={i}
            currentSlide={slide}
            isDark={s.theme === 'dark'}
            backdropClass={s.backdropClass}
            backdropBlur={s.backdropBlur}
            onAdvance={advance}
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

function SlidePanel({ slideIndex, currentSlide, isDark, backdropClass, backdropBlur, onAdvance, onSkip, exiting, totalSlides, darkMode }) {
  const isActive = slideIndex === currentSlide;
  const isLast = slideIndex === totalSlides - 1;

  return (
    <div
      className={`relative shrink-0 w-full h-full flex flex-col items-center justify-between px-6 py-10 transition-opacity duration-300 ${backdropClass} ${backdropBlur} ${exiting ? 'opacity-0' : 'opacity-100'}`}
      style={{ minWidth: '100%' }}
      onClick={onAdvance}
    >
      {/* Skip link — absolutely positioned, slides 1 & 2 only */}
      {!isLast && (
        <button
          onClick={(e) => { e.stopPropagation(); onSkip(); }}
          className={`absolute top-4 right-4 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors z-10 ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Skip
        </button>
      )}

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 w-full max-w-xs text-center">
        {slideIndex === 0 && <Slide1Content isDark={isDark} darkMode={darkMode} />}
        {slideIndex === 1 && <Slide2Content isDark={isDark} />}
        {slideIndex === 2 && <Slide3Content />}
      </div>

      {/* Bottom: dots + CTA */}
      <div className="w-full flex flex-col items-center gap-5">
        {/* Dot indicators */}
        <div className="flex items-center gap-2">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === slideIndex
                  ? `w-6 h-1.5 ${isDark ? 'bg-indigo-400' : 'bg-indigo-600'}`
                  : `w-1.5 h-1.5 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`
              }`}
            />
          ))}
        </div>

        {/* CTA button */}
        <button
          onClick={(e) => { e.stopPropagation(); onAdvance(); }}
          className={`w-full py-4 rounded-2xl text-base font-semibold transition-all active:scale-95 ${
            isLast
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : isDark
              ? 'bg-white/10 text-white border border-white/20'
              : 'bg-indigo-600 text-white shadow-sm'
          }`}
        >
          {isLast ? 'Start Logging →' : 'Next →'}
        </button>
      </div>
    </div>
  );
}

function Slide1Content({ isDark, darkMode }) {
  return (
    <>
      {/* Brand mark */}
      <div className={`text-xs font-bold tracking-widest uppercase ${darkMode ? 'text-indigo-400' : 'text-indigo-400'}`}>
        Habit Tracker
      </div>

      {/* Hero text */}
      <div className="flex flex-col gap-3">
        <p className={`text-[28px] font-bold leading-tight ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
          Most habit apps promise to change your life.
        </p>
        <p className={`text-[28px] font-bold leading-tight ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
          We don't.
        </p>
      </div>

      {/* Sub */}
      <p className={`text-base leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        You build the habit.{' '}
        <span className={darkMode ? 'text-gray-200 font-medium' : 'text-gray-700 font-medium'}>
          We help you show up.
        </span>
      </p>
    </>
  );
}

function Slide2Content({ isDark }) {
  return (
    <>
      {/* Hero text */}
      <div className="flex flex-col gap-2">
        <p className="text-[28px] font-bold leading-tight text-gray-900">
          One tap to log.
        </p>
        <p className="text-[22px] font-semibold leading-tight text-gray-500">
          That's the whole app.
        </p>
      </div>

      {/* Mock habit card */}
      <div className="w-full bg-white rounded-2xl shadow-lg border border-gray-100 px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-gray-800 mb-0.5">Morning Run 🏃</div>
          <div className="text-xs text-gray-400">Daily</div>
        </div>
        {/* Animated circle checkbox */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-sm shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      {/* Heatmap snippet */}
      <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="text-[10px] font-semibold text-gray-400 mb-2 uppercase tracking-wider">Your streak</div>
        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {HEATMAP_DATA.flat().map((logged, i) => (
            <div
              key={i}
              className={`aspect-square rounded-sm ${logged ? 'bg-indigo-500' : 'bg-gray-100'}`}
            />
          ))}
        </div>
      </div>
    </>
  );
}

function Slide3Content() {
  return (
    <>
      {/* Brand mark */}
      <div className="text-xs font-bold tracking-widest uppercase text-indigo-400">
        No BS Habit Tracker
      </div>

      {/* Hero text */}
      <div className="flex flex-col gap-1">
        {['No coaching.', 'No AI.', 'No BS.'].map((line, i) => (
          <p
            key={i}
            className="text-[30px] font-bold leading-tight text-white"
            style={{ opacity: 1 - i * 0.08 }}
          >
            {line}
          </p>
        ))}
      </div>

      {/* Sub */}
      <p className="text-base text-gray-400 leading-relaxed">
        Just the streak{' '}
        <span className="text-gray-200 font-medium">you built yourself.</span>
      </p>

      {/* Small heatmap — dark variant */}
      <div className="w-full rounded-2xl border border-white/10 p-4 bg-white/5">
        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {HEATMAP_DATA.flat().map((logged, i) => (
            <div
              key={i}
              className={`aspect-square rounded-sm ${logged ? 'bg-indigo-500' : 'bg-white/10'}`}
            />
          ))}
        </div>
      </div>
    </>
  );
}
