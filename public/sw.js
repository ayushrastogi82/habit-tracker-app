// Habit Tracker Service Worker
// Handles scheduling and firing daily reminder notifications

let scheduledTimer = null;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for messages from the app
self.addEventListener('message', (event) => {
  const { type, time } = event.data || {};

  if (type === 'SCHEDULE_REMINDER') {
    scheduleNotification(time);
  } else if (type === 'CANCEL_REMINDER') {
    if (scheduledTimer) {
      clearTimeout(scheduledTimer);
      scheduledTimer = null;
    }
  }
});

function scheduleNotification(time) {
  // Clear any existing timer
  if (scheduledTimer) {
    clearTimeout(scheduledTimer);
    scheduledTimer = null;
  }

  const msUntilNext = getMsUntilTime(time);

  scheduledTimer = setTimeout(() => {
    fireNotification();
    // Re-schedule for the next day
    scheduleNotification(time);
  }, msUntilNext);
}

function getMsUntilTime(time) {
  // time is in "HH:MM" 24h format
  const [hours, minutes] = time.split(':').map(Number);

  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);

  // If the time has already passed today, schedule for tomorrow
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  return target.getTime() - now.getTime();
}

function fireNotification() {
  self.registration.showNotification('Habit Tracker', {
    body: "Time to log your habits! Keep the streak going 🔥",
    icon: '/vite.svg',
    badge: '/vite.svg',
    tag: 'daily-reminder',
    renotify: true,
    vibrate: [200, 100, 200],
    data: { url: self.location.origin },
  });
}

// When user taps the notification, open/focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing tab if open
      for (const client of clients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new tab
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
