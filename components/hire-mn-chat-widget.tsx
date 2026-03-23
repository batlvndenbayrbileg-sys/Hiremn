"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"

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

function BrainMascot({
  size = 48,
  isThinking = false,
  isHovered = false,
  variant = "default",
}: {
  size?: number
  isThinking?: boolean
  isHovered?: boolean
  variant?: "default" | "mini" | "fab"
}) {
  const pulseSpeed = isThinking ? "0.4s" : "1.5s"

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${variant === "fab" ? "brain-float" : ""} ${isHovered ? "brain-wiggle" : ""}`}
      aria-label="hire.mn brain mascot"
    >
      <ellipse cx="24" cy="32" rx="18" ry="22" fill={variant === "fab" ? "#FFFFFF" : "#FFF8F5"} stroke="#E8541A" strokeWidth="2" />
      <ellipse cx="40" cy="32" rx="18" ry="22" fill={variant === "fab" ? "#FFFFFF" : "#FFF8F5"} stroke="#E8541A" strokeWidth="2" />
      <path d="M32 12 L32 52" stroke="#E8541A" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
      <path d="M14 28 Q20 26, 24 28" stroke="#E8541A" strokeWidth="1.5" fill="none" opacity="0.5" />
      <path d="M12 36 Q18 34, 26 36" stroke="#E8541A" strokeWidth="1.5" fill="none" opacity="0.5" />
      <path d="M40 28 Q44 26, 50 28" stroke="#E8541A" strokeWidth="1.5" fill="none" opacity="0.5" />
      <path d="M38 36 Q46 34, 52 36" stroke="#E8541A" strokeWidth="1.5" fill="none" opacity="0.5" />
      <ellipse cx="22" cy="30" rx="3" ry="3.5" fill="#1A1A1A" />
      <ellipse cx="42" cy="30" rx="3" ry="3.5" fill="#1A1A1A" />
      <circle cx="23" cy="29" r="1" fill="#FFFFFF" />
      <circle cx="43" cy="29" r="1" fill="#FFFFFF" />
      <path d="M28 40 Q32 44, 36 40" stroke="#1A1A1A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <g>
        <circle cx="18" cy="22" r="2.5" fill="#E8541A">
          <animate attributeName="opacity" values="0.4;1;0.4" dur={pulseSpeed} repeatCount="indefinite" />
          <animate attributeName="r" values="2;3;2" dur={pulseSpeed} repeatCount="indefinite" />
        </circle>
        <circle cx="32" cy="16" r="2.5" fill="#E8541A">
          <animate attributeName="opacity" values="0.4;1;0.4" dur={pulseSpeed} repeatCount="indefinite" begin="0.2s" />
          <animate attributeName="r" values="2;3;2" dur={pulseSpeed} repeatCount="indefinite" begin="0.2s" />
        </circle>
        <circle cx="46" cy="22" r="2.5" fill="#E8541A">
          <animate attributeName="opacity" values="0.4;1;0.4" dur={pulseSpeed} repeatCount="indefinite" begin="0.4s" />
          <animate attributeName="r" values="2;3;2" dur={pulseSpeed} repeatCount="indefinite" begin="0.4s" />
        </circle>
      </g>
    </svg>
  )
}

function MiniBrain() {
  return (
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
      <BrainMascot size={20} variant="mini" />
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 animate-fade-in">
      <MiniBrain />
      <div className="bg-background border border-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-primary typing-dot"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function TestResultCard({ data }: { data: TestResultData }) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="bg-card border-2 border-primary/20 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-foreground font-semibold">
        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        {data.title}
      </div>
      <div className="space-y-2.5">
        {data.metrics.map((metric, i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-foreground/70">{metric.label}</span>
              <span className="font-medium text-foreground">{metric.score}/{metric.max}</span>
            </div>
            <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: animated ? `${(metric.score / metric.max) * 100}%` : "0%",
                  transitionDelay: `${i * 150}ms`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="pt-2 border-t border-primary/10">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Total Score</span>
          <span className="text-xl font-bold text-primary">{data.overall}%</span>
        </div>
        <div className="mt-1.5 h-3 bg-primary/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary via-accent to-primary rounded-full transition-all duration-1000 ease-out"
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

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user"

  if (message.isRichCard && message.richData) {
    return (
      <div className="flex items-end gap-2 animate-slide-up">
        <MiniBrain />
        <div className="max-w-[85%]">
          <TestResultCard data={message.richData} />
          <div className="text-[10px] text-foreground/40 mt-1 ml-1">
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
        className={`max-w-[80%] px-4 py-2.5 ${
          isUser
            ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm"
            : "bg-background text-foreground border border-border rounded-2xl rounded-bl-sm shadow-sm"
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  )
}

function QuickReplyChips({
  lang,
  onSelect,
  visible,
}: {
  lang: Language
  onSelect: (text: string) => void
  visible: boolean
}) {
  const chips = {
    mn: ["What tests?", "Find my test", "My results", "Pricing"],
    en: ["What tests?", "Find my test", "My results", "Pricing"],
  }

  if (!visible) return null

  return (
    <div className="flex flex-wrap gap-2 px-4 pb-3 animate-fade-in">
      {chips[lang].map((chip, i) => (
        <button
          key={i}
          onClick={() => onSelect(chip)}
          className="px-3 py-1.5 text-xs font-medium bg-background border-[1.5px] border-primary text-primary rounded-full hover:bg-primary hover:text-primary-foreground transition-all duration-200 active:scale-95"
        >
          {chip}
        </button>
      ))}
    </div>
  )
}

function LanguageToggle({ lang, onChange }: { lang: Language; onChange: (lang: Language) => void }) {
  return (
    <div className="flex items-center bg-white/20 rounded-full p-0.5">
      <button
        onClick={() => onChange("mn")}
        className={`px-2.5 py-1 text-[10px] font-semibold rounded-full transition-all duration-200 ${
          lang === "mn" ? "bg-white text-primary" : "text-white/80 hover:text-white"
        }`}
      >
        MN
      </button>
      <button
        onClick={() => onChange("en")}
        className={`px-2.5 py-1 text-[10px] font-semibold rounded-full transition-all duration-200 ${
          lang === "en" ? "bg-white text-primary" : "text-white/80 hover:text-white"
        }`}
      >
        EN
      </button>
    </div>
  )
}

function TickerBar({ lang }: { lang: Language }) {
  const tickerMn = "42+ tests available - 3,512+ users - New: SEMUT assessment - Free tests available - "
  const tickerEn = "42+ tests available - 3,512+ users - New: SEMUT assessment - Free tests available - "

  return (
    <div className="h-7 bg-muted overflow-hidden flex items-center">
      <div className="ticker-scroll flex whitespace-nowrap">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="text-[10.5px] font-semibold text-accent">
            {lang === "mn" ? tickerMn : tickerEn}
          </span>
        ))}
      </div>
    </div>
  )
}

function getSmartResponse(
  input: string,
  lang: Language
): { text: string; isRichCard?: boolean; richData?: TestResultData } {
  const lower = input.toLowerCase()

  if (lower.includes("test") || lower.includes("available")) {
    return {
      text: `Here are the tests available on hire.mn:

- Personality Assessment
- Intelligence Test  
- Leadership Skills
- Emotional Intelligence
- Professional Performance
- Health Assessment

Which test would you like to know more about?`,
    }
  }

  if (lower.includes("find") || lower.includes("recommend") || lower.includes("ideal")) {
    return {
      text: `Let's find the perfect test for you!

Tell me a bit about yourself:
- What's your current occupation?
- What's your goal?
  - Self-discovery
  - Job hunting
  - Career development`,
    }
  }

  if (lower.includes("result") || lower.includes("explain") || lower.includes("score")) {
    return {
      text: "",
      isRichCard: true,
      richData: {
        title: lang === "mn" ? "Your Results" : "Your Results",
        metrics: [
          { label: "Growth Mindset", score: 82, max: 100 },
          { label: "Resilience", score: 74, max: 100 },
          { label: "Adaptability", score: 91, max: 100 },
        ],
        overall: 82,
      },
    }
  }

  if (lower.includes("pric") || lower.includes("cost") || lower.includes("plan")) {
    return {
      text: `hire.mn test pricing:

Free - AUDIT, SEMUT, nicotine test
10,000 MNT - Mindset test (10 min)
20,000 MNT - Work-life test (10 min)
30,000 MNT - Communication test (10 min)

Registered users get discounts!`,
    }
  }

  return {
    text: `Got it! hire.mn has 42+ tests available.
Tell me your goal and I'll recommend the perfect test!`,
  }
}

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

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping, scrollToBottom])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMsg: Message = {
        id: "welcome",
        role: "bot",
        content: lang === "mn"
          ? "Hello! I'm the hire.mn smart assistant. How can I help you today?"
          : "Hello! I'm the hire.mn smart assistant. How can I help you today?",
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

      await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 700))

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
    <div className="fixed bottom-5 right-5 z-[9999] font-sans" role="complementary" aria-label="Chat widget">
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[380px] h-[580px] max-sm:fixed max-sm:inset-0 max-sm:w-full max-sm:h-full max-sm:bottom-0 max-sm:right-0 bg-background rounded-3xl max-sm:rounded-none shadow-[0_25px_50px_-12px_rgba(232,84,26,0.25),0_0_0_1px_rgba(232,84,26,0.05)] flex flex-col overflow-hidden animate-spring-up">
          <div className="relative h-[72px] bg-gradient-to-r from-[#E8541A] to-[#D04010] px-4 flex items-center gap-3 shrink-0">
            <div className="absolute top-2 right-8 w-16 h-16 rounded-full bg-white/10" />
            <div className="absolute top-6 right-2 w-10 h-10 rounded-full bg-white/5" />

            <div className="relative z-10 w-12 h-12 rounded-xl bg-white/90 flex items-center justify-center shadow-sm">
              <BrainMascot size={36} variant="default" />
            </div>

            <div className="flex-1 relative z-10">
              <h2 className="text-white font-bold text-sm">hire.mn Assistant</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-white/70 text-[11px]">
                  {lang === "mn" ? "Online" : "Online"}
                </span>
              </div>
            </div>

            <LanguageToggle lang={lang} onChange={setLang} />

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

          <TickerBar lang={lang} />

          <div className="flex-1 overflow-y-auto chat-messages p-4 space-y-3">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          <QuickReplyChips
            lang={lang}
            onSelect={handleSend}
            visible={showQuickReplies && messages.length <= 1}
          />

          <div className="p-3 border-t border-border bg-card">
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={lang === "mn" ? "Type your message..." : "Type your message..."}
                  rows={1}
                  className="w-full resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 max-h-20"
                  style={{ minHeight: "42px" }}
                />
              </div>
              <button
                onClick={() => handleSend()}
                disabled={!inputValue.trim()}
                className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:scale-90"
                aria-label="Send message"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>

          <div className="py-2 text-center text-[10px] text-muted-foreground bg-card">
            hire.mn AI - Smart Assistant
          </div>
        </div>
      )}

      <button
        onClick={() => {
          setIsOpen(!isOpen)
          setHasUnread(false)
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#E8541A] to-[#D04010] shadow-[0_8px_32px_rgba(232,84,26,0.4)] flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-[0_12px_40px_rgba(232,84,26,0.5)] active:scale-95"
        aria-label={isOpen ? "Close chat" : "Open chat"}
        aria-expanded={isOpen}
      >
        {!isOpen && (
          <>
            <span className="absolute inset-0 rounded-full bg-primary pulse-ring" style={{ animationDelay: "0s" }} />
            <span className="absolute inset-0 rounded-full bg-primary pulse-ring" style={{ animationDelay: "0.5s" }} />
            <span className="absolute inset-0 rounded-full bg-primary pulse-ring" style={{ animationDelay: "1s" }} />
          </>
        )}

        <div className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
          {isOpen ? (
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <BrainMascot size={40} variant="fab" isHovered={isHovered} />
          )}
        </div>

        {hasUnread && !isOpen && (
          <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-red-500 border-2 border-white animate-pulse" />
        )}
      </button>
    </div>
  )
}

export default HireMnChatWidget
