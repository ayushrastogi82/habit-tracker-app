import { useEffect, useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { initializeState, setUserProfile, setHabits, setLogs, setOnboardingComplete, setTheme as saveTheme, setProgressViewMode } from './utils/storageUtils'
import OnboardingFlow from './components/screens/OnboardingFlow'
import MainApp from './components/MainApp'

export default function App() {
  // initializeState() is synchronous localStorage reads — no async needed.
  // Lazy useState so it runs exactly once, on mount, with no loading flash.
  const [state, setState] = useState(() => initializeState())
  const [theme, setThemeLocal] = useState(() => {
    try { return localStorage.getItem('beacon-theme') || 'system' } catch { return 'system' }
  })
  const [colorScheme, setColorScheme] = useState(() => {
    try { return localStorage.getItem('beacon-color-scheme') || '1' } catch { return '1' }
  })

  // The inline script in index.html already applied the correct dark class before
  // the first paint. This effect only needs to run if React ever re-applies the
  // theme programmatically (e.g. system preference changes mid-session).
  useEffect(() => {
    if (theme !== 'system') {
      applyTheme(theme)
    } else {
      applySystemTheme()
    }
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') {
        applySystemTheme()
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const applyTheme = (themeValue) => {
    if (themeValue === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const applySystemTheme = () => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const updateTheme = (newTheme) => {
    setThemeLocal(newTheme)
    saveTheme(newTheme)
    if (newTheme === 'system') {
      applySystemTheme()
    } else {
      applyTheme(newTheme)
    }
  }

  const updateColorScheme = (scheme) => {
    setColorScheme(scheme)
    try { localStorage.setItem('beacon-color-scheme', scheme) } catch {}
    document.documentElement.classList.remove('dark-scheme-2', 'dark-scheme-3', 'dark-scheme-4')
    if (scheme === '2') document.documentElement.classList.add('dark-scheme-2')
    else if (scheme === '3') document.documentElement.classList.add('dark-scheme-3')
    else if (scheme === '4') document.documentElement.classList.add('dark-scheme-4')
  }

  // Apply persisted scheme on mount (after theme class is already set by inline script)
  useEffect(() => {
    const saved = (() => { try { return localStorage.getItem('beacon-color-scheme') } catch { return null } })()
    if (saved && saved !== '1') updateColorScheme(saved)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Show onboarding only when the user is genuinely new:
  // - hasn't completed it yet, AND
  // - has no name set, AND
  // - has no habits (i.e. didn't just restore a backup which skips onboarding)
  const showOnboarding = !state.onboardingComplete && !state.userProfile.name && state.habits.length === 0

  return (
    <>
      {showOnboarding ? (
        <OnboardingFlow
          onComplete={(name) => {
            setUserProfile({ name })
            setOnboardingComplete(true)
            setState((prev) => ({
              ...prev,
              userProfile: { name },
              onboardingComplete: true
            }))
          }}
          migrated={state.migrated}
        />
      ) : (
        <MainApp
          state={state}
          setState={setState}
          updateTheme={updateTheme}
          theme={theme}
          colorScheme={colorScheme}
          updateColorScheme={updateColorScheme}
          onImportData={({ habits, logs, userProfile }) => {
            setState(prev => ({
              ...prev,
              habits,
              logs,
              // keep existing name if the backup had none
              userProfile: (userProfile?.name) ? userProfile : prev.userProfile,
              onboardingComplete: true,
            }))
          }}
        />
      )}
      <Analytics />
    </>
  )
}
