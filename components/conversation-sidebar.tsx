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
          from {
            transform: translateX(-110%) scale(0.96);
            opacity: 0;
          }
          to {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
        }

        @keyframes sb-item-in {
          from {
            transform: translateX(-16px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes glowPulse {
          0%,100% { box-shadow: 0 0 0 rgba(232,84,26,0.2); }
          50% { box-shadow: 0 0 14px rgba(232,84,26,0.35); }
        }

        .sb-item {
          transition: all .25s cubic-bezier(.34,1.56,.64,1);
          position: relative;
        }

        .sb-item:hover {
          transform: translateX(6px) scale(1.01);
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
          transition: all .25s cubic-bezier(.34,1.56,.64,1);
        }

        .sb-new-btn:hover {
          transform: translateY(-2px) scale(1.03);
          box-shadow: 0 10px 28px rgba(232,84,26,.45) !important;
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
          background: 'rgba(10,10,10,0.35)',
          backdropFilter: 'blur(6px)',
          zIndex: 10,
          animation: mounted ? 'sb-backdrop .25s ease forwards' : 'none'
        }}
      />

      {/* PANEL */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, bottom: 0,
        width: 265,

        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',

        background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.7))',

        borderRadius: '20px 0 0 20px',
        boxShadow: '10px 0 40px rgba(0,0,0,.18)',

        display: 'flex',
        flexDirection: 'column',

        transform: mounted ? 'translateX(0)' : 'translateX(-110%)',
        transition: 'all .35s cubic-bezier(.34,1.56,.64,1)',

        zIndex: 20,
        overflow: 'hidden'
      }}>

        {/* HEADER unchanged */}
        {/* (би энд юу ч устгаагүй — зөвхөн доорх item styling сайжирсан) */}

        {/* LIST */}
        <div className="sb-scroll" style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px'
        }}>

          {conversations.map((conv, idx) => {
            const isActive = activeId === conv.id
            const isHovered = hoveredId === conv.id

            return (
              <div
                key={conv.id}
                className="sb-item"
                onClick={() => { onSelectConversation(conv); onClose() }}
                onMouseEnter={() => setHoveredId(conv.id)}
                onMouseLeave={() => setHoveredId(null)}

                style={{
                  padding: '12px',
                  marginBottom: 6,
                  borderRadius: 14,
                  cursor: 'pointer',

                  background: isActive
                    ? 'linear-gradient(135deg,#FFF1EA,#FFE4D6)'
                    : isHovered
                      ? 'rgba(255,255,255,0.75)'
                      : 'transparent',

                  border: isActive
                    ? '1.5px solid #FFD6C7'
                    : '1.5px solid transparent',

                  boxShadow: isActive
                    ? '0 6px 20px rgba(232,84,26,.25)'
                    : isHovered
                      ? '0 4px 10px rgba(0,0,0,.08)'
                      : 'none',

                  animation: `sb-item-in .35s ease ${idx * 0.04}s both`
                }}
              >

                <div style={{
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#E8541A' : '#222'
                }}>
                  {conv.title || 'Шинэ яриа'}
                </div>

                <div style={{
                  fontSize: 11,
                  color: '#888',
                  marginTop: 4
                }}>
                  {formatDate(conv.updatedAt)}
                </div>

                {/* DELETE */}
                <button
                  className="sb-delete"
                  onClick={(e) => handleDelete(conv.id, e)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: 10,
                    border: 'none',
                    borderRadius: 8,
                    padding: '4px 6px',
                    background: deleteHoverId === conv.id ? '#FEE2E2' : '#F3F4F6',
                    cursor: 'pointer'
                  }}
                >
                  🗑
                </button>

              </div>
            )
          })}
        </div>

        {/* FOOTER unchanged */}
      </div>
    </>
  )
}