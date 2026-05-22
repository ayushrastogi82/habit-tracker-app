import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import ShareableCard from './ShareableCard';

const CARD_TYPES = [
  { id: 'streak',  label: '🔥 Streak'    },
  { id: 'week',    label: '📅 This Week'  },
  { id: 'month',   label: '📆 Month'      },
  { id: '30days',  label: '📊 30 Days'    },
  { id: 'all',     label: '🗂 All Habits' },
];

export default function ShareModal({ habit, habits, onClose }) {
  const [cardType, setCardType] = useState('streak');
  const [format, setFormat] = useState('square');
  const [sharing, setSharing] = useState(false);
  const cardRef = useRef(null);

  const isAllType = cardType === 'all';
  const activeHabit = isAllType ? null : habit;

  const captureCard = async () => {
    if (!cardRef.current) return null;
    const canvas = await html2canvas(cardRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
      logging: false,
    });
    return canvas;
  };

  const handleDownload = async () => {
    setSharing(true);
    try {
      const canvas = await captureCard();
      if (!canvas) return;
      const link = document.createElement('a');
      link.download = `habit-progress-${cardType}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setSharing(false);
    }
  };

  const handleNativeShare = async (target) => {
    setSharing(true);
    try {
      const canvas = await captureCard();
      if (!canvas) return;
      canvas.toBlob(async (blob) => {
        const file = new File([blob], 'habit-progress.png', { type: 'image/png' });
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'My Habit Progress' });
        } else {
          // Fallback: download
          const link = document.createElement('a');
          link.download = 'habit-progress.png';
          link.href = canvas.toDataURL('image/png');
          link.click();
        }
      }, 'image/png');
    } finally {
      setSharing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h2 className="text-base font-bold text-gray-800">Share Progress</h2>
            <p className="text-xs text-gray-500 mt-0.5">{isAllType ? 'All habits overview' : habit?.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-lg font-bold">×</button>
        </div>

        {/* Card type tabs */}
        <div className="flex gap-1.5 px-5 pb-3 overflow-x-auto scrollbar-hide">
          {CARD_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => setCardType(t.id)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                cardType === t.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >{t.label}</button>
          ))}
        </div>

        {/* Card preview */}
        <div className="flex justify-center px-5 pb-3">
          <div className="relative" style={{ transform: 'scale(0.82)', transformOrigin: 'top center', marginBottom: format === 'portrait' ? '-20px' : '-42px' }}>
            <ShareableCard
              ref={cardRef}
              habit={activeHabit}
              habits={habits}
              cardType={cardType}
              format={format}
            />
          </div>
        </div>

        {/* Format toggle */}
        <div className="flex justify-center gap-2 px-5 pb-4 mt-1">
          {['square', 'portrait'].map(f => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                format === f ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >{f === 'square' ? '⬜ Square' : '📱 Portrait'}</button>
          ))}
        </div>

        {/* Share buttons */}
        <div className="px-5 pb-5 flex flex-col gap-2">
          {/* Native share (WhatsApp, Instagram, etc.) */}
          <button
            onClick={() => handleNativeShare()}
            disabled={sharing}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white text-sm font-bold shadow-md active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {sharing ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : '↗'}
            Share to Instagram / WhatsApp / More
          </button>
          {/* Download */}
          <button
            onClick={handleDownload}
            disabled={sharing}
            className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            ⬇ Download PNG
          </button>
        </div>
      </div>
    </div>
  );
}
