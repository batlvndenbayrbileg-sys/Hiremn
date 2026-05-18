"use client"

import { useState, useRef, useEffect } from "react"
import { MessageFeedback } from './message-feedback'
import { ConversationSidebar } from './conversation-sidebar'
import { SplineMascot } from './spline-mascot'
import {
  Conversation,
  createNewConversation,
  getActiveConversation,
  setActiveConversation,
  canSendMessage,
  getRemainingMessages,
  saveConversation,
  generateConversationTitle,
  incrementDailyCount,
  isUserLocked,
  formatUnlockTime
} from '@/lib/conversation-storage'
import { UsageLimitPopup } from './usage-limit-popup'



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
  color: string
  free: boolean
  desc: string
  category?: string
  count?: number
  icon?: string
  image?: string
}

// Quick reply SVG icons
const QuickReplyIcon = ({ type }: { type: string }) => {
  const icons: Record<string, JSX.Element> = {
    list: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>,
    target: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
    gift: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" /><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" /></svg>,
    info: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>,
  }
  return icons[type] || icons.info
}

const QUICK_REPLIES = [
  { text: "Бүх тест харах", iconType: "list" },
  { text: "Надад тохирох тест", iconType: "target" },
  { text: "Үнэгүй тестүүд", iconType: "gift" },
  { text: "Hire.mn тухай", iconType: "info" },
]

// ── Animated Mascot Robot ─────────────────────────────────────────────────────

function MascotRobot({ size = 58, white = false, waving = false }: { size?: number; white?: boolean; waving?: boolean }) {
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
      width: 40, height: 40, borderRadius: 12,
      background: "linear-gradient(145deg, #FFF8F5, #FFE8DC)",
      border: "1.5px solid rgba(232,84,26,0.15)",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
      boxShadow: "0 4px 12px rgba(232,84,26,0.1), inset 0 1px 0 rgba(255,255,255,0.8)",
    }}>
      <SplineMascot width={68} height={68} borderRadius={18} />
    </div>
  )
}

// ── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
      <BrainAvatar />
      <div style={{
        background: "linear-gradient(135deg, #fff 0%, #FFFCFA 100%)",
        border: "1px solid rgba(232,84,26,0.1)",
        borderRadius: 16, borderBottomLeftRadius: 4,
        padding: "14px 18px",
        display: "flex", gap: 6, alignItems: "center",
        boxShadow: "0 4px 16px rgba(0,0,0,.04), inset 0 1px 0 rgba(255,255,255,0.8)",
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 9, height: 9,
            background: "linear-gradient(135deg, #E8541A, #FF8C42)",
            borderRadius: "50%",
            animation: `hw-bounce 1.4s ease-in-out ${i * 0.16}s infinite`,
            boxShadow: "0 2px 6px rgba(232,84,26,0.3)",
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

const CARD_W = 180

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
        background: "linear-gradient(145deg, #fff 0%, #FFFCFA 100%)",
        border: "1.5px solid rgba(232,84,26,0.08)",
        borderRadius: 18,
        overflow: "hidden", textDecoration: "none",
        width: CARD_W, minWidth: CARD_W, maxWidth: CARD_W, flexShrink: 0,
        height: 310,
        animation: `hw-card-in 0.45s cubic-bezier(.16,1,.3,1) ${index * 0.08}s both`,
        boxShadow: "0 4px 16px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)",
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

        {/* Test icon badge */}
        <div style={{
          position: "absolute", top: 8, right: 8,
          background: "rgba(255,255,255,.25)",
          backdropFilter: "blur(8px)",
          borderRadius: 10, padding: "6px 8px",
          border: "1px solid rgba(255,255,255,.35)",
          color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" />
          </svg>
        </div>

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
              {priceFilter === "free" ? "Үнэгүй" : priceFilter === "paid" ? "өлбөртэй" : "Бүгд"}
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

// ── Bot Message ──────────────────────────────────────────────────────────────

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
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", animation: "hw-msg-in 0.4s cubic-bezier(.16,1,.3,1)" }}>
          <BrainAvatar />
          <div style={{
            maxWidth: "82%",
            background: "linear-gradient(145deg, #fff 0%, #FFFCFA 100%)",
            border: "1.5px solid rgba(232,84,26,0.08)",
            borderRadius: 18, borderBottomLeftRadius: 4,
            padding: "14px 18px",
            fontSize: fontSize, lineHeight: 1.65, color: "#1F2937",
            boxShadow: "0 4px 16px rgba(0,0,0,.04), inset 0 1px 0 rgba(255,255,255,0.9)",
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
                <span style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: `${cat.color}15`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: cat.color,
                }}>
                  {cat.icon === "system" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>}
                  {cat.icon === "test" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>}
                  {cat.icon === "rocket" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /></svg>}
                </span>
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
    <div style={{ display: "flex", justifyContent: "flex-end", animation: "hw-msg-in 0.35s cubic-bezier(.16,1,.3,1)" }}>
      <div style={{
        maxWidth: "82%",
        background: "linear-gradient(135deg, #E8541A 0%, #F06835 50%, #FF8C42 100%)",
        backgroundSize: "200% 200%",
        color: "#fff",
        borderRadius: 18, borderBottomRightRadius: 4,
        padding: "13px 17px",
        fontSize: fontSize, lineHeight: 1.65, wordBreak: "break-word",
        fontWeight: 500,
        boxShadow: "0 6px 20px rgba(232,84,26,.22), inset 0 1px 0 rgba(255,255,255,0.15)",
        textShadow: "0 1px 2px rgba(0,0,0,0.1)",
      }}>
        {content}
      </div>
    </div>
  )
}

// ── Main Widget ──────────────────────────────────────────────────────────────

export default function HireMnChatWidget({ initialContext }: HireMnChatWidgetProps = {}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [fontSize, setFontSize] = useState(13)
  const [showFontSlider, setShowFontSlider] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [activeTab, setActiveTab] = useState(0) // 0: Chat, 1: FAQs, 2: Contact
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null) // FAQ accordion state
  const [rateLimitPopupDismissed, setRateLimitPopupDismissed] = useState(false) // Rate limit popup dismissed
  const [showBubble, setShowBubble] = useState(false)

  useEffect(() => {
    if (isOpen) return
    const show = setTimeout(() => setShowBubble(true), 4000)
    const hide = setTimeout(() => setShowBubble(false), 7000)
    return () => { clearTimeout(show); clearTimeout(hide) }
  }, [isOpen])

  // Notify parent window of open/close state for iframe resizing
  // ✅ ЗӨВ — 2 тусдаа useEffect
  useEffect(() => {
    if (typeof window !== 'undefined' && window.parent !== window) {
      window.parent.postMessage({ type: 'HIREMN_RESIZE', isOpen }, '*')
    }
  }, [isOpen])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.parent !== window) {
      window.parent.postMessage({ type: 'HIREMN_HOVER', isHovered, isOpen }, '*')
    }
  }, [isHovered, isOpen])
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const conversationRef = useRef<Conversation | null>(null)
  useEffect(() => {
    conversationRef.current = conversation
  }, [conversation])
  const messageCountRef = useRef(0)
  const [messages, setMessages] = useState<Message[]>(() => {
    const initialMessages: Message[] = [
      {
        role: "assistant",
        content: "Сайн байна уу!\n\nБи бол hire.mn-ийн AI туслагч. Та надаас дараах зүйлсийг асууж болно:\n\n- **Тест санал болгох:** Танд тохирсон тестүүдийг олж өгнө\n- **Тестийн үр дүн тайлбарлах:** Авсан тестийн хариуг шинжилж, зөвлөгөө өгнө\n- **Мэргэжлийн зөвлөгөө:** Сэтгэл зүй, ажлын байрны асуудлаар туслана",
      },
    ]

    // Exam result байвал initial message оруулна
    if (initialContext?.type === 'exam-result') {
      const { data } = initialContext
      initialMessages.push({
        role: "assistant",
        content: `**${data.assessmentName}** үнэлгээний үр дүнд үндэслээд зөвлөгөө өгье.\n\n**Таны оноо:** ${data.score}\n**Түвшин:** ${data.interpretation}\n\n${data.advice}`,
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

  // ══════════════════════════════════════════════════════════════════════════
  // EXTERNAL API HANDLER - Listen for messages from parent window (hire.mn)
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleExternalMessage = (event: MessageEvent) => {
      if (!event.data || !event.data.type) return

      // Open chatbot
      if (event.data.type === "HIREMN_OPEN") {
        setIsOpen(true)
      }

      // Close chatbot
      if (event.data.type === "HIREMN_CLOSE") {
        setIsOpen(false)
      }

      // Send a simple message
      if (event.data.type === "HIREMN_SEND_MESSAGE" && event.data.message) {
        sendMessage(event.data.message)
      }

      // Loading state - show when fetching from API
      if (event.data.type === "HIREMN_LOADING") {
        const loadingMsg: Message = {
          role: "assistant",
          content: `**${event.data.message || "Уншиж байна..."}**`,
        }
        setMessages(prev => [...prev, loadingMsg])
        setIsTyping(true)
      }

      // Error state - show API error
      if (event.data.type === "HIREMN_ERROR") {
        setIsTyping(false)
        const errorMsg: Message = {
          role: "assistant",
          content: `**Алдаа:** ${event.data.message || "Өгөгдөл татахад алдаа гарлаа."}\n\nДахин оролдоно уу эсвэл hire.mn Х
          Хэрэглэгчийн тусламжтай холбогдоно уу.`,
        }
        setMessages(prev => [...prev, errorMsg])
      }

      // AI Analysis request with report data (from API or direct)
      if (event.data.type === "HIREMN_AI_ANALYSIS" && event.data.payload) {
        const { reportTitle, reportData, userInfo, analysisResults, prompt } = event.data.payload

        // Зөвхөн loading indicator харуулна — raw data огт харуулахгүй
        setIsTyping(true)
        setMessages(prev => [...prev, {
          role: "assistant" as const,
          content: "⏳ Тайлангийн үр дүнг шинжилж байна...",
        }])

        // Data-г API руу шууд явуулна — sendMessage ашиглахгүй (UI-д гарна)
        const silentPrompt =
          (prompt || "Миний тестийн үр дүнг дэлгэрэнгүй задлан шинжилж өгнө үү.") +
          "\n\nТайлан: " + (reportTitle || "Тест") +
          "\nҮр дүн: " + JSON.stringify(analysisResults || reportData || {})

        fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: silentPrompt }],
            sessionId: conversationRef.current?.id,
          }),
        })
          .then(function (r) { return r.json() })
          .then(function (data) {
            setIsTyping(false)
            setMessages(prev => [
              ...prev.slice(0, -1), // loading message-г устгана
              {
                role: "assistant" as const,
                content: data.reply || "Хариу авахад алдаа гарлаа.",
              },
            ])
          })
          .catch(function () {
            setIsTyping(false)
            setMessages(prev => [
              ...prev.slice(0, -1),
              {
                role: "assistant" as const,
                content: "Алдаа гарлаа. Дахин оролдоно уу.",
              },
            ])
          })
      }
    }

    window.addEventListener("message", handleExternalMessage)
    return () => window.removeEventListener("message", handleExternalMessage)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleNewConversation = () => {
    const newConv = createNewConversation()
    setActiveConversation(newConv)
    setConversation(newConv)
    setMessages([{
      role: "assistant",
      content: "Сайн байна уу!\n\nБи бол hire.mn-ийн AI туслагч. Та надаас дараах зүйлсийг асууж болно:\n\n- **Тест санал болгох:** Танд тохирсон тестүүдийг олж өгнө\n- **Тестийн үр дүн тайлбарлах:** Авсан тестийн хариуг шинжилж, зөвлөгөө өгнө\n- **Мэргэжлийн зөвлөгөө:** Сэтгэл зүй, ажлын байрны асуудлаар туслана",
    }])
    setInput("")
  }

  const handleSelectConversation = (conv: Conversation) => {
    setConversation(conv)
    setActiveConversation(conv)
    setMessages(conv.messages.length > 0 ? conv.messages : [{
      role: "assistant",
      content: "Сайн байна уу!\n\nБи бол hire.mn-ийн AI туслагч. Та надаас дараах зүйлсийг асууж болно:\n\n- **Тест санал болгох:** Танд тохирсон тестүүдийг олж өгнө\n- **Тестийн үр дүн тайлбарлах:** Авсан тестийн хариуг шинжилж, зөвлөгөө өгнө\n- **Мэргэжлийн зөвлөгөө:** Сэтгэл зүй, ажлын байрны асуудлаар туслана",
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
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  const sendMessage = async (text: string) => {
    // Check if user is locked - popup will show automatically
    if (!canSendMessage()) {
      return
    }

    if (!text.trim() || isTyping) return

    // Increment daily count
    incrementDailyCount()

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
                icon: member.category === 'system' ? "system" : member.category === 'test' ? "test" : "rocket",
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
                icon: "rocket",
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
            content: "**Үнэгүй тестүүд**\n\nТа эдгээр тестүүдийг ямар ч төлбөргүйгээр өгч, өөрийнхөө талаар илүү ихийг мэдэж авах боломжтой:",
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
            content: "**Төлбөртэй тестүүд**\n\nМэргэжлийн судлаачдын боловсруулсан мэргэжлийн шинжилгээ, дэлгэрэнгүй тайлантай тестүүд. Төлбөрийг **QPay**-ээр төлөх боломжтой.",
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
          @keyframes hw-btn-float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
}
@keyframes hw-bubble-in {
  0% { opacity: 0; transform: translateX(10px) scale(0.9); }
  100% { opacity: 1; transform: translateX(0) scale(1); }
}
        @keyframes hw-pulse {
         0%, 100% { box-shadow: 0 10px 30px rgba(232,84,26,.4); }
  50%       { box-shadow: 0 10px 30px rgba(232,84,26,.4); }
        }
        @keyframes hw-chip-in {
          from { transform: scale(0.7) translateY(10px); opacity: 0; }
          70%  { transform: scale(1.05) translateY(-2px); opacity: 1; }
          to   { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes hw-tooltip-in {
          from { opacity: 0; transform: translateX(10px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes hw-ring {
          0% { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes hw-msg-in {
          from { transform: translateY(12px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes hw-chat-open {
          from { transform: translateY(20px) scale(0.96); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes hw-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        @keyframes hw-gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes hw-online-dot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.7; }
        }
        @keyframes hw-orb-float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(8px, -12px); }
        }
        @keyframes hw-pop {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes hw-chip-in {
          from { transform: translateY(8px) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes hw-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }

        .hw-msg { animation: hw-msg-in 0.3s ease both; }

        .hw-card {
          transition: transform 0.25s cubic-bezier(.16,1,.3,1), box-shadow 0.25s ease, border-color 0.2s;
          will-change: transform;
        }
        .hw-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 36px rgba(232,84,26,.14), 0 4px 12px rgba(0,0,0,.06) !important;
          border-color: rgba(232,84,26,0.2) !important;
        }
        .hw-card:hover .hw-cta {
          background: #D44810 !important;
          box-shadow: 0 4px 14px rgba(232,84,26,.35) !important;
        }

        .hw-cta { transition: all 0.2s ease; }

        .hw-chip { transition: all 0.18s ease; }
        .hw-chip:hover {
          background: #E8541A !important;
          color: #fff !important;
          border-color: #E8541A !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(232,84,26,.25) !important;
        }
        .hw-chip:active { transform: scale(0.97); }

        .hw-send { transition: all 0.18s ease; }
        .hw-send:hover:not(:disabled) {
          background: #D44810 !important;
          transform: scale(1.06);
          box-shadow: 0 4px 16px rgba(232,84,26,.35) !important;
        }
        .hw-send:active:not(:disabled) { transform: scale(0.94); }

        .hw-mascot { transition: transform 0.25s cubic-bezier(.16,1,.3,1); will-change: transform; }
        .hw-mascot:hover { box-shadow: none !important; background: #FFFFFF !important; }
        .hw-mascot:active { transform: scale(0.95); }

        .hw-arrow { transition: all 0.18s ease; }
        .hw-arrow:hover {
          transform: translateY(-50%) scale(1.12);
          box-shadow: 0 3px 12px rgba(232,84,26,.2);
          border-color: rgba(232,84,26,0.2);
        }

        .hw-tab { transition: all 0.18s ease; }

        .hw-scroll::-webkit-scrollbar { width: 3px; }
        .hw-scroll::-webkit-scrollbar-track { background: transparent; }
        .hw-scroll::-webkit-scrollbar-thumb { background: rgba(232,84,26,.12); border-radius: 3px; }
        .hw-scroll::-webkit-scrollbar-thumb:hover { background: rgba(232,84,26,.25); }

        .hw-font-slider { -webkit-appearance: none; width: 100%; height: 4px; border-radius: 2px; outline: none; cursor: pointer;
          background: linear-gradient(to right, #E8541A calc((var(--val) - 11) / 6 * 100%), #F0E4DF calc((var(--val) - 11) / 6 * 100%));
        }
        .hw-font-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #E8541A; border: 2.5px solid #fff; box-shadow: 0 2px 8px rgba(232,84,26,.35); cursor: pointer; transition: transform 0.15s; }
        .hw-font-slider::-webkit-slider-thumb:hover { transform: scale(1.2); }
        .hw-font-slider::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: #E8541A; border: 2.5px solid #fff; cursor: pointer; }

        /* Input focus ring */
        .hw-input-wrap:focus-within {
          border-color: #E8541A !important;
          box-shadow: 0 0 0 3px rgba(232,84,26,0.12), 0 2px 8px rgba(0,0,0,0.06) !important;
        }

        /* Mobile fullscreen */
        @media (max-width: 480px) {
          .hw-root {
            bottom: 0 !important;
            right: 0 !important;
          }
          .hw-panel {
            width: 100vw !important;
            height: 100vh !important;
            height: 100dvh !important;
            max-width: 100vw !important;
            border-radius: 0 !important;
          }
          .hw-panel-animation {
            animation: none !important;
          }
        }
        
        /* Small mobile */
        @media (max-width: 380px) {
          .hw-panel {
            width: 100vw !important;
            height: 100vh !important;
            height: 100dvh !important;
            border-radius: 0 !important;
          }
        }
        
        /* Tablet */
        @media (min-width: 481px) and (max-width: 768px) {
          .hw-panel {
            width: 380px !important;
            height: min(600px, calc(100vh - 100px)) !important;
          }
        }
        
        /* Landscape mobile */
        @media (max-height: 500px) and (orientation: landscape) {
          .hw-panel {
            height: 100vh !important;
            height: 100dvh !important;
            width: min(400px, 60vw) !important;
          }
        }
        
        /* FAB mobile adjustments */
        @media (max-width: 480px) {
          .hw-fab-text {
            display: none !important;
          }
          .hw-mascot {
            padding-right: 8px !important;
            gap: 0 !important;
          }
        }
      `}</style>

      <div className="hw-root" style={{
        position: "fixed", bottom: 16, right: 16, zIndex: 99999,
        display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 14,
      }}>

        {/* ═══════════════════════════════════════════════════════════════════════
            FUTURISTIC LIQUID GLASS CHAT PANEL
            ═══════════════════════════════════════════════════════════════════════ */}
        {isOpen && (
          <div className="hw-panel-animation" style={{ animation: "hw-chat-open 0.6s cubic-bezier(.16,1,.3,1)" }}>
            <div className="hw-panel" style={{
              width: 400,
              height: "min(640px, calc(100vh - 80px))",
              position: "relative",
              overflow: "hidden",
              maxWidth: "calc(100vw - 24px)",
              borderRadius: 20,
              background: "#FFFFFF",
              boxShadow: "0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
              display: "flex", flexDirection: "column",
              border: "1px solid rgba(0,0,0,0.06)",
            }}>

              {/* ══════════ CLEAN HEADER ══════════ */}
              <div style={{
                background: "#E8541A",
                padding: "16px 16px 0",
                flexShrink: 0,
                borderRadius: "20px 20px 0 0",
                position: "relative",
                overflow: "hidden",
              }}>
                {/* Subtle decorative orb */}
                <div style={{
                  position: "absolute", top: -40, right: -40, width: 120, height: 120, borderRadius: "50%",
                  background: "rgba(255,255,255,0.08)", pointerEvents: "none",
                }} />
                <div style={{
                  position: "absolute", bottom: -20, left: -10, width: 70, height: 70, borderRadius: "50%",
                  background: "rgba(255,255,255,0.05)", pointerEvents: "none",
                }} />

                {/* Header content */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, position: "relative", zIndex: 1 }}>
                  {/* Mascot avatar */}
                  <div style={{
                    width: 46, height: 46, borderRadius: 14,
                    background: "rgba(255,255,255,0.95)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden", flexShrink: 0,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}>
                    <SplineMascot width={46} height={46} borderRadius={0} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#fff", fontWeight: 700, fontSize: 15, letterSpacing: "-0.2px" }}>
                        hire.mn AI
                      </span>
                      <span style={{
                        display: "flex", alignItems: "center", gap: 4,
                        background: "rgba(255,255,255,0.18)",
                        border: "1px solid rgba(255,255,255,0.25)",
                        padding: "2px 8px", borderRadius: 20,
                      }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: "50%", background: "#4ADE80",
                          animation: "hw-online-dot 2s ease-in-out infinite",
                          display: "inline-block",
                        }} />
                        <span style={{ color: "rgba(255,255,255,0.95)", fontSize: 10, fontWeight: 600, letterSpacing: "0.3px" }}>
                          ОНЛАЙН
                        </span>
                      </span>
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2, fontWeight: 400 }}>
                      24/7 танд туслахад бэлэн
                    </div>
                  </div>

                  {/* Close button */}
                  <button
                    onClick={() => setIsOpen(false)}
                    style={{
                      width: 34, height: 34, borderRadius: 10,
                      background: "rgba(255,255,255,0.15)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      color: "#fff", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.2s ease", flexShrink: 0,
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.28)"
                        ; (e.currentTarget as HTMLElement).style.transform = "rotate(90deg)"
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.15)"
                        ; (e.currentTarget as HTMLElement).style.transform = "rotate(0deg)"
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* ══════════ TAB NAVIGATION ══════════ */}
                <div style={{
                  display: "flex", position: "relative", zIndex: 1,
                }}>
                  {[
                    { label: "Чат", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
                    { label: "FAQ", icon: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 16v-4M12 8h.01" },
                    { label: "Холбоо", icon: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72" },
                  ].map((tab, i) => (
                    <button
                      key={tab.label}
                      onClick={() => setActiveTab(i)}
                      className="hw-tab"
                      style={{
                        flex: 1, padding: "10px 8px 12px", borderRadius: 0,
                        background: "transparent",
                        border: "none", cursor: "pointer",
                        color: activeTab === i ? "#fff" : "rgba(255,255,255,0.55)",
                        fontSize: 13, fontWeight: 600,
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        transition: "all 0.2s ease",
                        borderBottom: activeTab === i ? "2px solid #fff" : "2px solid transparent",
                        letterSpacing: "-0.1px",
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d={tab.icon} />
                      </svg>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* TAB CONTENT */}
              {activeTab === 0 && (
                <>
                  {/* Chat Messages Area */}
                  <div className="hw-scroll" style={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: "auto",
                    padding: "20px 14px 12px",
                    display: "flex", flexDirection: "column", gap: 14,
                    background: "#F9FAFB",
                    position: "relative", zIndex: 1,
                  }}>
                    {messages.map((msg, i) => {
                      const prevUserMsg = msg.role === "assistant" && i > 0
                        ? messages.slice(0, i).reverse().find(m => m.role === "user")?.content || ""
                        : ""

                      return (
                        <div
                          key={i}
                          className="hw-msg"
                          style={{
                            animation: `hw-msg-in 0.4s cubic-bezier(.34,1.56,.64,1) ${i * 0.05}s both`,
                          }}
                        >
                          {msg.role === "assistant"
                            ? <BotMessage message={msg} fontSize={fontSize} userQuestion={prevUserMsg} />
                            : <UserMessage content={msg.content} fontSize={fontSize} />
                          }
                        </div>
                      )
                    })}

                    {isTyping && (
                      <div className="hw-msg" style={{ animation: "hw-msg-in 0.3s ease-out" }}>
                        <TypingIndicator />
                      </div>
                    )}

                    {showQuickReplies && !isTyping && (
                      <div style={{
                        display: "flex", flexDirection: "column", gap: 8, marginTop: 14,
                        padding: "16px",
                        background: "linear-gradient(145deg, rgba(255,255,255,0.95), rgba(255,252,250,0.9))",
                        borderRadius: 18,
                        border: "1px solid rgba(232,84,26,0.06)",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                      }}>
                        <div style={{
                          fontSize: 11, fontWeight: 600, color: "#9CA3AF",
                          marginBottom: 4, letterSpacing: "0.5px",
                          textTransform: "uppercase"
                        }}>
                          Түгээмэл асуултууд
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {QUICK_REPLIES.map((qr, i) => (
                            <button
                              key={qr.text}
                              className="hw-chip"
                              onClick={() => sendMessage(qr.text)}
                              style={{
                                background: "#fff",
                                border: "1.5px solid #E5E7EB",
                                color: "#374151",
                                borderRadius: 10,
                                padding: "8px 12px",
                                fontSize: Math.max(fontSize - 2, 12),
                                fontWeight: 500,
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                animation: `hw-chip-in 0.3s cubic-bezier(.16,1,.3,1) ${i * 0.06}s both`,
                                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                                display: "flex", alignItems: "center", gap: 8,
                                transition: "all 0.25s cubic-bezier(.16,1,.3,1)",
                              }}
                              onMouseEnter={e => {
                                (e.currentTarget as HTMLElement).style.background = "#E8541A"
                                  ; (e.currentTarget as HTMLElement).style.color = "#fff"
                                  ; (e.currentTarget as HTMLElement).style.borderColor = "#E8541A"
                                  ; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"
                                  ; (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 16px rgba(232,84,26,0.2)"
                              }}
                              onMouseLeave={e => {
                                (e.currentTarget as HTMLElement).style.background = "#fff"
                                  ; (e.currentTarget as HTMLElement).style.color = "#374151"
                                  ; (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"
                                  ; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"
                                  ; (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"
                              }}
                            >
                              <span style={{ opacity: 0.7 }}>
                                <QuickReplyIcon type={qr.iconType} />
                              </span>
                              {qr.text}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </>
              )}

              {activeTab === 1 && (
                /* FAQs Tab - Liquid Glass Accordion */
                <div className="hw-scroll" style={{
                  flex: 1, overflowY: "auto", padding: "24px 20px",
                  background: "transparent",
                  position: "relative", zIndex: 1,
                }}>
                  {/* FAQ Header */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 14, marginBottom: 24,
                    padding: "18px 20px",
                    background: "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,250,245,0.8) 100%)",
                    backdropFilter: "blur(20px)",
                    borderRadius: 20,
                    border: "1px solid rgba(255,255,255,0.6)",
                    boxShadow: "0 8px 32px rgba(232,84,26,0.1), inset 0 1px 0 rgba(255,255,255,0.8)",
                  }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 14,
                      background: "linear-gradient(135deg, #E8541A 0%, #FF6B3D 100%)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 4px 16px rgba(232,84,26,0.3)",
                    }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#333", letterSpacing: "-0.3px" }}>Түгээмэл асуултууд</div>
                      <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>Асуултаа сонгоод хариултыг нь үзнэ үү</div>
                    </div>
                  </div>

                  {/* FAQ Accordion */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[
                      {
                        q: "Hire.mn гэж юу вэ?",
                        a: "Hire.mn бол Монголын анхны AI-д суурилсан ажил горилогч болон ажил олгогчдыг холбосон платформ юм. Бид мэргэжлийн тест, ур чадварын үнэлгээ зэргээр таныг тохирох ажлын байртай холбоно.",
                        icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                      },
                      {
                        q: "Тест өгөхөд төлбөртэй юу?",
                        a: "Төлбөртэй болон төлбөргүй тестүүд бий. Үнэгүй тестүүдээс гадна Qpay ашиглан төлбөрөө төлж илүү дэлгэрэнгүй нарийвчилсан тестүүдийг өгөх боломжтой.",
                        icon: "M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2"
                      },
                      {
                        q: "Үр дүнгээ хэрхэн харах вэ?",
                        a: "Тест дуусмагц таны үр дүн шууд гарна. Профайл хэсэгт орж бзх тестийн үр дүнгээ харах, татаж авах, хуваалцах боломжтой. Мөн и-мэйлээр илгээх боломжтой.",
                        icon: "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"
                      },
                      {
                        q: "Компани хэрхэн бүртгүүлэх вэ?",
                        a: "Та манай администраторуудтай холбогдоно уу. Эсвэл Hire.mn facebook хуудсаар холбогдох боломжтой.",
                        icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                      },
                      {
                        q: "Тестийн ямар тестийн төрлүүд байдаг вэ?",
                        a: "IQ тест, EQ тест, зан чанарын тест, мэргэжлийн ур чадварын тест, хэлний түвшин тодорхойлох тест гэх мэт 40+ төрлийн тест байдаг. Та өөрт тохирох тестүүдийг сонгон өгч болно.",
                        icon: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"
                      },
                      {
                        q: "Үнэлгээний систем хэрхэн ажилладаг вэ?",
                        a: "AI алгоритм таны хариултуудыг дүн шинжилгээ хийж, олон улсын стандарт болон Монголын статистик дата-тай харьцуулан үнэлдэг. Үр дүн нь 95%+ нарийвчлалтай.",
                        icon: "M12 20V10M18 20V4M6 20v-4"
                      },
                    ].map((faq, i) => (
                      <div
                        key={i}
                        style={{
                          background: expandedFaq === i
                            ? "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,250,245,0.9) 100%)"
                            : "linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,250,245,0.7) 100%)",
                          backdropFilter: "blur(20px)",
                          border: expandedFaq === i
                            ? "1.5px solid rgba(232,84,26,0.3)"
                            : "1.5px solid rgba(255,255,255,0.6)",
                          borderRadius: 18,
                          overflow: "hidden",
                          transition: "all 0.4s cubic-bezier(.22,1,.36,1)",
                          boxShadow: expandedFaq === i
                            ? "0 12px 40px rgba(232,84,26,0.15), inset 0 1px 0 rgba(255,255,255,0.9)"
                            : "0 4px 16px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)",
                          animation: `hw-msg-in 0.5s cubic-bezier(.22,1,.36,1) ${i * 0.08}s both`,
                        }}
                      >
                        <button
                          onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                          style={{
                            width: "100%", textAlign: "left",
                            background: "transparent", border: "none",
                            padding: "16px 18px",
                            color: "#333", fontSize: 14, fontWeight: 600,
                            cursor: "pointer",
                            display: "flex", alignItems: "center", gap: 14,
                            transition: "all 0.3s",
                          }}
                        >
                          <div style={{
                            width: 38, height: 38, borderRadius: 12,
                            background: expandedFaq === i
                              ? "linear-gradient(135deg, #E8541A 0%, #FF6B3D 100%)"
                              : "linear-gradient(135deg, rgba(232,84,26,0.1) 0%, rgba(255,140,66,0.1) 100%)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                            transition: "all 0.4s cubic-bezier(.22,1,.36,1)",
                            boxShadow: expandedFaq === i ? "0 4px 12px rgba(232,84,26,0.3)" : "none",
                          }}>
                            <svg
                              width="18" height="18" viewBox="0 0 24 24" fill="none"
                              stroke={expandedFaq === i ? "#fff" : "#E8541A"}
                              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            >
                              <path d={faq.icon} />
                            </svg>
                          </div>
                          <span style={{ flex: 1, lineHeight: 1.4 }}>{faq.q}</span>
                          <div style={{
                            width: 28, height: 28, borderRadius: 8,
                            background: expandedFaq === i ? "rgba(232,84,26,0.1)" : "transparent",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.4s cubic-bezier(.22,1,.36,1)",
                            transform: expandedFaq === i ? "rotate(180deg)" : "rotate(0deg)",
                          }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E8541A" strokeWidth="2.5" strokeLinecap="round">
                              <path d="M6 9l6 6 6-6" />
                            </svg>
                          </div>
                        </button>

                        {/* Answer - Animated dropdown */}
                        <div style={{
                          maxHeight: expandedFaq === i ? "200px" : "0px",
                          opacity: expandedFaq === i ? 1 : 0,
                          overflow: "hidden",
                          transition: "all 0.4s cubic-bezier(.22,1,.36,1)",
                        }}>
                          <div style={{
                            padding: "0 18px 18px 70px",
                            fontSize: 13, lineHeight: 1.7, color: "#666",
                          }}>
                            {faq.a}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 2 && (
                /* Contact Tab - Warm themed */
                <div className="hw-scroll" style={{
                  flex: 1, overflowY: "auto", padding: "20px 16px",
                  background: "linear-gradient(180deg, #FFFBF8 0%, #FFFFFF 100%)",
                }}>
                  {/* Contact header card */}
                  <div style={{
                    background: "linear-gradient(135deg, #E8541A 0%, #FF6B3D 100%)",
                    borderRadius: 20, padding: "24px 20px", marginBottom: 20,
                    position: "relative", overflow: "hidden",
                  }}>
                    <div style={{
                      position: "absolute", top: -20, right: -20, width: 80, height: 80,
                      borderRadius: "50%", background: "rgba(255,255,255,0.1)",
                    }} />
                    <h3 style={{ color: "#fff", fontSize: 20, fontWeight: 700, marginBottom: 8, position: "relative" }}>
                      Холбоо барих
                    </h3>
                    <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 14, lineHeight: 1.5, position: "relative" }}>
                      Асуулт байвал бидэнтэй холбогдоорой
                    </p>
                  </div>

                  {/* Contact options */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[
                      { label: "И-мэйл", value: "info@axiominc.mn", icon: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6", href: "mailto:info@axiominc.mn" },
                      { label: "Утас", value: "+976 7011-1234", icon: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72", href: "tel:+9767511 1111" },
                      { label: "Веб", value: "hire.mn", icon: "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z", href: "https://hire.mn" },
                    ].map((item, i) => (
                      <a
                        key={item.label}
                        href={item.href}
                        target={item.href.startsWith("http") ? "_blank" : undefined}
                        rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        style={{
                          display: "flex", alignItems: "center", gap: 14,
                          background: "#fff", border: "1.5px solid rgba(232,84,26,0.12)",
                          borderRadius: 16, padding: "16px",
                          textDecoration: "none",
                          transition: "all 0.3s cubic-bezier(.34,1.56,.64,1)",
                          animation: `hw-msg-in 0.4s cubic-bezier(.34,1.56,.64,1) ${i * 0.1}s both`,
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.borderColor = "#E8541A"
                            ; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"
                            ; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(232,84,26,0.15)"
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.borderColor = "rgba(232,84,26,0.12)"
                            ; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"
                            ; (e.currentTarget as HTMLElement).style.boxShadow = "none"
                        }}
                      >
                        <div style={{
                          width: 44, height: 44, borderRadius: 14,
                          background: "linear-gradient(135deg, #FFF5EE 0%, #FFE8DC 100%)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8541A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d={item.icon} />
                          </svg>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>{item.label}</div>
                          <div style={{ fontSize: 15, color: "#333", fontWeight: 600 }}>{item.value}</div>
                        </div>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E8541A" strokeWidth="2" strokeLinecap="round">
                          <path d="M7 17L17 7M17 7H7M17 7v10" />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* INPUT AREA */}
              {activeTab === 0 && (
                <div style={{
                  padding: "10px 12px max(14px, env(safe-area-inset-bottom, 14px))",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,253,251,0.95) 100%)",
                  backdropFilter: "blur(20px)",
                  flexShrink: 0,
                  borderTop: "1px solid rgba(232,84,26,0.06)",
                  position: "relative", zIndex: 1,
                }}>
                  {/* Rate limit banner - shows when popup is dismissed */}
                  {isUserLocked() && rateLimitPopupDismissed && (
                    <div style={{
                      background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
                      border: "1px solid #F59E0B",
                      borderRadius: 12,
                      padding: "10px 14px",
                      marginBottom: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span style={{ fontSize: 12, color: "#92400E", fontWeight: 500 }}>
                        Өнөөдрийн эрх дууссан байна. {formatUnlockTime()} хүртэл хүлээнэ үү.
                      </span>
                    </div>
                  )}
                  <div style={{
                    display: "flex", gap: 8, alignItems: "center",
                    background: isUserLocked() ? "#F3F4F6" : "linear-gradient(135deg, #fff 0%, #FFFCFA 100%)",
                    border: isUserLocked() ? "2px solid #E5E7EB" : "2px solid rgba(232,84,26,0.1)",
                    borderRadius: 16, padding: "4px 5px 4px 14px",
                    transition: "all 0.3s cubic-bezier(.16,1,.3,1)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)",
                    opacity: isUserLocked() ? 0.7 : 1,
                  }}
                    onFocusCapture={e => {
                      if (isUserLocked()) return
                      (e.currentTarget as HTMLElement).style.borderColor = "#E8541A"
                        ; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(232,84,26,0.15), inset 0 1px 0 rgba(255,255,255,0.8)"
                        ; (e.currentTarget as HTMLElement).style.transform = "scale(1.01)"
                    }}
                    onBlurCapture={e => {
                      if (isUserLocked()) return
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(232,84,26,0.1)"
                        ; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)"
                        ; (e.currentTarget as HTMLElement).style.transform = "scale(1)"
                    }}
                  >
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKey}
                      placeholder={isUserLocked() ? "Өнөөдрийн эрх дууссан..." : "Асуулт бичнэ үү..."}
                      disabled={isUserLocked()}
                      style={{
                        flex: 1, border: "none", background: "transparent",
                        fontSize: fontSize, outline: "none",
                        color: isUserLocked() ? "#9CA3AF" : "#333", padding: "10px 0",
                        fontWeight: 500,
                        cursor: isUserLocked() ? "not-allowed" : "text",
                      }}
                    />
                    <button
                      className="hw-send"
                      onClick={() => sendMessage(input)}
                      disabled={!input.trim() || isTyping || isUserLocked()}
                      style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: input.trim() && !isTyping
                          ? "linear-gradient(135deg, #E8541A 0%, #FF6B3D 100%)"
                          : "linear-gradient(135deg, #E5E5E5 0%, #D9D9D9 100%)",
                        border: "none",
                        cursor: input.trim() && !isTyping ? "pointer" : "not-allowed",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                        transition: "all 0.3s cubic-bezier(.16,1,.3,1)",
                        boxShadow: input.trim() && !isTyping
                          ? "0 4px 16px rgba(232,84,26,0.3)"
                          : "none",
                      }}
                      onMouseEnter={e => {
                        if (input.trim() && !isTyping) {
                          (e.currentTarget as HTMLElement).style.transform = "scale(1.08) rotate(5deg)"
                            ; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(232,84,26,0.4)"
                        }
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.transform = "scale(1) rotate(0deg)"
                          ; (e.currentTarget as HTMLElement).style.boxShadow = input.trim() && !isTyping ? "0 4px 16px rgba(232,84,26,0.3)" : "none"
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" fill="white" stroke="none" />
                      </svg>
                    </button>
                  </div>

                  {/* Warning - shows when 10 or less remaining */}
                  {getRemainingMessages() <= 10 && getRemainingMessages() > 0 && (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      marginTop: 10,
                      padding: "8px 12px",
                      borderRadius: 8,
                      backgroundColor: getRemainingMessages() <= 3 ? "#FEF2F2" : "#FFFBEB",
                      border: `1px solid ${getRemainingMessages() <= 3 ? "#FECACA" : "#FDE68A"}`,
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={getRemainingMessages() <= 3 ? "#DC2626" : "#D97706"} strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v4M12 16h.01" />
                      </svg>
                      <span style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: getRemainingMessages() <= 3 ? "#DC2626" : "#92400E",
                      }}>
                        Танд {getRemainingMessages()} асуулт асуух эрх үлдсэн байна
                      </span>
                    </div>
                  )}

                  <div style={{ textAlign: "center", marginTop: 10, fontSize: 10, color: "#aaa", fontWeight: 500 }}>
                    hire.mn AI
                  </div>
                </div>
              )}

              {/* Usage Limit Popup */}
              {isUserLocked() && !rateLimitPopupDismissed && (
                <UsageLimitPopup onClose={() => setRateLimitPopupDismissed(true)} />
              )}

              {/* Sidebar Overlay */}
              {showSidebar && (
                <ConversationSidebar
                  activeId={conversation?.id}
                  onSelectConversation={handleSelectConversation}
                  onNewConversation={handleNewConversation}
                  onClose={() => setShowSidebar(false)}
                  isVisible={showSidebar}
                />
              )}

            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            FUTURISTIC FLOATING ACTION BUTTON
            ═══════════════════════���═�����═������══��═══════════════════════════════════════ */}
        {!isOpen && (
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "flex-end", padding: 12, width: "100%", height: "100%", boxSizing: "border-box" as const }}>
            {/* Animated ring effects */}
            <div style={{ position: "relative" }}>
              <div style={{
                position: "absolute", inset: -8, borderRadius: 40,
                background: "linear-gradient(135deg, rgba(232,84,26,0.2), rgba(255,140,66,0.15))",
                animation: "hw-ring 3s ease-out infinite",
              }} />
              <div style={{
                position: "absolute", inset: -3, borderRadius: 38,
                background: "linear-gradient(135deg, rgba(232,84,26,0.15), rgba(255,107,61,0.1))",
                animation: "hw-ring 3s ease-out 0.8s infinite",
              }} />

              <button
                className="hw-mascot"
                onClick={() => setIsOpen(o => !o)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                aria-label="hire.mn чат нээх"
                style={{
                  height: 90,
                  borderRadius: 45,
                  background: `linear-gradient(135deg, #E8541A 0%, #F06835 50%, #FF8C42 100%)`,
                  backgroundSize: "200% 200%",
                  animation: isHovered ? "hw-gradient-shift 3s ease infinite" : "none",
                  border: "1.5px solid rgba(255,255,255,0.25)",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 10,
                  paddingLeft: 6, paddingRight: 22,
                  flexShrink: 0, position: "relative",
                  boxShadow: isHovered
                    ? `0 12px 32px rgba(232,84,26,0.4), 0 6px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.25)`
                    : `0 8px 24px rgba(232,84,26,0.3), 0 3px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.15)`,
                  transition: "all 0.3s cubic-bezier(.16,1,.3,1)",
                  transform: isHovered ? "scale(1.04) translateY(-2px)" : "scale(1) translateY(0)",
                  overflow: "hidden",
                }}
              >
                {/* Shimmer overlay on hover */}
                <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: 36, zIndex: 0 }}>
                  <div style={{
                    position: "absolute", top: 0, left: "-100%", width: "50%", height: "100%",
                    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)",
                    animation: isHovered ? "hw-shimmer 1.2s ease-in-out infinite" : "none",
                  }} />
                </div>

                {/* White circle with mascot fully inside */}
                <div style={{
                  width: 80, height: 80, borderRadius: "50%",
                  background: "rgba(255,255,255,0.97)",
                  flexShrink: 0,
                  position: "relative",
                  zIndex: 1,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
                  overflow: "hidden",
                  transition: "transform 0.3s cubic-bezier(.16,1,.3,1)",
                  transform: isHovered ? "scale(1.06)" : "scale(1)",
                }}>
                  <SplineMascot
                    width={80}
                    height={80}
                    borderRadius={40}
                    style={{ display: "block" }}
                  />
                </div>

                <span style={{
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  textShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  letterSpacing: "-0.3px",
                  position: "relative",
                  zIndex: 1,
                }}>
                  <span className="hw-fab-text">Чат</span>
                </span>

                {/* Pulsing online indicator */}
                <span style={{
                  position: "absolute", bottom: 6, right: 8,
                  width: 10, height: 10, borderRadius: "50%",
                  background: "#4ADE80",
                  border: "2px solid #fff",
                  boxShadow: "0 0 0 3px rgba(34,197,94,0.2)",
                  animation: "hw-online-pulse 2s ease-in-out infinite",
                  zIndex: 11,
                }} />
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  )
}
