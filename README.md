# Habit Tracker

A beautiful, modern habit tracking application built with React, Vite, and Tailwind CSS.

## Features

- ✅ **Log daily habits** - Mark habits as completed for the day
- 📊 **Track streaks** - Monitor current and longest streaks
- 📅 **Add past dates** - Log habits from previous days
- 📱 **Responsive design** - Works seamlessly on desktop and mobile
- 🎨 **Beautiful UI** - Modern gradient design with smooth interactions
- 💾 **Persistent storage** - Data saved to window.storage with localStorage fallback
- 🔄 **Reorder habits** - Drag and drop or use arrow buttons to organize
- 📈 **Progress tracking** - See completion stats and progress trends
- 🏷️ **Rename habits** - Edit habit names easily
- 🗑️ **Delete habits** - Remove habits when no longer needed

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **localStorage** - Data persistence

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The app will open automatically at `http://localhost:5173`

## Usage

1. **Add a habit** - Click "Add Habit" and enter the habit name
2. **Log completion** - Click "Log" to mark today's completion
3. **View details** - Click "Show dates" to expand and see all logged dates
4. **Reorder** - Click the reorder button to rearrange your habits
5. **Add past dates** - Expand a habit and click "+ Add Date" to log previous days
6. **Rename** - Click the habit name to edit it
7. **Delete** - Use the reorder mode to delete habits

## Storage

The app uses a two-tier storage system:

1. **Primary**: window.storage API (for supported environments)
2. **Fallback**: localStorage (browser-based persistence)

Data is automatically saved with each action and persists across sessions.

## Development

The project uses modern React patterns:

- Functional components with hooks
- Local state management with useState
- Side effects with useEffect
- Responsive Tailwind CSS utilities

## Browser Support

Works on all modern browsers that support:
- ES6+ JavaScript
- CSS Grid and Flexbox
- localStorage API

## License

MIT
