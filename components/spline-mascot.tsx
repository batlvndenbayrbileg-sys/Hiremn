'use client'

import { useEffect, useState, useRef } from 'react'

const SCENE_URL = 'https://prod.spline.design/wfat5gF0Q5BMp2kc/scene.splinecode'

// Use absolute URL for embed compatibility
const getMascotUrl = () => {
  if (typeof window !== 'undefined') {
    // Check if we're in an iframe (embed mode)
    try {
      const isEmbed = window.location.pathname.includes('/embed')
      if (isEmbed) {
        // Use the origin from the current page
        return `${window.location.origin}/mascot.png`
      }
    } catch (e) {}
  }
  return '/mascot.png'
}

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
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const mascotUrl = getMascotUrl()

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

  // Fallback gradient placeholder
  const placeholderStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    borderRadius,
    background: 'linear-gradient(135deg, #FFE8DC 0%, #FFF5F0 50%, #FFE0D0 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
        background: '#FFF5F0',
        ...style,
      }}
    >
      {/* Static image or placeholder */}
      {(!showSpline || !SplineComponent) && (
        <>
          {!imageLoaded && !imageError && (
            <div style={placeholderStyle}>
              <svg width="60%" height="60%" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" fill="#E8541A" opacity="0.6"/>
                <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="#E8541A" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
              </svg>
            </div>
          )}
          <img
            src={mascotUrl}
            alt=""
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              borderRadius,
              display: imageLoaded ? 'block' : 'none',
              position: imageLoaded ? 'relative' : 'absolute',
            }}
          />
        </>
      )}

      {/* Spline 3D loads lazily */}
      {showSpline && SplineComponent && (
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius,
          overflow: 'visible',
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
