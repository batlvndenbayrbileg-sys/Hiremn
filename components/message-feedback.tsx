// components/MessageFeedback.tsx - 👍/👎 Feedback buttons

"use client"

import { useState } from 'react'
import { saveFeedback, saveBestAnswer } from '@/lib/feedback-storage'

interface MessageFeedbackProps {
  messageId: string
  userMessage: string
  assistantMessage: string
}

export function MessageFeedback({ messageId, userMessage, assistantMessage }: MessageFeedbackProps) {
  const [feedback, setFeedback] = useState<'thumbsUp' | 'thumbsDown' | null>(null)

  const handleFeedback = (rating: 'thumbsUp' | 'thumbsDown') => {
    setFeedback(rating)

    // Store feedback
    saveFeedback({
      id: messageId,
      userMessage,
      assistantMessage,
      rating,
      timestamp: Date.now(),
    })

    // If thumbsUp, save as best answer
    if (rating === 'thumbsUp') {
      saveBestAnswer(userMessage, assistantMessage)
    }

    // Show confirmation briefly
    setTimeout(() => setFeedback(null), 2000)
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        marginTop: '8px',
        fontSize: '12px',
        color: '#999',
      }}
    >
      <span>Сайн байсан уу?</span>

      {/* Thumbs Up Button */}
      <button
        onClick={() => handleFeedback('thumbsUp')}
        title="Сайн хариулт"
        style={{
          background: feedback === 'thumbsUp' ? '#10B981' : 'transparent',
          border: feedback === 'thumbsUp' ? '1px solid #10B981' : '1px solid #ddd',
          borderRadius: '6px',
          padding: '4px 8px',
          cursor: 'pointer',
          color: feedback === 'thumbsUp' ? '#fff' : '#999',
          fontSize: '14px',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
        onMouseOver={(e) => {
          if (feedback !== 'thumbsUp') {
            e.currentTarget.style.borderColor = '#10B981'
            e.currentTarget.style.color = '#10B981'
          }
        }}
        onMouseOut={(e) => {
          if (feedback !== 'thumbsUp') {
            e.currentTarget.style.borderColor = '#ddd'
            e.currentTarget.style.color = '#999'
          }
        }}
      >
        👍
        {feedback === 'thumbsUp' && ' Хадгалав'}
      </button>

      {/* Thumbs Down Button */}
      <button
        onClick={() => handleFeedback('thumbsDown')}
        title="Муу хариулт"
        style={{
          background: feedback === 'thumbsDown' ? '#EF4444' : 'transparent',
          border: feedback === 'thumbsDown' ? '1px solid #EF4444' : '1px solid #ddd',
          borderRadius: '6px',
          padding: '4px 8px',
          cursor: 'pointer',
          color: feedback === 'thumbsDown' ? '#fff' : '#999',
          fontSize: '14px',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
        onMouseOver={(e) => {
          if (feedback !== 'thumbsDown') {
            e.currentTarget.style.borderColor = '#EF4444'
            e.currentTarget.style.color = '#EF4444'
          }
        }}
        onMouseOut={(e) => {
          if (feedback !== 'thumbsDown') {
            e.currentTarget.style.borderColor = '#ddd'
            e.currentTarget.style.color = '#999'
          }
        }}
      >
        👎
        {feedback === 'thumbsDown' && ' Бүртгэгдлээ'}
      </button>
    </div>
  )
}
