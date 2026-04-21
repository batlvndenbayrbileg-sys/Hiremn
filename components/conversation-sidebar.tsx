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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setConversations(getConversations())
    if (isVisible) {
      const timer = setTimeout(() => setMounted(true), 10)
      return () => clearTimeout(timer)
    } else {
      setMounted(false)
    }
  }, [isVisible])

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteConversation(id)
    setConversations(prev => prev.filter(c => c.id !== id))
  }

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Өчигдөр'
    } else {
      return date.toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' })
    }
  }

  const remaining = getRemainingMessages()

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.3)',
          zIndex: 10,
          opacity: mounted ? 1 : 0,
          transition: 'opacity 0.2s ease',
          borderRadius: 24,
        }}
      />
      
      {/* Sidebar Panel */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: '260px',
        backgroundColor: '#fff',
        borderRadius: '24px 0 0 24px',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 20,
        boxShadow: '4px 0 24px rgba(0,0,0,0.1)',
        transform: mounted ? 'translateX(0)' : 'translateX(-100%)',
        opacity: mounted ? 1 : 0,
        transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease',
      }}>
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideInLeft {
            from { transform: translateX(-100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}</style>

        {/* Header */}
        <div style={{ 
          padding: '20px 16px 16px',
          borderBottom: '1px solid #f3f4f6',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}>
            <span style={{ 
              fontSize: '15px', 
              fontWeight: '600', 
              color: '#111',
              letterSpacing: '-0.3px',
            }}>
              Recent Chats
            </span>
            <button
              onClick={onClose}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                transition: 'all 0.15s',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <button
            onClick={() => { onNewConversation(); onClose(); }}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #E8541A 0%, #F06A30 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(232, 84, 26, 0.25)',
              transition: 'all 0.2s',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Шинэ яриа
          </button>
        </div>

        {/* Conversation List */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '8px',
        }}>
          {conversations.length === 0 ? (
            <div style={{
              padding: '32px 16px',
              textAlign: 'center',
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#f9fafb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>
                Яриа түүх хоосон байна
              </p>
            </div>
          ) : (
            conversations.slice(0, 10).map((conv, index) => (
              <div
                key={conv.id}
                onClick={() => { onSelectConversation(conv); onClose(); }}
                onMouseEnter={() => setHoveredId(conv.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  padding: '12px',
                  marginBottom: '4px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  backgroundColor: activeId === conv.id 
                    ? '#FFF7ED' 
                    : hoveredId === conv.id 
                      ? '#f9fafb' 
                      : 'transparent',
                  border: activeId === conv.id 
                    ? '1px solid #FDBA74' 
                    : '1px solid transparent',
                  transition: 'all 0.15s',
                  animation: `fadeIn 0.2s ease ${index * 0.03}s both`,
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                }}>
                  {/* Chat icon */}
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: activeId === conv.id ? '#FFEDD5' : '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={activeId === conv.id ? '#EA580C' : '#9ca3af'} strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#1f2937',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      lineHeight: '1.4',
                    }}>
                      {conv.title || 'Шинэ яриа'}
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginTop: '4px',
                    }}>
                      <span style={{
                        fontSize: '11px',
                        color: '#9ca3af',
                      }}>
                        {formatDate(conv.updatedAt)}
                      </span>
                      <span style={{
                        width: '3px',
                        height: '3px',
                        borderRadius: '50%',
                        backgroundColor: '#d1d5db',
                      }} />
                      <span style={{
                        fontSize: '11px',
                        color: '#9ca3af',
                      }}>
                        {conv.messages.filter(m => m.role === 'user').length} асуулт
                      </span>
                    </div>
                  </div>

                  {/* Delete button */}
                  {hoveredId === conv.id && (
                    <button
                      onClick={(e) => handleDelete(conv.id, e)}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.15s',
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer - Usage info */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid #f3f4f6',
          backgroundColor: '#fafafa',
          borderRadius: '0 0 0 24px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}>
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
              Өнөөдрийн хязгаар
            </span>
            <span style={{ 
              fontSize: '12px', 
              fontWeight: '600',
              color: remaining < 5 ? '#dc2626' : '#16a34a',
            }}>
              {remaining}/20
            </span>
          </div>
          <div style={{
            height: '4px',
            borderRadius: '2px',
            backgroundColor: '#e5e7eb',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${((20 - remaining) / 20) * 100}%`,
              backgroundColor: remaining < 5 ? '#dc2626' : '#E8541A',
              borderRadius: '2px',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      </div>
    </>
  )
}
