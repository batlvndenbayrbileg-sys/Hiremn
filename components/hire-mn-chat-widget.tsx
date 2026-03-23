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

function TestCard({ test }: { test: Test }) {
  return (
    <a
      href={test.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "block",
        background: "#fff",
        border: "1px solid #F0EBE8",
        borderRadius: 14,
        overflow: "hidden",
        textDecoration: "none",
        marginBottom: 8,
        transition: "transform 0.2s, box-shadow 0.2s",
        cursor: "pointer",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"
        ;(e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(232,84,26,.14)"
        ;(e.currentTarget as HTMLElement).style.borderColor = "#F0C4AD"
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)"
        ;(e.currentTarget as HTMLElement).style.boxShadow = "none"
        ;(e.currentTarget as HTMLElement).style.borderColor = "#F0EBE8"
      }}
    >
      <div style={{
        height: 72,
        background: `linear-gradient(135deg, ${test.color}, ${test.color}cc)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", fontSize: 30,
      }}>
        {test.emoji}
        <span style={{ position: "absolute", top: 7, right: 9, fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,.85)" }}>Hire.mn</span>
        <span style={{
          position: "absolute", bottom: 6, left: 8,
          background: "rgba(255,255,255,.22)", border: "1px solid rgba(255,255,255,.3)",
          color: "#fff", fontSize: 9.5, fontWeight: 600, padding: "2px 8px", borderRadius: 8,
        }}>Өөрийн үнэлгээ</span>
      </div>
      <div style={{ padding: "10px 12px" }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "#1A1A1A", lineHeight: 1.35, marginBottom: 4 }}>{test.name}</div>
        <div style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.4, marginBottom: 8 }}>{test.desc}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              background: test.free ? "#F3F4F6" : "#E8541A",
              color: test.free ? "#6B7280" : "#fff",
              fontSize: 10.5, fontWeight: 700, padding: "3px 9px", borderRadius: 14,
            }}>{test.price}</span>
            <span style={{ fontSize: 10, color: "#9CA3AF" }}>🕐 {test.duration}</span>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 4,
            background: "#FDF0EB", color: "#E8541A", fontSize: 11, fontWeight: 700,
            padding: "5px 10px", borderRadius: 10, border: "1.5px solid #F0C4AD",
          }}>
            Авах
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="#E8541A" strokeWidth="2" strokeLinecap="round">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </div>
        </div>
      </div>
    </a>
  )
}

function BotMessage({ message }: { message: Message }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {message.content && (
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <BrainAvatar />
          <div style={{
            maxWidth: "78%", background: "#fff", border: "1px solid #F0EBE8",
            borderRadius: 16, borderBottomLeftRadius: 4, padding: "10px 13px",
            fontSize: 13, lineHeight: 1.58, color: "#1A1A1A",
            boxShadow: "0 1px 5px rgba(0,0,0,.04)", whiteSpace: "pre-wrap", wordBreak: "break-word",
          }}>
            {message.content}
          </div>
        </div>
      )}
      {message.tests && message.tests.length > 0 && (
        <div style={{ marginLeft: 40 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#E8541A", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M8 1l1.5 3 3.5.5-2.5 2.5.5 3.5L8 9l-3 1.5.5-3.5L3 4.5 6.5 4z" fill="#E8541A" />
            </svg>
            Санал болгож буй тестүүд
          </div>
          {message.tests.map(test => (
            <TestCard key={test.id} test={test} />
          ))}
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
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Уучлаарай, холболтын алдаа гарлаа. Дахин оролдоно уу.",
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
          from { transform: scale(0.9); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
        .hire-msg { animation: hire-pop 0.22s cubic-bezier(.34,1.56,.64,1); }
        .hire-chip:hover { background: #E8541A !important; color: #fff !important; border-color: #E8541A !important; }
        .hire-scroll::-webkit-scrollbar { width: 4px; }
        .hire-scroll::-webkit-scrollbar-track { background: transparent; }
        .hire-scroll::-webkit-scrollbar-thumb { background: rgba(232,84,26,.25); border-radius: 4px; }
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
