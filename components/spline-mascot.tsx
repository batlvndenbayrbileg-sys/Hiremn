'use client'

import { useEffect, useState, useRef } from 'react'

const SCENE_URL = 'https://prod.spline.design/wfat5gF0Q5BMp2kc/scene.splinecode'

interface SplineMascotProps {
  width?: number | string
  height?: number | string
  borderRadius?: number | string
  className?: string
  style?: React.CSSProperties
  /** If true, shows static image only (no 3D) for better performance */
  staticOnly?: boolean
}

export function SplineMascot({
  width = 48,
  height = 48,
  borderRadius = 12,
  className,
  style,
  staticOnly = false,
}: SplineMascotProps) {
  const [SplineComponent, setSplineComponent] = useState<any>(null)
  const [showSpline, setShowSpline] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load Spline only after user hovers or after 3 seconds
  useEffect(() => {
    if (staticOnly) return
    
    let mounted = true
    let timeout: NodeJS.Timeout

    const loadSpline = () => {
      import('@splinetool/react-spline').then(mod => {
        if (mounted) {
          setSplineComponent(() => mod.default)
          setShowSpline(true)
        }
      }).catch(() => {})
    }

    // Load after 3 seconds idle
    timeout = setTimeout(loadSpline, 3000)

    // Or load immediately on hover
    const handleHover = () => {
      clearTimeout(timeout)
      loadSpline()
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
  }, [staticOnly])

  // Static mascot image - always shows first for instant load
  const staticMascot = (
    <img
      src="/mascot.png"
      alt="AI Assistant"
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        borderRadius: 'inherit',
      }}
    />
  )

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width,
        height,
        borderRadius,
        overflow: 'hidden',
        position: 'relative',
        background: '#FFF8F5',
        ...style,
      }}
    >
      {/* Static image shows instantly */}
      {(!showSpline || !SplineComponent) && staticMascot}
      
      {/* Spline 3D loads lazily on top */}
      {showSpline && SplineComponent && (
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          overflow: 'hidden',
        }}>
          <SplineComponent
            scene={SCENE_URL}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      )}
    </div>
  )
}
