"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"

type TestType = 'profile' | 'cognitive' | 'screening' | 'aptitude' | 'generic'

// ── Dynamic section model — the AI's presentation plan ──────────────────────
// Each section carries presentation intent: layout, priority, tone, expansion.
// The renderer adapts automatically; new section kinds need no code changes.
type SectionLayout = 'hero' | 'cards' | 'quotes' | 'bars' | 'radar' | 'timeline' | 'checklist' | 'list' | 'grid' | 'carousel'
type SectionTone = 'positive' | 'warning' | 'neutral' | 'info'

interface SectionItem {
  emoji?: string
  title?: string
  text?: string
  detail?: string   // carousel — long-form explanation (2-3 sentences)
  tip?: string      // carousel — actionable one-line tip
  tone?: SectionTone // carousel — per-card colour coding
  meta?: string
  pct?: number   // bars only — injected server-side from real dimensions
}

interface Section {
  chapter?: string   // AI-assigned chapter name — sections group into pages
  kind: string
  layout: SectionLayout
  priority: 'critical' | 'high' | 'normal' | 'low'
  tone: SectionTone
  expanded: boolean
  emoji: string
  title: string
  body: string
  items: SectionItem[]
}

interface AnalysisData {
  testType?: TestType               // Drives section visibility & framing
  scoreDirection?: 'high-good' | 'low-good' | 'profile'  // Score semantics
  outcomeQuality?: 'positive' | 'neutral' | 'concerning' // Outcome judgment
  sections?: Section[]              // AI presentation plan (journey mode)
  opening?: string                  // Personal narrative opener
  healthScore: number               // 0-100 WELLBEING percentage (NOT raw % — already inverted for low-good tests)
  displayScore?: number             // Raw test score (e.g. 5)
  displayMaxScore?: number          // Raw test max (e.g. 10)
  displayLabel?: string             // Verbatim label from test report
  isProfile?: boolean               // Profile test → show dominant-type hero, not a score ring
  dominantLabel?: string            // Profile: top dimension name (e.g. "Сэтгэгч")
  dominantScore?: number            // Profile: top dimension raw score
  secondaryLabel?: string           // Profile: 2nd dimension name
  dimensions?: Array<{ label: string; score: number; maxScore: number; pct: number }>  // Multi-dim tests (DISC etc.)
  riskLevel: string
  quitPotential: string
  testCategory?: string
  summary: { title: string; description: string }
  highlightTitle?: string
  highlightMessage?: string
  metrics: Array<{ label: string; score: number; maxScore: number; status: string }>
  strengths: string[]
  risks: string[]
  insights: Array<{ emoji: string; title: string; description: string; detail: string; actions: string[] }>
  roadmap: Array<{ week: string; title: string; tasks: string[] }>
  todayGoals?: string[]
  kpiLabels?: { metric1Label?: string; riskLabel?: string; potentialLabel?: string }
  statCards?: Array<{ icon: string; label: string; value: string; sub: string }>
}

interface Props {
  data: AnalysisData
  reportTitle: string
  onClose: () => void
  onAskAI: (question: string) => void
}

const TEAL = "#00C48C"
const BRAND = "#E8541A"
const scoreColor = (s: number) => s >= 70 ? TEAL : s >= 40 ? "#FF9800" : "#FF4444"
const riskColor = (r: string) => r === "Low" ? TEAL : r === "Medium" ? "#FF9800" : "#FF4444"
const potColor = (p: string) => p === "High" ? TEAL : p === "Medium" ? "#FF9800" : "#FF4444"

// Character images
const CHARS = {
  thumbsup: "/images/char-thumbsup.png",
  thinking: "/images/char-thinking.png",
  ok: "/images/char-ok.png",
  phone: "/images/char-phone.png",
  celebrate: "/images/char-celebrate.png",
}

function Char({ type, size = 80, style }: { type: keyof typeof CHARS; size?: number; style?: React.CSSProperties }) {
  return (
    <img
      src={CHARS[type]}
      alt={type}
      style={{ width: size, height: "auto", objectFit: "contain", ...style }}
    />
  )
}

// Score Ring — defaults to /100 percentage, override with `display` to show raw score (5/10)
function ScoreRing({
  score,
  size = 120,
  display,
}: {
  score: number
  size?: number
  display?: { score: number; max: number }
}) {
  const targetNum = display ? display.score : Math.min(Math.max(score, 0), 100)
  const targetDen = display ? display.max : 100
  const [disp, setDisp] = useState(0)
  const [off, setOff] = useState(0)
  const r = size * 0.37, circ = 2 * Math.PI * r
  const color = scoreColor(score)
  useEffect(() => {
    const dur = 1600, st = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - st) / dur, 1)
      const e = 1 - Math.pow(1 - p, 3)
      setDisp(Math.round(e * targetNum))
      setOff(circ - e * (Math.min(score, 100) / 100) * circ)
      if (p < 1) requestAnimationFrame(tick)
    }
    setTimeout(() => requestAnimationFrame(tick), 200)
  }, [score, targetNum, circ])
  // Adjust number size based on digit count
  const numStr = String(disp)
  const numSize = size * (numStr.length >= 3 ? 0.24 : 0.3)
  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <defs>
          <linearGradient id="sg" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={`${color}88`} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`${color}18`} strokeWidth={size * 0.07} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#sg)"
          strokeWidth={size * 0.07} strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: numSize, fontWeight: 900, color: "#1E293B", lineHeight: 1 }}>{disp}</span>
        <span style={{ fontSize: size * 0.1, color: "#94A3B8", fontWeight: 600 }}>/{targetDen}</span>
      </div>
    </div>
  )
}

// ── Premium List-Detail Sheet (all strengths/risks/tips) ────────────────────

function ListDetailSheet({
  data,
  onClose,
  onAskAI,
}: {
  data: null | { kind: string; title: string; items: string[]; color: string; bg: string; soft: string; grad: string; emoji: string }
  onClose: () => void
  onAskAI: (q: string) => void
}) {
  const [vis, setVis] = useState(false)
  useEffect(() => { if (data) setTimeout(() => setVis(true), 10); else setVis(false) }, [data])
  if (!data) return null
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0,
      background: `rgba(15,23,42,${vis ? 0.55 : 0})`,
      zIndex: 250, display: "flex", alignItems: "flex-end",
      transition: "background 0.28s",
      backdropFilter: "blur(6px)",
      WebkitBackdropFilter: "blur(6px)",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", background: "#fff",
        borderRadius: "28px 28px 0 0",
        transform: vis ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.42s cubic-bezier(.16,1,.3,1)",
        maxHeight: "88vh", overflowY: "auto",
        display: "flex", flexDirection: "column",
      }}>
        {/* Drag handle */}
        <div style={{ padding: "10px 0 0", display: "flex", justifyContent: "center", flexShrink: 0 }}>
          <div style={{ width: 42, height: 5, background: "#CBD5E1", borderRadius: 3 }}/>
        </div>

        {/* Gradient hero header */}
        <div style={{
          background: data.bg,
          padding: "20px 22px 18px",
          position: "relative", overflow: "hidden",
          flexShrink: 0,
        }}>
          <div style={{
            position: "absolute", top: -20, right: -20,
            fontSize: 120, opacity: 0.18, lineHeight: 1,
          }}>{data.emoji}</div>
          <div style={{ position: "relative" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "#fff", color: data.color,
              padding: "4px 12px", borderRadius: 999,
              fontSize: 9, fontWeight: 800, letterSpacing: 0.8,
              textTransform: "uppercase", marginBottom: 10,
              border: `1px solid ${data.soft}`,
              boxShadow: `0 4px 10px ${data.color}22`,
            }}>
              <span style={{ fontSize: 12 }}>{data.emoji}</span>
              {data.items.length} зүйл
            </div>
            <h2 style={{
              fontSize: 24, fontWeight: 900, color: "#0F172A",
              margin: "0 0 6px", letterSpacing: -0.5, lineHeight: 1.15,
            }}>{data.title}</h2>
            <p style={{
              fontSize: 12, color: "#475569", lineHeight: 1.5, margin: 0,
            }}>
              {data.kind === "strengths"
                ? "Танд илрэх давуу талуудыг ашиглан үр дүнгээ улам сайжруулна уу."
                : data.kind === "risks"
                ? "Эдгээрийг анхаарч, эрсдэлийг бууруулах арга хэмжээ авна уу."
                : "Эдгээр зөвлөмжийг өдөр тутамдаа хэрэгжүүлээрэй."}
            </p>
          </div>
        </div>

        {/* Items list (with title:detail parsing) */}
        <div style={{ padding: "16px 18px 14px", flex: 1 }}>
          {data.items.map((rawItem, i) => {
            const item = String(rawItem || "")
            const split = item.match(/^([^:：]+)[:：]\s*(.+)$/)
            const itemTitle = split ? split[1].trim() : null
            const itemBody = split ? split[2].trim() : item
            return (
              <div key={i} style={{
                background: "#fff",
                border: `1.5px solid ${data.soft}`,
                borderRadius: 16, padding: "14px 16px",
                marginBottom: 10,
                position: "relative",
                animation: `ci 0.35s cubic-bezier(.16,1,.3,1) ${i * 0.06}s both`,
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}>
                <div style={{
                  display: "flex", alignItems: "flex-start", gap: 12,
                }}>
                  {/* Numbered badge */}
                  <div style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: data.grad,
                    color: "#fff", fontSize: 13, fontWeight: 900,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: `0 4px 10px ${data.color}33`,
                  }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {itemTitle && (
                      <div style={{
                        fontSize: 13, fontWeight: 800, color: "#0F172A",
                        marginBottom: 4, lineHeight: 1.3,
                      }}>{itemTitle}</div>
                    )}
                    <div style={{
                      fontSize: 12.5, color: itemTitle ? "#475569" : "#1F2937",
                      lineHeight: 1.6,
                    }}>{itemBody}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA footer */}
        <div style={{
          padding: "8px 18px 24px", flexShrink: 0,
          borderTop: "1px solid #F1F5F9",
          background: "#fff",
        }}>
          <button onClick={() => {
            onAskAI(`"${data.title}" хэсгийн талаар илүү дэлгэрэнгүй мэргэжлийн тайлбар өгөөч`)
            onClose()
          }} style={{
            width: "100%", padding: "13px",
            background: data.grad, color: "#fff",
            border: "none", borderRadius: 14,
            fontSize: 13, fontWeight: 800, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: `0 6px 18px ${data.color}44`,
            fontFamily: "inherit",
            marginTop: 10,
          }}>
            ✨ AI-аас илүү дэлгэрэнгүй авах
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// Bottom Sheet — premium insight detail (AI-generated professional explanation)
function Sheet({ insight, onClose, onAskAI }: {
  insight: AnalysisData["insights"][0] | null
  onClose: () => void
  onAskAI?: (q: string) => void
}) {
  const [vis, setVis] = useState(false)
  const [checkedActions, setCheckedActions] = useState<Set<number>>(new Set())
  useEffect(() => {
    if (insight) { setTimeout(() => setVis(true), 10); setCheckedActions(new Set()) }
    else setVis(false)
  }, [insight])
  if (!insight) return null

  const toggleAction = (i: number) => {
    setCheckedActions(prev => {
      const n = new Set(prev)
      if (n.has(i)) n.delete(i)
      else n.add(i)
      return n
    })
  }
  const doneCount = checkedActions.size
  const totalActions = insight.actions?.length || 0
  const progressPct = totalActions > 0 ? (doneCount / totalActions) * 100 : 0

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0,
      background: `rgba(15,23,42,${vis ? 0.55 : 0})`,
      zIndex: 200, display: "flex", alignItems: "flex-end",
      transition: "background 0.28s",
      backdropFilter: "blur(6px)",
      WebkitBackdropFilter: "blur(6px)",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", background: "#fff",
        borderRadius: "28px 28px 0 0",
        transform: vis ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.42s cubic-bezier(.16,1,.3,1)",
        maxHeight: "88vh", overflowY: "auto",
        display: "flex", flexDirection: "column",
      }}>
        {/* Drag handle */}
        <div style={{ padding: "10px 0 0", display: "flex", justifyContent: "center", flexShrink: 0 }}>
          <div style={{ width: 42, height: 5, background: "#CBD5E1", borderRadius: 3 }}/>
        </div>

        {/* Gradient hero */}
        <div style={{
          background: "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)",
          padding: "20px 22px 18px",
          position: "relative", overflow: "hidden",
          flexShrink: 0,
        }}>
          <div style={{
            position: "absolute", top: -10, right: -10,
            fontSize: 100, opacity: 0.2, lineHeight: 1,
          }}>{insight.emoji}</div>
          <div style={{ position: "relative" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "#fff", color: TEAL,
              padding: "4px 12px", borderRadius: 999,
              fontSize: 9, fontWeight: 800, letterSpacing: 0.8,
              textTransform: "uppercase", marginBottom: 10,
              border: "1px solid #BBF7D0",
              boxShadow: "0 4px 10px rgba(0,196,140,0.15)",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: TEAL, boxShadow: `0 0 8px ${TEAL}` }}/>
              AI Insight
            </div>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{
                width: 56, height: 56, borderRadius: 18,
                background: "#fff", fontSize: 28,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "1.5px solid #BBF7D0", flexShrink: 0,
                boxShadow: "0 6px 16px rgba(0,196,140,0.2)",
              }}>{insight.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{
                  fontSize: 19, fontWeight: 900, color: "#064E3B",
                  margin: "0 0 4px", lineHeight: 1.25, letterSpacing: -0.3,
                }}>{insight.title}</h3>
                <p style={{
                  fontSize: 12, color: "#065F46", margin: 0, lineHeight: 1.5,
                }}>{insight.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Why important */}
        <div style={{ padding: "16px 20px 0" }}>
          <div style={{
            background: "linear-gradient(135deg, #F8FAFF, #FFFFFF)",
            borderRadius: 16, padding: "16px",
            border: "1.5px solid #E2E8F0",
            marginBottom: 16,
            position: "relative",
          }}>
            <div style={{
              position: "absolute", top: -10, left: 14,
              background: "#fff",
              padding: "2px 10px", borderRadius: 999,
              border: "1.5px solid #E2E8F0",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <span style={{ fontSize: 11 }}>💡</span>
              <span style={{ fontSize: 9, fontWeight: 800, color: "#475569", letterSpacing: 0.6, textTransform: "uppercase" }}>
                Яагаад чухал вэ
              </span>
            </div>
            <p style={{
              fontSize: 13.5, color: "#334155", lineHeight: 1.7,
              margin: "6px 0 0", fontWeight: 500,
            }}>{insight.detail}</p>
          </div>

          {/* Progress bar (if actions exist) */}
          {totalActions > 0 && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 8, padding: "0 2px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14 }}>📋</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#475569", letterSpacing: 0.6, textTransform: "uppercase" }}>
                  Хийж болох алхмууд
                </span>
              </div>
              <div style={{
                background: doneCount > 0 ? "#F0FDF4" : "#F1F5F9",
                color: doneCount > 0 ? TEAL : "#94A3B8",
                fontSize: 10, fontWeight: 800,
                padding: "3px 10px", borderRadius: 999,
                border: `1px solid ${doneCount > 0 ? "#BBF7D0" : "#E2E8F0"}`,
              }}>{doneCount}/{totalActions}</div>
            </div>
          )}

          {/* Progress bar visual */}
          {totalActions > 0 && (
            <div style={{
              background: "#F1F5F9", borderRadius: 8, height: 5,
              marginBottom: 10, overflow: "hidden",
            }}>
              <div style={{
                height: "100%", borderRadius: 8,
                width: `${progressPct}%`,
                background: `linear-gradient(90deg, ${TEAL}, #00E5A0)`,
                transition: "width 0.4s ease",
                boxShadow: doneCount > 0 ? `0 0 8px ${TEAL}55` : "none",
              }}/>
            </div>
          )}

          {/* Action checklist */}
          {insight.actions?.map((a, i) => {
            const isDone = checkedActions.has(i)
            return (
              <div key={i} onClick={() => toggleAction(i)} style={{
                display: "flex", gap: 12, marginBottom: 8,
                padding: "12px 14px",
                background: isDone ? "#F0FDF4" : "#fff",
                border: `1.5px solid ${isDone ? TEAL + "40" : "#E2E8F0"}`,
                borderRadius: 14, cursor: "pointer",
                alignItems: "flex-start",
                transition: "all 0.2s",
                animation: `ci 0.3s ease ${i * 0.05}s both`,
                userSelect: "none",
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: isDone ? TEAL : "#fff",
                  border: `2px solid ${isDone ? TEAL : "#CBD5E1"}`,
                  flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  marginTop: 1,
                  transition: "all 0.2s",
                }}>
                  {isDone && (
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 8l4 4 6-7"/>
                    </svg>
                  )}
                </div>
                <span style={{
                  fontSize: 13, color: isDone ? "#059669" : "#374151",
                  lineHeight: 1.6, fontWeight: isDone ? 600 : 500,
                  textDecoration: isDone ? "line-through" : "none",
                  flex: 1,
                  opacity: isDone ? 0.85 : 1,
                  transition: "all 0.2s",
                }}>{a}</span>
              </div>
            )
          })}
        </div>

        {/* Footer CTA */}
        <div style={{
          padding: "10px 20px 24px", flexShrink: 0,
          borderTop: "1px solid #F1F5F9",
          marginTop: 12,
          display: "flex", gap: 8,
        }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "13px",
            background: "#F1F5F9", color: "#475569",
            border: "none", borderRadius: 14,
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            fontFamily: "inherit",
          }}>Хаах</button>
          <button onClick={() => {
            onAskAI?.(`"${insight.title}" талаар илүү гүн мэргэжлийн зөвлөгөө өгөөч`)
            onClose()
          }} style={{
            flex: 2, padding: "13px",
            background: `linear-gradient(135deg, ${TEAL}, #00A876)`,
            color: "#fff", border: "none", borderRadius: 14,
            fontSize: 13, fontWeight: 800, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            boxShadow: `0 6px 18px ${TEAL}44`,
            fontFamily: "inherit",
          }}>
            ✨ AI-аас илүү асуу
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Loading card (animated progress while AI analyzes) ─────────────────────
export function AnalysisLoadingCard({ title }: { title: string }) {
  const [step, setStep] = useState(0)
  const [progress, setProgress] = useState(8)

  const steps = [
    { label: "Тестийн өгөгдөл боловсруулж байна", emoji: "📊" },
    { label: "AI шинжилгээ хийж байна", emoji: "🧠" },
    { label: "Зөвлөмж бэлдэж байна", emoji: "✨" },
    { label: "Тайланг эмхэтгэж байна", emoji: "📋" },
  ]

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setStep(s => Math.min(s + 1, steps.length - 1))
    }, 2500)
    const progTimer = setInterval(() => {
      // Asymptotic toward 92% so the bar never falsely completes
      setProgress(p => Math.min(92, p + (92 - p) * 0.06))
    }, 200)
    return () => { clearInterval(stepTimer); clearInterval(progTimer) }
  }, [])

  return (
    <div style={{
      background: "#fff",
      borderRadius: 20, padding: "18px 16px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,196,140,0.15)",
      maxWidth: "100%",
      position: "relative", overflow: "hidden",
    }}>
      {/* Top: AI badge + title */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 12,
          background: `linear-gradient(135deg, ${TEAL}, #00A876)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 4px 12px ${TEAL}55`, flexShrink: 0,
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(180deg, rgba(255,255,255,0.3), transparent)",
          }}/>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" style={{ position: "relative", animation: "ar-spin 2s linear infinite" }}>
            <path d="M12 2l1.4 4.3L17.7 8l-4.3 1.4L12 14l-1.4-4.6L6.3 8l4.3-1.7z"/>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: TEAL, boxShadow: `0 0 6px ${TEAL}`, animation: "ar-pulse 1.6s ease-in-out infinite" }}/>
            <span style={{ fontSize: 9, fontWeight: 800, color: TEAL, letterSpacing: 0.6 }}>AI ШИНЖИЛЖ БАЙНА</span>
          </div>
          <p style={{ fontSize: 13, fontWeight: 800, color: "#1E293B", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {title}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 14 }}>
        <div style={{
          background: "#F1F5F9", borderRadius: 8, height: 8, overflow: "hidden",
          position: "relative",
        }}>
          <div style={{
            height: "100%", borderRadius: 8,
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${TEAL}, #00E5A0)`,
            transition: "width 0.4s ease",
            boxShadow: `0 0 10px ${TEAL}66`,
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
              backgroundSize: "200% 100%",
              animation: "ar-shimmer 1.6s linear infinite",
            }}/>
          </div>
        </div>
        <div style={{
          display: "flex", justifyContent: "space-between",
          marginTop: 5, fontSize: 9, color: "#94A3B8", fontWeight: 700,
        }}>
          <span>Шинжилгээ үргэлжилж байна...</span>
          <span style={{ color: TEAL }}>{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Step list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {steps.map((s, i) => {
          const isDone = i < step
          const isActive = i === step
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "6px 10px",
              background: isActive ? "#F0FDF4" : "transparent",
              borderRadius: 10, transition: "all 0.3s",
              opacity: isDone || isActive ? 1 : 0.4,
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%",
                background: isDone ? TEAL : isActive ? "#fff" : "#F1F5F9",
                border: isActive ? `2px solid ${TEAL}` : "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                boxShadow: isActive ? `0 0 0 4px ${TEAL}22` : "none",
                animation: isActive ? "ar-pulse 1.6s ease-in-out infinite" : undefined,
              }}>
                {isDone ? (
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 8l4 4 6-7"/>
                  </svg>
                ) : isActive ? (
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: TEAL }}/>
                ) : null}
              </div>
              <span style={{
                fontSize: 11.5, fontWeight: isActive ? 700 : 600,
                color: isDone ? "#059669" : isActive ? "#1E293B" : "#94A3B8",
                flex: 1,
              }}>
                <span style={{ marginRight: 4 }}>{s.emoji}</span>{s.label}
              </span>
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes ar-spin { to { transform: rotate(360deg) } }
        @keyframes ar-pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }
        @keyframes ar-shimmer { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }
      `}</style>
    </div>
  )
}

// ── Compact card ─────────────────────────────────────────────────────────────
export function AnalysisCard({ data, title, onExpand }: { data: AnalysisData; title: string; onExpand: () => void }) {
  const [hov, setHov] = useState(false)
  const [bar, setBar] = useState(false)
  const [scoreDisp, setScoreDisp] = useState(0)
  const color = scoreColor(data.healthScore)
  const circ = 2 * Math.PI * 28
  const [off, setOff] = useState(circ)
  // Use raw display score if available (e.g. 5 of 10), else fallback to percentage
  const displayTarget = data.displayScore != null ? data.displayScore : data.healthScore
  const displayMax = data.displayMaxScore || 100
  useEffect(() => {
    setTimeout(() => setBar(true), 400)
    const end = displayTarget, dur = 1400, st = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - st) / dur, 1)
      const e = 1 - Math.pow(1 - p, 3)
      setScoreDisp(Math.round(e * end))
      setOff(circ - e * (Math.min(data.healthScore, 100) / 100) * circ)
      if (p < 1) requestAnimationFrame(tick)
    }
    setTimeout(() => requestAnimationFrame(tick), 350)
  }, [data.healthScore, displayTarget, circ])
  const kpi = data.kpiLabels || {}
  const charType: keyof typeof CHARS = data.healthScore >= 75 ? "ok" : data.healthScore >= 50 ? "thumbsup" : "thinking"
  return (
    <div onClick={onExpand} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ background: "#fff", borderRadius: 20, overflow: "hidden", cursor: "pointer", boxShadow: hov ? "0 16px 48px rgba(0,0,0,0.13), 0 0 0 2px rgba(0,196,140,0.3)" : "0 4px 20px rgba(0,0,0,0.08)", transform: hov ? "translateY(-3px)" : "translateY(0)", transition: "all 0.25s cubic-bezier(.16,1,.3,1)" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #E8FFF6, #D0F7EB)", borderBottom: "1px solid #B2F5E3", padding: "16px 16px 12px", display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ position: "relative", width: 68, height: 68, flexShrink: 0 }}>
          <svg width="68" height="68" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="34" cy="34" r="28" fill="none" stroke={`${color}25`} strokeWidth="6" />
            <circle cx="34" cy="34" r="28" fill="none" stroke={color} strokeWidth="6" strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: "#1E293B", lineHeight: 1 }}>{scoreDisp}</span>
            <span style={{ fontSize: 8, color: "#94A3B8" }}>/{displayMax}</span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: TEAL, letterSpacing: "0.5px", margin: "0 0 3px" }}>💙 AI ШИНЖИЛГЭЭ</p>
          <p style={{ fontSize: 14, fontWeight: 800, color: "#1E293B", margin: "0 0 5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</p>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: `${color}18`, borderRadius: 20, padding: "3px 10px", border: `1px solid ${color}30` }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, display: "inline-block" }} />
            <span style={{ color, fontSize: 11, fontWeight: 700 }}>{data.summary.title}</span>
          </span>
        </div>
        <Char type={charType} size={64} style={{ flexShrink: 0 }} />
      </div>
      {/* KPIs */}
      <div style={{ display: "flex", borderBottom: "1px solid #F1F5F9" }}>
        {[
          { label: kpi.metric1Label || "Хамаарал", value: data.metrics[0] ? `${data.metrics[0].score}/${data.metrics[0].maxScore}` : "—", color: BRAND },
          { label: kpi.riskLabel || "Эрсдэл", value: data.riskLevel === "Low" ? "Бага" : data.riskLevel === "Medium" ? "Дунд" : "Өндөр", color: riskColor(data.riskLevel) },
          { label: kpi.potentialLabel || "Боломж", value: data.quitPotential === "High" ? "Өндөр" : data.quitPotential === "Medium" ? "Дунд" : "Бага", color: potColor(data.quitPotential) },
        ].map((k, i) => (
          <div key={i} style={{ flex: 1, padding: "10px 6px", textAlign: "center", borderRight: i < 2 ? "1px solid #F1F5F9" : "none" }}>
            <p style={{ fontSize: 8, color: "#94A3B8", fontWeight: 700, margin: "0 0 2px", letterSpacing: "0.3px" }}>{k.label.toUpperCase()}</p>
            <p style={{ fontSize: 15, fontWeight: 900, color: k.color, margin: 0 }}>{k.value}</p>
          </div>
        ))}
      </div>
      {/* Metrics */}
      <div style={{ padding: "12px 16px 8px" }}>
        {data.metrics.slice(0, 2).map((m, i) => (
          <div key={i} style={{ marginBottom: 9 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#475569" }}>{m.label}</span>
              <span style={{ fontSize: 10, color: "#94A3B8" }}>{m.score}/{m.maxScore}</span>
            </div>
            <div style={{ background: "#F1F5F9", borderRadius: 8, height: 7, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 8, width: bar ? `${(m.score / m.maxScore) * 100}%` : "0%", background: m.score / m.maxScore > 0.6 ? "linear-gradient(90deg,#FF4444,#FF6B6B)" : m.score / m.maxScore > 0.3 ? "linear-gradient(90deg,#FF9800,#FFCC44)" : `linear-gradient(90deg,${TEAL},#00E5A0)`, transition: "width 1.1s cubic-bezier(.16,1,.3,1)" }} />
            </div>
          </div>
        ))}
      </div>
      {/* Insight pills */}
      <div style={{ display: "flex", gap: 6, padding: "0 14px 12px" }}>
        {data.insights?.slice(0, 3).map((ins, i) => (
          <div key={i} style={{ flex: 1, background: "#F8FAFF", borderRadius: 10, padding: "7px 6px", textAlign: "center", border: "1px solid #E2E8F0" }}>
            <div style={{ fontSize: 16 }}>{ins.emoji}</div>
            <p style={{ fontSize: 9, fontWeight: 600, color: "#64748B", margin: "3px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ins.title}</p>
          </div>
        ))}
      </div>
      {/* CTA */}
      <div style={{ padding: "0 14px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: `linear-gradient(135deg, ${TEAL}, #00A876)`, borderRadius: 14, padding: "13px", boxShadow: `0 6px 20px ${TEAL}40`, transform: hov ? "scale(1.02)" : "scale(1)", transition: "transform 0.2s" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 800 }}>Дэлгэрэнгүй шинжилгээ харах</span>
        </div>
      </div>
    </div>
  )
}

// ── Dynamic Journey renderer ─────────────────────────────────────────────────
// Renders the AI's presentation plan (sections[]) as a guided single-scroll
// narrative. Layout, order, emphasis and tone all come from the AI — adding a
// new assessment type requires zero changes here.

const TONE_THEME: Record<SectionTone, { main: string; bg: string; border: string; text: string; soft: string }> = {
  positive: { main: "#00C48C", bg: "#F0FDF4", border: "#BBF7D0", text: "#065F46", soft: "#DCFCE7" },
  warning:  { main: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", text: "#92400E", soft: "#FEF3C7" },
  info:     { main: "#3B82F6", bg: "#EFF6FF", border: "#BFDBFE", text: "#1E40AF", soft: "#DBEAFE" },
  neutral:  { main: "#64748B", bg: "#F8FAFC", border: "#E2E8F0", text: "#334155", soft: "#F1F5F9" },
}

// Fallback chapter names when the AI didn't assign them — derived from layout semantics
function fallbackChapter(layout: SectionLayout): string {
  if (layout === 'hero' || layout === 'bars') return 'Тойм'
  if (layout === 'quotes') return 'Нотолгоо'
  if (layout === 'timeline' || layout === 'checklist') return 'Төлөвлөгөө'
  return 'Дүн шинжилгээ'
}

// ── Radar / spider chart — dimension map (Belbin, DISC, sleep, burnout...) ───
// Wrap a long Mongolian label into up to 2 lines for tidy axis labels.
function wrapLabel(s: string, max = 12): string[] {
  const words = (s || '').split(' ')
  if ((s || '').length <= max) return [s]
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max && cur) { lines.push(cur.trim()); cur = w }
    else cur = (cur + ' ' + w).trim()
  }
  if (cur) lines.push(cur.trim())
  return lines.slice(0, 2).map((l, i, a) => i === 1 && lines.length > 2 ? l + '…' : l)
}

function RadarChart({ items, color }: { items: SectionItem[]; color: string }) {
  const data = items.filter(it => it.title)
  const n = data.length
  const [drawn, setDrawn] = useState(false)
  useEffect(() => { const t = setTimeout(() => setDrawn(true), 120); return () => clearTimeout(t) }, [])
  if (n < 3) return null

  const W = 340, H = 300, cx = W / 2, cy = H / 2, R = 88
  const ang = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2
  const pt = (i: number, r: number) => [cx + Math.cos(ang(i)) * r, cy + Math.sin(ang(i)) * r]
  const rings = [0.25, 0.5, 0.75, 1]
  const dataPts = data.map((it, i) => pt(i, R * (Math.max(0, Math.min(100, it.pct ?? 0)) / 100)))
  const polyStr = dataPts.map(p => p.join(',')).join(' ')
  const gid = `radg-${Math.round(R)}-${n}`

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: 360, overflow: "visible" }}>
        <defs>
          <radialGradient id={gid} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.45" />
            <stop offset="100%" stopColor={color} stopOpacity="0.12" />
          </radialGradient>
        </defs>
        {/* Grid rings (subtle filled) */}
        {rings.slice().reverse().map((rr, ri) => (
          <polygon key={ri}
            points={data.map((_, i) => pt(i, R * rr).join(',')).join(' ')}
            fill={ri === 0 ? "#F8FAFC" : "none"}
            stroke="#E5E9F0" strokeWidth={1} />
        ))}
        {/* Axes */}
        {data.map((_, i) => {
          const [x, y] = pt(i, R)
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#EAEEF4" strokeWidth={1} />
        })}
        {/* Data polygon */}
        <polygon points={polyStr}
          fill={`url(#${gid})`} stroke={color} strokeWidth={2.5} strokeLinejoin="round"
          style={{ opacity: drawn ? 1 : 0, transform: drawn ? "scale(1)" : "scale(0.2)", transformOrigin: `${cx}px ${cy}px`, transition: "all 0.8s cubic-bezier(.16,1,.3,1)" }} />
        {/* Vertices with halo */}
        {dataPts.map((p, i) => (
          <g key={i} style={{ opacity: drawn ? 1 : 0, transition: `opacity 0.4s ease ${0.5 + i * 0.06}s` }}>
            <circle cx={p[0]} cy={p[1]} r={5} fill="#fff" stroke={color} strokeWidth={2.5} />
            {i === 0 && <circle cx={p[0]} cy={p[1]} r={9} fill="none" stroke={color} strokeWidth={1} opacity={0.4} />}
          </g>
        ))}
        {/* Axis labels — wrapped to 2 lines, dominant highlighted */}
        {data.map((it, i) => {
          const [lx, ly] = pt(i, R + 18)
          const a = ang(i)
          const cos = Math.cos(a)
          const anchor = Math.abs(cos) < 0.35 ? "middle" : cos > 0 ? "start" : "end"
          const isTop = i === 0
          const lines = wrapLabel(it.title || '', 13)
          return (
            <text key={i} x={lx} y={ly - (lines.length - 1) * 5} textAnchor={anchor as any}
              fontSize={9.5} fontWeight={isTop ? 800 : 600} fill={isTop ? color : "#64748B"}>
              {lines.map((ln, li) => <tspan key={li} x={lx} dy={li === 0 ? 0 : 11}>{ln}</tspan>)}
            </text>
          )
        })}
      </svg>
      {/* Ranked legend with mini bars */}
      <div style={{ width: "100%", marginTop: 6 }}>
        {data.slice(0, 8).map((it, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 0", borderBottom: i < Math.min(data.length, 8) - 1 ? "1px solid #F4F6FB" : "none" }}>
            <span style={{ width: 19, height: 19, borderRadius: 7, background: i === 0 ? color : "#F1F5F9", color: i === 0 ? "#fff" : "#94A3B8", fontSize: 9.5, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
            <span style={{ flex: 1, fontSize: 12, fontWeight: i === 0 ? 800 : 600, color: i === 0 ? "#1E293B" : "#475569", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.title}</span>
            <div style={{ width: 46, height: 5, borderRadius: 4, background: "#F1F5F9", overflow: "hidden", flexShrink: 0 }}>
              <div style={{ height: "100%", width: `${Math.min(it.pct ?? 0, 100)}%`, background: i === 0 ? color : "#CBD5E1", borderRadius: 4 }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, color: i === 0 ? color : "#94A3B8", flexShrink: 0, minWidth: 34, textAlign: "right" }}>{it.meta}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Premium swipeable advice carousel ───────────────────────────────────────
// Big full-width cards: strengths / weaknesses / detailed advice. Each card is
// tone-colored, with a header badge, emoji, title, long detail and a tip strip.
function AdviceCarousel({ items, onAskAI }: { items: SectionItem[]; onAskAI: (q: string) => void }) {
  const [idx, setIdx] = useState(0)
  const touchX = useRef(0)
  const n = items.length
  const go = (i: number) => setIdx(Math.max(0, Math.min(n - 1, i)))
  const onTS = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX }
  const onTE = (e: React.TouchEvent) => {
    const d = touchX.current - e.changedTouches[0].clientX
    if (Math.abs(d) > 40) go(idx + (d > 0 ? 1 : -1))
  }
  if (!n) return null

  const tones: Record<string, { main: string; bg: string; soft: string; text: string; ring: string }> = {
    positive: { main: "#00C48C", bg: "linear-gradient(160deg,#F0FDF4,#DCFCE7)", soft: "#DCFCE7", text: "#065F46", ring: "#BBF7D0" },
    warning:  { main: "#F59E0B", bg: "linear-gradient(160deg,#FFFBEB,#FEF3C7)", soft: "#FEF3C7", text: "#92400E", ring: "#FDE68A" },
    info:     { main: "#3B82F6", bg: "linear-gradient(160deg,#EFF6FF,#DBEAFE)", soft: "#DBEAFE", text: "#1E40AF", ring: "#BFDBFE" },
    neutral:  { main: "#64748B", bg: "linear-gradient(160deg,#F8FAFC,#F1F5F9)", soft: "#F1F5F9", text: "#334155", ring: "#E2E8F0" },
  }

  return (
    <div>
      {/* Swipeable card viewport */}
      <div style={{ overflow: "hidden", borderRadius: 20 }} onTouchStart={onTS} onTouchEnd={onTE}>
        <div style={{ display: "flex", transform: `translateX(-${idx * 100}%)`, transition: "transform 0.4s cubic-bezier(.16,1,.3,1)" }}>
          {items.map((it, i) => {
            const tk = tones[it.tone || "neutral"] || tones.neutral
            return (
              <div key={i} style={{ minWidth: "100%", boxSizing: "border-box" }}>
                <div style={{
                  background: tk.bg, border: `1.5px solid ${tk.ring}`, borderRadius: 20,
                  padding: "16px", minHeight: 188, display: "flex", flexDirection: "column",
                }}>
                  {/* Badge row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                      background: tk.main, display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 22, boxShadow: `0 4px 14px ${tk.main}55`,
                    }}>{it.emoji || "✨"}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {it.meta && <span style={{ display: "inline-block", background: tk.main, color: "#fff", fontSize: 9.5, fontWeight: 800, padding: "3px 9px", borderRadius: 20, letterSpacing: 0.3, marginBottom: 3 }}>{it.meta}</span>}
                      <p style={{ fontSize: 14.5, fontWeight: 900, color: tk.text, margin: 0, lineHeight: 1.25 }}>{it.title}</p>
                    </div>
                  </div>
                  {/* Detail */}
                  {it.detail && <p style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.6, margin: 0, flex: 1 }}>{it.detail}</p>}
                  {/* Tip strip */}
                  {it.tip && (
                    <div style={{ display: "flex", gap: 7, alignItems: "flex-start", background: "rgba(255,255,255,0.7)", border: `1px solid ${tk.ring}`, borderRadius: 12, padding: "9px 11px", marginTop: 12 }}>
                      <span style={{ fontSize: 13, flexShrink: 0 }}>💡</span>
                      <p style={{ fontSize: 11.5, color: tk.text, fontWeight: 600, lineHeight: 1.45, margin: 0 }}>{it.tip}</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Controls: arrows + dots + counter */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
        <button onClick={() => go(idx - 1)} disabled={idx === 0} style={{
          width: 34, height: 34, borderRadius: "50%", border: "none",
          background: idx === 0 ? "#F1F5F9" : "#fff", boxShadow: idx === 0 ? "none" : "0 2px 8px rgba(0,0,0,0.1)",
          cursor: idx === 0 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={idx === 0 ? "#CBD5E1" : "#475569"} strokeWidth="3" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          {items.map((_, i) => (
            <button key={i} onClick={() => go(i)} style={{
              width: i === idx ? 22 : 7, height: 7, borderRadius: 4,
              background: i === idx ? "#1E293B" : "#CBD5E1", border: "none", cursor: "pointer",
              transition: "all 0.3s cubic-bezier(.34,1.56,.64,1)", padding: 0,
            }} />
          ))}
        </div>
        <button onClick={() => go(idx + 1)} disabled={idx === n - 1} style={{
          width: 34, height: 34, borderRadius: "50%", border: "none",
          background: idx === n - 1 ? "#F1F5F9" : "#fff", boxShadow: idx === n - 1 ? "none" : "0 2px 8px rgba(0,0,0,0.1)",
          cursor: idx === n - 1 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={idx === n - 1 ? "#CBD5E1" : "#475569"} strokeWidth="3" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
    </div>
  )
}

function JourneyView({ data, onAskAI }: { data: AnalysisData; onAskAI: (q: string) => void }) {
  const sections = data.sections || []

  // ── Group sections into chapters (separate pages) ───────────────────────
  // Grouped by first-occurrence chapter name so the AI's intended page
  // structure is preserved; capped at 5 chapters.
  const chapters = useMemo(() => {
    const out: Array<{ title: string; emoji: string; entries: Array<{ s: Section; si: number }> }> = []
    sections.forEach((s, si) => {
      const name = (s.chapter || '').trim() || fallbackChapter(s.layout)
      const existing = out.find(c => c.title === name)
      if (existing) existing.entries.push({ s, si })
      else out.push({ title: name, emoji: s.emoji, entries: [{ s, si }] })
    })
    while (out.length > 5) {
      const extra = out.pop()!
      out[out.length - 1].entries.push(...extra.entries)
    }
    return out
  }, [sections])

  const [chap, setChap] = useState(0)
  const chapTouchX = useRef(0)
  const maxChap = chapters.length - 1

  // Collapse state — low priority or expanded:false start collapsed
  const [open, setOpen] = useState<Record<number, boolean>>(() => {
    const o: Record<number, boolean> = {}
    sections.forEach((s, i) => { o[i] = s.expanded && s.priority !== 'low' })
    return o
  })
  // Checklist completion state, keyed "sectionIdx-itemIdx"
  const [done, setDone] = useState<Record<string, boolean>>({})

  const toggleOpen = (i: number) => setOpen(prev => ({ ...prev, [i]: !prev[i] }))
  const toggleDone = (k: string) => setDone(prev => ({ ...prev, [k]: !prev[k] }))

  const goChap = (i: number) => setChap(Math.max(0, Math.min(maxChap, i)))
  const onChapTS = (e: React.TouchEvent) => { chapTouchX.current = e.touches[0].clientX }
  const onChapTE = (e: React.TouchEvent) => {
    const d = chapTouchX.current - e.changedTouches[0].clientX
    if (Math.abs(d) > 55) goChap(chap + (d > 0 ? 1 : -1))
  }

  const isLastChap = chap === maxChap

  // ── Dynamic accent — the whole report tints by outcome, so each test feels
  //    distinct. positive→teal, concerning→warm, neutral→indigo. ──────────
  const accent = (() => {
    const oq = data.outcomeQuality
    if (oq === 'positive') return { c: "#00C48C", c2: "#00A876", glow: "rgba(0,196,140,0.35)", soft: "#ECFDF5", mesh: "rgba(0,196,140,0.18)" }
    if (oq === 'concerning') return { c: "#F97316", c2: "#EA580C", glow: "rgba(249,115,22,0.32)", soft: "#FFF7ED", mesh: "rgba(249,115,22,0.16)" }
    return { c: "#6366F1", c2: "#4F46E5", glow: "rgba(99,102,241,0.3)", soft: "#EEF2FF", mesh: "rgba(99,102,241,0.16)" }
  })()

  const ringColor = scoreColor(data.healthScore)

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#F4F6FB" }} onTouchStart={onChapTS} onTouchEnd={onChapTE}>
      {/* Reading-progress bar */}
      <div style={{ height: 3, background: "#E5E9F0", flexShrink: 0 }}>
        <div style={{ height: "100%", width: `${((chap + 1) / chapters.length) * 100}%`, background: `linear-gradient(90deg, ${accent.c}, ${accent.c2})`, borderRadius: 4, transition: "width 0.4s cubic-bezier(.16,1,.3,1)" }} />
      </div>

      {/* Chapter tab bar — AI-named pages */}
      <div style={{
        display: "flex", gap: 6, padding: "11px 14px 9px",
        overflowX: "auto", flexShrink: 0,
        background: "#F4F6FB",
        WebkitOverflowScrolling: "touch",
      }}>
        {chapters.map((c, i) => {
          const active = chap === i
          return (
          <button key={i} onClick={() => goChap(i)} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 14px", borderRadius: 22, border: "none",
            background: active ? `linear-gradient(135deg, ${accent.c}, ${accent.c2})` : "#fff",
            color: active ? "#fff" : "#64748B",
            fontSize: 11.5, fontWeight: 800, cursor: "pointer",
            whiteSpace: "nowrap", flexShrink: 0,
            boxShadow: active ? `0 6px 16px ${accent.glow}` : "0 1px 4px rgba(0,0,0,0.05)",
            transition: "all 0.28s cubic-bezier(.16,1,.3,1)",
            transform: active ? "translateY(-1px) scale(1.03)" : "scale(1)",
          }}>
            <span style={{ fontSize: 13 }}>{c.emoji}</span>
            {c.title}
            {active && <span style={{ fontSize: 9, opacity: 0.85, fontWeight: 700, background: "rgba(255,255,255,0.25)", borderRadius: 10, padding: "1px 6px" }}>{i + 1}/{chapters.length}</span>}
          </button>
        )})}
      </div>

      {/* Chapter content */}
      <div key={chap} style={{ flex: 1, overflowY: "auto", padding: "12px 14px 14px", animation: "chap-in 0.4s cubic-bezier(.16,1,.3,1)" }}>

      {/* Premium score hero — only on first chapter, always server data */}
      {chap === 0 && (
      <div style={{
        position: "relative", borderRadius: 26, padding: "22px 18px 20px", marginBottom: 14,
        background: `linear-gradient(150deg, #fff 0%, ${accent.soft} 100%)`,
        boxShadow: `0 8px 30px ${accent.glow}, 0 2px 10px rgba(0,0,0,0.04)`,
        border: `1px solid ${accent.c}22`, overflow: "hidden",
      }}>
        {/* Decorative mesh blobs */}
        <div style={{ position: "absolute", top: -40, right: -30, width: 150, height: 150, borderRadius: "50%", background: accent.mesh, filter: "blur(28px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -50, left: -20, width: 120, height: 120, borderRadius: "50%", background: accent.mesh, filter: "blur(30px)", pointerEvents: "none" }} />

        {data.isProfile ? (
          /* Profile hero — dominant type, no 0-100 score */
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 20, flexShrink: 0,
                background: `linear-gradient(135deg, ${accent.c}, ${accent.c2})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 30, boxShadow: `0 8px 22px ${accent.glow}`,
              }}>{chapters[0]?.emoji || "🧩"}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 10.5, fontWeight: 800, color: accent.c, letterSpacing: 0.6, margin: "0 0 2px", textTransform: "uppercase" }}>Таны давамгай дүр</p>
                <p style={{ fontSize: 21, fontWeight: 900, color: "#1E293B", margin: 0, lineHeight: 1.1 }}>{data.dominantLabel || data.displayLabel}</p>
                {data.secondaryLabel && <p style={{ fontSize: 11.5, color: "#94A3B8", margin: "3px 0 0", fontWeight: 600 }}>2-рт: {data.secondaryLabel}</p>}
              </div>
            </div>
            <p style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.55, margin: 0, fontWeight: 500 }}>
              {data.opening || data.summary.description}
            </p>
          </div>
        ) : (
          /* Score hero — ring + label for scored tests */
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{ position: "absolute", inset: -6, borderRadius: "50%", background: `radial-gradient(circle, ${ringColor}33 0%, transparent 70%)`, filter: "blur(6px)" }} />
              <div style={{ position: "relative" }}>
                <ScoreRing score={data.healthScore} size={96} display={data.displayScore != null && data.displayMaxScore ? { score: data.displayScore, max: data.displayMaxScore } : undefined} />
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {data.displayLabel && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: `linear-gradient(135deg, ${ringColor}, ${ringColor}CC)`, color: "#fff", fontSize: 11.5, fontWeight: 800, padding: "5px 13px", borderRadius: 22, marginBottom: 8, boxShadow: `0 4px 12px ${ringColor}50` }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", opacity: 0.9 }} />
                  {data.displayLabel}
                </span>
              )}
              <p style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.55, margin: 0, fontWeight: 500 }}>
                {data.opening || data.summary.description}
              </p>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Sections of the active chapter, in AI narrative order */}
      {chapters[chap]?.entries.map(({ s, si }) => {
        const t = TONE_THEME[s.tone] || TONE_THEME.neutral
        const isOpen = open[si] !== false
        const isHero = s.layout === "hero"

        // Collapsed pill for low-priority sections
        if (!isOpen) {
          return (
            <button key={si} onClick={() => toggleOpen(si)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              background: "#fff", border: `1.5px solid ${t.border}`, borderRadius: 16,
              padding: "12px 14px", marginBottom: 10, cursor: "pointer", textAlign: "left",
            }}>
              <span style={{ fontSize: 18 }}>{s.emoji}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#1E293B" }}>{s.title}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
            </button>
          )
        }

        const chapEntries = chapters[chap]?.entries || []
        const localIdx = chapEntries.findIndex(e => e.si === si)
        return (
          <div key={si} style={{
            background: isHero ? `linear-gradient(135deg, ${t.bg} 0%, ${t.soft} 100%)` : "#fff",
            border: `1.5px solid ${isHero ? t.border : "#EEF1F6"}`,
            borderRadius: isHero ? 24 : 18,
            padding: isHero ? "20px 18px" : "16px 14px",
            marginBottom: 12,
            boxShadow: isHero ? `0 8px 28px ${t.main}22` : "0 3px 14px rgba(15,23,42,0.06)",
            animation: `ci 0.4s cubic-bezier(.16,1,.3,1) ${(localIdx < 0 ? 0 : localIdx) * 0.08}s both`,
          }}>
            {/* Section header */}
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: s.body || s.items.length ? 10 : 0 }}>
              <div style={{
                width: isHero ? 42 : 32, height: isHero ? 42 : 32, borderRadius: isHero ? 14 : 10,
                background: isHero ? t.main : t.soft,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: isHero ? 21 : 16, flexShrink: 0,
                boxShadow: isHero ? `0 4px 12px ${t.main}50` : "none",
              }}>{s.emoji}</div>
              <p style={{ fontSize: isHero ? 16 : 14, fontWeight: 900, color: isHero ? t.text : "#1E293B", margin: 0, flex: 1, lineHeight: 1.3 }}>{s.title}</p>
              {(s.priority === 'low' || !s.expanded) && (
                <button onClick={() => toggleOpen(si)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round"><path d="M18 15l-6-6-6 6"/></svg>
                </button>
              )}
            </div>

            {s.body && (
              <p style={{ fontSize: isHero ? 13 : 12, color: isHero ? t.text : "#475569", lineHeight: 1.6, margin: s.items.length ? "0 0 12px" : 0 }}>{s.body}</p>
            )}

            {/* ── Layout-specific item rendering ── */}

            {s.layout === "carousel" && s.items.length > 0 && (
              <AdviceCarousel items={s.items} onAskAI={onAskAI} />
            )}

            {s.layout === "radar" && s.items.length >= 3 && (
              <RadarChart items={s.items} color={accent.c} />
            )}

            {s.layout === "bars" && s.items.length > 0 && (
              <div>
                {s.items.map((it, ii) => (
                  <div key={ii} style={{ marginBottom: ii < s.items.length - 1 ? 10 : 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>{it.title}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: t.main }}>{it.meta}</span>
                    </div>
                    <div style={{ height: 8, background: "#F1F5F9", borderRadius: 6, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(it.pct ?? 0, 100)}%`, background: `linear-gradient(90deg, ${t.main}, ${t.main}99)`, borderRadius: 6, transition: "width 0.8s cubic-bezier(.16,1,.3,1)" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {s.layout === "quotes" && s.items.map((it, ii) => (
              <div key={ii} style={{ borderLeft: `3px solid ${t.main}`, background: t.bg, borderRadius: "0 12px 12px 0", padding: "10px 12px", marginBottom: ii < s.items.length - 1 ? 8 : 0 }}>
                {it.title && <p style={{ fontSize: 11, fontWeight: 800, color: t.text, margin: "0 0 3px" }}>{it.title}</p>}
                {it.text && <p style={{ fontSize: 12, color: "#475569", fontStyle: "italic", lineHeight: 1.5, margin: 0 }}>"{it.text}"</p>}
              </div>
            ))}

            {(s.layout === "cards" || s.layout === "list") && s.items.map((it, ii) => (
              <div key={ii} style={{
                display: "flex", gap: 10, alignItems: "flex-start",
                background: s.layout === "cards" ? t.bg : "transparent",
                borderRadius: s.layout === "cards" ? 14 : 0,
                padding: s.layout === "cards" ? "11px 12px" : "5px 0",
                marginBottom: ii < s.items.length - 1 ? (s.layout === "cards" ? 8 : 2) : 0,
              }}>
                <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1.3 }}>{it.emoji || "•"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {it.title && <p style={{ fontSize: 12.5, fontWeight: 800, color: "#1E293B", margin: "0 0 2px", lineHeight: 1.35 }}>{it.title}</p>}
                  {it.text && <p style={{ fontSize: 11.5, color: "#64748B", lineHeight: 1.5, margin: 0 }}>{it.text}</p>}
                </div>
              </div>
            ))}

            {s.layout === "grid" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {s.items.map((it, ii) => (
                  <div key={ii} style={{ background: t.bg, borderRadius: 14, padding: "12px 10px", textAlign: "center" }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{it.emoji || s.emoji}</div>
                    <p style={{ fontSize: 11.5, fontWeight: 800, color: "#1E293B", margin: "0 0 2px" }}>{it.title}</p>
                    {it.text && <p style={{ fontSize: 10.5, color: "#64748B", margin: 0, lineHeight: 1.4 }}>{it.text}</p>}
                  </div>
                ))}
              </div>
            )}

            {s.layout === "timeline" && (
              <div style={{ position: "relative", paddingLeft: 26 }}>
                <div style={{ position: "absolute", left: 9, top: 8, bottom: 8, width: 2, background: t.border }} />
                {s.items.map((it, ii) => (
                  <div key={ii} style={{ position: "relative", marginBottom: ii < s.items.length - 1 ? 14 : 0 }}>
                    <div style={{
                      position: "absolute", left: -26, top: 0,
                      width: 20, height: 20, borderRadius: "50%",
                      background: t.main, color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 900,
                      boxShadow: `0 0 0 3px ${t.bg}`,
                    }}>{ii + 1}</div>
                    {it.meta && <p style={{ fontSize: 9.5, fontWeight: 800, color: "#94A3B8", letterSpacing: 0.5, margin: "0 0 1px", textTransform: "uppercase" }}>{it.meta}</p>}
                    <p style={{ fontSize: 12.5, fontWeight: 800, color: "#1E293B", margin: "0 0 2px" }}>{it.title}</p>
                    {it.text && <p style={{ fontSize: 11.5, color: "#64748B", lineHeight: 1.5, margin: 0 }}>{it.text}</p>}
                  </div>
                ))}
              </div>
            )}

            {s.layout === "checklist" && (() => {
              const total = s.items.length
              const doneCount = s.items.filter((_, ii) => done[`${si}-${ii}`]).length
              const allDone = doneCount === total && total > 0
              const pct = total ? Math.round((doneCount / total) * 100) : 0
              return (
                <div>
                  {/* Progress header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8" }}>
                      {allDone ? "Бүгдийг гүйцэтгэлээ! 🎉" : `${doneCount}/${total} гүйцэтгэсэн`}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: allDone ? TEAL : "#94A3B8" }}>{pct}%</span>
                  </div>
                  <div style={{ height: 7, background: "#EEF2F7", borderRadius: 5, overflow: "hidden", marginBottom: 12 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${TEAL}, #00E5A0)`, borderRadius: 5, transition: "width 0.5s cubic-bezier(.16,1,.3,1)", boxShadow: pct > 0 ? `0 0 8px ${TEAL}66` : "none" }} />
                  </div>
                  {s.items.map((it, ii) => {
                    const k = `${si}-${ii}`
                    const checked = !!done[k]
                    return (
                      <button key={ii} onClick={() => toggleDone(k)} style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 11,
                        background: checked ? "linear-gradient(135deg,#F0FDF4,#ECFDF5)" : "#fff",
                        border: `1.5px solid ${checked ? "#A7F3D0" : "#EEF2F7"}`,
                        borderRadius: 15, padding: "13px 13px",
                        marginBottom: ii < s.items.length - 1 ? 8 : 0,
                        cursor: "pointer", textAlign: "left", transition: "all 0.25s cubic-bezier(.16,1,.3,1)",
                        boxShadow: checked ? `0 2px 10px ${TEAL}1F` : "0 1px 4px rgba(0,0,0,0.03)",
                      }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                          border: `2px solid ${checked ? TEAL : "#D1D9E3"}`,
                          background: checked ? `linear-gradient(135deg,${TEAL},#00A876)` : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.25s", transform: checked ? "scale(1.08)" : "scale(1)",
                          boxShadow: checked ? `0 3px 8px ${TEAL}55` : "none",
                        }}>
                          {checked
                            ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                            : <span style={{ fontSize: 10, fontWeight: 800, color: "#94A3B8" }}>{ii + 1}</span>}
                        </div>
                        <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: checked ? "#94A3B8" : "#1E293B", textDecoration: checked ? "line-through" : "none", lineHeight: 1.4, transition: "color 0.2s" }}>
                          {it.title || it.text}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )
            })()}

            {/* Hero chips */}
            {isHero && s.items.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                {s.items.map((it, ii) => (
                  <span key={ii} style={{ background: "rgba(255,255,255,0.7)", border: `1px solid ${t.border}`, borderRadius: 20, padding: "5px 12px", fontSize: 11, fontWeight: 700, color: t.text }}>
                    {it.emoji} {it.title || it.text}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Closing CTA — only on the final chapter */}
      {isLastChap && (() => {
        const reportTitle = data.summary?.title || ''
        const suggestions = [
          "Энэ үр дүн юу гэсэн үг вэ?",
          "Би юунаас эхлэх вэ?",
          data.outcomeQuality === 'concerning' ? "Хэрхэн сайжруулах вэ?" : "Үүнийг хэрхэн хадгалах вэ?",
        ]
        return (
        <div style={{
          position: "relative", overflow: "hidden",
          background: `linear-gradient(150deg, ${accent.soft} 0%, #fff 70%)`,
          border: `1.5px solid ${accent.c}33`, borderRadius: 22, padding: "16px",
          marginBottom: 6, boxShadow: `0 8px 24px ${accent.glow}`,
        }}>
          <div style={{ position: "absolute", top: -30, right: -20, width: 100, height: 100, borderRadius: "50%", background: accent.mesh, filter: "blur(24px)", pointerEvents: "none" }} />
          {/* Header */}
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 15, background: `linear-gradient(135deg, ${accent.c}, ${accent.c2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 23, flexShrink: 0, boxShadow: `0 5px 16px ${accent.glow}` }}>🤖</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13.5, fontWeight: 900, color: "#1E293B", margin: "0 0 2px" }}>AI зөвлөхөөс асуу</p>
              <p style={{ fontSize: 11, color: "#64748B", margin: 0, lineHeight: 1.4 }}>Үр дүнгийнхээ талаар юу ч асууж болно</p>
            </div>
          </div>
          {/* Suggested question chips */}
          <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 7 }}>
            {suggestions.map((q, i) => (
              <button key={i} onClick={() => onAskAI(q)} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                width: "100%", background: "#fff", border: `1.5px solid ${accent.c}22`,
                borderRadius: 14, padding: "11px 14px", cursor: "pointer", textAlign: "left",
                transition: "all 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>{q}</span>
                <span style={{ width: 24, height: 24, borderRadius: "50%", background: accent.soft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={accent.c} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </span>
              </button>
            ))}
          </div>
        </div>
        )
      })()}
      </div>

      {/* Chapter navigation — prev/next + dots */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "9px 14px", background: "#fff", borderTop: "1px solid #F1F5F9", flexShrink: 0,
      }}>
        <button onClick={() => goChap(chap - 1)} disabled={chap === 0} style={{
          display: "flex", alignItems: "center", gap: 5,
          background: chap === 0 ? "#F8FAFC" : "#F1F5F9", border: "none", borderRadius: 18,
          padding: "8px 14px", fontSize: 11.5, fontWeight: 800,
          color: chap === 0 ? "#CBD5E1" : "#475569",
          cursor: chap === 0 ? "default" : "pointer", transition: "all 0.2s",
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          Өмнөх
        </button>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          {chapters.map((_, i) => (
            <button key={i} onClick={() => goChap(i)} style={{
              width: i === chap ? 20 : 6, height: 6, borderRadius: 4,
              background: i === chap ? accent.c : "#E2E8F0", border: "none", cursor: "pointer",
              transition: "all 0.3s cubic-bezier(.34,1.56,.64,1)", padding: 0,
            }} />
          ))}
        </div>
        <button onClick={() => isLastChap ? onAskAI("Миний үр дүнгийн хамгийн чухал зүйл юу вэ?") : goChap(chap + 1)} style={{
          display: "flex", alignItems: "center", gap: 5,
          background: `linear-gradient(135deg, ${accent.c}, ${accent.c2})`,
          border: "none", borderRadius: 18,
          padding: "9px 17px", fontSize: 11.5, fontWeight: 800, color: "#fff",
          cursor: "pointer", transition: "all 0.2s",
          boxShadow: `0 5px 16px ${accent.glow}`,
        }}>
          {isLastChap ? "AI-аас асуух" : "Дараах"}
          {!isLastChap && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>}
        </button>
      </div>
    </div>
  )
}

// ── Full Results ──────────────────────────────────────────────────────────────
export function AnalysisResults({ data, reportTitle, onClose, onAskAI }: Props) {
  const [page, setPage] = useState(0)
  const [insDetail, setInsDetail] = useState<AnalysisData["insights"][0] | null>(null)
  const [roadWeek, setRoadWeek] = useState(0)
  const [goals, setGoals] = useState<boolean[]>([false, false, false])
  const [chatInput, setChatInput] = useState("")
  const [bar, setBar] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const touchX = useRef(0)
  // AI Insights carousel index: 0=Strengths, 1=Risks, 2=Tips
  const [insCarousel, setInsCarousel] = useState(0)
  const insCarouselTouchX = useRef(0)
  // List-detail modal for "see all" (strengths/risks list)
  const [listDetail, setListDetail] = useState<null | {
    kind: "strengths" | "risks" | "tips"
    title: string
    items: string[]
    color: string
    bg: string
    soft: string
    grad: string
    emoji: string
  }>(null)
  // Journey mode: the AI provided a dynamic presentation plan — render the
  // guided single-scroll narrative instead of the legacy fixed 3-page layout.
  const hasJourney = Array.isArray(data.sections) && data.sections.length >= 3

  // Test type determines whether the 30-day action page is shown
  const testType: TestType = data.testType || 'generic'
  const hasActionPage = (data.roadmap?.length ?? 0) > 0 || (data.todayGoals?.length ?? 0) > 0
  const PAGE_LABEL_3 = testType === 'profile' ? 'Хөгжүүлэх'
                     : testType === 'cognitive' ? 'Дадлага'
                     : testType === 'aptitude' ? 'Карьер'
                     : '30 Хоног'
  const PAGES = hasActionPage ? ["Тоймлол", "AI Дүн", PAGE_LABEL_3] : ["Тоймлол", "AI Дүн"]
  const maxPage = PAGES.length - 1
  const kpi = data.kpiLabels || {}
  const todayGoals = data.todayGoals || data.roadmap[0]?.tasks.slice(0, 3) || []
  const statCards = data.statCards || []
  const metricColor = (pct: number) => pct > 0.6 ? "#FF4444" : pct > 0.3 ? "#FF9800" : TEAL
  const metricGrad = (pct: number) => pct > 0.6 ? "linear-gradient(90deg,#FF4444,#FF6B6B)" : pct > 0.3 ? "linear-gradient(90deg,#FF9800,#FFCC44)" : `linear-gradient(90deg,${TEAL},#00E5A0)`
  const weekColors = ["#6C63FF", "#FF6B6B", TEAL, "#FF9800"]
  const weekIcons = ["📋", "⚡", "🔄", "🏆"]
  const allGoalsDone = goals.filter(Boolean).length === todayGoals.length && todayGoals.length > 0

  // Dynamic character based on score + context
  const heroChar: keyof typeof CHARS = data.healthScore >= 75 ? "ok" : data.healthScore >= 50 ? "thumbsup" : "thinking"

  useEffect(() => { setTimeout(() => setBar(true), 300) }, [])
  useEffect(() => { setGoals(new Array(todayGoals.length).fill(false)) }, [todayGoals.length])

  const expand = () => {
    const n = !expanded; setExpanded(n)
    if (typeof window !== "undefined" && window.parent !== window)
      window.parent.postMessage({ type: n ? "HIREMN_ANALYSIS_EXPAND" : "HIREMN_ANALYSIS_COLLAPSE" }, "*")
  }
  const close = () => {
    if (expanded && typeof window !== "undefined" && window.parent !== window)
      window.parent.postMessage({ type: "HIREMN_ANALYSIS_COLLAPSE" }, "*")
    onClose()
  }
  const toggleGoal = useCallback((i: number) => {
    setGoals(prev => { const n = [...prev]; n[i] = !n[i]; return n })
  }, [])
  const handleAI = useCallback(() => {
    if (!chatInput.trim()) return
    onAskAI(chatInput.trim()); setChatInput(""); close()
  }, [chatInput, onAskAI])

  const onTS = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX }
  const onTE = (e: React.TouchEvent) => {
    const d = touchX.current - e.changedTouches[0].clientX
    if (Math.abs(d) > 50) { if (d > 0 && page < maxPage) setPage(p => p + 1); if (d < 0 && page > 0) setPage(p => p - 1) }
  }

  const color = scoreColor(data.healthScore)
  const rc = riskColor(data.riskLevel)
  const pc = potColor(data.quitPotential)

  return (
    <div style={{ position: "absolute", inset: 0, background: "#F0F4F8", display: "flex", flexDirection: "column", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif", zIndex: 50, animation: "ar-in 0.3s ease" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "10px 14px", flexShrink: 0, boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <button onClick={close} style={{ background: "#F1F5F9", border: "none", borderRadius: 20, padding: "6px 14px", fontSize: 12, color: "#64748B", cursor: "pointer", fontWeight: 700 }}>← Буцах</button>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{reportTitle}</span>
          <button onClick={expand} style={{ background: "#F1F5F9", border: "none", borderRadius: 20, padding: "7px 10px", cursor: "pointer", color: "#94A3B8", display: "flex", alignItems: "center" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              {expanded ? <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" /> : <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />}
            </svg>
          </button>
        </div>
        {!hasJourney && (
        <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 12, padding: 3, gap: 2 }}>
          {PAGES.map((p, i) => (
            <button key={i} onClick={() => setPage(i)} style={{ flex: 1, padding: "7px", fontSize: 11, fontWeight: 700, border: "none", borderRadius: 10, cursor: "pointer", background: page === i ? "#fff" : "transparent", color: page === i ? "#1E293B" : "#94A3B8", boxShadow: page === i ? "0 2px 8px rgba(0,0,0,0.08)" : "none", transition: "all 0.2s" }}>{p}</button>
          ))}
        </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: hasJourney ? "hidden" : "auto", overflowX: "hidden", display: hasJourney ? "flex" : "block", flexDirection: "column" }} onTouchStart={hasJourney ? undefined : onTS} onTouchEnd={hasJourney ? undefined : onTE}>
        {/* JOURNEY MODE — AI-planned chapter-paged narrative */}
        {hasJourney && <JourneyView data={data} onAskAI={onAskAI} />}

        {/* PAGE 0 — Overview */}
        {!hasJourney && page === 0 && (
          <div style={{ padding: "14px", animation: "si 0.25s ease" }}>
            {/* Score + character */}
            <div style={{ background: "#fff", borderRadius: 20, padding: "18px 16px", marginBottom: 12, boxShadow: "0 2px 14px rgba(0,0,0,0.07)", display: "flex", alignItems: "center", gap: 14 }}>
              <div>
                <ScoreRing score={data.healthScore} size={100} display={data.displayScore != null && data.displayMaxScore ? { score: data.displayScore, max: data.displayMaxScore } : undefined} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 11 }}>💙</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.4px" }}>HEALTH SCORE</span>
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: `${color}15`, borderRadius: 20, padding: "4px 12px", border: `1.5px solid ${color}25`, marginBottom: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, display: "inline-block" }} />
                  <span style={{ color, fontWeight: 800, fontSize: 13 }}>{data.summary.title}</span>
                </div>
                <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.6, margin: 0 }}>{data.summary.description}</p>
              </div>
              <Char type={heroChar} size={72} style={{ flexShrink: 0 }} />
            </div>

            {/* 3 KPI cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 12 }}>
              {[
                { label: kpi.metric1Label || "Хамаарал", value: data.metrics[0] ? `${data.metrics[0].score}/10` : "—", sub: data.metrics[0]?.status || "", color: BRAND, bg: "#FFF5F0", border: "#FFD0B8", barPct: data.metrics[0] ? (data.metrics[0].score / data.metrics[0].maxScore) * 100 : 0 },
                { label: kpi.riskLabel || "Эрсдэл", value: data.riskLevel === "Low" ? "Low" : data.riskLevel === "Medium" ? "Mid" : "High", sub: data.riskLevel === "Low" ? "Бага" : data.riskLevel === "Medium" ? "Дунд" : "Өндөр", color: rc, bg: rc === TEAL ? "#F0FDF4" : rc === "#FF9800" ? "#FFFBEB" : "#FFF2F2", border: `${rc}30`, barPct: data.riskLevel === "Low" ? 20 : data.riskLevel === "Medium" ? 55 : 90 },
                { label: kpi.potentialLabel || "Боломж", value: data.quitPotential === "High" ? "High" : data.quitPotential === "Medium" ? "Mid" : "Low", sub: data.quitPotential === "High" ? "Өндөр" : data.quitPotential === "Medium" ? "Дунд" : "Бага", color: pc, bg: pc === TEAL ? "#F0FDF4" : pc === "#FF9800" ? "#FFFBEB" : "#FFF2F2", border: `${pc}30`, barPct: data.quitPotential === "High" ? 85 : data.quitPotential === "Medium" ? 50 : 20 },
              ].map((k, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "12px 10px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: `1.5px solid ${k.border}` }}>
                  <p style={{ fontSize: 8, color: "#94A3B8", fontWeight: 700, margin: "0 0 4px", letterSpacing: "0.3px", lineHeight: 1.3 }}>{k.label.toUpperCase()}</p>
                  <p style={{ fontSize: 18, fontWeight: 900, color: k.color, margin: "0 0 1px", lineHeight: 1 }}>{k.value}</p>
                  <p style={{ fontSize: 8, color: "#94A3B8", margin: "0 0 6px", lineHeight: 1.3 }}>{k.sub}</p>
                  <div style={{ background: "#F1F5F9", borderRadius: 6, height: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 6, width: bar ? `${k.barPct}%` : "0%", background: k.color, transition: "width 1s cubic-bezier(.16,1,.3,1)" }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Dynamic highlight card */}
            <div style={{ background: "linear-gradient(135deg, #E8FFF6, #D0F7EB)", borderRadius: 20, padding: "18px 16px", marginBottom: 12, border: "1.5px solid #A7F3D0", boxShadow: "0 4px 16px rgba(0,196,140,0.12)", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 16, fontWeight: 900, color: "#064E3B", margin: "0 0 6px" }}>
                  {data.highlightTitle || data.insights[0]?.title || "Сайн мэдээ!"}
                </p>
                <p style={{ fontSize: 12, color: "#065F46", lineHeight: 1.6, margin: "0 0 12px" }}>
                  {data.highlightMessage || data.insights[0]?.description || data.summary.description}
                </p>
                <button onClick={() => data.insights[0] && setInsDetail(data.insights[0])} style={{ background: TEAL, border: "none", borderRadius: 22, padding: "9px 18px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: `0 4px 14px ${TEAL}50` }}>
                  Дэлгэрэнгүй үзэх →
                </button>
              </div>
              <Char type={data.healthScore >= 70 ? "ok" : "thinking"} size={80} style={{ flexShrink: 0 }} />
            </div>

            {/* ─── DIMENSIONS BREAKDOWN (DISC, Big5 etc.) — only if 2+ real dims ─── */}
            {data.dimensions && data.dimensions.length >= 2 && (
              <div style={{
                background: "#fff", borderRadius: 18, padding: "16px",
                marginBottom: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                border: "1px solid #F1F5F9",
              }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: 14,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 9,
                      background: "linear-gradient(135deg, #6C63FF, #4F46E5)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 4px 10px rgba(108,99,255,0.3)",
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="13" width="4" height="8" rx="1"/>
                        <rect x="10" y="8" width="4" height="13" rx="1"/>
                        <rect x="17" y="4" width="4" height="17" rx="1"/>
                      </svg>
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 800, color: "#1E293B", margin: "0 0 1px" }}>
                        Хэмжээсүүдийн задаргаа
                      </p>
                      <p style={{ fontSize: 9, color: "#94A3B8", margin: 0, letterSpacing: 0.3 }}>
                        {data.dimensions.length} хэмжээс • Бодит тестээс
                      </p>
                    </div>
                  </div>
                  <div style={{
                    background: "#EEF2FF", color: "#4F46E5",
                    fontSize: 10, fontWeight: 800,
                    padding: "4px 10px", borderRadius: 999,
                    border: "1px solid #C7D2FE",
                  }}>
                    {data.dimensions.length}/Х
                  </div>
                </div>

                {data.dimensions.map((d, i) => {
                  const pct = d.maxScore > 0 ? (d.score / d.maxScore) * 100 : 0
                  const c = metricColor(d.score / d.maxScore)
                  const g = metricGrad(d.score / d.maxScore)
                  // Try to find single-letter code in label like "Давамгайлагч (D)"
                  const codeMatch = d.label.match(/\(([A-ZА-ЯӨҮЁ])\)/i)
                  const code = codeMatch ? codeMatch[1].toUpperCase() : (i + 1).toString()
                  return (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 0",
                      borderBottom: i < data.dimensions!.length - 1 ? "1px solid #F1F5F9" : "none",
                      animation: `ci 0.4s ease ${i * 0.07}s both`,
                    }}>
                      {/* Letter badge */}
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: g,
                        color: "#fff", fontSize: 14, fontWeight: 900,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                        boxShadow: `0 4px 10px ${c}33`,
                      }}>{code}</div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: "flex", justifyContent: "space-between", alignItems: "baseline",
                          marginBottom: 4, gap: 6,
                        }}>
                          <span style={{
                            fontSize: 12, fontWeight: 700, color: "#1E293B",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            flex: 1, minWidth: 0,
                          }}>{d.label.replace(/\s*\([A-ZА-ЯӨҮЁ]\)\s*/i, "")}</span>
                          <span style={{
                            fontSize: 13, fontWeight: 900, color: c, flexShrink: 0,
                            fontFeatureSettings: "'tnum'",
                          }}>{d.score}<span style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700 }}>/{d.maxScore}</span></span>
                        </div>
                        <div style={{
                          background: "#F1F5F9", borderRadius: 6, height: 6, overflow: "hidden",
                          position: "relative",
                        }}>
                          <div style={{
                            height: "100%", borderRadius: 6,
                            width: bar ? `${pct}%` : "0%",
                            background: g,
                            transition: `width ${1.2 + i * 0.08}s cubic-bezier(.16,1,.3,1)`,
                            boxShadow: `0 0 6px ${c}66`,
                          }}/>
                        </div>
                      </div>
                    </div>
                  )
                })}

                <div style={{
                  marginTop: 14, padding: "8px 12px",
                  background: "#F8FAFF", borderRadius: 10,
                  fontSize: 10.5, color: "#64748B", fontWeight: 500,
                  lineHeight: 1.5, textAlign: "center",
                  border: "1px dashed #E2E8F0",
                }}>
                  💡 Хэмжээс тус бүрт өөрийн оноо, утга бий. Дэлгэрэнгүйг тайлангаас уншина уу.
                </div>
              </div>
            )}

            {/* Single-score metric bars (only when no dimensions) */}
            {(!data.dimensions || data.dimensions.length < 2) && data.metrics.map((m, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 16, padding: "14px 16px", marginBottom: 8, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", margin: "0 0 1px" }}>{m.label}</p>
                    <p style={{ fontSize: 10, fontWeight: 700, color: metricColor(m.score / m.maxScore), margin: 0 }}>{m.status}</p>
                  </div>
                  <div style={{ background: `${metricColor(m.score / m.maxScore)}12`, borderRadius: 10, padding: "4px 10px", border: `1px solid ${metricColor(m.score / m.maxScore)}25` }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: metricColor(m.score / m.maxScore) }}>{m.score}/{m.maxScore}</span>
                  </div>
                </div>
                <div style={{ background: "#F1F5F9", borderRadius: 10, height: 10, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 10, width: bar ? `${(m.score / m.maxScore) * 100}%` : "0%", background: metricGrad(m.score / m.maxScore), transition: `width ${1.1 + i * 0.1}s cubic-bezier(.16,1,.3,1)` }} />
                </div>
              </div>
            ))}

            {/* Strengths + Risks with character */}
            <div style={{ background: "#fff", borderRadius: 18, padding: "16px 14px", marginBottom: 8, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                <Char type="thumbsup" size={70} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 800, color: "#059669", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 5 }}>💪 Давуу талууд</p>
                  {data.strengths.map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: 7, marginBottom: 7 }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                        <span style={{ color: TEAL, fontSize: 10, fontWeight: 800 }}>✓</span>
                      </div>
                      <span style={{ fontSize: 11, color: "#374151", lineHeight: 1.4 }}>{s}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 800, color: "#EA580C", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 5 }}>⚠️ Анхаарах эрсдэлүүд</p>
                  {data.risks.map((r, i) => (
                    <div key={i} style={{ display: "flex", gap: 7, marginBottom: 7 }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#FFF7ED", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                        <span style={{ color: "#FF9800", fontSize: 10, fontWeight: 800 }}>!</span>
                      </div>
                      <span style={{ fontSize: 11, color: "#374151", lineHeight: 1.4 }}>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Dynamic stat cards */}
            {statCards.length > 0 && (
              <div style={{ background: "#fff", borderRadius: 16, padding: "14px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", marginBottom: 8 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, textAlign: "center" }}>
                  {statCards.map((s, i) => (
                    <div key={i}>
                      <div style={{ fontSize: 20, marginBottom: 3 }}>{s.icon}</div>
                      <p style={{ fontSize: 13, fontWeight: 900, color: "#1E293B", margin: "0 0 1px", lineHeight: 1 }}>{s.value}</p>
                      <p style={{ fontSize: 8, color: "#94A3B8", margin: 0, lineHeight: 1.3 }}>{s.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => setPage(1)} style={{ width: "100%", padding: "12px", background: "#F1F5F9", border: "1.5px solid #E2E8F0", borderRadius: 14, color: "#475569", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              AI Дүн шинжилгээ харах →
            </button>
          </div>
        )}

        {/* PAGE 1 — AI Insights (carousel design) */}
        {!hasJourney && page === 1 && (() => {
          // Stats pills derived from statCards or computed
          const heroStats = (data.statCards && data.statCards.length >= 4)
            ? data.statCards.slice(0, 4)
            : [
                { icon: "🔥", label: "Хадгалсан", value: `${data.healthScore}%`, sub: "" },
                { icon: "❤️", label: "Эрүүл мэнд", value: `+${Math.round(data.healthScore / 5)}%`, sub: "" },
                { icon: "🫁", label: "Чадвар", value: `+${Math.round(data.healthScore / 4)}%`, sub: "" },
                { icon: "⚡", label: "Эрч хүч", value: `+${Math.round(data.healthScore / 3)}%`, sub: "" },
              ]

          // 3 carousel cards data
          const cards = [
            {
              key: "strengths",
              title: "Давуу талууд",
              titleColor: "#059669",
              bg: "linear-gradient(135deg, #F0FDF4, #DCFCE7)",
              border: "#BBF7D0",
              iconBg: "linear-gradient(135deg, #4ADE80, #16A34A)",
              iconShadow: "0 8px 20px rgba(34,197,94,0.35)",
              icon: (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L4 6v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V6l-8-4z" fill="#fff" stroke="#22C55E" strokeWidth="1.5"/>
                  <path d="M9 12l2 2 4-5" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ),
              items: data.strengths.slice(0, 3),
              itemDot: "#22C55E",
              ctaLabel: `${data.strengths.length} давуу тал`,
              ctaBg: "linear-gradient(135deg, #22C55E, #16A34A)",
            },
            {
              key: "risks",
              title: "Анхаарах зүйлс",
              titleColor: "#EA580C",
              bg: "linear-gradient(135deg, #FFF7ED, #FFEDD5)",
              border: "#FED7AA",
              iconBg: "linear-gradient(135deg, #FB923C, #EA580C)",
              iconShadow: "0 8px 20px rgba(234,88,12,0.35)",
              icon: (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L1 21h22L12 2z" fill="#FB923C" stroke="#EA580C" strokeWidth="1.5"/>
                  <path d="M12 9v5M12 17h.01" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              ),
              items: data.risks.slice(0, 3),
              itemDot: "#FB923C",
              ctaLabel: `${data.risks.length} анхаарах зүйл`,
              ctaBg: "linear-gradient(135deg, #FB923C, #EA580C)",
            },
            {
              key: "tips",
              title: "Зөвлөмж",
              titleColor: "#059669",
              bg: "linear-gradient(135deg, #ECFDF5, #D1FAE5)",
              border: "#A7F3D0",
              iconBg: "linear-gradient(135deg, #4ADE80, #10B981)",
              iconShadow: "0 8px 20px rgba(16,185,129,0.35)",
              icon: (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                  <path d="M3 9h18v12H3z" fill="#10B981" stroke="#059669" strokeWidth="1.5"/>
                  <path d="M3 9v3h18V9M12 21V9" stroke="#059669" strokeWidth="1.5"/>
                  <path d="M12 9c-3-3-6-1-6 1 0 2 3 2 6 0zM12 9c3-3 6-1 6 1 0 2-3 2-6 0z" fill="#fff" stroke="#059669" strokeWidth="1.5"/>
                </svg>
              ),
              items: (data.insights[0]?.actions || data.insights.map(i => i.description)).slice(0, 3),
              itemDot: "#10B981",
              ctaLabel: "Дэлгэрэнгүй",
              ctaBg: "linear-gradient(135deg, #10B981, #059669)",
            },
          ]

          const goCard = (i: number) => setInsCarousel(Math.max(0, Math.min(cards.length - 1, i)))
          const onCarouselTS = (e: React.TouchEvent) => { insCarouselTouchX.current = e.touches[0].clientX }
          const onCarouselTE = (e: React.TouchEvent) => {
            const d = insCarouselTouchX.current - e.changedTouches[0].clientX
            if (Math.abs(d) > 40) {
              if (d > 0) goCard(insCarousel + 1)
              else goCard(insCarousel - 1)
            }
          }
          const current = cards[insCarousel]

          return (
          <div style={{ padding: "14px", animation: "si 0.25s ease" }}>
            {/* ─── HERO: outcome-quality themed (not raw % themed) ─── */}
            {(() => {
              const s = data.healthScore  // wellbeing
              const oq = data.outcomeQuality
              // Prefer explicit outcomeQuality when available; fall back to score tiers
              const tier: 'positive' | 'neutral' | 'concerning' =
                oq === 'positive' ? 'positive'
                : oq === 'concerning' ? 'concerning'
                : oq === 'neutral' ? 'neutral'
                : s >= 70 ? 'positive' : s >= 40 ? 'neutral' : 'concerning'
              const labelByType: Record<TestType, { good: string; mid: string; bad: string }> = {
                profile:   { good: 'Тод profile',       mid: 'Тэнцвэртэй profile', bad: 'Тэнцвэрт анхаарах' },
                cognitive: { good: 'Сайн чадвар',       mid: 'Дундаж',             bad: 'Хөгжүүлэх боломж' },
                screening: { good: 'Эерэг үр дүн',      mid: 'Анхаарал хандуул',   bad: 'Тусламж шаарддаг' },
                aptitude:  { good: 'Тохиромжтой',       mid: 'Боломжтой',          bad: 'Хөгжүүлэх ёстой' },
                generic:   { good: 'Эерэг үр дүн',      mid: 'Тэнцвэртэй',         bad: 'Анхаарал хандуул' },
              }
              const labels = labelByType[testType]
              const theme = tier === 'positive'
                ? {
                    bg: "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 50%, #BBF7D0 100%)",
                    border: "#BBF7D0", shadow: "rgba(34,197,94,0.12)",
                    label: "#059669", num: "#064E3B", body: "#065F46",
                    chip: "💚", decor: ["#86EFAC", "#4ADE80", "#22C55E"],
                    progressLabel: labels.good,
                  }
                : tier === 'neutral'
                ? {
                    bg: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 50%, #FDE68A 100%)",
                    border: "#FDE68A", shadow: "rgba(245,158,11,0.12)",
                    label: "#B45309", num: "#78350F", body: "#92400E",
                    chip: "⚖️", decor: ["#FCD34D", "#FBBF24", "#F59E0B"],
                    progressLabel: labels.mid,
                  }
                : {
                    bg: "linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 50%, #FECACA 100%)",
                    border: "#FECACA", shadow: "rgba(239,68,68,0.12)",
                    label: "#B91C1C", num: "#7F1D1D", body: "#991B1B",
                    chip: "🫶", decor: ["#FCA5A5", "#F87171", "#EF4444"],
                    progressLabel: labels.bad,
                  }
              return (
              <div style={{
                background: theme.bg,
                borderRadius: 24, padding: "18px 16px 14px", marginBottom: 14,
                border: `1.5px solid ${theme.border}`,
                boxShadow: `0 4px 16px ${theme.shadow}`,
                position: "relative", overflow: "hidden",
              }}>
                {/* Decorative shapes themed to score */}
                <div style={{
                  position: "absolute", top: -10, right: -20,
                  width: 130, height: 130, pointerEvents: "none",
                  opacity: 0.5,
                }}>
                  <svg width="130" height="130" viewBox="0 0 100 100" fill="none">
                    <ellipse cx="55" cy="40" rx="14" ry="22" fill={theme.decor[0]} transform="rotate(30 55 40)"/>
                    <ellipse cx="70" cy="55" rx="13" ry="20" fill={theme.decor[1]} transform="rotate(60 70 55)"/>
                    <ellipse cx="60" cy="65" rx="11" ry="18" fill={theme.decor[2]} transform="rotate(-20 60 65)"/>
                    <ellipse cx="75" cy="30" rx="9" ry="14" fill={theme.decor[0]} transform="rotate(45 75 30)"/>
                  </svg>
                </div>

                {/* Top: Score ring + main metric */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12, position: "relative" }}>
                  <div style={{ flexShrink: 0 }}>
                    <ScoreRing score={data.healthScore} size={106} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: theme.label }}>{theme.progressLabel}</span>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={theme.label} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                        <polyline points="17 6 23 6 23 12"/>
                      </svg>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 3 }}>
                      <span style={{ fontSize: 28, fontWeight: 900, color: theme.num, lineHeight: 1 }}>
                        {data.displayScore != null ? data.displayScore : data.healthScore}
                      </span>
                      <span style={{ fontSize: 13, color: theme.body, fontWeight: 700 }}>
                        /{data.displayMaxScore || 100} оноо
                      </span>
                    </div>
                    <p style={{ fontSize: 11, color: theme.body, lineHeight: 1.4, margin: 0, fontWeight: 600 }}>
                      {data.summary.title}
                    </p>
                  </div>
                </div>

                {/* Bottom: 4 stat pills with SVG icons */}
                <div style={{
                  background: "rgba(255,255,255,0.7)",
                  backdropFilter: "blur(8px)",
                  borderRadius: 16, padding: "10px 8px",
                  display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6,
                  position: "relative",
                  border: "1px solid rgba(255,255,255,0.8)",
                }}>
                  {heroStats.map((stat, i) => {
                    // Map index -> icon + color
                    const icons = [
                      { color: "#E8541A", svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill="#E8541A" opacity="0.18"/><circle cx="12" cy="12" r="6" fill="none" stroke="#E8541A" strokeWidth="2"/><circle cx="12" cy="12" r="2.5" fill="#E8541A"/></svg> },
                      { color: "#3B82F6", svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="13" width="4" height="8" rx="1" fill="#3B82F6" opacity="0.5"/><rect x="10" y="8" width="4" height="13" rx="1" fill="#3B82F6" opacity="0.75"/><rect x="17" y="4" width="4" height="17" rx="1" fill="#3B82F6"/></svg> },
                      { color: "#F59E0B", svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="#F59E0B"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg> },
                      { color: "#8B5CF6", svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill="#8B5CF6" opacity="0.18"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="12" r="3" fill="#8B5CF6"/></svg> },
                    ]
                    const ic = icons[i] || icons[0]
                    return (
                      <div key={i} style={{
                        textAlign: "center", padding: "4px 2px",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                      }}>
                        {ic.svg}
                        <div style={{
                          fontSize: 8, fontWeight: 800, color: "#64748B",
                          letterSpacing: 0.3, textTransform: "uppercase",
                          lineHeight: 1.2, marginTop: 1,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          maxWidth: "100%",
                        }}>{stat.label}</div>
                        <div style={{
                          fontSize: 11, fontWeight: 900, color: ic.color,
                          lineHeight: 1,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          maxWidth: "100%",
                        }}>{stat.value}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
              )
            })()}

            {/* ─── AI INSIGHTS CAROUSEL ────────────────────────────────── */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0 4px", marginBottom: 10,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 18 }}>✨</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#1E293B" }}>AI-ийн дүгнэлт</span>
              </div>
              <button onClick={() => current.key === "tips" && data.insights[0] && setInsDetail(data.insights[0])} style={{
                background: "none", border: "none",
                fontSize: 11, fontWeight: 700, color: "#059669",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 3,
                fontFamily: "inherit",
              }}>
                Дэлгэрэнгүй →
              </button>
            </div>

            {/* Horizontal-scroll container with 3 cards visible (snap to each) */}
            <div style={{ position: "relative", marginBottom: 8 }}>
              {/* Left arrow */}
              {insCarousel > 0 && (
                <button
                  onClick={() => {
                    goCard(insCarousel - 1)
                    const el = document.getElementById("ai-ins-scroll")
                    if (el) el.scrollTo({ left: (insCarousel - 1) * el.clientWidth * 0.92, behavior: "smooth" })
                  }}
                  style={{
                    position: "absolute", left: -8, top: "45%", transform: "translateY(-50%)",
                    zIndex: 5, width: 36, height: 36, borderRadius: "50%",
                    background: "#fff", border: "1.5px solid #E2E8F0",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", color: "#64748B",
                    boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
                    fontFamily: "inherit",
                  }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                </button>
              )}
              {/* Right arrow */}
              {insCarousel < cards.length - 1 && (
                <button
                  onClick={() => {
                    goCard(insCarousel + 1)
                    const el = document.getElementById("ai-ins-scroll")
                    if (el) el.scrollTo({ left: (insCarousel + 1) * el.clientWidth * 0.92, behavior: "smooth" })
                  }}
                  style={{
                    position: "absolute", right: -8, top: "45%", transform: "translateY(-50%)",
                    zIndex: 5, width: 36, height: 36, borderRadius: "50%",
                    background: "#fff", border: "1.5px solid #E2E8F0",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", color: "#64748B",
                    boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
                    fontFamily: "inherit",
                  }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              )}

              {/* Scroll container: shows all 3 cards horizontally, snap to each */}
              <div
                id="ai-ins-scroll"
                onScroll={(e) => {
                  const el = e.currentTarget
                  const cardWidth = el.clientWidth * 0.92
                  const idx = Math.round(el.scrollLeft / cardWidth)
                  if (idx !== insCarousel) setInsCarousel(Math.max(0, Math.min(cards.length - 1, idx)))
                }}
                style={{
                  display: "flex", gap: 10,
                  overflowX: "auto",
                  scrollSnapType: "x mandatory",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  WebkitOverflowScrolling: "touch",
                  paddingBottom: 4,
                  margin: "0 -4px",
                  padding: "0 4px 4px",
                }}
              >
                {cards.map((c) => (
                  <div
                    key={c.key}
                    style={{
                      flex: "0 0 88%",
                      minWidth: 230,
                      maxWidth: 320,
                      scrollSnapAlign: "center",
                      background: c.bg,
                      borderRadius: 20, padding: "18px 16px 14px",
                      border: `1.5px solid ${c.border}`,
                      boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
                      display: "flex", flexDirection: "column",
                    }}
                  >
                    {/* Big 3D icon */}
                    <div style={{
                      width: 76, height: 76, borderRadius: 24,
                      background: c.iconBg,
                      margin: "0 auto 12px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: c.iconShadow,
                      position: "relative", overflow: "hidden",
                    }}>
                      <div style={{
                        position: "absolute", top: 0, left: 0, right: 0, height: "45%",
                        background: "linear-gradient(180deg, rgba(255,255,255,0.4), transparent)",
                      }}/>
                      <div style={{ position: "relative" }}>{c.icon}</div>
                    </div>

                    {/* Title */}
                    <p style={{
                      fontSize: 17, fontWeight: 900, color: c.titleColor,
                      textAlign: "center", margin: "0 0 14px", letterSpacing: -0.3,
                    }}>
                      {c.title}
                    </p>

                    {/* Items (Title: detail split, show top 3 with truncation) */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 9, marginBottom: 14 }}>
                      {c.items.slice(0, 3).map((rawItem, i) => {
                        const item = String(rawItem || "")
                        const split = item.match(/^([^:：]+)[:：]\s*(.+)$/)
                        const itemTitle = split ? split[1].trim() : null
                        const itemBody = split ? split[2].trim() : item
                        return (
                          <div key={i} style={{
                            display: "flex", gap: 8, alignItems: "flex-start",
                            background: "rgba(255,255,255,0.55)",
                            borderRadius: 10, padding: "8px 10px",
                            border: `1px solid ${c.border}66`,
                          }}>
                            <div style={{
                              width: 18, height: 18, borderRadius: "50%",
                              background: c.itemDot,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              flexShrink: 0, marginTop: 1,
                              boxShadow: `0 2px 6px ${c.itemDot}55`,
                            }}>
                              {c.key === "strengths" && (
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                              )}
                              {c.key === "risks" && (
                                <span style={{ color: "#fff", fontSize: 10, fontWeight: 900, lineHeight: 1 }}>!</span>
                              )}
                              {c.key === "tips" && (
                                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff" }}/>
                              )}
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              {itemTitle && (
                                <div style={{
                                  fontSize: 11, fontWeight: 800, color: "#1F2937",
                                  marginBottom: 2, lineHeight: 1.3,
                                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                }}>{itemTitle}</div>
                              )}
                              <div style={{
                                fontSize: 10.5, color: itemTitle ? "#475569" : "#374151",
                                lineHeight: 1.45,
                                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                              }}>{itemBody}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* CTA pill — opens list-detail modal */}
                    <button onClick={() => {
                      setListDetail({
                        kind: c.key as any,
                        title: c.title,
                        items: c.items,
                        color: c.titleColor,
                        bg: c.bg as string,
                        soft: c.border as string,
                        grad: c.ctaBg as string,
                        emoji: c.key === "strengths" ? "💪" : c.key === "risks" ? "⚠️" : "💡",
                      })
                    }} style={{
                      background: c.ctaBg,
                      border: "none", borderRadius: 999,
                      padding: "10px 18px", color: "#fff",
                      fontSize: 12, fontWeight: 800, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      boxShadow: `0 6px 16px ${c.titleColor}44`,
                      fontFamily: "inherit",
                    }}>
                      {c.ctaLabel}
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              {/* Hide scrollbar */}
              <style>{`
                #ai-ins-scroll::-webkit-scrollbar { display: none; }
              `}</style>

              {/* Pagination dots */}
              <div style={{
                display: "flex", justifyContent: "center", gap: 6, marginTop: 14,
              }}>
                {cards.map((_, i) => (
                  <button key={i} onClick={() => {
                    goCard(i)
                    const el = document.getElementById("ai-ins-scroll")
                    if (el) el.scrollTo({ left: i * el.clientWidth * 0.92, behavior: "smooth" })
                  }} style={{
                    width: i === insCarousel ? 22 : 7, height: 7, borderRadius: 4,
                    background: i === insCarousel
                      ? (cards[insCarousel].titleColor === "#EA580C" ? "#EA580C" : "#10B981")
                      : "#E2E8F0",
                    border: "none", cursor: "pointer", padding: 0,
                    transition: "all 0.3s cubic-bezier(.34,1.56,.64,1)",
                    fontFamily: "inherit",
                  }}/>
                ))}
              </div>
            </div>

            {/* ─── ACTION PAGE CTA BANNER (hidden when no action page) ─── */}
            {hasActionPage && (
            <div style={{
              background: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)",
              borderRadius: 24, padding: "16px",
              border: "1.5px solid #FED7AA",
              boxShadow: "0 4px 16px rgba(251,146,60,0.12)",
              display: "flex", alignItems: "center", gap: 12,
              position: "relative", overflow: "hidden",
              marginTop: 10,
            }}>
              <div style={{ fontSize: 44, flexShrink: 0, lineHeight: 1 }}>{testType === 'profile' ? '🌱' : testType === 'cognitive' ? '🧠' : testType === 'aptitude' ? '🎯' : '📅'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 900, color: "#7C2D12", margin: "0 0 3px", lineHeight: 1.3 }}>
                  {testType === 'profile' ? 'Profile-аа хөгжүүлэх үү?' : testType === 'cognitive' ? 'Чадвараа сайжруулах уу?' : testType === 'aptitude' ? 'Карьерын алхмууд харах уу?' : '30 хоногийн төлөвлөгөө эхлүүлэх үү?'}
                </p>
                <p style={{ fontSize: 10, color: "#9A3412", margin: "0 0 8px", lineHeight: 1.4 }}>
                  Алхам алхмаар хамтдаа урагшилцгаая! 🚀
                </p>
                <button onClick={() => setPage(maxPage)} style={{
                  background: "linear-gradient(135deg, #F97316, #EA580C)",
                  border: "none", borderRadius: 999,
                  padding: "7px 16px", color: "#fff",
                  fontSize: 11, fontWeight: 800, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 5,
                  boxShadow: "0 6px 16px rgba(234,88,12,0.4)",
                  fontFamily: "inherit",
                }}>
                  Эхлүүлэх →
                </button>
              </div>
              {/* Target illustration */}
              <div style={{ flexShrink: 0 }}>
                <svg width="56" height="56" viewBox="0 0 60 60" fill="none">
                  <circle cx="30" cy="30" r="26" fill="#FED7AA" stroke="#FB923C" strokeWidth="2"/>
                  <circle cx="30" cy="30" r="18" fill="#FFEDD5" stroke="#FB923C" strokeWidth="1.5"/>
                  <circle cx="30" cy="30" r="10" fill="#FB923C"/>
                  <circle cx="30" cy="30" r="4" fill="#fff"/>
                  <path d="M40 8 L36 12 L42 18 L46 14 Z" fill="#FBBF24" stroke="#F59E0B" strokeWidth="1"/>
                  <line x1="38" y1="14" x2="32" y2="20" stroke="#92400E" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
            )}
          </div>
          )
        })()}

        {/* PAGE 1 — OLD CONTENT (unreachable, kept for reference) */}
        {false && page === 1 && (
          <div style={{ padding: "14px", animation: "si 0.25s ease" }}>
            {/* ── Hero AI banner with stats ── */}
            <div style={{
              background: "linear-gradient(135deg, #667EEA 0%, #764BA2 100%)",
              borderRadius: 20, padding: "18px 16px 14px", marginBottom: 12,
              position: "relative", overflow: "hidden",
            }}>
              {/* Decorative orbs */}
              <div style={{
                position: "absolute", top: -40, right: -30,
                width: 130, height: 130, borderRadius: "50%",
                background: "rgba(255,255,255,0.08)", pointerEvents: "none",
              }}/>
              <div style={{
                position: "absolute", bottom: -30, left: -20,
                width: 90, height: 90, borderRadius: "50%",
                background: "rgba(255,255,255,0.06)", pointerEvents: "none",
              }}/>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, position: "relative" }}>
                <Char type="phone" size={56} style={{ flexShrink: 0 }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    background: "rgba(255,255,255,0.18)",
                    borderRadius: 999, padding: "3px 10px", marginBottom: 4,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80", display: "inline-block", boxShadow: "0 0 6px #4ADE80" }}/>
                    <span style={{ fontSize: 9, fontWeight: 800, color: "#fff", letterSpacing: 0.6 }}>POWERED BY AI</span>
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 900, color: "#fff", margin: "0 0 2px" }}>AI Insights</p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", margin: 0, lineHeight: 1.4 }}>
                    {data.insights.length} дэлгэрэнгүй дүгнэлт
                  </p>
                </div>
              </div>
              {/* Mini stats row */}
              <div style={{ display: "flex", gap: 8, position: "relative" }}>
                {[
                  { label: "Найдвартай", value: "97%", icon: "✓" },
                  { label: "Гүн шинжилгээ", value: `${data.insights.length}+`, icon: "🔍" },
                  { label: "Алхам", value: `${data.roadmap.length * 2}+`, icon: "→" },
                ].map((s, i) => (
                  <div key={i} style={{
                    flex: 1, background: "rgba(255,255,255,0.12)",
                    borderRadius: 12, padding: "8px 6px", textAlign: "center",
                    backdropFilter: "blur(8px)",
                  }}>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 700, marginBottom: 2 }}>
                      {s.icon} {s.label}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Filter chips ── */}
            <div style={{
              display: "flex", gap: 6, marginBottom: 12,
              overflowX: "auto", paddingBottom: 2,
            }}>
              {[
                { label: "Бүгд", count: data.insights.length, active: true },
                { label: "💪 Хүч", count: data.strengths.length },
                { label: "⚠️ Эрсдэл", count: data.risks.length },
                { label: "💡 Зөвлөмж", count: data.insights.reduce((s, i) => s + (i.actions?.length || 0), 0) },
              ].map((f, i) => (
                <div key={i} style={{
                  flexShrink: 0,
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: f.active ? "#1E293B" : "#fff",
                  color: f.active ? "#fff" : "#64748B",
                  border: f.active ? "none" : "1.5px solid #E2E8F0",
                  borderRadius: 999, padding: "6px 12px",
                  fontSize: 11, fontWeight: 700, cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s",
                  boxShadow: f.active ? "0 4px 12px rgba(30,41,59,0.2)" : "none",
                }}>
                  {f.label}
                  <span style={{
                    background: f.active ? "rgba(255,255,255,0.2)" : "#F1F5F9",
                    color: f.active ? "#fff" : "#94A3B8",
                    borderRadius: 999, padding: "0 6px",
                    fontSize: 9, fontWeight: 800, minWidth: 14, textAlign: "center",
                  }}>{f.count}</span>
                </div>
              ))}
            </div>

            {/* ── Insight cards (rich) ── */}
            {data.insights.map((ins, i) => {
              const palettes = [
                { bg: "#F0FDF4", border: "#BBF7D0", color: TEAL, text: "Маш сайн", priority: "Өндөр" },
                { bg: "#FFF5F0", border: "#FFD0B8", color: BRAND, text: "Анхаарал", priority: "Дунд" },
                { bg: "#F0F4FF", border: "#C7D2FE", color: "#6366F1", text: "Боломж", priority: "Чухал" },
              ]
              const p = palettes[i % palettes.length]
              return (
                <div key={i} className="hw-card-tilt" style={{
                  background: "#fff", borderRadius: 18, padding: "0",
                  marginBottom: 10, overflow: "hidden",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                  border: `1.5px solid ${p.border}`,
                  animation: `ci 0.35s ease ${i * 0.08}s both`,
                  cursor: "pointer",
                  transition: "all 0.25s cubic-bezier(.16,1,.3,1)",
                }}
                onClick={() => setInsDetail(ins)}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"
                  ;(e.currentTarget as HTMLElement).style.boxShadow = `0 10px 28px ${p.color}22`
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)"
                  ;(e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"
                }}
                >
                  {/* Top color strip */}
                  <div style={{
                    height: 4, background: `linear-gradient(90deg, ${p.color}, ${p.color}66)`,
                  }}/>

                  <div style={{ padding: "12px 14px" }}>
                    {/* Header row: emoji + title + badges */}
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: 12,
                        background: p.bg, fontSize: 20,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                        boxShadow: `0 4px 10px ${p.color}22`,
                      }}>{ins.emoji}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", gap: 4, marginBottom: 3 }}>
                          <span style={{
                            display: "inline-block",
                            background: p.bg, color: p.color,
                            fontSize: 8, fontWeight: 800,
                            padding: "2px 7px", borderRadius: 999,
                            letterSpacing: 0.4, textTransform: "uppercase",
                            border: `1px solid ${p.border}`,
                          }}>
                            {p.priority}
                          </span>
                          <span style={{
                            display: "inline-block",
                            background: "#F1F5F9", color: "#64748B",
                            fontSize: 8, fontWeight: 700,
                            padding: "2px 7px", borderRadius: 999,
                          }}>
                            #{i + 1}
                          </span>
                        </div>
                        <p style={{ fontSize: 13, fontWeight: 800, color: "#1E293B", margin: "0 0 4px", lineHeight: 1.3 }}>{ins.title}</p>
                        <p style={{ fontSize: 11.5, color: "#64748B", margin: 0, lineHeight: 1.5 }}>{ins.description}</p>
                      </div>
                    </div>

                    {/* Quick action chips */}
                    {ins.actions && ins.actions.length > 0 && (
                      <div style={{
                        display: "flex", gap: 5, flexWrap: "wrap",
                        marginBottom: 8, padding: "8px 0 0",
                        borderTop: "1px dashed #E2E8F0",
                      }}>
                        {ins.actions.slice(0, 2).map((a, j) => (
                          <span key={j} style={{
                            background: "#F8FAFF", color: "#475569",
                            border: "1px solid #E2E8F0",
                            borderRadius: 8, padding: "4px 8px",
                            fontSize: 10, fontWeight: 600,
                            display: "inline-flex", alignItems: "center", gap: 4,
                            maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            <span style={{ color: p.color }}>✓</span> {a.length > 28 ? a.slice(0, 26) + "…" : a}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Bottom row */}
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      paddingTop: 6,
                    }}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={e => { e.stopPropagation(); onAskAI(`"${ins.title}" талаар илүү дэлгэрэнгүй тайлбарла`); close() }} style={{
                          background: p.bg, color: p.color, border: "none",
                          borderRadius: 8, padding: "5px 10px",
                          fontSize: 10, fontWeight: 700, cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 4,
                          fontFamily: "inherit",
                        }}>
                          ✨ AI-аас асуу
                        </button>
                      </div>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 4,
                        color: p.color, fontSize: 11, fontWeight: 800,
                      }}>
                        Дэлгэрэнгүй
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 18l6-6-6-6"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Quick stats summary card */}
            <div style={{
              background: "#fff", borderRadius: 18, padding: "14px",
              marginTop: 4, marginBottom: 10,
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
              border: "1.5px solid #F1F5F9",
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
            }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: "#059669", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 5 }}>💪 Давуу талууд</p>
                {data.strengths.slice(0, 3).map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "flex-start" }}>
                    <span style={{ color: TEAL, fontSize: 10, fontWeight: 800, marginTop: 1 }}>✓</span>
                    <span style={{ fontSize: 11, color: "#374151", lineHeight: 1.4 }}>{s}</span>
                  </div>
                ))}
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: "#EA580C", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 5 }}>⚠️ Анхаарал</p>
                {data.risks.slice(0, 3).map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "flex-start" }}>
                    <span style={{ color: "#FF9800", fontSize: 10, fontWeight: 800, marginTop: 1 }}>!</span>
                    <span style={{ fontSize: 11, color: "#374151", lineHeight: 1.4 }}>{r}</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setPage(2)} style={{
              width: "100%", marginTop: 4, padding: "12px",
              background: `linear-gradient(135deg, ${TEAL}, #00A876)`,
              border: "none", borderRadius: 14, color: "#fff",
              fontSize: 12, fontWeight: 800, cursor: "pointer",
              boxShadow: `0 4px 14px ${TEAL}40`,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              📅 30 Хоногийн төлөвлөгөө харах →
            </button>
          </div>
        )}

        {/* PAGE 2 — 30 Day Plan + Goals */}
        {!hasJourney && page === 2 && (
          <div style={{ padding: "14px", animation: "si 0.25s ease" }}>
            {/* Goals card */}
            <div style={{ background: "#fff", borderRadius: 18, padding: "16px", marginBottom: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 20 }}>🎯</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "#1E293B", margin: "0 0 1px" }}>Өнөөдрийн зорилго</p>
                    <p style={{ fontSize: 10, color: "#94A3B8", margin: 0 }}>Зорилгоо тэмдэглэж явна уу</p>
                  </div>
                </div>
                <div style={{ background: "#F0FDF4", borderRadius: 20, padding: "4px 12px", border: `1px solid ${TEAL}30` }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: TEAL }}>{goals.filter(Boolean).length}<span style={{ color: "#94A3B8", fontWeight: 400 }}>/{todayGoals.length}</span></span>
                </div>
              </div>
              <div style={{ background: "#F1F5F9", borderRadius: 8, height: 6, marginBottom: 14, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 8, background: `linear-gradient(90deg, ${TEAL}, #00E5A0)`, width: todayGoals.length > 0 ? `${(goals.filter(Boolean).length / todayGoals.length) * 100}%` : "0%", transition: "width 0.4s ease" }} />
              </div>
              {todayGoals.map((task, i) => (
                <div key={i} onClick={() => toggleGoal(i)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", marginBottom: 8, cursor: "pointer", borderRadius: 14, background: goals[i] ? "#F0FDF4" : "#FAFAFA", border: `1.5px solid ${goals[i] ? TEAL + "40" : "#E2E8F0"}`, transition: "all 0.25s ease", userSelect: "none" }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, background: goals[i] ? TEAL : "#fff", border: `2px solid ${goals[i] ? TEAL : "#CBD5E1"}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.25s ease" }}>
                    {goals[i] && <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M3 8l4 4 6-7" /></svg>}
                  </div>
                  <span style={{ fontSize: 13, color: goals[i] ? "#059669" : "#374151", fontWeight: goals[i] ? 700 : 500, textDecoration: goals[i] ? "line-through" : "none", flex: 1, transition: "all 0.2s" }}>{task}</span>
                  {goals[i] && <span style={{ fontSize: 14 }}>✅</span>}
                </div>
              ))}
              {allGoalsDone && (
                <div style={{ background: "linear-gradient(135deg, #F0FDF4, #DCFCE7)", borderRadius: 14, padding: "12px 16px", border: `1px solid ${TEAL}30`, display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
                  <Char type="celebrate" size={56} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#059669" }}>🎉 Бүх зорилгоо биелүүллээ! Гайхалтай!</span>
                </div>
              )}
            </div>

            {/* Roadmap */}
            <div style={{ background: "#fff", borderRadius: 18, padding: "16px", marginBottom: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 18 }}>📅</span>
                <p style={{ fontSize: 13, fontWeight: 800, color: "#1E293B", margin: 0 }}>30 Хоногийн Төлөвлөгөө</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                {data.roadmap.map((_, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", flex: i < data.roadmap.length - 1 ? 1 : 0 }}>
                    <button onClick={() => setRoadWeek(i)} style={{ width: 32, height: 32, borderRadius: "50%", border: "none", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, background: i === roadWeek ? weekColors[i % weekColors.length] : i < roadWeek ? `${weekColors[i % weekColors.length]}30` : "#F1F5F9", color: i === roadWeek ? "#fff" : i < roadWeek ? weekColors[i % weekColors.length] : "#94A3B8", transition: "all 0.25s ease", boxShadow: i === roadWeek ? `0 4px 12px ${weekColors[i % weekColors.length]}50` : "none" }}>
                      {i < roadWeek ? "✓" : i + 1}
                    </button>
                    {i < data.roadmap.length - 1 && (
                      <div style={{ flex: 1, height: 3, marginLeft: 4, background: i < roadWeek ? weekColors[i % weekColors.length] : "#E2E8F0", borderRadius: 2, transition: "background 0.3s" }} />
                    )}
                  </div>
                ))}
              </div>
              {data.roadmap[roadWeek] && (
                <div style={{ background: `${weekColors[roadWeek % weekColors.length]}08`, borderRadius: 16, padding: "16px", border: `1.5px solid ${weekColors[roadWeek % weekColors.length]}25`, animation: "si 0.2s ease" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: weekColors[roadWeek % weekColors.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: `0 4px 12px ${weekColors[roadWeek % weekColors.length]}40` }}>
                      {weekIcons[roadWeek % weekIcons.length]}
                    </div>
                    <div>
                      <p style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, margin: "0 0 1px", letterSpacing: "0.4px" }}>{data.roadmap[roadWeek].week.toUpperCase()}</p>
                      <p style={{ fontSize: 15, fontWeight: 900, color: "#1E293B", margin: 0 }}>{data.roadmap[roadWeek].title}</p>
                    </div>
                  </div>
                  {data.roadmap[roadWeek].tasks.map((task, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, padding: "10px 12px", background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", animation: `ci 0.3s ease ${i * 0.06}s both` }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: `${weekColors[roadWeek % weekColors.length]}20`, border: `1.5px solid ${weekColors[roadWeek % weekColors.length]}40`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                        <span style={{ color: weekColors[roadWeek % weekColors.length], fontSize: 10, fontWeight: 800 }}>✓</span>
                      </div>
                      <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{task}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button onClick={() => setRoadWeek(w => Math.max(0, w - 1))} disabled={roadWeek === 0} style={{ flex: 1, padding: "11px", borderRadius: 14, border: "1.5px solid #E2E8F0", background: "#fff", color: roadWeek === 0 ? "#CBD5E1" : "#475569", fontSize: 13, fontWeight: 700, cursor: roadWeek === 0 ? "not-allowed" : "pointer", transition: "all 0.2s" }}>← Өмнөх</button>
                <button onClick={() => setRoadWeek(w => Math.min(data.roadmap.length - 1, w + 1))} disabled={roadWeek === data.roadmap.length - 1} style={{ flex: 1, padding: "11px", borderRadius: 14, border: "none", background: roadWeek === data.roadmap.length - 1 ? "#F1F5F9" : `linear-gradient(135deg, ${weekColors[roadWeek % weekColors.length]}, ${weekColors[(roadWeek + 1) % weekColors.length]})`, color: roadWeek === data.roadmap.length - 1 ? "#CBD5E1" : "#fff", fontSize: 13, fontWeight: 700, cursor: roadWeek === data.roadmap.length - 1 ? "not-allowed" : "pointer", boxShadow: roadWeek === data.roadmap.length - 1 ? "none" : `0 4px 14px ${weekColors[roadWeek % weekColors.length]}40`, transition: "all 0.2s" }}>Дараах →</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Chat bar */}
      <div style={{ background: "#fff", borderTop: "1px solid #E2E8F0", padding: "10px 14px", flexShrink: 0, boxShadow: "0 -4px 20px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <Char type="phone" size={36} style={{ flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, color: "#1E293B", margin: "0 0 1px" }}>AI Таны туслах</p>
            <p style={{ fontSize: 9, color: "#94A3B8", margin: 0 }}>Асуултаа асуугарай, би танд туслахад бэлэн байна!</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleAI() }}
            placeholder="Жишээ нь: Хэрхэн сайжрах вэ?"
            style={{ flex: 1, background: "#F1F5F9", border: "1.5px solid #E2E8F0", borderRadius: 22, padding: "9px 16px", color: "#1E293B", fontSize: 12, outline: "none", fontFamily: "inherit", transition: "border-color 0.2s" }}
            onFocus={e => (e.target as HTMLInputElement).style.borderColor = TEAL}
            onBlur={e => (e.target as HTMLInputElement).style.borderColor = "#E2E8F0"}
          />
          <button onClick={handleAI} disabled={!chatInput.trim()} style={{ width: 38, height: 38, borderRadius: "50%", border: "none", background: chatInput.trim() ? `linear-gradient(135deg, ${TEAL}, #00A876)` : "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", cursor: chatInput.trim() ? "pointer" : "not-allowed", flexShrink: 0, boxShadow: chatInput.trim() ? `0 4px 12px ${TEAL}40` : "none", transition: "all 0.2s" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={chatInput.trim() ? "white" : "#94A3B8"} strokeWidth="2.5" strokeLinecap="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" fill={chatInput.trim() ? "white" : "#94A3B8"} stroke="none" />
            </svg>
          </button>
        </div>
      </div>

      {/* Page dots (legacy paged mode only) */}
      {!hasJourney && (
      <div style={{ background: "#fff", padding: "6px 0 8px", display: "flex", justifyContent: "center", gap: 6, flexShrink: 0, borderTop: "1px solid #F1F5F9" }}>
        {PAGES.map((_, i) => (
          <button key={i} onClick={() => setPage(i)} style={{ width: i === page ? 20 : 7, height: 7, borderRadius: 4, background: i === page ? TEAL : "#E2E8F0", border: "none", cursor: "pointer", transition: "all 0.3s cubic-bezier(.34,1.56,.64,1)", padding: 0 }} />
        ))}
      </div>
      )}

      <Sheet insight={insDetail} onClose={() => setInsDetail(null)} onAskAI={onAskAI} />
      <ListDetailSheet data={listDetail} onClose={() => setListDetail(null)} onAskAI={onAskAI} />

      <style>{`
        @keyframes ar-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes si { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ci { from{opacity:0;transform:translateY(10px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes chap-in { from{opacity:0;transform:translateX(16px)} to{opacity:1;transform:translateX(0)} }
        @keyframes card-pop {
          0%   { opacity: 0; transform: scale(0.92) translateY(8px); }
          60%  { transform: scale(1.02) translateY(-3px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .hw-card-tilt { transition: transform 0.25s cubic-bezier(.16,1,.3,1), box-shadow 0.25s ease; }
      `}</style>
    </div>
  )
}
