/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  safelist: [
    // Force-generate all design token classes so a cold Vite start never
    // produces blank cards (PostCSS won't rebuild from HMR on config changes).
    'bg-app-bg', 'bg-app-surface', 'bg-app-elevated',
    'text-app-bg', 'text-app-surface', 'text-app-elevated',
    'text-app-secondary', 'text-app-tertiary', 'text-app-text',
    'border-app-bg', 'border-app-surface', 'border-app-elevated',
    'bg-app-green', 'bg-app-green-surface',
    'text-app-green', 'border-app-green',
    'bg-app-red', 'text-app-red', 'border-app-red',
    // accent
    'bg-app-accent', 'text-app-accent', 'border-app-accent', 'ring-app-accent',
    'bg-app-accent-dim', 'text-app-accent-dim', 'ring-app-accent-dim',
    'bg-app-accent/10', 'bg-app-accent/20', 'bg-app-accent/50', 'bg-app-accent/60',
    'text-app-accent/60',
    'border-app-accent/20', 'border-app-accent/50',
    'ring-app-accent/50',
    'text-app-accent-dim/40',
    // grid cell states
    'bg-app-cell-past', 'bg-app-cell-future',
    // opacity variants
    'bg-app-elevated/40', 'bg-app-elevated/60', 'bg-app-elevated/70',
    'border-app-elevated/60',
    'bg-app-red/15', 'border-app-red/30',
    'bg-app-green-surface/80',
  ],
  theme: {
    extend: {
      colors: {
        // ── Design tokens — all reference CSS variables so light/dark works
        //    automatically via :root vs html.dark in index.css
        'app-bg':           'var(--app-bg)',
        'app-surface':      'var(--app-surface)',
        'app-elevated':     'var(--app-elevated)',
        'app-secondary':    'var(--app-secondary)',
        'app-tertiary':     'var(--app-tertiary)',
        'app-green':        'var(--app-green)',
        'app-green-surface':'var(--app-green-surface)',
        'app-red':          'var(--app-red)',
        'app-text':         'var(--app-text)',   // primary label — black in light, white in dark
        // Accent — scheme-aware, supports opacity modifiers (bg-app-accent/10 etc.)
        'app-accent':     'rgb(var(--app-accent-rgb) / <alpha-value>)',
        'app-accent-dim': 'rgb(var(--app-accent-dim-rgb) / <alpha-value>)',
        // Grid cell states
        'app-cell-past':   'var(--app-cell-past)',
        'app-cell-future': 'var(--app-cell-future)',
      },
    },
  },
  plugins: [],
}
