"use client"

import { useState, useRef, useEffect } from "react"

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
  "Ямар тест байдаг вэ?",
  "Надад тохирох тест хэл",
  "Үнэгүй тест байна уу?",
  "Үнэ хэд вэ?",
]

function BrainIcon({ size = 24, color = "white" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={Math.round(size * 0.92)} viewBox="0 0 60 54" fill="none">
      <ellipse cx="30" cy="27" rx="23" ry="19" fill={color === "white" ? "white" : "none"} opacity={0.92} />
      <path d="M14 21 Q6 16 8 27 Q6 36 14 36" stroke={color === "white" ? "rgba(232,84,26,.9)" : color} strokeWidth="3.2" fill="none" strokeLinecap="round" />
      <path d="M46 21 Q54 16 52 27 Q54 36 46 36" stroke={color === "white" ? "rgba(232,84,26,.9)" : color} strokeWidth="3.2" fill="none" strokeLinecap="round" />
      <path d="M18 19 Q24 10 30 19 Q36 10 42 19" stroke={color === "white" ? "rgba(232,84,26,.78)" : color} strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <line x1="30" y1="13" x2="30" y2="41" stroke={color === "white" ? "rgba(232,84,26,.35)" : color} strokeWidth="2" strokeDasharray="4 4" />
      <path d="M18 35 Q24 44 30 35 Q36 44 42 35" stroke={color === "white" ? "rgba(232,84,26,.65)" : color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="22" cy="26" r="2.5" fill={color === "white" ? "#E8541A" : color} opacity={0.7} />
      <circle cx="38" cy="26" r="2.5" fill={color === "white" ? "#E8541A" : color} opacity={0.7} />
    </svg>
  )
}

function BrainAvatar() {
  return (
    <div style={{
      width: 30, height: 30,
      borderRadius: 9,
      background: "#FEF3EE",
      border: "1px solid #FDDCCC",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      <BrainIcon size={18} color="#E8541A" />
    </div>
  )
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
      <BrainAvatar />
      <div style={{
        background: "#fff",
        border: "1px solid #F0EAE6",
        borderRadius: 14,
        borderBottomLeftRadius: 3,
        padding: "11px 15px",
        display: "flex", gap: 4, alignItems: "center",
        boxShadow: "0 1px 4px rgba(0,0,0,.05)",
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 6, height: 6,
            background: "#E8C4B0",
            borderRadius: "50%",
            animation: `hire-bounce 1.2s ease-in-out ${i * 0.16}s infinite`,
          }} />
        ))}
      </div>
    </div>
  )
}

function TestCard({ test, index = 0, fontSize }: { test: Test; index?: number; fontSize: number }) {
  return (
    <a
      href={test.url}
      target="_blank"
      rel="noopener noreferrer"
      className="hire-test-card"
      style={{
        display: "block",
        background: "#fff",
        border: "1px solid #F0EAE6",
        borderRadius: 14,
        overflow: "hidden",
        textDecoration: "none",
        cursor: "pointer",
        minWidth: 190,
        maxWidth: 210,
        flexShrink: 0,
        animation: `hire-card-in 0.38s cubic-bezier(.34,1.56,.64,1) ${index * 0.08}s both`,
      }}
    >
      <div style={{
        height: 72,
        background: test.color,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", fontSize: 30,
      }}>
        <span className="hire-emoji">{test.emoji}</span>
        {test.free && (
          <span style={{
            position: "absolute", bottom: 7, left: 9,
            background: "rgba(255,255,255,.95)",
            color: "#059669", fontSize: 9, fontWeight: 700,
            padding: "2px 8px", borderRadius: 8,
          }}>ҮНЭГҮЙ</span>
        )}
      </div>
      <div style={{ padding: "11px 12px 12px" }}>
        <div style={{
          fontSize: fontSize - 1, fontWeight: 600, color: "#111827",
          lineHeight: 1.35, marginBottom: 5,
          overflow: "hidden", textOverflow: "ellipsis",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>{test.name}</div>
        <div style={{
          fontSize: fontSize - 3, color: "#6B7280", lineHeight: 1.45, marginBottom: 9,
          overflow: "hidden", textOverflow: "ellipsis",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>{test.desc}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
          <span style={{
            background: test.free ? "#ECFDF5" : "#FEF3EE",
            color: test.free ? "#059669" : "#E8541A",
            fontSize: fontSize - 3, fontWeight: 600, padding: "3px 9px", borderRadius: 10,
          }}>{test.price}</span>
          <span style={{ fontSize: fontSize - 4, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 3 }}>
            <svg width="9" height="9" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="#9CA3AF" strokeWidth="1.5" />
              <path d="M8 5v3l2 1.5" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {test.duration}
          </span>
        </div>
        <div style={{
          width: "100%",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          background: "#E8541A",
          color: "#fff", fontSize: fontSize - 2, fontWeight: 600,
          padding: "7px 10px", borderRadius: 9,
          transition: "background .15s",
        }}>
          Тест авах
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M3 8h10M9 4l4 4-4 4" />
          </svg>
        </div>
      </div>
    </a>
  )
}

function TestCarousel({ tests, fontSize }: { tests: Test[]; fontSize: number }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = () => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setCanScrollLeft(scrollLeft > 5)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5)
  }

  useEffect(() => {
    checkScroll()
  }, [tests])

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: direction === "left" ? -220 : 220, behavior: "smooth" })
    setTimeout(checkScroll, 350)
  }

  return (
    <div style={{ position: "relative" }}>
      {canScrollLeft && (
        <button onClick={() => scroll("left")} style={{
          position: "absolute", left: -10, top: "45%", transform: "translateY(-50%)",
          width: 26, height: 26, borderRadius: "50%",
          background: "#fff", border: "1px solid #F0EAE6",
          boxShadow: "0 2px 8px rgba(0,0,0,.1)",
          cursor: "pointer", zIndex: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="#E8541A" strokeWidth="2.5" strokeLinecap="round">
            <path d="M10 4l-4 4 4 4" />
          </svg>
        </button>
      )}
      {canScrollRight && (
        <button onClick={() => scroll("right")} style={{
          position: "absolute", right: -10, top: "45%", transform: "translateY(-50%)",
          width: 26, height: 26, borderRadius: "50%",
          background: "#fff", border: "1px solid #F0EAE6",
          boxShadow: "0 2px 8px rgba(0,0,0,.1)",
          cursor: "pointer", zIndex: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="#E8541A" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 4l4 4-4 4" />
          </svg>
        </button>
      )}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="hire-carousel"
        style={{
          display: "flex", gap: 10,
          overflowX: "auto", overflowY: "hidden",
          scrollSnapType: "x mandatory",
          paddingBottom: 4, paddingTop: 2,
          paddingLeft: 2, paddingRight: 2,
        }}
      >
        {tests.map((test, i) => (
          <div key={test.id} style={{ scrollSnapAlign: "start" }}>
            <TestCard test={test} index={i} fontSize={fontSize} />
          </div>
        ))}
      </div>
      {tests.length > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 8 }}>
          {tests.map((_, i) => (
            <div key={i} style={{
              width: i === 0 ? 14 : 5, height: 5,
              borderRadius: 3,
              background: i === 0 ? "#E8541A" : "#F0D8CE",
              transition: "all 0.2s",
            }} />
          ))}
        </div>
      )}
    </div>
  )
}

function BotMessage({ message, fontSize }: { message: Message; fontSize: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {message.content && (
        <div className="hire-bot-msg" style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <BrainAvatar />
          <div style={{
            maxWidth: "80%", background: "#fff",
            border: "1px solid #F0EAE6",
            borderRadius: 14, borderBottomLeftRadius: 3,
            padding: "11px 14px",
            fontSize: fontSize, lineHeight: 1.65, color: "#1F2937",
            boxShadow: "0 1px 4px rgba(0,0,0,.04)",
            whiteSpace: "pre-wrap", wordBreak: "break-word",
          }}>
            {message.content}
          </div>
        </div>
      )}
      {message.tests && message.tests.length > 0 && (
        <div className="hire-tests-section" style={{ marginLeft: 38, marginTop: 2 }}>
          <div style={{
            fontSize: fontSize - 2, fontWeight: 600, color: "#9CA3AF",
            marginBottom: 10, letterSpacing: 0.2,
            textTransform: "uppercase",
          }}>
            Санал болгох тестүүд
          </div>
          <TestCarousel tests={message.tests} fontSize={fontSize} />
        </div>
      )}
    </div>
  )
}

function UserMessage({ content, fontSize }: { content: string; fontSize: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <div style={{
        maxWidth: "80%",
        background: "#E8541A",
        color: "#fff",
        borderRadius: 14, borderBottomRightRadius: 3,
        padding: "10px 14px",
        fontSize: fontSize, lineHeight: 1.6,
        wordBreak: "break-word",
        boxShadow: "0 2px 8px rgba(232,84,26,.2)",
      }}>
        {content}
      </div>
    </div>
  )
}

export function HireMnChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [fontSize, setFontSize] = useState(13)
  const [showFontSlider, setShowFontSlider] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Сайн байна уу!\n\nБи hire.mn-ий ухаалаг туслагч. Тест сонгох, мэргэжлийн зөвлөгөө авах — асуугаарай.",
    }
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showQuickReplies, setShowQuickReplies] = useState(true)
  const [lang, setLang] = useState<"МН" | "EN">("МН")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return
    setShowQuickReplies(false)
    const userMessage: Message = { role: "user", content: text }
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    try {
      const history = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }))
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, lang: lang === "МН" ? "mn" : "en" }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.reply || "Уучлаарай, хариу авч чадсангүй.",
        tests: data.tests || [],
      }])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      let msg = "Уучлаарай, холболтын алдаа гарлаа. Дахин оролдоно уу."
      if (errorMessage.includes("credit card") || errorMessage.includes("AI Gateway"))
        msg = "AI үйлчилгээ одоогоор идэвхгүй байна."
      else if (errorMessage.includes("rate limit"))
        msg = "Хэт олон хүсэлт. Түр хүлээгээд дахин оролдоно уу."
      setMessages(prev => [...prev, { role: "assistant", content: msg }])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .hire-w, .hire-w * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
          box-sizing: border-box;
        }

        @keyframes hire-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
        @keyframes hire-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes hire-pop {
          from { transform: scale(0.94) translateY(6px); opacity: 0; }
          to   { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes hire-card-in {
          from { transform: scale(0.92) translateY(10px); opacity: 0; }
          to   { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes hire-slide-up {
          from { transform: translateY(12px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes hire-chat-open {
          from { opacity: 0; transform: scale(0.9) translateY(16px); transform-origin: bottom right; }
          to   { opacity: 1; transform: scale(1) translateY(0); transform-origin: bottom right; }
        }
        @keyframes hire-pulse {
          0%, 100% { box-shadow: 0 4px 18px rgba(232,84,26,.3), 0 0 0 0 rgba(232,84,26,.25); }
          50%       { box-shadow: 0 4px 18px rgba(232,84,26,.3), 0 0 0 9px rgba(232,84,26,0); }
        }
        @keyframes hire-tooltip-in {
          from { opacity: 0; transform: translateX(6px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .hire-msg { animation: hire-pop 0.3s cubic-bezier(.34,1.56,.64,1); }
        .hire-bot-msg { animation: hire-slide-up 0.35s ease-out; }
        .hire-tests-section { animation: hire-slide-up 0.45s ease-out 0.1s both; }

        .hire-test-card {
          transition: transform 0.22s cubic-bezier(.34,1.56,.64,1), box-shadow 0.22s ease, border-color 0.18s ease;
        }
        .hire-test-card:hover {
          transform: translateY(-3px) scale(1.015);
          box-shadow: 0 10px 24px rgba(232,84,26,.15);
          border-color: #F5C8B8;
        }
        .hire-test-card:hover .hire-emoji { display: inline-block; transform: scale(1.15); transition: transform .2s; }

        .hire-chip {
          transition: all 0.18s ease;
        }
        .hire-chip:hover {
          background: #E8541A !important;
          color: #fff !important;
          border-color: #E8541A !important;
          transform: translateY(-1px);
        }

        .hire-send-btn:hover:not(:disabled) { background: #D44810 !important; }
        .hire-send-btn:active:not(:disabled) { transform: scale(0.94); }

        .hire-mascot-btn {
          transition: transform 0.22s cubic-bezier(.34,1.56,.64,1);
          animation: hire-pulse 2.6s ease-in-out infinite;
        }
        .hire-mascot-btn:hover {
          transform: scale(1.08);
          animation: none;
          box-shadow: 0 8px 26px rgba(232,84,26,.4) !important;
        }

        .hire-scroll::-webkit-scrollbar { width: 3px; }
        .hire-scroll::-webkit-scrollbar-track { background: transparent; }
        .hire-scroll::-webkit-scrollbar-thumb { background: rgba(232,84,26,.2); border-radius: 3px; }

        .hire-carousel { scrollbar-width: none; }
        .hire-carousel::-webkit-scrollbar { display: none; }

        .hire-font-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 3px;
          border-radius: 2px;
          background: linear-gradient(to right, #E8541A calc((var(--val) - 11) / 6 * 100%), #F0E4DF calc((var(--val) - 11) / 6 * 100%));
          outline: none;
          cursor: pointer;
        }
        .hire-font-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px; height: 14px;
          border-radius: 50%;
          background: #E8541A;
          border: 2px solid #fff;
          box-shadow: 0 1px 4px rgba(232,84,26,.4);
          cursor: pointer;
        }
        .hire-font-slider::-moz-range-thumb {
          width: 14px; height: 14px;
          border-radius: 50%;
          background: #E8541A;
          border: 2px solid #fff;
          cursor: pointer;
        }
      `}</style>

      <div className="hire-w" style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 99999,
        display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12,
      }}>

        {/* Chat panel */}
        {isOpen && (
          <div style={{ animation: "hire-chat-open 0.28s cubic-bezier(.34,1.56,.64,1)" }}>
            <div style={{
              width: 380, height: 600, borderRadius: 20,
              background: "#FAFAFA",
              boxShadow: "0 24px 64px rgba(0,0,0,.14), 0 2px 12px rgba(0,0,0,.06)",
              display: "flex", flexDirection: "column", overflow: "hidden",
              border: "1px solid rgba(0,0,0,.06)",
            }}>

              {/* HEADER */}
              <div style={{
                background: "#fff",
                padding: "0 14px 0 16px",
                height: 68,
                display: "flex", alignItems: "center", gap: 11,
                flexShrink: 0,
                position: "relative",
                borderBottom: "1px solid #F0EBE7",
              }}>
                {/* Accent line top */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 3,
                  background: "linear-gradient(90deg, #E8541A 0%, #F5A07A 100%)",
                  borderRadius: "20px 20px 0 0",
                }} />

                {/* Avatar */}
                <div style={{
                  width: 38, height: 38,
                  borderRadius: 11,
                  background: "#FEF3EE",
                  border: "1.5px solid #FDDCCC",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <BrainIcon size={22} color="#E8541A" />
                </div>

                {/* Title */}
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#111", fontWeight: 700, fontSize: 14, letterSpacing: "-0.2px", lineHeight: 1.2 }}>
                    hire.mn
                    <span style={{
                      marginLeft: 7,
                      fontSize: 9.5, fontWeight: 600, letterSpacing: "0.5px",
                      color: "#E8541A", background: "#FEF3EE",
                      border: "1px solid #FDDCCC",
                      padding: "2px 7px", borderRadius: 20,
                      textTransform: "uppercase",
                    }}>AI</span>
                  </div>
                  <div style={{
                    color: "#9CA3AF", fontSize: 11, marginTop: 3,
                    display: "flex", alignItems: "center", gap: 5,
                  }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: "50%", background: "#22C55E",
                      display: "inline-block", flexShrink: 0,
                    }} />
                    Онлайн — Туслахад бэлэн
                  </div>
                </div>

                {/* Controls */}
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {/* Font size */}
                  <button
                    onClick={() => setShowFontSlider(s => !s)}
                    title="Үсгийн хэмжээ"
                    style={{
                      width: 30, height: 30, borderRadius: 8,
                      background: showFontSlider ? "#FEF3EE" : "transparent",
                      border: showFontSlider ? "1px solid #FDDCCC" : "1px solid transparent",
                      color: showFontSlider ? "#E8541A" : "#9CA3AF",
                      cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all .15s",
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M4 20h4M6 20V7l-3 3M14 20h4M16 20V4l-3 3M20 4l-3 3M10 13h4" />
                    </svg>
                  </button>

                  {/* Lang toggle */}
                  <button
                    onClick={() => setLang(l => l === "МН" ? "EN" : "МН")}
                    style={{
                      height: 30, paddingLeft: 9, paddingRight: 9,
                      borderRadius: 8,
                      background: "transparent",
                      border: "1px solid transparent",
                      color: "#9CA3AF", fontSize: 11, fontWeight: 600,
                      cursor: "pointer",
                      transition: "all .15s",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = "#F5F5F5"
                      ;(e.currentTarget as HTMLElement).style.color = "#333"
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = "transparent"
                      ;(e.currentTarget as HTMLElement).style.color = "#9CA3AF"
                    }}
                  >
                    {lang === "МН" ? "EN" : "МН"}
                  </button>

                  {/* Close */}
                  <button
                    onClick={() => setIsOpen(false)}
                    style={{
                      width: 30, height: 30, borderRadius: 8,
                      background: "transparent",
                      border: "1px solid transparent",
                      color: "#9CA3AF", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all .15s",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = "#FEF2F2"
                      ;(e.currentTarget as HTMLElement).style.color = "#EF4444"
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = "transparent"
                      ;(e.currentTarget as HTMLElement).style.color = "#9CA3AF"
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Font size slider — collapsed panel */}
              {showFontSlider && (
                <div style={{
                  background: "#FAFAFA",
                  borderBottom: "1px solid #F0EBE7",
                  padding: "10px 16px",
                  flexShrink: 0,
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <span style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, minWidth: 18 }}>A</span>
                  <input
                    type="range"
                    min={11}
                    max={17}
                    step={1}
                    value={fontSize}
                    onChange={e => setFontSize(Number(e.target.value))}
                    className="hire-font-slider"
                    style={{ "--val": fontSize } as React.CSSProperties}
                  />
                  <span style={{ fontSize: 15, color: "#9CA3AF", fontWeight: 600, minWidth: 14 }}>A</span>
                  <span style={{
                    fontSize: 10, color: "#C0B0A8",
                    minWidth: 28, textAlign: "right",
                  }}>{fontSize}px</span>
                </div>
              )}

              {/* MESSAGES */}
              <div className="hire-scroll" style={{
                flex: 1, overflowY: "auto",
                padding: "16px 14px 10px",
                display: "flex", flexDirection: "column", gap: 10,
                background: "#FAFAFA",
              }}>
                {messages.map((msg, i) => (
                  <div key={i} className="hire-msg">
                    {msg.role === "assistant"
                      ? <BotMessage message={msg} fontSize={fontSize} />
                      : <UserMessage content={msg.content} fontSize={fontSize} />
                    }
                  </div>
                ))}

                {isTyping && (
                  <div className="hire-msg">
                    <TypingIndicator />
                  </div>
                )}

                {showQuickReplies && !isTyping && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                    {QUICK_REPLIES.map(qr => (
                      <button
                        key={qr}
                        className="hire-chip"
                        onClick={() => sendMessage(qr)}
                        style={{
                          background: "#fff",
                          border: "1px solid #F0DDD4",
                          color: "#E8541A",
                          borderRadius: 20,
                          padding: "6px 13px",
                          fontSize: fontSize - 2,
                          fontWeight: 500,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          boxShadow: "0 1px 3px rgba(0,0,0,.05)",
                        }}
                      >
                        {qr}
                      </button>
                    ))}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* INPUT */}
              <div style={{
                padding: "10px 12px 12px",
                borderTop: "1px solid #EDE8E5",
                background: "#fff",
                flexShrink: 0,
              }}>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => {
                      setInput(e.target.value)
                      e.target.style.height = "auto"
                      e.target.style.height = Math.min(e.target.scrollHeight, 88) + "px"
                    }}
                    onKeyDown={handleKey}
                    placeholder="Асуулт бичнэ үү..."
                    rows={1}
                    style={{
                      flex: 1,
                      border: "1.5px solid #EDE8E5",
                      borderRadius: 12,
                      padding: "9px 13px",
                      fontSize: fontSize,
                      outline: "none",
                      resize: "none",
                      maxHeight: 88,
                      lineHeight: 1.5,
                      color: "#1F2937",
                      background: "#FAFAFA",
                      transition: "border-color .15s",
                      fontFamily: "Inter, sans-serif",
                    }}
                    onFocus={e => (e.target.style.borderColor = "#E8541A")}
                    onBlur={e => (e.target.style.borderColor = "#EDE8E5")}
                  />
                  <button
                    className="hire-send-btn"
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || isTyping}
                    style={{
                      width: 40, height: 40, borderRadius: 11,
                      background: input.trim() && !isTyping ? "#E8541A" : "#F0E0D8",
                      border: "none",
                      cursor: input.trim() && !isTyping ? "pointer" : "default",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                      transition: "background .15s, transform .12s",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" fill="white" stroke="none" />
                    </svg>
                  </button>
                </div>
                <div style={{ textAlign: "center", marginTop: 8, fontSize: 10, color: "#D1C4BE" }}>
                  hire.mn AI
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Mascot row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

          {/* Tooltip */}
          {isHovered && !isOpen && (
            <div style={{
              animation: "hire-tooltip-in 0.18s ease-out",
              background: "#1A1A1A",
              borderRadius: 12,
              padding: "10px 14px",
              boxShadow: "0 8px 24px rgba(0,0,0,.15)",
              maxWidth: 195,
              pointerEvents: "none",
              position: "relative",
            }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "#fff", marginBottom: 3 }}>
                hire.mn Туслагч
              </div>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.55)", lineHeight: 1.5 }}>
                Тест сонгох, мэргэжлийн зөвлөгөө авах
              </div>
              <div style={{
                position: "absolute", right: -6, top: "50%", transform: "translateY(-50%)",
                width: 0, height: 0,
                borderTop: "6px solid transparent",
                borderBottom: "6px solid transparent",
                borderLeft: "6px solid #1A1A1A",
              }} />
            </div>
          )}

          {/* Mascot button */}
          <button
            className="hire-mascot-btn"
            onClick={() => setIsOpen(o => !o)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            aria-label="hire.mn чат нээх"
            style={{
              width: 56, height: 56, borderRadius: "50%",
              background: isOpen ? "#1A1A1A" : "linear-gradient(145deg, #F06030, #E8541A)",
              border: "2.5px solid rgba(255,255,255,.95)",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              position: "relative",
              transition: "background .2s",
            }}
          >
            {isOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <BrainIcon size={28} />
            )}
            {!isOpen && (
              <span style={{
                position: "absolute", bottom: 1, right: 1,
                width: 12, height: 12, borderRadius: "50%",
                background: "#4ADE80", border: "2px solid #fff",
              }} />
            )}
          </button>
        </div>

      </div>
    </>
  )
}

export default HireMnChatWidget
