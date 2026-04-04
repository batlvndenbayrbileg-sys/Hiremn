"use client"

import { useState, useRef, useEffect, useCallback } from "react"

interface Message {
  role: "user" | "assistant"
  content: string
  tests?: Test[]
}

interface Test {
  id: number
  name: string
  price: string
  duration: string
  url: string
  emoji: string
  color: string
  free: boolean
  desc: string
}

const QUICK_REPLIES = [
  { text: "Ямар тест байдаг вэ?", icon: "list" },
  { text: "Надад тохирох тест", icon: "target" },
  { text: "Үнэгүй тест", icon: "gift" },
  { text: "Үнэ хэд вэ?", icon: "tag" },
]

function BrainIcon({ size = 24, color = "#E8541A" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={Math.round(size * 0.92)} viewBox="0 0 60 54" fill="none">
      <ellipse cx="30" cy="27" rx="23" ry="19" fill="rgba(232,84,26,0.08)" />
      <path d="M14 21 Q6 16 8 27 Q6 36 14 36" stroke={color} strokeWidth="3.2" fill="none" strokeLinecap="round" />
      <path d="M46 21 Q54 16 52 27 Q54 36 46 36" stroke={color} strokeWidth="3.2" fill="none" strokeLinecap="round" />
      <path d="M18 19 Q24 10 30 19 Q36 10 42 19" stroke={color} strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <line x1="30" y1="13" x2="30" y2="41" stroke={color} strokeWidth="2" strokeDasharray="4 4" opacity="0.4" />
      <path d="M18 35 Q24 44 30 35 Q36 44 42 35" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="22" cy="26" r="2.5" fill={color} opacity="0.7" />
      <circle cx="38" cy="26" r="2.5" fill={color} opacity="0.7" />
    </svg>
  )
}

function QuickIcon({ type }: { type: string }) {
  const props = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const }
  switch (type) {
    case "list": return <svg {...props}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
    case "target": return <svg {...props}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
    case "gift": return <svg {...props}><rect x="3" y="8" width="18" height="13" rx="2" /><path d="M12 8v13M3 12h18M7.5 8a2.5 2.5 0 0 1 0-5C9 3 12 6 12 8M16.5 3a2.5 2.5 0 0 1 0 5C15 8 12 6 12 8" /></svg>
    case "tag": return <svg {...props}><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
    default: return null
  }
}

function BrainAvatar({ size = 32 }: { size?: number }) {
  return (
    <div className="hw-avatar" style={{
      width: size, height: size, borderRadius: size * 0.3,
      background: "linear-gradient(135deg, #FFF5F0 0%, #FEE8DD 100%)",
      border: "1.5px solid #FDDCCC",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, boxShadow: "0 2px 8px rgba(232,84,26,0.12)",
    }}>
      <BrainIcon size={size * 0.56} color="#E8541A" />
    </div>
  )
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
      <BrainAvatar size={32} />
      <div className="hw-glass-bubble" style={{
        borderRadius: 18, borderBottomLeftRadius: 4,
        padding: "14px 18px", display: "flex", gap: 5,
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} className="hw-typing-dot" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  )
}

function TestCard({ test, index = 0 }: { test: Test; index?: number }) {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <a
      href={test.url}
      target="_blank"
      rel="noopener noreferrer"
      className="hw-test-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: "flex", flexDirection: "column",
        background: "#fff",
        borderRadius: 16, overflow: "hidden",
        textDecoration: "none",
        width: 200, minWidth: 200, flexShrink: 0,
        boxShadow: isHovered 
          ? "0 20px 40px rgba(232,84,26,0.18), 0 0 0 2px rgba(232,84,26,0.15)" 
          : "0 4px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
        transform: isHovered ? "translateY(-4px) scale(1.02)" : "translateY(0) scale(1)",
        transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        animationDelay: `${index * 0.06}s`,
      }}
    >
      <div style={{
        height: 80, background: `linear-gradient(135deg, ${test.color} 0%, ${test.color}dd 100%)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", fontSize: 36,
        transition: "transform 0.3s ease",
        transform: isHovered ? "scale(1.05)" : "scale(1)",
      }}>
        <span style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}>{test.emoji}</span>
        {test.free && (
          <span style={{
            position: "absolute", top: 10, right: 10,
            background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)",
            color: "#059669", fontSize: 9, fontWeight: 700, letterSpacing: "0.5px",
            padding: "4px 10px", borderRadius: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}>ҮНЭГҮЙ</span>
        )}
      </div>
      <div style={{ padding: 14, flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{
          fontSize: 13, fontWeight: 700, color: "#111827", letterSpacing: "-0.3px",
          lineHeight: 1.35, marginBottom: 6,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>{test.name}</div>
        <div style={{
          fontSize: 11, color: "#6B7280", lineHeight: 1.5, marginBottom: 10, flex: 1,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>{test.desc}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{
            background: test.free ? "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)" : "linear-gradient(135deg, #FEF3EE 0%, #FEE8DD 100%)",
            color: test.free ? "#059669" : "#E8541A",
            fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 10,
          }}>{test.price}</span>
          <span style={{ fontSize: 10, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 5v3l2 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {test.duration}
          </span>
        </div>
        <div className="hw-cta-btn" style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          background: isHovered ? "linear-gradient(135deg, #D44810 0%, #E8541A 100%)" : "linear-gradient(135deg, #E8541A 0%, #F06030 100%)",
          color: "#fff", fontSize: 12, fontWeight: 600, padding: "10px 14px", borderRadius: 10,
          transition: "all 0.2s ease",
        }}>
          Тест авах
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M3 8h10M9 4l4 4-4 4" />
          </svg>
        </div>
      </div>
    </a>
  )
}

function TestCarousel({ tests }: { tests: Test[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [canScroll, setCanScroll] = useState({ left: false, right: false })

  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setCanScroll({ left: scrollLeft > 5, right: scrollLeft < scrollWidth - clientWidth - 5 })
    const newIndex = Math.round(scrollLeft / 210)
    setActiveIndex(Math.min(newIndex, tests.length - 1))
  }, [tests.length])

  useEffect(() => { checkScroll() }, [tests, checkScroll])

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -210 : 210, behavior: "smooth" })
    setTimeout(checkScroll, 350)
  }

  return (
    <div style={{ position: "relative" }}>
      {canScroll.left && (
        <button onClick={() => scroll("left")} className="hw-carousel-btn" style={{ left: -8 }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M10 4l-4 4 4 4" />
          </svg>
        </button>
      )}
      {canScroll.right && (
        <button onClick={() => scroll("right")} className="hw-carousel-btn" style={{ right: -8 }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 4l4 4-4 4" />
          </svg>
        </button>
      )}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="hw-carousel-scroll"
        style={{
          display: "flex", gap: 12,
          overflowX: "auto", overflowY: "hidden",
          scrollSnapType: "x mandatory",
          padding: "4px 2px 8px",
        }}
      >
        {tests.map((test, i) => (
          <div key={test.id} style={{ scrollSnapAlign: "start" }}>
            <TestCard test={test} index={i} />
          </div>
        ))}
      </div>
      {tests.length > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10 }}>
          {tests.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollRef.current?.scrollTo({ left: i * 210, behavior: "smooth" })}
              style={{
                width: i === activeIndex ? 20 : 6, height: 6, borderRadius: 3, border: "none", cursor: "pointer",
                background: i === activeIndex ? "linear-gradient(90deg, #E8541A, #F06030)" : "#E8D5CF",
                transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function BotMessage({ message }: { message: Message }) {
  return (
    <div className="hw-msg-enter" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {message.content && (
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <BrainAvatar size={32} />
          <div className="hw-glass-bubble" style={{
            maxWidth: "85%", borderRadius: 18, borderBottomLeftRadius: 4,
            padding: "12px 16px", fontSize: 13.5, lineHeight: 1.7, color: "#1F2937",
            whiteSpace: "pre-wrap", wordBreak: "break-word",
          }}>
            {message.content}
          </div>
        </div>
      )}
      {message.tests && message.tests.length > 0 && (
        <div style={{ marginLeft: 42, marginTop: 4 }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: "#9CA3AF",
            marginBottom: 12, letterSpacing: "1px", textTransform: "uppercase",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            Санал болгох тестүүд
          </div>
          <TestCarousel tests={message.tests} />
        </div>
      )}
    </div>
  )
}

function UserMessage({ content }: { content: string }) {
  return (
    <div className="hw-msg-enter" style={{ display: "flex", justifyContent: "flex-end" }}>
      <div style={{
        maxWidth: "85%",
        background: "linear-gradient(135deg, #E8541A 0%, #D44810 100%)",
        color: "#fff",
        borderRadius: 18, borderBottomRightRadius: 4,
        padding: "12px 16px",
        fontSize: 13.5, lineHeight: 1.6, wordBreak: "break-word",
        boxShadow: "0 4px 16px rgba(232,84,26,0.25)",
      }}>
        {content}
      </div>
    </div>
  )
}

export function HireMnChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Сайн байна у|!\n\nБи hire.mn-ий AI туслагч. Та надаас тест сонгох, мэргэжлийн чиглэл тодорхойлох талаар асуугаарай." },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showQuickReplies, setShowQuickReplies] = useState(true)
  const [lang, setLang] = useState<"МН" | "EN">("МН")
  const [isMobile, setIsMobile] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 480)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  useEffect(() => {
    if (isOpen && inputRef.current && !isMobile) {
      inputRef.current.focus()
    }
  }, [isOpen, isMobile])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return
    setShowQuickReplies(false)
    const userMsg: Message = { role: "user", content: text }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    if (inputRef.current) inputRef.current.style.height = "auto"
    setIsTyping(true)
    
    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, lang: lang === "МН" ? "mn" : "en" }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.reply || "",
        tests: data.tests || [],
      }])
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      let friendly = "Уучлаарай, холболтын алдаа гарлаа."
      if (msg.includes("credit") || msg.includes("Gateway")) friendly = "AI үйлчилгээ одоогоор идэвхгүй."
      else if (msg.includes("rate")) friendly = "Хэт олон хүсэлт. Түр хүлээнэ үү."
      setMessages(prev => [...prev, { role: "assistant", content: friendly }])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        .hw-root { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
        .hw-root * { box-sizing: border-box; }

        /* Glass effect */
        .hw-glass-bubble {
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.6);
          box-shadow: 0 4px 16px rgba(0,0,0,0.06);
        }
        
        /* Typing dots */
        .hw-typing-dot {
          width: 7px; height: 7px;
          background: linear-gradient(135deg, #E8541A, #F06030);
          border-radius: 50%;
          animation: hw-typing 1.4s ease-in-out infinite;
        }
        @keyframes hw-typing {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }

        /* Message entrance */
        .hw-msg-enter {
          animation: hw-msg-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes hw-msg-in {
          from { opacity: 0; transform: translateY(16px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Chat panel entrance */
        @keyframes hw-panel-in {
          from { opacity: 0; transform: scale(0.92) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* Mascot button */
        .hw-mascot-btn {
          position: relative;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .hw-mascot-btn::before {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          background: linear-gradient(135deg, #E8541A, #F06030);
          opacity: 0;
          transition: opacity 0.3s ease;
          animation: hw-pulse-ring 2.5s ease-in-out infinite;
        }
        .hw-mascot-btn:hover::before { opacity: 0; animation: none; }
        .hw-mascot-btn:hover { transform: scale(1.08); }
        @keyframes hw-pulse-ring {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.15); opacity: 0; }
        }

        /* Carousel scrollbar hidden */
        .hw-carousel-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        .hw-carousel-scroll::-webkit-scrollbar { display: none; }

        /* Carousel nav buttons */
        .hw-carousel-btn {
          position: absolute; top: 50%; transform: translateY(-50%);
          width: 32px; height: 32px; border-radius: 50%;
          background: rgba(255,255,255,0.95); backdrop-filter: blur(8px);
          border: 1px solid rgba(0,0,0,0.06);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          cursor: pointer; z-index: 10;
          display: flex; align-items: center; justify-content: center;
          color: #E8541A;
          transition: all 0.2s ease;
        }
        .hw-carousel-btn:hover {
          background: #E8541A; color: #fff;
          box-shadow: 0 6px 20px rgba(232,84,26,0.3);
        }

        /* Quick reply chips */
        .hw-chip {
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .hw-chip:hover {
          background: linear-gradient(135deg, #E8541A, #F06030) !important;
          color: #fff !important;
          border-color: transparent !important;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(232,84,26,0.25);
        }

        /* Input focus */
        .hw-input:focus {
          border-color: #E8541A !important;
          box-shadow: 0 0 0 3px rgba(232,84,26,0.1);
        }

        /* Send button */
        .hw-send-btn {
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .hw-send-btn:not(:disabled):hover {
          transform: scale(1.05);
          box-shadow: 0 6px 20px rgba(232,84,26,0.35);
        }
        .hw-send-btn:not(:disabled):active { transform: scale(0.95); }

        /* Scrollbar */
        .hw-messages::-webkit-scrollbar { width: 4px; }
        .hw-messages::-webkit-scrollbar-track { background: transparent; }
        .hw-messages::-webkit-scrollbar-thumb { background: rgba(232,84,26,0.2); border-radius: 4px; }

        /* Mobile fullscreen */
        @media (max-width: 479px) {
          .hw-panel-mobile {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            max-height: 100% !important;
            border-radius: 0 !important;
          }
        }

        /* Avatar float */
        .hw-avatar { animation: hw-avatar-float 3s ease-in-out infinite; }
        @keyframes hw-avatar-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }

        /* Test card entrance */
        .hw-test-card { animation: hw-card-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        @keyframes hw-card-in {
          from { opacity: 0; transform: translateY(20px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Tooltip */
        @keyframes hw-tooltip-in {
          from { opacity: 0; transform: translateX(8px); }
          to { opacity: 1; transform: translateX(0); }
        }

        /* Header controls */
        .hw-header-btn {
          width: 34px; height: 34px; border-radius: 10px;
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s ease;
          background: transparent; color: #9CA3AF;
        }
        .hw-header-btn:hover { background: #F5F5F5; color: #333; }
        .hw-header-btn.active { background: #FEF3EE; color: #E8541A; }
        .hw-close-btn:hover { background: #FEF2F2; color: #EF4444; }
      `}</style>

      <div className="hw-root" style={{
        position: "fixed",
        bottom: isMobile ? 16 : 24,
        right: isMobile ? 16 : 24,
        zIndex: 99999,
        display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 14,
      }}>

        {/* Chat Panel */}
        {isOpen && (
          <div
            className={isMobile ? "hw-panel-mobile" : ""}
            style={{
              width: isMobile ? "100%" : 380,
              height: isMobile ? "100%" : "min(600px, calc(100vh - 120px))",
              borderRadius: isMobile ? 0 : 24,
              background: "linear-gradient(180deg, #FAFBFC 0%, #F5F6F8 100%)",
              boxShadow: isMobile ? "none" : "0 25px 80px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)",
              display: "flex", flexDirection: "column", overflow: "hidden",
              animation: "hw-panel-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
              transformOrigin: "bottom right",
            }}
          >

            {/* Header */}
            <div style={{
              background: "rgba(255,255,255,0.9)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              padding: "0 16px",
              height: isMobile ? 72 : 68,
              display: "flex", alignItems: "center", gap: 12,
              flexShrink: 0, position: "relative",
              borderBottom: "1px solid rgba(0,0,0,0.05)",
            }}>
              {/* Gradient accent */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 3,
                background: "linear-gradient(90deg, #E8541A 0%, #F5A07A 50%, #E8541A 100%)",
                backgroundSize: "200% 100%",
                animation: "hw-gradient-shift 3s ease infinite",
              }} />
              <style>{`@keyframes hw-gradient-shift { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }`}</style>

              <BrainAvatar size={42} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#111", fontWeight: 700, fontSize: 15, letterSpacing: "-0.3px" }}>
                    hire.mn
                  </span>
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: "0.8px",
                    background: "linear-gradient(135deg, #E8541A, #F06030)",
                    color: "#fff", padding: "3px 8px", borderRadius: 20,
                  }}>AI</span>
                </div>
                <div style={{ color: "#6B7280", fontSize: 11.5, marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: "linear-gradient(135deg, #22C55E, #16A34A)",
                    boxShadow: "0 0 8px rgba(34,197,94,0.5)",
                  }} />
                  Онлайн
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button
                  onClick={() => setLang(l => l === "МН" ? "EN" : "МН")}
                  className="hw-header-btn"
                  style={{ fontSize: 11, fontWeight: 600, width: "auto", padding: "0 10px" }}
                >
                  {lang}
                </button>
                <button onClick={() => setIsOpen(false)} className="hw-header-btn hw-close-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="hw-messages" style={{
              flex: 1, overflowY: "auto", padding: "16px 14px 10px",
              display: "flex", flexDirection: "column", gap: 14,
            }}>
              {messages.map((msg, i) => (
                <div key={i}>
                  {msg.role === "assistant" ? <BotMessage message={msg} /> : <UserMessage content={msg.content} />}
                </div>
              ))}

              {isTyping && <TypingIndicator />}

              {showQuickReplies && !isTyping && (
                <div style={{
                  display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8,
                  animation: "hw-msg-in 0.4s ease-out 0.2s both",
                }}>
                  {QUICK_REPLIES.map(qr => (
                    <button
                      key={qr.text}
                      className="hw-chip"
                      onClick={() => sendMessage(qr.text)}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)",
                        border: "1.5px solid #F0C4AD", color: "#E8541A",
                        borderRadius: 20, padding: "8px 14px",
                        fontSize: 12, fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      <QuickIcon type={qr.icon} />
                      {qr.text}
                    </button>
                  ))}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{
              padding: isMobile ? "12px 14px 20px" : "12px 14px 16px",
              background: "rgba(255,255,255,0.9)",
              backdropFilter: "blur(20px)",
              borderTop: "1px solid rgba(0,0,0,0.05)",
            }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => {
                    setInput(e.target.value)
                    e.target.style.height = "auto"
                    e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px"
                  }}
                  onKeyDown={handleKey}
                  placeholder="Асуулт бичнэ үү..."
                  rows={1}
                  className="hw-input"
                  style={{
                    flex: 1, border: "2px solid #EDE4DF", borderRadius: 14,
                    padding: "12px 14px", fontSize: 14, outline: "none",
                    resize: "none", maxHeight: 100, lineHeight: 1.5,
                    color: "#1A1A1A", background: "#fff",
                    transition: "all 0.2s ease",
                  }}
                />
                <button
                  className="hw-send-btn"
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isTyping}
                  style={{
                    width: 46, height: 46, borderRadius: 14, border: "none",
                    background: input.trim() && !isTyping 
                      ? "linear-gradient(135deg, #E8541A 0%, #F06030 100%)" 
                      : "#E8D5CF",
                    cursor: input.trim() && !isTyping ? "pointer" : "not-allowed",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <polygon points="22,2 15,22 11,13 2,9" fill="white" />
                  </svg>
                </button>
              </div>
              <div style={{ textAlign: "center", marginTop: 10, fontSize: 10, color: "#C0B0A8", letterSpacing: "0.5px" }}>
                Powered by <span style={{ fontWeight: 600, color: "#E8541A" }}>hire.mn</span>
              </div>
            </div>
          </div>
        )}

        {/* Mascot Button */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {isHovered && !isOpen && (
            <div style={{
              animation: "hw-tooltip-in 0.25s ease-out",
              background: "linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)",
              borderRadius: 16, padding: "12px 16px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
              maxWidth: 200, position: "relative",
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 4 }}>
                hire.mn Туслагч
              </div>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
                Тест сонгох, мэргэжлийн зөвлөгөө авах
              </div>
              <div style={{
                position: "absolute", right: -6, top: "50%", transform: "translateY(-50%)",
                width: 0, height: 0,
                borderTop: "7px solid transparent",
                borderBottom: "7px solid transparent",
                borderLeft: "7px solid #1A1A1A",
              }} />
            </div>
          )}

          <button
            className="hw-mascot-btn"
            onClick={() => setIsOpen(o => !o)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            aria-label="hire.mn чат нээх"
            style={{
              width: isMobile ? 56 : 60,
              height: isMobile ? 56 : 60,
              borderRadius: "50%",
              background: "linear-gradient(145deg, #F06030 0%, #E8541A 50%, #D44810 100%)",
              border: "3px solid rgba(255,255,255,0.95)",
              boxShadow: "0 8px 32px rgba(232,84,26,0.4), 0 0 0 0 rgba(232,84,26,0.3)",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative", zIndex: 1,
            }}
          >
            {isOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <BrainIcon size={isMobile ? 28 : 32} color="white" />
            )}
            {!isOpen && (
              <span style={{
                position: "absolute", bottom: 2, right: 2,
                width: 14, height: 14, borderRadius: "50%",
                background: "linear-gradient(135deg, #22C55E, #16A34A)",
                border: "2.5px solid #fff",
                boxShadow: "0 2px 8px rgba(34,197,94,0.4)",
              }} />
            )}
          </button>
        </div>
      </div>
    </>
  )
}
