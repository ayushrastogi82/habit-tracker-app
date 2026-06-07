// Centralized copy strings organized by context
// All user-facing text should come from here to ensure consistent brand voice

export const brand = {
  name: 'Beacon',
  tagline: 'Your light is always on.',
  philosophy: 'Showing up matters more than being perfect.',

  // Onboarding screens
  onboarding: {
    welcome: {
      heading: 'Beacon',
      tagline: 'Your light is always on.',
      cta: 'Get started'
    },
    install: {
      headline: 'Add Beacon to your home screen for the best experience',
      copy: 'Beacon stores your habits on this device. Adding it to your home screen keeps your progress safe — even when you close the browser.',
      ios: {
        title: 'iOS steps (Safari)',
        steps: [
          'Tap the Share button at the bottom of Safari',
          'Scroll down and tap Add to Home Screen, then Add',
          'Open Beacon from your home screen to continue'
        ]
      },
      android: {
        title: 'Android steps (Chrome)',
        steps: [
          'Tap the three dots in Chrome\'s top right',
          'Tap Add to Home Screen, then Add to confirm',
          'Open Beacon from your home screen to continue'
        ]
      },
      ctaPrimary: 'Done, I\'ve added it',
      ctaSecondary: 'Skip for now'
    },
    philosophy: {
      headline: 'Most habit apps punish you for missing a day. Beacon doesn\'t.',
      items: [
        {
          title: 'Come back anytime.',
          copy: 'Miss a day, a week, a month — your habits are still here waiting.'
        },
        {
          title: 'No streaks to protect.',
          copy: 'Your progress is measured in total days, not perfect runs.'
        },
        {
          title: 'Showing up matters more than being perfect.',
          copy: 'That\'s the whole idea.'
        }
      ],
      cta: 'That sounds good'
    },
    name: {
      headline: 'What should we call you?',
      sub: 'Just your first name. So we can say good morning properly.',
      placeholder: 'Your name',
      cta: 'Continue'
    },
    firstHabit: {
      headline: (name) => `${name}, what's one thing you want to show up for?`,
      sub: 'Just one to start. You can add more any time.',
      cta: 'Start tracking'
    },
    confirmation: {
      heading: (name) => `${name}, you're all set.`,
      copy: (habitName) => `${habitName} is ready. No pressure — just show up when you can.`,
      pill: 'Your light is on',
      cta: 'Go to my habits'
    }
  },

  // Today screen
  today: {
    greeting: (name, timeOfDay) => {
      const times = {
        morning: 'morning',
        afternoon: 'afternoon',
        evening: 'evening'
      };
      return `Good ${times[timeOfDay] || timeOfDay}, ${name}`;
    },
    date: (weekday, month, day) => `${weekday}, ${month} ${day}`,
    pill: 'Your light is on',
    noHabits: 'Nothing here yet. Tap + to add your first habit.',
    bottomBannerDefault: 'Whenever you\'re ready — we\'re here. No catching up needed. Just today.',
    bottomBannerAllDone: 'That\'s everything. Well done today. Same time tomorrow.'
  },

  // Add habit screen
  addHabit: {
    heading: 'What\'s your habit?',
    nameLabel: 'Habit name',
    namePlaceholder: 'e.g. Drink water',
    whenLabel: 'When?',
    whenOptions: ['Morning', 'Afternoon', 'Evening', 'Anytime'],
    hints: {
      empty: 'pick a name and a time',
      nameOnly: 'now pick a time',
      timeOnly: 'what\'s the habit called?'
    },
    ctaPrimary: 'Add habit',
    confirmation: {
      heading: (habitName) => `${habitName} added`,
      sub: (timeOfDay) => {
        const times = {
          morning: 'morning',
          afternoon: 'afternoon',
          evening: 'evening',
          anytime: 'anytime'
        };
        return `It'll show up in your ${times[timeOfDay] || timeOfDay} list. No pressure — just show up when you can.`;
      },
      ctaPrimary: 'Add another habit',
      ctaSecondary: 'Go to today'
    }
  },

  // Log screen
  log: {
    heading: 'Your history',
    emptyState: 'Your history will appear here as you start logging.',
    expandedCopy: (day) => {
      const copies = {
        today: 'Logging for today — no rush.',
        yesterday: 'Logging for yesterday. Better late than never.',
        other: 'Logging for this day. Still counts.'
      };
      return copies[day] || copies.other;
    }
  },

  // Progress screen
  progress: {
    modeToggle: ['Simple', 'Detailed'],
    simple: {
      legend: ['less', '', '', 'more'],
      insights: {
        mostConsistent: 'Most consistent',
        mostReturnedTo: 'Most returned to',
        daysShowedUp: 'Days you showed up'
      },
      insightCopy: {
        mostConsistent: (days, total) => `Showing up ${days} out of ${total} days`,
        mostReturnedTo: 'You keep coming back to this one',
        daysShowedUp: (days) => `${days} days this month. You're showing up.`
      }
    },
    detailed: {
      state: {
        onARun: (days) => `On a run · ${days}d`,
        away: (days) => `Away · ${days}d`,
        onTarget: 'On target',
        partialProgress: (done, total) => `${done} of ${total}`,
        notYet: 'Not yet'
      },
      statLabel: {
        thisMonth: 'This month so far',
        allTime: 'All time',
        started: 'Started',
        bestRun: 'Best run'
      },
      monthComparison: (daysCompared) => `First ${daysCompared} days`,
      monthComparisonPill: {
        ahead: 'Ahead of last month',
        same: 'Same pace',
        behind: 'Behind last month\'s pace'
      },
      nudge: {
        strong: (days) => `${days} days running.`,
        consistent: 'Showing up consistently.',
        comeback: (bestRun) => `Been a while. Your best was ${bestRun} days — it's still there.`,
        light: () => "Come back whenever you're ready."
      }
    },
    shareCard: {
      title: 'Share your progress',
      types: ['Milestone', 'Comeback', 'All time'],
      themes: ['Light', 'Dark', 'Teal', 'Deep green'],
      cta: 'Share card',
      ctaSecondary: 'Not now'
    }
  },

  // Manage habits screen
  manage: {
    heading: 'Manage habits',
    tabs: ['Active', 'Archived'],
    editHeading: (habitName) => `Edit ${habitName}`,
    frequencyLabel: 'Frequency',
    frequencyOptions: {
      daily: 'Daily',
      weekly: 'Weekly',
      weeklyCustom: (n) => `${n}x per week`,
      monthly: 'Monthly'
    },
    archiveModal: {
      heading: (habitName) => `Archive ${habitName}?`,
      copy: (days) =>
        `Your ${days} days will be saved in Archived. A fresh start begins today. Or — gaps are fine, you could just keep going.`,
      ctaPrimary: 'Archive and restart',
      ctaSecondary: 'Keep going'
    },
    deleteModal: {
      heading: (habitName) => `Delete ${habitName}?`,
      copy: (days) =>
        `Your ${days} logged days will be removed. This can\'t be undone. Consider archiving instead — your history stays safe.`,
      ctaPrimary: 'Delete habit',
      ctaSecondary: 'Keep it'
    },
    archivedFooter: 'Archived habits are kept here. Your history is always safe.'
  },

  // Settings
  settings: {
    heading: 'Settings',
    sections: {
      profile: 'Profile',
      habits: 'Habits',
      notifications: 'Notifications',
      appearance: 'Appearance',
      data: 'Data',
      about: 'About'
    },
    yourName: 'Your name',
    manageHabits: 'Manage habits',
    addHabit: 'Add a habit',
    notifications: {
      toggle: 'Daily check-in',
      label: 'Off by default',
      reminderTime: 'Reminder time',
      copies: [
        'Your habits are waiting. No rush.',
        'Today\'s a good day to show up.',
        'Whenever you\'re ready.',
        'Your light is on.',
        'One day at a time.'
      ]
    },
    appearance: {
      theme: 'Theme',
      options: ['Light', 'Dark', 'System']
    },
    data: {
      backup: 'Download backup',
      backupCopy: 'Beacon stores data on your device. Download a backup to keep your progress safe.',
      restore: 'Upload backup',
      restoreModal: {
        heading: 'Restore from backup?',
        copy: 'This will replace your current data with the backup file. Your existing habits and logs will be overwritten.',
        ctaPrimary: 'Restore from backup',
        ctaSecondary: 'Cancel'
      },
      deleteAll: 'Delete all data',
      deleteModal: {
        heading: 'Delete all data?',
        copy: 'This removes all your habits and every day you\'ve logged. Consider downloading a backup first — just in case.',
        highlight: 'downloading a backup',
        ctaPrimary: 'Yes, delete everything',
        ctaSecondary: 'Keep my data'
      }
    },
    about: {
      version: 'Version 1.0',
      privacyPolicy: 'Privacy policy',
      brand: 'Your light is always on.'
    }
  },

  // Empty states
  emptyStates: {
    todayNoHabits: 'Nothing here yet. Tap + to add your first habit.',
    logNoHistory: 'Your history will appear here as you start logging.',
    progressNoData: 'Keep logging and your progress will start to show here.',
    archivedNothing: 'Nothing archived yet. Habits you archive will live here.'
  },

  // Copy rules (meta)
  rules: {
    never: ['missed', 'failed', 'broke', 'skipped', 'streak', 'give up'],
    always: ['away', 'on a run', 'come back anytime', 'showing up matters', 'your light is on']
  },

  // ── Moment messages (Part C) ─────────────────────────────────────────────────
  // Arrays = rotate variants so the app never feels robotic.
  // Strings = fixed copy, ship exactly.
  // Use pick() to resolve.
  moments: {
    // Zone 2 day-status pill
    start_ready:      "Start when you're ready.",
    daily_logged:     'You showed up today.',
    late_night_empty: 'Your light is always on.',

    // First ever log in the app
    first_log: [
      'It begins.',
      'Day one. The hardest one.',
      "That's the first one. The rest follow.",
    ],

    // Run milestones — keyed by logged-day count
    run: {
      3:  "Three days running. It's becoming yours.",
      7:  'Seven days in a row.',
      14: 'Two weeks in a row. This is who you are now.',
      21: 'Three weeks running. It barely feels like effort anymore.',
    },

    // Total-days-ever milestones — keyed by count
    milestone: {
      10:  'Total ten days in. Real now.',
      30:  'Thirty days total. Look how far quiet effort gets you.',
      50:  "Fifty days logged. Most people never start. You kept going.",
      100: 'A hundred days of showing up. Look what quiet effort builds.',
      365: "A year. Not every day — but enough days. That's the point.",
    },

    // Tapping a rest-day cell on Progress grid / mini bar (B7)
    // This is the ONLY rest-day copy — no transient message on open/log (decided, do not re-add)
    rest_cell_tap: "Rest day. Show up regularly and the occasional off day won't break your run.",

    // Weekly/monthly target already met, user logs again (extra mile)
    extra_mile: [
      'More than you promised yourself.',
      'Beyond the target. Quietly remarkable.',
    ],

    // Nudge (habit not logged > NUDGE_AFTER_DAYS) — one gentle in-app nudge then silence
    nudge: [
      'Life gets full. 30 minutes is a lot to find. Could you give it one?',
      "Remember why you started. You don't have to do all of it — just one minute today.",
      "It's been a few days. No guilt. One small step is enough to begin again.",
    ],

    // Progress page motivational line (C2) — one quiet line under the grid
    progress_line: {
      on_a_run:     'Still going.',
      away:         "It's still here when you're ready.",
      just_started: 'Every progress starts with one day.',
      long_history: "Not every day. But enough days. That's the point.",
    },
  },
};

// Pick a random variant from an array, or return the string directly.
// Use everywhere a moment message is rendered.
export const pick = (variants) =>
  Array.isArray(variants)
    ? variants[Math.floor(Math.random() * variants.length)]
    : variants;
