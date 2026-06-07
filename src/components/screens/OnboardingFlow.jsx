import { useState, useEffect } from 'react'
import {
  ChevronLeft, ChevronRight, Check, Leaf, Sunrise, Moon,
  Share2, PlusSquare, MoreVertical, Download,
  Infinity as InfinityIcon
} from 'lucide-react'
import BeaconMark from '../modules/BeaconMark'

// ── Platform detection ─────────────────────────────────────────────────────────
function isStandalone() {
  try {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    )
  } catch {
    return false
  }
}

function getInstallPlatform() {
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'other'
}

// ── Seeded deterministic random (for stable mock calendar) ─────────────────────
function seededRandom(seed) {
  let s = seed >>> 0
  return () => {
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b)
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b)
    s ^= s >>> 16
    return (s >>> 0) / 0x100000000
  }
}

// ── Back button — in-flow (not absolute) so safe-area padding on the parent works ─
function BackButton({ onBack }) {
  if (!onBack) return null
  return (
    <div className="flex-shrink-0 px-2 pt-1">
      <button
        onClick={onBack}
        className="p-3 text-app-tertiary hover:text-app-secondary transition-colors active:scale-95"
        aria-label="Go back"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
    </div>
  )
}

// ── Progress dots (6 total — install screen is outside the dotted flow) ────────
function Dots({ active }) {
  return (
    <div className="pb-4 flex gap-2 justify-center">
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-colors ${
            i === active ? 'bg-app-accent' : 'bg-app-elevated'
          }`}
        />
      ))}
    </div>
  )
}

// ── Root component ─────────────────────────────────────────────────────────────
export default function OnboardingFlow({ onComplete, migrated }) {
  const [screen, setScreen] = useState(0)
  const [name, setName]     = useState('')
  const [pwa]               = useState(() => isStandalone())
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  // Capture Android install prompt before it's auto-dismissed
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Migrated users (had data before Beacon) — welcome back, skip to name
  if (migrated && screen === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-app-bg px-6" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold text-white">Welcome back!</h2>
          <p className="text-app-secondary">Your data is safe. Continue logging with Beacon.</p>
          <button
            onClick={() => setScreen(5)}
            className="mt-6 bg-app-green-surface border border-app-green text-white px-6 py-2 rounded-xl transition-opacity hover:opacity-80"
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  // Screen routing:
  // PWA:     0→2→3→4→5→6
  // Browser: 0→1→2→3→4→5→6
  // Back nav reverses each step in the same flow.
  const screenMap = {
    0: (
      <SplashScreen
        onNext={() => pwa ? setScreen(2) : setScreen(1)}
        dotActive={0}
      />
    ),
    1: (
      <InstallScreen
        deferredPrompt={deferredPrompt}
        onNext={() => setScreen(2)}
        onSkip={() => setScreen(2)}
      />
    ),
    2: (
      <PhilosophyScreen
        onNext={() => setScreen(3)}
        onBack={() => setScreen(pwa ? 0 : 1)}
        dotActive={1}
      />
    ),
    3: (
      <OneTapScreen
        onNext={() => setScreen(4)}
        onBack={() => setScreen(2)}
        dotActive={2}
      />
    ),
    4: (
      <WatchItScreen
        onNext={() => setScreen(5)}
        onBack={() => setScreen(3)}
        dotActive={3}
      />
    ),
    5: (
      <NameScreen
        name={name}
        setName={setName}
        onNext={() => setScreen(6)}
        onSkip={() => setScreen(6)}
        onBack={() => setScreen(4)}
        dotActive={4}
      />
    ),
    6: (
      <ConfirmScreen
        name={name}
        onComplete={() => onComplete(name)}
      />
    ),
  }

  return screenMap[screen] ?? screenMap[0]
}

// ── Screen 1: Splash ───────────────────────────────────────────────────────────
// Full signal mark, free-floating glow, gentle slow pulse.
// Bookend #1 — "the light is always on."
function SplashScreen({ onNext, dotActive }) {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-app-bg px-6" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="flex flex-col items-center gap-6 text-center">
        {/* Free-floating mark — no tile, glow shows on dark bg, breathes slowly */}
        <BeaconMark size={160} tile={false} pulse={true} ripple={true} />

        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white tracking-tight">Beacon</h1>
          <p className="text-lg text-app-secondary">Your light is always on.</p>
        </div>

        <button
          onClick={onNext}
          className="w-full max-w-xs bg-app-green-surface border border-app-green text-white font-semibold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]"
        >
          Get started
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <Dots active={dotActive} />
      </div>
    </div>
  )
}

// ── Shared step-card for install instructions ─────────────────────────────────
function InstallSteps({ steps }) {
  return (
    <div className="bg-app-surface rounded-2xl border border-app-elevated divide-y divide-app-elevated text-left">
      {steps.map(({ n, icon, text }) => (
        <div key={n} className="flex items-center gap-4 px-4 py-3.5">
          <span className="w-6 h-6 rounded-full bg-app-accent/15 flex items-center justify-center flex-shrink-0 text-[12px] font-bold text-app-accent-dim">
            {n}
          </span>
          {icon}
          <p className="text-[14px] text-app-text flex-1">{text}</p>
        </div>
      ))}
    </div>
  )
}

// ── D-Install: PWA install prompt (browser only, outside page dots) ───────────
// Platform-aware:
//   iOS Safari  → 3-step manual (Share → Add to Home Screen → Add)
//   Android     → native prompt if available, otherwise 3-step manual (Menu → Add to Home Screen → Add)
//   Other       → generic nudge to open on mobile
// "Maybe later" is always visible — no nag.
function InstallScreen({ deferredPrompt, onNext, onSkip }) {
  const platform = getInstallPlatform()

  const handleAndroidInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') onNext()
    }
  }

  // iOS Safari — 3-step Share sheet flow
  const iosSteps = [
    {
      n: '1',
      icon: <Share2 className="w-5 h-5 text-app-accent-dim flex-shrink-0" />,
      text: <>Tap the <span className="text-app-accent-dim font-semibold">Share</span> button below</>
    },
    {
      n: '2',
      icon: <PlusSquare className="w-5 h-5 text-app-accent-dim flex-shrink-0" />,
      text: <>Choose <span className="text-app-accent-dim font-semibold">Add to Home Screen</span></>
    },
    {
      n: '3',
      icon: <Check className="w-5 h-5 text-app-accent-dim flex-shrink-0" />,
      text: <>Tap <span className="text-app-accent-dim font-semibold">Add</span> — and you're set</>
    },
  ]

  // Android Chrome manual — 3-dot menu flow (fallback when no native prompt)
  const androidSteps = [
    {
      n: '1',
      icon: <MoreVertical className="w-5 h-5 text-app-accent-dim flex-shrink-0" />,
      text: <>Tap the <span className="text-app-accent-dim font-semibold">Menu</span> button (⋮ top right)</>
    },
    {
      n: '2',
      icon: <Download className="w-5 h-5 text-app-accent-dim flex-shrink-0" />,
      text: <>Choose <span className="text-app-accent-dim font-semibold">Add to Home Screen</span></>
    },
    {
      n: '3',
      icon: <Check className="w-5 h-5 text-app-accent-dim flex-shrink-0" />,
      text: <>Tap <span className="text-app-accent-dim font-semibold">Add</span> — and you're set</>
    },
  ]

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-app-bg px-6" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="w-full max-w-sm space-y-8 text-center">
        {/* Small mark — no tile */}
        <BeaconMark size={60} tile={false} className="mx-auto" />

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Keep your light on</h2>
          <p className="text-app-secondary text-[15px]">
            Add Beacon to your home screen so it's always one tap away.
          </p>
        </div>

        {/* Android Chrome — native prompt if browser offers it, manual steps otherwise */}
        {platform === 'android' && (
          deferredPrompt ? (
            <button
              onClick={handleAndroidInstall}
              className="w-full bg-app-green-surface border border-app-green text-white font-semibold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]"
            >
              Add to home screen
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <InstallSteps steps={androidSteps} />
          )
        )}

        {/* iOS Safari — and 'other' fallback (covers "Request Desktop Website" UA spoofing) */}
        {platform !== 'android' && <InstallSteps steps={iosSteps} />}

        {/* Non-blocking dismiss — always visible */}
        <button
          onClick={onSkip}
          className="text-[14px] text-app-tertiary hover:text-app-secondary transition-colors"
        >
          Maybe later
        </button>
      </div>
    </div>
  )
}

// ── Screen 2: Our philosophy ───────────────────────────────────────────────────
// Inoculates against streak-app conditioning.
// Positive framing only — "never lost" not "no punishment."
function PhilosophyScreen({ onNext, onBack, dotActive }) {
  const items = [
    {
      Icon: Leaf,
      title: 'Starting is the hardest part',
      copy: "Name it, tap once, and you've begun. Beacon keeps the rest simple.",
    },
    {
      Icon: Sunrise,
      title: 'Showing up beats being perfect',
      copy: "An imperfect habit still counts. That's the whole idea.",
    },
    {
      Icon: InfinityIcon,
      title: 'Your progress is never lost',
      copy: "A broken run erases nothing — every day you've shown up is still yours. Come back whenever you like.",
    },
  ]

  return (
    <div className="h-screen flex flex-col bg-app-bg" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <BackButton onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8">
        {/* Kicker + mark */}
        <div className="flex flex-col items-center gap-3">
          <BeaconMark size={60} tile={false} />
          <p className="text-[13px] font-semibold uppercase tracking-widest text-app-accent-dim">
            Our philosophy
          </p>
        </div>

        <h2 className="text-[26px] font-bold text-white leading-tight">
          Life happens. Beacon keeps your light on.
        </h2>

        <div className="space-y-6">
          {items.map(({ Icon, title, copy }) => (
            <div key={title} className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-app-accent/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon className="w-5 h-5 text-app-accent-dim" />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="font-semibold text-white text-[15px]">{title}</h3>
                <p className="text-[14px] text-app-secondary leading-relaxed">{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-app-elevated px-6 py-4">
        <button
          onClick={onNext}
          className="w-full bg-app-green-surface border border-app-green text-white font-semibold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]"
        >
          That sounds good
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <Dots active={dotActive} />
    </div>
  )
}

// ── Screen 3: One tap to log ───────────────────────────────────────────────────
// Faithful Today snippet. No streak label — meta line reads "Daily."
function OneTapScreen({ onNext, onBack, dotActive }) {
  const today = new Date()
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  const hour = today.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="h-screen flex flex-col bg-app-bg" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <BackButton onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
        <div>
          <h2 className="text-[26px] font-bold text-white mb-1">One tap to log.</h2>
          <p className="text-app-secondary">That's the whole app.</p>
        </div>

        {/* Mock Today snippet */}
        <div className="bg-app-surface rounded-2xl border border-app-elevated overflow-hidden">
          {/* Greeting row */}
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className="w-1.5 h-1.5 rounded-full bg-app-accent-dim inline-block flex-shrink-0"
                style={{ boxShadow: '0 0 0 2.5px rgba(45,212,191,0.12), 0 0 5px rgba(45,212,191,0.18)' }}
              />
              <span className="text-[13px] text-app-secondary">{greeting}</span>
            </div>
            <p className="text-[22px] font-bold text-white">Today, {dateStr}</p>
          </div>

          {/* Section label */}
          <div className="px-4 pb-2">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-app-secondary">
              MORNING
            </p>
          </div>

          {/* Habit 1 — logged (checked, muted) */}
          <div className="px-4 py-3 flex items-center gap-3 border-t border-app-elevated">
            <div className="w-10 h-10 rounded-xl bg-app-accent/15 flex items-center justify-center flex-shrink-0">
              <Sunrise className="w-5 h-5 text-app-accent-dim" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-app-secondary text-[15px] line-through leading-tight">
                Morning walk
              </p>
              <p className="text-[12px] text-app-secondary/60 mt-0.5">Daily</p>
            </div>
            {/* Filled check circle */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--app-green)' }}
            >
              <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
          </div>

          {/* Habit 2 — not logged (empty ring) */}
          <div className="px-4 py-3 flex items-center gap-3 border-t border-app-elevated">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center flex-shrink-0">
              <Moon className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-[15px] leading-tight">Prayer</p>
              <p className="text-[12px] text-app-secondary mt-0.5">Daily</p>
            </div>
            {/* Empty teal ring */}
            <div className="w-7 h-7 rounded-full border-2 border-app-accent/80 flex-shrink-0 opacity-80" />
          </div>
        </div>

        <p className="text-[13px] text-app-accent-dim text-center font-medium">
          Tap the circle — that's it.
        </p>
      </div>

      <div className="border-t border-app-elevated px-6 py-4">
        <button
          onClick={onNext}
          className="w-full bg-app-green-surface border border-app-green text-white font-semibold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <Dots active={dotActive} />
    </div>
  )
}

// ── Screen 4: Watch it add up ──────────────────────────────────────────────────
// Mirrors the real SixMonthGrid: 26 fixed weeks anchored to Jan 1, repeat(26,1fr)
// so columns always fill the card width on every screen size.
function WatchItScreen({ onNext, onBack, dotActive }) {
  const rand = seededRandom(42)

  // Same anchor as the real grid: Sunday on-or-before Jan 1 of current year
  const todayDate = new Date()
  const todayStr  = todayDate.toISOString().slice(0, 10)
  const jan1 = new Date(todayDate.getFullYear(), 0, 1)
  const startDate = new Date(jan1)
  startDate.setDate(jan1.getDate() - jan1.getDay()) // e.g. Dec 28

  const WEEKS = 26
  const weeks = [] // each entry: array of 7 date strings
  const cursor = new Date(startDate)
  for (let w = 0; w < WEEKS; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      week.push(cursor.toISOString().slice(0, 10))
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }

  // Label by Thursday (index 3) — exactly like the real grid
  const monthSpans = []
  weeks.forEach((week) => {
    const thu   = week[3]
    const mo    = thu.substring(0, 7)
    const label = new Date(thu + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })
    if (!monthSpans.length || monthSpans[monthSpans.length - 1].mo !== mo) {
      monthSpans.push({ mo, label, count: 1 })
    } else {
      monthSpans[monthSpans.length - 1].count++
    }
  })

  // DOW column width — matches the real grid constant
  const DOW_W = 10

  return (
    <div className="h-screen flex flex-col bg-app-bg" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <BackButton onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
        <div>
          <h2 className="text-[26px] font-bold text-white mb-1">Watch your progress add up.</h2>
          <p className="text-app-secondary">Six months, at a glance.</p>
        </div>

        {/* Mock Progress card */}
        <div className="bg-app-surface rounded-2xl border border-app-elevated p-4 space-y-4">
          {/* Header row */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-app-accent/15 flex items-center justify-center flex-shrink-0">
              <Sunrise className="w-5 h-5 text-app-accent-dim" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-[15px] leading-tight">Morning walk</p>
              <p className="text-[12px] text-app-accent-dim mt-0.5">Daily · on a run 28 days</p>
            </div>
          </div>

          {/* 1×4 stat row */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { value: '18d',  label: 'This month' },
              { value: '142d', label: 'Total ever' },
              { value: '6mo',  label: 'Started'    },
              { value: '31d',  label: 'Best run'   },
            ].map(({ value, label }) => (
              <div key={label} className="bg-app-bg rounded-xl px-1 py-2 text-center">
                <p className="text-app-accent font-bold text-[14px] leading-tight">{value}</p>
                <p className="text-app-secondary text-[9px] mt-0.5 leading-snug whitespace-nowrap">{label}</p>
              </div>
            ))}
          </div>

          {/* 6-month grid — mirrors SixMonthGrid: repeat(26,1fr) fills full width */}
          <div className="space-y-1">
            {/* Month labels — flex proportional to week count, same as real grid */}
            <div className="flex" style={{ paddingLeft: DOW_W + 3 }}>
              {monthSpans.map(({ mo, label, count }, idx) => (
                <div
                  key={mo}
                  className="text-[9px] text-app-tertiary leading-none overflow-hidden"
                  style={{ flex: count }}
                >
                  {count >= 2 || idx === monthSpans.length - 1 ? label : ''}
                </div>
              ))}
            </div>

            {/* DOW labels + CSS grid */}
            <div className="flex items-start" style={{ gap: 3 }}>
              {/* Day-of-week column */}
              <div className="flex flex-col" style={{ gap: 2, width: DOW_W, flexShrink: 0 }}>
                {['S','M','T','W','T','F','S'].map((l, i) => (
                  <div key={i} className="text-[7px] text-app-tertiary leading-none text-right"
                    style={{ height: 9, lineHeight: '9px' }}>
                    {i % 2 === 1 ? l : ''}
                  </div>
                ))}
              </div>

              {/* repeat(26, 1fr) — always fills available width */}
              <div style={{
                flex: 1,
                minWidth: 0,
                display: 'grid',
                gridTemplateColumns: `repeat(${WEEKS}, 1fr)`,
                gridTemplateRows: 'repeat(7, 9px)',
                gridAutoFlow: 'column',
                gap: '2px',
              }}>
                {weeks.flatMap((week, wi) =>
                  week.map((dateStr, di) => {
                    const isFuture = dateStr > todayStr
                    const logged   = !isFuture && rand() > 0.12
                    return (
                      <div
                        key={`${wi}-${di}`}
                        style={{
                          borderRadius: 2,
                          backgroundColor: isFuture
                            ? 'var(--app-cell-future)'
                            : logged
                            ? 'var(--app-accent-color)'
                            : 'var(--app-cell-past)',
                        }}
                      />
                    )
                  })
                )}
              </div>
            </div>
          </div>

          <p className="text-center text-[13px] text-app-secondary italic">Still going.</p>
        </div>
      </div>

      <div className="border-t border-app-elevated px-6 py-4">
        <button
          onClick={onNext}
          className="w-full bg-app-green-surface border border-app-green text-white font-semibold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <Dots active={dotActive} />
    </div>
  )
}

// ── Screen 5: What should we call you? ────────────────────────────────────────
// Name is optional — "Maybe later" skips without pressure.
function NameScreen({ name, setName, onNext, onSkip, onBack, dotActive }) {
  const disabled = !name.trim()

  return (
    <div className="h-screen flex flex-col bg-app-bg" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <BackButton onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
        {/* Small mark above heading */}
        <div className="flex flex-col items-center gap-3 mb-2">
          <BeaconMark size={60} tile={false} />
        </div>

        <div className="space-y-2">
          <h2 className="text-[26px] font-bold text-white">What should we call you?</h2>
          <p className="text-app-secondary text-[15px]">
            Beacon will use it to greet you — nothing else.
          </p>
        </div>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !disabled && onNext()}
          placeholder="Your name"
          autoFocus
          className="w-full px-4 py-3.5 rounded-xl border border-app-elevated bg-app-surface text-white placeholder-app-secondary focus:outline-none focus:border-app-accent text-[15px]"
          style={{ caretColor: 'var(--app-accent-color)' }}
        />
      </div>

      <div className="border-t border-app-elevated px-6 py-4 space-y-3">
        <button
          onClick={onNext}
          disabled={disabled}
          className={`w-full font-semibold py-3.5 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${
            disabled
              ? 'bg-app-elevated text-app-tertiary cursor-not-allowed'
              : 'bg-app-green-surface border border-app-green text-white hover:opacity-90'
          }`}
        >
          Continue
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Low-pressure skip */}
        <button
          onClick={onSkip}
          className="w-full py-2 text-[14px] text-app-tertiary hover:text-app-secondary transition-colors text-center"
        >
          Maybe later
        </button>
      </div>
      <Dots active={dotActive} />
    </div>
  )
}

// ── Screen 6: You're all set ───────────────────────────────────────────────────
// Bookend #2 — the light turning on. Mark pulses gently.
// No separate dot — the glowing mark IS the indicator.
// No progress dots on this screen.
function ConfirmScreen({ name, onComplete }) {
  const displayName = name
    ? name.charAt(0).toUpperCase() + name.slice(1)
    : ''

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-app-bg px-6" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="flex flex-col items-center gap-6 text-center max-w-sm w-full">
        {/* Hero mark — the light turning on */}
        <BeaconMark size={140} tile={false} pulse={true} ripple={true} />

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">
            {displayName ? `${displayName}, you're all set.` : "You're all set."}
          </h1>
          <p className="text-app-secondary text-[15px] leading-relaxed">
            Beacon is ready. No pressure — just show up when you can.
          </p>
        </div>

        {/* Status line — present-tense ignite. Mark is the indicator; no dot here. */}
        <p className="text-app-accent-dim font-medium text-[15px]">
          Your light is on
        </p>

        <button
          onClick={onComplete}
          className="w-full bg-app-green-surface border border-app-green text-white font-semibold py-3.5 px-6 rounded-2xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          Go to my habits
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
