import { useEffect, useState } from 'react'
import Lottie from 'lottie-react'

const bentoTilesAnimation = {
  v: '5.12.2',
  fr: 60,
  ip: 0,
  op: 72,
  w: 48,
  h: 48,
  nm: 'Bento tiles',
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'Tiles',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [24, 24, 0] },
        a: { a: 0, k: [24, 24, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [82, 82, 100], e: [108, 108, 100], i: { x: [0.2, 0.2, 0.2], y: [1, 1, 1] }, o: { x: [0.4, 0.4, 0.4], y: [0, 0, 0] } },
            { t: 24, s: [108, 108, 100], e: [96, 96, 100] },
            { t: 44, s: [96, 96, 100], e: [100, 100, 100] },
            { t: 72, s: [100, 100, 100] },
          ],
        },
      },
      ao: 0,
      shapes: [
        {
          ty: 'gr',
          it: [
            { ty: 'rc', d: 1, s: { a: 0, k: [18, 18] }, p: { a: 0, k: [14, 14] }, r: { a: 0, k: 4 }, nm: 'Large tile' },
            { ty: 'fl', c: { a: 0, k: [0.145, 0.388, 0.922, 1] }, o: { a: 0, k: 100 }, r: 1, nm: 'Blue fill' },
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 } },
          ],
          nm: 'Large tile group',
        },
        {
          ty: 'gr',
          it: [
            { ty: 'rc', d: 1, s: { a: 0, k: [10, 18] }, p: { a: 0, k: [32, 14] }, r: { a: 0, k: 3 }, nm: 'Tall tile' },
            { ty: 'fl', c: { a: 0, k: [0.584, 0.639, 0.733, 1] }, o: { a: 0, k: 100 }, r: 1, nm: 'Neutral fill' },
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 } },
          ],
          nm: 'Tall tile group',
        },
        {
          ty: 'gr',
          it: [
            { ty: 'rc', d: 1, s: { a: 0, k: [28, 10] }, p: { a: 0, k: [23, 32] }, r: { a: 0, k: 3 }, nm: 'Wide tile' },
            { ty: 'fl', c: { a: 0, k: [0.314, 0.369, 0.459, 1] }, o: { a: 0, k: 100 }, r: 1, nm: 'Graphite fill' },
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 } },
          ],
          nm: 'Wide tile group',
        },
      ],
      ip: 0,
      op: 72,
      st: 0,
      bm: 0,
    },
  ],
} as const

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)

  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!query) return
    const update = () => setReduced(query.matches)
    query.addEventListener?.('change', update)
    return () => query.removeEventListener?.('change', update)
  }, [])

  return reduced
}

export default function BentoMotionIcon({ className = '' }: { readonly className?: string }) {
  const reducedMotion = useReducedMotion()

  return (
    <span aria-hidden="true" className={`bento-lottie-icon block shrink-0 ${className}`}>
      <Lottie animationData={bentoTilesAnimation} autoplay={!reducedMotion} loop={false} />
    </span>
  )
}
