"use client"

import { useState, useRef, useEffect, lazy, Suspense } from "react"
import { MessageFeedback } from './message-feedback'
import { ConversationSidebar } from './conversation-sidebar'
import { 
  Conversation, 
  createNewConversation, 
  getActiveConversation, 
  setActiveConversation,
  canSendMessage,
  getRemainingMessages,
  saveConversation,
  generateConversationTitle
} from '@/lib/conversation-storage'

// Lazy load 3D mascot to avoid SSR issues
const ChatMascot3D = lazy(() => import('./chat-mascot-3d'))

// ── Types ─────────────────────────────────────────────────────────────────────

interface TeamMember {
  id: string
  name: string
  role: string
  roleColor: string
  description: string
  image: string
  category: 'founder' | 'system' | 'test'
}

interface TeamCategory {
  label: string
  icon: string
  color: string
  members: TeamMember[]
}

interface Message {
  role: "user" | "assistant"
  content: string
  tests?: Test[]
  categories?: string[]
  teamCategories?: TeamCategory[]
  companyInfo?: boolean
}

interface InitialContext {
  type: 'exam-result'
  data: {
    assessmentName: string
    score: number
    interpretation: string
    advice: string
  }
}

interface HireMnChatWidgetProps {
  initialContext?: InitialContext
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
  image?: string
}

// ── Quick replies with icons ──────────────────────────────────────────────────

const QUICK_REPLIES = [
  { text: "Бүх тест харах", icon: "📋" },
  { text: "Надад тохирох тест хэл", icon: "🎯" },
  { text: "Үнэгүй тестүүд", icon: "🆓" },
  { text: "Hire.mn тухай", icon: "ℹ️" },
]

// ── Animated Mascot Robot ─────────────────────────────────────────────────────

function MascotRobot({ size = 48, white = false, waving = false }: { size?: number; white?: boolean; waving?: boolean }) {
  const [eyePos, setEyePos] = useState({ x: 0, y: 0 })
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth - 60
      const centerY = window.innerHeight - 60
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX)
      const distance = 2.2
      setEyePos({
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
      })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])
  
  const primary = white ? "#fff" : "#E8541A"
  const fill = white ? "rgba(255,255,255,0.3)" : "rgba(247,200,180,0.6)"
  const stroke = white ? "#fff" : "#E8541A"
  
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" style={{ overflow: "visible" }}>
      {/* Main brain shape - smooth organic form like hire.mn */}
      <path 
        d="M50 8 
           C25 8 12 25 12 45 
           C12 52 14 58 18 63
           C14 68 12 74 15 80
           C18 86 28 90 38 88
           C42 92 46 94 50 94
           C54 94 58 92 62 88
           C72 90 82 86 85 80
           C88 74 86 68 82 63
           C86 58 88 52 88 45
           C88 25 75 8 50 8Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="2.5"
      />
      
      {/* Left hemisphere curves - smooth elegant folds */}
      <path d="M28 25 Q22 32 26 40" stroke={stroke} strokeWidth="2" fill="none" opacity="0.5" strokeLinecap="round" />
      <path d="M24 38 Q18 48 24 58" stroke={stroke} strokeWidth="2" fill="none" opacity="0.45" strokeLinecap="round" />
      <path d="M30 50 Q24 58 30 68" stroke={stroke} strokeWidth="1.8" fill="none" opacity="0.4" strokeLinecap="round" />
      
      {/* Right hemisphere curves - smooth elegant folds */}
      <path d="M72 25 Q78 32 74 40" stroke={stroke} strokeWidth="2" fill="none" opacity="0.5" strokeLinecap="round" />
      <path d="M76 38 Q82 48 76 58" stroke={stroke} strokeWidth="2" fill="none" opacity="0.45" strokeLinecap="round" />
      <path d="M70 50 Q76 58 70 68" stroke={stroke} strokeWidth="1.8" fill="none" opacity="0.4" strokeLinecap="round" />
      
      {/* Center division - gentle curve */}
      <path d="M50 18 Q48 35 50 50 Q52 65 50 80" 
        stroke={stroke} strokeWidth="1.5" fill="none" opacity="0.35" strokeLinecap="round" />
      
      {/* Left Eye - cursor tracking */}
      <g>
        <ellipse cx="36" cy="42" rx="8" ry="9" fill="rgba(255,255,255,0.95)" stroke={stroke} strokeWidth="1.5" />
        <circle 
          cx={36 + eyePos.x} 
          cy={42 + eyePos.y} 
          r="4.5" 
          fill={primary}
          style={{ transition: "cx 0.08s ease-out, cy 0.08s ease-out" }}
        />
        <circle cx={37 + eyePos.x * 0.3} cy={40 + eyePos.y * 0.3} r="1.5" fill={white ? primary : "#fff"} />
      </g>
      
      {/* Right Eye - cursor tracking */}
      <g>
        <ellipse cx="64" cy="42" rx="8" ry="9" fill="rgba(255,255,255,0.95)" stroke={stroke} strokeWidth="1.5" />
        <circle 
          cx={64 + eyePos.x} 
          cy={42 + eyePos.y} 
          r="4.5" 
          fill={primary}
          style={{ transition: "cx 0.08s ease-out, cy 0.08s ease-out" }}
        />
        <circle cx={65 + eyePos.x * 0.3} cy={40 + eyePos.y * 0.3} r="1.5" fill={white ? primary : "#fff"} />
      </g>
      
      {/* Subtle glow pulse */}
      <path 
        d="M50 8 C25 8 12 25 12 45 C12 52 14 58 18 63 C14 68 12 74 15 80 C18 86 28 90 38 88 C42 92 46 94 50 94 C54 94 58 92 62 88 C72 90 82 86 85 80 C88 74 86 68 82 63 C86 58 88 52 88 45 C88 25 75 8 50 8Z"
        fill="none"
        stroke={stroke}
        strokeWidth="1"
        opacity="0.25"
      >
        <animate attributeName="opacity" values="0.15;0.4;0.15" dur="3s" repeatCount="indefinite" />
      </path>
    </svg>
  )
}

// ── Brain Avatar for messages ─────────────────────────────────────────────────

function BrainAvatar() {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: 10,
      background: "linear-gradient(145deg, #FEF3EE, #FFE8DC)",
      border: "1.5px solid #FDDCCC",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
      boxShadow: "0 2px 8px rgba(232,84,26,0.12)",
    }}>
      <MascotRobot size={22} />
    </div>
  )
}

// ── Typing indicator ──────────────────────────────���───────────────────────────

function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
      <BrainAvatar />
      <div style={{
        background: "#fff", border: "1px solid #F0EAE6",
        borderRadius: 16, borderBottomLeftRadius: 4,
        padding: "12px 16px",
        display: "flex", gap: 5, alignItems: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,.04)",
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 8, height: 8, 
            background: "linear-gradient(135deg, #E8541A, #F5A07A)",
            borderRadius: "50%",
            animation: `hw-bounce 1.4s ease-in-out ${i * 0.15}s infinite`,
          }} />
        ))}
      </div>
    </div>
  )
}

// ── Cover image picker ────────────────────────────────────────────────────────

function getCoverImage(test: Test): string {
  // Use test-specific AI-generated image if available
  if (test.image) return test.image
  
  // Fallback to category-based images
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
        border: "1.5px solid #F0EBE8", borderRadius: 18,
        overflow: "hidden", textDecoration: "none",
        width: CARD_W, minWidth: CARD_W, maxWidth: CARD_W, flexShrink: 0,
        animation: `hw-card-in 0.45s cubic-bezier(.34,1.56,.64,1) ${index * 0.08}s both`,
      }}
    >
      {/* Cover image header */}
      <div style={{
        height: 95, position: "relative", overflow: "hidden",
        background: `linear-gradient(135deg, ${test.color || "#FEF3EE"}, ${test.color || "#FFE8DC"})`,
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
          background: "linear-gradient(160deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.35) 100%)",
        }} />
        
        {/* Emoji badge */}
        <div style={{
          position: "absolute", top: 8, right: 8,
          fontSize: 20, lineHeight: 1,
          background: "rgba(255,255,255,.2)",
          backdropFilter: "blur(8px)",
          borderRadius: 10, padding: "5px 7px",
          border: "1px solid rgba(255,255,255,.3)",
        }}>{test.emoji || "📋"}</div>

        {/* Free badge */}
        {test.free && (
          <div style={{
            position: "absolute", bottom: 8, left: 8,
            background: "rgba(255,255,255,.95)",
            color: "#059669", fontSize: 9, fontWeight: 700,
            padding: "3px 10px", borderRadius: 20,
            letterSpacing: "0.4px",
            boxShadow: "0 2px 8px rgba(0,0,0,.1)",
          }}>ҮНЭГҮЙ</div>
        )}
        
        {test.count && test.count > 0 && (
          <div style={{
            position: "absolute", bottom: 8, right: 8,
            background: "rgba(0,0,0,.5)",
            backdropFilter: "blur(4px)",
            color: "#fff", fontSize: 9, fontWeight: 600,
            padding: "3px 8px", borderRadius: 20,
          }}>{test.count.toLocaleString()}+ авсан</div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{
          fontSize: fontSize, fontWeight: 700, color: "#111827",
          lineHeight: 1.35, marginBottom: 6,
          overflow: "hidden", textOverflow: "ellipsis",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>{test.name}</div>

        <div style={{
          fontSize: fontSize - 2, color: "#6B7280", lineHeight: 1.5, marginBottom: 12,
          overflow: "hidden", textOverflow: "ellipsis",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>{test.desc}</div>

        <div style={{ marginTop: "auto", paddingTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{
              background: test.free ? "linear-gradient(135deg, #ECFDF5, #D1FAE5)" : "linear-gradient(135deg, #FEF3EE, #FFE8DC)",
              color: test.free ? "#059669" : "#E8541A",
              fontSize: fontSize - 2, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
              border: `1.5px solid ${test.free ? "#A7F3D0" : "#FDDCCC"}`,
            }}>{test.price}</span>
            <span style={{ fontSize: fontSize - 3, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 4 }}>
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="#9CA3AF" strokeWidth="1.5" />
                <path d="M8 5v3l2 1.5" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {test.duration}
            </span>
          </div>

          <div className="hw-cta" style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            background: "linear-gradient(135deg, #E8541A 0%, #F07040 100%)",
            color: "#fff",
            fontSize: fontSize - 1, fontWeight: 700,
            padding: "10px 12px", borderRadius: 12,
            transition: "all 0.2s ease",
            boxShadow: "0 4px 12px rgba(232,84,26,.25)",
          }}>
            Тест авах
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </div>
        </div>
      </div>
    </a>
  )
}

// ── Test Carousel ─────────────────────────────────────────────────────────────

function TestCarousel({ tests, categories, fontSize }: { tests: Test[]; categories: string[]; fontSize: number }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeCategory, setActiveCategory] = useState("Бүгд")
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "paid">("all")
  const [priceDropdownOpen, setPriceDropdownOpen] = useState(false)
  const [activeDot, setActiveDot] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // First filter by category
  const categoryFiltered = activeCategory === "Бүгд"
    ? tests
    : tests.filter(t => (t.category || "") === activeCategory)
  
  // Then filter by price
  const filtered = priceFilter === "all"
    ? categoryFiltered
    : priceFilter === "free"
      ? categoryFiltered.filter(t => t.free === true)
      : categoryFiltered.filter(t => t.free !== true)

  // Count for tabs
  const freeCount = categoryFiltered.filter(t => t.free === true).length
  const paidCount = categoryFiltered.filter(t => t.free !== true).length

  // Close dropdown on outside click
  useEffect(() => {
    if (!priceDropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setPriceDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [priceDropdownOpen])

  const check = () => {
    if (!scrollRef.current) return
    const { scrollLeft } = scrollRef.current
    setActiveDot(Math.round(scrollLeft / (CARD_W + 10)))
  }

  useEffect(() => {
    setActiveCategory("Бүгд")
    setPriceFilter("all")
    setActiveDot(0)
    scrollRef.current?.scrollTo({ left: 0 })
  }, [tests])

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -(CARD_W + 10) : (CARD_W + 10), behavior: "smooth" })
    setTimeout(check, 350)
  }

  const handleCategorySelect = (cat: string) => {
    setActiveCategory(cat)
    setPriceFilter("all")
    setActiveDot(0)
    setTimeout(() => scrollRef.current?.scrollTo({ left: 0 }), 10)
  }

  const handlePriceFilter = (filter: "all" | "free" | "paid") => {
    setPriceFilter(filter)
    setActiveDot(0)
    setTimeout(() => scrollRef.current?.scrollTo({ left: 0 }), 10)
  }

  if (tests.length === 0) return null

  const showArrows = filtered.length > 1

  const hasBothPriceTypes = freeCount > 0 && paidCount > 0

  return (
    <div>
      {/* Category tabs — always on top */}
      {categories.length > 1 && (
        <div style={{
          display: "flex", gap: 5,
          overflowX: "auto", scrollbarWidth: "none",
          marginBottom: 10,
        }}>
          {["Бүгд", ...categories].map(cat => {
            const isActive = activeCategory === cat
            return (
              <button
                key={cat}
                className="hw-tab"
                onClick={() => handleCategorySelect(cat)}
                style={{
                  flexShrink: 0,
                  padding: "6px 12px", borderRadius: 10, border: "none",
                  background: isActive ? "linear-gradient(135deg,#E8541A,#F07040)" : "rgba(0,0,0,.05)",
                  color: isActive ? "#fff" : "#6B7280",
                  fontSize: fontSize - 2, fontWeight: 600,
                  cursor: "pointer", whiteSpace: "nowrap",
                  boxShadow: isActive ? "0 2px 8px rgba(232,84,26,.2)" : "none",
                  transition: "all 0.2s ease",
                }}
              >
                {cat}
              </button>
            )
          })}
        </div>
      )}

      <div style={{ position: "relative" }}>
        {showArrows && (
          <button onClick={() => scroll("left")} className="hw-arrow" style={{
            position: "absolute", left: -12, top: "45%", transform: "translateY(-50%)",
            width: 28, height: 28, borderRadius: "50%",
            background: "#fff", border: "1.5px solid #F0EAE6",
            boxShadow: "0 2px 10px rgba(0,0,0,.12)",
            cursor: "pointer", zIndex: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#E8541A" strokeWidth="2.5" strokeLinecap="round">
              <path d="M10 4l-4 4 4 4" />
            </svg>
          </button>
        )}
        {showArrows && (
          <button onClick={() => scroll("right")} className="hw-arrow" style={{
            position: "absolute", right: -12, top: "45%", transform: "translateY(-50%)",
            width: 28, height: 28, borderRadius: "50%",
            background: "#fff", border: "1.5px solid #F0EAE6",
            boxShadow: "0 2px 10px rgba(0,0,0,.12)",
            cursor: "pointer", zIndex: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#E8541A" strokeWidth="2.5" strokeLinecap="round">
              <path d="M6 4l4 4-4 4" />
            </svg>
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={check}
          style={{
            display: "flex", gap: 12,
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

      {/* Bottom row: dots (left/center) + price dropdown (right) */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        marginTop: 12,
        minHeight: 28,
      }}>
        {/* Scroll indicator dots */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, flex: 1, justifyContent: "center" }}>
          {filtered.length > 1 && filtered.slice(0, Math.min(filtered.length, 6)).map((_, i) => (
            <div key={i} style={{
              width: i === activeDot ? 18 : 6, height: 6, borderRadius: 6,
              background: i === activeDot
                ? "linear-gradient(90deg, #E8541A, #F07040)"
                : "rgba(232,84,26,.15)",
              transition: "all 0.3s cubic-bezier(.34,1.56,.64,1)",
            }} />
          ))}
          {filtered.length > 6 && (
            <span style={{ fontSize: 9, color: "#9CA3AF", fontWeight: 500 }}>+{filtered.length - 6}</span>
          )}
        </div>

        {/* Price filter dropdown */}
        {hasBothPriceTypes && (
        <div ref={dropdownRef} style={{ 
          position: "relative", flexShrink: 0,
        }}>
          {/* Trigger button */}
          <button
            onClick={() => setPriceDropdownOpen(o => !o)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 10, border: "none",
              background: priceFilter === "free"
                ? "linear-gradient(135deg, #059669, #10B981)"
                : priceFilter === "paid"
                  ? "linear-gradient(135deg, #E8541A, #F07040)"
                  : "#F5F3F1",
              color: priceFilter === "all" ? "#374151" : "#fff",
              fontSize: 11, fontWeight: 700, cursor: "pointer",
              boxShadow: priceFilter !== "all"
                ? priceFilter === "free"
                  ? "0 2px 8px rgba(5,150,105,.25)"
                  : "0 2px 8px rgba(232,84,26,.25)"
                : "none",
              transition: "all 0.2s ease",
            }}
          >
            {/* Color dot */}
            <span style={{
              width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
              background: priceFilter === "free" ? "rgba(255,255,255,.6)"
                : priceFilter === "paid" ? "rgba(255,255,255,.6)"
                : "#9CA3AF",
            }} />
            {priceFilter === "free" ? "Үнэгүй" : priceFilter === "paid" ? "��өлбөртэй" : "Бүгд"}
            {/* Chevron */}
            <svg
              width="10" height="10" viewBox="0 0 16 16" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              style={{ transform: priceDropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}
            >
              <path d="M4 6l4 4 4-4" />
            </svg>
          </button>

          {/* Dropdown panel */}
          {priceDropdownOpen && (
            <div style={{
              position: "absolute", bottom: "calc(100% + 6px)", right: 0,
              background: "#fff",
              borderRadius: 12,
              border: "1.5px solid #F0EAE6",
              boxShadow: "0 8px 24px rgba(0,0,0,.12)",
              overflow: "hidden",
              zIndex: 50,
              minWidth: 130,
              animation: "hw-slide-up 0.15s ease-out",
            }}>
              {[
                { key: "all" as const, label: "Бүгд", count: freeCount + paidCount, dot: "#9CA3AF" },
                { key: "free" as const, label: "Үнэгүй", count: freeCount, dot: "#059669" },
                { key: "paid" as const, label: "Төлбөртэй", count: paidCount, dot: "#E8541A" },
              ].map((f, idx, arr) => (
                <button
                  key={f.key}
                  onClick={() => { handlePriceFilter(f.key); setPriceDropdownOpen(false) }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                    gap: 8, padding: "9px 14px", border: "none",
                    background: priceFilter === f.key ? "#FEF3EE" : "#fff",
                    borderBottom: idx < arr.length - 1 ? "1px solid #F9F5F3" : "none",
                    cursor: "pointer", transition: "background 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: f.dot, flexShrink: 0 }} />
                    <span style={{
                      fontSize: 12, fontWeight: priceFilter === f.key ? 700 : 500,
                      color: priceFilter === f.key ? "#E8541A" : "#374151",
                    }}>{f.label}</span>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 600,
                    color: "#9CA3AF",
                    background: "#F5F3F1",
                    padding: "1px 7px", borderRadius: 8,
                  }}>{f.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  )
}

// ── Bot Message ────────────────────────���──────────────────────────────────────

function BotMessage({ message, fontSize, userQuestion = "" }: { message: Message; fontSize: number; userQuestion?: string }) {
  // Parse [TEST:id] markers
  const parseTestMarkers = (text: string) => {
    const testIds: number[] = []
    const regex = /\[TEST:(\d+)\]/g
    let match
    while ((match = regex.exec(text)) !== null) {
      const id = parseInt(match[1], 10)
      testIds.push(id)
    }
    const cleanText = text.replace(/\s*\[TEST:\d+\]/g, "").trim()
    return { cleanText, testIds }
  }

  // Render formatted text with bold, lists, headings, etc.
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n')
    
    return lines.map((line, lineIdx) => {
      // Check for markdown heading: ### Heading
      const headingMatch = line.match(/^(#{1,3})\s+(.+)$/)
      if (headingMatch) {
        const level = headingMatch[1].length
        const headingText = headingMatch[2]
        const sizes = { 1: 20, 2: 18, 3: 16 }
        return (
          <div key={lineIdx} style={{ 
            marginTop: lineIdx > 0 ? 12 : 0,
            marginBottom: 8,
            fontSize: sizes[level as 1 | 2 | 3],
            fontWeight: 700,
            color: '#E8541A',
            lineHeight: 1.4,
          }}>
            {headingText}
          </div>
        )
      }
      
      // Check if it's a list item
      const isBullet = /^[\-\•\*]\s/.test(line.trim())
      const isNumbered = /^\d+[\.\)]\s/.test(line.trim())
      
      // Parse bold text **text**
      const parts: React.ReactNode[] = []
      let remaining = isBullet ? line.replace(/^[\-\•\*]\s/, '') : isNumbered ? line.replace(/^\d+[\.\)]\s/, '') : line
      let keyIdx = 0
      
      // Match **bold** patterns
      const boldRegex = /\*\*([^*]+)\*\*/g
      let lastIndex = 0
      let match
      
      while ((match = boldRegex.exec(remaining)) !== null) {
        if (match.index > lastIndex) {
          parts.push(<span key={`t-${lineIdx}-${keyIdx++}`}>{remaining.slice(lastIndex, match.index)}</span>)
        }
        parts.push(
          <strong key={`b-${lineIdx}-${keyIdx++}`} style={{ 
            color: '#E8541A', 
            fontWeight: 700,
          }}>
            {match[1]}
          </strong>
        )
        lastIndex = match.index + match[0].length
      }
      
      if (lastIndex < remaining.length) {
        parts.push(<span key={`e-${lineIdx}-${keyIdx++}`}>{remaining.slice(lastIndex)}</span>)
      }
      
      if (parts.length === 0) {
        parts.push(<span key={`l-${lineIdx}`}>{remaining}</span>)
      }
      
      // Render as list item or paragraph
      if (isBullet || isNumbered) {
        return (
          <div key={lineIdx} style={{ 
            display: 'flex', 
            gap: 8, 
            marginTop: lineIdx > 0 ? 8 : 0,
            paddingLeft: 4,
            alignItems: 'flex-start',
          }}>
            <span style={{ 
              color: '#E8541A', 
              fontWeight: 700,
              flexShrink: 0,
              marginTop: 2,
            }}>
              {isNumbered ? line.match(/^\d+/)?.[0] + '.' : '•'}
            </span>
            <span>{parts}</span>
          </div>
        )
      }
      
      // Empty line = paragraph break
      if (line.trim() === '') {
        return <div key={lineIdx} style={{ height: 10 }} />
      }
      
      return (
        <div key={lineIdx} style={{ marginTop: lineIdx > 0 ? 6 : 0 }}>
          {parts}
        </div>
      )
    })
  }

  const { cleanText } = parseTestMarkers(message.content || "")
  
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {cleanText && (
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", animation: "hw-slide-up 0.35s ease-out" }}>
          <BrainAvatar />
          <div style={{
            maxWidth: "80%", background: "#fff",
            border: "1.5px solid #F0EAE6",
            borderRadius: 16, borderBottomLeftRadius: 4,
            padding: "12px 16px",
            fontSize: fontSize, lineHeight: 1.6, color: "#1F2937",
            boxShadow: "0 2px 8px rgba(0,0,0,.04)",
            wordBreak: "break-word",
          }}>
            {renderFormattedText(cleanText)}
          </div>
        </div>
      )}

      {/* Show carousel if message has tests OR if we parsed TEST markers */}
      {(message.tests && message.tests.length > 0) && (
        <div style={{ marginLeft: 42, marginTop: 4, animation: "hw-slide-up 0.45s ease-out 0.1s both" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{
              fontSize: fontSize - 1, fontWeight: 700, color: "#6B7280",
              letterSpacing: 0.4, textTransform: "uppercase",
            }}>
              {message.tests.length === 1 ? "Санал болгох тест" : "Санал болгох тестүүд"}
            </span>
            <span style={{
              background: "linear-gradient(135deg, #E8541A, #F07040)",
              color: "#fff", fontSize: fontSize - 2, fontWeight: 700,
              padding: "2px 10px", borderRadius: 20,
              boxShadow: "0 2px 6px rgba(232,84,26,.2)",
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

      {/* Team categories carousel */}
      {message.teamCategories && message.teamCategories.length > 0 && (
        <div style={{ marginLeft: 42, marginTop: 8, animation: "hw-slide-up 0.45s ease-out 0.1s both" }}>
          {message.teamCategories.map((cat, catIdx) => (
            <div key={cat.label} style={{ marginBottom: catIdx < message.teamCategories!.length - 1 ? 20 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 16 }}>{cat.icon}</span>
                <span style={{
                  fontSize: fontSize, fontWeight: 700, color: cat.color,
                  letterSpacing: 0.3,
                }}>
                  {cat.label}
                </span>
                <span style={{
                  background: cat.color,
                  color: "#fff", fontSize: fontSize - 2, fontWeight: 700,
                  padding: "2px 8px", borderRadius: 12,
                }}>
                  {cat.members.length}
                </span>
              </div>
              
              <div style={{
                display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8,
                scrollSnapType: "x mandatory",
              }}>
                {cat.members.map((member, idx) => (
                  <div
                    key={member.id}
                    style={{
                      minWidth: 200, maxWidth: 200,
                      background: "#fff",
                      border: "1.5px solid #F0EAE6",
                      borderRadius: 16,
                      padding: 16,
                      scrollSnapAlign: "start",
                      animation: `hw-slide-up 0.35s ease-out ${idx * 0.08}s both`,
                      boxShadow: "0 2px 8px rgba(0,0,0,.04)",
                    }}
                  >
                    <div style={{ textAlign: "center" }}>
                      {member.image && member.image.startsWith('http') ? (
                        <img 
                          src={member.image} 
                          alt={member.name}
                          style={{
                            width: 80, height: 80, borderRadius: "50%",
                            objectFit: "cover",
                            border: `3px solid ${member.roleColor}40`,
                            margin: "0 auto 12px",
                            boxShadow: "0 4px 12px rgba(0,0,0,.1)",
                          }}
                        />
                      ) : (
                        <div style={{
                          width: 80, height: 80, borderRadius: "50%",
                          background: `linear-gradient(135deg, ${member.roleColor}20, ${member.roleColor}10)`,
                          border: `3px solid ${member.roleColor}40`,
                          margin: "0 auto 12px",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 28, color: member.roleColor,
                        }}>
                          {member.name.charAt(0)}
                        </div>
                      )}
                      <div style={{
                        fontSize: fontSize + 1, fontWeight: 700, color: "#1F2937",
                        marginBottom: 8,
                      }}>
                        {member.name}
                      </div>
                      <div style={{
                        display: "inline-block",
                        fontSize: fontSize - 2, fontWeight: 600,
                        color: member.roleColor,
                        background: `${member.roleColor}15`,
                        border: `1px solid ${member.roleColor}30`,
                        padding: "4px 12px", borderRadius: 20,
                        marginBottom: 10,
                      }}>
                        {member.role}
                      </div>
                      <div style={{
                        fontSize: fontSize - 1, color: "#6B7280",
                        lineHeight: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}>
                        {member.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Feedback - response дор шууд */}
      <div style={{ marginLeft: 42, marginTop: 2 }}>
        <MessageFeedback 
          messageId={`msg-${Date.now()}`}
          userMessage={userQuestion}
          assistantMessage={message.content}
        />
      </div>
    </div>
  )
}

// ── User Message ──────────────────────────────────────────────────────────────

function UserMessage({ content, fontSize }: { content: string; fontSize: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <div style={{
        maxWidth: "80%",
        background: "linear-gradient(135deg, #E8541A 0%, #F06030 100%)",
        color: "#fff",
        borderRadius: 16, borderBottomRightRadius: 4,
        padding: "12px 16px",
        fontSize: fontSize, lineHeight: 1.65, wordBreak: "break-word",
        boxShadow: "0 4px 12px rgba(232,84,26,.2)",
      }}>
        {content}
      </div>
    </div>
  )
}

// ── Main Widget ───────────────────────��───────────────────────────────────────

export default function HireMnChatWidget({ initialContext }: HireMnChatWidgetProps = {}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [fontSize, setFontSize] = useState(13)
  const [showFontSlider, setShowFontSlider] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const messageCountRef = useRef(0)
  const [messages, setMessages] = useState<Message[]>(() => {
    const initialMessages: Message[] = [
      {
        role: "assistant",
        content: "Сайн байна уу!\n\nБи hire.mn AI туслагч. Та надаас:\n\n- **Тест санал болгох:** Таны нөхцөл байдал, асуудалд тохирсон тестүүдийг олж өгнө (40+ төрлийн тест)\n- **Тестийн үр дүн тайлбарлах:** Авсан тестийн хариуг дүн шинжилгээ хийж, практик зөвлөгөө өгнө\n- **Мэргэжлийн зөвлөгөө:** Сэтгэл зүй, зан төлөв, ажлын байрны асуудлаар туслана",
      },
    ]
    
    // Exam result байвал initial message оруулна
    if (initialContext?.type === 'exam-result') {
      const { data } = initialContext
      initialMessages.push({
        role: "assistant",
        content: `**${data.assessmentName}** үнэлгээний үр дүнд үндэслээд зөвлөгөө өгье.\n\n📊 **Таны оноо:** ${data.score}\n🎯 **Түвшин:** ${data.interpretation}\n\n${data.advice}`,
      })
    }
    
    return initialMessages
  })
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showQuickReplies, setShowQuickReplies] = useState(true)
  const [lang, setLang] = useState<"МН" | "EN">("МН")
  // Initialize conversation on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    let active = getActiveConversation()
    if (!active) {
      active = createNewConversation()
      setActiveConversation(active)
    }
    setConversation(active)
  }, [])

  const handleNewConversation = () => {
    const newConv = createNewConversation()
    setActiveConversation(newConv)
    setConversation(newConv)
    setMessages([{
      role: "assistant",
      content: "Сайн байна уу!\n\nБи hire.mn AI туслагч. Та надаас:\n\n- **Тест санал болгох:** Таны нөхцөл байдал, асуудалд тохирсон тестүүдийг олж өгнө (40+ төрлийн тест)\n- **Тестийн үр дүн тайлбарлах:** Авсан тестийн хариуг дүн шинжилгээ хийж, практик зөвлөгөө өгнө\n- **Мэргэжлийн зөвлөгөө:** Сэтгэл зүй, зан төлөв, ажлын байрны асуудлаар туслана",
    }])
    setInput("")
  }

  const handleSelectConversation = (conv: Conversation) => {
    setConversation(conv)
    setActiveConversation(conv)
    setMessages(conv.messages.length > 0 ? conv.messages : [{
      role: "assistant",
      content: "Сайн байна уу!\n\nБи hire.mn AI туслагч. Та надаас:\n\n- **Тест санал болгох:** Таны нөхцөл байдал, асуудалд тохирсон тестүүдийг олж өгнө (40+ төрлийн тест)\n- **Тестийн үр дүн тайлбарлах:** Авсан тестийн хариуг дүн шинжилгээ хийж, практик зөвлөгөө өгнө\n- **Мэргэжлийн зөвлөгөө:** Сэтгэл зүй, зан төлөв, ажлын байрны асуудлаар туслана",
    }])
    messageCountRef.current = conv.messageCount || 0
    setShowSidebar(false)
  }

  // Auto-save conversation
  useEffect(() => {
    if (!conversation || messages.length === 0) return
    const timer = setTimeout(() => {
      const userMessages = messages.filter(m => m.role === 'user').length
      const title = messages.find(m => m.role === 'user')?.content 
        ? generateConversationTitle(messages.find(m => m.role === 'user')!.content)
        : 'Шинэ яриа'
      
      const updated = {
        ...conversation,
        messages,
        title,
        messageCount: userMessages,
        updatedAt: Date.now(),
      }
      saveConversation(updated)
      setConversation(updated)
    }, 1000)
    return () => clearTimeout(timer)
  }, [messages, conversation])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  const sendMessage = async (text: string) => {
    // Check message limit
    if (!canSendMessage()) {
      alert(`⚠️ 20 асуултаж хүрсэн байна. Шинэ яриа эхлүүлнэ үү.`)
      return
    }
    
    if (!text.trim() || isTyping) return
    setShowQuickReplies(false)
    const userMsg: Message = { role: "user", content: text }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setIsTyping(true)

    // Static responses - no LLM needed, save tokens
    // Support: Cyrillic Mongolian, Latin Mongolian, English
    const isAboutHire = /hire\.?mn|платформ|platform|компани|company|бидний\s*тухай|about\s*us|тухай$/i.test(text)
    const isTestRelated = /багийн\s*дүр|team\s*role|тест|test|шалгалт|exam|үнэлгээ|assess|яадын|why|юу\s*вэ|what|ямар|what|хэрхэн|how/i.test(text)
    const isAboutTeam = !isTestRelated && /хөгжүүлэлтийн\s*баг|development\s*team|систем.*баг|system.*team|тест.*хөгжүүлэгч|test.*developer|ажилчид|employees|хөгжүүлэгч|developer|хэн\s*бүтээсэн|who.*created|хэн\s*хийсэн|who.*made|hire.*баг|hire.*team/i.test(text)
    const isFreeTest = /үнэгүй\s*тест|free\s*test|free\s*assessment|төлбөргүй/i.test(text)
    const isPaidTest = /төлбөртэй\s*тест|paid\s*test|premium\s*test/i.test(text)
    const isFounderQuery = !isTestRelated && /үүсгэн\s*байгуулагч|founder|нандин.?эрдэнэ|nandin|erdene/i.test(text)
    
  // Individual team member queries - support Cyrillic, Latin Mongolian, English
  const teamMemberNames = [
    { pattern: /саранчимэг|saranchimeg|sarantsimeg/i, id: "system-1" },
    { pattern: /эрдэнэцэцэг|erdenetseteg|erdentseteg|erdenetseteg/i, id: "system-2" },
    { pattern: /доржнямбуу|dorjnyambuu|dorjnyambu/i, id: "system-3" },
    { pattern: /өсөхбаяр|osohbayar|osoh\s*bayar/i, id: "system-4" },
    { pattern: /чин.?эрдэнэ|chin.?erdene|chin\s*erdene|chinerdene/i, id: "test-0" },
    { pattern: /үүрцайх|uurtsaikh|uurtsaih|uurtsayh/i, id: "test-1" },
    { pattern: /оюунбилэг|oyunbileg|oyun\s*bileg/i, id: "test-2" },
    { pattern: /баярмаа|bayarmaa|bayar\s*maa/i, id: "test-3" },
    { pattern: /мөнхжаргал|monhjargal|monh\s*jargal|monhjargal/i, id: "test-4" },
    { pattern: /одонтуяа|odontuyaa|odon\s*tuyaa/i, id: "test-5" },
    { pattern: /эрдэнэбаяр|erdenebyar|erdene\s*byar|erdene\s*bayar/i, id: "test-6" },
  ]
    const matchedMember = teamMemberNames.find(m => m.pattern.test(text))
    
    if (isAboutHire || isAboutTeam || isFreeTest || isPaidTest || isFounderQuery || matchedMember) {
      // Import static data
      const { COMPANY_INFO, getAllTeamCategories, TEAM_MEMBERS } = await import("@/lib/company-data")
      
      setTimeout(async () => {
        // Individual team member query - FIRST PRIORITY
        if (matchedMember) {
          const member = TEAM_MEMBERS.find(m => m.id === matchedMember.id)
          if (member) {
            setMessages(prev => [...prev, {
              role: "assistant",
              content: `**${member.name}**\n\n${member.role}\n\n${member.description}`,
              teamCategories: [{
                label: member.role,
                icon: member.category === 'system' ? "💻" : member.category === 'test' ? "📊" : "🚀",
                color: member.roleColor,
                members: [member]
              }],
            }])
          }
          setIsTyping(false)
          return
        }
        
        // Founder query
        if (isFounderQuery) {
          const founder = TEAM_MEMBERS.find(m => m.category === 'founder')
          if (founder) {
            setMessages(prev => [...prev, {
              role: "assistant",
              content: `**${founder.name}**\n\n${founder.role}\n\n${founder.description}`,
              teamCategories: [{
                label: founder.role,
                icon: "🚀",
                color: founder.roleColor,
                members: [founder]
              }],
            }])
          }
          setIsTyping(false)
          return
        }
        
        // Free tests query
        if (isFreeTest) {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: [{ role: "user", content: "__FREE_TESTS__" }], lang: lang === "МН" ? "mn" : "en" }),
          })
          const data = await res.json()
          setMessages(prev => [...prev, {
            role: "assistant",
            content: "**Үнэгүй тестүүд**\n\nТа эдгээр тестүүдийг ямар ч төлбөргүйгээр өгч, өөрийн талаар илүү ихийг мэдэж авах боломжтой:",
            tests: data.tests || [],
            categories: ["free"],
          }])
          setIsTyping(false)
          return
        }
        
        // Paid tests query  
        if (isPaidTest) {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: [{ role: "user", content: "__PAID_TESTS__" }], lang: lang === "МН" ? "mn" : "en" }),
          })
          const data = await res.json()
          setMessages(prev => [...prev, {
            role: "assistant",
            content: "**Төлбөртэй тестүүд**\n\nМэргэжлийн судлаачдын боловсруулсан гүнзгий шинжилгээ, дэлгэрэнгүй тайлантай тестүүд. Төлбөрийг **QPay**-ээр төлөх боломжтой.",
            tests: data.tests || [],
            categories: ["paid"],
          }])
          setIsTyping(false)
          return
        }
        
        // Team query
        if (isAboutTeam) {
          setMessages(prev => [...prev, {
            role: "assistant",
            content: `**hire.mn** платформыг мэргэжлийн багийнхан хөгжүүлж байна:`,
            teamCategories: getAllTeamCategories(),
          }])
        } else {
          // About hire.mn
          setMessages(prev => [...prev, {
            role: "assistant",
            content: `### ${COMPANY_INFO.name}\n\n**"${COMPANY_INFO.slogan}"**\n\n${COMPANY_INFO.description}\n\n**Онцлог:**\n- ${COMPANY_INFO.testCount}+ төрлийн тест\n- Мэргэжлийн судлаачдын боловсруулсан\n- Шинжлэх ухааны үндэслэлтэй\n- Монгол хэл дээр\n- Үнэгүй болон төлбөртэй тестүүд`,
          }])
        }
        setIsTyping(false)
      }, 500)
      return
    }

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
          0%, 60%, 100% { transform: translateY(0) scale(1); }
          30% { transform: translateY(-10px) scale(0.92); }
        }
        @keyframes hw-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-4px) rotate(-3deg); }
          50% { transform: translateY(-6px) rotate(0deg); }
          75% { transform: translateY(-4px) rotate(3deg); }
        }
        @keyframes hw-pop {
          from { transform: scale(0.8) translateY(12px); opacity: 0; }
          50%  { transform: scale(1.05) translateY(-3px); opacity: 1; }
          to   { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes hw-card-in {
          from { transform: scale(0.8) translateY(20px) rotate(-3deg); opacity: 0; }
          60%  { transform: scale(1.03) translateY(-4px) rotate(1deg); opacity: 1; }
          to   { transform: scale(1) translateY(0) rotate(0deg); opacity: 1; }
        }
        @keyframes hw-slide-up {
          from { transform: translateY(24px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes hw-chat-open {
          from { opacity: 0; transform: scale(0.8) translateY(30px); transform-origin: bottom right; }
          50%  { transform: scale(1.03) translateY(-6px); transform-origin: bottom right; }
          to   { opacity: 1; transform: scale(1) translateY(0); transform-origin: bottom right; }
        }
        @keyframes hw-pulse {
          0%, 100% { box-shadow: 0 10px 30px rgba(232,84,26,.4), 0 0 0 0 rgba(232,84,26,.4); }
          50%       { box-shadow: 0 10px 30px rgba(232,84,26,.4), 0 0 0 18px rgba(232,84,26,0); }
        }
        @keyframes hw-chip-in {
          from { transform: scale(0.7) translateY(10px); opacity: 0; }
          70%  { transform: scale(1.05) translateY(-2px); opacity: 1; }
          to   { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes hw-ring {
          0%   { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes hw-ring2 {
          0%   { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(2.8); opacity: 0; }
        }
        @keyframes hw-tooltip-in {
          from { opacity: 0; transform: translateX(10px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes wave-hand {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(20deg); }
          50% { transform: rotate(-5deg); }
          75% { transform: rotate(20deg); }
        }
        @keyframes wave-arm {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-15deg); }
        }
        @keyframes glow-pulse {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(232,84,26,0.3)); }
          50% { filter: drop-shadow(0 0 20px rgba(232,84,26,0.7)); }
        }
        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .hw-msg { animation: hw-pop 0.4s cubic-bezier(.34,1.56,.64,1) both; }

        .hw-card {
          transition: transform 0.28s cubic-bezier(.34,1.56,.64,1), box-shadow 0.28s ease, border-color 0.2s ease;
          will-change: transform;
        }
        .hw-card:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow: 0 20px 40px rgba(232,84,26,.18), 0 6px 16px rgba(0,0,0,.08);
          border-color: #F5C8B8 !important;
        }
        .hw-card:hover .hw-cta {
          background: linear-gradient(135deg, #D44810 0%, #E8541A 100%) !important;
          box-shadow: 0 6px 20px rgba(232,84,26,.4) !important;
          transform: translateY(-2px);
        }

        .hw-cta { transition: all 0.22s cubic-bezier(.34,1.56,.64,1); }

        .hw-chip {
          transition: all 0.22s cubic-bezier(.34,1.56,.64,1);
        }
        .hw-chip:hover {
          background: linear-gradient(135deg, #E8541A, #F07040) !important;
          color: #fff !important;
          border-color: #E8541A !important;
          transform: translateY(-3px) scale(1.05);
          box-shadow: 0 6px 16px rgba(232,84,26,.3);
        }
        .hw-chip:active { transform: scale(0.96); }

        .hw-send { transition: all 0.2s cubic-bezier(.34,1.56,.64,1); }
        .hw-send:hover:not(:disabled) {
          background: linear-gradient(135deg, #D44810 0%, #E8541A 100%) !important;
          transform: scale(1.08);
          box-shadow: 0 6px 20px rgba(232,84,26,.4) !important;
        }
        .hw-send:active:not(:disabled) { transform: scale(0.92); }

        .hw-mascot {
          transition: transform 0.3s cubic-bezier(.34,1.56,.64,1), box-shadow 0.3s ease;
          animation: hw-pulse 2.5s ease-in-out infinite;
          will-change: transform;
        }
        .hw-mascot:hover {
          transform: scale(1.12) translateY(-4px);
          animation: none;
          box-shadow: 0 14px 36px rgba(232,84,26,.5) !important;
        }
        .hw-mascot:active { transform: scale(0.94); }

        .hw-arrow {
          transition: all 0.2s cubic-bezier(.34,1.56,.64,1);
        }
        .hw-arrow:hover {
          transform: translateY(-50%) scale(1.15);
          box-shadow: 0 4px 16px rgba(232,84,26,.25);
          border-color: #F5C8B8;
        }

        .hw-scroll::-webkit-scrollbar { width: 4px; }
        .hw-scroll::-webkit-scrollbar-track { background: transparent; }
        .hw-scroll::-webkit-scrollbar-thumb { background: rgba(232,84,26,.15); border-radius: 4px; }
        .hw-scroll::-webkit-scrollbar-thumb:hover { background: rgba(232,84,26,.3); }

        .hw-font-slider { -webkit-appearance: none; width: 100%; height: 4px; border-radius: 2px; outline: none; cursor: pointer;
          background: linear-gradient(to right, #E8541A calc((var(--val) - 11) / 6 * 100%), #F0E4DF calc((var(--val) - 11) / 6 * 100%));
        }
        .hw-font-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: linear-gradient(135deg, #E8541A, #F07040); border: 2.5px solid #fff; box-shadow: 0 2px 8px rgba(232,84,26,.4); cursor: pointer; transition: transform 0.15s; }
        .hw-font-slider::-webkit-slider-thumb:hover { transform: scale(1.2); }
        .hw-font-slider::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: linear-gradient(135deg, #E8541A, #F07040); border: 2.5px solid #fff; cursor: pointer; }

        .hw-tab { transition: all 0.2s cubic-bezier(.34,1.56,.64,1); }
        .hw-tab:hover { transform: translateY(-2px); }

        @media (max-width: 380px) {
          .hw-panel {
            width: 340px !important;
            height: 520px !important;
            border-radius: 16px !important;
          }
        }
      `}</style>

      <div className="hw-root" style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 99999,
        display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 16,
      }}>

  {/* Chat panel */}
  {isOpen && (
    <div style={{ animation: "hw-chat-open 0.4s cubic-bezier(.34,1.56,.64,1)" }}>
      <div className="hw-panel" style={{
        width: 380,
        position: "relative",
        overflow: "hidden",
        maxWidth: "calc(100vw - 48px)",
        height: "min(620px, calc(100vh - 120px))",
              borderRadius: 20,
              background: "linear-gradient(180deg, #FFFFFF 0%, #FAFAF9 100%)",
              boxShadow: "0 25px 60px rgba(0,0,0,.15), 0 10px 30px rgba(0,0,0,.08), 0 0 0 1px rgba(0,0,0,.04)",
              display: "flex", flexDirection: "column", overflow: "hidden",
              border: "none",
            }}>

              {/* Header */}
              <div style={{
                background: "linear-gradient(180deg, #FFFFFF 0%, #FDF9F7 100%)",
                padding: "0 18px 0 20px",
                height: 76,
                display: "flex", alignItems: "center", gap: 14,
                flexShrink: 0, position: "relative",
                borderBottom: "1px solid rgba(232,84,26,0.08)",
              }}>
                {/* Top gradient bar */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 4,
                  background: "linear-gradient(90deg, #E8541A 0%, #F5A07A 50%, #E8541A 100%)",
                  backgroundSize: "200% 100%",
                  animation: "gradient-shift 3s ease infinite",
                  borderRadius: "24px 24px 0 0",
                }} />
                <style>{`
                  @keyframes gradient-shift {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                  }
                `}</style>

                {/* Logo/Mascot - click to toggle sidebar */}
                <button
                  onClick={() => setShowSidebar(s => !s)}
                  title="Яриа түүх харах"
                  style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: showSidebar 
                      ? "linear-gradient(145deg, #FFF7ED, #FFEDD5)" 
                      : "linear-gradient(145deg, #FEF3EE, #FFE8DC)",
                    border: showSidebar ? "2px solid #FB923C" : "2px solid #FDDCCC",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: showSidebar 
                      ? "0 4px 16px rgba(251,146,60,.3)" 
                      : "0 4px 12px rgba(232,84,26,.15)",
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    padding: 0,
                  }}>
                  <Suspense fallback={<MascotRobot size={26} waving />}>
                    <ChatMascot3D isTyping={isTyping} size="sm" />
                  </Suspense>
                </button>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#111", fontWeight: 700, fontSize: 15, letterSpacing: "-0.3px" }}>
                      hire.mn
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: "0.5px",
                      color: "#fff",
                      background: "linear-gradient(135deg, #E8541A, #F07040)",
                      padding: "3px 8px", borderRadius: 20,
                      textTransform: "uppercase",
                      boxShadow: "0 2px 6px rgba(232,84,26,.25)",
                    }}>AI</span>
                  </div>
                  <div style={{
                    color: "#9CA3AF", fontSize: 11.5, marginTop: 4,
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: "50%",
                      background: "linear-gradient(135deg, #22C55E, #4ADE80)",
                      display: "inline-block", flexShrink: 0,
                      boxShadow: "0 0 8px rgba(34,197,94,.5)",
                    }} />
                    Онлайн
                  </div>
                  
                  {/* Message counter - compact pill */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    marginTop: 6,
                  }}>
                    <div style={{
                      fontSize: 10, 
                      fontWeight: 600,
                      padding: "3px 8px", 
                      borderRadius: 20,
                      backgroundColor: getRemainingMessages() < 5 ? "#FEE2E2" : "#F0FDF4",
                      color: getRemainingMessages() < 5 ? "#DC2626" : "#16A34A",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}>
                      <span style={{
                        width: 5, height: 5, borderRadius: "50%",
                        backgroundColor: getRemainingMessages() < 5 ? "#DC2626" : "#16A34A",
                      }} />
                      {getRemainingMessages()} үлдсэн
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => setShowFontSlider(s => !s)}
                    title="Үсгийн хэмжээ"
                    style={{
                      width: 32, height: 32, borderRadius: 10,
                      background: showFontSlider ? "linear-gradient(135deg, #FEF3EE, #FFE8DC)" : "transparent",
                      border: `1.5px solid ${showFontSlider ? "#FDDCCC" : "transparent"}`,
                      color: showFontSlider ? "#E8541A" : "#9CA3AF",
                      cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all .18s",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M4 20h4M6 20V7M14 20h4M16 20V4" />
                    </svg>
                  </button>

                  <button
                    onClick={() => setLang(l => l === "МН" ? "EN" : "МН")}
                    style={{
                      height: 32, paddingLeft: 10, paddingRight: 10, borderRadius: 10,
                      background: "transparent", border: "1.5px solid transparent",
                      color: "#9CA3AF", fontSize: 11, fontWeight: 600, cursor: "pointer",
                      transition: "all .18s",
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
                      width: 32, height: 32, borderRadius: 10,
                      background: "transparent", border: "1.5px solid transparent",
                      color: "#9CA3AF", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all .18s",
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
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Font slider */}
              {showFontSlider && (
                <div style={{
                  background: "linear-gradient(180deg, #FAFAFA, #F8F6F5)", borderBottom: "1px solid #F0EBE7",
                  padding: "12px 18px", flexShrink: 0,
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <span style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, minWidth: 18 }}>A</span>
                  <input
                    type="range" min={11} max={17} step={1}
                    value={fontSize}
                    onChange={e => setFontSize(Number(e.target.value))}
                    className="hw-font-slider"
                    style={{ "--val": fontSize } as React.CSSProperties}
                  />
                  <span style={{ fontSize: 16, color: "#9CA3AF", fontWeight: 600, minWidth: 14 }}>A</span>
                  <span style={{ fontSize: 10, color: "#C0B0A8", minWidth: 30, textAlign: "right" }}>{fontSize}px</span>
                </div>
              )}

              {/* Messages */}
              <div className="hw-scroll" style={{
                flex: 1, overflowY: "auto", padding: "16px 14px 10px",
                display: "flex", flexDirection: "column", gap: 12,
                background: "linear-gradient(180deg, #FAFAFA 0%, #F8F6F5 100%)",
              }}>
                {messages.map((msg, i) => {
                  // Өмнөх хэрэглэгчийн асуултыг олох (feedback-д ашиглах)
                  const prevUserMsg = msg.role === "assistant" && i > 0
                    ? messages.slice(0, i).reverse().find(m => m.role === "user")?.content || ""
                    : ""
                  
                  return (
                    <div key={i} className="hw-msg">
                      {msg.role === "assistant"
                        ? <BotMessage message={msg} fontSize={fontSize} userQuestion={prevUserMsg} />
                        : <UserMessage content={msg.content} fontSize={fontSize} />
                      }
                    </div>
                  )
                })}

                {isTyping && (
                  <div className="hw-msg">
                    <TypingIndicator />
                  </div>
                )}

                {showQuickReplies && !isTyping && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                    {QUICK_REPLIES.map((qr, i) => (
                      <button
                        key={qr.text}
                        className="hw-chip"
                        onClick={() => sendMessage(qr.text)}
                        style={{
                          background: "linear-gradient(135deg, #E8541A, #F07040)",
                          border: "none",
                          color: "#fff",
                          borderRadius: 22, padding: "8px 14px",
                          fontSize: fontSize - 1, fontWeight: 600,
                          cursor: "pointer", whiteSpace: "nowrap",
                          animation: `hw-chip-in 0.35s cubic-bezier(.34,1.56,.64,1) ${i * 0.08}s both`,
                          boxShadow: "0 4px 12px rgba(232,84,26,.25)",
                          display: "flex", alignItems: "center", gap: 6,
                        }}
                      >
                        <span style={{ fontSize: fontSize + 1 }}>{qr.icon}</span>
                        {qr.text}
                      </button>
                    ))}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={{
                padding: "12px 14px 14px", borderTop: "1px solid #EDE8E5",
                background: "#fff", flexShrink: 0,
              }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
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
                      flex: 1, border: "2px solid #EDDFDA", borderRadius: 14,
                      padding: "10px 14px", fontSize: fontSize, outline: "none",
                      resize: "none", maxHeight: 90, lineHeight: 1.5,
                      color: "#1A1A1A", background: "#FDFCFC",
                      transition: "border-color .18s, box-shadow .18s",
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = "#E8541A"
                      e.target.style.boxShadow = "0 0 0 3px rgba(232,84,26,.1)"
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = "#EDDFDA"
                      e.target.style.boxShadow = "none"
                    }}
                  />
                  <button
                    className="hw-send"
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || isTyping}
                    style={{
                      width: 44, height: 44, borderRadius: 14,
                      background: input.trim() && !isTyping
                        ? "linear-gradient(135deg, #E8541A, #F07040)"
                        : "#E8D5CF",
                      border: "none",
                      cursor: input.trim() && !isTyping ? "pointer" : "not-allowed",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, transition: "all .18s",
                      boxShadow: input.trim() && !isTyping ? "0 4px 12px rgba(232,84,26,.25)" : "none",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" fill="white" stroke="none" />
                    </svg>
                  </button>
                </div>
                <div style={{ textAlign: "center", marginTop: 10, fontSize: 10, color: "#D1C4BE", fontWeight: 500 }}>
                  hire.mn AI
                </div>
              </div>

              {/* Sidebar Overlay */}
              {showSidebar && (
                <ConversationSidebar 
                  activeId={conversation?.id}
                  onSelectConversation={handleSelectConversation}
                  onNewConversation={handleNewConversation}
                  onClose={() => setShowSidebar(false)}
                />
              )}

            </div>
          </div>
        )}

        {/* Mascot button */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {isHovered && !isOpen && (
            <div style={{
              animation: "hw-tooltip-in 0.2s ease-out",
              background: "linear-gradient(135deg, #1A1A1A, #2D2D2D)",
              borderRadius: 14,
              padding: "12px 16px",
              boxShadow: "0 10px 30px rgba(0,0,0,.2)",
              maxWidth: 200, pointerEvents: "none", position: "relative",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                hire.mn Туслагч
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)", lineHeight: 1.5 }}>
                Тест сонгох, мэргэжлийн зөвлөгөө авах
              </div>
              <div style={{
                position: "absolute", right: -7, top: "50%", transform: "translateY(-50%)",
                width: 0, height: 0,
                borderTop: "7px solid transparent",
                borderBottom: "7px solid transparent",
                borderLeft: "7px solid #1A1A1A",
              }} />
            </div>
          )}

          {/* Pulsing rings - 3 layers */}
          {!isOpen && (
            <>
              <div style={{
                position: "absolute", bottom: 0, right: 0, pointerEvents: "none",
                width: 64, height: 64, borderRadius: "50%",
                background: "rgba(232,84,26,.25)",
                animation: "hw-ring 2s ease-out infinite",
              }} />
              <div style={{
                position: "absolute", bottom: 0, right: 0, pointerEvents: "none",
                width: 64, height: 64, borderRadius: "50%",
                background: "rgba(232,84,26,.18)",
                animation: "hw-ring 2s ease-out 0.5s infinite",
              }} />
              <div style={{
                position: "absolute", bottom: 0, right: 0, pointerEvents: "none",
                width: 64, height: 64, borderRadius: "50%",
                background: "rgba(232,84,26,.12)",
                animation: "hw-ring2 2s ease-out 1s infinite",
              }} />
            </>
          )}

          <button
            className="hw-mascot"
            onClick={() => setIsOpen(o => !o)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            aria-label="hire.mn чат нээх"
            style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "linear-gradient(145deg, #FF6535 0%, #E8541A 50%, #D44810 100%)",
              border: "3.5px solid rgba(255,255,255,.98)",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, position: "relative",
              boxShadow: "0 10px 30px rgba(232,84,26,.45), inset 0 2px 0 rgba(255,255,255,.2)",
            }}
          >
            <div style={{
              transition: "transform 0.4s cubic-bezier(.34,1.56,.64,1), opacity 0.2s",
              transform: isOpen ? "rotate(180deg) scale(0.9)" : "rotate(0deg) scale(1)",
            }}>
              {isOpen ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              ) : (
                <MascotRobot size={34} white waving />
              )}
            </div>
            {!isOpen && (
              <span style={{
                position: "absolute", bottom: 3, right: 3,
                width: 15, height: 15, borderRadius: "50%",
                background: "linear-gradient(135deg, #22C55E, #4ADE80)",
                border: "3px solid #fff",
                boxShadow: "0 0 10px rgba(34,197,94,.6)",
                animation: "typing-bounce 2s ease-in-out infinite",
              }} />
            )}
          </button>
        </div>

      </div>
    </>
  )
}
