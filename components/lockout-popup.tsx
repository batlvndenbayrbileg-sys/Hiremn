"use client"

import { useEffect, useState } from 'react'
import { getLockoutEndTime } from '@/lib/conversation-storage'

interface LockoutPopupProps {
  onClose?: () => void
}

export function LockoutPopup({ onClose }: LockoutPopupProps) {
  const [endTime, setEndTime] = useState<Date | null>(null)
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const lockoutEnd = getLockoutEndTime()
    setEndTime(lockoutEnd)
  }, [])

  useEffect(() => {
    if (!endTime) return

    const updateTimeLeft = () => {
      const now = Date.now()
      const diff = endTime.getTime() - now

      if (diff <= 0) {
        setTimeLeft('')
        window.location.reload() // Refresh to unlock
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }

    updateTimeLeft()
    const interval = setInterval(updateTimeLeft, 1000)
    return () => clearInterval(interval)
  }, [endTime])

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('mn-MN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!endTime) return null

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      borderRadius: 24,
      padding: 20,
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 28,
        maxWidth: 320,
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        animation: 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        {/* Icon */}
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FEE2E2, #FECACA)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: 18,
          fontWeight: 700,
          color: '#111827',
          margin: '0 0 12px',
        }}>
          Өнөөдрийн эрх дууссан
        </h3>

        {/* Description */}
        <p style={{
          fontSize: 14,
          color: '#6B7280',
          margin: '0 0 20px',
          lineHeight: 1.6,
        }}>
          Та өнөөдрийн 20 асуултын эрхээ бүгдийг ашигласан байна.
        </p>

        {/* Countdown timer */}
        <div style={{
          backgroundColor: '#F3F4F6',
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 16,
        }}>
          <div style={{
            fontSize: 11,
            color: '#9CA3AF',
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 8,
          }}>
            Дахин ашиглах боломжтой болох хугацаа
          </div>
          <div style={{
            fontSize: 32,
            fontWeight: 700,
            color: '#E8541A',
            fontFamily: 'monospace',
          }}>
            {timeLeft}
          </div>
        </div>

        {/* Unlock time */}
        <div style={{
          backgroundColor: '#FEF3EE',
          border: '1px solid #FDDCCC',
          borderRadius: 10,
          padding: '12px 16px',
          marginBottom: 20,
        }}>
          <div style={{
            fontSize: 12,
            color: '#9A6D50',
            marginBottom: 4,
          }}>
            Дараагийн ашиглах боломж:
          </div>
          <div style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#E8541A',
          }}>
            {formatDateTime(endTime)}
          </div>
        </div>

        {/* Info text */}
        <p style={{
          fontSize: 12,
          color: '#9CA3AF',
          margin: 0,
          lineHeight: 1.5,
        }}>
          Та дээрх хугацаанд дахин AI туслагчийг ашиглах боломжтой болно.
        </p>
      </div>

      <style>{`
        @keyframes popIn {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
