"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { parseTestMarkers, getTestById, type TestInfo } from "@/lib/test-db"

type Language = "mn" | "en"
type MessageRole = "user" | "bot"

interface Message {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
  isRichCard?: boolean
  richData?: TestResultData
  testIds?: number[]
  isError?: boolean
}

interface TestResultData {
  title: string
  metrics: { label: string; score: number; max: number; color: string }[]
  overall: number
}

// ─── Brain Mascot SVG ─────────────────────────────────────────────────────────
function BrainMascot({
  size = 40,
  isThinking = false,
  mood = "happy",
}: {
  size?: number
  isThinking?: boolean
  mood?: "happy" | "thinking" | "excited"
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF5F0" />
          <stop offset="100%" stopColor="#FFE0D0" />
        </linearGradient>
        <linearGradient id="stroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E8541A" />
          <stop offset="100%" stopColor="#C94010" />
        </linearGradient>
        <radialGradient id="shine" cx="40%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ambient thinking glow */}
      {isThinking && (
        <circle cx="40" cy="40" r="36" fill="#E8541A" opacity="0.08">
          <animate attributeName="r" values="34;38;34" dur="1.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.06;0.14;0.06" dur="1.4s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Left hemisphere */}
      <path
        d="M40 13 C28 13 18 20 15 30 C12 40 14 52 22 60 C28 66 35 70 40 70"
        fill="url(#bg)"
        stroke="url(#stroke)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Right hemisphere */}
      <path
        d="M40 13 C52 13 62 20 65 30 C68 40 66 52 58 60 C52 66 45 70 40 70"
        fill="url(#bg)"
        stroke="url(#stroke)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Shine */}
      <ellipse cx="40" cy="34" rx="22" ry="17" fill="url(#shine)" />
      {/* Center divider */}
      <line x1="40" y1="16" x2="40" y2="66" stroke="#E8541A" strokeWidth="1" strokeDasharray="2,3" opacity="0.2" />
      {/* Folds left */}
      <path d="M19 28 Q24 24 28 30 Q30 35 26 39" fill="none" stroke="#E8541A" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      <path d="M16 44 Q22 40 26 46 Q27 52 23 55" fill="none" stroke="#E8541A" strokeWidth="1.5" strokeLinecap="round" opacity="0.25" />
      {/* Folds right */}
      <path d="M61 28 Q56 24 52 30 Q50 35 54 39" fill="none" stroke="#E8541A" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      <path d="M64 44 Q58 40 54 46 Q53 52 57 55" fill="none" stroke="#E8541A" strokeWidth="1.5" strokeLinecap="round" opacity="0.25" />

      {/* Eyes */}
      <ellipse cx="30" cy="40" rx="5" ry={mood === "thinking" ? 3 : 6} fill="white" stroke="#1a1a1a" strokeWidth="0.8">
        {mood !== "thinking" && (
          <animate attributeName="ry" values="6;5;6" dur="3.2s" repeatCount="indefinite" />
        )}
      </ellipse>
      <ellipse cx={30 + (isThinking ? 1 : 0)} cy={40.5} rx="2.5" ry={mood === "thinking" ? 2 : 3} fill="#111">
        {isThinking && <animate attributeName="cx" values="29;31;29" dur="1.8s" repeatCount="indefinite" />}
      </ellipse>
      <circle cx="31.5" cy="38.5" r="1.4" fill="white" />

      <ellipse cx="50" cy="40" rx="5" ry={mood === "thinking" ? 3 : 6} fill="white" stroke="#1a1a1a" strokeWidth="0.8">
        {mood !== "thinking" && (
          <animate attributeName="ry" values="6;5;6" dur="3.2s" repeatCount="indefinite" begin="0.1s" />
        )}
      </ellipse>
      <ellipse cx={50 + (isThinking ? 1 : 0)} cy={40.5} rx="2.5" ry={mood === "thinking" ? 2 : 3} fill="#111">
        {isThinking && <animate attributeName="cx" values="49;51;49" dur="1.8s" repeatCount="indefinite" />}
      </ellipse>
      <circle cx="51.5" cy="38.5" r="1.4" fill="white" />

      {/* Blush */}
      <ellipse cx="21" cy="50" rx="4.5" ry="2.5" fill="#FFAA90" opacity={mood === "excited" ? 0.6 : 0.35} />
      <ellipse cx="59" cy="50" rx="4.5" ry="2.5" fill="#FFAA90" opacity={mood === "excited" ? 0.6 : 0.35} />

      {/* Mouth */}
      {mood === "thinking" ? (
        <line x1="36" y1="56" x2="44" y2="56" stroke="#333" strokeWidth="2" strokeLinecap="round" />
      ) : mood === "excited" ? (
        <path d="M34 54 Q40 62 46 54" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
      ) : (
        <path d="M35 54 Q40 59 45 54" fill="none" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" />
      )}

      {/* Neural pulse dots when thinking */}
      {isThinking && [
        { cx: 22, cy: 21, d: "0s" },
        { cx: 40, cy: 14, d: "0.2s" },
        { cx: 58, cy: 21, d: "0.4s" },
      ].map((n, i) => (
        <circle key={i} cx={n.cx} cy={n.cy} r="2.5" fill="#E8541A">
          <animate attributeName="opacity" values="0.2;0.9;0.2" dur="1s" repeatCount="indefinite" begin={n.d} />
        </circle>
      ))}
    </svg>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function BotAvatar({ isTyping = false, mood = "happy" }: { isTyping?: boolean; mood?: "happy" | "thinking" | "excited" }) {
  return (
    <div className="w-8 h-8 rounded-full bg-white border-2 border-[#E8541A]/20 flex items-center justify-center shrink-0 shadow-sm">
      <BrainMascot size={24} isThinking={isTyping} mood={mood} />
    </div>
  )
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 widget-fade-in">
      <BotAvatar isTyping mood="thinking" />
      <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1.5 items-center">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#E8541A]/60 widget-typing-dot"
              style={{ animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Test Result Card ─────────────────────────────────────────────────────────
function TestResultCard({ data }: { data: TestResultData }) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-[#E8541A] flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-gray-800">{data.title}</span>
      </div>

      <div className="space-y-2.5">
        {data.metrics.map((m, i) => (
          <div key={i}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500 font-medium">{m.label}</span>
              <span className="font-bold text-gray-800 tabular-nums">{m.score}/{m.max}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-900 ease-out"
                style={{
                  width: animated ? `${(m.score / m.max) * 100}%` : "0%",
                  transitionDelay: `${i * 180}ms`,
                  backgroundColor: m.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-gray-50">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-600">Overall Score</span>
          <div className="flex items-baseline gap-0.5">
            <span className="text-xl font-black text-[#E8541A] tabular-nums">{data.overall}</span>
            <span className="text-xs text-[#E8541A]/70 font-semibold">%</span>
          </div>
        </div>
        <div className="mt-1.5 h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: animated ? `${data.overall}%` : "0%",
              transitionDelay: "550ms",
              background: "linear-gradient(90deg, #E8541A, #FF7A45)",
            }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Test Card ────────────────────────────────────────────────────────────────
function TestCard({ test, lang }: { test: TestInfo; lang: Language }) {
  const isFree = test.priceEn === "Free"
  const price = isFree ? (lang === "mn" ? "Үнэгүй" : "Free") : `${test.price}₮`

  return (
    <a
      href={test.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-stretch bg-white rounded-xl border border-gray-100 hover:border-[#E8541A]/40 hover:shadow-md transition-all duration-200 group overflow-hidden"
    >
      <div
        className="w-12 flex items-center justify-center shrink-0 text-xl"
        style={{ background: test.color }}
      >
        {test.emoji}
      </div>
      <div className="flex-1 px-3 py-2.5 min-w-0">
        <div className="font-semibold text-sm text-gray-800 truncate group-hover:text-[#E8541A] transition-colors">
          {test.nameEn}
        </div>
        <div className="text-xs text-gray-400 mt-0.5 truncate">{test.descEn}</div>
        <div className="flex items-center gap-2 mt-1.5">
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${isFree ? "bg-green-50 text-green-600" : "bg-orange-50 text-[#E8541A]"}`}>
            {price}
          </span>
          <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {test.time}
          </span>
          <span className="ml-auto text-[11px] font-semibold text-[#E8541A] group-hover:underline">
            {lang === "mn" ? "Авах" : "Take"} &rarr;
          </span>
        </div>
      </div>
    </a>
  )
}

// ─── Test Cards Carousel ──────────────────────────────────────────────────────
function TestCardsCarousel({ testIds, lang }: { testIds: number[]; lang: Language }) {
  const [index, setIndex] = useState(0)
  const tests = testIds.map((id) => getTestById(id)).filter(Boolean) as TestInfo[]
  if (tests.length === 0) return null

  return (
    <div className="mt-2 space-y-1.5">
      <TestCard test={tests[index]} lang={lang} />
      {tests.length > 1 && (
        <div className="flex items-center justify-between px-1">
          <button
            onClick={() => setIndex((p) => (p - 1 + tests.length) % tests.length)}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#E8541A] transition-colors"
            aria-label="Previous"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex gap-1">
            {tests.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${i === index ? "bg-[#E8541A] w-4" : "bg-gray-200 w-1.5 hover:bg-gray-300"}`}
                aria-label={`Test ${i + 1}`}
              />
            ))}
          </div>
          <button
            onClick={() => setIndex((p) => (p + 1) % tests.length)}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#E8541A] transition-colors"
            aria-label="Next"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({
  message,
  isLatest,
  lang,
  botMood,
}: {
  message: Message
  isLatest: boolean
  lang: Language
  botMood: "happy" | "thinking" | "excited"
}) {
  const isUser = message.role === "user"

  if (message.isRichCard && message.richData) {
    return (
      <div className={`flex items-end gap-2 ${isLatest ? "widget-slide-up" : ""}`}>
        <BotAvatar mood="happy" />
        <div className="flex-1 max-w-[85%]">
          <TestResultCard data={message.richData} />
          <div className="text-[10px] text-gray-400 mt-1 ml-1">
            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-end gap-2 ${isLatest ? "widget-slide-up" : ""} ${isUser ? "flex-row-reverse" : ""}`}>
      {!isUser && <BotAvatar mood={isLatest ? botMood : "happy"} />}
      <div className={`max-w-[80%] ${isUser ? "" : "flex-1"}`}>
        <div
          className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "bg-[#E8541A] text-white rounded-2xl rounded-br-sm shadow-sm shadow-[#E8541A]/20 ml-auto"
              : message.isError
              ? "bg-red-50 text-red-600 border border-red-100 rounded-2xl rounded-bl-sm"
              : "bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-bl-sm shadow-sm"
          }`}
        >
          {message.content}
        </div>
        {!isUser && message.testIds && message.testIds.length > 0 && (
          <TestCardsCarousel testIds={message.testIds} lang={lang} />
        )}
        <div className={`text-[10px] text-gray-400 mt-1 font-medium ${isUser ? "text-right mr-1" : "ml-1"}`}>
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  )
}

// ─── Quick Reply Chips ────────────────────────────────────────────────────────
function QuickReplies({ onSelect, lang }: { onSelect: (t: string) => void; lang: Language }) {
  const chips = lang === "mn"
    ? ["Ямар тестүүд байна?", "Надад тохирох тест", "Үнэ", "Компани тухай"]
    : ["What tests?", "Find my test", "Pricing", "About hire.mn"]

  return (
    <div className="flex flex-wrap gap-1.5 px-4 pb-3 widget-fade-in">
      {chips.map((chip, i) => (
        <button
          key={i}
          onClick={() => onSelect(chip)}
          className="px-3 py-1.5 text-xs font-medium border border-[#E8541A]/30 text-[#E8541A] rounded-full hover:bg-[#E8541A] hover:text-white hover:border-[#E8541A] transition-all duration-200 bg-white"
        >
          {chip}
        </button>
      ))}
    </div>
  )
}

// ─── Language Toggle ──────────────────────────────────────────────────────────
function LanguageToggle({ lang, onChange }: { lang: Language; onChange: (l: Language) => void }) {
  return (
    <div className="relative flex items-center bg-black/20 rounded-full p-0.5">
      <div
        className="absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] bg-white rounded-full shadow-sm transition-transform duration-250 ease-out"
        style={{ transform: lang === "en" ? "translateX(calc(100% + 4px))" : "translateX(2px)" }}
      />
      {(["mn", "en"] as Language[]).map((l) => (
        <button
          key={l}
          onClick={() => onChange(l)}
          className={`relative z-10 px-2.5 py-1 text-[11px] font-bold uppercase rounded-full transition-colors duration-200 ${
            lang === l ? "text-[#E8541A]" : "text-white/75 hover:text-white"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  )
}

// ─── Scrolling Ticker ─────────────────────────────────────────────────────────
function Ticker() {
  const items = ["42+ Tests", "3,500+ Users", "Free Tests Available", "New: SEMUT", "WHO Standards", "hire.mn"]
  const repeated = [...items, ...items, ...items, ...items]

  return (
    <div className="h-7 bg-[#FFF5F0] border-b border-[#E8541A]/10 overflow-hidden flex items-center select-none">
      <div className="widget-ticker flex whitespace-nowrap">
        {repeated.map((item, i) => (
          <span key={i} className="flex items-center gap-1.5 mx-4 text-[11px] font-semibold text-[#C94010]/80">
            <span className="w-1 h-1 rounded-full bg-[#E8541A] opacity-60" />
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Main Widget ──────────────────────────────────────────────────────────────
export function HireMnChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [lang, setLang] = useState<Language>("mn")
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showQuickReplies, setShowQuickReplies] = useState(true)
  const [hasUnread, setHasUnread] = useState(true)
  const [botMood, setBotMood] = useState<"happy" | "thinking" | "excited">("happy")

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping, scrollToBottom])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Show welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setBotMood("excited")
      setTimeout(() => {
        setMessages([{
          id: "welcome",
          role: "bot",
          content: lang === "mn"
            ? "Сайн байна уу! Би hire.mn-ийн ухаалаг туслах.\n\nТанд тохирох тест олоход тусалъя. Юу хийхийг хүсэж байна вэ?"
            : "Hello! I'm the hire.mn AI assistant.\n\nLet me help you find the perfect assessment. What would you like to do?",
          timestamp: new Date(),
        }])
        setHasUnread(false)
        setBotMood("happy")
      }, 350)
    }
  }, [isOpen, messages.length, lang])

  const handleSend = useCallback(
    async (text?: string) => {
      const messageText = (text ?? inputValue).trim()
      if (!messageText) return

      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: "user",
        content: messageText,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMsg])
      setInputValue("")
      setShowQuickReplies(false)
      setIsTyping(true)
      setBotMood("thinking")

      try {
        // Build message history for API — normalize roles
        const history = messages
          .map((m) => ({ role: m.role === "bot" ? "assistant" : "user", content: m.content }))
        history.push({ role: "user", content: messageText })

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history, lang }),
        })

        // Guard against HTML error responses (404, 500 pages)
        const contentType = res.headers.get("content-type") ?? ""
        if (!contentType.includes("application/json")) {
          throw new Error(`Server error ${res.status}: unexpected response format`)
        }

        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? "Unknown API error")

        const { cleanText, testIds } = parseTestMarkers(data.reply ?? "")

        const botMsg: Message = {
          id: `b-${Date.now()}`,
          role: "bot",
          content: cleanText,
          timestamp: new Date(),
          testIds: testIds.length > 0 ? testIds : undefined,
        }

        setIsTyping(false)
        setBotMood(testIds.length > 0 ? "excited" : "happy")
        setMessages((prev) => [...prev, botMsg])
        setTimeout(() => setBotMood("happy"), 2000)
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Unknown error"
        setIsTyping(false)
        setBotMood("happy")
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "bot",
            content: lang === "mn"
              ? "Уучлаарай, алдаа гарлаа. Дахин оролдоно уу."
              : "Sorry, something went wrong. Please try again.",
            timestamp: new Date(),
            isError: true,
          },
        ])
        console.error("[widget] chat error:", errMsg)
      }
    },
    [inputValue, lang, messages]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleOpen = () => {
    setIsOpen(!isOpen)
    setHasUnread(false)
  }

  return (
    <div className="fixed bottom-5 right-5 z-[9999] font-sans" role="complementary" aria-label="hire.mn chat widget">

      {/* ── Chat Panel ───────────────────────────────────────────────────── */}
      {isOpen && (
        <div className="absolute bottom-[76px] right-0 w-[390px] max-h-[600px] max-sm:fixed max-sm:inset-0 max-sm:w-full max-sm:max-h-full max-sm:bottom-0 max-sm:right-0 flex flex-col bg-[#FAFAFA] rounded-2xl max-sm:rounded-none shadow-2xl shadow-black/15 overflow-hidden widget-spring-up border border-gray-200/80">

          {/* Header */}
          <div className="relative bg-[#E8541A] px-4 py-3.5 flex items-center gap-3 shrink-0 overflow-hidden">
            {/* Subtle decorative shapes */}
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/10" />
            <div className="absolute top-6 right-8 w-10 h-10 rounded-full bg-black/10" />

            {/* Avatar */}
            <div className="relative z-10 w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-md shrink-0">
              <BrainMascot size={34} mood={botMood} isThinking={isTyping} />
            </div>

            {/* Info */}
            <div className="flex-1 relative z-10 min-w-0">
              <div className="font-semibold text-white text-sm leading-none">hire.mn Assistant</div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
                </span>
                <span className="text-white/75 text-[11px] font-medium">
                  {isTyping ? (lang === "mn" ? "Бичиж байна..." : "Typing...") : (lang === "mn" ? "Онлайн" : "Online now")}
                </span>
              </div>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2 relative z-10">
              <LanguageToggle lang={lang} onChange={setLang} />
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 rounded-full transition-colors"
                aria-label="Close chat"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Ticker */}
          <Ticker />

          {/* Messages */}
          <div className="flex-1 overflow-y-auto widget-scroll p-4 space-y-4 min-h-0">
            {messages.map((msg, i) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isLatest={i === messages.length - 1}
                lang={lang}
                botMood={botMood}
              />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies */}
          {showQuickReplies && messages.length <= 1 && (
            <QuickReplies onSelect={handleSend} lang={lang} />
          )}

          {/* Input */}
          <div className="px-4 py-3 bg-white border-t border-gray-100 shrink-0">
            <div className="flex items-end gap-2.5">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={lang === "mn" ? "Мессеж бичнэ үү..." : "Type a message..."}
                rows={1}
                className="flex-1 resize-none text-sm text-gray-800 placeholder:text-gray-400 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#E8541A] focus:bg-white focus:ring-2 focus:ring-[#E8541A]/10 transition-all duration-200"
                style={{ minHeight: "42px", maxHeight: "96px" }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || isTyping}
                className="w-10 h-10 rounded-xl bg-[#E8541A] text-white flex items-center justify-center shrink-0 disabled:opacity-35 disabled:cursor-not-allowed hover:bg-[#C94010] active:scale-95 transition-all duration-150 shadow-sm shadow-[#E8541A]/30"
                aria-label="Send message"
              >
                <svg className="w-4.5 h-4.5" width={18} height={18} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="py-2 text-center text-[10px] text-gray-400 bg-white border-t border-gray-50">
            Powered by{" "}
            <a href="https://hire.mn" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#E8541A] hover:underline">
              hire.mn
            </a>{" "}
            AI
          </div>
        </div>
      )}

      {/* ── FAB Button ──────────────────────────────────────────────────── */}
      <button
        onClick={handleOpen}
        className="relative w-14 h-14 rounded-2xl bg-[#E8541A] shadow-lg shadow-[#E8541A]/35 flex items-center justify-center transition-all duration-200 hover:bg-[#C94010] hover:scale-105 hover:shadow-xl hover:shadow-[#E8541A]/40 active:scale-95"
        aria-label={isOpen ? "Close chat" : "Open hire.mn assistant"}
        aria-expanded={isOpen}
      >
        {/* Pulse rings when closed */}
        {!isOpen && (
          <>
            <span className="absolute inset-0 rounded-2xl bg-[#E8541A] widget-pulse-ring" style={{ animationDelay: "0s" }} />
            <span className="absolute inset-0 rounded-2xl bg-[#E8541A] widget-pulse-ring" style={{ animationDelay: "0.7s" }} />
          </>
        )}

        <div className={`transition-all duration-300 ${isOpen ? "rotate-90 scale-90" : ""}`}>
          {isOpen ? (
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <BrainMascot size={34} mood={botMood} />
          )}
        </div>

        {/* Unread badge */}
        {hasUnread && !isOpen && (
          <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-red-500 border-2 border-white flex items-center justify-center text-[9px] font-bold text-white" style={{ width: "18px", height: "18px" }}>
            1
          </span>
        )}
      </button>
    </div>
  )
}

export default HireMnChatWidget
