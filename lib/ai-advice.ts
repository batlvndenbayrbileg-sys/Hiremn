import { generateText } from 'ai'
import { withGeminiFallback } from './llm'

export async function getAIAdvice(examResult: {
  assessmentId: string
  assessmentName: string
  userResponses: any[]
  score: number
  scoreRange: { min: number; max: number }
  interpretation: string
  timestamp: string
}) {
  try {
    const systemPrompt = `Та hire.mn платформын мэргэжлийн сэтгэл зүйч AI зөвлөх.

Хэрэглэгч өөрийнхөө тестийн үр дүнд үндэслээд ГҮНЗГИЙ, МЭРГЭЖЛИЙН зөвлөгөө авахыг хүсч байна.

ЧУХАЛ ЗҮЙЛС:
1. Үр дүнг шинжилж, тайлбарлах
2. Хүний хүч чадварыг онцлох (сайн талууд)
3. Сайжруулах чиглэлүүдийг санал болгох
4. ПРАКТИК, ХЭРЭГЖҮҮЛЭХ боломжтой зөвлөгөө өгөх
5. Жавхалан хэлэх, эмпатитэй байх

ХЭЗЭЭ Ч:
- Оношлохгүй (жишээ: "Та сэтгэцийн асуудалтай" гэх мэт)
- Мэргэжилтэнд үлгэрмээр явуулахгүй
- Утга найруулга зүйн алдаа гарахгүй`

    const userMessage = `Миний тестийн үр дүн:

**Тест:** ${examResult.assessmentName}
**Оноо:** ${examResult.score} / ${examResult.scoreRange.max}
**Түвшин:** ${examResult.interpretation}
**Хариултаниуд:** ${JSON.stringify(examResult.userResponses, null, 2)}

Миний үр дүнд үндэслээд ГҮНЗГИЙ, МЭРГЭЖЛИЙН зөвлөгөө өгөөч.`

    const response = await withGeminiFallback(model => generateText({
      model,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage,
        }
      ],
      temperature: 0.7,
    }))

    return {
      success: true,
      advice: response.text,
      assessmentName: examResult.assessmentName,
      score: examResult.score,
      interpretation: examResult.interpretation,
    }
  } catch (error) {
    console.error('Error generating AI advice:', error)
    return {
      success: false,
      error: 'Failed to generate advice',
    }
  }
}
