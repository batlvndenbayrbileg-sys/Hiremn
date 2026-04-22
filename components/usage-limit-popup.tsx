"use client"

import { useEffect, useState } from 'react'
import { formatUnlockTime, getUnlockTime } from '@/lib/conversation-storage'

interface UsageLimitPopupProps {
  onClose?: () => void
}

export function UsageLimitPopup({ onClose }: UsageLimitPopupProps) {
  const [timeLeft, setTimeLeft] = useState('')
  const [unlockTimeStr, setUnlockTimeStr] = useState('')

  useEffect(() => {
    setUnlockTimeStr(formatUnlockTime())
    
    const updateTimeLeft = () => {
      const unlockTime = getUnlockTime()
      if (!unlockTime) return
      
      const now = Date.now()
      const diff = unlockTime.getTime() - now
      
      if (diff <= 0) {
        setTimeLeft('0:00:00')
        return
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      
      setTimeLeft(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }
    
    updateTimeLeft()
    const interval = setInterval(updateTimeLeft, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
        padding: '28px 24px',
        maxWidth: 320,
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
        animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        {/* Icon */}
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: 18,
          fontWeight: 700,
          color: '#1F2937',
          margin: '0 0 8px',
        }}>
          Өнөөдрийн эрх дууссан байна
        </h3>

        {/* Description */}
        <p style={{
          fontSize: 14,
          color: '#6B7280',
          margin: '0 0 20px',
          lineHeight: 1.5,
        }}>
          Та өнөөдрийн 20 асуултын эрхээ бүгдийг нь ашигласан байна.
        </p>

        {/* Countdown */}
        <div style={{
          backgroundColor: '#F3F4F6',
          borderRadius: 12,
          padding: '16px',
          marginBottom: 16,
        }}>
          <div style={{
            fontSize: 11,
            color: '#9CA3AF',
            fontWeight: 500,
            marginBottom: 6,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Дахин ашиглах боломжтой болох хүртэл
          </div>
          <div style={{
            fontSize: 28,
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
          marginBottom: 4,
        }}>
          <div style={{
            fontSize: 11,
            color: '#9CA3AF',
            marginBottom: 4,
          }}>
            Дахин ашиглах боломжтой болох цаг:
          </div>
          <div style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#E8541A',
          }}>
            {unlockTimeStr}
          </div>
        </div>

        {/* Footer note */}
        <p style={{
          fontSize: 11,
          color: '#9CA3AF',
          margin: '16px 0 0',
        }}>
          Энэ хязгаарлалт нь бүх хэрэглэгчдэд тэгш боломж олгох зорилготой.
        </p>
      </div>

      <style>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  )
}
