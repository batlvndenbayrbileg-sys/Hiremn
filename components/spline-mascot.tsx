'use client'

import { useEffect, useState, useRef } from 'react'
import dynamic from 'next/dynamic'

const SCENE_URL = 'https://prod.spline.design/wfat5gF0Q5BMp2kc/scene.splinecode'

// Safely import Spline with proper error handling
const SplineComponent = dynamic(() =>
  import('@splinetool/react-spline').then(mod => mod.default)
    .catch(() => () => null),
  {
    ssr: false,
    loading: () => null,
  }
)

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
  const [showSpline, setShowSpline] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let isMounted = true

    // Load Spline after short delay to avoid blocking render
    const timer = setTimeout(() => {
      if (isMounted) setShowSpline(true)
    }, 1000)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [])

  const handleMouseEnter = () => {
    setShowSpline(true)
  }

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
      onMouseEnter={handleMouseEnter}
    >
      {/* Animated placeholder - hidden once Spline loads */}
      {!showSpline && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '60%',
              height: '60%',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FFE8DC 0%, #FFF0E8 100%)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        </div>
      )}

      {/* Spline 3D - sized to fill container, centered */}
      {showSpline && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            zIndex: 10,
          }}
        >
          <SplineComponent
            scene={SCENE_URL}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 0.4; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
