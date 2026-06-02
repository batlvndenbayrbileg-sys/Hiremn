'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    __HireMnWidget?: boolean
    HireMnChat?: {
      open: () => void
      close: () => void
      isOpen: () => boolean
      analyzeFromAPI: (options: {
        apiUrl: string
        headers?: Record<string, string>
        testName?: string
        prompt?: string
      }) => Promise<unknown>
      analyzeReport: (code: string, options?: {
        apiBase?: string
        token?: string
        headers?: Record<string, string>
        testName?: string
        prompt?: string
      }) => Promise<unknown>
      openWithAnalysis: (data: {
        reportTitle?: string
        reportData?: unknown
        userInfo?: unknown
        analysisResults?: unknown
        prompt?: string
      }) => void
      sendMessage: (message: string) => void
    }
  }
}

interface AIAdviceButtonProps {
  /** The code returned from hire.mn after completing an assessment */
  resultCode: string
  /** Optional bearer token for authenticated API calls */
  token?: string
  /** Label shown on the button */
  label?: string
  className?: string
}

export default function AIAdviceButton({
  resultCode,
  token,
  label = 'AI тайлбар авах',
  className = '',
}: AIAdviceButtonProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  useEffect(() => {
    // Ensure the embed script is loaded
    if (!document.getElementById('hiremn-embed-script')) {
      const script = document.createElement('script')
      script.id = 'hiremn-embed-script'
      script.src = '/embed.js'
      script.async = true
      document.body.appendChild(script)
    }
  }, [])

  function handleClick() {
    if (typeof window === 'undefined' || !window.HireMnChat) {
      console.warn('[AIAdviceButton] HireMnChat widget not ready yet')
      return
    }
    window.HireMnChat.analyzeReport(resultCode, {
      token,
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 18px',
        background: '#E8541A',
        color: '#fff',
        border: 'none',
        borderRadius: 10,
        fontWeight: 600,
        fontSize: 14,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}
