"use client"

import { useState, useRef, useEffect } from "react"

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant"
  content: string
  tests?: Test[]
  categories?: string[]  // category tab-уудад
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
  category?: string
  count?: number
  icon?: string
}

// ── Quick replies ─────────────────────────────────────────────────────────────

const QUICK_REPLIES = [
  "Ямар тест байдаг вэ?",
  "Надад тохирох тест хэл",
  "Үнэгүй тест байна уу?",
  "Стресстэй байна, юу хийх вэ?",
]

// ── Icons / Avatars ───────────────────────────────────────────────────────────

// ── Mascot — brain-headed robot character ────────────────────────────────────
// viewBox: 0 0 80 100  (portrait, brain head on top, body + arms + legs below)

function MascotRobot({ size = 56, white = false }: { size?: number; white?: boolean }) {
  const stroke     = white ? "#fff"                    : "#E8541A"
  const fill1      = white ? "rgba(255,255,255,0.22)"  : "rgba(232,84,26,0.13)"
  const fill2      = white ? "rgba(255,255,255,0.40)"  : "rgba(232,84,26,0.28)"
  const fillSolid  = white ? "rgba(255,255,255,0.90)"  : "#E8541A"
  const fillBody   = white ? "rgba(255,255,255,0.18)"  : "rgba(232,84,26,0.10)"
  const sw         = white ? 1.6 : 1.8

  const h = Math.round(size * 100 / 80)

  return (
    <svg
      width={size} height={h}
      viewBox="0 0 80 100"
      fill="none"
      style={{ overflow: "visible", display: "block" }}
    >
      {/* ── Shadow ── */}
      <ellipse cx="40" cy="97" rx="14" ry="3" fill={stroke} opacity="0.12"
        style={{ animation: "rb-shadow 2.4s ease-in-out infinite", transformOrigin: "40px 97px" }}
      />

      {/* ── Legs — left & right, walking animation ── */}
      <g style={{ animation: "rb-leg-l 2.4s ease-in-out infinite", transformOrigin: "35px 74px" }}>
        <rect x="31" y="74" width="8" height="16" rx="4" fill={fillBody} stroke={stroke} strokeWidth={sw} />
        {/* foot */}
        <rect x="28" y="87" width="12" height="6" rx="3" fill={fill2} stroke={stroke} strokeWidth={sw} />
      </g>
      <g style={{ animation: "rb-leg-r 2.4s ease-in-out infinite", transformOrigin: "45px 74px" }}>
        <rect x="41" y="74" width="8" height="16" rx="4" fill={fillBody} stroke={stroke} strokeWidth={sw} />
        {/* foot */}
        <rect x="40" y="87" width="12" height="6" rx="3" fill={fill2} stroke={stroke} strokeWidth={sw} />
      </g>

      {/* ── Body ── */}
      <rect x="24" y="50" width="32" height="26" rx="8" fill={fillBody} stroke={stroke} strokeWidth={sw} />
      {/* chest panel */}
      <rect x="30" y="56" width="20" height="12" rx="4" fill={fill1} stroke={stroke} strokeWidth={sw * 0.7} />
      {/* chest LED dots */}
      <circle cx="36" cy="62" r="2" fill={fillSolid}
        style={{ animation: "rb-led 1.8s ease-in-out infinite", transformOrigin: "36px 62px" }}
      />
      <circle cx="44" cy="62" r="2" fill={fillSolid}
        style={{ animation: "rb-led 1.8s ease-in-out 0.6s infinite", transformOrigin: "44px 62px" }}
      />

      {/* ── Arms — left & right, swinging ── */}
      <g style={{ animation: "rb-arm-l 2.4s ease-in-out infinite", transformOrigin: "24px 56px" }}>
        <rect x="12" y="52" width="12" height="7" rx="3.5" fill={fillBody} stroke={stroke} strokeWidth={sw} />
        {/* hand */}
        <circle cx="12" cy="55.5" r="4" fill={fill2} stroke={stroke} strokeWidth={sw} />
      </g>
      <g style={{ animation: "rb-arm-r 2.4s ease-in-out infinite", transformOrigin: "56px 56px" }}>
        <rect x="56" y="52" width="12" height="7" rx="3.5" fill={fillBody} stroke={stroke} strokeWidth={sw} />
        {/* hand */}
        <circle cx="68" cy="55.5" r="4" fill={fill2} stroke={stroke} strokeWidth={sw} />
      </g>

      {/* ── Neck ── */}
      <rect x="36" y="44" width="8" height="8" rx="3" fill={fillBody} stroke={stroke} strokeWidth={sw} />

      {/* ── Brain head ── */}
      {/* Skull base */}
      <ellipse cx="40" cy="30" rx="18" ry="16" fill={fill1} stroke={stroke} strokeWidth={sw} />
      {/* Left hemisphere */}
      <path d="M22 30 Q18 18 28 14 Q32 8 40 12" stroke={stroke} strokeWidth={sw} fill={fill2} />
      {/* Right hemisphere */}
      <path d="M58 30 Q62 18 52 14 Q48 8 40 12" stroke={stroke} strokeWidth={sw} fill={fill2} />
      {/* Center divider */}
      <line x1="40" y1="14" x2="40" y2="44" stroke={stroke} strokeWidth={sw * 0.5} strokeDasharray="3 3" opacity="0.5" />
      {/* Brain folds — left */}
      <path d="M26 26 Q30 22 30 28 Q30 33 26 32" stroke={stroke} strokeWidth={sw * 0.7} fill="none" opacity="0.7" />
      <path d="M27 35 Q31 31 31 37" stroke={stroke} strokeWidth={sw * 0.7} fill="none" opacity="0.7" />
      {/* Brain folds — right */}
      <path d="M54 26 Q50 22 50 28 Q50 33 54 32" stroke={stroke} strokeWidth={sw * 0.7} fill="none" opacity="0.7" />
      <path d="M53 35 Q49 31 49 37" stroke={stroke} strokeWidth={sw * 0.7} fill="none" opacity="0.7" />
      {/* Eyes */}
      <ellipse cx="33" cy="34" rx="4" ry="4.5" fill={fill2} stroke={stroke} strokeWidth={sw * 0.8} />
      <ellipse cx="47" cy="34" rx="4" ry="4.5" fill={fill2} stroke={stroke} strokeWidth={sw * 0.8} />
      {/* Pupils — blinking */}
      <ellipse cx="33" cy="34" rx="2" ry="2"  fill={fillSolid}
        style={{ animation: "rb-blink 4s ease-in-out infinite", transformOrigin: "33px 34px" }}
      />
      <ellipse cx="47" cy="34" rx="2" ry="2" fill={fillSolid}
        style={{ animation: "rb-blink 4s ease-in-out infinite", transformOrigin: "47px 34px" }}
      />
      {/* Eye shine */}
      <circle cx="34" cy="33" r="0.7" fill={white ? "rgba(232,84,26,0.6)" : "rgba(255,255,255,0.8)"} />
      <circle cx="48" cy="33" r="0.7" fill={white ? "rgba(232,84,26,0.6)" : "rgba(255,255,255,0.8)"} />
      {/* Smile */}
      <path d="M35 40 Q40 44 45 40" stroke={stroke} strokeWidth={sw} strokeLinecap="round" fill="none" />
      {/* Antenna */}
      <line x1="40" y1="14" x2="40" y2="6" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
      <circle cx="40" cy="5" r="3" fill={fillSolid}
        style={{ animation: "rb-led 1.2s ease-in-out infinite", transformOrigin: "40px 5px" }}
      />
    </svg>
  )
}

// Compact avatar for message bubbles — just the brain head portion
function BrainAvatar() {
  return (
    <div style={{
      width: 30, height: 30, borderRadius: "50%",
      background: "linear-gradient(135deg,#FEF3EE,#FFE8DA)",
      border: "1.5px solid #FDDCCC",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
      boxShadow: "0 2px 8px rgba(232,84,26,.12)",
      overflow: "hidden",
    }}>
      {/* Crop to just the head */}
      <div style={{ marginTop: 6 }}>
        <MascotRobot size={22} />
      </div>
    </div>
  )
}

// ── Typing indicator ──────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
      <BrainAvatar />
      <div style={{
        background: "#fff", border: "1px solid #F0EAE6",
        borderRadius: 14, borderBottomLeftRadius: 3,
        padding: "11px 15px",
        display: "flex", gap: 4, alignItems: "center",
        boxShadow: "0 1px 4px rgba(0,0,0,.05)",
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, background: "#E8C4B0", borderRadius: "50%",
            animation: `hw-bounce 1.2s ease-in-out ${i * 0.16}s infinite`,
          }} />
        ))}
      </div>
    </div>
  )
}

// ── Cover image picker ────────────────────────────────────────────────────────

function getCoverImage(test: Test): string {
  const name = (test.name || "").toLowerCase()
  const cat = (test.category || "").toLowerCase()
  const combined = name + " " + cat
  if (combined.match(/сэтгэц|mental|сэмут|semut|сэтгэл/)) return "/covers/mental-health.jpg"
  if (combined.match(/харилц|communicat|leadership|удирд/)) return "/covers/communication.jpg"
  if (combined.match(/тэнцвэр|balance|стресс|stress/)) return "/covers/balance.jpg"
  if (combined.match(/mindset|хандлага|итгэл|өөртөө/)) return "/covers/mindset.jpg"
  if (combined.match(/никотин|тамхи|audit|архи|дарс|health|эрүүл/)) return "/covers/health.jpg"
  if (combined.match(/удирд|leader|манаж/)) return "/covers/leadership.jpg"
  return "/covers/default.jpg"
}

// ── Test Card ─────────────────────────────────────────────────────────────────

const CARD_W = 200

function TestCard({ test, index = 0, fontSize }: { test: Test; index?: number; fontSize: number }) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const cover = getCoverImage(test)

  return (
    <a
      href={test.url}
      target="_blank"
      rel="noopener noreferrer"
      className="hw-card"
      style={{
        display: "flex", flexDirection: "column",
        background: "#fff",
        border: "1px solid #EEEAE8", borderRadius: 16,
        overflow: "hidden", textDecoration: "none",
        width: CARD_W, minWidth: CARD_W, maxWidth: CARD_W, flexShrink: 0,
        animation: `hw-card-in 0.42s cubic-bezier(.34,1.56,.64,1) ${index * 0.09}s both`,
      }}
    >
      {/* Cover image header */}
      <div style={{
        height: 90, position: "relative", overflow: "hidden",
        background: test.color || "#FEF3EE",
      }}>
        <img
          src={cover}
          alt={test.name}
          onLoad={() => setImgLoaded(true)}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            opacity: imgLoaded ? 1 : 0,
            transition: "opacity 0.4s ease",
            display: "block",
          }}
        />
        {/* Gradient overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(160deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.28) 100%)",
        }} />
        {/* Emoji badge */}
        <div style={{
          position: "absolute", top: 8, right: 9,
          fontSize: 18, lineHeight: 1,
          background: "rgba(255,255,255,.18)",
          backdropFilter: "blur(6px)",
          borderRadius: 8, padding: "4px 6px",
          border: "1px solid rgba(255,255,255,.25)",
        }}>{test.emoji || "📋"}</div>

        {/* Free badge */}
        {test.free && (
          <div style={{
            position: "absolute", bottom: 8, left: 9,
            background: "rgba(255,255,255,.95)",
            color: "#059669", fontSize: 9, fontWeight: 700,
            padding: "2px 8px", borderRadius: 20,
            letterSpacing: "0.3px",
          }}>ҮНЭГҮЙ</div>
        )}
        {test.count && test.count > 0 && (
          <div style={{
            position: "absolute", bottom: 8, right: 9,
            background: "rgba(0,0,0,.45)",
            backdropFilter: "blur(4px)",
            color: "#fff", fontSize: 9, fontWeight: 600,
            padding: "2px 7px", borderRadius: 20,
          }}>{test.count.toLocaleString()}+ авсан</div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "10px 12px 12px", display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{
          fontSize: fontSize - 1, fontWeight: 700, color: "#111827",
          lineHeight: 1.3, marginBottom: 4,
          overflow: "hidden", textOverflow: "ellipsis",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>{test.name}</div>

        <div style={{
          fontSize: fontSize - 3, color: "#6B7280", lineHeight: 1.45, marginBottom: 10,
          overflow: "hidden", textOverflow: "ellipsis",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>{test.desc}</div>

        <div style={{ marginTop: "auto", paddingTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
          <span style={{
            background: test.free ? "#ECFDF5" : "#FEF3EE",
            color: test.free ? "#059669" : "#E8541A",
            fontSize: fontSize - 3, fontWeight: 700, padding: "3px 9px", borderRadius: 20,
            border: `1px solid ${test.free ? "#A7F3D0" : "#FDDCCC"}`,
          }}>{test.price}</span>
          <span style={{ fontSize: fontSize - 4, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 3 }}>
            <svg width="9" height="9" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="#9CA3AF" strokeWidth="1.5" />
              <path d="M8 5v3l2 1.5" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {test.duration}
          </span>
        </div>

        <div className="hw-cta" style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          background: "linear-gradient(135deg, #E8541A 0%, #F07040 100%)",
          color: "#fff",
          fontSize: fontSize - 2, fontWeight: 700,
          padding: "8px 10px", borderRadius: 10,
          transition: "all 0.2s ease",
          boxShadow: "0 3px 10px rgba(232,84,26,.25)",
        }}>
          Тест авах
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
            <path d="M3 8h10M9 4l4 4-4 4" />
          </svg>
        </div>
        </div>
      </div>
    </a>
  )
}

// ── Category Tabs ────────────────────────────────────────────────────────────

function CategoryTabs({
  categories,
  active,
  onSelect,
  fontSize,
}: {
  categories: string[]
  active: string
  onSelect: (cat: string) => void
  fontSize: number
}) {
  const all = ["Бүгд", ...categories]
  return (
    <div style={{
      display: "flex", gap: 5,
      overflowX: "auto", scrollbarWidth: "none",
      paddingBottom: 4, marginBottom: 6,
    }}>
      {all.map(cat => {
        const isActive = active === cat
        return (
          <button
            key={cat}
            className="hw-tab"
            onClick={() => onSelect(cat)}
            style={{
              flexShrink: 0,
              padding: "5px 12px", borderRadius: 20,
              border: isActive ? "none" : "1.5px solid #F0EAE6",
              background: isActive ? "linear-gradient(135deg,#E8541A,#F07040)" : "#fff",
              color: isActive ? "#fff" : "#6B7280",
              fontSize: fontSize - 3, fontWeight: isActive ? 700 : 500,
              cursor: "pointer", whiteSpace: "nowrap",
              boxShadow: isActive ? "0 3px 10px rgba(232,84,26,.25)" : "none",
            }}
          >
            {cat}
          </button>
        )
      })}
    </div>
  )
}

// ── Test Carousel ─────────────────────────────────────────────────────────────

function TestCarousel({ tests, categories, fontSize }: { tests: Test[]; categories: string[]; fontSize: number }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeCategory, setActiveCategory] = useState("Бүгд")
  const [activeDot, setActiveDot] = useState(0)

  // Filter tests by active category
  const filtered = activeCategory === "Бүгд"
    ? tests
    : tests.filter(t => (t.category || "") === activeCategory)

  const check = () => {
    if (!scrollRef.current) return
    const { scrollLeft } = scrollRef.current
    setActiveDot(Math.round(scrollLeft / (CARD_W + 10)))
  }

  useEffect(() => {
    setActiveCategory("Бүгд")
    setActiveDot(0)
    scrollRef.current?.scrollTo({ left: 0 })
  }, [tests])

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -(CARD_W + 10) : (CARD_W + 10), behavior: "smooth" })
    setTimeout(check, 350)
  }

  const handleCategorySelect = (cat: string) => {
    setActiveCategory(cat)
    setActiveDot(0)
    setTimeout(() => scrollRef.current?.scrollTo({ left: 0 }), 10)
  }

  if (tests.length === 0) return null

  const showArrows = filtered.length > 1

  return (
    <div>
      {/* Category filter tabs — only show if >1 category */}
      {categories.length > 1 && (
        <CategoryTabs
          categories={categories}
          active={activeCategory}
          onSelect={handleCategorySelect}
          fontSize={fontSize}
        />
      )}

      <div style={{ position: "relative" }}>
        {showArrows && (
          <button onClick={() => scroll("left")} style={{
            position: "absolute", left: -10, top: "45%", transform: "translateY(-50%)",
            width: 26, height: 26, borderRadius: "50%",
            background: "#fff", border: "1px solid #F0EAE6",
            boxShadow: "0 2px 8px rgba(0,0,0,.12)",
            cursor: "pointer", zIndex: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="#E8541A" strokeWidth="2.5" strokeLinecap="round">
              <path d="M10 4l-4 4 4 4" />
            </svg>
          </button>
        )}
        {showArrows && (
          <button onClick={() => scroll("right")} style={{
            position: "absolute", right: -10, top: "45%", transform: "translateY(-50%)",
            width: 26, height: 26, borderRadius: "50%",
            background: "#fff", border: "1px solid #F0EAE6",
            boxShadow: "0 2px 8px rgba(0,0,0,.12)",
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
          onScroll={check}
          style={{
            display: "flex", gap: 10,
            overflowX: "auto", overflowY: "hidden",
            scrollSnapType: "x mandatory",
            paddingBottom: 4, paddingTop: 2,
            paddingLeft: 2, paddingRight: 2,
            scrollbarWidth: "none",
          }}
        >
          {filtered.map((test, i) => (
            <div key={test.id} style={{ scrollSnapAlign: "start", flexShrink: 0 }}>
              <TestCard test={test} index={i} fontSize={fontSize} />
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      {filtered.length > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 8 }}>
          {filtered.slice(0, Math.min(filtered.length, 8)).map((_, i) => (
            <div key={i} style={{
              width: i === activeDot ? 16 : 5, height: 5, borderRadius: 3,
              background: i === activeDot ? "#E8541A" : "#F0D8CE",
              transition: "all 0.25s cubic-bezier(.34,1.56,.64,1)",
            }} />
          ))}
          {filtered.length > 8 && (
            <span style={{ fontSize: 10, color: "#9CA3AF", marginLeft: 2 }}>+{filtered.length - 8}</span>
          )}
        </div>
      )}
    </div>
  )
}

// ── Bot Message ───────────────────────────────────────────────────────────────

function BotMessage({ message, fontSize }: { message: Message; fontSize: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Text bubble */}
      {message.content && (
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", animation: "hw-slide-up 0.35s ease-out" }}>
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

      {/* Test carousel — categories managed inside TestCarousel */}
      {message.tests && message.tests.length > 0 && (
        <div style={{ marginLeft: 38, marginTop: 2, animation: "hw-slide-up 0.45s ease-out 0.1s both" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{
              fontSize: fontSize - 2, fontWeight: 700, color: "#6B7280",
              letterSpacing: 0.3, textTransform: "uppercase",
            }}>
              {message.tests.length === 1 ? "Санал болгох тест" : "Санал болгох тестүүд"}
            </span>
            <span style={{
              background: "linear-gradient(135deg,#E8541A,#F07040)",
              color: "#fff", fontSize: fontSize - 3, fontWeight: 700,
              padding: "1px 8px", borderRadius: 20,
            }}>
              {message.tests.length}
            </span>
          </div>

          <TestCarousel
            tests={message.tests}
            categories={message.categories || []}
            fontSize={fontSize}
          />
        </div>
      )}
    </div>
  )
}

// ── User Message ──────────────────────────────────────────────────────────────

function UserMessage({ content, fontSize }: { content: string; fontSize: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <div style={{
        maxWidth: "80%", background: "#E8541A", color: "#fff",
        borderRadius: 14, borderBottomRightRadius: 3,
        padding: "10px 14px",
        fontSize: fontSize, lineHeight: 1.6, wordBreak: "break-word",
        boxShadow: "0 2px 8px rgba(232,84,26,.2)",
      }}>
        {content}
      </div>
    </div>
  )
}

// ── Main Widget ───────────────────────────────────────────────────────────────

export function HireMnChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [fontSize, setFontSize] = useState(13)
  const [showFontSlider, setShowFontSlider] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Сайн байна уу!\n\nБи hire.mn-ий ухаалаг туслагч. Ямар тест авах, хэрхэн сонгох талаар асуугаарай — тохирох тестийг санал болгоно.",
    },
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
    const userMsg: Message = { role: "user", content: text }
    setMessages(prev => [...prev, userMsg])
    setInput("")
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
        content: data.reply || "Уучлаарай, хариу авч чадсангүй.",
        tests: data.tests || [],
        categories: data.categories || [],
      }])
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      let friendly = "Уучлаарай, холболтын алдаа гарлаа."
      if (msg.includes("credit card") || msg.includes("AI Gateway"))
        friendly = "AI үйлчилгээ одоогоор идэвхгүй байна."
      else if (msg.includes("rate limit"))
        friendly = "Хэт олон хүсэлт. Түр хүлээгээд дахин оролдоно уу."
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
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700&display=swap');
        .hw-root, .hw-root * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important; box-sizing: border-box; }

        @keyframes hw-bounce {
          0%, 60%, 100% { transform: translateY(0) scaleY(1); }
          30% { transform: translateY(-6px) scaleY(0.9); }
        }
        @keyframes hw-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          33% { transform: translateY(-2px) rotate(-1deg); }
          66% { transform: translateY(-3px) rotate(1deg); }
        }
        @keyframes hw-pop {
          from { transform: scale(0.88) translateY(8px); opacity: 0; }
          60%  { transform: scale(1.02) translateY(-1px); opacity: 1; }
          to   { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes hw-card-in {
          from { transform: scale(0.88) translateY(14px) rotate(-1deg); opacity: 0; }
          70%  { transform: scale(1.02) translateY(-2px) rotate(0deg); opacity: 1; }
          to   { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes hw-slide-up {
          from { transform: translateY(16px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes hw-chat-open {
          from { opacity: 0; transform: scale(0.88) translateY(20px); transform-origin: bottom right; }
          65%  { transform: scale(1.02) translateY(-3px); transform-origin: bottom right; }
          to   { opacity: 1; transform: scale(1) translateY(0); transform-origin: bottom right; }
        }
        @keyframes hw-pulse {
          0%, 100% { box-shadow: 0 6px 22px rgba(232,84,26,.35), 0 0 0 0 rgba(232,84,26,.3); }
          50%       { box-shadow: 0 6px 22px rgba(232,84,26,.35), 0 0 0 11px rgba(232,84,26,0); }
        }
        @keyframes hw-chip-in {
          from { transform: scale(0.8) translateY(6px); opacity: 0; }
          to   { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes hw-ring {
          0%   { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes hw-tooltip-in {
          from { opacity: 0; transform: translateX(6px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .hw-msg { animation: hw-pop 0.38s cubic-bezier(.34,1.56,.64,1) both; }

        .hw-card {
          transition: transform 0.25s cubic-bezier(.34,1.56,.64,1), box-shadow 0.25s ease, border-color 0.2s ease;
          will-change: transform;
        }
        .hw-card:hover {
          transform: translateY(-4px) scale(1.018);
          box-shadow: 0 16px 32px rgba(232,84,26,.18), 0 4px 12px rgba(0,0,0,.08);
          border-color: #F5C8B8 !important;
        }
        .hw-card:hover .hw-cta {
          background: linear-gradient(135deg, #D44810 0%, #E8541A 100%) !important;
          box-shadow: 0 5px 16px rgba(232,84,26,.4) !important;
          transform: translateY(-1px);
        }
        .hw-cta { transition: all 0.2s cubic-bezier(.34,1.56,.64,1); }

        .hw-chip {
          transition: all 0.2s cubic-bezier(.34,1.56,.64,1);
        }
        .hw-chip:hover {
          background: #E8541A !important;
          color: #fff !important;
          border-color: #E8541A !important;
          transform: translateY(-2px) scale(1.04);
          box-shadow: 0 4px 12px rgba(232,84,26,.25);
        }
        .hw-chip:active { transform: scale(0.97); }

        .hw-send { transition: all 0.18s cubic-bezier(.34,1.56,.64,1); }
        .hw-send:hover:not(:disabled) {
          background: linear-gradient(135deg, #D44810 0%, #E8541A 100%) !important;
          transform: scale(1.06);
          box-shadow: 0 5px 16px rgba(232,84,26,.35) !important;
        }
        .hw-send:active:not(:disabled) { transform: scale(0.93); }

        .hw-mascot {
          transition: transform 0.25s cubic-bezier(.34,1.56,.64,1), box-shadow 0.25s ease;
          animation: hw-pulse 2.8s ease-in-out infinite;
          will-change: transform;
        }
        .hw-mascot:hover {
          transform: scale(1.1) translateY(-2px);
          animation: none;
          box-shadow: 0 10px 30px rgba(232,84,26,.45) !important;
        }
        .hw-mascot:active { transform: scale(0.95); }

        .hw-scroll::-webkit-scrollbar { width: 3px; }
        .hw-scroll::-webkit-scrollbar-track { background: transparent; }
        .hw-scroll::-webkit-scrollbar-thumb { background: rgba(232,84,26,.15); border-radius: 3px; }
        .hw-scroll::-webkit-scrollbar-thumb:hover { background: rgba(232,84,26,.3); }

        .hw-font-slider { -webkit-appearance: none; width: 100%; height: 3px; border-radius: 2px; outline: none; cursor: pointer;
          background: linear-gradient(to right, #E8541A calc((var(--val) - 11) / 6 * 100%), #F0E4DF calc((var(--val) - 11) / 6 * 100%));
        }
        .hw-font-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 15px; height: 15px; border-radius: 50%; background: #E8541A; border: 2.5px solid #fff; box-shadow: 0 2px 6px rgba(232,84,26,.4); cursor: pointer; transition: transform 0.15s; }
        .hw-font-slider::-webkit-slider-thumb:hover { transform: scale(1.2); }
        .hw-font-slider::-moz-range-thumb { width: 15px; height: 15px; border-radius: 50%; background: #E8541A; border: 2.5px solid #fff; cursor: pointer; }

        .hw-tab { transition: all 0.18s cubic-bezier(.34,1.56,.64,1); }
        .hw-tab:hover { transform: translateY(-1px); }

        /* Robot mascot keyframes */
        @keyframes rb-blink {
          0%, 90%, 100% { transform: scaleY(1); }
          95%            { transform: scaleY(0.1); }
        }
        @keyframes rb-led {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.3; transform: scale(0.7); }
        }
        @keyframes rb-arm-l {
          0%, 100% { transform: rotate(-12deg); }
          50%       { transform: rotate(12deg); }
        }
        @keyframes rb-arm-r {
          0%, 100% { transform: rotate(12deg); }
          50%       { transform: rotate(-12deg); }
        }
        @keyframes rb-leg-l {
          0%, 100% { transform: rotate(-8deg) translateY(0px); }
          50%       { transform: rotate(8deg) translateY(-2px); }
        }
        @keyframes rb-leg-r {
          0%, 100% { transform: rotate(8deg) translateY(-2px); }
          50%       { transform: rotate(-8deg) translateY(0px); }
        }
        @keyframes rb-shadow {
          0%, 100% { transform: scaleX(1); opacity: 0.12; }
          50%       { transform: scaleX(0.8); opacity: 0.06; }
        }

        @media (max-width: 480px) {
          .hw-panel {
            position: fixed !important;
            inset: 0 !important;
            width: 100vw !important;
            height: 100dvh !important;
            border-radius: 0 !important;
            bottom: 0 !important;
            right: 0 !important;
          }
        }
      `}</style>

      <div className="hw-root" style={{
        position: "fixed", bottom: 20, right: 20, zIndex: 99999,
        display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12,
      }}>

        {/* ── Chat panel ── */}
        {isOpen && (
          <div style={{ animation: "hw-chat-open 0.28s cubic-bezier(.34,1.56,.64,1)" }}>
            <div className="hw-panel" style={{
              width: 360,
              height: "min(560px, calc(100vh - 110px))",
              borderRadius: 20,
              background: "#FAFAFA",
              boxShadow: "0 24px 64px rgba(0,0,0,.16), 0 4px 16px rgba(0,0,0,.08)",
              display: "flex", flexDirection: "column", overflow: "hidden",
              border: "1px solid rgba(0,0,0,.07)",
            }}>

              {/* ── Header ── */}
              <div style={{
                background: "#fff",
                padding: "0 14px 0 16px",
                height: 68,
                display: "flex", alignItems: "center", gap: 11,
                flexShrink: 0, position: "relative",
                borderBottom: "1px solid #F0EBE7",
              }}>
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 3,
                  background: "linear-gradient(90deg, #E8541A 0%, #F5A07A 100%)",
                  borderRadius: "20px 20px 0 0",
                }} />

                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "linear-gradient(135deg,#FF6535,#E8541A)",
                  border: "2px solid rgba(255,255,255,.9)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 4px 14px rgba(232,84,26,.35)",
                  animation: "hw-float 3s ease-in-out infinite",
                }}>
                  <MascotRobot size={26} white />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ color: "#111", fontWeight: 700, fontSize: 14, letterSpacing: "-0.2px" }}>
                      hire.mn
                    </span>
                    <span style={{
                      fontSize: 9.5, fontWeight: 700, letterSpacing: "0.6px",
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
                    Онлайн · Туслахад бэлэн
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
                  <button
                    onClick={() => setShowFontSlider(s => !s)}
                    title="Үсгийн хэмжээ"
                    style={{
                      width: 30, height: 30, borderRadius: 8,
                      background: showFontSlider ? "#FEF3EE" : "transparent",
                      border: `1px solid ${showFontSlider ? "#FDDCCC" : "transparent"}`,
                      color: showFontSlider ? "#E8541A" : "#9CA3AF",
                      cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all .15s",
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M4 20h4M6 20V7M14 20h4M16 20V4" />
                    </svg>
                  </button>

                  <button
                    onClick={() => setLang(l => l === "МН" ? "EN" : "МН")}
                    style={{
                      height: 30, paddingLeft: 9, paddingRight: 9, borderRadius: 8,
                      background: "transparent", border: "1px solid transparent",
                      color: "#9CA3AF", fontSize: 11, fontWeight: 600, cursor: "pointer",
                      transition: "all .15s",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = "#F5F5F5"
                        ; (e.currentTarget as HTMLElement).style.color = "#333"
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = "transparent"
                        ; (e.currentTarget as HTMLElement).style.color = "#9CA3AF"
                    }}
                  >
                    {lang === "МН" ? "EN" : "МН"}
                  </button>

                  <button
                    onClick={() => setIsOpen(false)}
                    style={{
                      width: 30, height: 30, borderRadius: 8,
                      background: "transparent", border: "1px solid transparent",
                      color: "#9CA3AF", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all .15s",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = "#FEF2F2"
                        ; (e.currentTarget as HTMLElement).style.color = "#EF4444"
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = "transparent"
                        ; (e.currentTarget as HTMLElement).style.color = "#9CA3AF"
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Font slider */}
              {showFontSlider && (
                <div style={{
                  background: "#FAFAFA", borderBottom: "1px solid #F0EBE7",
                  padding: "10px 16px", flexShrink: 0,
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <span style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, minWidth: 18 }}>A</span>
                  <input
                    type="range" min={11} max={17} step={1}
                    value={fontSize}
                    onChange={e => setFontSize(Number(e.target.value))}
                    className="hw-font-slider"
                    style={{ "--val": fontSize } as React.CSSProperties}
                  />
                  <span style={{ fontSize: 15, color: "#9CA3AF", fontWeight: 600, minWidth: 14 }}>A</span>
                  <span style={{ fontSize: 10, color: "#C0B0A8", minWidth: 28, textAlign: "right" }}>{fontSize}px</span>
                </div>
              )}

              {/* ── Messages ── */}
              <div className="hw-scroll" style={{
                flex: 1, overflowY: "auto", padding: "14px 13px 8px",
                display: "flex", flexDirection: "column", gap: 10, background: "#FAFAFA",
              }}>
                {messages.map((msg, i) => (
                  <div key={i} className="hw-msg">
                    {msg.role === "assistant"
                      ? <BotMessage message={msg} fontSize={fontSize} />
                      : <UserMessage content={msg.content} fontSize={fontSize} />
                    }
                  </div>
                ))}

                {isTyping && (
                  <div className="hw-msg">
                    <TypingIndicator />
                  </div>
                )}

                {showQuickReplies && !isTyping && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 6 }}>
                    {QUICK_REPLIES.map((qr, i) => (
                      <button
                        key={qr}
                        className="hw-chip"
                        onClick={() => sendMessage(qr)}
                        style={{
                          background: "#fff",
                          border: "1.5px solid #F0C4AD",
                          color: "#E8541A",
                          borderRadius: 20, padding: "7px 13px",
                          fontSize: fontSize - 1, fontWeight: 600,
                          cursor: "pointer", whiteSpace: "nowrap",
                          animation: `hw-chip-in 0.32s cubic-bezier(.34,1.56,.64,1) ${i * 0.07}s both`,
                          boxShadow: "0 2px 6px rgba(232,84,26,.08)",
                        }}
                      >
                        {qr}
                      </button>
                    ))}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* ── Input ── */}
              <div style={{
                padding: "10px 12px 12px", borderTop: "1px solid #EDE8E5",
                background: "#fff", flexShrink: 0,
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
                      flex: 1, border: "1.5px solid #EDDFDA", borderRadius: 12,
                      padding: "9px 12px", fontSize: fontSize, outline: "none",
                      resize: "none", maxHeight: 88, lineHeight: 1.5,
                      color: "#1A1A1A", background: "#FDFCFC",
                      transition: "border-color .15s",
                    }}
                    onFocus={e => (e.target.style.borderColor = "#E8541A")}
                    onBlur={e => (e.target.style.borderColor = "#EDDFDA")}
                  />
                  <button
                    className="hw-send"
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || isTyping}
                    style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: input.trim() && !isTyping ? "#E8541A" : "#E8D5CF",
                      border: "none",
                      cursor: input.trim() && !isTyping ? "pointer" : "not-allowed",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, transition: "background .15s, transform .12s",
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

        {/* ── Mascot button ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isHovered && !isOpen && (
            <div style={{
              animation: "hw-tooltip-in 0.18s ease-out",
              background: "#1A1A1A", borderRadius: 12,
              padding: "10px 14px",
              boxShadow: "0 8px 24px rgba(0,0,0,.15)",
              maxWidth: 195, pointerEvents: "none", position: "relative",
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

          {/* Pulsing ring */}
          {!isOpen && (
            <div style={{
              position: "absolute", bottom: 0, right: 0, pointerEvents: "none",
              width: 56, height: 56, borderRadius: "50%",
              background: "rgba(232,84,26,.22)",
              animation: "hw-ring 2.4s ease-out infinite",
            }} />
          )}

          <button
            className="hw-mascot"
            onClick={() => setIsOpen(o => !o)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            aria-label="hire.mn чат нээх"
            style={{
              width: 60, height: 60, borderRadius: "50%",
              background: "linear-gradient(145deg, #FF6535, #E8541A, #C93D00)",
              border: "3px solid rgba(255,255,255,.95)",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, position: "relative",
              boxShadow: "0 8px 24px rgba(232,84,26,.45), inset 0 1px 0 rgba(255,255,255,.2)",
            }}
          >
            <div style={{
              transition: "transform 0.35s cubic-bezier(.34,1.56,.64,1), opacity 0.2s",
              transform: isOpen ? "rotate(90deg) scale(0.85)" : "rotate(0deg) scale(1)",
            }}>
              {isOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              ) : (
                <MascotRobot size={34} white />
              )}
            </div>
            {!isOpen && (
              <span style={{
                position: "absolute", bottom: 2, right: 2,
                width: 14, height: 14, borderRadius: "50%",
                background: "#22C55E", border: "2.5px solid #fff",
                boxShadow: "0 0 0 2px rgba(34,197,94,.3)",
                animation: "rb-led 2.5s ease-in-out infinite",
              }} />
            )}
          </button>
        </div>

      </div>
    </>
  )
}
