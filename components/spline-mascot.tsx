'use client'

import { useEffect, useState, useRef } from 'react'
import dynamic from 'next/dynamic'

const SCENE_URL = 'https://prod.spline.design/wfat5gF0Q5BMp2kc/scene.splinecode'

// Dynamically import Spline for Next.js
const Spline = dynamic(() => import('@splinetool/react-spline/next'), {
  ssr: false,
  loading: () => null,
})

interface SplineMascotProps {
  width?: number | string
  height?: number | string
  borderRadius?: number | string
  className?: string
  style?: React.CSSProperties
}

export function SplineMascot({
  width = 48,
  height = 48,
  borderRadius = 12,
  className,
  style,
}: SplineMascotProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [shouldLoadSpline, setShouldLoadSpline] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Start loading Spline after a short delay or on hover
  useEffect(() => {
    let mounted = true
    
    // Load immediately for better UX
    const timeout = setTimeout(() => {
      if (mounted) setShouldLoadSpline(true)
    }, 500)

    const handleHover = () => {
      if (mounted) setShouldLoadSpline(true)
    }

    const el = containerRef.current
    if (el) {
      el.addEventListener('mouseenter', handleHover, { once: true })
    }

    return () => {
      mounted = false
      clearTimeout(timeout)
      if (el) el.removeEventListener('mouseenter', handleHover)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width,
        height,
        borderRadius,
        overflow: 'visible',
        position: 'relative',
        background: 'transparent',
        ...style,
      }}
    >
      {/* Loading placeholder - simple gradient circle */}
      {!isLoaded && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius,
            background: 'linear-gradient(135deg, #FFE8DC 0%, #FFF5F0 50%, #FFE0D0 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        >
          <div
            style={{
              width: '50%',
              height: '50%',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #E8541A 0%, #FF8C42 100%)',
              opacity: 0.4,
            }}
          />
        </div>
      )}

      {/* Spline 3D Scene */}
      {shouldLoadSpline && (
        <div
          style={{
            position: 'absolute',
            inset: -10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'visible',
          }}
        >
          <Spline
            scene={SCENE_URL}
            onLoad={() => setIsLoaded(true)}
            style={{
              width: '120%',
              height: '120%',
            }}
          />
        </div>
      )}

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}
