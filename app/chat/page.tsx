'use client'

import { useEffect, useState } from 'react'
import { HireMnChatWidget } from '@/components/hire-mn-chat-widget'

export default function ChatPage() {
  const [examAdvice, setExamAdvice] = useState<any>(null)

  useEffect(() => {
    // SessionStorage-аас exam advice авах
    const stored = sessionStorage.getItem('examAdvice')
    if (stored) {
      setExamAdvice(JSON.parse(stored))
      sessionStorage.removeItem('examAdvice') // Нэг удаа ашиглаа
    }
  }, [])

  return (
    <div className="flex flex-col h-screen">
      {/* Exam advice context дамжуулах */}
      <HireMnChatWidget 
        initialContext={examAdvice ? {
          type: 'exam-result',
          data: examAdvice
        } : undefined}
      />
    </div>
  )
}
