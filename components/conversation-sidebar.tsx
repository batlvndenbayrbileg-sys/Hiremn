'use client'

import { useState, useEffect } from 'react'
import { Conversation, getConversations, deleteConversation, getRemainingMessages } from '@/lib/conversation-storage'

interface ConversationSidebarProps {
  activeId?: string
  onSelectConversation: (conv: Conversation) => void
  onNewConversation: () => void
  onClose: () => void
  isVisible: boolean
}

export function ConversationSidebar({
  activeId,
  onSelectConversation,
  onNewConversation,
  onClose,
  isVisible
}: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [deleteHoverId, setDeleteHoverId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setConversations(getConversations())
    if (isVisible) {
      const t = setTimeout(() => setMounted(true), 10)
      return () => clearTimeout(t)
    } else {
      setMounted(false)
    }
  }, [isVisible])

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteConversation(id)
    setConversations(prev => prev.filter(c => c.id !== id))
  }

  const formatDate = (ts: number): string => {
    const d = new Date(ts)
    const today = new Date()
    const yest = new Date(today)
    yest.setDate(yest.getDate() - 1)
    if (d.toDateString() === today.toDateString())
      return d.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })
    if (d.toDateString() === yest.toDateString()) return 'Өчигдөр'
    return d.toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' })
  }

  const remaining = getRemainingMessages()
  const usedPct = ((20 - remaining) / 20) * 100

  return (
    <>
      <style>{`
        @keyframes sb-backdrop {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes sb-slide {
          from { transform: translateX(-100%) scale(0.98); opacity: 0; }
          to   { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes sb-item-in {
          from { transform: translateX(-12px); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        @keyframes sb-new-pulse {
          0%, 100% { box-shadow: 0 4px 14px rgba(232,84,26,.3); }
          50%       { box-shadow: 0 4px 22px rgba(232,84,26,.5); }
        }

        .sb-item {
          transition: background 0.18s ease, transform 0.18s cubic-bezier(.34,1.56,.64,1), box-shadow 0.18s ease;
        }
        .sb-item:hover {
          transform: translateX(3px);
        }
        .sb-delete {
          transition: all 0.18s cubic-bezier(.34,1.56,.64,1);
          transform: scale(0.85);
          opacity: 0;
        }
        .sb-item:hover .sb-delete {
          transform: scale(1);
          opacity: 1;
        }
        .sb-new-btn {
          animation: sb-new-pulse 2.5s ease-in-out infinite;
          transition: transform 0.2s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s;
        }
        .sb-new-btn:hover {
          transform: translateY(-2px) scale(1.02);
          animation: none;
          box-shadow: 0 8px 24px rgba(232,84,26,.45) !important;
        }
        .sb-new-btn:active { transform: scale(0.97); }

        .sb-scroll::-webkit-scrollbar { width: 3px; }
        .sb-scroll::-webkit-scrollbar-track { background: transparent; }
        .sb-scroll::-webkit-scrollbar-thumb { background: rgba(232,84,26,.15); border-radius: 3px; }
      `}</style>

      {/* ── Backdrop ── */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(15,10,8,0.35)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          zIndex: 10,
          borderRadius: 20,
          animation: mounted ? 'sb-backdrop 0.22s ease forwards' : 'none',
          opacity: mounted ? 1 : 0,
          transition: 'opacity 0.22s ease',
        }}
      />

      {/* ── Panel ── */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, bottom: 0,
        width: 265,
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FEFCFB 100%)',
        borderRadius: '20px 0 0 20px',
        display: 'flex', flexDirection: 'column',
        zIndex: 20,
        boxShadow: '6px 0 32px rgba(232,84,26,.12), 2px 0 8px rgba(0,0,0,.06)',
        transform: mounted ? 'translateX(0)' : 'translateX(-105%)',
        opacity: mounted ? 1 : 0,
        transition: 'transform 0.3s cubic-bezier(0.34,1.2,0.64,1), opacity 0.22s ease',
        overflow: 'hidden',
      }}>

        {/* Top accent bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, #E8541A, #F5A07A, #E8541A)',
          backgroundSize: '200% 100%',
        }} />

        {/* ── Header ── */}
        <div style={{
          padding: '22px 16px 14px',
          borderBottom: '1px solid rgba(232,84,26,.07)',
          background: 'linear-gradient(180deg, #FFF7F4 0%, #FFFFFF 100%)',
        }}>
          {/* Title row */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: 'linear-gradient(135deg, #FEF3EE, #FFE8DC)',
                border: '1.5px solid #FDDCCC',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E8541A" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <span style={{
                fontSize: 14, fontWeight: 700, color: '#111',
                letterSpacing: '-0.3px',
              }}>Яриа түүх</span>
              {conversations.length > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  background: 'linear-gradient(135deg, #E8541A, #F07040)',
                  color: '#fff',
                  padding: '2px 7px', borderRadius: 20,
                  boxShadow: '0 2px 6px rgba(232,84,26,.25)',
                }}>
                  {conversations.length}
                </span>
              )}
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              style={{
                width: 28, height: 28, borderRadius: 8,
                border: '1.5px solid transparent',
                background: 'transparent',
                color: '#9CA3AF', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all .15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = '#FEF2F2'
                  ; (e.currentTarget as HTMLElement).style.color = '#EF4444'
                  ; (e.currentTarget as HTMLElement).style.borderColor = '#FECACA'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'transparent'
                  ; (e.currentTarget as HTMLElement).style.color = '#9CA3AF'
                  ; (e.currentTarget as HTMLElement).style.borderColor = 'transparent'
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* New chat button */}
          <button
            className="sb-new-btn"
            onClick={() => { onNewConversation(); onClose() }}
            style={{
              width: '100%', padding: '11px 16px',
              background: 'linear-gradient(135deg, #E8541A 0%, #F06A30 100%)',
              color: '#fff', border: 'none', borderRadius: 12,
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              boxShadow: '0 4px 14px rgba(232,84,26,.3)',
              letterSpacing: '-0.2px',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Шинэ яриа эхлэх
          </button>
        </div>

        {/* ── List ── */}
        <div className="sb-scroll" style={{
          flex: 1, overflowY: 'auto',
          padding: '8px 8px',
        }}>
          {conversations.length === 0 ? (
            <div style={{
              padding: '40px 20px',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: 'linear-gradient(135deg, #FEF3EE, #FFE8DC)',
                border: '2px solid #FDDCCC',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F5A07A" strokeWidth="1.6">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#6B7280', fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>
                  Яриа байхгүй байна
                </p>
                <p style={{ color: '#9CA3AF', fontSize: 11, margin: 0, lineHeight: 1.5 }}>
                  Шинэ яриа эхлүүлээрэй
                </p>
              </div>
            </div>
          ) : (
            <>
              <div style={{
                fontSize: 10, fontWeight: 700, color: '#C4B5AF',
                letterSpacing: '0.6px', textTransform: 'uppercase',
                padding: '6px 8px 4px',
              }}>
                Сүүлийн яриа
              </div>
              {conversations.slice(0, 10).map((conv, idx) => {
                const isActive = activeId === conv.id
                const isHovered = hoveredId === conv.id
                const msgCount = conv.messages.filter(m => m.role === 'user').length

                return (
                  <div
                    key={conv.id}
                    className="sb-item"
                    onClick={() => { onSelectConversation(conv); onClose() }}
                    onMouseEnter={() => setHoveredId(conv.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      padding: '10px 10px',
                      marginBottom: 3,
                      borderRadius: 11,
                      cursor: 'pointer',
                      background: isActive
                        ? 'linear-gradient(135deg, #FFF7ED, #FEF3EE)'
                        : isHovered
                          ? '#FBF9F8'
                          : 'transparent',
                      border: isActive
                        ? '1.5px solid #FDDCCC'
                        : isHovered
                          ? '1.5px solid #F5EDE9'
                          : '1.5px solid transparent',
                      boxShadow: isActive
                        ? '0 2px 10px rgba(232,84,26,.08)'
                        : isHovered
                          ? '0 2px 8px rgba(0,0,0,.04)'
                          : 'none',
                      animation: `sb-item-in 0.3s cubic-bezier(.34,1.2,.64,1) ${idx * 0.04}s both`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {/* Icon */}
                      <div style={{
                        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                        background: isActive
                          ? 'linear-gradient(135deg, #FFE8DC, #FDDCCC)'
                          : '#F3F4F6',
                        border: isActive ? '1.5px solid #FDDCCC' : '1.5px solid transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all .18s',
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                          stroke={isActive ? '#E8541A' : '#9CA3AF'} strokeWidth="1.8">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      </div>

                      {/* Text */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 12.5, fontWeight: isActive ? 700 : 500,
                          color: isActive ? '#E8541A' : '#1F2937',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          lineHeight: 1.4,
                          transition: 'color .18s',
                        }}>
                          {conv.title || 'Шинэ яриа'}
                        </div>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 5, marginTop: 3,
                        }}>
                          <span style={{ fontSize: 10.5, color: '#B0A09A' }}>
                            {formatDate(conv.updatedAt)}
                          </span>
                          <span style={{
                            width: 2.5, height: 2.5, borderRadius: '50%',
                            background: '#D1C4BE', flexShrink: 0,
                          }} />
                          <span style={{ fontSize: 10.5, color: '#B0A09A' }}>
                            {msgCount} асуулт
                          </span>
                        </div>
                      </div>

                      {/* Delete */}
                      <button
                        className="sb-delete"
                        onClick={e => handleDelete(conv.id, e)}
                        onMouseEnter={() => setDeleteHoverId(conv.id)}
                        onMouseLeave={() => setDeleteHoverId(null)}
                        style={{
                          width: 26, height: 26, borderRadius: 7, border: 'none',
                          background: deleteHoverId === conv.id ? '#FEE2E2' : '#F5F0EE',
                          color: deleteHoverId === conv.id ? '#DC2626' : '#9CA3AF',
                          cursor: 'pointer', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '14px 16px',
          borderTop: '1px solid rgba(232,84,26,.06)',
          background: 'linear-gradient(0deg, #FFF7F4 0%, #FFFFFF 100%)',
          borderRadius: '0 0 0 20px',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: 8,
          }}>
            <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, letterSpacing: '0.2px' }}>
              Өнөөдрийн хязгаар
            </span>
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: remaining < 5 ? '#DC2626' : remaining < 10 ? '#D97706' : '#16A34A',
              background: remaining < 5 ? '#FEF2F2' : remaining < 10 ? '#FFFBEB' : '#F0FDF4',
              padding: '2px 8px', borderRadius: 20,
              border: `1px solid ${remaining < 5 ? '#FECACA' : remaining < 10 ? '#FDE68A' : '#BBF7D0'}`,
            }}>
              {remaining}/20
            </span>
          </div>

          {/* Progress bar */}
          <div style={{
            height: 5, borderRadius: 3,
            background: '#F0E8E4', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${usedPct}%`,
              borderRadius: 3,
              background: remaining < 5
                ? 'linear-gradient(90deg, #DC2626, #EF4444)'
                : remaining < 10
                  ? 'linear-gradient(90deg, #D97706, #F59E0B)'
                  : 'linear-gradient(90deg, #E8541A, #F07040)',
              transition: 'width 0.4s cubic-bezier(.34,1.2,.64,1)',
              boxShadow: '0 1px 4px rgba(232,84,26,.3)',
            }} />
          </div>

          <div style={{
            fontSize: 10, color: '#C0B0A8', marginTop: 6,
            textAlign: 'center', fontWeight: 500,
          }}>
            hire.mn AI · {new Date().toLocaleDateString('mn-MN')}
          </div>
        </div>
      </div>
    </>
  )
} 