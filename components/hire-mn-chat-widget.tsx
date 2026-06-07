"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { MessageFeedback } from './message-feedback'
import { ConversationSidebar } from './conversation-sidebar'
import { SplineMascot } from './spline-mascot'
import { AnalysisCard, AnalysisResults } from './analysis-results'
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
  isUserLocked
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
  insightCard?: InsightCardData
  briefSummary?: string             // Short chat-bubble version
  analysisStatus?: "loading" | "done" | "error"  // Artifact button state
  followUps?: FollowUpMessage[]     // In-artifact Q&A history
  completedSteps?: number[]         // Indices of action plan items checked off
  analysisData?: any                // New /api/analyze response shape
  analysisTitle?: string            // Test name for analysis card
}

interface FollowUpMessage {
  role: "user" | "assistant"
  content: string
  pending?: boolean
}

interface InsightSubScore {
  label: string
  value: string
  level: "low" | "mid" | "high"
  bar?: number // 0-100
}

interface InsightTrait {
  label: string         // "Удирдах чадвар (D)"
  levelLabel: string    // "Сайн" / "Маш сайн" / "Дундаж"
  score: number
  total: number
  level: "low" | "mid" | "high" | "excellent"
}

interface InsightCardData {
  testName: string
  resultLabel: string
  score: number
  total: number
  description?: string
  subScores?: InsightSubScore[]
  traits?: InsightTrait[]  // Full-width trait breakdown cards
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
  const icons: Record<string, React.ReactElement> = {
    list: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>,
    target: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
    gift: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/></svg>,
    info: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>,
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

// ── Insight Card (Apple Health-style result visualization) ────────────────────

function InsightCard({ data }: { data: InsightCardData }) {
  const pct = data.total > 0 ? Math.round((data.score / data.total) * 100) : 0
  const radius = 38
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  // Colour scheme based on percentage
  const tone =
    pct >= 75 ? { ring: "#10B981", soft: "#D1FAE5", bg: "#ECFDF5" }
    : pct >= 50 ? { ring: "#F59E0B", soft: "#FEF3C7", bg: "#FFFBEB" }
    : { ring: "#EF4444", soft: "#FEE2E2", bg: "#FEF2F2" }

  const levelColour = (lvl: InsightSubScore["level"]) =>
    lvl === "low" ? { color: "#10B981", bg: "#ECFDF5", label: "Бага" }
    : lvl === "high" ? { color: "#EF4444", bg: "#FEF2F2", label: "Их" }
    : { color: "#F59E0B", bg: "#FFFBEB", label: "Дунд" }

  return (
    <div style={{
      background: "linear-gradient(145deg, #fff 0%, #FFFCFA 100%)",
      borderRadius: 20,
      padding: 18,
      border: "1.5px solid rgba(232,84,26,0.08)",
      boxShadow: "0 8px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
      maxWidth: "100%",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
        fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: "#3B82F6",
        textTransform: "uppercase",
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#3B82F6">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
        Health Score
      </div>

      {/* Test name pill */}
      <div style={{
        display: "inline-block",
        background: tone.bg,
        color: tone.ring,
        padding: "6px 12px",
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 600,
        marginBottom: 14,
        border: `1px solid ${tone.soft}`,
      }}>
        {data.testName}
      </div>

      {/* Score row */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
        {/* Circular progress */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <svg width="96" height="96" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r={radius} fill="none" stroke={tone.soft} strokeWidth="8"/>
            <circle
              cx="48" cy="48" r={radius} fill="none"
              stroke={tone.ring} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={offset}
              transform="rotate(-90 48 48)"
              style={{ transition: "stroke-dashoffset 1s cubic-bezier(.16,1,.3,1)" }}
            />
          </svg>
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#1F2937", lineHeight: 1 }}>{pct}</div>
            <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600 }}>/100</div>
          </div>
        </div>

        {/* Right side: score breakdown */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            background: "#F9FAFB",
            borderRadius: 12,
            padding: "10px 12px",
            marginBottom: 8,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1F2937" }}>
                {data.score}/{data.total}
              </div>
              <div style={{ fontSize: 10, color: "#6B7280", fontWeight: 500 }}>оноо</div>
            </div>
            <div style={{
              background: tone.bg, color: tone.ring,
              padding: "4px 10px", borderRadius: 999,
              fontSize: 12, fontWeight: 700,
            }}>
              {pct}%
            </div>
          </div>
          <div style={{
            fontSize: 13, fontWeight: 600, color: tone.ring, marginBottom: 2,
          }}>
            {data.resultLabel}
          </div>
        </div>
      </div>

      {/* Description */}
      {data.description && (
        <div style={{
          fontSize: 12, lineHeight: 1.55, color: "#4B5563",
          padding: "10px 12px", background: "#F9FAFB", borderRadius: 12,
          marginBottom: data.subScores && data.subScores.length > 0 ? 14 : 0,
        }}>
          {data.description}
        </div>
      )}

      {/* Sub-scores (compact 3-column glance) */}
      {data.subScores && data.subScores.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(data.subScores.length, 3)}, 1fr)`, gap: 8 }}>
          {data.subScores.map((s, i) => {
            const lvl = levelColour(s.level)
            return (
              <div key={i} style={{
                background: "#fff", borderRadius: 12, padding: 10,
                border: "1px solid #F3F4F6",
              }}>
                <div style={{
                  fontSize: 9, fontWeight: 700, color: "#9CA3AF",
                  textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4,
                  lineHeight: 1.3,
                }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: lvl.color, marginBottom: 4 }}>
                  {s.value}
                </div>
                {typeof s.bar === "number" && (
                  <div style={{ height: 4, background: "#F3F4F6", borderRadius: 2, overflow: "hidden", marginBottom: 4 }}>
                    <div style={{
                      width: `${Math.max(0, Math.min(100, s.bar))}%`,
                      height: "100%",
                      background: lvl.color,
                      borderRadius: 2,
                      transition: "width 0.8s cubic-bezier(.16,1,.3,1)",
                    }}/>
                  </div>
                )}
                <div style={{ fontSize: 10, color: "#6B7280", fontWeight: 500 }}>
                  {lvl.label}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Trait Breakdown Cards (full-width per-dimension scoring) ──────────────────

function TraitBreakdown({ traits }: { traits: InsightTrait[] }) {
  const palette = (lvl: InsightTrait["level"]) => {
    switch (lvl) {
      case "excellent": return { color: "#10B981", soft: "#D1FAE5", bg: "#ECFDF5", text: "Маш сайн" }
      case "high":      return { color: "#EF4444", soft: "#FECACA", bg: "#FEF2F2", text: "Сайн" }
      case "mid":       return { color: "#F59E0B", soft: "#FDE68A", bg: "#FFFBEB", text: "Дундаж" }
      default:          return { color: "#F97316", soft: "#FFEDD5", bg: "#FFF7ED", text: "Бага" }
    }
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: 10,
      marginTop: 10,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: "#6B7280",
        letterSpacing: 1, textTransform: "uppercase",
        paddingLeft: 4,
      }}>
        Дэлгэрэнгүй задаргаа
      </div>
      {traits.map((t, i) => {
        const pct = t.total > 0 ? Math.round((t.score / t.total) * 100) : 0
        const c = palette(t.level)
        return (
          <div key={i} style={{
            background: "#fff",
            borderRadius: 16,
            padding: "14px 16px",
            border: "1.5px solid rgba(0,0,0,0.04)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
            animation: `hw-msg-in 0.5s cubic-bezier(.16,1,.3,1) ${i * 0.08}s both`,
          }}>
            {/* Header row */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
              marginBottom: 12,
            }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                  fontSize: 15, fontWeight: 700, color: "#111827",
                  marginBottom: 4, lineHeight: 1.25,
                }}>
                  {t.label}
                </div>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: c.color,
                }}>
                  {t.levelLabel || c.text}
                </div>
              </div>
              <div style={{
                background: c.bg,
                color: c.color,
                padding: "6px 12px",
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 800,
                border: `1px solid ${c.soft}`,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}>
                {t.score}/{t.total}
              </div>
            </div>

            {/* Progress bar with shimmer */}
            <div style={{
              height: 10,
              background: "#F3F4F6",
              borderRadius: 10,
              overflow: "hidden",
              position: "relative",
            }}>
              <div style={{
                width: `${pct}%`,
                height: "100%",
                background: `linear-gradient(90deg, ${c.color}, ${c.color}cc)`,
                borderRadius: 10,
                transition: "width 1.4s cubic-bezier(.16,1,.3,1)",
                boxShadow: `0 0 12px ${c.color}66`,
                position: "relative",
                overflow: "hidden",
              }}>
                <div className="hw-shimmer-bar" style={{
                  position: "absolute", inset: 0,
                }}/>
              </div>
            </div>
            {/* Percentage hint */}
            <div style={{
              marginTop: 6,
              display: "flex", justifyContent: "space-between",
              fontSize: 9, fontWeight: 700, color: "#9CA3AF",
              letterSpacing: 0.3,
            }}>
              <span>0</span>
              <span style={{ color: c.color }}>{pct}%</span>
              <span>100</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Artifact Preview (compact chat bubble with "Open" button) ────────────────

function ArtifactPreview({ message, onOpen, fontSize }: {
  message: Message
  onOpen?: (m: Message) => void
  fontSize: number
}) {
  const card = message.insightCard!
  const pct = card.total > 0 ? Math.round((card.score / card.total) * 100) : 0
  const tone =
    pct >= 75 ? { ring: "#10B981", soft: "#D1FAE5", bg: "#ECFDF5" }
    : pct >= 50 ? { ring: "#F59E0B", soft: "#FEF3C7", bg: "#FFFBEB" }
    : { ring: "#EF4444", soft: "#FEE2E2", bg: "#FEF2F2" }

  const status = message.analysisStatus || "loading"
  const buttonDisabled = false // Always allow opening — artifact shows loading state inside

  return (
    <div style={{
      maxWidth: "82%",
      background: "linear-gradient(145deg, #fff 0%, #FFFCFA 100%)",
      border: "1.5px solid rgba(232,84,26,0.08)",
      borderRadius: 18,
      borderBottomLeftRadius: 4,
      padding: "14px 16px",
      boxShadow: "0 4px 16px rgba(0,0,0,.04), inset 0 1px 0 rgba(255,255,255,0.9)",
    }}>
      {/* Brief summary text */}
      <div style={{
        fontSize: fontSize, lineHeight: 1.55, color: "#1F2937",
        marginBottom: 12,
      }}>
        {message.briefSummary}
      </div>

      {/* Mini-card preview row */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "10px 12px",
        background: tone.bg,
        border: `1px solid ${tone.soft}`,
        borderRadius: 12,
        marginBottom: 12,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: `linear-gradient(135deg, ${tone.ring}, ${tone.ring}cc)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 14, fontWeight: 800,
          flexShrink: 0,
          boxShadow: `0 4px 12px ${tone.ring}40`,
        }}>
          {pct}%
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize: 13, fontWeight: 700, color: "#111827",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {card.testName}
          </div>
          <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 500 }}>
            {card.score}/{card.total} оноо · <span style={{ color: tone.ring, fontWeight: 700 }}>{card.resultLabel}</span>
          </div>
        </div>
      </div>

      {/* Open artifact button */}
      <button
        type="button"
        onClick={() => !buttonDisabled && onOpen?.(message)}
        disabled={buttonDisabled}
        style={{
          width: "100%",
          background: status === "loading"
            ? "linear-gradient(135deg, #F3F4F6, #E5E7EB)"
            : "linear-gradient(135deg, #E8541A 0%, #F07040 100%)",
          color: status === "loading" ? "#6B7280" : "#fff",
          border: "none",
          borderRadius: 12,
          padding: "12px 16px",
          fontSize: 13, fontWeight: 700,
          cursor: buttonDisabled ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: status === "loading" ? "none" : "0 6px 18px rgba(232,84,26,0.3)",
          transition: "all 0.25s cubic-bezier(.16,1,.3,1)",
          fontFamily: "inherit",
          animation: status === "done" ? "hw-glow-pulse 2.4s ease-in-out infinite" : undefined,
        }}
        onMouseEnter={e => {
          if (status !== "loading") {
            ;(e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"
            ;(e.currentTarget as HTMLElement).style.boxShadow = "0 10px 24px rgba(232,84,26,0.4)"
          }
        }}
        onMouseLeave={e => {
          ;(e.currentTarget as HTMLElement).style.transform = "translateY(0)"
          if (status !== "loading") {
            ;(e.currentTarget as HTMLElement).style.boxShadow = "0 6px 18px rgba(232,84,26,0.3)"
          }
        }}
      >
        {status === "loading" ? (
          <>
            <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid #9CA3AF", borderTopColor: "transparent", borderRadius: "50%", animation: "hw-spin 0.8s linear infinite" }} />
            AI шинжилгээ хийж байна...
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "hw-icon-bounce 2.4s ease-in-out infinite" }}>
              <path d="M12 2l1.4 4.3L17.7 8l-4.3 1.4L12 14l-1.4-4.6L6.3 8l4.3-1.7z" fill="currentColor"/>
              <path d="M19 12l.7 2L22 15l-2.3.6L19 18l-.7-2.4L16 15l2.3-1z" fill="currentColor"/>
              <path d="M5 16l.5 1.5L7 18l-1.5.5L5 20l-.5-1.5L3 18l1.5-.5z" fill="currentColor"/>
            </svg>
            Дэлгэрэнгүй үр дүн харах
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7"/>
            </svg>
          </>
        )}
      </button>
    </div>
  )
}

// ── Parse AI advice into structured sections ─────────────────────────────────

interface AdviceSection {
  key: "summary" | "strengths" | "watchouts" | "tips" | "next"
  title: string
  emoji: string
  bullets: string[]
  intro?: string // For summary: prose text
}

function parseAdvice(text: string): AdviceSection[] {
  if (!text || !text.trim()) return []

  // Section title → key mapping
  const sectionMap: Array<{ patterns: RegExp[]; key: AdviceSection["key"]; title: string; emoji: string }> = [
    { patterns: [/гол\s*дүгнэлт/i, /key\s*insight/i, /summary/i],     key: "summary",   title: "Гол дүгнэлт",      emoji: "🎯" },
    { patterns: [/давуу\s*тал/i, /strength/i],                          key: "strengths", title: "Давуу тал",        emoji: "✨" },
    { patterns: [/анхаарах\s*зүйл/i, /watch.?out/i, /сул\s*тал/i],     key: "watchouts", title: "Анхаарах зүйл",    emoji: "⚠️" },
    { patterns: [/практик\s*зөвлөмж/i, /зөвлөмж/i, /tip/i, /advice/i], key: "tips",      title: "Практик зөвлөмж",  emoji: "💡" },
    { patterns: [/цаашдын\s*алхам/i, /next\s*step/i, /цаашид/i],       key: "next",      title: "Цаашдын алхам",    emoji: "🚀" },
  ]

  // Split by lines, find header rows like "**Гол дүгнэлт**" or "1. **Гол дүгнэлт**"
  const lines = text.split("\n").map(l => l.trim())
  const sections: AdviceSection[] = []
  let current: AdviceSection | null = null
  let introBuffer: string[] = []

  const matchHeader = (line: string): { key: AdviceSection["key"]; title: string; emoji: string } | null => {
    // Strip markdown bold + leading numbers
    const stripped = line
      .replace(/^[#\-•\s]*/, "")
      .replace(/^\d+[.)]\s*/, "")
      .replace(/^\*+/, "")
      .replace(/\*+$/, "")
      .replace(/[:：—–-]+\s*$/, "")
      .trim()
    if (!stripped) return null
    for (const s of sectionMap) {
      if (s.patterns.some(p => p.test(stripped))) {
        // Must be short (header-like)
        if (stripped.length < 40) return { key: s.key, title: s.title, emoji: s.emoji }
      }
    }
    return null
  }

  for (const raw of lines) {
    if (!raw) continue
    if (/^[-=─━]{2,}$/.test(raw)) continue // divider

    const header = matchHeader(raw)
    if (header) {
      if (current) sections.push(current)
      current = { key: header.key, title: header.title, emoji: header.emoji, bullets: [] }
      continue
    }

    if (!current) {
      // Pre-section text → keep as intro for summary
      introBuffer.push(raw.replace(/\*\*/g, ""))
      continue
    }

    // Bullet: "•" or "-" or "*"
    const bulletMatch = raw.match(/^[•\-*]\s+(.+)$/)
    if (bulletMatch) {
      current.bullets.push(bulletMatch[1].trim())
      continue
    }
    // Plain text — append to last bullet if there's one, else as prose
    if (current.bullets.length > 0) {
      current.bullets[current.bullets.length - 1] += " " + raw
    } else {
      // Treat as the section's main prose (for summary section)
      current.intro = (current.intro ? current.intro + " " : "") + raw.replace(/\*\*/g, "")
    }
  }
  if (current) sections.push(current)

  // Attach floating intro to summary section if present
  if (introBuffer.length > 0) {
    const summary = sections.find(s => s.key === "summary")
    if (summary) {
      summary.intro = (introBuffer.join(" ") + (summary.intro ? " " + summary.intro : "")).trim()
    }
  }

  // Clean up: remove ** markers from every bullet
  sections.forEach(s => {
    s.bullets = s.bullets.map(b => b.replace(/\*\*/g, "").trim()).filter(Boolean)
    if (s.intro) s.intro = s.intro.replace(/\*\*/g, "").trim()
  })

  return sections.filter(s => s.bullets.length > 0 || s.intro)
}

// ── Advice Section Cards (visual rendering of parsed sections) ───────────────

function AdviceSections({ sections, onTapInsight }: {
  sections: AdviceSection[]
  onTapInsight?: (data: { title: string; body: string; sectionKey: AdviceSection["key"]; index: number }) => void
}) {
  const theme = (key: AdviceSection["key"]) => {
    switch (key) {
      case "summary":   return { bg: "linear-gradient(135deg, #3B82F6, #2563EB)",  soft: "#DBEAFE", color: "#2563EB", text: "#fff" }
      case "strengths": return { bg: "linear-gradient(135deg, #10B981, #059669)",  soft: "#D1FAE5", color: "#059669", text: "#fff" }
      case "watchouts": return { bg: "linear-gradient(135deg, #F59E0B, #D97706)",  soft: "#FEF3C7", color: "#D97706", text: "#fff" }
      case "tips":      return { bg: "linear-gradient(135deg, #E8541A, #F07040)",  soft: "#FFEDD5", color: "#E8541A", text: "#fff" }
      case "next":      return { bg: "linear-gradient(135deg, #8B5CF6, #7C3AED)",  soft: "#EDE9FE", color: "#7C3AED", text: "#fff" }
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {sections.map((s, idx) => {
        const t = theme(s.key)

        // SUMMARY: hero quote card
        if (s.key === "summary") {
          return (
            <div key={idx} style={{
              background: t.bg,
              borderRadius: 18,
              padding: "16px 18px",
              color: t.text,
              boxShadow: "0 8px 24px rgba(59,130,246,0.25)",
              position: "relative",
              overflow: "hidden",
              animation: `hw-msg-in 0.5s cubic-bezier(.16,1,.3,1) ${idx * 0.08}s both`,
            }}>
              <div style={{
                position: "absolute", top: -20, right: -10,
                fontSize: 80, opacity: 0.15, lineHeight: 1,
              }}>{s.emoji}</div>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
                opacity: 0.9, textTransform: "uppercase", marginBottom: 8,
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <span style={{ fontSize: 14 }}>{s.emoji}</span> {s.title}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.65, fontWeight: 500 }}>
                {s.intro || s.bullets.join(" ")}
              </div>
            </div>
          )
        }

        // NEXT STEPS: numbered timeline
        if (s.key === "next") {
          return (
            <div key={idx} style={{
              animation: `hw-msg-in 0.5s cubic-bezier(.16,1,.3,1) ${idx * 0.08}s both`,
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                marginBottom: 10, paddingLeft: 4,
              }}>
                <span style={{ fontSize: 16 }}>{s.emoji}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: t.color, letterSpacing: 0.6, textTransform: "uppercase" }}>
                  {s.title}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {s.bullets.map((b, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 12, alignItems: "flex-start",
                    background: "#fff",
                    borderRadius: 14, padding: "12px 14px",
                    border: "1.5px solid rgba(139,92,246,0.1)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: t.bg,
                      color: t.text, fontSize: 13, fontWeight: 800,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: "0 4px 10px rgba(139,92,246,0.25)",
                    }}>{i + 1}</div>
                    <div style={{ fontSize: 13, lineHeight: 1.55, color: "#1F2937", paddingTop: 4 }}>{b}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        }

        // STRENGTHS / WATCHOUTS / TIPS: visual stat-card style
        return (
          <div key={idx} style={{
            animation: `hw-msg-in 0.5s cubic-bezier(.16,1,.3,1) ${idx * 0.08}s both`,
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              marginBottom: 10, paddingLeft: 4,
            }}>
              <span style={{ fontSize: 16 }}>{s.emoji}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: t.color, letterSpacing: 0.6, textTransform: "uppercase" }}>
                {s.title}
              </span>
              <span style={{
                background: t.bg, color: t.color,
                fontSize: 10, fontWeight: 800,
                padding: "3px 9px", borderRadius: 999, marginLeft: 4,
                boxShadow: `0 2px 6px ${t.color}33`,
              }}>
                {s.bullets.length}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {s.bullets.map((b, i) => {
                const splitMatch = b.match(/^([^:：]+)[:：]\s*(.+)$/)
                const title = splitMatch ? splitMatch[1].trim() : null
                const body = splitMatch ? splitMatch[2].trim() : b
                // Impact level: bullet #1 = highest priority (90%), then decreases
                const impactPct = Math.max(40, 95 - i * 22)
                const impactLabel = i === 0 ? "Өндөр" : i === 1 ? "Дунд" : "Бага"
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onTapInsight?.({ title: title || `#${i + 1}`, body, sectionKey: s.key, index: i })}
                    className="hw-card-tilt"
                    style={{
                      display: "flex", gap: 10, alignItems: "stretch",
                      background: "#fff",
                      borderRadius: 14, padding: "0 0 0 0",
                      border: `1.5px solid ${t.soft}`,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                      overflow: "hidden",
                      position: "relative",
                      cursor: "pointer",
                      width: "100%", textAlign: "left",
                      fontFamily: "inherit",
                    }}
                  >
                    {/* Left numbered rail */}
                    <div style={{
                      width: 44, flexShrink: 0,
                      background: `linear-gradient(180deg, ${t.bg}, ${t.soft})`,
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center",
                      gap: 3, padding: "10px 0",
                    }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: 8,
                        background: `linear-gradient(135deg, ${t.color}, ${t.color}cc)`,
                        color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: `0 3px 8px ${t.color}55`,
                      }}>
                        {s.key === "strengths" && (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                        )}
                        {s.key === "watchouts" && (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4M12 17h.01M10.29 3.86l-8.18 14.14a2 2 0 001.71 3h16.36a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                        )}
                        {s.key === "tips" && (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 00-4 12.7V17a2 2 0 002 2h4a2 2 0 002-2v-2.3A7 7 0 0012 2z"/></svg>
                        )}
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 900, color: t.color, letterSpacing: 0.5 }}>#{i + 1}</div>
                    </div>

                    <div style={{ minWidth: 0, flex: 1, padding: "10px 12px 10px 0" }}>
                      {/* Impact pill */}
                      <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        marginBottom: 6, gap: 6,
                      }}>
                        {title && (
                          <div style={{
                            fontSize: 12.5, fontWeight: 800, color: "#111827",
                            lineHeight: 1.25, flex: 1,
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          }}>
                            {title}
                          </div>
                        )}
                        <div style={{
                          padding: "2px 7px", borderRadius: 999,
                          background: t.bg, color: t.color,
                          fontSize: 9, fontWeight: 800,
                          letterSpacing: 0.4, textTransform: "uppercase",
                          border: `1px solid ${t.soft}`,
                          flexShrink: 0,
                        }}>
                          {impactLabel}
                        </div>
                      </div>

                      <div style={{
                        fontSize: 11.5, lineHeight: 1.5,
                        color: title ? "#4B5563" : "#1F2937",
                        marginBottom: 8,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}>
                        {body}
                      </div>

                      {/* Impact progress bar */}
                      <div style={{
                        height: 6, borderRadius: 6,
                        background: "#F3F4F6",
                        overflow: "hidden", position: "relative",
                      }}>
                        <div style={{
                          width: `${impactPct}%`, height: "100%",
                          background: `linear-gradient(90deg, ${t.color}, ${t.color}cc)`,
                          borderRadius: 6,
                          transition: "width 1.2s cubic-bezier(.16,1,.3,1)",
                          boxShadow: `0 0 8px ${t.color}66`,
                          position: "relative", overflow: "hidden",
                        }}>
                          <div className="hw-shimmer-bar" style={{ position: "absolute", inset: 0 }}/>
                        </div>
                      </div>

                      <div style={{
                        display: "flex", justifyContent: "space-between",
                        marginTop: 4,
                        fontSize: 9, fontWeight: 700, color: "#9CA3AF",
                      }}>
                        <span>НӨЛӨӨЛӨЛ</span>
                        <span style={{ color: t.color }}>{impactPct}%</span>
                      </div>
                    </div>

                    {/* Chevron */}
                    <div style={{
                      display: "flex", alignItems: "center", paddingRight: 10, color: "#9CA3AF", flexShrink: 0,
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Artifact View (full-screen-within-widget detail panel) ───────────────────

// ── Animated counter (counts up from 0) ──────────────────────────────────────

function useAnimatedNumber(target: number, duration = 1400) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setValue(Math.round(target * eased))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

// ── Semi-circle Gauge (professional dashboard style) ─────────────────────────

function SemicircleGauge({ pct, tone, size = 220 }: { pct: number; tone: { ring: string; soft: string; grad: string }; size?: number }) {
  const stroke = 16
  const radius = (size - stroke) / 2
  const cx = size / 2
  const cy = size / 2
  // Semi-circle path: 180° arc from left to right
  const semiCircumference = Math.PI * radius
  const offset = semiCircumference - (pct / 100) * semiCircumference
  const animatedPct = useAnimatedNumber(pct)

  // Calculate needle position
  const needleAngle = (pct / 100) * 180 - 180 // -180° to 0°
  const needleX = cx + Math.cos((needleAngle * Math.PI) / 180) * (radius - 4)
  const needleY = cy + Math.sin((needleAngle * Math.PI) / 180) * (radius - 4)

  const gid = `gauge-${tone.ring.replace("#", "")}`

  return (
    <div style={{ position: "relative", width: size, height: size / 1.6, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#EF4444"/>
            <stop offset="50%" stopColor="#F59E0B"/>
            <stop offset="100%" stopColor="#10B981"/>
          </linearGradient>
        </defs>
        {/* Background arc */}
        <path
          d={`M ${stroke / 2} ${cy} A ${radius} ${radius} 0 0 1 ${size - stroke / 2} ${cy}`}
          fill="none" stroke="#F3F4F6" strokeWidth={stroke} strokeLinecap="round"
        />
        {/* Filled arc */}
        <path
          d={`M ${stroke / 2} ${cy} A ${radius} ${radius} 0 0 1 ${size - stroke / 2} ${cy}`}
          fill="none" stroke={`url(#${gid})`} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={semiCircumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1.6s cubic-bezier(.16,1,.3,1)",
            filter: `drop-shadow(0 6px 12px ${tone.ring}55)`,
          }}
        />
        {/* Needle */}
        <line
          x1={cx} y1={cy} x2={needleX} y2={needleY}
          stroke="#1F2937" strokeWidth="3" strokeLinecap="round"
          style={{ transition: "all 1.6s cubic-bezier(.16,1,.3,1)" }}
        />
        <circle cx={cx} cy={cy} r="8" fill="#1F2937"/>
        <circle cx={cx} cy={cy} r="4" fill="#fff"/>
      </svg>

      {/* Centered number under gauge */}
      <div style={{
        position: "absolute",
        left: 0, right: 0, bottom: -6,
        textAlign: "center",
      }}>
        <div style={{
          fontSize: 44, fontWeight: 900, color: "#111827",
          lineHeight: 1, letterSpacing: -1.5,
          fontFeatureSettings: "'tnum'",
        }}>
          {animatedPct}
          <span style={{ fontSize: 18, color: "#9CA3AF", fontWeight: 700 }}>/100</span>
        </div>
      </div>

      {/* Min/Max labels */}
      <div style={{
        position: "absolute", left: 2, bottom: 4,
        fontSize: 9, fontWeight: 700, color: "#9CA3AF", letterSpacing: 0.5,
      }}>0</div>
      <div style={{
        position: "absolute", right: 2, bottom: 4,
        fontSize: 9, fontWeight: 700, color: "#9CA3AF", letterSpacing: 0.5,
      }}>100</div>
    </div>
  )
}

// ── Big Numbered Section Header ──────────────────────────────────────────────

function BigSectionHeader({ number, title, subtitle, accent = "#E8541A" }: {
  number: number
  title: string
  subtitle: string
  accent?: string
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "26px 4px 14px",
      animation: `hw-fade-up 0.5s cubic-bezier(.16,1,.3,1) ${number * 0.05}s both`,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 14,
        background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontSize: 18, fontWeight: 900,
        boxShadow: `0 8px 20px ${accent}40`,
        flexShrink: 0,
        position: "relative",
      }}>
        {number}
        {/* Ping ring effect */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: 14,
          border: `2px solid ${accent}`, opacity: 0.4,
          animation: "hw-glow-pulse 2.4s ease-in-out infinite",
        }}/>
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontSize: 9, fontWeight: 800, color: accent,
          letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 2,
        }}>
          Step {number} of 3
        </div>
        <div style={{
          fontSize: 18, fontWeight: 900, color: "#111827",
          lineHeight: 1.15, letterSpacing: -0.5,
        }}>
          {title}
        </div>
        <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 500, marginTop: 2 }}>
          {subtitle}
        </div>
      </div>
    </div>
  )
}

// ── Section Progress Indicator (top of artifact) ─────────────────────────────

// Confetti burst — pure CSS, no deps
function ConfettiBurst() {
  const pieces = useMemo(() => {
    return Array.from({ length: 18 }).map((_, i) => ({
      key: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.3,
      duration: 1.2 + Math.random() * 1,
      color: ["#10B981", "#F59E0B", "#3B82F6", "#E8541A", "#8B5CF6", "#EC4899"][i % 6],
      size: 6 + Math.random() * 4,
    }))
  }, [])

  return (
    <div style={{
      position: "absolute", inset: 0, pointerEvents: "none",
      overflow: "visible",
    }}>
      {pieces.map(p => (
        <div key={p.key} style={{
          position: "absolute",
          top: 0,
          left: `${p.left}%`,
          width: p.size, height: p.size,
          background: p.color,
          borderRadius: p.key % 2 === 0 ? 2 : "50%",
          animation: `hw-confetti ${p.duration}s cubic-bezier(.34,1.56,.64,1) ${p.delay}s both`,
        }}/>
      ))}
    </div>
  )
}

function SectionProgress({ active, tone }: { active: 1 | 2 | 3; tone: { ring: string } }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 4,
      padding: "0 0 10px",
    }}>
      {[1, 2, 3].map(n => (
        <div key={n} style={{
          flex: 1, height: 4, borderRadius: 4,
          background: n <= active ? tone.ring : "#E5E7EB",
          transition: "background 0.4s",
          boxShadow: n <= active ? `0 2px 6px ${tone.ring}55` : "none",
        }}/>
      ))}
    </div>
  )
}

// ── Artifact View (full-screen-within-widget detail panel) ───────────────────

function ArtifactView({ message, onClose, fontSize, renderFormattedText, onAskFollowUp, askPending, onToggleStep }: {
  message: Message
  onClose: () => void
  fontSize: number
  renderFormattedText: (text: string) => React.ReactNode
  onAskFollowUp?: (question: string) => void
  askPending?: boolean
  onToggleStep?: (stepIdx: number) => void
}) {
  const card = message.insightCard!
  const status = message.analysisStatus || "loading"
  const pct = card.total > 0 ? Math.round((card.score / card.total) * 100) : 0
  const tone =
    pct >= 75 ? { ring: "#10B981", soft: "#D1FAE5", bg: "#ECFDF5", grad: "linear-gradient(135deg, #10B981, #059669)", text: "Маш сайн" }
    : pct >= 50 ? { ring: "#F59E0B", soft: "#FEF3C7", bg: "#FFFBEB", grad: "linear-gradient(135deg, #F59E0B, #D97706)", text: "Дунд зэрэг" }
    : { ring: "#EF4444", soft: "#FEE2E2", bg: "#FEF2F2", grad: "linear-gradient(135deg, #EF4444, #DC2626)", text: "Анхаарах" }

  const [askInput, setAskInput] = useState("")
  const followUps = message.followUps || []
  const bodyRef = useRef<HTMLDivElement | null>(null)

  // ── CAROUSEL / PAGE NAVIGATION ─────────────────────────────────────
  const [currentPage, setCurrentPage] = useState<1 | 2 | 3>(1)
  const [swipeDir, setSwipeDir] = useState<"left" | "right" | null>(null)
  // Tap-to-expand selected insight
  const [expandedInsight, setExpandedInsight] = useState<null | {
    title: string
    body: string
    sectionKey: AdviceSection["key"]
    index: number
  }>(null)

  // Swipe handling
  const touchStartX = useRef(0)
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) < 50) return
    if (dx < 0 && currentPage < 3) goToPage((currentPage + 1) as 1 | 2 | 3)
    else if (dx > 0 && currentPage > 1) goToPage((currentPage - 1) as 1 | 2 | 3)
  }

  const goToPage = (p: 1 | 2 | 3) => {
    if (p === currentPage) return
    setSwipeDir(p > currentPage ? "left" : "right")
    setCurrentPage(p)
    setExpandedInsight(null)
    // Scroll to top when page changes
    setTimeout(() => { if (bodyRef.current) bodyRef.current.scrollTop = 0 }, 50)
  }

  // Scroll to latest follow-up when new one arrives
  useEffect(() => {
    if (followUps.length > 0 && bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight
    }
  }, [followUps.length, askPending])

  // Reset expanded view when changing page
  useEffect(() => { setExpandedInsight(null) }, [currentPage])

  const handleAsk = () => {
    const q = askInput.trim()
    if (!q || askPending) return
    onAskFollowUp?.(q)
    setAskInput("")
  }

  // Sample suggested follow-up questions
  const suggestedQuestions = [
    "Энэ үр дүн ямар утгатай вэ?",
    "Би одоо юу хийх ёстой вэ?",
    "Дараагийн алхам юу хийх вэ?",
  ]

  return (
    <div style={{
      position: "absolute", inset: 0,
      background: "linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)",
      zIndex: 10,
      display: "flex", flexDirection: "column",
      animation: "hw-artifact-in 0.45s cubic-bezier(.16,1,.3,1)",
    }}>
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div style={{
        padding: "12px 14px",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", gap: 10,
        flexShrink: 0,
        zIndex: 2,
      }}>
        <button
          onClick={onClose}
          style={{
            width: 36, height: 36, borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.06)",
            background: "#fff", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#374151", transition: "all 0.2s", fontFamily: "inherit",
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#F3F4F6"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "#fff"}
          aria-label="Close"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize: 9, fontWeight: 800, color: tone.ring,
            letterSpacing: 1.5, textTransform: "uppercase",
            display: "flex", alignItems: "center", gap: 5,
          }}>
            <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: tone.ring, boxShadow: `0 0 8px ${tone.ring}` }}/>
            AI Insight
          </div>
          <div style={{
            fontSize: 14, fontWeight: 800, color: "#111827",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            lineHeight: 1.25,
          }}>
            {card.testName}
          </div>
        </div>
      </div>

      {/* PAGE TABS REMOVED — single scroll layout matches mockup */}

      {/* ── SCROLLABLE BODY ────────────────────────────────────────────── */}
      <div
        ref={bodyRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{
          flex: 1, overflowY: "auto",
          padding: "14px 12px 8px",
          display: "flex", flexDirection: "column", gap: 0,
          background: "linear-gradient(180deg, #FAFBFC 0%, #FFFFFF 30%)",
          position: "relative",
        }}
      >
        {/* Single-scroll layout, no carousel paging */}
        <div style={{ animation: "hw-fade-up 0.35s cubic-bezier(.16,1,.3,1) both" }}>

        {/* ═══ SECTION 1: SCORE OVERVIEW ═══════════════════════════════════ */}
        {true && (
        <>
        <BigSectionHeader
          number={1}
          title="Үр дүнгийн тойм"
          subtitle="Таны оноо болон ерөнхий үнэлгээ"
          accent={tone.ring}
        />

        {/* HERO: Gauge + Meta */}
        <div className="hw-card-tilt" style={{
          background: "#fff",
          borderRadius: 24,
          padding: "20px 18px 22px",
          border: "1px solid rgba(0,0,0,0.05)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.06)",
          position: "relative", overflow: "hidden",
          marginBottom: 10,
          animation: "hw-fade-up 0.6s cubic-bezier(.16,1,.3,1) 0.1s both",
        }}>
          {/* Decorative orbs */}
          <div style={{
            position: "absolute", top: -60, right: -40,
            width: 200, height: 200, borderRadius: "50%",
            background: `radial-gradient(circle, ${tone.ring}1a 0%, transparent 65%)`,
            pointerEvents: "none",
          }}/>
          <div style={{
            position: "absolute", bottom: -50, left: -30,
            width: 140, height: 140, borderRadius: "50%",
            background: `radial-gradient(circle, ${tone.ring}11 0%, transparent 65%)`,
            pointerEvents: "none",
          }}/>

          {/* Test name badge */}
          <div style={{
            display: "flex", justifyContent: "center", marginBottom: 8, position: "relative",
          }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 14px", borderRadius: 999,
              background: tone.bg, color: tone.ring,
              fontSize: 11, fontWeight: 700,
              border: `1px solid ${tone.soft}`,
              boxShadow: `0 4px 12px ${tone.ring}22`,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>
              </svg>
              {card.testName}
            </div>
          </div>

          {/* Semi-circle Gauge */}
          <div style={{
            display: "flex", justifyContent: "center", marginTop: -10, marginBottom: 16,
            position: "relative",
          }}>
            <SemicircleGauge pct={pct} tone={tone} size={Math.min(260, 260)}/>
          </div>

          {/* Result label */}
          <div style={{
            textAlign: "center", marginBottom: 18, position: "relative",
          }}>
            <div style={{
              fontSize: 10, fontWeight: 800, color: "#9CA3AF",
              letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4,
            }}>
              Үнэлгээ
            </div>
            <div style={{
              fontSize: 22, fontWeight: 900, color: "#111827",
              lineHeight: 1.2, letterSpacing: -0.5,
            }}>
              {card.resultLabel || "Тодорхойлоогүй"}
            </div>
          </div>

          {/* 3 metric tiles */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8,
            marginBottom: card.description ? 14 : 0,
            position: "relative",
          }}>
            {[
              { label: "Оноо", value: `${card.score}`, sub: `/ ${card.total}`, icon: "🎯", color: "#3B82F6" },
              { label: "Хувь", value: `${pct}`, sub: "%", icon: "📊", color: tone.ring },
              { label: "Түвшин", value: tone.text, sub: "", icon: "⭐", color: "#8B5CF6" },
            ].map((s, i) => (
              <div key={i} style={{
                padding: "12px 8px", borderRadius: 14,
                background: "linear-gradient(145deg, #F9FAFB, #FFFFFF)",
                textAlign: "center",
                border: "1px solid rgba(0,0,0,0.04)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}>
                <div style={{ fontSize: 14, marginBottom: 4 }}>{s.icon}</div>
                <div style={{
                  fontSize: 8, fontWeight: 800, color: "#9CA3AF",
                  letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4,
                }}>{s.label}</div>
                <div style={{
                  fontSize: s.sub ? 16 : 12, fontWeight: 900, color: s.color,
                  lineHeight: 1.1,
                  display: "flex", justifyContent: "center", alignItems: "baseline", gap: 1,
                }}>
                  {s.value}
                  {s.sub && <span style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 700 }}>{s.sub}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Description quote */}
          {card.description && (
            <div style={{
              padding: "12px 14px", borderRadius: 14,
              background: "#F9FAFB",
              fontSize: 12, lineHeight: 1.6, color: "#4B5563",
              borderLeft: `3px solid ${tone.ring}`,
              position: "relative",
            }}>
              {card.description}
            </div>
          )}
        </div>

        {/* Mini stat dashboard (2x2 grid like the mockup) */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8,
          marginBottom: 10,
          animation: "hw-fade-up 0.6s cubic-bezier(.16,1,.3,1) 0.2s both",
        }}>
          {(() => {
            const riskLvl = pct >= 75 ? "Low" : pct >= 50 ? "Mid" : "High"
            const riskColor = pct >= 75 ? "#10B981" : pct >= 50 ? "#F59E0B" : "#EF4444"
            const oppLvl = pct >= 75 ? "Low" : pct >= 50 ? "Mid" : "High"
            const oppColor = "#10B981" // opportunity is always shown positively
            const tiles = [
              {
                emoji: "🎯",
                title: "Үр дүнгийн оноо",
                value: `${card.score}`, sub: `/${card.total}`,
                desc: card.resultLabel,
                color: tone.ring, bg: tone.bg, soft: tone.soft,
                showBar: true,
              },
              {
                emoji: "🛡️",
                title: "Эрсдэл (Risk)",
                value: riskLvl, sub: "",
                desc: pct >= 75 ? "Эрсдэл бага" : pct >= 50 ? "Дунд зэрэг" : "Анхаарал хандуул",
                color: riskColor, bg: `${riskColor}15`, soft: `${riskColor}30`,
                showBar: false,
                showLine: true,
              },
              {
                emoji: "🚀",
                title: "Гарах боломж",
                value: oppLvl, sub: "",
                desc: "Амжилтын боломж өндөр",
                color: oppColor, bg: `${oppColor}15`, soft: `${oppColor}30`,
                showBar: false,
                showBars: true,
              },
              {
                emoji: "🎁",
                title: "Өнөөдрийн зорилго",
                value: `1`, sub: "/3",
                desc: "Зорилгоо биелүүлээ!",
                color: "#8B5CF6", bg: "#F3E8FF", soft: "#E9D5FF",
                showBar: false,
                showCheck: true,
              },
            ]
            return tiles.map((t, i) => (
              <div key={i} className="hw-card-tilt" style={{
                background: "#fff",
                borderRadius: 16, padding: "12px 12px",
                border: `1px solid ${t.soft}`,
                boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
                position: "relative", overflow: "hidden",
                animation: `hw-fade-up 0.5s cubic-bezier(.16,1,.3,1) ${0.25 + i * 0.06}s both`,
              }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 6, marginBottom: 6,
                }}>
                  <span style={{ fontSize: 14 }}>{t.emoji}</span>
                  <span style={{ fontSize: 9, fontWeight: 800, color: "#6B7280", letterSpacing: 0.5, textTransform: "uppercase" }}>
                    {t.title}
                  </span>
                </div>
                <div style={{
                  fontSize: 22, fontWeight: 900, color: t.color, lineHeight: 1,
                  letterSpacing: -0.5, display: "flex", alignItems: "baseline", gap: 2,
                }}>
                  {t.value}
                  {t.sub && <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 700 }}>{t.sub}</span>}
                </div>
                <div style={{ fontSize: 10, color: "#6B7280", fontWeight: 500, marginTop: 4, lineHeight: 1.3 }}>
                  {t.desc}
                </div>
                {t.showBar && (
                  <div style={{ height: 5, background: t.bg, borderRadius: 5, overflow: "hidden", marginTop: 8 }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: t.color, borderRadius: 5 }}/>
                  </div>
                )}
                {t.showLine && (
                  <svg width="100%" height="22" viewBox="0 0 100 22" preserveAspectRatio="none" style={{ marginTop: 6 }}>
                    <path d="M0,18 Q15,12 25,15 T50,8 T75,12 T100,4" fill="none" stroke={t.color} strokeWidth="2" strokeLinecap="round" />
                    <path d="M0,18 Q15,12 25,15 T50,8 T75,12 T100,4 L100,22 L0,22 Z" fill={`${t.color}22`}/>
                  </svg>
                )}
                {t.showBars && (
                  <div style={{ display: "flex", gap: 3, alignItems: "flex-end", marginTop: 6, height: 22 }}>
                    {[40, 65, 50, 80, 95].map((h, j) => (
                      <div key={j} style={{
                        flex: 1, height: `${h}%`,
                        background: `linear-gradient(180deg, ${t.color}, ${t.color}88)`,
                        borderRadius: 2,
                      }}/>
                    ))}
                  </div>
                )}
                {t.showCheck && (
                  <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 14, height: 14, borderRadius: "50%", background: t.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                    </div>
                    <div style={{ fontSize: 9, color: t.color, fontWeight: 700 }}>1/3 алхам</div>
                  </div>
                )}
              </div>
            ))
          })()}
        </div>

        {/* Announcement card (Сайн мэдээ! / Анхаарал!) */}
        <div style={{
          background: pct >= 75
            ? "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)"
            : pct >= 50
            ? "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)"
            : "linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)",
          border: `1.5px solid ${tone.soft}`,
          borderRadius: 20, padding: "16px 16px",
          marginBottom: 10,
          position: "relative", overflow: "hidden",
          animation: "hw-fade-up 0.6s cubic-bezier(.16,1,.3,1) 0.5s both",
        }}>
          {/* Sparkle line decoration in background */}
          <svg width="100%" height="50" viewBox="0 0 200 50" preserveAspectRatio="none" style={{
            position: "absolute", right: 0, top: 6, width: "60%", height: 50, opacity: 0.35,
            pointerEvents: "none",
          }}>
            <path d="M0,40 Q30,25 50,30 T100,15 T150,20 T200,5" fill="none" stroke={tone.ring} strokeWidth="2"/>
          </svg>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, position: "relative" }}>
            <div style={{
              fontSize: 48, flexShrink: 0, lineHeight: 1,
              animation: "hw-icon-bounce 2.4s ease-in-out infinite",
              filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.1))",
            }}>
              {pct >= 75 ? "🫁" : pct >= 50 ? "💡" : "🫶"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 17, fontWeight: 900, color: tone.ring,
                marginBottom: 4, letterSpacing: -0.5,
              }}>
                {pct >= 75 ? "Сайн мэдээ!" : pct >= 50 ? "Зөв чиглэлд!" : "Анхаарал!"}
              </div>
              <div style={{
                fontSize: 12, lineHeight: 1.55, color: "#374151",
              }}>
                {pct >= 75
                  ? "Таны үр дүн маш сайн. Энэ түвшинг хадгалбал ирээдүй гэрэлтэй!"
                  : pct >= 50
                  ? "Та зөв замаар явж байна. Бага зэрэг хичээвэл илүү сайн үр дүнд хүрнэ."
                  : "Үр дүнг сайжруулахад анхаарах хэрэгтэй. AI зөвлөмжийг дагаарай."}
              </div>
            </div>
          </div>

          {/* Дэлгэрэнгүй үзэх button */}
          <button
            type="button"
            onClick={() => onAskFollowUp?.("Үр дүнгийн талаар дэлгэрэнгүй тайлбарлаач")}
            style={{
              background: tone.grad, color: "#fff",
              border: "none", borderRadius: 12,
              padding: "10px 18px", fontSize: 12, fontWeight: 800,
              cursor: "pointer", fontFamily: "inherit",
              display: "inline-flex", alignItems: "center", gap: 8,
              boxShadow: `0 6px 16px ${tone.ring}55`,
              transition: "all 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "translateY(0)"}
          >
            Дэлгэрэнгүй үзэх
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7"/>
            </svg>
          </button>
        </div>

        {/* "Өнөөдрийн зорилго" Daily Goals card */}
        <div style={{
          background: "#fff",
          borderRadius: 20, padding: "16px",
          border: "1px solid rgba(0,0,0,0.04)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
          marginBottom: 10,
          animation: "hw-fade-up 0.6s cubic-bezier(.16,1,.3,1) 0.55s both",
        }}>
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            marginBottom: 12,
          }}>
            <div style={{ fontSize: 18 }}>🎯</div>
            <div style={{
              fontSize: 13, fontWeight: 900, color: "#111827",
              letterSpacing: -0.3, flex: 1,
            }}>
              Өнөөдрийн зорилго
            </div>
          </div>

          {/* Big metric */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            marginBottom: 12,
          }}>
            <div style={{
              fontSize: 38, fontWeight: 900, color: "#E8541A", lineHeight: 1,
              letterSpacing: -1, display: "flex", alignItems: "baseline", gap: 2,
            }}>
              1<span style={{ fontSize: 16, color: "#9CA3AF", fontWeight: 700 }}>/3</span>
            </div>
            <div style={{
              fontSize: 11, color: "#6B7280", fontWeight: 600,
              flex: 1,
            }}>
              Зорилгоо биелүүлээ! Үргэлжлүүлээрэй.
            </div>
          </div>

          {/* 3 daily goal items */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { done: true, label: "AI шинжилгээ үзэх", progress: "Дууссан" },
              { done: false, label: "Зөвлөмжийг уншиж дуусгах", progress: "0/1" },
              { done: false, label: "Дараагийн алхмыг тэмдэглэх", progress: "0/3" },
            ].map((g, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 10px", borderRadius: 10,
                background: g.done ? "#F0FDF4" : "#F9FAFB",
                border: g.done ? "1px solid #BBF7D0" : "1px solid #F3F4F6",
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%",
                  background: g.done ? "#10B981" : "#fff",
                  border: g.done ? "none" : "1.5px solid #D1D5DB",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {g.done && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                  )}
                </div>
                <div style={{
                  flex: 1, fontSize: 12, color: g.done ? "#059669" : "#374151",
                  fontWeight: 600,
                  textDecoration: g.done ? "line-through" : "none",
                }}>
                  {g.label}
                </div>
                <div style={{
                  fontSize: 10, fontWeight: 800,
                  color: g.done ? "#059669" : "#9CA3AF",
                }}>
                  {g.progress}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trait breakdown (still part of section 1) */}
        {card.traits && card.traits.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{
              fontSize: 10, fontWeight: 800, color: "#6B7280",
              letterSpacing: 1.2, textTransform: "uppercase",
              marginBottom: 8, paddingLeft: 4,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span>📐</span> Дэлгэрэнгүй задаргаа
            </div>
            <TraitBreakdown traits={card.traits} />
          </div>
        )}

        {/* AI Insights — 3 navigation cards (mockup style) */}
        <div style={{
          background: "#fff",
          borderRadius: 20, padding: "16px 14px",
          border: "1px solid rgba(0,0,0,0.04)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
          marginBottom: 10,
          marginTop: 6,
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 12,
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: 8,
              background: "linear-gradient(135deg, #E8541A, #F07040)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 10px rgba(232,84,26,0.3)",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff">
                <path d="M12 2l1.4 4.3L17.7 8l-4.3 1.4L12 14l-1.4-4.6L6.3 8l4.3-1.7z"/>
              </svg>
            </div>
            <div style={{
              fontSize: 14, fontWeight: 900, color: "#111827",
              letterSpacing: -0.3, flex: 1,
            }}>AI Insights</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              {
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 12l2 2 4-4M21 12c0 5-3.5 9-9 9s-9-4-9-9 3.5-9 9-9 9 4 9 9z"/>
                  </svg>
                ),
                label: "Эрүүл мэндийн төлөв",
                desc: pct >= 75 ? "Үзүүлэлт сайн, эрсдэл бага." : pct >= 50 ? "Сайжруулах боломжтой." : "Анхаарал хандуулах хэрэгтэй.",
                bg: "#ECFDF5", soft: "#D1FAE5",
              },
              {
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a10 10 0 0 1 10 10c0 5-4 9-10 9S2 17 2 12 7 2 12 2z"/>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>
                  </svg>
                ),
                label: "Сэтгэл зүйн төлөв",
                desc: "Стрессийг өөр аргаар зохицуулах нь амжилтын түлхүүр.",
                bg: "#DBEAFE", soft: "#BFDBFE",
              },
              {
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                    <polyline points="17 6 23 6 23 12"/>
                  </svg>
                ),
                label: "Амжилтын боломж",
                desc: "Та зорилгод хүрэх боломж их байна.",
                bg: "#EDE9FE", soft: "#DDD6FE",
              },
            ].map((insight, i) => (
              <button key={i} type="button" className="hw-card-tilt" style={{
                display: "flex", alignItems: "center", gap: 10,
                background: "#fff",
                border: `1px solid ${insight.soft}`,
                borderRadius: 12, padding: "10px 12px",
                cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                width: "100%",
                boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                transition: "all 0.25s",
              }}
              onClick={() => onAskFollowUp?.(`${insight.label} талаар илүү дэлгэрэнгүй тайлбарлаач.`)}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: insight.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>{insight.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#111827", lineHeight: 1.3, marginBottom: 2 }}>
                    {insight.label}
                  </div>
                  <div style={{
                    fontSize: 10.5, color: "#6B7280", lineHeight: 1.45,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>{insight.desc}</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            ))}
          </div>

          {/* AI зөвлөгөө button */}
          <button
            type="button"
            onClick={() => onAskFollowUp?.("AI-ээс илүү дэлгэрэнгүй зөвлөгөө өгөөч")}
            style={{
              width: "100%", marginTop: 10,
              background: "linear-gradient(135deg, #ECFDF5, #D1FAE5)",
              color: "#059669", border: "1px solid #BBF7D0",
              borderRadius: 12, padding: "10px 16px",
              fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, #D1FAE5, #A7F3D0)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, #ECFDF5, #D1FAE5)"}
          >
            ✨ AI-ээс илүү зөвлөгөө авах
          </button>
        </div>

        {/* Health Stats 2x2 grid (Apple Health style) */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8,
          marginBottom: 10, marginTop: 4,
          animation: "hw-fade-up 0.6s cubic-bezier(.16,1,.3,1) both",
        }}>
          {[
            { emoji: "🫁", label: "Тестийн тойм", value: `${card.score}`, sub: `/${card.total}`, hint: card.resultLabel, color: tone.ring },
            { emoji: "❤️", label: "Эрүүл мэндийн төлөв", value: pct >= 75 ? "Good" : pct >= 50 ? "Mid" : "Low", sub: "", hint: "Үнэлгээ", color: "#EF4444" },
            { emoji: "💰", label: "Боломжийн утга", value: `${pct}`, sub: "%", hint: "Сайжруулах боломж", color: "#10B981" },
            { emoji: "📅", label: "Дараагийн алхам", value: "3", sub: "", hint: "Зорилт хийх", color: "#8B5CF6" },
          ].map((s, i) => (
            <div key={i} style={{
              background: "#fff",
              borderRadius: 14, padding: "12px 12px",
              border: "1px solid rgba(0,0,0,0.04)",
              boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
              display: "flex", gap: 10, alignItems: "center",
            }}>
              <div style={{
                fontSize: 26, flexShrink: 0, lineHeight: 1,
              }}>{s.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 9, fontWeight: 700, color: "#9CA3AF",
                  letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 2,
                }}>{s.label}</div>
                <div style={{
                  fontSize: 18, fontWeight: 900, color: s.color, lineHeight: 1,
                  display: "flex", alignItems: "baseline", gap: 1,
                }}>
                  {s.value}
                  {s.sub && <span style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 700 }}>{s.sub}</span>}
                </div>
                <div style={{ fontSize: 9, color: "#6B7280", fontWeight: 600, marginTop: 2 }}>{s.hint}</div>
              </div>
            </div>
          ))}
        </div>

        </>
        )}

        {/* ═══ SECTION 2: AI ANALYSIS ════════════════════════════════════════ */}
        {true && (
        <>
        <BigSectionHeader
          number={2}
          title="AI Шинжилгээ"
          subtitle="Таны үр дүнгийн дэлгэрэнгүй шинжилгээ"
          accent="#E8541A"
        />

        {status === "loading" ? (
          <div style={{
            background: "#fff", borderRadius: 18,
            padding: "30px 16px",
            border: "1px solid rgba(0,0,0,0.04)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
          }}>
            <div style={{ display: "flex", gap: 6 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 10, height: 10,
                  background: "linear-gradient(135deg, #E8541A, #F07040)",
                  borderRadius: "50%",
                  animation: `hw-bounce 1.4s ease-in-out ${i * 0.16}s infinite`,
                }} />
              ))}
            </div>
            <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>
              AI таны үр дүнг шинжилж байна...
            </div>
          </div>
        ) : status === "error" ? (
          <div style={{
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: 14, padding: "14px 16px",
            fontSize: 13, color: "#DC2626",
          }}>
            ⚠️ {message.content || "Зөвлөгөө гаргахад алдаа гарлаа."}
          </div>
        ) : (() => {
          const sections = parseAdvice(message.content)
          // Section 2 = summary/strengths/watchouts/tips (everything except "next")
          const analysisCards = sections.filter(s => s.key !== "next")

          if (analysisCards.length > 0) {
            const strengthsCount = sections.find(s => s.key === "strengths")?.bullets.length || 0
            const watchoutsCount = sections.find(s => s.key === "watchouts")?.bullets.length || 0
            const tipsCount = sections.find(s => s.key === "tips")?.bullets.length || 0
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Quick Stats Dashboard widget */}
                <div style={{
                  display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8,
                  animation: "hw-fade-up 0.6s cubic-bezier(.16,1,.3,1) 0.05s both",
                }}>
                  {[
                    { label: "Давуу", count: strengthsCount, emoji: "✨", color: "#10B981", bg: "#ECFDF5", soft: "#D1FAE5" },
                    { label: "Анхаарал", count: watchoutsCount, emoji: "⚠️", color: "#F59E0B", bg: "#FFFBEB", soft: "#FEF3C7" },
                    { label: "Зөвлөмж", count: tipsCount, emoji: "💡", color: "#E8541A", bg: "#FFF7ED", soft: "#FFEDD5" },
                  ].map((s, i) => (
                    <div key={i} className="hw-card-tilt" style={{
                      background: `linear-gradient(145deg, ${s.bg}, #fff)`,
                      borderRadius: 14, padding: "12px 10px",
                      border: `1.5px solid ${s.soft}`,
                      textAlign: "center", position: "relative", overflow: "hidden",
                    }}>
                      <div style={{
                        fontSize: 20, marginBottom: 2,
                        animation: "hw-icon-bounce 2.4s ease-in-out infinite",
                        animationDelay: `${i * 0.2}s`,
                      }}>{s.emoji}</div>
                      <div style={{
                        fontSize: 28, fontWeight: 900, color: s.color,
                        lineHeight: 1, letterSpacing: -1,
                      }}>{s.count}</div>
                      <div style={{
                        fontSize: 9, fontWeight: 800, color: "#6B7280",
                        letterSpacing: 0.6, textTransform: "uppercase", marginTop: 3,
                      }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Then the parsed advice cards */}
                <AdviceSections sections={analysisCards} onTapInsight={setExpandedInsight} />
              </div>
            )
          }
          return (
            <div style={{
              background: "#fff", borderRadius: 14, padding: "14px 16px",
              fontSize: 13, lineHeight: 1.7, color: "#1F2937",
              border: "1px solid rgba(0,0,0,0.04)",
            }}>
              {renderFormattedText(message.content)}
            </div>
          )
        })()}

        </>
        )}

        {/* ═══ SECTION 3: ACTION PLAN ════════════════════════════════════════ */}
        {true && (
        <>
        <BigSectionHeader
          number={3}
          title="Цаашдын төлөвлөгөө"
          subtitle="Дараагийн алхмууд болон зөвлөмж"
          accent="#8B5CF6"
        />

        {status === "done" && (() => {
          const sections = parseAdvice(message.content)
          // Fallback chain: next steps → tips → watchouts (we always want actionable items)
          let nextSection = sections.find(s => s.key === "next")
          if (!nextSection || nextSection.bullets.length === 0) {
            const tips = sections.find(s => s.key === "tips")
            if (tips && tips.bullets.length > 0) {
              nextSection = { ...tips, key: "next" as const, title: "Үйл ажиллагааны төлөвлөгөө", emoji: "🚀" }
            }
          }
          if (!nextSection || nextSection.bullets.length === 0) {
            return (
              <div style={{
                background: "linear-gradient(135deg, #FAF5FF, #fff)",
                borderRadius: 16, padding: "20px 16px",
                border: "1.5px dashed rgba(139,92,246,0.25)",
                fontSize: 12, color: "#7C3AED", textAlign: "center",
                fontWeight: 600,
              }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>📝</div>
                Алхамууд бэлдэгдэж байна...
              </div>
            )
          }

          const completed = new Set(message.completedSteps || [])
          const totalSteps = nextSection.bullets.length
          const completedCount = nextSection.bullets.reduce((acc, _, i) => acc + (completed.has(i) ? 1 : 0), 0)
          const progressPct = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0
          const allDone = completedCount === totalSteps && totalSteps > 0

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Progress tracker card */}
              <div style={{
                background: allDone
                  ? "linear-gradient(135deg, #10B981, #059669)"
                  : "linear-gradient(135deg, #fff 0%, #FAF5FF 100%)",
                color: allDone ? "#fff" : "#1F2937",
                borderRadius: 16,
                padding: "14px 16px",
                border: allDone ? "none" : "1.5px solid rgba(139,92,246,0.15)",
                boxShadow: allDone
                  ? "0 8px 28px rgba(16,185,129,0.35)"
                  : "0 4px 14px rgba(139,92,246,0.08)",
                position: "relative", overflow: "hidden",
                transition: "all 0.5s cubic-bezier(.16,1,.3,1)",
                animation: allDone ? "hw-step-complete 0.6s cubic-bezier(.34,1.56,.64,1)" : undefined,
              }}>
                {allDone && <ConfettiBurst />}
                <div style={{
                  position: "absolute", top: -20, right: -10,
                  fontSize: 60, opacity: allDone ? 0.2 : 0.08, lineHeight: 1,
                  animation: allDone ? "hw-icon-bounce 2s ease-in-out infinite" : undefined,
                }}>{allDone ? "🎉" : "🎯"}</div>

                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  marginBottom: 10, position: "relative",
                }}>
                  <div>
                    <div style={{
                      fontSize: 10, fontWeight: 800,
                      color: allDone ? "rgba(255,255,255,0.9)" : "#7C3AED",
                      letterSpacing: 1, textTransform: "uppercase", marginBottom: 3,
                    }}>
                      {allDone ? "🎉 Дууссан!" : "Гүйцэтгэл"}
                    </div>
                    <div style={{
                      fontSize: 18, fontWeight: 900,
                      color: allDone ? "#fff" : "#111827",
                      lineHeight: 1.1, letterSpacing: -0.5,
                    }}>
                      {completedCount}/{totalSteps} алхам
                    </div>
                  </div>
                  <div style={{
                    fontSize: 26, fontWeight: 900,
                    color: allDone ? "#fff" : "#7C3AED",
                    letterSpacing: -1,
                  }}>
                    {progressPct}%
                  </div>
                </div>

                {/* Progress bar with animated stripes */}
                <div style={{
                  height: 10, borderRadius: 10,
                  background: allDone ? "rgba(255,255,255,0.25)" : "#F3E8FF",
                  overflow: "hidden", position: "relative",
                }}>
                  <div style={{
                    width: `${progressPct}%`, height: "100%",
                    background: allDone
                      ? "rgba(255,255,255,0.95)"
                      : "linear-gradient(90deg, #8B5CF6, #7C3AED)",
                    borderRadius: 10,
                    transition: "width 0.8s cubic-bezier(.16,1,.3,1)",
                    boxShadow: allDone ? "none" : "0 0 12px rgba(139,92,246,0.6)",
                    position: "relative", overflow: "hidden",
                  }}>
                    {!allDone && progressPct > 0 && (
                      <div style={{
                        position: "absolute", inset: 0,
                        background: "linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)",
                        backgroundSize: "20px 20px",
                        animation: "hw-progress-shimmer 1s linear infinite",
                      }}/>
                    )}
                  </div>
                </div>

                {allDone && (
                  <div style={{
                    fontSize: 12, fontWeight: 600, marginTop: 8,
                    opacity: 0.95, lineHeight: 1.4, position: "relative",
                  }}>
                    Маш сайн! Та бүх зорилтыг гүйцэтгэлээ. 🌟
                  </div>
                )}
              </div>

              {/* Weekly plan title */}
              <div style={{
                fontSize: 11, fontWeight: 800, color: "#6B7280",
                letterSpacing: 1, textTransform: "uppercase",
                marginTop: 4, marginBottom: -2, paddingLeft: 4,
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <span>📅</span> Долоо хоногийн төлөвлөгөө
              </div>

              {/* TODO checklist as weekly timeline */}
              {nextSection.bullets.map((b, i) => {
                const isDone = completed.has(i)
                const colonMatch = b.match(/^([^:：]+)[:：]\s*(.+)$/)
                const stepTitle = colonMatch ? colonMatch[1].trim() : null
                const stepBody = colonMatch ? colonMatch[2].trim() : b

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onToggleStep?.(i)}
                    style={{
                      display: "flex", gap: 12, alignItems: "flex-start",
                      background: isDone ? "#F0FDF4" : "#fff",
                      borderRadius: 14,
                      padding: "14px 14px",
                      border: isDone
                        ? "1.5px solid rgba(16,185,129,0.3)"
                        : "1.5px solid rgba(139,92,246,0.12)",
                      boxShadow: isDone
                        ? "0 2px 8px rgba(16,185,129,0.08)"
                        : "0 4px 12px rgba(139,92,246,0.05)",
                      position: "relative",
                      animation: `hw-msg-in 0.5s cubic-bezier(.16,1,.3,1) ${i * 0.08}s both`,
                      cursor: "pointer",
                      width: "100%", textAlign: "left",
                      fontFamily: "inherit",
                      transition: "all 0.3s cubic-bezier(.16,1,.3,1)",
                    }}
                    onMouseEnter={e => {
                      if (!isDone) {
                        ;(e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"
                        ;(e.currentTarget as HTMLElement).style.boxShadow = "0 8px 20px rgba(139,92,246,0.12)"
                      }
                    }}
                    onMouseLeave={e => {
                      ;(e.currentTarget as HTMLElement).style.transform = "translateY(0)"
                      ;(e.currentTarget as HTMLElement).style.boxShadow = isDone
                        ? "0 2px 8px rgba(16,185,129,0.08)"
                        : "0 4px 12px rgba(139,92,246,0.05)"
                    }}
                  >
                    {/* Weekly colored icon */}
                    {(() => {
                      const weekPalettes = [
                        { grad: "linear-gradient(135deg, #3B82F6, #2563EB)", color: "#3B82F6", icon: "📋" },
                        { grad: "linear-gradient(135deg, #8B5CF6, #7C3AED)", color: "#8B5CF6", icon: "🎯" },
                        { grad: "linear-gradient(135deg, #F59E0B, #D97706)", color: "#F59E0B", icon: "💪" },
                        { grad: "linear-gradient(135deg, #10B981, #059669)", color: "#10B981", icon: "🏆" },
                      ]
                      const wp = weekPalettes[i % 4]
                      return (
                        <div style={{
                          width: 40, height: 40, borderRadius: 12,
                          background: isDone
                            ? "linear-gradient(135deg, #10B981, #059669)"
                            : wp.grad,
                          color: "#fff", flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 18,
                          boxShadow: isDone
                            ? "0 4px 10px rgba(16,185,129,0.35)"
                            : `0 6px 14px ${wp.color}40`,
                          transition: "all 0.25s",
                          position: "relative",
                        }}>
                          {isDone ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "hw-pop 0.35s cubic-bezier(.34,1.56,.64,1)" }}>
                              <path d="M20 6L9 17l-5-5"/>
                            </svg>
                          ) : (
                            <span>{wp.icon}</span>
                          )}
                        </div>
                      )
                    })()}

                    <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                      {/* Week label chip */}
                      <div style={{
                        display: "flex", alignItems: "center", gap: 6,
                        marginBottom: stepTitle ? 4 : 0,
                      }}>
                        <span style={{
                          fontSize: 9, fontWeight: 800,
                          padding: "2px 7px", borderRadius: 999,
                          background: isDone ? "#D1FAE5" : "#F3E8FF",
                          color: isDone ? "#059669" : "#7C3AED",
                          letterSpacing: 0.5,
                        }}>
                          {i + 1}-Р ДОЛОО ХОНОГ
                        </span>
                        {isDone && (
                          <span style={{
                            fontSize: 9, fontWeight: 700, color: "#059669",
                            letterSpacing: 0.5, textTransform: "uppercase",
                          }}>
                            ✓ Гүйцэтгэсэн
                          </span>
                        )}
                      </div>
                      {stepTitle ? (
                        <>
                          <div style={{
                            fontSize: 13, fontWeight: 800,
                            color: isDone ? "#059669" : "#111827",
                            marginBottom: 3, lineHeight: 1.3,
                            textDecoration: isDone ? "line-through" : "none",
                            textDecorationColor: "#10B98180",
                          }}>
                            {stepTitle}
                          </div>
                          <div style={{
                            fontSize: 12,
                            color: isDone ? "#6B7280" : "#4B5563",
                            lineHeight: 1.55,
                            opacity: isDone ? 0.7 : 1,
                          }}>
                            {stepBody}
                          </div>
                        </>
                      ) : (
                        <div style={{
                          fontSize: 13,
                          color: isDone ? "#6B7280" : "#1F2937",
                          lineHeight: 1.55,
                          textDecoration: isDone ? "line-through" : "none",
                          textDecorationColor: "#10B98180",
                          opacity: isDone ? 0.75 : 1,
                        }}>
                          {stepBody}
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )
        })()}

        </>
        )}

        </div>{/* end PAGE SLIDE WRAPPER */}

        {/* ═══ FOLLOW-UP Q&A SECTION (only if any) ═══════════════════════ */}
        {followUps.length > 0 && (
          <>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "26px 4px 12px",
            }}>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, #E5E7EB, transparent)" }}/>
              <div style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "6px 12px", borderRadius: 999,
                background: "#F3E8FF", color: "#7C3AED",
                fontSize: 10, fontWeight: 800,
                letterSpacing: 0.8, textTransform: "uppercase",
                border: "1px solid #E9D5FF",
              }}>
                <span>💬</span> Чат түүх
              </div>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, #E5E7EB, transparent)" }}/>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {followUps.map((f, i) => f.role === "user" ? (
                <div key={i} style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{
                    maxWidth: "85%",
                    background: "linear-gradient(135deg, #E8541A, #F07040)",
                    color: "#fff",
                    padding: "10px 14px",
                    borderRadius: 16,
                    borderBottomRightRadius: 4,
                    fontSize: 13, lineHeight: 1.5, fontWeight: 500,
                    boxShadow: "0 4px 12px rgba(232,84,26,0.2)",
                  }}>
                    {f.content}
                  </div>
                </div>
              ) : (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 10, flexShrink: 0,
                    background: "linear-gradient(135deg, #E8541A, #F07040)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(232,84,26,0.25)",
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
                      <path d="M12 2l1.4 4.3L17.7 8l-4.3 1.4L12 14l-1.4-4.6L6.3 8l4.3-1.7z"/>
                    </svg>
                  </div>
                  <div style={{
                    flex: 1, minWidth: 0,
                    background: "#fff",
                    padding: "10px 14px",
                    borderRadius: 16,
                    borderTopLeftRadius: 4,
                    fontSize: 13, lineHeight: 1.6, color: "#1F2937",
                    border: "1px solid rgba(0,0,0,0.04)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  }}>
                    {f.pending ? (
                      <div style={{ display: "flex", gap: 4, padding: "4px 0" }}>
                        {[0, 1, 2].map(i => (
                          <div key={i} style={{
                            width: 6, height: 6,
                            background: "#9CA3AF", borderRadius: "50%",
                            animation: `hw-bounce 1.4s ease-in-out ${i * 0.16}s infinite`,
                          }} />
                        ))}
                      </div>
                    ) : (
                      renderFormattedText(f.content)
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Disclaimer footer */}
        <div style={{
          textAlign: "center", fontSize: 10, color: "#9CA3AF",
          padding: "24px 12px 8px", fontWeight: 500, lineHeight: 1.5,
        }}>
          💡 Энэ зөвлөгөө нь чиглүүлэх зорилготой. Мэргэжлийн тусламж шаардлагатай бол сэтгэл зүйчтэй холбогдоорой.
        </div>
      </div>

      {/* ── TAP-TO-EXPAND DETAIL SHEET ─────────────────────────────────── */}
      {expandedInsight && (() => {
        const sk = expandedInsight.sectionKey
        const palette = sk === "strengths"
          ? { color: "#10B981", grad: "linear-gradient(135deg, #10B981, #059669)", bg: "#ECFDF5", soft: "#D1FAE5", emoji: "✨", label: "Давуу тал" }
          : sk === "watchouts"
          ? { color: "#F59E0B", grad: "linear-gradient(135deg, #F59E0B, #D97706)", bg: "#FFFBEB", soft: "#FEF3C7", emoji: "⚠️", label: "Анхаарах зүйл" }
          : sk === "tips"
          ? { color: "#E8541A", grad: "linear-gradient(135deg, #E8541A, #F07040)", bg: "#FFF7ED", soft: "#FFEDD5", emoji: "💡", label: "Практик зөвлөмж" }
          : { color: "#3B82F6", grad: "linear-gradient(135deg, #3B82F6, #2563EB)", bg: "#DBEAFE", soft: "#BFDBFE", emoji: "🎯", label: "Гол дүгнэлт" }

        const impactPct = Math.max(40, 95 - expandedInsight.index * 22)
        const impactLabel = expandedInsight.index === 0 ? "Өндөр" : expandedInsight.index === 1 ? "Дунд" : "Бага"

        return (
          <div
            onClick={() => setExpandedInsight(null)}
            style={{
              position: "absolute", inset: 0,
              background: "rgba(15,23,42,0.55)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              zIndex: 20,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 16,
              animation: "hw-msg-in 0.25s ease-out",
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: "#fff",
                borderRadius: 22,
                width: "100%", maxWidth: 380,
                maxHeight: "92%",
                overflow: "hidden",
                boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
                display: "flex", flexDirection: "column",
                animation: "hw-modal-in 0.35s cubic-bezier(.16,1,.3,1)",
              }}
            >
              {/* Header */}
              <div style={{
                background: palette.grad,
                padding: "16px 18px",
                color: "#fff",
                position: "relative", overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", top: -30, right: -10,
                  fontSize: 100, opacity: 0.18, lineHeight: 1,
                }}>{palette.emoji}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, position: "relative" }}>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "4px 10px", borderRadius: 999,
                    background: "rgba(255,255,255,0.22)",
                    fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase",
                  }}>
                    {palette.emoji} {palette.label} · #{expandedInsight.index + 1}
                  </div>
                  <button
                    onClick={() => setExpandedInsight(null)}
                    style={{
                      width: 30, height: 30, borderRadius: 10,
                      border: "none", background: "rgba(255,255,255,0.22)",
                      color: "#fff", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "inherit",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
                <div style={{
                  fontSize: 20, fontWeight: 900, lineHeight: 1.25, letterSpacing: -0.4,
                  position: "relative",
                }}>
                  {expandedInsight.title}
                </div>
              </div>

              {/* Body */}
              <div style={{ overflowY: "auto", padding: "16px 18px" }}>
                {/* Impact widget */}
                <div style={{
                  background: palette.bg, border: `1px solid ${palette.soft}`,
                  borderRadius: 14, padding: "12px 14px", marginBottom: 14,
                }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    marginBottom: 8,
                  }}>
                    <div style={{
                      fontSize: 10, fontWeight: 800, color: palette.color,
                      letterSpacing: 1, textTransform: "uppercase",
                    }}>Нөлөөллийн түвшин</div>
                    <div style={{
                      fontSize: 14, fontWeight: 900, color: palette.color,
                    }}>{impactLabel} · {impactPct}%</div>
                  </div>
                  <div style={{ height: 8, background: "#fff", borderRadius: 8, overflow: "hidden" }}>
                    <div style={{
                      width: `${impactPct}%`, height: "100%",
                      background: palette.grad, borderRadius: 8,
                      boxShadow: `0 0 8px ${palette.color}55`,
                      position: "relative", overflow: "hidden",
                    }}>
                      <div className="hw-shimmer-bar" style={{ position: "absolute", inset: 0 }}/>
                    </div>
                  </div>
                </div>

                {/* Full description */}
                <div style={{
                  fontSize: 11, fontWeight: 800, color: "#6B7280",
                  letterSpacing: 1, textTransform: "uppercase", marginBottom: 6,
                }}>
                  Тайлбар
                </div>
                <div style={{
                  fontSize: 14, lineHeight: 1.65, color: "#1F2937",
                  padding: "12px 14px", background: "#F9FAFB",
                  borderRadius: 12, borderLeft: `3px solid ${palette.color}`,
                  marginBottom: 14,
                }}>
                  {expandedInsight.body}
                </div>

                {/* Ask AI for more */}
                <button
                  type="button"
                  onClick={() => {
                    onAskFollowUp?.(`"${expandedInsight.title}" гэдгийг илүү дэлгэрэнгүй тайлбарлаж, надад яаж хэрэгжүүлэхийг хэлээч.`)
                    setExpandedInsight(null)
                  }}
                  style={{
                    width: "100%", padding: "12px 14px",
                    background: palette.grad,
                    color: "#fff", border: "none", borderRadius: 12,
                    fontSize: 13, fontWeight: 800, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    boxShadow: `0 8px 20px ${palette.color}44`,
                    fontFamily: "inherit",
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l1.4 4.3L17.7 8l-4.3 1.4L12 14l-1.4-4.6L6.3 8l4.3-1.7z"/>
                  </svg>
                  AI-аас илүү дэлгэрэнгүй
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── BOTTOM CHAT INPUT ───────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0,
        padding: "10px 12px 12px",
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(0,0,0,0.06)",
      }}>
        {/* Suggested chips (only when no follow-ups yet) */}
        {status === "done" && followUps.length === 0 && (
          <div style={{
            display: "flex", gap: 6, overflowX: "auto",
            paddingBottom: 8, marginBottom: 4,
            scrollbarWidth: "none",
          }}>
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { setAskInput(q); setTimeout(() => onAskFollowUp?.(q), 0); setAskInput("") }}
                style={{
                  flexShrink: 0,
                  background: "#fff",
                  border: "1px solid #E5E7EB",
                  color: "#374151",
                  padding: "6px 12px", borderRadius: 999,
                  fontSize: 11, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={e => {
                  ;(e.currentTarget as HTMLElement).style.background = "#E8541A"
                  ;(e.currentTarget as HTMLElement).style.color = "#fff"
                  ;(e.currentTarget as HTMLElement).style.borderColor = "#E8541A"
                }}
                onMouseLeave={e => {
                  ;(e.currentTarget as HTMLElement).style.background = "#fff"
                  ;(e.currentTarget as HTMLElement).style.color = "#374151"
                  ;(e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"
                }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input row */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "#fff",
          border: "1.5px solid #E5E7EB",
          borderRadius: 14, padding: "4px 4px 4px 14px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          transition: "border-color 0.2s",
        }}>
          <input
            type="text"
            value={askInput}
            onChange={e => setAskInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAsk() } }}
            placeholder="Үр дүнгийн талаар асуу..."
            disabled={status !== "done" || askPending}
            style={{
              flex: 1, minWidth: 0,
              border: "none", outline: "none", background: "transparent",
              fontSize: 13, fontWeight: 500, color: "#1F2937",
              fontFamily: "inherit",
              padding: "8px 0",
            }}
            onFocus={e => ((e.currentTarget.parentElement as HTMLElement).style.borderColor = "#E8541A")}
            onBlur={e => ((e.currentTarget.parentElement as HTMLElement).style.borderColor = "#E5E7EB")}
          />
          <button
            type="button"
            onClick={handleAsk}
            disabled={!askInput.trim() || status !== "done" || askPending}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: askInput.trim() && !askPending
                ? "linear-gradient(135deg, #E8541A, #F07040)"
                : "#E5E7EB",
              border: "none", cursor: askInput.trim() && !askPending ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", flexShrink: 0,
              boxShadow: askInput.trim() && !askPending ? "0 4px 12px rgba(232,84,26,0.3)" : "none",
              transition: "all 0.2s", fontFamily: "inherit",
            }}
            aria-label="Send"
          >
            {askPending ? (
              <div style={{ width: 14, height: 14, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "hw-spin 0.8s linear infinite" }}/>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2" fill="currentColor" stroke="none"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
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
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>
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

function BotMessage({ message, fontSize, userQuestion = "", showAvatar = true, onOpenArtifact }: { message: Message; fontSize: number; userQuestion?: string; showAvatar?: boolean; onOpenArtifact?: (m: Message) => void }) {
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
      {/* NEW: Analysis Card (from /api/analyze) */}
      {message.analysisData && (
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", animation: "hw-msg-in 0.4s cubic-bezier(.16,1,.3,1)" }}>
          {showAvatar ? <BrainAvatar /> : <div style={{ width: 40, flexShrink: 0 }} aria-hidden="true" />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <AnalysisCard
              data={message.analysisData}
              title={message.analysisTitle || "Тест"}
              onExpand={() => onOpenArtifact?.(message)}
            />
          </div>
        </div>
      )}

      {/* Artifact preview button (when message has insightCard + briefSummary) */}
      {message.insightCard && message.briefSummary && (
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", animation: "hw-msg-in 0.4s cubic-bezier(.16,1,.3,1)" }}>
          {showAvatar ? <BrainAvatar /> : <div style={{ width: 40, flexShrink: 0 }} aria-hidden="true" />}
          <ArtifactPreview message={message} onOpen={onOpenArtifact} fontSize={fontSize} />
        </div>
      )}

      {/* Legacy: inline insight card (kept for backward-compat — only shown when no briefSummary) */}
      {message.insightCard && !message.briefSummary && (
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", animation: "hw-msg-in 0.4s cubic-bezier(.16,1,.3,1)" }}>
          <div style={{ width: 40, flexShrink: 0 }} aria-hidden="true" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <InsightCard data={message.insightCard} />
            {message.insightCard.traits && message.insightCard.traits.length > 0 && (
              <TraitBreakdown traits={message.insightCard.traits} />
            )}
          </div>
        </div>
      )}

      {/* Skip plain-text bubble when this message is an artifact preview
          (the full AI advice lives inside the artifact panel, NOT the chat) */}
      {cleanText && !(message.insightCard && message.briefSummary) && (
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", animation: "hw-msg-in 0.4s cubic-bezier(.16,1,.3,1)" }}>
          {showAvatar ? (
            <BrainAvatar />
          ) : (
            <div style={{ width: 40, flexShrink: 0 }} aria-hidden="true" />
          )}
          <div style={{
            maxWidth: "82%",
            background: "linear-gradient(145deg, #fff 0%, #FFFCFA 100%)",
            border: "1.5px solid rgba(232,84,26,0.08)",
            borderRadius: 18,
            borderBottomLeftRadius: showAvatar ? 4 : 18,
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
                  {cat.icon === "system" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>}
                  {cat.icon === "test" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>}
                  {cat.icon === "rocket" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>}
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
  // Artifact overlay: when a brief insight message's button is clicked,
  // the widget displays the full artifact for that message's data.
  const [artifactMessageIdx, setArtifactMessageIdx] = useState<number | null>(null)
  // Track the index of the in-flight analysis message so the LLM response
  // can be merged into the same artifact (instead of becoming a new bubble).
  const pendingAnalysisIdxRef = useRef<number | null>(null)
  // Pending follow-up question state (per artifact)
  const [followUpPending, setFollowUpPending] = useState(false)

  // Toggle a checkable action step inside the artifact (TODO behavior)
  const toggleArtifactStep = (stepIdx: number) => {
    if (artifactMessageIdx === null) return
    setMessages(prev => prev.map((m, i) => {
      if (i !== artifactMessageIdx) return m
      const completed = new Set(m.completedSteps || [])
      if (completed.has(stepIdx)) completed.delete(stepIdx)
      else completed.add(stepIdx)
      return { ...m, completedSteps: Array.from(completed) }
    }))
  }

  // Send a follow-up question from inside the artifact, append Q&A to that message
  const askArtifactFollowUp = async (question: string) => {
    if (artifactMessageIdx === null) return
    const target = messages[artifactMessageIdx]
    if (!target || !target.insightCard) return

    // 1. Append the user question + assistant placeholder
    setMessages(prev => prev.map((m, i) => {
      if (i !== artifactMessageIdx) return m
      const existing = m.followUps || []
      return {
        ...m,
        followUps: [
          ...existing,
          { role: "user" as const, content: question },
          { role: "assistant" as const, content: "", pending: true },
        ],
      }
    }))
    setFollowUpPending(true)

    try {
      // 2. Build contextual prompt with test info
      const card = target.insightCard
      const contextLine =
        `Тестийн контекст — нэр: ${card.testName}, оноо: ${card.score}/${card.total} ` +
        `(${card.total > 0 ? Math.round((card.score / card.total) * 100) : 0}%), үнэлгээ: ${card.resultLabel}. ` +
        `Дэлгэрэнгүй задаргаа: ${(card.traits || []).map(t => `${t.label} ${t.score}/${t.total}`).join("; ") || "—"}.`
      const fullPrompt = `${contextLine}\n\nХэрэглэгчийн асуулт: ${question}`

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "user", content: fullPrompt },
          ],
          lang: lang === "МН" ? "mn" : "en",
        }),
      })
      const data = await res.json().catch(() => ({}))
      const reply = (data?.reply || data?.error || "Уучлаарай, хариу авч чадсангүй.") as string

      // 3. Replace placeholder with real reply
      setMessages(prev => prev.map((m, i) => {
        if (i !== artifactMessageIdx) return m
        const fu = [...(m.followUps || [])]
        const lastIdx = fu.length - 1
        if (lastIdx >= 0 && fu[lastIdx].role === "assistant") {
          fu[lastIdx] = { role: "assistant", content: reply, pending: false }
        }
        return { ...m, followUps: fu }
      }))
    } catch (err: any) {
      setMessages(prev => prev.map((m, i) => {
        if (i !== artifactMessageIdx) return m
        const fu = [...(m.followUps || [])]
        const lastIdx = fu.length - 1
        if (lastIdx >= 0 && fu[lastIdx].role === "assistant") {
          fu[lastIdx] = { role: "assistant", content: "Уучлаарай, алдаа гарлаа. Дахин оролдоно уу.", pending: false }
        }
        return { ...m, followUps: fu }
      }))
    } finally {
      setFollowUpPending(false)
    }
  }
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
          content: `**Алдаа:** ${event.data.message || "Өгөгдөл татахад алдаа гарлаа."}\n\nДахин оролдоно уу эсвэл hire.mn хэрэглэгчийн тусламжтай холбогдоно уу.`,
        }
        setMessages(prev => [...prev, errorMsg])
      }
      
      // AI Analysis request with report data (from API or direct)
      if (event.data.type === "HIREMN_AI_ANALYSIS" && event.data.payload) {
        const { reportTitle, reportData } = event.data.payload

        const examPayload: any =
          (reportData as any)?.exam?.payload ?? (reportData as any)?.exam ?? {}
        const testName: string =
          examPayload.assessmentName ||
          examPayload.assessment?.name ||
          reportTitle ||
          "Тест"

        // 1. Push a loading placeholder message
        const placeholderIdx = (() => {
          let idx = -1
          setMessages(prev => {
            idx = prev.length
            return [...prev, {
              role: "assistant",
              content: `**🔍 ${testName}**\n\nAI таны үр дүнг шинжилж байна...`,
              analysisStatus: "loading",
              analysisTitle: testName,
            }]
          })
          return idx
        })()

        // 2. Call /api/analyze for structured analysis (45s client timeout)
        const ctrl = new AbortController()
        const timer = setTimeout(() => ctrl.abort(), 45000)
        const startedAt = Date.now()
        console.log("[analyze] starting:", testName)

        fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reportData, reportTitle: testName }),
          signal: ctrl.signal,
        })
          .then(async res => {
            clearTimeout(timer)
            console.log(`[analyze] response in ${Date.now() - startedAt}ms, status ${res.status}`)
            const json = await res.json().catch(() => ({}))
            if (!res.ok || !json.success || !json.data) {
              throw new Error(json.error || `HTTP ${res.status}`)
            }
            setMessages(prev => prev.map((m, i) =>
              i === placeholderIdx
                ? {
                    ...m,
                    content: "",
                    analysisData: json.data,
                    analysisTitle: testName,
                    analysisStatus: "done",
                  }
                : m
            ))
          })
          .catch(err => {
            clearTimeout(timer)
            const elapsed = Date.now() - startedAt
            const isTimeout = err?.name === "AbortError" || elapsed > 40000
            console.error(`[analyze] failed after ${elapsed}ms:`, err)
            setMessages(prev => prev.map((m, i) =>
              i === placeholderIdx
                ? {
                    ...m,
                    content: isTimeout
                      ? "Шинжилгээ удаан хариу өгөв. Дахин оролдоно уу."
                      : `Шинжилгээ хийхэд алдаа гарлаа: ${err?.message || err}`,
                    analysisStatus: "error",
                  }
                : m
            ))
          })

        return // Skip the legacy InsightCard flow
      }

      // ─── LEGACY (kept for backward compat, not reached) ──────────────
      if (false && event.data.type === "HIREMN_AI_ANALYSIS_LEGACY" && event.data.payload) {
        const { reportTitle, reportData, userInfo, analysisResults, prompt } = event.data.payload

        const examPayload: any =
          (reportData as any)?.exam?.payload ?? (reportData as any)?.exam ?? {}
        const answersPayload: any[] =
          (reportData as any)?.answers?.payload ?? (reportData as any)?.answers ?? []

        const testName: string =
          examPayload.assessmentName ||
          examPayload.assessment?.name ||
          reportTitle ||
          "Тест"
        const resultLabel: string = examPayload.result || ""
        const score: string | number = examPayload.point ?? examPayload.value ?? ""
        const totalScore: string | number =
          examPayload.total ?? examPayload.assessment?.totalPoint ?? ""
        const description: string = examPayload.assessment?.description || ""

        // Group answers by question category (works for DISC, Big5, etc.)
        const subScoreMap = new Map<string, { sum: number; max: number; count: number }>()
        for (const a of answersPayload) {
          const catName: string = a?.questionCategory?.name || ""
          if (!catName) continue
          const p = parseFloat(a?.point ?? a?.answer?.point ?? "0") || 0
          const maxP = parseFloat(a?.question?.point ?? a?.question?.maxValue ?? "0") || 0
          const cur = subScoreMap.get(catName) || { sum: 0, max: 0, count: 0 }
          cur.sum += p
          cur.max += maxP
          cur.count += 1
          subScoreMap.set(catName, cur)
        }

        // Compact 3-up sub-scores (top-of-card glance)
        const subScores: InsightSubScore[] = Array.from(subScoreMap.entries())
          .slice(0, 3)
          .map(([label, v]) => {
            const pct = v.max > 0 ? (v.sum / v.max) * 100 : 0
            const level: InsightSubScore["level"] =
              pct >= 66 ? "high" : pct >= 33 ? "mid" : "low"
            return {
              label,
              value: v.max > 0 ? `${v.sum}/${v.max}` : `${v.sum}`,
              level,
              bar: Math.round(pct),
            }
          })

        // Full-width trait breakdown — only if 2+ categories with maxima
        const traitLevelLabel = (pct: number) =>
          pct >= 85 ? "Маш сайн"
          : pct >= 65 ? "Сайн"
          : pct >= 40 ? "Дундаж"
          : "Бага түвшин"
        const traitLevel = (pct: number): InsightTrait["level"] =>
          pct >= 85 ? "excellent"
          : pct >= 65 ? "high"
          : pct >= 40 ? "mid"
          : "low"

        const traits: InsightTrait[] = Array.from(subScoreMap.entries())
          .filter(([, v]) => v.max > 0)
          .map(([label, v]) => {
            const pct = v.max > 0 ? (v.sum / v.max) * 100 : 0
            return {
              label,
              levelLabel: traitLevelLabel(pct),
              score: v.sum,
              total: v.max,
              level: traitLevel(pct),
            }
          })

        const numericScore = Number(score) || 0
        const numericTotal = Number(totalScore) || 0

        const insightCard: InsightCardData = {
          testName,
          resultLabel: resultLabel || "Үр дүн",
          score: numericScore,
          total: numericTotal,
          description: description ? description.slice(0, 200) : undefined,
          subScores: subScores.length > 0 ? subScores : undefined,
          traits: traits.length >= 2 ? traits : undefined,
        }

        // Brief summary line for the chat bubble
        const insightPct = numericTotal > 0 ? Math.round((numericScore / numericTotal) * 100) : 0
        const briefSummary =
          `Та **${testName}**-д **${numericScore}/${numericTotal} оноо (${insightPct}%)** авлаа. ` +
          `Үнэлгээ: **${resultLabel || "тодорхойлогдоогүй"}**. ` +
          `Доорх товчоор дэлгэрэнгүй задаргаа болон AI зөвлөгөөг харна уу. ✨`

        // Push the message; record its index so the LLM response can be merged in
        const contextMsg: Message = {
          role: "assistant",
          content: "",  // will be filled by AI advice
          insightCard,
          briefSummary,
          analysisStatus: "loading",
        }
        setMessages(prev => {
          pendingAnalysisIdxRef.current = prev.length
          return [...prev, contextMsg]
        })

        // ── Build a clean structured prompt for the LLM ───────────────────
        // Strip "Hire.mn" / "hire.mn" / "платформ" tokens from text we send,
        // so the keyword router in sendMessage doesn't hijack it.
        const sanitize = (s: string) =>
          (s || "").replace(/hire\.?mn/gi, "тест систем").replace(/платформ/gi, "систем")

        // Compact answer summary — cap to first 20 to keep prompt short
        const answerSummary = answersPayload
          .slice(0, 20)
          .map((a: any, i: number) => {
            const v = a?.answer?.value ?? ""
            const p = a?.point ?? a?.answer?.point ?? ""
            return `${i + 1}. "${v}" (${p})`
          })
          .join("\n")

        const userPrompt = sanitize(
          prompt ||
            "Миний тестийн үр дүнг дэлгэрэнгүй задлан шинжилж: 1) Гол дүгнэлт, 2) Давуу/сул тал, 3) Практик зөвлөмж, 4) Цаашид сайжруулах алхмууд гарган гаргаж өгнө үү."
        )

        const fullPrompt =
          `Тестийн үр дүнгийн дүн шинжилгээ хийнэ үү.\n\n` +
          `Тестийн нэр: ${sanitize(testName)}\n` +
          (description ? `Тестийн тайлбар: ${sanitize(description)}\n` : "") +
          (resultLabel ? `Үнэлгээ: ${resultLabel}\n` : "") +
          (score !== "" ? `Авсан оноо: ${score}${totalScore !== "" ? ` / ${totalScore}` : ""}\n` : "") +
          (answerSummary ? `\nАсуулт бүрийн хариулт:\n${answerSummary}\n` : "") +
          `\nХэрэглэгчийн хүсэлт: ${userPrompt}`

        // Send the prompt to the LLM but hide it from the chat UI.
        // Also bypass the static keyword router so we don't get the
        // "About hire.mn" or "Test info" canned responses.
        setTimeout(() => {
          sendMessage(fullPrompt, { hidden: true, skipStaticRouting: true })
        }, 800)
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
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  const sendMessage = async (text: string, opts?: { hidden?: boolean; skipStaticRouting?: boolean }) => {
    // ── TEMP: Daily message limit disabled ────────────────────────────
    // // Check if user is locked - popup will show automatically
    // if (!canSendMessage()) {
    //   return
    // }

    if (!text.trim() || isTyping) return

    // ── TEMP: Daily message limit disabled ────────────────────────────
    // // Increment daily count
    // incrementDailyCount()

    setShowQuickReplies(false)
    // Only add a visible user bubble when not hidden (analysis requests are hidden)
    if (!opts?.hidden) {
      const userMsg: Message = { role: "user", content: text }
      setMessages(prev => [...prev, userMsg])
    }
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

    if (!opts?.skipStaticRouting && (isAboutHire || isAboutTeam || isFreeTest || isPaidTest || isFounderQuery || matchedMember)) {
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
            content: "**Үнэүй тестүүд**\n\nТа эдгээр тестүүдийг ямар ч төлбөргүйгээр өгч, өөрийнхөө талаар илүү ихийг мэдэж авах боломжтой:",
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
      // Build history: include the current user prompt even when it's hidden from UI,
      // because the LLM still needs to see it.
      const currentMsg: Message = { role: "user", content: text }
      const history = [...messages, currentMsg].map(m => ({ role: m.role, content: m.content }))
      console.log("[hire-mn-chat] POST /api/chat", { historyLen: history.length, lastLen: text.length, hidden: !!opts?.hidden })

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, lang: lang === "МН" ? "mn" : "en" }),
      })

      console.log("[hire-mn-chat] /api/chat status:", res.status)

      if (!res.ok) {
        const errorBody = await res.text()
        console.error("[hire-mn-chat] /api/chat error body:", errorBody)
        throw new Error(`HTTP ${res.status}: ${errorBody.slice(0, 500)}`)
      }
      const data = await res.json()
      const replyText = data.reply || "Уучлаарай, хариу авч чадсангүй."

      // If this is an analysis response, merge it INTO the pending insight
      // message instead of creating a new bubble.
      const pendingIdx = pendingAnalysisIdxRef.current
      if (opts?.hidden && pendingIdx !== null) {
        pendingAnalysisIdxRef.current = null
        setMessages(prev => prev.map((m, i) =>
          i === pendingIdx
            ? { ...m, content: replyText, analysisStatus: "done" as const }
            : m
        ))
      } else {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: replyText,
          tests: data.tests || [],
          categories: data.categories || [],
        }])
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error("[hire-mn-chat] sendMessage failed:", msg)
      let friendly = "Уучлаарай, холболтын алдаа гарлаа."
      if (msg.includes("credit card") || msg.includes("AI Gateway"))
        friendly = "AI үйлчилгээ одоогоор идэвхгүй байна."
      else if (msg.includes("rate limit"))
        friendly = "Хэт олон хүсэлт. Түр хүлээгээд дахин оролдоно уу."
      else if (msg.includes("ANTHROPIC_API_KEY") || msg.includes("api_key") || msg.includes("authentication"))
        friendly = "AI API key тохируулагдаагүй байна (Vercel env vars шалгана уу)."
      else if (msg.includes("HTTP 5"))
        friendly = `Серверийн алдаа: ${msg}`
      else if (msg.includes("HTTP 4"))
        friendly = `Хүсэлтийн алдаа: ${msg}`

      // If this was an analysis request, set error status on the pending message
      const pendingIdx = pendingAnalysisIdxRef.current
      if (opts?.hidden && pendingIdx !== null) {
        pendingAnalysisIdxRef.current = null
        setMessages(prev => prev.map((m, i) =>
          i === pendingIdx
            ? { ...m, content: friendly, analysisStatus: "error" as const }
            : m
        ))
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: friendly }])
      }
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
        @keyframes hw-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes hw-artifact-in {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes hw-shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes hw-glow-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(232,84,26,0.4); }
          50%      { box-shadow: 0 0 0 12px rgba(232,84,26,0); }
        }
        @keyframes hw-confetti {
          0%   { transform: translateY(0) rotate(0); opacity: 1; }
          100% { transform: translateY(140px) rotate(720deg); opacity: 0; }
        }
        @keyframes hw-checkmark-draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes hw-step-complete {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        @keyframes hw-needle-swing {
          0%   { transform: rotate(-20deg); }
          60%  { transform: rotate(8deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes hw-fade-up {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes hw-progress-shimmer {
          0%   { background-position: 0 0; }
          100% { background-position: 40px 0; }
        }
        @keyframes hw-icon-bounce {
          0%, 100% { transform: translateY(0) rotate(0); }
          25%      { transform: translateY(-3px) rotate(-5deg); }
          75%      { transform: translateY(-2px) rotate(5deg); }
        }
        @keyframes hw-slide-left {
          from { transform: translateX(40px); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        @keyframes hw-slide-right {
          from { transform: translateX(-40px); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        @keyframes hw-modal-in {
          from { transform: scale(0.9) translateY(20px); opacity: 0; }
          to   { transform: scale(1) translateY(0); opacity: 1; }
        }
        .hw-shimmer-bar {
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%);
          background-size: 200% 100%;
          animation: hw-shimmer 2.4s linear infinite;
        }
        .hw-card-tilt {
          transition: transform 0.3s cubic-bezier(.16,1,.3,1), box-shadow 0.3s ease;
        }
        .hw-card-tilt:hover {
          transform: translateY(-3px) scale(1.005);
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
        
        /* Mascot animations */
        @keyframes hw-mascot-bounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-6px) scale(1.02); }
        }
        @keyframes hw-mascot-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-3px) rotate(-2deg); }
          50% { transform: translateY(-5px) rotate(0deg); }
          75% { transform: translateY(-3px) rotate(2deg); }
        }
        @keyframes hw-mascot-wave {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(15deg); }
          40% { transform: rotate(-10deg); }
          60% { transform: rotate(15deg); }
          80% { transform: rotate(-5deg); }
        }
        .hw-mascot-bounce {
          animation: hw-mascot-bounce 2s ease-in-out infinite;
        }
        .hw-mascot-float {
          animation: hw-mascot-float 3s ease-in-out infinite;
        }
        .hw-mascot-wave {
          animation: hw-mascot-wave 1.5s ease-in-out infinite;
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
        
        /* ═══════════════════════════════════════════════════════════════════════
           LIQUID GLASS MORPHISM - FUTURISTIC UI ANIMATIONS
           ═══════════════════════════════════════════════════════════════════════ */
        
        @keyframes hw-float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.02); }
        }
        @keyframes hw-ring {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes hw-online-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.6); }
          50% { box-shadow: 0 0 0 12px rgba(34,197,94,0); }
        }
        @keyframes hw-msg-in {
          from { transform: translateY(16px) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes hw-glow {
          0%, 100% { box-shadow: 0 0 40px rgba(232,84,26,0.25); }
          50% { box-shadow: 0 0 80px rgba(232,84,26,0.45); }
        }
        @keyframes hw-aurora {
          0% { transform: rotate(0deg) translate(0, 0); }
          33% { transform: rotate(120deg) translate(10px, -10px); }
          66% { transform: rotate(240deg) translate(-10px, 10px); }
          100% { transform: rotate(360deg) translate(0, 0); }
        }
        @keyframes hw-orb-float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(15px, -10px) scale(1.1); }
          50% { transform: translate(5px, 15px) scale(0.95); }
          75% { transform: translate(-10px, 5px) scale(1.05); }
        }
        @keyframes hw-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes hw-pulse-ring {
          0% { transform: scale(0.95); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
          100% { transform: scale(0.95); opacity: 1; }
        }
        @keyframes hw-gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes hw-breathe {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.02); filter: brightness(1.05); }
        }
        @keyframes hw-border-glow {
          0%, 100% { border-color: rgba(232,84,26,0.3); }
          50% { border-color: rgba(232,84,26,0.6); }
        }
        @keyframes hw-sparkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
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
          
          will-change: transform;
        }
       .hw-mascot:hover {
  box-shadow: none !important;
  background: #FFFFFF !important;
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
              height: "min(620px, calc(100vh - 80px))",
              position: "relative",
              overflow: "hidden",
              maxWidth: "calc(100vw - 24px)",
              borderRadius: 24,
              /* Premium Liquid Glass Effect */
              background: `linear-gradient(165deg, 
                rgba(255,255,255,0.95) 0%, 
                rgba(255,253,251,0.92) 40%, 
                rgba(255,248,244,0.88) 100%)`,
              backdropFilter: "blur(40px) saturate(200%)",
              WebkitBackdropFilter: "blur(40px) saturate(200%)",
              boxShadow: `
                0 0 0 1px rgba(255,255,255,0.7),
                0 25px 60px -12px rgba(232,84,26,0.25),
                0 12px 24px -8px rgba(0,0,0,0.1),
                inset 0 1px 1px rgba(255,255,255,1)
              `,
              display: "flex", flexDirection: "column",
              border: "1px solid rgba(232,84,26,0.08)",
            }}>
              
              {/* ══════════ ANIMATED BACKGROUND EFFECTS ══════════ */}
              <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: 24, pointerEvents: "none", zIndex: 0 }}>
                {/* Floating orbs */}
                <div style={{
                  position: "absolute", top: "15%", right: "-10%", width: 200, height: 200, borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(232,84,26,0.08) 0%, transparent 70%)",
                  animation: "hw-orb-float 20s ease-in-out infinite",
                }} />
                <div style={{
                  position: "absolute", bottom: "20%", left: "-15%", width: 160, height: 160, borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(255,140,66,0.06) 0%, transparent 70%)",
                  animation: "hw-orb-float 25s ease-in-out infinite reverse",
                }} />
              </div>

              {/* ══════════ FUTURISTIC HEADER ══════════ */}
              <div style={{
                background: `linear-gradient(135deg, 
                  #E8541A 0%, 
                  #F06835 40%, 
                  #FF8C42 100%)`,
                backgroundSize: "200% 200%",
                animation: "hw-gradient-shift 8s ease infinite",
                padding: "18px 16px 16px",
                flexShrink: 0, 
                position: "relative",
                borderRadius: "24px 24px 0 0",
                overflow: "hidden",
              }}>
                {/* Header shimmer effect */}
                <div style={{
                  position: "absolute", inset: 0, overflow: "hidden",
                }}>
                  <div style={{
                    position: "absolute", top: 0, left: "-100%", width: "50%", height: "100%",
                    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
                    animation: "hw-shimmer 3s ease-in-out infinite",
                  }} />
                </div>
                
                {/* Decorative circles */}
                <div style={{
                  position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                  animation: "hw-breathe 4s ease-in-out infinite",
                }} />
                <div style={{
                  position: "absolute", bottom: -20, left: 30, width: 60, height: 60, borderRadius: "50%",
                  background: "rgba(255,255,255,0.08)",
                  animation: "hw-breathe 5s ease-in-out infinite 1s",
                }} />
                
                {/* Header content */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, position: "relative", zIndex: 1 }}>
                  {/* Glowing Mascot Container */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 14,
                    background: "rgba(255,255,255,0.98)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.15), 0 0 0 2px rgba(255,255,255,0.5)",
                    overflow: "hidden",
                    animation: "hw-pulse-ring 3s ease-in-out infinite",
                    flexShrink: 0,
                  }}>
                    <SplineMascot width={82} height={82} borderRadius={22} />
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ 
                        color: "#fff", fontWeight: 700, fontSize: 16, 
                        textShadow: "0 2px 8px rgba(0,0,0,0.2)",
                        letterSpacing: "-0.3px"
                      }}>
                        hire.mn AI
                      </span>
                      {/* Animated Online Badge */}
                      <span style={{
                        fontSize: 8, fontWeight: 700, letterSpacing: "0.6px",
                        color: "#fff", 
                        background: "linear-gradient(135deg, rgba(34,197,94,0.9), rgba(74,222,128,0.9))",
                        padding: "3px 8px", borderRadius: 10,
                        display: "flex", alignItems: "center", gap: 4,
                        boxShadow: "0 2px 8px rgba(34,197,94,0.4)",
                      }}>
                        <span style={{ 
                          width: 5, height: 5, borderRadius: "50%", background: "#fff",
                          animation: "hw-sparkle 1.5s ease-in-out infinite" 
                        }} />
                        ONLINE
                      </span>
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.9)", fontSize: 11, marginTop: 2, fontWeight: 500 }}>
                      24/7 танд туслахад бэлэн
                    </div>
                  </div>
                  
                  {/* Close Button - Glassmorphism */}
                  <button
                    onClick={() => setIsOpen(false)}
                    style={{
                      width: 36, height: 36, borderRadius: 12,
                      background: "rgba(255,255,255,0.15)", 
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(255,255,255,0.25)",
                      color: "#fff", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.3s cubic-bezier(.16,1,.3,1)",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.25)"
                      ; (e.currentTarget as HTMLElement).style.transform = "rotate(90deg) scale(1.1)"
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.15)"
                      ; (e.currentTarget as HTMLElement).style.transform = "rotate(0deg) scale(1)"
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* ══════════ GLASS TAB NAVIGATION ══════════ */}
                <div style={{
                  display: "flex", gap: 6,
                  background: "rgba(0,0,0,0.12)", 
                  backdropFilter: "blur(8px)",
                  borderRadius: 14, padding: 5,
                  position: "relative", zIndex: 1,
                }}>
                  {[
                    { label: "Чат", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
                    { label: "FAQ", icon: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 16v-4M12 8h.01" },
                    { label: "Холбоо", icon: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72" },
                  ].map((tab, i) => (
                    <button
                      key={tab.label}
                      onClick={() => setActiveTab(i)}
                      style={{
                        flex: 1, padding: "10px 12px", borderRadius: 10,
                        background: activeTab === i 
                          ? "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,252,250,0.95))" 
                          : "transparent",
                        border: "none", cursor: "pointer",
                        color: activeTab === i ? "#E8541A" : "rgba(255,255,255,0.85)",
                        fontSize: 12, fontWeight: 600,
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        transition: "all 0.35s cubic-bezier(.16,1,.3,1)",
                        boxShadow: activeTab === i ? "0 4px 16px rgba(0,0,0,0.12)" : "none",
                        transform: activeTab === i ? "translateY(-1px)" : "translateY(0)",
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  {/* Chat Messages Area - Glass Effect */}
                  <div className="hw-scroll" style={{
                    flex: 1, 
                    minHeight: 0,
                    overflowY: "auto", 
                    padding: "16px 12px 10px",
                    display: "flex", flexDirection: "column", gap: 12,
                    background: "linear-gradient(180deg, rgba(255,253,251,0.4) 0%, rgba(255,255,255,0.6) 100%)",
                    position: "relative", zIndex: 1,
                  }}>
                    {messages.map((msg, i) => {
                      const prevUserMsg = msg.role === "assistant" && i > 0
                        ? messages.slice(0, i).reverse().find(m => m.role === "user")?.content || ""
                        : ""

                      // Messenger-style: only show avatar on the LAST consecutive assistant message
                      const nextMsg = messages[i + 1]
                      const isLastInAssistantGroup =
                        msg.role === "assistant" &&
                        (!nextMsg || nextMsg.role === "user") &&
                        !(i === messages.length - 1 && isTyping)

                      return (
                        <div
                          key={i}
                          className="hw-msg"
                          style={{
                            animation: `hw-msg-in 0.4s cubic-bezier(.34,1.56,.64,1) ${i * 0.05}s both`,
                          }}
                        >
                          {msg.role === "assistant"
                            ? <BotMessage message={msg} fontSize={fontSize} userQuestion={prevUserMsg} showAvatar={isLastInAssistantGroup} onOpenArtifact={() => setArtifactMessageIdx(i)} />
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
                        a: "Үгүй, ихэнх тестүүд бүрэн үнэгүй. Зарим нэмэлт функц, дэлгэрэнгүй тайлан авахад төлбөртэй сонголтууд байдаг боловч үндсэн тестүүд бүгд үнэгүй.",
                        icon: "M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2" 
                      },
                      { 
                        q: "Үр дүнгээ хэрхэн харах вэ?", 
                        a: "Тест дуусмагц таны үр дүн шууд гарна. Профайл х������сэгт орж бүх үр дүнгээ харах, татаж авах, хуваалцах боломжтой. Мөн и-мэйлээр илгээх боломжтой.",
                        icon: "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" 
                      },
                      { 
                        q: "Компани хэрхэн бүртгүүлэх вэ?", 
                        a: "hire.mn вэбсайтад орж \"Компани бүртгүүлэх\" товч дарна уу. Компанийн мэдээллээ оруулаад баталгаажуулах процессыг дуусгана. 24 цагийн дотор хянагдаж баталгаажна.",
                        icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" 
                      },
                      { 
                        q: "Тестийн төрлүүд юу юу байдаг вэ?", 
                        a: "IQ тест, EQ тест, зан чанарын тест, мэргэжлийн ур чадварын тест, хэлний түвшин тодорхойлох тест гэх мэт 50+ төрлийн тест байдаг. Та өөрт тохирох тестүүдийг сонгон өгч болно.",
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
                      { label: "И-мэйл", value: "info@hire.mn", icon: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6", href: "mailto:info@hire.mn" },
                      { label: "Утас", value: "+976 7011-1234", icon: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72", href: "tel:+97670111234" },
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
                <div style={{
                  display: "flex", gap: 8, alignItems: "center",
                  background: "linear-gradient(135deg, #fff 0%, #FFFCFA 100%)",
                  border: "2px solid rgba(232,84,26,0.1)",
                  borderRadius: 16, padding: "4px 5px 4px 14px", 
                  transition: "all 0.3s cubic-bezier(.16,1,.3,1)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)",
                }}
                  onFocusCapture={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#E8541A"
                    ; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(232,84,26,0.15), inset 0 1px 0 rgba(255,255,255,0.8)"
                    ; (e.currentTarget as HTMLElement).style.transform = "scale(1.01)"
                  }}
                  onBlurCapture={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(232,84,26,0.1)"
                    ; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)"
                    ; (e.currentTarget as HTMLElement).style.transform = "scale(1)"
                  }}
                >
                  <input
                    ref={inputRef as any}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Асуулт бичнэ үү..."
                    style={{
                      flex: 1, border: "none", background: "transparent",
                      fontSize: fontSize, outline: "none",
                      color: "#333", padding: "10px 0",
                      fontWeight: 500,
                    }}
                  />
                  <button
                    className="hw-send"
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || isTyping}
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

                {/* TEMP: Daily limit warning hidden ─────────────────────────
                {getRemainingMessages() <= 10 && getRemainingMessages() > 0 && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginTop: 10,
                    padding: "8px 14px",
                    borderRadius: 8,
                    backgroundColor: getRemainingMessages() <= 3 ? "#FEF2F2" : "#FFFBEB",
                    border: `1px solid ${getRemainingMessages() <= 3 ? "#FECACA" : "#FDE68A"}`,
                  }}>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={getRemainingMessages() <= 3 ? "#DC2626" : "#D97706"}
                      strokeWidth="2"
                      style={{ flexShrink: 0 }}
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4M12 16h.01" />
                    </svg>
                    <span style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: getRemainingMessages() <= 3 ? "#DC2626" : "#92400E",
                      whiteSpace: "nowrap",
                      lineHeight: 1.4,
                    }}>
                      {`Танд ${getRemainingMessages()} асуулт асуух эрх үлдсэн байна`}
                    </span>
                  </div>
                )}
                ─────────────────────────────────────────────────────────── */}

                <div style={{ textAlign: "center", marginTop: 10, fontSize: 10, color: "#aaa", fontWeight: 500 }}>
                  hire.mn AI
                </div>
              </div>
              )}

              {/* TEMP: Usage Limit Popup disabled ───────────────────────── */}
              {/* {isUserLocked() && <UsageLimitPopup />} */}

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

              {/* NEW: AnalysisResults full dashboard (priority over legacy ArtifactView) */}
              {artifactMessageIdx !== null && messages[artifactMessageIdx]?.analysisData && (
                <AnalysisResults
                  data={messages[artifactMessageIdx].analysisData}
                  reportTitle={messages[artifactMessageIdx].analysisTitle || "Тест"}
                  onClose={() => setArtifactMessageIdx(null)}
                  onAskAI={(question) => {
                    setArtifactMessageIdx(null)
                    sendMessage(question)
                  }}
                />
              )}

              {/* Legacy Artifact Overlay - kept for backward compat */}
              {artifactMessageIdx !== null && !messages[artifactMessageIdx]?.analysisData && messages[artifactMessageIdx]?.insightCard && (
                <ArtifactView
                  message={messages[artifactMessageIdx]}
                  onClose={() => setArtifactMessageIdx(null)}
                  onAskFollowUp={askArtifactFollowUp}
                  askPending={followUpPending}
                  onToggleStep={toggleArtifactStep}
                  fontSize={fontSize}
                  renderFormattedText={(text: string) => {
                    // Lightweight markdown renderer for the artifact
                    return text.split("\n").map((line, idx) => {
                      const bolded = line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
                        part.startsWith("**") && part.endsWith("**")
                          ? <strong key={i} style={{ color: "#E8541A", fontWeight: 700 }}>{part.slice(2, -2)}</strong>
                          : <span key={i}>{part}</span>
                      )
                      if (line.trim() === "") return <div key={idx} style={{ height: 8 }} />
                      if (/^[-•]\s/.test(line)) {
                        return (
                          <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 4, paddingLeft: 4 }}>
                            <span style={{ color: "#E8541A", fontWeight: 700, flexShrink: 0 }}>•</span>
                            <span>{line.replace(/^[-•]\s/, "").split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
                              part.startsWith("**") && part.endsWith("**")
                                ? <strong key={i} style={{ color: "#E8541A", fontWeight: 700 }}>{part.slice(2, -2)}</strong>
                                : <span key={i}>{part}</span>
                            )}</span>
                          </div>
                        )
                      }
                      if (/^\d+\.\s/.test(line)) {
                        return (
                          <div key={idx} style={{ marginTop: idx > 0 ? 10 : 0, marginBottom: 4 }}>{bolded}</div>
                        )
                      }
                      return <div key={idx} style={{ marginBottom: 4 }}>{bolded}</div>
                    })
                  }}
                />
              )}

            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            FUTURISTIC FLOATING ACTION BUTTON
            ═══════════════════════���═�����═������══════════════════════════════════════════ */}
        {!isOpen && (
        <div style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "flex-end",
          // Extra padding so the 3D Spline mascot's overflow (~25px on each
          // side, plus the -4px bottom offset on the mascot itself) stays
          // inside the iframe and isn't clipped at the edges.
          paddingTop: 40,
          paddingBottom: 35,
          paddingLeft: 35,
          paddingRight: 20,
          width: "100%",
          height: "100%",
          boxSizing: "border-box",
        }}>
          {/* Animated ring effects */}
          <div style={{ position: "relative" }}>
            <div style={{
              position: "absolute", inset: -8, borderRadius: 30,
              background: "linear-gradient(135deg, rgba(232,84,26,0.2), rgba(255,140,66,0.15))",
              animation: "hw-ring 3s ease-out infinite",
            }} />
            <div style={{
              position: "absolute", inset: -3, borderRadius: 29,
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
                height: 58, 
                borderRadius: 29,
                /* Gradient with animation */
                background: `linear-gradient(135deg, #E8541A 0%, #F06835 50%, #FF8C42 100%)`,
                backgroundSize: "200% 200%",
                animation: isHovered ? "hw-gradient-shift 3s ease infinite" : "none",
                border: "1.5px solid rgba(255,255,255,0.25)",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                paddingLeft: 8, paddingRight: 18,
                flexShrink: 0, position: "relative",
                boxShadow: isHovered 
                  ? `0 12px 32px rgba(232,84,26,0.4), 
                     0 6px 12px rgba(0,0,0,0.08),
                     inset 0 1px 0 rgba(255,255,255,0.25)`
                  : `0 8px 24px rgba(232,84,26,0.3), 
                     0 3px 8px rgba(0,0,0,0.06),
                     inset 0 1px 0 rgba(255,255,255,0.15)`,
                transition: "all 0.3s cubic-bezier(.16,1,.3,1)",
                transform: isHovered ? "scale(1.04) translateY(-2px)" : "scale(1) translateY(0)",
                overflow: "visible",
              }}
            >
              {/* Shimmer overlay on hover */}
              <div style={{
                position: "absolute", inset: 0, overflow: "hidden", borderRadius: 29,
                zIndex: 0,
              }}>
                <div style={{
                  position: "absolute", top: 0, left: "-100%", width: "50%", height: "100%",
                  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)",
                  animation: isHovered ? "hw-shimmer 1.2s ease-in-out infinite" : "none",
                }} />
              </div>
              
              {/* White circular background — z-0, stays behind mascot */}
              <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: "rgba(255,255,255,0.97)",
                position: "absolute", 
                bottom: 4,
                left: 8,
                zIndex: 0,
                boxShadow: "0 4px 14px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.9)",
              }} />

              {/* Mascot — 1.5x the white circle, popping out from top */}
              <SplineMascot
                width={78}
                height={78}
                borderRadius={0}
                style={{
                  position: "absolute",
                  bottom: -4,
                  left: -6,
                  zIndex: 10,
                  overflow: "visible",
                  filter: "drop-shadow(0 10px 10px rgba(0,0,0,0.2))",
                  transition: "transform 0.3s cubic-bezier(.16,1,.3,1)",
                  transform: isHovered ? "translateY(-6px) scale(1.06)" : "translateY(0) scale(1)",
                }}
              />
              
              <span style={{
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
                textShadow: "0 1px 3px rgba(0,0,0,0.2)",
                letterSpacing: "-0.3px",
                position: "relative", 
                zIndex: 1,
                marginLeft: 8,
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
