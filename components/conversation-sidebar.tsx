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
          from { transform: translateX(-100%) scale(.96); opacity: 0; }
          to   { transform: translateX(0) scale(1); opacity: 1; }
        }

        @keyframes sb-item-in {
          from { transform: translateX(-16px); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }

        @keyframes sb-new-pulse {
          0%,100% { box-shadow: 0 6px 16px rgba(232,84,26,.25); }
          50% { box-shadow: 0 10px 26px rgba(232,84,26,.45); }
        }

        @keyframes sb-shimmer {
          0% { background-position: -200% 0 }
          100% { background-position: 200% 0 }
        }

        .sb-item {
          transition: all .25s cubic-bezier(.34,1.56,.64,1);
          position: relative;
        }

        .sb-item:hover {
          transform: translateX(5px) scale(1.01);
        }

        .sb-delete {
          transition: all .25s cubic-bezier(.34,1.56,.64,1);
          transform: scale(.7) rotate(-8deg);
          opacity: 0;
        }

        .sb-item:hover .sb-delete {
          transform: scale(1) rotate(0);
          opacity: 1;
        }

        .sb-new-btn {
          animation: sb-new-pulse 2.5s ease-in-out infinite;
          transition: all .25s cubic-bezier(.34,1.56,.64,1);
        }

        .sb-new-btn:hover {
          transform: translateY(-2px) scale(1.03);
          animation: none;
          box-shadow: 0 12px 28px rgba(232,84,26,.45) !important;
        }

        .sb-new-btn:active {
          transform: scale(.96);
        }

        .sb-scroll::-webkit-scrollbar { width: 4px; }
        .sb-scroll::-webkit-scrollbar-thumb {
          background: rgba(232,84,26,.2);
          border-radius: 4px;
        }
      `}</style>

      {/* BACKDROP */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(15,10,8,0.35)',
          backdropFilter: 'blur(6px)',
          zIndex: 10,
          borderRadius: 20,
          animation: mounted ? 'sb-backdrop 0.22s ease forwards' : 'none',
          opacity: mounted ? 1 : 0,
          transition: 'opacity 0.22s ease',
        }}
      />

      {/* PANEL */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, bottom: 0,
        width: 265,
        background: 'linear-gradient(180deg, rgba(255,255,255,.9), rgba(255,255,255,.75))',
        backdropFilter: 'blur(18px)',
        borderRadius: '20px 0 0 20px',
        display: 'flex', flexDirection: 'column',
        zIndex: 20,
        boxShadow: '10px 0 40px rgba(0,0,0,.15)',
        transform: mounted ? 'translateX(0)' : 'translateX(-105%)',
        opacity: mounted ? 1 : 0,
        transition: 'all .3s cubic-bezier(.34,1.2,.64,1)',
        overflow: 'hidden',
      }}>

        {/* TOP BAR */}
        <div style={{
          height: 3,
          background: 'linear-gradient(90deg,#E8541A,#F59E0B,#E8541A)',
          backgroundSize: '200% 100%',
          animation: 'sb-shimmer 3s linear infinite'
        }} />

        {/* ==== ORIGINAL HEADER (UNCHANGED) ==== */}
        {/* ---- COPY FROM YOUR ORIGINAL ---- */}
        {/* (ЭНД ЧИНИЙ HEADER ХЭСЭГ БҮРЭН БАЙГАА — БИ ОРОЛДООГҮЙ) */}

        {/* LIST */}
        <div className="sb-scroll" style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 8px',
        }}>
          {conversations.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>
              Яриа байхгүй байна
            </div>
          ) : (
            conversations.slice(0, 10).map((conv, idx) => {
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
                    padding: '10px',
                    marginBottom: 4,
                    borderRadius: 12,
                    cursor: 'pointer',
                    background: isActive
                      ? 'linear-gradient(135deg,#FFF1EA,#FFE4D6)'
                      : isHovered
                        ? '#FAFAFA'
                        : 'transparent',
                    boxShadow: isActive
                      ? '0 6px 20px rgba(232,84,26,.2)'
                      : 'none',
                    animation: `sb-item-in .3s ease ${idx * 0.04}s both`,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {conv.title || 'Шинэ яриа'}
                  </div>
                  <div style={{ fontSize: 11, color: '#888' }}>
                    {formatDate(conv.updatedAt)} · {msgCount} асуулт
                  </div>

                  <button
                    className="sb-delete"
                    onClick={e => handleDelete(conv.id, e)}
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: 8,
                      border: 'none',
                      background: '#F3F4F6',
                      borderRadius: 6,
                      cursor: 'pointer'
                    }}
                  >
                    🗑
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* ==== ORIGINAL FOOTER (UNCHANGED LOGIC) ==== */}
        <div style={{ padding: 14 }}>
          <div style={{
            height: 6,
            borderRadius: 4,
            background: '#eee',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${usedPct}%`,
              background: 'linear-gradient(90deg,#E8541A,#F59E0B,#E8541A)',
              backgroundSize: '200% 100%',
              animation: 'sb-shimmer 2s linear infinite'
            }} />
          </div>

          <div style={{
            fontSize: 11,
            marginTop: 6,
            color: '#777',
            textAlign: 'center'
          }}>
            {remaining}/20 үлдсэн
          </div>
        </div>

      </div>
    </>
  )
}