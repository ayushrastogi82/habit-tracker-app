import { useId } from 'react'

/**
 * BeaconMark — inline SVG of the Beacon signal mark.
 *
 * Props:
 *   size      — pixel width/height. Default 64.
 *   tile      — render the dark #0E1A16 background rect. Default true.
 *               Set false when the surrounding container provides the background.
 *   pulse     — animate the outer glow with a slow 3-second breathe. Default false.
 *               Used on Splash and Confirmation screens ("the light turning on").
 *   ripple    — animate sonar-ping rings radiating outward from the core. Default false.
 *               3 staggered rings, each expanding from r=48 → r=380 and fading to 0.
 *   className — extra classes on the <svg> element.
 */
export default function BeaconMark({ size = 64, tile = true, pulse = false, ripple = false, className = '' }) {
  const uid = useId().replace(/:/g, '')
  const glowId = `beacon-glow-${uid}`

  // Ripple ring config: 3 rings, 1.4s apart, 4.2s total cycle (slow fade)
  const RIPPLE_DUR   = '4.2s'
  const RIPPLE_DELAY = 1.4   // seconds between each ring
  const RIPPLE_SPLINE = '0.15 0 0.5 1'

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1024 1024"
      width={size}
      height={size}
      className={className}
      aria-label="Beacon"
      role="img"
      style={{ color: 'var(--app-accent-color)' }}
    >
      <defs>
        <radialGradient id={glowId} gradientUnits="userSpaceOnUse"
                        cx="512" cy="512" r="330">
          <stop offset="0%"   stopColor="var(--app-accent-color)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--app-accent-color)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Dark tile — only when tile=true */}
      {tile && <rect width="1024" height="1024" fill="#0E1A16" />}

      {/* Soft glow — breathes when pulse=true */}
      <circle cx="512" cy="512" r="330" fill={`url(#${glowId})`}>
        {pulse && (
          <animate
            attributeName="opacity"
            values="1;0.3;1"
            dur="3s"
            repeatCount="indefinite"
            calcMode="spline"
            keyTimes="0;0.5;1"
            keySplines="0.42 0 0.58 1;0.42 0 0.58 1"
          />
        )}
      </circle>

      {/* Sonar-ping ripple rings — 3 staggered waves expanding from core */}
      {ripple && [0, 1, 2].map(i => (
        <circle key={i} cx="512" cy="512" r="48" fill="none"
                stroke="currentColor" strokeWidth="18">
          <animate
            attributeName="r"
            values="48;400"
            dur={RIPPLE_DUR}
            begin={`${i * RIPPLE_DELAY}s`}
            repeatCount="indefinite"
            calcMode="spline"
            keyTimes="0;1"
            keySplines={RIPPLE_SPLINE}
          />
          <animate
            attributeName="opacity"
            values="0.65;0"
            dur={RIPPLE_DUR}
            begin={`${i * RIPPLE_DELAY}s`}
            repeatCount="indefinite"
            calcMode="spline"
            keyTimes="0;1"
            keySplines={RIPPLE_SPLINE}
          />
          <animate
            attributeName="stroke-width"
            values="22;6"
            dur={RIPPLE_DUR}
            begin={`${i * RIPPLE_DELAY}s`}
            repeatCount="indefinite"
            calcMode="spline"
            keyTimes="0;1"
            keySplines={RIPPLE_SPLINE}
          />
        </circle>
      ))}

      {/* Outer ring — r 268, stroke 16, boosted opacity */}
      <circle cx="512" cy="512" r="268" fill="none"
              stroke="currentColor" strokeWidth="16" opacity="0.55" />

      {/* Inner ring — r 160, stroke 22, boosted opacity */}
      <circle cx="512" cy="512" r="160" fill="none"
              stroke="currentColor" strokeWidth="22" opacity="0.85" />

      {/* Core dot — r 48, full */}
      <circle cx="512" cy="512" r="48" fill="currentColor" />
    </svg>
  )
}
