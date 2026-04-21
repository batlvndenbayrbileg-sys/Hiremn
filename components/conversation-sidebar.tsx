'use client'

import { useState, useEffect } from 'react'
import { Conversation, getConversations, deleteConversation } from '@/lib/conversation-storage'

interface ConversationSidebarProps {
  activeId?: string
  onSelectConversation: (conv: Conversation) => void
  onNewConversation: () => void
}

export function ConversationSidebar({ 
  activeId, 
  onSelectConversation, 
  onNewConversation 
}: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    setConversations(getConversations())
  }, [])

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

  return (
    <div style={{
      width: '280px',
      height: '100%',
      borderRight: '1px solid #e5e7eb',
      backgroundColor: '#fafafa',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
        <button
          onClick={onNewConversation}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#E8541A',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          ➕ Шинэ яриа
        </button>
      </div>

      {/* Conversation List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {conversations.length === 0 ? (
          <div style={{
            padding: '16px',
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: '13px',
          }}>
            Яриа байхгүй байна
          </div>
        ) : (
          conversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => onSelectConversation(conv)}
              onMouseEnter={() => setExpandedId(conv.id)}
              onMouseLeave={() => setExpandedId(null)}
              style={{
                padding: '12px',
                marginBottom: '4px',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: activeId === conv.id ? '#fff0e6' : 'transparent',
                border: activeId === conv.id ? '1px solid #FDDCCC' : '1px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '8px',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#1f2937',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {conv.title}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#9ca3af',
                    marginTop: '4px',
                  }}>
                    {conv.messages.length} сэтгэгдэл
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#d1d5db',
                    marginTop: '2px',
                  }}>
                    {formatDate(conv.updatedAt)}
                  </div>
                </div>
                {expandedId === conv.id && (
                  <button
                    onClick={(e) => handleDelete(conv.id, e)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#fee2e2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer - Message limit info */}
      <div style={{
        padding: '12px',
        borderTop: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
        fontSize: '12px',
        color: '#6b7280',
        textAlign: 'center',
      }}>
        📊 Яриа түүхтэй
      </div>
    </div>
  )
}
