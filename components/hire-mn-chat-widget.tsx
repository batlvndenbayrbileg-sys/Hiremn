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
  metrics: { label: string; score: number; max: number; color: string }[]
  overall: number
}

// Enhanced Brain Mascot with expressive animations
function BrainMascot({
  size = 48,
  isThinking = false,
  isHovered = false,
  mood = "happy",
  variant = "default",
}: {
  size?: number
  isThinking?: boolean
  isHovered?: boolean
  mood?: "happy" | "thinking" | "excited" | "wink"
  variant?: "default" | "mini" | "fab"
}) {
  const pulseSpeed = isThinking ? "0.3s" : "1.5s"
  const bgColor = variant === "fab" ? "#FFFFFF" : "#FFF8F5"
  
  // Eye expressions based on mood
  const getEyeExpression = () => {
    switch (mood) {
      case "thinking":
        return { leftY: 28, rightY: 32, pupilOffset: -1 }
      case "excited":
        return { leftY: 30, rightY: 30, pupilOffset: 0, scale: 1.2 }
      case "wink":
        return { leftY: 30, rightY: 30, rightWink: true }
      default:
        return { leftY: 30, rightY: 30, pupilOffset: 0 }
    }
  }
  
  const eyes = getEyeExpression()

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-transform duration-300 ${variant === "fab" ? "brain-float" : ""} ${isHovered ? "brain-wiggle" : ""}`}
      style={{ filter: isHovered ? "drop-shadow(0 0 8px rgba(232, 84, 26, 0.4))" : undefined }}
      aria-label="hire.mn brain mascot"
    >
      {/* Glow effect when thinking */}
      {isThinking && (
        <ellipse cx="32" cy="32" rx="28" ry="26" fill="url(#thinkingGlow)" opacity="0.3">
          <animate attributeName="opacity" values="0.2;0.4;0.2" dur="0.8s" repeatCount="indefinite" />
        </ellipse>
      )}
      
      {/* Brain hemispheres with subtle gradient */}
      <ellipse cx="24" cy="32" rx="18" ry="22" fill="url(#brainGradientLeft)" stroke="#E8541A" strokeWidth="2.5" />
      <ellipse cx="40" cy="32" rx="18" ry="22" fill="url(#brainGradientRight)" stroke="#E8541A" strokeWidth="2.5" />
      
      {/* Brain folds - more organic curves */}
      <path d="M32 10 Q32 32, 32 54" stroke="#E8541A" strokeWidth="1.5" strokeDasharray="3 4" opacity="0.5" />
      <path d="M12 24 Q18 22, 26 26 Q30 28, 28 32" stroke="#E8541A" strokeWidth="1.5" fill="none" opacity="0.4" />
      <path d="M10 38 Q16 35, 24 38 Q28 40, 26 44" stroke="#E8541A" strokeWidth="1.5" fill="none" opacity="0.4" />
      <path d="M38 26 Q44 22, 52 24" stroke="#E8541A" strokeWidth="1.5" fill="none" opacity="0.4" />
      <path d="M36 38 Q46 35, 54 38" stroke="#E8541A" strokeWidth="1.5" fill="none" opacity="0.4" />
      
      {/* Eyes container with shadow */}
      <ellipse cx="22" cy={eyes.leftY} rx="5" ry="5.5" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="0.5" opacity="0.9" />
      {eyes.rightWink ? (
        <path d="M38 30 Q42 28, 46 30" stroke="#1A1A1A" strokeWidth="2" fill="none" strokeLinecap="round" />
      ) : (
        <ellipse cx="42" cy={eyes.rightY} rx="5" ry="5.5" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="0.5" opacity="0.9" />
      )}
      
      {/* Pupils with highlight */}
      <ellipse cx={22 + (eyes.pupilOffset || 0)} cy={eyes.leftY} rx="2.5" ry="3" fill="#1A1A1A">
        {isThinking && <animate attributeName="cx" values="20;24;20" dur="1.5s" repeatCount="indefinite" />}
      </ellipse>
      {!eyes.rightWink && (
        <ellipse cx={42 + (eyes.pupilOffset || 0)} cy={eyes.rightY} rx="2.5" ry="3" fill="#1A1A1A">
          {isThinking && <animate attributeName="cx" values="40;44;40" dur="1.5s" repeatCount="indefinite" />}
        </ellipse>
      )}
      
      {/* Eye highlights */}
      <circle cx={23 + (eyes.pupilOffset || 0)} cy={eyes.leftY - 1} r="1" fill="#FFFFFF" />
      {!eyes.rightWink && <circle cx={43 + (eyes.pupilOffset || 0)} cy={eyes.rightY - 1} r="1" fill="#FFFFFF" />}
      
      {/* Cheek blush */}
      <ellipse cx="14" cy="38" rx="4" ry="2.5" fill="#FFB5A0" opacity="0.5" />
      <ellipse cx="50" cy="38" rx="4" ry="2.5" fill="#FFB5A0" opacity="0.5" />
      
      {/* Smile - changes with mood */}
      {mood === "excited" ? (
        <path d="M26 42 Q32 48, 38 42" stroke="#1A1A1A" strokeWidth="2" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M28 40 Q32 44, 36 40" stroke="#1A1A1A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      )}
      
      {/* Synapse nodes with staggered animation */}
      <g>
        {[
          { cx: 16, cy: 18, delay: "0s" },
          { cx: 32, cy: 12, delay: "0.15s" },
          { cx: 48, cy: 18, delay: "0.3s" },
          { cx: 10, cy: 32, delay: "0.45s" },
          { cx: 54, cy: 32, delay: "0.6s" },
          { cx: 16, cy: 48, delay: "0.75s" },
          { cx: 48, cy: 48, delay: "0.9s" },
        ].map((node, i) => (
          <circle key={i} cx={node.cx} cy={node.cy} r="2.5" fill="#E8541A">
            <animate attributeName="opacity" values="0.3;1;0.3" dur={pulseSpeed} repeatCount="indefinite" begin={node.delay} />
            <animate attributeName="r" values="2;3.5;2" dur={pulseSpeed} repeatCount="indefinite" begin={node.delay} />
          </circle>
        ))}
      </g>
      
      {/* Neural connection lines */}
      <g opacity="0.3">
        <line x1="16" y1="18" x2="32" y2="12" stroke="#E8541A" strokeWidth="1">
          <animate attributeName="opacity" values="0.2;0.6;0.2" dur={pulseSpeed} repeatCount="indefinite" />
        </line>
        <line x1="32" y1="12" x2="48" y2="18" stroke="#E8541A" strokeWidth="1">
          <animate attributeName="opacity" values="0.2;0.6;0.2" dur={pulseSpeed} repeatCount="indefinite" begin="0.1s" />
        </line>
      </g>
      
      {/* Gradients */}
      <defs>
        <linearGradient id="brainGradientLeft" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={bgColor} />
          <stop offset="100%" stopColor="#FFE8E0" />
        </linearGradient>
        <linearGradient id="brainGradientRight" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={bgColor} />
          <stop offset="100%" stopColor="#FFE8E0" />
        </linearGradient>
        <radialGradient id="thinkingGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E8541A" />
          <stop offset="100%" stopColor="#E8541A" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  )
}

// Mini brain avatar for messages
function MiniBrain({ isAnimated = false }: { isAnimated?: boolean }) {
  return (
    <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-lg ${isAnimated ? "animate-bounce-subtle" : ""}`}>
      <BrainMascot size={22} variant="mini" mood="happy" />
    </div>
  )
}

// Enhanced typing indicator with personality
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2.5 animate-fade-in">
      <MiniBrain isAnimated />
      <div className="bg-white/80 backdrop-blur-sm border border-primary/20 rounded-2xl rounded-bl-md px-4 py-3 shadow-lg">
        <div className="flex gap-1.5 items-center">
          <span className="text-xs text-muted-foreground mr-1">Thinking</span>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-gradient-to-br from-primary to-accent typing-dot"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Confetti particle effect
function Confetti({ trigger }: { trigger: boolean }) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; color: string; delay: number }>>([])
  
  useEffect(() => {
    if (trigger) {
      const newParticles = Array.from({ length: 12 }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 100,
        color: ["#E8541A", "#FFB5A0", "#D04010", "#FF8C5A"][Math.floor(Math.random() * 4)],
        delay: Math.random() * 0.3,
      }))
      setParticles(newParticles)
      setTimeout(() => setParticles([]), 1000)
    }
  }, [trigger])
  
  if (particles.length === 0) return null
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-2 h-2 rounded-full confetti-particle"
          style={{
            left: `${p.x}%`,
            bottom: 0,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

// Enhanced test result card with animated metrics
function TestResultCard({ data }: { data: TestResultData }) {
  const [animated, setAnimated] = useState(false)
  const [showCheckmark, setShowCheckmark] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100)
    const checkTimer = setTimeout(() => setShowCheckmark(true), 1200)
    return () => {
      clearTimeout(timer)
      clearTimeout(checkTimer)
    }
  }, [])

  return (
    <div className="bg-gradient-to-br from-white to-secondary/50 border-2 border-primary/20 rounded-2xl p-5 space-y-4 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-foreground font-bold text-sm">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          {data.title}
        </div>
        {showCheckmark && (
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center animate-scale-in">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
      
      <div className="space-y-3">
        {data.metrics.map((metric, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-foreground/70 font-medium">{metric.label}</span>
              <span className="font-bold text-foreground tabular-nums">{metric.score}/{metric.max}</span>
            </div>
            <div className="h-2.5 bg-primary/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                style={{
                  width: animated ? `${(metric.score / metric.max) * 100}%` : "0%",
                  transitionDelay: `${i * 200}ms`,
                  background: `linear-gradient(90deg, ${metric.color}, ${metric.color}dd)`,
                }}
              >
                <div className="absolute inset-0 shimmer-effect" />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="pt-3 border-t border-primary/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-foreground">Overall Score</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-primary tabular-nums">{data.overall}</span>
            <span className="text-sm text-primary/70">%</span>
          </div>
        </div>
        <div className="h-4 bg-primary/10 rounded-full overflow-hidden relative">
          <div
            className="h-full rounded-full transition-all duration-1200 ease-out relative overflow-hidden"
            style={{
              width: animated ? `${data.overall}%` : "0%",
              transitionDelay: "600ms",
              background: "linear-gradient(90deg, #E8541A, #FF8C5A, #E8541A)",
              backgroundSize: "200% 100%",
            }}
          >
            <div className="absolute inset-0 shimmer-effect" />
          </div>
          {/* Milestone markers */}
          <div className="absolute inset-0 flex justify-between px-px">
            {[25, 50, 75].map((mark) => (
              <div key={mark} className="w-px h-full bg-foreground/10" style={{ marginLeft: `${mark}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Enhanced message bubble with hover effects
function MessageBubble({ message, isLatest }: { message: Message; isLatest: boolean }) {
  const isUser = message.role === "user"
  const [isHovered, setIsHovered] = useState(false)

  if (message.isRichCard && message.richData) {
    return (
      <div className="flex items-end gap-2.5 animate-slide-up">
        <MiniBrain />
        <div className="max-w-[88%]">
          <TestResultCard data={message.richData} />
          <div className="text-[10px] text-foreground/40 mt-1.5 ml-1 font-medium">
            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`flex items-end gap-2.5 ${isLatest ? "animate-slide-up" : ""} ${isUser ? "flex-row-reverse" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {!isUser && <MiniBrain />}
      <div className="relative group">
        <div
          className={`max-w-[280px] px-4 py-3 transition-all duration-200 ${
            isUser
              ? "bg-gradient-to-br from-primary to-accent text-white rounded-2xl rounded-br-md shadow-lg shadow-primary/20"
              : "bg-white/90 backdrop-blur-sm text-foreground border border-primary/10 rounded-2xl rounded-bl-md shadow-md"
          } ${isHovered ? "scale-[1.02]" : ""}`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        <div className={`text-[10px] text-foreground/40 mt-1 font-medium ${isUser ? "text-right mr-1" : "ml-1"}`}>
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  )
}

// Quick reply chips with ripple effect
function QuickReplyChips({
  onSelect,
  visible,
}: {
  onSelect: (text: string) => void
  visible: boolean
}) {
  const chips = ["What tests?", "Find my test", "My results", "Pricing"]

  if (!visible) return null

  return (
    <div className="flex flex-wrap gap-2 px-4 pb-4 animate-fade-in">
      {chips.map((chip, i) => (
        <button
          key={i}
          onClick={() => onSelect(chip)}
          className="px-4 py-2 text-xs font-semibold bg-white border-2 border-primary/30 text-primary rounded-full transition-all duration-300 hover:border-primary hover:bg-primary hover:text-white hover:shadow-lg hover:shadow-primary/20 active:scale-95"
        >
          {chip}
        </button>
      ))}
    </div>
  )
}

// Language toggle with smooth animation
function LanguageToggle({ lang, onChange }: { lang: Language; onChange: (lang: Language) => void }) {
  return (
    <div className="relative flex items-center bg-white/20 backdrop-blur-sm rounded-full p-1">
      <div
        className="absolute h-[calc(100%-8px)] w-[calc(50%-4px)] bg-white rounded-full shadow-sm transition-transform duration-300 ease-out"
        style={{ transform: lang === "mn" ? "translateX(4px)" : "translateX(calc(100% + 4px))" }}
      />
      <button
        onClick={() => onChange("mn")}
        className={`relative z-10 px-3 py-1 text-[11px] font-bold rounded-full transition-colors duration-200 ${
          lang === "mn" ? "text-primary" : "text-white/80 hover:text-white"
        }`}
      >
        MN
      </button>
      <button
        onClick={() => onChange("en")}
        className={`relative z-10 px-3 py-1 text-[11px] font-bold rounded-full transition-colors duration-200 ${
          lang === "en" ? "text-primary" : "text-white/80 hover:text-white"
        }`}
      >
        EN
      </button>
    </div>
  )
}

// Enhanced ticker bar
function TickerBar() {
  const items = [
    { text: "42+ tests" },
    { text: "3,512+ users" },
    { text: "New: SEMUT" },
    { text: "Free tests" },
  ]

  return (
    <div className="h-8 bg-gradient-to-r from-secondary via-muted to-secondary overflow-hidden flex items-center border-y border-primary/5">
      <div className="ticker-scroll flex whitespace-nowrap">
        {[0, 1, 2, 3].map((repeat) => (
          <div key={repeat} className="flex items-center">
            {items.map((item, i) => (
              <span key={i} className="flex items-center gap-1.5 mx-4 text-[11px] font-semibold text-accent">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                {item.text}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// Smart response engine
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

Which test interests you?`,
    }
  }

  if (lower.includes("find") || lower.includes("recommend") || lower.includes("ideal")) {
    return {
      text: `Let me find the perfect test for you!

Tell me about yourself:

- What is your current role?
- What is your goal?
  - Self-discovery
  - Job searching
  - Career growth`,
    }
  }

  if (lower.includes("result") || lower.includes("explain") || lower.includes("score")) {
    return {
      text: "",
      isRichCard: true,
      richData: {
        title: "Your Assessment Results",
        metrics: [
          { label: "Growth Mindset", score: 82, max: 100, color: "#E8541A" },
          { label: "Resilience", score: 74, max: 100, color: "#FF8C5A" },
          { label: "Adaptability", score: 91, max: 100, color: "#D04010" },
        ],
        overall: 82,
      },
    }
  }

  if (lower.includes("pric") || lower.includes("cost") || lower.includes("plan")) {
    return {
      text: `hire.mn pricing:

Free Tests
- AUDIT, SEMUT, nicotine test

Paid Tests
- Mindset test - 10,000 MNT
- Work-life test - 20,000 MNT  
- Communication test - 30,000 MNT

Members get up to 30% off!`,
    }
  }

  return {
    text: `Got it! hire.mn has 42+ professional tests.

What would you like to explore?
- Find your ideal test
- View your results
- See pricing options`,
  }
}

// Main widget component
export function HireMnChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [lang, setLang] = useState<Language>("mn")
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showQuickReplies, setShowQuickReplies] = useState(true)
  const [hasUnread, setHasUnread] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const [brainMood, setBrainMood] = useState<"happy" | "thinking" | "excited" | "wink">("happy")
  const [confettiTrigger, setConfettiTrigger] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping, scrollToBottom])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setBrainMood("excited")
      const welcomeMsg: Message = {
        id: "welcome",
        role: "bot",
        content: lang === "mn"
          ? "Hello! I am the hire.mn smart assistant.\n\nHow can I help you find your perfect test today?"
          : "Hello! I am the hire.mn smart assistant.\n\nHow can I help you find your perfect test today?",
        timestamp: new Date(),
      }
      setTimeout(() => {
        setMessages([welcomeMsg])
        setHasUnread(false)
        setBrainMood("happy")
      }, 300)
    }
  }, [isOpen, messages.length, lang])

  const handleSend = useCallback(
    async (text?: string) => {
      const messageText = text || inputValue.trim()
      if (!messageText) return

      setConfettiTrigger(true)
      setTimeout(() => setConfettiTrigger(false), 100)

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
      setBrainMood("thinking")

      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 500))

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
      setBrainMood("happy")
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
      {/* Chat Panel */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[400px] h-[600px] max-sm:fixed max-sm:inset-0 max-sm:w-full max-sm:h-full max-sm:bottom-0 max-sm:right-0 bg-gradient-to-b from-background to-secondary/30 rounded-3xl max-sm:rounded-none shadow-2xl shadow-primary/20 flex flex-col overflow-hidden animate-spring-up border border-primary/10">
          {/* Header */}
          <div className="relative h-20 bg-gradient-to-r from-[#E8541A] via-[#D04010] to-[#E8541A] px-5 flex items-center gap-4 shrink-0 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10 blur-sm" />
            <div className="absolute top-8 right-12 w-12 h-12 rounded-full bg-white/5" />
            <div className="absolute -bottom-2 left-1/3 w-16 h-16 rounded-full bg-black/5" />

            <div className="relative z-10 w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-lg">
              <BrainMascot size={42} variant="default" mood={brainMood} isThinking={isTyping} />
            </div>

            <div className="flex-1 relative z-10">
              <h2 className="text-white font-bold text-base">hire.mn Assistant</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400" />
                </span>
                <span className="text-white/80 text-xs font-medium">
                  {isTyping ? "Typing..." : "Online now"}
                </span>
              </div>
            </div>

            <LanguageToggle lang={lang} onChange={setLang} />

            <button
              onClick={() => setIsOpen(false)}
              className="sm:hidden w-9 h-9 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              aria-label="Close chat"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <TickerBar />

          {/* Messages */}
          <div className="flex-1 overflow-y-auto chat-messages p-4 space-y-4">
            <Confetti trigger={confettiTrigger} />
            {messages.map((msg, i) => (
              <MessageBubble key={msg.id} message={msg} isLatest={i === messages.length - 1} />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          <QuickReplyChips
            onSelect={handleSend}
            visible={showQuickReplies && messages.length <= 1}
          />

          {/* Input area */}
          <div className="p-4 border-t border-primary/10 bg-white/50 backdrop-blur-sm">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  rows={1}
                  className="w-full resize-none rounded-2xl border-2 border-primary/20 bg-white px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 max-h-24"
                  style={{ minHeight: "48px" }}
                />
              </div>
              <button
                onClick={() => handleSend()}
                disabled={!inputValue.trim()}
                className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center shrink-0 shadow-lg shadow-primary/30 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-primary/40 active:scale-95"
                aria-label="Send message"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="py-2.5 text-center text-[10px] text-muted-foreground bg-white/30 font-medium">
            Powered by <span className="text-primary font-bold">hire.mn</span> AI
          </div>
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          setHasUnread(false)
          setBrainMood(isOpen ? "happy" : "excited")
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#E8541A] to-[#D04010] shadow-xl shadow-primary/40 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-primary/50 active:scale-95"
        aria-label={isOpen ? "Close chat" : "Open chat"}
        aria-expanded={isOpen}
      >
        {/* Pulse rings */}
        {!isOpen && (
          <>
            <span className="absolute inset-0 rounded-full bg-primary pulse-ring" style={{ animationDelay: "0s" }} />
            <span className="absolute inset-0 rounded-full bg-primary pulse-ring" style={{ animationDelay: "0.6s" }} />
            <span className="absolute inset-0 rounded-full bg-primary pulse-ring" style={{ animationDelay: "1.2s" }} />
          </>
        )}

        <div className={`transition-all duration-300 ${isOpen ? "rotate-90 scale-90" : ""}`}>
          {isOpen ? (
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <BrainMascot size={42} variant="fab" isHovered={isHovered} mood={brainMood} />
          )}
        </div>

        {/* Notification badge */}
        {hasUnread && !isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white animate-bounce">
            1
          </span>
        )}
      </button>
    </div>
  )
}

export default HireMnChatWidget
