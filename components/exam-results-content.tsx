'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ConsentModal } from '@/components/consent-modal'

interface ExamResultsPageProps {
  examId: string
  examResult: any
}

export function ExamResultsContent({ examId, examResult }: ExamResultsPageProps) {
  const router = useRouter()
  const [isConsentOpen, setIsConsentOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleGetAIAdvice = async () => {
    setIsLoading(true)
    try {
      // 1. Exam result-г авах
      const resultResponse = await fetch(`/api/exam/${examId}/result`)
      const resultData = await resultResponse.json()

      if (!resultData.success) {
        throw new Error('Failed to fetch exam result')
      }

      // 2. AI зөвлөгөө авах
      const adviceResponse = await fetch('/api/ai/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examResult: resultData.data,
          consent: true,
          timestamp: new Date().toISOString(),
        })
      })

      const adviceData = await adviceResponse.json()

      if (!adviceData.success) {
        throw new Error('Failed to generate advice')
      }

      // 3. Chat page-руу redirect хийхээд advice-г parameter болгон дамжуулах
      // (эсвэл localStorage ашиглах)
      sessionStorage.setItem('examAdvice', JSON.stringify({
        assessmentName: adviceData.assessmentName,
        score: adviceData.score,
        interpretation: adviceData.interpretation,
        advice: adviceData.advice,
      }))

      router.push('/chat?exam=true')
    } catch (error) {
      console.error('[v0] Error:', error)
      alert('Зөвлөгөө авахад алдаа гарлаа. Дахин оролдоно уу.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConsentConfirm = () => {
    setIsConsentOpen(false)
    handleGetAIAdvice()
  }

  return (
    <div className="space-y-6">
      {/* Существующие кнопки */}
      <div className="flex flex-col gap-3">
        <Button variant="outline" className="w-full">
          Тайлан татах
        </Button>
        <Button variant="outline" className="w-full">
          Өгсөн тестүүд
        </Button>
        <Button variant="outline" className="w-full">
          Тест руу буцах
        </Button>

        {/* ШИН: AI ЗӨВЛӨГӨӨ АВАХ BUTTON */}
        <Button
          onClick={() => setIsConsentOpen(true)}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isLoading ? 'Боловсруулж байна...' : '🤖 AI Зөвлөгөө авах'}
        </Button>
      </div>

      {/* CONSENT MODAL */}
      <ConsentModal
        isOpen={isConsentOpen}
        onConfirm={handleConsentConfirm}
        onCancel={() => setIsConsentOpen(false)}
      />
    </div>
  )
}
