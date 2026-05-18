// components/AIAdviceButton.tsx - Secure version with CSRF
"use client"

import { useState, useEffect } from 'react'

interface ExamResult {
  examId: string
  assessmentId: number
  assessmentName: string
  score: number
  maxScore: number
  interpretation: string
  completedAt: string
}

interface AIAdviceButtonProps {
  examResult: ExamResult
}

export function AIAdviceButton({ examResult }: AIAdviceButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isChecked, setIsChecked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [csrfToken, setCSRFToken] = useState<string | null>(null)

  // Get CSRF token on component mount
  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(';').shift()
      return null
    }
    
    const token = getCookie('csrf-token')
    setCSRFToken(token || null)
  }, [])

  const handleConfirm = async () => {
    if (!isChecked) return

    setIsLoading(true)
    setError(null)

    try {
      // Validate data before sending
      if (!examResult.assessmentName || examResult.score < 0 || examResult.maxScore <= 0) {
        throw new Error('Invalid exam data')
      }

      // Call API with security measures
      const response = await fetch(process.env.NEXT_PUBLIC_AI_ADVISOR_URL + '/api/ai/advice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
          'x-csrf-token': csrfToken || '', // Add CSRF token
        },
        credentials: 'same-origin', // Only send cookies to same origin
        body: JSON.stringify({
          examResult: {
            assessmentId: examResult.assessmentId,
            assessmentName: examResult.assessmentName,
            score: examResult.score,
            maxScore: examResult.maxScore,
            interpretation: examResult.interpretation,
            completedAt: examResult.completedAt,
          },
          consent: true,
        }),
      })

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Too many requests. Please try again later.')
        } else if (response.status === 401) {
          throw new Error('Authentication failed. Please contact support.')
        } else {
          throw new Error('Failed to get AI advice')
        }
      }

      const data = await response.json()

      // Store data securely in sessionStorage (not localStorage)
      sessionStorage.setItem('examAdvice', JSON.stringify({
        timestamp: Date.now(),
        advice: data.advice,
      }))

      // Open chat in new tab/window
      const chatUrlStr = process.env.NEXT_PUBLIC_CHAT_URL
if (!chatUrlStr) throw new Error('NEXT_PUBLIC_CHAT_URL not configured')
const chatUrl = new URL(chatUrlStr)
      chatUrl.searchParams.set('examId', examResult.examId)
      chatUrl.searchParams.set('source', 'exam-result')

      window.open(chatUrl.toString(), '_blank')

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(message)
      console.error('[AIAdviceButton] Error:', message)
    } finally {
      setIsLoading(false)
      setIsModalOpen(false)
    }
  }

  return (
    <>
      {/* AI Advice Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        aria-label="Get AI advice about your exam results"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '12px 24px',
          backgroundColor: '#10B981',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#059669'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#10B981'}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2a10 10 0 1 0 10 10H12V2z"/>
          <circle cx="12" cy="12" r="6"/>
        </svg>
        AI Zovlogoo Avah
      </button>

      {/* Consent Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-labelledby="consent-title"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#FEF3C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
                  <path d="M12 9v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                </svg>
              </div>
              <div>
                <h3 id="consent-title" style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                  Medeelel Damjuulah Zovshoorol
                </h3>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                backgroundColor: '#FEE2E2',
                border: '1px solid #FCA5A5',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                color: '#991B1B',
                fontSize: '14px',
              }}>
                {error}
              </div>
            )}

            {/* Content */}
            <div style={{
              backgroundColor: '#F9FAFB',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
            }}>
              <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>
                Tanh <strong>{examResult.assessmentName}</strong> testiin ur dun-g AI tuslagch ruu ilgeej, 
                huviin zovlogoo ogohod ashiglana.
              </p>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '13px', color: '#6B7280' }}>
                <li>Testiin ner, onoo, tailbar</li>
                <li>Test ogsön ognoo</li>
              </ul>
            </div>

            {/* Checkbox */}
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              cursor: 'pointer',
              marginBottom: '24px',
            }}>
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                aria-label="I consent to share my exam results"
                style={{
                  width: '20px',
                  height: '20px',
                  marginTop: '2px',
                  accentColor: '#E8541A',
                }}
              />
              <span style={{ fontSize: '14px', color: '#374151', lineHeight: '1.5' }}>
                Bi ooriin testiin ur dun-g 3-dagt etgeeted damjuulahyg zovshoorej bayha.
              </span>
            </label>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#F3F4F6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Tsutslah
              </button>
              <button
                onClick={handleConfirm}
                disabled={!isChecked || isLoading}
                aria-label="Confirm and get AI advice"
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: isChecked ? '#E8541A' : '#D1D5DB',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: isChecked ? 'pointer' : 'not-allowed',
                  opacity: isLoading ? 0.7 : 1,
                }}
              >
                {isLoading ? 'Unshij bayha...' : 'Zovshoaroh'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
