import { Analytics } from '@vercel/analytics/react'
import HabitTracker from './components/HabitTracker'

export default function App() {
  return (
    <>
      <HabitTracker />
      <Analytics />
    </>
  )
}
