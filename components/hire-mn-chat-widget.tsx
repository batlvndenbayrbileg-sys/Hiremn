"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
type Language = "mn" | "en"
type MessageRole = "user" | "bot"

interface Message {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
  isRichCard?: boolean
  richData?: TestResultData
}

interface TestResultData {
  title: string
  metrics: { label: string; score: number; max: number }[]
  overall: number
}

// ═══════════════════════════════════════
// BRAIN MASCOT SVG COMPONENT
// ═══════════════════════════════════════
const BrainMascot = ({
  size = 48,
  isThinking = false,
  isHovered = false,
  variant = "default",
}: {
  size?: number
  isThinking?: boolean
  isHovered?: boolean
  variant?: "default" | "mini" | "fab"
}) => {
  const pulseSpeed = isThinking ? "0.4s" : "1.5s"

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`
        ${variant === "fab" ? "brain-float" : ""}
        ${isHovered ? "brain-wiggle" : ""}
      `}
      aria-label="hire.mn brain mascot"
    >
      {/* Left hemisphere */}
      <ellipse
        cx="24"
        cy="32"
        rx="18"
        ry="22"
        fill={variant === "fab" ? "#FFFFFF" : "#FFF8F5"}
        stroke="#E8541A"
        strokeWidth="2"
      />
      {/* Right hemisphere */}
      <ellipse
        cx="40"
        cy="32"
        rx="18"
        ry="22"
        fill={variant === "fab" ? "#FFFFFF" : "#FFF8F5"}
        stroke="#E8541A"
        strokeWidth="2"
      />
      {/* Center dividing line (dashed) */}
      <path
        d="M32 12 L32 52"
        stroke="#E8541A"
        strokeWidth="1.5"
        strokeDasharray="4 3"
        opacity="0.6"
      />
      {/* Brain folds - left */}
      <path
        d="M14 28 Q20 26, 24 28"
        stroke="#E8541A"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M12 36 Q18 34, 26 36"
        stroke="#E8541A"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
      />
      {/* Brain folds - right */}
      <path
        d="M40 28 Q44 26, 50 28"
        stroke="#E8541A"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M38 36 Q46 34, 52 36"
        stroke="#E8541A"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
      />

      {/* Cute eyes */}
      <ellipse cx="22" cy="30" rx="3" ry="3.5" fill="#1A1A1A" />
      <ellipse cx="42" cy="30" rx="3" ry="3.5" fill="#1A1A1A" />
      {/* Eye highlights */}
      <circle cx="23" cy="29" r="1" fill="#FFFFFF" />
      <circle cx="43" cy="29" r="1" fill="#FFFFFF" />

      {/* Happy mouth */}
      <path
        d="M28 40 Q32 44, 36 40"
        stroke="#1A1A1A"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* Synaptic dots with pulse animation */}
      <g className="synapse-dots">
        <circle cx="18" cy="22" r="2.5" fill="#E8541A">
          <animate
            attributeName="opacity"
            values="0.4;1;0.4"
            dur={pulseSpeed}
            repeatCount="indefinite"
          />
          <animate
            attributeName="r"
            values="2;3;2"
            dur={pulseSpeed}
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="32" cy="16" r="2.5" fill="#E8541A">
          <animate
            attributeName="opacity"
            values="0.4;1;0.4"
            dur={pulseSpeed}
            repeatCount="indefinite"
            begin="0.2s"
          />
          <animate
            attributeName="r"
            values="2;3;2"
            dur={pulseSpeed}
            repeatCount="indefinite"
            begin="0.2s"
          />
        </circle>
        <circle cx="46" cy="22" r="2.5" fill="#E8541A">
          <animate
            attributeName="opacity"
            values="0.4;1;0.4"
            dur={pulseSpeed}
            repeatCount="indefinite"
            begin="0.4s"
          />
          <animate
            attributeName="r"
            values="2;3;2"
            dur={pulseSpeed}
            repeatCount="indefinite"
            begin="0.4s"
          />
        </circle>
      </g>
    </svg>
  )
}

// ═══════════════════════════════════════
// MINI BRAIN FOR MESSAGES
// ═══════════════════════════════════════
const MiniBrain = () => (
  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-hire-primary to-hire-primary-dark flex items-center justify-center shrink-0">
    <BrainMascot size={20} variant="mini" />
  </div>
)

// ═══════════════════════════════════════
// TYPING INDICATOR
// ═══════════════════════════════════════
const TypingIndicator = () => (
  <div className="flex items-end gap-2 animate-fade-in">
    <MiniBrain />
    <div className="bg-white border border-hire-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-hire-primary typing-dot"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  </div>
)

// ═══════════════════════════════════════
// TEST RESULT CARD
// ═══════════════════════════════════════
const TestResultCard = ({ data }: { data: TestResultData }) => {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="bg-hire-card border-2 border-hire-primary/20 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-hire-text font-semibold">
        <svg className="w-5 h-5 text-hire-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        {data.title}
      </div>
      <div className="space-y-2.5">
        {data.metrics.map((metric, i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-hire-text/70">{metric.label}</span>
              <span className="font-medium text-hire-text">{metric.score}/{metric.max}</span>
            </div>
            <div className="h-2 bg-hire-primary/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-hire-primary to-hire-primary-dark rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: animated ? `${(metric.score / metric.max) * 100}%` : "0%",
                  transitionDelay: `${i * 150}ms`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="pt-2 border-t border-hire-primary/10">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-hire-text">Нийт үнэлгээ</span>
          <span className="text-xl font-bold text-hire-primary">{data.overall}%</span>
        </div>
        <div className="mt-1.5 h-3 bg-hire-primary/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-hire-primary via-hire-primary-dark to-hire-primary rounded-full transition-all duration-1000 ease-out"
            style={{
              width: animated ? `${data.overall}%` : "0%",
              transitionDelay: "450ms",
            }}
          />
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════
// MESSAGE BUBBLE
// ═══════════════════════════════════════
const MessageBubble = ({ message }: { message: Message }) => {
  const isUser = message.role === "user"

  if (message.isRichCard && message.richData) {
    return (
      <div className="flex items-end gap-2 animate-slide-up">
        <MiniBrain />
        <div className="max-w-[85%]">
          <TestResultCard data={message.richData} />
          <div className="text-[10px] text-hire-text/40 mt-1 ml-1">
            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-end gap-2 animate-slide-up ${isUser ? "flex-row-reverse" : ""}`}>
      {!isUser && <MiniBrain />}
      <div
        className={`
          max-w-[80%] px-4 py-2.5 
          ${isUser
            ? "bg-hire-primary text-white rounded-2xl rounded-br-sm"
            : "bg-white text-hire-text border border-hire-border rounded-2xl rounded-bl-sm shadow-sm"
          }
        `}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════
// QUICK REPLY CHIPS
// ═══════════════════════════════════════
const QuickReplyChips = ({
  lang,
  onSelect,
  visible,
}: {
  lang: Language
  onSelect: (text: string) => void
  visible: boolean
}) => {
  const chips = {
    mn: [
      "Ямар тест байдаг?",
      "Надад тохирох тест хэл",
      "Үр дүнгээ тайлбарлуулах",
      "Үнэ, нөхцөл",
    ],
    en: [
      "What tests are available?",
      "Find my ideal test",
      "Explain my results",
      "Pricing & plans",
    ],
  }

  if (!visible) return null

  return (
    <div className="flex flex-wrap gap-2 px-4 pb-3 animate-fade-in">
      {chips[lang].map((chip, i) => (
        <button
          key={i}
          onClick={() => onSelect(chip)}
          className="
            px-3 py-1.5 text-xs font-medium
            bg-white border-[1.5px] border-hire-primary text-hire-primary
            rounded-full
            hover:bg-hire-primary hover:text-white
            transition-all duration-200
            active:scale-95
          "
        >
          {chip}
        </button>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════
// LANGUAGE TOGGLE
// ═══════════════════════════════════════
const LanguageToggle = ({
  lang,
  onChange,
}: {
  lang: Language
  onChange: (lang: Language) => void
}) => (
  <div className="flex items-center bg-white/20 rounded-full p-0.5">
    <button
      onClick={() => onChange("mn")}
      className={`
        px-2.5 py-1 text-[10px] font-semibold rounded-full transition-all duration-200
        ${lang === "mn" ? "bg-white text-hire-primary" : "text-white/80 hover:text-white"}
      `}
    >
      МН
    </button>
    <button
      onClick={() => onChange("en")}
      className={`
        px-2.5 py-1 text-[10px] font-semibold rounded-full transition-all duration-200
        ${lang === "en" ? "bg-white text-hire-primary" : "text-white/80 hover:text-white"}
      `}
    >
      EN
    </button>
  </div>
)

// ═══════════════════════════════════════
// TICKER BAR
// ═══════════════════════════════════════
const TickerBar = ({ lang }: { lang: Language }) => {
  const tickerText = {
    mn: "✦ 42+ тест нээлттэй  ✦ 3,512+ хэрэглэгч  ✦ Шинэ: СЭМУТ сорил  ✦ Үнэгүй тестүүд байна  ",
    en: "✦ 42+ tests available  ✦ 3,512+ users  ✦ New: SEMUT assessment  ✦ Free tests available  ",
  }

  return (
    <div className="h-7 bg-hire-ticker overflow-hidden flex items-center">
      <div className="ticker-scroll flex whitespace-nowrap">
        {[...Array(4)].map((_, i) => (
          <span key={i} className="text-[10.5px] font-semibold text-hire-primary-dark">
            {tickerText[lang]}
          </span>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════
// SMART RESPONSE ENGINE
// ═══════════════════════════════════════
const getSmartResponse = (
  input: string,
  lang: Language
): { text: string; isRichCard?: boolean; richData?: TestResultData } => {
  const lower = input.toLowerCase()

  // Test list keywords
  if (
    lower.includes("тест") ||
    lower.includes("жагсаалт") ||
    lower.includes("test") ||
    lower.includes("available")
  ) {
    if (lang === "mn") {
      return {
        text: `hire.mn дээр дараах тестүүд байна:

🎯 Зан чанарын үнэлгээ
🧠 Оюун ухааны тест
🚀 Удирдлагын ур чадвар
💛 Сэтгэл хөдлөлийн оюун ухаан
💼 Мэргэжлийн гүйцэтгэл
🏥 Эрүүл мэндийн үнэлгээ

Аль тестийн тухай дэлгэрэнгүй мэдмээр байна?`,
      }
    }
    return {
      text: `Here are the tests available on hire.mn:

🎯 Personality Assessment
🧠 Intelligence Test
🚀 Leadership Skills
💛 Emotional Intelligence
💼 Professional Performance
🏥 Health Assessment

Which test would you like to know more about?`,
    }
  }

  // Recommendation keywords
  if (
    lower.includes("тохирох") ||
    lower.includes("санал") ||
    lower.includes("надад") ||
    lower.includes("ideal") ||
    lower.includes("find") ||
    lower.includes("recommend")
  ) {
    if (lang === "mn") {
      return {
        text: `Тантай зохицох тестийг олъё! 😊

Хэдэн зүйлийг хэлнэ үү:
• Одоо ямар ажил хийдэг вэ?
• Зорилго юу вэ?
  — Өөрийгөө таних
  — Ажил хайх
  — Карьераа хөгжүүлэх`,
      }
    }
    return {
      text: `Let's find the perfect test for you! 😊

Tell me a bit about yourself:
• What's your current occupation?
• What's your goal?
  — Self-discovery
  — Job hunting
  — Career development`,
    }
  }

  // Results keywords - show rich card
  if (
    lower.includes("үр дүн") ||
    lower.includes("тайлбар") ||
    lower.includes("оноо") ||
    lower.includes("result") ||
    lower.includes("explain") ||
    lower.includes("score")
  ) {
    return {
      text: "",
      isRichCard: true,
      richData: {
        title: lang === "mn" ? "Таны үр дүн" : "Your Results",
        metrics: [
          { label: lang === "mn" ? "Өсөлтийн сэтгэлгээ" : "Growth Mindset", score: 82, max: 100 },
          { label: lang === "mn" ? "Тэвчээр" : "Resilience", score: 74, max: 100 },
          { label: lang === "mn" ? "Дасан зохицол" : "Adaptability", score: 91, max: 100 },
        ],
        overall: 82,
      },
    }
  }

  // Pricing keywords
  if (
    lower.includes("үнэ") ||
    lower.includes("төлбөр") ||
    lower.includes("pric") ||
    lower.includes("cost") ||
    lower.includes("plan")
  ) {
    if (lang === "mn") {
      return {
        text: `hire.mn-ий тестийн үнэ:

💰 Үнэгүй — AUDIT, СЭМУТ, никотин тест
🟠 10,000₮ — Mindset тест (10 мин)
🟠 20,000₮ — Ажил-амьдрал тест (10 мин)
🟠 30,000₮ — Харилцааны тест (10 мин)

Бүртгэлтэй хэрэглэгчид хөнгөлөлт эдэлнэ!`,
      }
    }
    return {
      text: `hire.mn test pricing:

💰 Free — AUDIT, SEMUT, nicotine test
🟠 10,000₮ — Mindset test (10 min)
🟠 20,000₮ — Work-life test (10 min)
🟠 30,000₮ — Communication test (10 min)

Registered users get discounts!`,
    }
  }

  // Default response
  if (lang === "mn") {
    return {
      text: `Ойлголоо! hire.mn дээр 42+ тест байна 😊
Зорилгоо хэлвэл яг тохирох тестийг санал болгоно!`,
    }
  }
  return {
    text: `Got it! hire.mn has 42+ tests available 😊
Tell me your goal and I'll recommend the perfect test!`,
  }
}

// ═══════════════════════════════════════
// MAIN WIDGET COMPONENT
// ═══════════════════════════════════════
export function HireMnChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [lang, setLang] = useState<Language>("mn")
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showQuickReplies, setShowQuickReplies] = useState(true)
  const [hasUnread, setHasUnread] = useState(true)
  const [isHovered, setIsHovered] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping, scrollToBottom])

  // Welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMsg: Message = {
        id: "welcome",
        role: "bot",
        content:
          lang === "mn"
            ? "Сайн байна уу! 👋 Би hire.mn-ий ухаалаг туслагч. Танд хэрхэн туслах вэ?"
            : "Hello! 👋 I'm the hire.mn smart assistant. How can I help you today?",
        timestamp: new Date(),
      }
      setMessages([welcomeMsg])
      setHasUnread(false)
    }
  }, [isOpen, messages.length, lang])

  const handleSend = useCallback(
    async (text?: string) => {
      const messageText = text || inputValue.trim()
      if (!messageText) return

      // Add user message
      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: messageText,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, userMsg])
      setInputValue("")
      setShowQuickReplies(false)
      setIsTyping(true)

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 700))

      // Get smart response
      const response = getSmartResponse(messageText, lang)
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        content: response.text,
        timestamp: new Date(),
        isRichCard: response.isRichCard,
        richData: response.richData,
      }

      setIsTyping(false)
      setMessages((prev) => [...prev, botMsg])
    },
    [inputValue, lang]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* CSS Animations */}
      <style jsx global>{`
        :root {
          --hire-primary: #E8541A;
          --hire-primary-dark: #C94010;
          --hire-primary-light: #FDF0EB;
          --hire-background: #FFFCFB;
          --hire-text: #1A1A1A;
          --hire-border: #F0EBE8;
          --hire-ticker: #FFF0EB;
          --hire-card: #FFF8F5;
        }

        .bg-hire-primary { background-color: var(--hire-primary); }
        .bg-hire-primary-dark { background-color: var(--hire-primary-dark); }
        .bg-hire-primary-light { background-color: var(--hire-primary-light); }
        .bg-hire-background { background-color: var(--hire-background); }
        .bg-hire-ticker { background-color: var(--hire-ticker); }
        .bg-hire-card { background-color: var(--hire-card); }
        .text-hire-primary { color: var(--hire-primary); }
        .text-hire-primary-dark { color: var(--hire-primary-dark); }
        .text-hire-text { color: var(--hire-text); }
        .border-hire-primary { border-color: var(--hire-primary); }
        .border-hire-border { border-color: var(--hire-border); }
        .from-hire-primary { --tw-gradient-from: var(--hire-primary); }
        .to-hire-primary { --tw-gradient-to: var(--hire-primary); }
        .to-hire-primary-dark { --tw-gradient-to: var(--hire-primary-dark); }
        .via-hire-primary-dark { --tw-gradient-via: var(--hire-primary-dark); }

        @keyframes brain-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        @keyframes brain-wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg); }
          75% { transform: rotate(5deg); }
        }

        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2); opacity: 0; }
        }

        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }

        @keyframes slide-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes spring-up {
          0% { opacity: 0; transform: scale(0.8) translateY(20px); }
          50% { transform: scale(1.02) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }

        @keyframes spring-down {
          0% { opacity: 1; transform: scale(1) translateY(0); }
          100% { opacity: 0; transform: scale(0.8) translateY(20px); }
        }

        .brain-float {
          animation: brain-float 3s ease-in-out infinite;
        }

        .brain-wiggle {
          animation: brain-wiggle 0.4s ease-in-out;
        }

        .pulse-ring {
          animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .ticker-scroll {
          animation: ticker-scroll 20s linear infinite;
        }

        .typing-dot {
          animation: typing-bounce 1s ease-in-out infinite;
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }

        .animate-spring-up {
          animation: spring-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .animate-spring-down {
          animation: spring-down 0.25s ease-in forwards;
        }

        /* Custom scrollbar */
        .chat-messages::-webkit-scrollbar {
          width: 4px;
        }
        .chat-messages::-webkit-scrollbar-track {
          background: transparent;
        }
        .chat-messages::-webkit-scrollbar-thumb {
          background: var(--hire-primary);
          border-radius: 4px;
          opacity: 0.3;
        }
      `}</style>

      {/* Widget Container */}
      <div className="fixed bottom-5 right-5 z-[9999] font-sans" role="complementary" aria-label="Chat widget">
        {/* Chat Panel */}
        {isOpen && (
          <div
            className={`
              absolute bottom-20 right-0 
              w-[380px] h-[580px] 
              max-sm:fixed max-sm:inset-0 max-sm:w-full max-sm:h-full max-sm:bottom-0 max-sm:right-0
              bg-hire-background rounded-3xl max-sm:rounded-none
              shadow-[0_25px_50px_-12px_rgba(232,84,26,0.25),0_0_0_1px_rgba(232,84,26,0.05)]
              flex flex-col overflow-hidden
              animate-spring-up
            `}
          >
            {/* Header */}
            <div className="relative h-[72px] bg-gradient-to-r from-[#E8541A] to-[#D04010] px-4 flex items-center gap-3 shrink-0">
              {/* Decorative circles */}
              <div className="absolute top-2 right-8 w-16 h-16 rounded-full bg-white/10" />
              <div className="absolute top-6 right-2 w-10 h-10 rounded-full bg-white/5" />

              {/* Brain avatar */}
              <div className="relative z-10 w-12 h-12 rounded-xl bg-white/90 flex items-center justify-center shadow-sm">
                <BrainMascot size={36} variant="default" />
              </div>

              {/* Title & status */}
              <div className="flex-1 relative z-10">
                <h2 className="text-white font-bold text-sm">hire.mn Туслах</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-white/70 text-[11px]">
                    {lang === "mn" ? "Онлайн байна" : "Online"}
                  </span>
                </div>
              </div>

              {/* Language toggle */}
              <LanguageToggle lang={lang} onChange={setLang} />

              {/* Close button (mobile) */}
              <button
                onClick={() => setIsOpen(false)}
                className="sm:hidden w-8 h-8 flex items-center justify-center text-white/80 hover:text-white"
                aria-label="Close chat"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Ticker */}
            <TickerBar lang={lang} />

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto chat-messages p-4 space-y-3">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            <QuickReplyChips
              lang={lang}
              onSelect={handleSend}
              visible={showQuickReplies && messages.length <= 1}
            />

            {/* Input Area */}
            <div className="p-3 border-t border-hire-border bg-white">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={lang === "mn" ? "Мессежээ бичнэ үү..." : "Type your message..."}
                    rows={1}
                    className="
                      w-full resize-none rounded-xl border border-hire-border 
                      bg-hire-background px-4 py-2.5 text-sm text-hire-text
                      placeholder:text-hire-text/40
                      focus:outline-none focus:border-hire-primary focus:ring-2 focus:ring-hire-primary/20
                      transition-all duration-200
                      max-h-20
                    "
                    style={{ minHeight: "42px" }}
                  />
                </div>
                <button
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim()}
                  className="
                    w-10 h-10 rounded-full bg-hire-primary text-white
                    flex items-center justify-center shrink-0
                    hover:bg-hire-primary-dark
                    disabled:opacity-40 disabled:cursor-not-allowed
                    transition-all duration-200
                    active:scale-90
                  "
                  aria-label="Send message"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="py-2 text-center text-[10px] text-hire-text/40 bg-white">
              hire.mn AI · {lang === "mn" ? "Ухаалаг туслагч" : "Smart Assistant"}
            </div>
          </div>
        )}

        {/* FAB Button */}
        <button
          onClick={() => {
            setIsOpen(!isOpen)
            setHasUnread(false)
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`
            relative w-16 h-16 rounded-full 
            bg-gradient-to-br from-[#E8541A] to-[#D04010]
            shadow-[0_8px_32px_rgba(232,84,26,0.4)]
            flex items-center justify-center
            transition-all duration-300
            hover:scale-105 hover:shadow-[0_12px_40px_rgba(232,84,26,0.5)]
            active:scale-95
          `}
          aria-label={isOpen ? "Close chat" : "Open chat"}
          aria-expanded={isOpen}
        >
          {/* Pulse rings */}
          {!isOpen && (
            <>
              <span className="absolute inset-0 rounded-full bg-hire-primary pulse-ring" style={{ animationDelay: "0s" }} />
              <span className="absolute inset-0 rounded-full bg-hire-primary pulse-ring" style={{ animationDelay: "0.5s" }} />
              <span className="absolute inset-0 rounded-full bg-hire-primary pulse-ring" style={{ animationDelay: "1s" }} />
            </>
          )}

          {/* Brain / Close icon */}
          <div
            className={`
              transition-transform duration-300
              ${isOpen ? "rotate-180" : ""}
            `}
          >
            {isOpen ? (
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <BrainMascot size={40} variant="fab" isHovered={isHovered} />
            )}
          </div>

          {/* Unread badge */}
          {hasUnread && !isOpen && (
            <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-red-500 border-2 border-white animate-pulse" />
          )}
        </button>
      </div>
    </>
  )
}

// ═══════════════════════════════════════
// MOUNT FUNCTION FOR VANILLA JS
// ═══════════════════════════════════════
export function mountWidget(containerId?: string) {
  if (typeof window === "undefined") return

  const container = containerId
    ? document.getElementById(containerId)
    : (() => {
        const div = document.createElement("div")
        div.id = "hire-mn-chat-widget"
        document.body.appendChild(div)
        return div
      })()

  if (!container) {
    console.error("[hire.mn] Widget container not found")
    return
  }

  // Dynamic import React and ReactDOM for vanilla usage
  import("react").then((React) => {
    import("react-dom/client").then((ReactDOM) => {
      const root = ReactDOM.createRoot(container)
      root.render(React.createElement(HireMnChatWidget))
    })
  })
}

export default HireMnChatWidget
