'use client'

import { useEffect, useRef, useState } from 'react'

const SCENE_URL = 'https://prod.spline.design/wfat5gF0Q5BMp2kc/scene.splinecode'

// Module-level singleton - scene loads once, shared across all instances
let splineApp: any = null
let splineLoading = false
let splineLoaded = false
let splineListeners: Array<() => void> = []

function onSplineReady(cb: () => void) {
  if (splineLoaded) { cb(); return }
  splineListeners.push(cb)
}

function notifyReady() {
  splineLoaded = true
  splineListeners.forEach(cb => cb())
  splineListeners = []
}

// Preload Spline runtime as early as possible
function preloadSpline() {
  if (splineLoading || splineLoaded || typeof window === 'undefined') return
  splineLoading = true
  import('@splinetool/react-spline').then(() => {
    notifyReady()
  }).catch(() => {
    splineLoading = false
  })
}

// Kick off preload immediately on module import (client side)
if (typeof window !== 'undefined') {
  // Use requestIdleCallback if available, else immediate
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(preloadSpline)
  } else {
    setTimeout(preloadSpline, 0)
  }
}

interface SplineMascotProps {
  width?: number | string
  height?: number | string
  borderRadius?: number | string
  className?: string
  style?: React.CSSProperties
}

export function SplineMascot({
  width = '100%',
  height = '100%',
  borderRadius = 'inherit',
  className,
  style,
}: SplineMascotProps) {
  const [ready, setReady] = useState(splineLoaded)
  const [SplineComponent, setSplineComponent] = useState<any>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    // Import component
    import('@splinetool/react-spline').then(mod => {
      if (!mountedRef.current) return
      setSplineComponent(() => mod.default)
      setReady(true)
    })

    return () => { mountedRef.current = false }
  }, [])

  const placeholder = (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #E8541A 0%, #FF8C42 100%)',
      borderRadius: 'inherit',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Animated pulse while loading */}
      <div style={{
        width: '40%',
        height: '40%',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.3)',
        animation: 'spline-pulse 1.4s ease-in-out infinite',
      }} />
      <style>{`
        @keyframes spline-pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )

  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius,
        overflow: 'hidden',
        ...style,
      }}
    >
      {ready && SplineComponent ? (
        <SplineComponent
          scene={SCENE_URL}
          style={{ width: '100%', height: '100%' }}
        />
      ) : placeholder}
    </div>
  )
}
