import React, { useState } from 'react';
import ShareableCard from './ShareableCard';
import { drawCardToCanvas } from '../utils/drawCardToCanvas';

const TABS = [
  { key: 'streak', label: '🔥 Streak'    },
  { key: 'best',   label: '🏆 Best'      },
  { key: 'week',   label: '📅 Week'      },
  { key: '7days',  label: '🔲 Last 7'    },
  { key: '30days', label: '📊 30 Days'   },
  { key: 'month',  label: '📆 Month'     },
  { key: 'year',   label: '🗓 Year'      },
  { key: 'since',  label: '📈 All Time'  },
];

const APP_URL = window.location.hostname === 'localhost'
  ? 'habittracker.vercel.app'
  : window.location.hostname;

export default function ShareModal({ habit, onClose }) {
  const [activeStat, setActiveStat] = useState('streak');
  const [sharing, setSharing] = useState(false);

  async function handleShare() {
    setSharing(true);
    try {
      // Draw card directly to canvas — no html2canvas, pixel-perfect result
      const canvas = drawCardToCanvas(habit, activeStat, APP_URL);

      canvas.toBlob(async (blob) => {
        if (!blob) { setSharing(false); return; }
        const file = new File([blob], `${habit.name}-habit.png`, { type: 'image/png' });

        // `text` becomes the WhatsApp message body — the URL auto-links
        const shareData = {
          files: [file],
          title: `${habit.name} — Habit Tracker`,
          text: `Start tracking your habits on Habit Tracker🔥 https://${APP_URL}`,
        };

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share(shareData);
          } catch (err) {
            if (err.name !== 'AbortError') fallbackDownload(blob);
          }
        } else {
          fallbackDownload(blob);
        }
        setSharing(false);
      }, 'image/png');
    } catch (err) {
      console.error('Card draw error:', err);
      setSharing(false);
    }
  }

  function fallbackDownload(blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${habit.name}-habit.png`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      {/* Sheet */}
      <div
        className="bg-white rounded-t-2xl shadow-2xl w-full max-w-md mx-auto"
        style={{ animation: 'slideUp 0.3s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-3 mb-4" />

        {/* Title row */}
        <div className="flex items-center justify-between px-5 mb-4">
          <h2 className="text-base font-bold text-gray-800">Share Progress</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 active:scale-90 transition-all text-sm"
          >✕</button>
        </div>

        {/* Stat tabs */}
        <div className="flex gap-2 px-5 mb-5 overflow-x-auto pb-1">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveStat(tab.key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeStat === tab.key
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Card preview — HTML-based (for the in-app preview only) */}
        <div className="flex justify-center mb-6 px-5">
          <div
            style={{
              width: '252px',
              height: '350px',
              overflow: 'hidden',
              borderRadius: '17px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
              flexShrink: 0,
            }}
          >
            <div style={{ transform: 'scale(0.7)', transformOrigin: 'top left', width: '360px', height: '500px' }}>
              <ShareableCard habit={habit} stat={activeStat} appUrl={APP_URL} />
            </div>
          </div>
        </div>

        {/* Note about link */}
        <p className="text-center text-xs text-gray-400 px-6 mb-3">
          App link will be included as text in your message so it's tappable 🔗
        </p>

        {/* Share button */}
        <div className="px-5 pb-6" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
          <button
            onClick={handleShare}
            disabled={sharing}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-semibold text-sm shadow-lg active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {sharing ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Preparing…
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                Share Image
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
