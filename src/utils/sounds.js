/**
 * Beacon — in-app sound feedback via Web Audio API.
 * Works on iOS Safari and Android Chrome. No audio files needed.
 *
 * AudioContext is created lazily and reused across calls.
 * iOS suspends AudioContext until a user gesture — resume() is called
 * automatically so the first tap always plays.
 */

let _ctx = null

const getCtx = () => {
  if (!_ctx) {
    try {
      _ctx = new (window.AudioContext || window.webkitAudioContext)()
    } catch {
      return null
    }
  }
  return _ctx
}

const playTone = ({ startFreq, endFreq, duration, volume = 0.25, type = 'sine' }) => {
  try {
    const ctx = getCtx()
    if (!ctx) return
    if (ctx.state === 'suspended') ctx.resume()

    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = type
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime)
    if (endFreq && endFreq !== startFreq) {
      osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration)
    }
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration + 0.01)
  } catch {
    // Audio not available — fail silently
  }
}

export const sounds = {
  // Short ascending ping — rewarding "done" feel
  log:   () => playTone({ startFreq: 600, endFreq: 900, duration: 0.08, volume: 0.22 }),
  // Softer descending tick — quiet "undone" acknowledgement
  unlog: () => playTone({ startFreq: 480, endFreq: 340, duration: 0.07, volume: 0.13 }),
}
