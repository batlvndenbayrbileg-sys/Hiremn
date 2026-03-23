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

function BrainIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 0.92)} viewBox="0 0 60 54" fill="none">
      <ellipse cx="30" cy="27" rx="23" ry="19" fill="white" opacity={0.95} />
      <path d="M14 21 Q6 16 8 27 Q6 36 14 36" stroke="rgba(232,84,26,.85)" strokeWidth="3.2" fill="none" strokeLinecap="round" />
      <path d="M46 21 Q54 16 52 27 Q54 36 46 36" stroke="rgba(232,84,26,.85)" strokeWidth="3.2" fill="none" strokeLinecap="round" />
      <path d="M18 19 Q24 10 30 19 Q36 10 42 19" stroke="rgba(232,84,26,.78)" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <line x1="30" y1="13" x2="30" y2="41" stroke="rgba(232,84,26,.38)" strokeWidth="2.2" strokeDasharray="4 4" />
      <path d="M18 35 Q24 44 30 35 Q36 44 42 35" stroke="rgba(232,84,26,.68)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="22" cy="26" r="2.5" fill="#E8541A" opacity={0.7} />
      <circle cx="38" cy="26" r="2.5" fill="#E8541A" opacity={0.7} />
      <circle cx="30" cy="23" r="2" fill="#F4845F" opacity={0.6} />
    </svg>
  )
}

function BrainAvatar() {
  return (
    <div style={{
      width: 32, height: 32,
      borderRadius: 10,
      background: "#FDF0EB",
      border: "1px solid #F0DDD4",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      <svg width="16" height="15" viewBox="0 0 60 54" fill="none">
        <ellipse cx="30" cy="27" rx="23" ry="19" fill="#FDF0EB" />
        <path d="M14 21 Q6 16 8 27 Q6 36 14 36" stroke="#E8541A" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <path d="M46 21 Q54 16 52 27 Q54 36 46 36" stroke="#E8541A" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <path d="M18 19 Q24 10 30 19 Q36 10 42 19" stroke="#E8541A" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
      <BrainAvatar />
      <div style={{
        background: "#fff",
        border: "1px solid #F0EBE8",
        borderRadius: 16,
        borderBottomLeftRadius: 4,
        padding: "12px 16px",
        display: "flex", gap: 5, alignItems: "center",
        boxShadow: "0 1px 5px rgba(0,0,0,.04)",
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 7, height: 7,
            background: "#F0C4B0",
            borderRadius: "50%",
            animation: `hire-bounce 1.3s ease-in-out ${i * 0.18}s infinite`,
          }} />
        ))}
      </div>
    </div>
  )
}

function TestCard({ test, index = 0 }: { test: Test; index?: number }) {
  return (
    <a
      href={test.url}
      target="_blank"
      rel="noopener noreferrer"
      className="hire-test-card"
      style={{
        display: "block",
        background: "#fff",
        border: "1.5px solid #F0EBE8",
        borderRadius: 16,
        overflow: "hidden",
        textDecoration: "none",
        cursor: "pointer",
        minWidth: 200,
        maxWidth: 220,
        flexShrink: 0,
        animation: `hire-card-in 0.4s cubic-bezier(.34,1.56,.64,1) ${index * 0.1}s both`,
      }}
    >
      <div style={{
        height: 80,
        background: `linear-gradient(145deg, ${test.color}, ${test.color}dd)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", fontSize: 34,
      }}>
        <span className="hire-emoji">{test.emoji}</span>
        <span style={{ 
          position: "absolute", top: 8, right: 10, 
          fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,.9)",
          letterSpacing: 0.5,
        }}>Hire.mn</span>
        {test.free && (
          <span style={{
            position: "absolute", bottom: 8, left: 10,
            background: "rgba(255,255,255,.95)", 
            color: test.color, fontSize: 9, fontWeight: 700, 
            padding: "3px 10px", borderRadius: 10,
            boxShadow: "0 2px 8px rgba(0,0,0,.1)",
          }}>ҮНЭГҮЙ</span>
        )}
      </div>
      <div style={{ padding: "12px 14px" }}>
        <div style={{ 
          fontSize: 13, fontWeight: 700, color: "#1A1A1A", 
          lineHeight: 1.35, marginBottom: 6,
          overflow: "hidden", textOverflow: "ellipsis",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>{test.name}</div>
        <div style={{ 
          fontSize: 11, color: "#6B7280", lineHeight: 1.45, marginBottom: 10,
          overflow: "hidden", textOverflow: "ellipsis",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>{test.desc}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              background: test.free ? "#ECFDF5" : "#FDF0EB",
              color: test.free ? "#059669" : "#E8541A",
              fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 12,
            }}>{test.price}</span>
          </div>
          <span style={{ fontSize: 10, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 3 }}>
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="#9CA3AF" strokeWidth="1.5"/>
              <path d="M8 5v3l2 1.5" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {test.duration}
          </span>
        </div>
        <button style={{
          width: "100%", marginTop: 10,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          background: "linear-gradient(135deg, #E8541A, #D44810)",
          color: "#fff", fontSize: 11.5, fontWeight: 700,
          padding: "8px 12px", borderRadius: 10, border: "none",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(232,84,26,.25)",
        }}>
          Тест авах
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M3 8h10M9 4l4 4-4 4" />
          </svg>
        </button>
      </div>
    </a>
  )
}

function TestCarousel({ tests }: { tests: Test[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

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
    const scrollAmount = 230
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    })
    setTimeout(checkScroll, 350)
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Left scroll button */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          style={{
            position: "absolute", left: -8, top: "50%", transform: "translateY(-50%)",
            width: 28, height: 28, borderRadius: "50%",
            background: "#fff", border: "1.5px solid #F0EBE8",
            boxShadow: "0 2px 10px rgba(0,0,0,.1)",
            cursor: "pointer", zIndex: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#E8541A" strokeWidth="2.5" strokeLinecap="round">
            <path d="M10 4l-4 4 4 4" />
          </svg>
        </button>
      )}
      {/* Right scroll button */}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          style={{
            position: "absolute", right: -8, top: "50%", transform: "translateY(-50%)",
            width: 28, height: 28, borderRadius: "50%",
            background: "#fff", border: "1.5px solid #F0EBE8",
            boxShadow: "0 2px 10px rgba(0,0,0,.1)",
            cursor: "pointer", zIndex: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#E8541A" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 4l4 4-4 4" />
          </svg>
        </button>
      )}

      {/* Carousel container — always horizontal */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="hire-carousel"
        style={{
          display: "flex", gap: 10,
          overflowX: "auto", overflowY: "hidden",
          scrollSnapType: "x mandatory",
          paddingBottom: 6, paddingTop: 4,
          marginLeft: -4, marginRight: -4, paddingLeft: 4, paddingRight: 4,
        }}
      >
        {tests.map((test, i) => (
          <div key={test.id} style={{ scrollSnapAlign: "start" }}>
            <TestCard test={test} index={i} />
          </div>
        ))}
      </div>

      {/* Pagination dots — only if more than 1 test */}
      {tests.length > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 8 }}>
          {tests.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === 0 ? 14 : 6, height: 6,
                borderRadius: 3,
                background: i === 0 ? "#E8541A" : "#F0DDD4",
                transition: "all 0.2s",
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
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {message.content && (
        <div className="hire-bot-msg" style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <BrainAvatar />
          <div style={{
            maxWidth: "78%", background: "#fff", border: "1px solid #F0EBE8",
            borderRadius: 16, borderBottomLeftRadius: 4, padding: "12px 14px",
            fontSize: 13, lineHeight: 1.6, color: "#1A1A1A",
            boxShadow: "0 2px 8px rgba(0,0,0,.04)", whiteSpace: "pre-wrap", wordBreak: "break-word",
          }}>
            {message.content}
          </div>
        </div>
      )}
      {message.tests && message.tests.length > 0 && (
        <div className="hire-tests-section" style={{ marginLeft: 40, marginTop: 4 }}>
          <div style={{ 
            fontSize: 12, fontWeight: 700, color: "#E8541A", marginBottom: 12, 
            display: "flex", alignItems: "center", gap: 6,
            paddingLeft: 2,
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: 8,
              background: "linear-gradient(135deg, #FDF0EB, #FFEEE6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "1px solid #F5DDD4",
            }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M8 1l1.5 3 3.5.5-2.5 2.5.5 3.5L8 9l-3 1.5.5-3.5L3 4.5 6.5 4z" fill="#E8541A" />
              </svg>
            </div>
            Санал болгож буй тестүүд ({message.tests.length})
          </div>
          <TestCarousel tests={message.tests} />
        </div>
      )}
    </div>
  )
}

function UserMessage({ content }: { content: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <div style={{
        maxWidth: "78%", background: "#E8541A", color: "#fff",
        borderRadius: 16, borderBottomRightRadius: 4,
        padding: "10px 13px", fontSize: 13, lineHeight: 1.58, wordBreak: "break-word",
      }}>
        {content}
      </div>
    </div>
  )
}

export function HireMnChatWidget() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Сайн байна уу! 👋\n\nБи hire.mn-ий ухаалаг туслагч.\nТаны мэргэжлийн хөгжилд туслахад бэлэн байна!",
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

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText)
      }

      const data = await res.json()

      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.reply || "Уучлаарай, хариу авч чадсангүй.",
        tests: data.tests || [],
      }])
    } catch (err) {
      console.error("[v0] chat error:", err)
      const errorMessage = err instanceof Error ? err.message : String(err)
      
      let userFriendlyMessage = "Уучлаарай, холболтын алдаа гарлаа. Дахин оролдоно уу."
      
      // Check for specific AI Gateway errors
      if (errorMessage.includes("credit card") || errorMessage.includes("AI Gateway")) {
        userFriendlyMessage = "AI үйлчилгээ одоогоор идэвхгүй байна. Системийн админтай холбогдоно уу."
      } else if (errorMessage.includes("rate limit")) {
        userFriendlyMessage = "Хэт олон хүсэлт илгээгдлээ. Түр хүлээгээд дахин оролдоно уу."
      } else if (errorMessage.includes("timeout")) {
        userFriendlyMessage = "Хариу авахад хэт удсан байна. Дахин оролдоно уу."
      }
      
      setMessages(prev => [...prev, {
        role: "assistant",
        content: userFriendlyMessage,
      }])
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

  const tickerItems = ["42+ тест нээлттэй", "3,512+ хэрэглэгч", "Шинэ: СЭМУТ сорил", "Үнэгүй тестүүд байна"]
  const tripled = [...tickerItems, ...tickerItems, ...tickerItems]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .hire-widget * { font-family: 'Plus Jakarta Sans', sans-serif !important; box-sizing: border-box; }
        
        @keyframes hire-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        @keyframes hire-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes hire-ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        @keyframes hire-pop {
          from { transform: scale(0.92) translateY(8px); opacity: 0; }
          to   { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes hire-card-in {
          from { transform: scale(0.9) translateY(12px); opacity: 0; }
          to   { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes hire-slide-up {
          from { transform: translateY(16px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes hire-emoji-pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        @keyframes hire-shine {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        
        .hire-msg { animation: hire-pop 0.35s cubic-bezier(.34,1.56,.64,1); }
        .hire-bot-msg { animation: hire-slide-up 0.4s ease-out; }
        .hire-tests-section { animation: hire-slide-up 0.5s ease-out 0.15s both; }
        
        .hire-test-card {
          transition: transform 0.25s cubic-bezier(.34,1.56,.64,1), 
                      box-shadow 0.25s ease,
                      border-color 0.2s ease;
        }
        .hire-test-card:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 12px 28px rgba(232,84,26,.18);
          border-color: #F0C4AD;
        }
        .hire-test-card:hover .hire-emoji {
          animation: hire-emoji-pop 0.4s ease-in-out;
        }
        .hire-test-card:hover button {
          background: linear-gradient(135deg, #D44810, #C03A08) !important;
          box-shadow: 0 4px 12px rgba(232,84,26,.35);
        }
        
        .hire-chip { 
          transition: all 0.2s cubic-bezier(.34,1.56,.64,1); 
        }
        .hire-chip:hover { 
          background: #E8541A !important; 
          color: #fff !important; 
          border-color: #E8541A !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(232,84,26,.25);
        }
        
        .hire-scroll::-webkit-scrollbar { width: 4px; }
        .hire-scroll::-webkit-scrollbar-track { background: transparent; }
        .hire-scroll::-webkit-scrollbar-thumb { background: rgba(232,84,26,.25); border-radius: 4px; }
        
        .hire-carousel::-webkit-scrollbar { height: 4px; }
        .hire-carousel::-webkit-scrollbar-track { background: transparent; }
        .hire-carousel::-webkit-scrollbar-thumb { background: rgba(232,84,26,.2); border-radius: 4px; }
      `}</style>

      <div className="hire-widget" style={{
        width: 390, height: 620, borderRadius: 24,
        background: "#FFFCFB", boxShadow: "0 20px 70px rgba(0,0,0,.16)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>

        {/* HEADER */}
        <div style={{
          background: "#E8541A", padding: "0 16px", height: 72,
          display: "flex", alignItems: "center", gap: 12,
          flexShrink: 0, position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", right: -20, top: -20, width: 85, height: 85, borderRadius: "50%", background: "rgba(255,255,255,.07)" }} />
          <div style={{ position: "absolute", right: 22, top: 36, width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,.05)" }} />
          <div style={{
            width: 48, height: 48, background: "rgba(255,255,255,.18)",
            border: "1.5px solid rgba(255,255,255,.28)", borderRadius: 14,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, animation: "hire-float 3.5s ease-in-out infinite", position: "relative", zIndex: 1,
          }}>
            <BrainIcon size={26} />
          </div>
          <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>hire.mn Туслах</div>
            <div style={{ color: "rgba(255,255,255,.72)", fontSize: 11, display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
              <div style={{ width: 6, height: 6, background: "#4ADE80", borderRadius: "50%", animation: "hire-bounce 2s ease-in-out infinite" }} />
              Онлайн байна
            </div>
          </div>
          <button
            onClick={() => setLang(l => l === "МН" ? "EN" : "МН")}
            style={{
              background: "rgba(255,255,255,.18)", border: "1.5px solid rgba(255,255,255,.32)",
              color: "#fff", borderRadius: 18, padding: "5px 12px",
              fontSize: 11, fontWeight: 700, cursor: "pointer", position: "relative", zIndex: 1,
            }}
          >
            {lang === "МН" ? "EN" : "МН"}
          </button>
        </div>

        {/* TICKER */}
        <div style={{
          background: "#FFF0EB", borderBottom: "1px solid #F5DDD4",
          height: 28, display: "flex", alignItems: "center",
          overflow: "hidden", flexShrink: 0,
        }}>
          <div style={{ display: "flex", gap: 20, animation: "hire-ticker 24s linear infinite", whiteSpace: "nowrap" }}>
            {tripled.map((item, i) => (
              <span key={i} style={{
                fontSize: 10.5, fontWeight: 600, color: "#C04010",
                display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0,
                paddingLeft: i === 0 ? 14 : 0,
              }}>
                <span style={{ width: 5, height: 5, background: "#E8541A", borderRadius: "50%", display: "inline-block" }} />
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* MESSAGES */}
        <div className="hire-scroll" style={{
          flex: 1, overflowY: "auto", padding: "14px 13px 8px",
          display: "flex", flexDirection: "column", gap: 10, background: "#FFFCFB",
        }}>
          {messages.map((msg, i) => (
            <div key={i} className="hire-msg">
              {msg.role === "assistant"
                ? <BotMessage message={msg} />
                : <UserMessage content={msg.content} />
              }
            </div>
          ))}

          {isTyping && (
            <div className="hire-msg">
              <TypingIndicator />
            </div>
          )}

          {showQuickReplies && !isTyping && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
              {QUICK_REPLIES.map(qr => (
                <button
                  key={qr}
                  className="hire-chip"
                  onClick={() => sendMessage(qr)}
                  style={{
                    background: "#fff", border: "1.5px solid #F0C4AD", color: "#E8541A",
                    borderRadius: 18, padding: "6px 12px", fontSize: 12, fontWeight: 600,
                    cursor: "pointer", whiteSpace: "nowrap", transition: "all .15s",
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
          padding: "10px 13px 12px", borderTop: "1px solid #F5EFEC",
          display: "flex", gap: 8, alignItems: "flex-end",
          flexShrink: 0, background: "#fff",
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => {
              setInput(e.target.value)
              e.target.style.height = "auto"
              e.target.style.height = Math.min(e.target.scrollHeight, 90) + "px"
            }}
            onKeyDown={handleKey}
            placeholder="Асуулт бичнэ үү..."
            rows={1}
            style={{
              flex: 1, border: "1.5px solid #EDDFDA", borderRadius: 13,
              padding: "9px 13px", fontSize: 13, outline: "none", resize: "none",
              maxHeight: 90, lineHeight: 1.4, color: "#1A1A1A",
              background: "#FDFCFC", transition: "border-color .15s",
            }}
            onFocus={e => (e.target.style.borderColor = "#E8541A")}
            onBlur={e => (e.target.style.borderColor = "#EDDFDA")}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
            style={{
              width: 40, height: 40, borderRadius: 12,
              background: input.trim() && !isTyping ? "#E8541A" : "#E8D5CF",
              border: "none", cursor: input.trim() && !isTyping ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "background .15s, transform .15s",
            }}
            onMouseEnter={e => { if (input.trim()) (e.currentTarget as HTMLElement).style.transform = "scale(1.08)" }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" fill="white" stroke="none" />
            </svg>
          </button>
        </div>

        {/* FOOTER */}
        <div style={{
          textAlign: "center", fontSize: 10, color: "#C8B4AE",
          padding: "0 0 8px", background: "#fff", flexShrink: 0,
        }}>
          hire.mn AI · Ухаалаг туслагч
        </div>
      </div>
    </>
  )
}

export default HireMnChatWidget
