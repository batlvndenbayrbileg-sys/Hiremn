// components/message-feedback.tsx - Interactive animated feedback

"use client"

import { useState } from 'react'
import { saveFeedback, saveBestAnswer, penalizeAnswer } from '@/lib/feedback-storage'

interface MessageFeedbackProps {
  messageId: string
  userMessage: string
  assistantMessage: string
}

export function MessageFeedback({ messageId, userMessage, assistantMessage }: MessageFeedbackProps) {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showThankYou, setShowThankYou] = useState(false)

  const handleFeedback = (rating: 'up' | 'down') => {
    if (feedback) return // Already rated
    
    setIsAnimating(true)
    setFeedback(rating)

    // Store feedback with reinforcement learning
    saveFeedback({
      id: messageId,
      userMessage,
      assistantMessage,
      rating: rating === 'up' ? 'thumbsUp' : 'thumbsDown',
      timestamp: Date.now(),
    })

    // Reinforcement: reward or penalize
    if (rating === 'up') {
      saveBestAnswer(userMessage, assistantMessage)
    } else {
      penalizeAnswer(userMessage)
    }

    // Show thank you message
    setTimeout(() => {
      setIsAnimating(false)
      setShowThankYou(true)
    }, 400)

    // Hide after 3 seconds
    setTimeout(() => setShowThankYou(false), 3500)
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
        opacity: showThankYou ? 1 : 0.7,
        transition: 'opacity 0.3s ease',
      }}
    >
      {!showThankYou ? (
        <>
          <span style={{ 
            fontSize: 11, 
            color: '#9CA3AF',
            fontWeight: 400,
          }}>
            Хүссэн хариултаа авч чадсан уу?
          </span>

          {/* Thumbs Up */}
          <button
            onClick={() => handleFeedback('up')}
            disabled={!!feedback}
            aria-label="Тийм"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 26,
              height: 26,
              borderRadius: 6,
              border: 'none',
              background: feedback === 'up' ? '#10B981' : '#F3F4F6',
              cursor: feedback ? 'default' : 'pointer',
              transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transform: isAnimating && feedback === 'up' ? 'scale(1.3)' : 'scale(1)',
            }}
            onMouseEnter={(e) => {
              if (!feedback) {
                e.currentTarget.style.background = '#D1FAE5'
                e.currentTarget.style.transform = 'scale(1.1)'
              }
            }}
            onMouseLeave={(e) => {
              if (!feedback) {
                e.currentTarget.style.background = '#F3F4F6'
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
          >
            <svg 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill={feedback === 'up' ? '#fff' : '#6B7280'}
              style={{
                transition: 'transform 0.3s ease',
                transform: isAnimating && feedback === 'up' ? 'rotate(-15deg)' : 'rotate(0deg)',
              }}
            >
              <path d="M7.493 18.5c-.425 0-.82-.236-.975-.632A7.48 7.48 0 0 1 6 15.125c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V3a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23h-.777ZM2.331 10.727a11.969 11.969 0 0 0-.831 4.398 12 12 0 0 0 .52 3.507C2.28 19.482 3.105 20 3.994 20H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 0 1-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227Z"/>
            </svg>
          </button>

          {/* Thumbs Down */}
          <button
            onClick={() => handleFeedback('down')}
            disabled={!!feedback}
            aria-label="Үгүй"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 26,
              height: 26,
              borderRadius: 6,
              border: 'none',
              background: feedback === 'down' ? '#EF4444' : '#F3F4F6',
              cursor: feedback ? 'default' : 'pointer',
              transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transform: isAnimating && feedback === 'down' ? 'scale(1.3)' : 'scale(1)',
            }}
            onMouseEnter={(e) => {
              if (!feedback) {
                e.currentTarget.style.background = '#FEE2E2'
                e.currentTarget.style.transform = 'scale(1.1)'
              }
            }}
            onMouseLeave={(e) => {
              if (!feedback) {
                e.currentTarget.style.background = '#F3F4F6'
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
          >
            <svg 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill={feedback === 'down' ? '#fff' : '#6B7280'}
              style={{
                transition: 'transform 0.3s ease',
                transform: isAnimating && feedback === 'down' ? 'rotate(15deg)' : 'rotate(0deg)',
              }}
            >
              <path d="M15.73 5.5h1.035A7.465 7.465 0 0 1 18 9.625a7.465 7.465 0 0 1-1.235 4.125h-.148c-.806 0-1.533.446-2.031 1.08a9.04 9.04 0 0 1-2.861 2.4c-.723.384-1.35.956-1.653 1.715a4.499 4.499 0 0 0-.322 1.672v.633a.75.75 0 0 1-.75.75 2.25 2.25 0 0 1-2.25-2.25c0-1.152.26-2.243.723-3.218.266-.558-.107-1.282-.725-1.282H3.622c-1.026 0-1.945-.694-2.054-1.715A12.137 12.137 0 0 1 1.5 12.25c0-2.848.992-5.464 2.649-7.521C4.537 4.247 5.136 4 5.754 4H9.77a4.5 4.5 0 0 1 1.423.23l3.114 1.04a4.5 4.5 0 0 0 1.423.23ZM21.669 14.023c.536-1.362.831-2.845.831-4.398 0-1.22-.182-2.398-.52-3.507-.26-.85-1.084-1.368-1.973-1.368H19.1c-.445 0-.72.498-.523.898.591 1.2.924 2.55.924 3.977a8.958 8.958 0 0 1-1.302 4.666c-.245.403.028.959.5.959h1.053c.832 0 1.612-.453 1.918-1.227Z"/>
            </svg>
          </button>
        </>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            color: feedback === 'up' ? '#10B981' : '#9CA3AF',
            animation: 'fadeInSlide 0.3s ease',
          }}
        >
          {feedback === 'up' ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#10B981">
                <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="#10B981" strokeWidth="2" fill="none"/>
              </svg>
              <span>Санагдлаа!</span>
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
              </svg>
              <span>Бүртгэлээ</span>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeInSlide {
          from {
            opacity: 0;
            transform: translateX(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}
