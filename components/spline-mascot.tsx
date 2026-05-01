'use client'

import dynamic from 'next/dynamic'

// Dynamically import Spline to avoid SSR issues
const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #E8541A 0%, #FF8C42 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 'inherit',
    }} />
  ),
})

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
      <Spline scene="https://prod.spline.design/wfat5gF0Q5BMp2kc/scene.splinecode" />
    </div>
  )
}
