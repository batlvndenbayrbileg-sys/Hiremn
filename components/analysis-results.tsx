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

// Single brand accent — orange. Used for all chrome (rings, bars, CTAs, etc).
const PRIMARY = "#E8541A"
const BRAND = "#E8541A"
// Score ring uses brand orange (one-colour theme).
const scoreColor = (_s: number) => PRIMARY
// KPI status colours stay SEMANTIC (green good / amber mid / red high) — this
// is the one place colour carries real meaning, matching the approved mockup.
const GREEN = "#B45309", AMBER = "#F59E0B", RED = "#C2410C"
const riskColor = (r: string) => r === "Low" ? GREEN : r === "Medium" ? AMBER : RED
const potColor = (p: string) => p === "High" ? GREEN : p === "Medium" ? AMBER : RED

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
        <span style={{ fontSize: numSize, fontWeight: 900, color: "#2A2520", lineHeight: 1 }}>{disp}</span>
        <span style={{ fontSize: size * 0.1, color: "#A89E96", fontWeight: 600 }}>/{targetDen}</span>
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
          <div style={{ width: 42, height: 5, background: "#DED5CD", borderRadius: 3 }}/>
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
              fontSize: 24, fontWeight: 900, color: "#1F1B18",
              margin: "0 0 6px", letterSpacing: -0.5, lineHeight: 1.15,
            }}>{data.title}</h2>
            <p style={{
              fontSize: 12, color: "#5B5650", lineHeight: 1.5, margin: 0,
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
                        fontSize: 13, fontWeight: 800, color: "#1F1B18",
                        marginBottom: 4, lineHeight: 1.3,
                      }}>{itemTitle}</div>
                    )}
                    <div style={{
                      fontSize: 12.5, color: itemTitle ? "#5B5650" : "#2A2520",
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
          borderTop: "1px solid #FAF6F3",
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
          <div style={{ width: 42, height: 5, background: "#DED5CD", borderRadius: 3 }}/>
        </div>

        {/* Gradient hero */}
        <div style={{
          background: "linear-gradient(135deg, #FFF6EA 0%, #FCEBD2 100%)",
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
              background: "#fff", color: PRIMARY,
              padding: "4px 12px", borderRadius: 999,
              fontSize: 9, fontWeight: 800, letterSpacing: 0.8,
              textTransform: "uppercase", marginBottom: 10,
              border: "1px solid #FBDFB3",
              boxShadow: "0 4px 10px rgba(0,196,140,0.15)",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: PRIMARY, boxShadow: `0 0 8px ${PRIMARY}` }}/>
              AI Insight
            </div>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{
                width: 56, height: 56, borderRadius: 18,
                background: "#fff", fontSize: 28,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "1.5px solid #FBDFB3", flexShrink: 0,
                boxShadow: "0 6px 16px rgba(0,196,140,0.2)",
              }}>{insight.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{
                  fontSize: 19, fontWeight: 900, color: "#5C2A12",
                  margin: "0 0 4px", lineHeight: 1.25, letterSpacing: -0.3,
                }}>{insight.title}</h3>
                <p style={{
                  fontSize: 12, color: "#7C3A1E", margin: 0, lineHeight: 1.5,
                }}>{insight.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Why important */}
        <div style={{ padding: "16px 20px 0" }}>
          <div style={{
            background: "linear-gradient(135deg, #FFF7F2, #FFFFFF)",
            borderRadius: 16, padding: "16px",
            border: "1.5px solid #F0EAE6",
            marginBottom: 16,
            position: "relative",
          }}>
            <div style={{
              position: "absolute", top: -10, left: 14,
              background: "#fff",
              padding: "2px 10px", borderRadius: 999,
              border: "1.5px solid #F0EAE6",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <span style={{ fontSize: 11 }}>💡</span>
              <span style={{ fontSize: 9, fontWeight: 800, color: "#5B5650", letterSpacing: 0.6, textTransform: "uppercase" }}>
                Яагаад чухал вэ
              </span>
            </div>
            <p style={{
              fontSize: 13.5, color: "#43403C", lineHeight: 1.7,
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
                <span style={{ fontSize: 11, fontWeight: 800, color: "#5B5650", letterSpacing: 0.6, textTransform: "uppercase" }}>
                  Хийж болох алхмууд
                </span>
              </div>
              <div style={{
                background: doneCount > 0 ? "#FFF6EA" : "#FAF6F3",
                color: doneCount > 0 ? PRIMARY : "#A89E96",
                fontSize: 10, fontWeight: 800,
                padding: "3px 10px", borderRadius: 999,
                border: `1px solid ${doneCount > 0 ? "#FBDFB3" : "#F0EAE6"}`,
              }}>{doneCount}/{totalActions}</div>
            </div>
          )}

          {/* Progress bar visual */}
          {totalActions > 0 && (
            <div style={{
              background: "#FAF6F3", borderRadius: 8, height: 5,
              marginBottom: 10, overflow: "hidden",
            }}>
              <div style={{
                height: "100%", borderRadius: 8,
                width: `${progressPct}%`,
                background: `linear-gradient(90deg, ${PRIMARY}, #F97316)`,
                transition: "width 0.4s ease",
                boxShadow: doneCount > 0 ? `0 0 8px ${PRIMARY}55` : "none",
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
                background: isDone ? "#FFF6EA" : "#fff",
                border: `1.5px solid ${isDone ? PRIMARY + "40" : "#F0EAE6"}`,
                borderRadius: 14, cursor: "pointer",
                alignItems: "flex-start",
                transition: "all 0.2s",
                animation: `ci 0.3s ease ${i * 0.05}s both`,
                userSelect: "none",
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: isDone ? PRIMARY : "#fff",
                  border: `2px solid ${isDone ? PRIMARY : "#DED5CD"}`,
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
                  fontSize: 13, color: isDone ? "#B45309" : "#5B5650",
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
          borderTop: "1px solid #FAF6F3",
          marginTop: 12,
          display: "flex", gap: 8,
        }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "13px",
            background: "#FAF6F3", color: "#5B5650",
            border: "none", borderRadius: 14,
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            fontFamily: "inherit",
          }}>Хаах</button>
          <button onClick={() => {
            onAskAI?.(`"${insight.title}" талаар илүү гүн мэргэжлийн зөвлөгөө өгөөч`)
            onClose()
          }} style={{
            flex: 2, padding: "13px",
            background: `linear-gradient(135deg, ${PRIMARY}, #F97316)`,
            color: "#fff", border: "none", borderRadius: 14,
            fontSize: 13, fontWeight: 800, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            boxShadow: `0 6px 18px ${PRIMARY}44`,
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
          background: `linear-gradient(135deg, ${PRIMARY}, #F97316)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 4px 12px ${PRIMARY}55`, flexShrink: 0,
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
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: PRIMARY, boxShadow: `0 0 6px ${PRIMARY}`, animation: "ar-pulse 1.6s ease-in-out infinite" }}/>
            <span style={{ fontSize: 9, fontWeight: 800, color: PRIMARY, letterSpacing: 0.6 }}>AI ШИНЖИЛЖ БАЙНА</span>
          </div>
          <p style={{ fontSize: 13, fontWeight: 800, color: "#2A2520", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {title}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 14 }}>
        <div style={{
          background: "#FAF6F3", borderRadius: 8, height: 8, overflow: "hidden",
          position: "relative",
        }}>
          <div style={{
            height: "100%", borderRadius: 8,
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${PRIMARY}, #F97316)`,
            transition: "width 0.4s ease",
            boxShadow: `0 0 10px ${PRIMARY}66`,
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
          marginTop: 5, fontSize: 9, color: "#A89E96", fontWeight: 700,
        }}>
          <span>Шинжилгээ үргэлжилж байна...</span>
          <span style={{ color: PRIMARY }}>{Math.round(progress)}%</span>
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
              background: isActive ? "#FFF6EA" : "transparent",
              borderRadius: 10, transition: "all 0.3s",
              opacity: isDone || isActive ? 1 : 0.4,
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%",
                background: isDone ? PRIMARY : isActive ? "#fff" : "#FAF6F3",
                border: isActive ? `2px solid ${PRIMARY}` : "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                boxShadow: isActive ? `0 0 0 4px ${PRIMARY}22` : "none",
                animation: isActive ? "ar-pulse 1.6s ease-in-out infinite" : undefined,
              }}>
                {isDone ? (
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 8l4 4 6-7"/>
                  </svg>
                ) : isActive ? (
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: PRIMARY }}/>
                ) : null}
              </div>
              <span style={{
                fontSize: 11.5, fontWeight: isActive ? 700 : 600,
                color: isDone ? "#B45309" : isActive ? "#2A2520" : "#A89E96",
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
  // Single orange brand accent (one-colour theme)
  const acc = { c: "#E8541A", c2: "#F97316", soft: "#FFF4EC", soft2: "#FFE9D8", ring: "#FBE2D2", glow: "rgba(232,84,26,0.26)" }
  const charType: keyof typeof CHARS = data.outcomeQuality === 'positive' ? "thumbsup" : data.outcomeQuality === 'concerning' ? "thinking" : "ok"

  // Stat tiles
  const stats = [
    { label: kpi.metric1Label || "Түвшин", value: data.metrics[0] ? `${data.metrics[0].score}/${data.metrics[0].maxScore}` : (data.displayScore != null ? `${data.displayScore}/${displayMax}` : "—"), color: "#B45309", bg: "#FFF6EA",
      icon: <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 12h6M9 16h6" /> },
    { label: kpi.riskLabel || "Эрсдэл", value: data.riskLevel === "Low" ? "Бага" : data.riskLevel === "Medium" ? "Дунд" : "Өндөр", color: riskColor(data.riskLevel), bg: "#FFF4EC",
      icon: <path d="M3 17l6-6 4 4 8-8M21 7v4M21 7h-4" /> },
    { label: kpi.potentialLabel || "Боломж", value: data.quitPotential === "High" ? "Өндөр" : data.quitPotential === "Medium" ? "Дунд" : "Бага", color: "#F59E0B", bg: "#FFFBEB",
      icon: <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" /> },
  ]

  const dimIcons = ["M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z", "M2 4h2v16M22 4h-2v16M4 8h16v6H4zM7 14v3M17 14v3", "M12 2a7 7 0 0 0-7 7c0 2 1 3 2 4M12 2a7 7 0 0 1 7 7c0 2-1 3-2 4M9 17h6M10 21h4"]

  return (
    <div onClick={onExpand} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ background: "#FAF6F3", borderRadius: 20, overflow: "hidden", cursor: "pointer", padding: 7, boxShadow: hov ? `0 14px 36px rgba(15,23,42,0.08), 0 0 0 1px ${acc.c}33` : "0 4px 16px rgba(15,23,42,0.06)", transform: hov ? "translateY(-2px)" : "translateY(0)", transition: "all 0.25s cubic-bezier(.16,1,.3,1)" }}>
      {/* Hero */}
      <div style={{ position: "relative", overflow: "hidden", background: `linear-gradient(150deg, ${acc.soft} 0%, ${acc.soft2} 100%)`, borderRadius: 16, padding: "14px 14px 15px", display: "flex", gap: 11, alignItems: "center" }}>
        <div style={{ position: "absolute", top: -30, right: 60, width: 80, height: 80, borderRadius: "50%", background: acc.glow, filter: "blur(24px)", pointerEvents: "none", opacity: 0.7 }} />
        {/* Ring */}
        <div style={{ position: "relative", width: 60, height: 60, flexShrink: 0 }}>
          <svg width="60" height="60" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="30" cy="30" r="24" fill="#fff" stroke={`${color}18`} strokeWidth="5" />
            <circle cx="30" cy="30" r="24" fill="none" stroke={color} strokeWidth="5" strokeDasharray={2 * Math.PI * 24} strokeDashoffset={(2 * Math.PI * 24) * (1 - Math.min(data.healthScore, 100) / 100 * (bar ? 1 : 0))} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.16,1,.3,1)" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#1F1B18", lineHeight: 1, letterSpacing: "-0.3px" }}>{scoreDisp}</span>
            <span style={{ fontSize: 8, color: "#A89E96", fontWeight: 500, marginTop: 1 }}>/{displayMax}</span>
          </div>
        </div>
        {/* Title + badge */}
        <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
          <p style={{ fontSize: 8.5, fontWeight: 700, color: acc.c, letterSpacing: "0.5px", margin: "0 0 3px", display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill={acc.c}><path d="M12 2L2 22h20L12 2zm0 4l7 14H5L12 6z"/></svg>
            AI ШИНЖИЛГЭЭ
          </p>
          <p style={{ fontSize: 12.5, fontWeight: 600, color: "#1F1B18", margin: "0 0 6px", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.1px" }}>{title}</p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(6px)", borderRadius: 10, padding: "4px 9px", border: "1px solid rgba(255,255,255,0.95)" }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill={acc.c} style={{ flexShrink: 0 }}><path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.4-6.3-4.6L5.7 21 8 14 2 9.4h7.6z"/></svg>
            <span style={{ fontSize: 10, fontWeight: 600, color: "#5B5650", lineHeight: 1.3 }}>{data.summary.title}</span>
          </div>
        </div>
        {/* Mascot */}
        <img src={CHARS[charType]} alt="" style={{ width: 52, height: "auto", flexShrink: 0, alignSelf: "flex-end", marginBottom: -4, animation: "ar-float 5s ease-in-out infinite", filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.1))" }} />
      </div>

      {/* Stat tiles */}
      <div style={{ display: "flex", background: "#fff", borderRadius: 14, padding: "10px 4px", marginTop: 6 }}>
        {stats.map((k, i) => (
          <div key={i} style={{ flex: 1, padding: "0 7px", display: "flex", alignItems: "center", gap: 8, borderRight: i < 2 ? "1px solid #FAF6F3" : "none", minWidth: 0 }}>
            <div style={{ width: 28, height: 28, borderRadius: 9, background: k.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={k.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{k.icon}</svg>
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 7.5, color: "#A89E96", fontWeight: 600, margin: "0 0 1px", letterSpacing: "0.3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k.label.toUpperCase()}</p>
              <p style={{ fontSize: 12.5, fontWeight: 700, color: "#1F1B18", margin: 0, letterSpacing: "-0.2px" }}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Dimension bars */}
      <div style={{ marginTop: 6 }}>
        {data.metrics.slice(0, 2).map((m, i) => {
          const ratio = m.maxScore > 0 ? m.score / m.maxScore : 0
          const barGrad = `linear-gradient(90deg,${PRIMARY},#FB923C)`
          const tileBg = "#FFF4EC"
          const tileCol = "#E8541A"
          return (
            <div key={i} style={{ background: "#fff", borderRadius: 13, padding: "10px 12px", marginBottom: i < Math.min(data.metrics.length, 2) - 1 ? 6 : 0, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: tileBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={tileCol} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={dimIcons[i % dimIcons.length]} /></svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, gap: 8 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: "#43403C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.1px" }}>{m.label}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: "#8A817A", flexShrink: 0, letterSpacing: "-0.2px" }}>{m.score}/{m.maxScore}</span>
                </div>
                <div style={{ background: "#FAF6F3", borderRadius: 6, height: 5, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 6, width: bar ? `${ratio * 100}%` : "0%", background: barGrad, transition: "width 1.1s cubic-bezier(.16,1,.3,1)" }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* CTA */}
      <div style={{ marginTop: 6 }}>
        <div style={{ position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: `linear-gradient(135deg, ${acc.c}, ${acc.c2})`, borderRadius: 13, padding: "12px", boxShadow: `0 4px 14px ${acc.glow}`, transform: hov ? "scale(1.01)" : "scale(1)", transition: "transform 0.2s" }}>
          <div style={{ position: "absolute", top: 0, left: 0, width: "40%", height: "100%", background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)", animation: "ar-shimmer 4s ease-in-out 1.5s infinite" }} />
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "relative" }}><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
          <span style={{ color: "#fff", fontSize: 11.5, fontWeight: 600, position: "relative", letterSpacing: "0.1px" }}>Дэлгэрэнгүй шинжилгээ харах</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: "relative" }}><path d="M9 18l6-6-6-6" /></svg>
        </div>
      </div>
    </div>
  )
}

// ── Dynamic Journey renderer ─────────────────────────────────────────────────
// Renders the AI's presentation plan (sections[]) as a guided single-scroll
// narrative. Layout, order, emphasis and tone all come from the AI — adding a
// new assessment type requires zero changes here.

// Single orange brand palette — used as THE accent across the whole report.
const ORANGE = {
  c: "#E8541A", c2: "#F97316", c3: "#FB923C",
  soft: "#FFF4EC", soft2: "#FFE9D8",
  glow: "rgba(232,84,26,0.26)", mesh: "rgba(232,84,26,0.13)",
}

// Tone themes — pure white surfaces with orange-only accents & borders.
// Differentiation between cards comes from the emoji + label, NOT from hue,
// for a clean single-colour professional look.
const TONE_THEME: Record<SectionTone, { main: string; bg: string; border: string; text: string; soft: string }> = {
  positive: { main: "#E8541A", bg: "#FFFFFF", border: "#F6DECE", text: "#9A3412", soft: "#FFF4EC" },
  warning:  { main: "#E8541A", bg: "#FFFFFF", border: "#F6DECE", text: "#9A3412", soft: "#FFF4EC" },
  info:     { main: "#E8541A", bg: "#FFFFFF", border: "#F6DECE", text: "#9A3412", soft: "#FFF4EC" },
  neutral:  { main: "#E8541A", bg: "#FFFFFF", border: "#EFE7E2", text: "#7C3A1E", soft: "#FFF7F2" },
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
            fill={ri === 0 ? "#FAF6F3" : "none"}
            stroke="#F0EAE6" strokeWidth={1} />
        ))}
        {/* Axes */}
        {data.map((_, i) => {
          const [x, y] = pt(i, R)
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#F0EAE6" strokeWidth={1} />
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
              fontSize={9.5} fontWeight={isTop ? 800 : 600} fill={isTop ? color : "#8A817A"}>
              {lines.map((ln, li) => <tspan key={li} x={lx} dy={li === 0 ? 0 : 11}>{ln}</tspan>)}
            </text>
          )
        })}
      </svg>
      {/* Ranked legend with mini bars */}
      <div style={{ width: "100%", marginTop: 6 }}>
        {data.slice(0, 8).map((it, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 0", borderBottom: i < Math.min(data.length, 8) - 1 ? "1px solid #FAF6F3" : "none" }}>
            <span style={{ width: 19, height: 19, borderRadius: 7, background: i === 0 ? color : "#FAF6F3", color: i === 0 ? "#fff" : "#A89E96", fontSize: 9.5, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
            <span style={{ flex: 1, fontSize: 12, fontWeight: i === 0 ? 800 : 600, color: i === 0 ? "#2A2520" : "#5B5650", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.title}</span>
            <div style={{ width: 46, height: 5, borderRadius: 4, background: "#FAF6F3", overflow: "hidden", flexShrink: 0 }}>
              <div style={{ height: "100%", width: `${Math.min(it.pct ?? 0, 100)}%`, background: i === 0 ? color : "#DED5CD", borderRadius: 4 }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, color: i === 0 ? color : "#A89E96", flexShrink: 0, minWidth: 34, textAlign: "right" }}>{it.meta}</span>
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

  // Pure white cards, orange-only accent & borders. Cards differ by emoji+label.
  const tones: Record<string, { main: string; bg: string; soft: string; text: string; ring: string }> = {
    positive: { main: "#E8541A", bg: "#FFFFFF", soft: "#FFF4EC", text: "#9A3412", ring: "#F6DECE" },
    warning:  { main: "#E8541A", bg: "#FFFFFF", soft: "#FFF4EC", text: "#9A3412", ring: "#F6DECE" },
    info:     { main: "#E8541A", bg: "#FFFFFF", soft: "#FFF4EC", text: "#9A3412", ring: "#F6DECE" },
    neutral:  { main: "#E8541A", bg: "#FFFFFF", soft: "#FFF7F2", text: "#7C3A1E", ring: "#EFE7E2" },
  }

  return (
    <div>
      {/* Swipeable card viewport */}
      <div style={{ overflow: "hidden", borderRadius: 20 }} onTouchStart={onTS} onTouchEnd={onTE}>
        <div style={{ display: "flex", transform: `translateX(-${idx * 100}%)`, transition: "transform 0.4s cubic-bezier(.16,1,.3,1)" }}>
          {items.map((it, i) => {
            const tk = tones[it.tone || "neutral"] || tones.neutral
            return (
              <div key={i} style={{ minWidth: "100%", boxSizing: "border-box", padding: "1px 1px 4px" }}>
                <div style={{
                  position: "relative", overflow: "hidden",
                  background: "#fff", border: `1.5px solid ${tk.ring}`, borderRadius: 16,
                  padding: "16px", minHeight: 186, display: "flex", flexDirection: "column",
                  boxShadow: "0 2px 12px rgba(20,14,10,0.05)",
                  transition: "box-shadow 0.3s ease",
                }}>
                  {/* Badge row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 13 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                      background: ORANGE.soft, border: `1px solid #F6DECE`, display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18,
                    }}>{it.emoji || "✨"}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {it.meta && <span style={{ display: "inline-block", color: ORANGE.c, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: 2 }}>{it.meta}</span>}
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#1F1B18", margin: 0, lineHeight: 1.25, letterSpacing: "-0.2px" }}>{it.title}</p>
                    </div>
                  </div>
                  {/* Detail */}
                  {it.detail && <p style={{ fontSize: 12.5, color: "#5B5650", lineHeight: 1.65, margin: 0, flex: 1, fontWeight: 400 }}>{it.detail}</p>}
                  {/* Tip strip */}
                  {it.tip && (
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", background: ORANGE.soft, borderRadius: 10, padding: "10px 12px", marginTop: 13 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={ORANGE.c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1h6c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z"/></svg>
                      <p style={{ fontSize: 11.5, color: "#9A3412", fontWeight: 500, lineHeight: 1.5, margin: 0 }}>{it.tip}</p>
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
          background: idx === 0 ? "#FAF6F3" : "#fff", boxShadow: idx === 0 ? "none" : "0 2px 8px rgba(0,0,0,0.1)",
          cursor: idx === 0 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={idx === 0 ? "#DED5CD" : "#5B5650"} strokeWidth="3" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          {items.map((_, i) => (
            <button key={i} onClick={() => go(i)} style={{
              width: i === idx ? 22 : 7, height: 7, borderRadius: 4,
              background: i === idx ? "#2A2520" : "#DED5CD", border: "none", cursor: "pointer",
              transition: "all 0.3s cubic-bezier(.34,1.56,.64,1)", padding: 0,
            }} />
          ))}
        </div>
        <button onClick={() => go(idx + 1)} disabled={idx === n - 1} style={{
          width: 34, height: 34, borderRadius: "50%", border: "none",
          background: idx === n - 1 ? "#FAF6F3" : "#fff", boxShadow: idx === n - 1 ? "none" : "0 2px 8px rgba(0,0,0,0.1)",
          cursor: idx === n - 1 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={idx === n - 1 ? "#DED5CD" : "#5B5650"} strokeWidth="3" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
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

  // ── Single brand accent: orange + white theme throughout (premium, cohesive)
  const accent = ORANGE
  const ringColor = ORANGE.c

  // Mascot reacts to the outcome — celebrate (great), thumbsup (good),
  // ok (neutral), thinking (needs attention).
  const heroChar: keyof typeof CHARS =
    data.outcomeQuality === 'positive' ? (data.isProfile ? 'thumbsup' : 'celebrate')
    : data.outcomeQuality === 'concerning' ? 'thinking'
    : 'ok'

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#FFFFFF" }} onTouchStart={onChapTS} onTouchEnd={onChapTE}>
      {/* Professional header: segmented chapter nav + thin progress underline */}
      <div style={{ flexShrink: 0, background: "#fff", borderBottom: "1px solid #F1ECE8" }}>
        <div style={{
          display: "flex", gap: 8, padding: "12px 16px 13px",
          overflowX: "auto", WebkitOverflowScrolling: "touch",
        }}>
          {chapters.map((c, i) => {
            const active = chap === i
            return (
            <button key={i} onClick={() => goChap(i)} style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 15px", borderRadius: 12, border: `1.5px solid ${active ? "transparent" : "#F0E6DF"}`,
              background: active ? `linear-gradient(135deg, ${ORANGE.c}, ${ORANGE.c2})` : "#fff",
              color: active ? "#fff" : "#9A8E86",
              fontSize: 12, fontWeight: 700, cursor: "pointer",
              whiteSpace: "nowrap", flexShrink: 0,
              boxShadow: active ? `0 5px 14px ${ORANGE.glow}` : "none",
              transition: "all 0.25s cubic-bezier(.16,1,.3,1)",
              letterSpacing: "-0.1px",
            }}>
              <span style={{ fontSize: 13, opacity: active ? 1 : 0.6 }}>{c.emoji}</span>
              {c.title}
              {active && <span style={{ fontSize: 9.5, fontWeight: 700, background: "rgba(255,255,255,0.28)", borderRadius: 8, padding: "1px 6px" }}>{i + 1}/{chapters.length}</span>}
            </button>
          )})}
        </div>
        {/* progress underline */}
        <div style={{ height: 2.5, background: "#F4EEEA", position: "relative" }}>
          <div style={{ height: "100%", width: `${((chap + 1) / chapters.length) * 100}%`, background: `linear-gradient(90deg, ${ORANGE.c}, ${ORANGE.c3})`, transition: "width 0.45s cubic-bezier(.16,1,.3,1)" }} />
        </div>
      </div>

      {/* Chapter content */}
      <div key={chap} style={{ flex: 1, overflowY: "auto", padding: "12px 14px 14px", animation: "chap-in 0.4s cubic-bezier(.16,1,.3,1)" }}>

      {/* Premium score hero — only on first chapter, always server data */}
      {chap === 0 && (
      <div style={{
        position: "relative", borderRadius: 22, padding: "20px 18px", marginBottom: 14,
        background: "#fff",
        boxShadow: `0 4px 20px rgba(232,84,26,0.07)`,
        border: `1.5px solid #F3DDD0`, overflow: "hidden",
        animation: "ci 0.5s cubic-bezier(.16,1,.3,1) both",
      }}>
        {/* Subtle orange accent bar on the left edge */}
        <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 4, background: `linear-gradient(180deg, ${ORANGE.c}, ${ORANGE.c3})` }} />

        {data.isProfile ? (
          /* Profile hero — dominant type, clean */
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 13 }}>
              <div style={{ position: "relative", flexShrink: 0, width: 60, height: 60, borderRadius: 16, background: `linear-gradient(135deg, ${ORANGE.c}, ${ORANGE.c2})`, display: "flex", alignItems: "flex-end", justifyContent: "center", boxShadow: `0 6px 16px ${ORANGE.glow}`, overflow: "hidden" }}>
                <img src={CHARS[heroChar]} alt="" style={{ width: 50, height: "auto", marginBottom: -3 }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 9.5, fontWeight: 700, color: ORANGE.c, letterSpacing: "0.5px", margin: "0 0 3px", textTransform: "uppercase" }}>Таны давамгай дүр</p>
                <p style={{ fontSize: 19, fontWeight: 700, color: "#1F1B18", margin: 0, lineHeight: 1.15, letterSpacing: "-0.3px" }}>{data.dominantLabel || data.displayLabel}</p>
                {data.secondaryLabel && <p style={{ fontSize: 11.5, color: "#A89E96", margin: "3px 0 0", fontWeight: 500 }}>2-рт: {data.secondaryLabel}</p>}
              </div>
            </div>
            <p style={{ fontSize: 12.5, color: "#5B5650", lineHeight: 1.6, margin: 0, fontWeight: 400, position: "relative" }}>
              {data.opening || data.summary.description}
            </p>
          </div>
        ) : (
          /* Score hero — ring + label, clean and clinical */
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ flexShrink: 0 }}>
              <ScoreRing score={data.healthScore} size={88} display={data.displayScore != null && data.displayMaxScore ? { score: data.displayScore, max: data.displayMaxScore } : undefined} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {data.displayLabel && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: ORANGE.soft, color: ORANGE.c, fontSize: 11, fontWeight: 700, padding: "5px 11px", borderRadius: 8, marginBottom: 9, border: `1px solid #F6DECE`, letterSpacing: "-0.1px" }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: ORANGE.c }} />
                  {data.displayLabel}
                </span>
              )}
              <p style={{ fontSize: 12.5, color: "#5B5650", lineHeight: 1.6, margin: 0, fontWeight: 400 }}>
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
              <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#2A2520" }}>{s.title}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A89E96" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
            </button>
          )
        }

        const chapEntries = chapters[chap]?.entries || []
        const localIdx = chapEntries.findIndex(e => e.si === si)
        // Hero sections always use the orange brand surface; the per-section
        // icon tile keeps a small tone-coloured accent for semantic signal.
        return (
          <div key={si} style={{
            position: "relative", overflow: "hidden",
            background: "#fff",
            border: `1.5px solid ${isHero ? "#F3DDD0" : "#EFEDEB"}`,
            borderRadius: isHero ? 20 : 16,
            padding: isHero ? "18px 16px 18px 18px" : "16px 14px",
            marginBottom: 12,
            boxShadow: isHero ? `0 4px 18px rgba(232,84,26,0.06)` : "0 2px 12px rgba(20,14,10,0.04)",
            animation: `ci 0.4s cubic-bezier(.16,1,.3,1) ${(localIdx < 0 ? 0 : localIdx) * 0.08}s both`,
          }}>
            {isHero && <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 4, background: `linear-gradient(180deg, ${ORANGE.c}, ${ORANGE.c3})` }} />}
            {/* Section header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: s.body || s.items.length ? 11 : 0 }}>
              <div style={{
                width: isHero ? 38 : 30, height: isHero ? 38 : 30, borderRadius: isHero ? 12 : 9,
                background: isHero ? `linear-gradient(135deg, ${ORANGE.c}, ${ORANGE.c2})` : ORANGE.soft,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: isHero ? 18 : 15, flexShrink: 0,
                boxShadow: isHero ? `0 3px 10px ${ORANGE.glow}` : "none",
                border: isHero ? "none" : `1px solid #F6DECE`,
              }}>{s.emoji}</div>
              <p style={{ fontSize: isHero ? 15 : 13.5, fontWeight: 700, color: "#1F1B18", margin: 0, flex: 1, lineHeight: 1.3, letterSpacing: "-0.2px" }}>{s.title}</p>
              {(s.priority === 'low' || !s.expanded) && (
                <button onClick={() => toggleOpen(si)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B8AEA6" strokeWidth="2.5" strokeLinecap="round"><path d="M18 15l-6-6-6 6"/></svg>
                </button>
              )}
            </div>

            {s.body && (
              <p style={{ fontSize: 12.5, color: "#5B5650", lineHeight: 1.65, margin: s.items.length ? "0 0 13px" : 0, fontWeight: 400 }}>{s.body}</p>
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
                  <div key={ii} style={{ marginBottom: ii < s.items.length - 1 ? 12 : 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#5B5650" }}>{it.title}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: ORANGE.c }}>{it.meta}</span>
                    </div>
                    <div style={{ height: 8, background: "#F4F1EF", borderRadius: 6, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(it.pct ?? 0, 100)}%`, background: `linear-gradient(90deg, ${ORANGE.c}, ${ORANGE.c3})`, borderRadius: 6, transition: "width 0.9s cubic-bezier(.16,1,.3,1)", boxShadow: `0 1px 4px ${ORANGE.glow}` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {s.layout === "quotes" && s.items.map((it, ii) => (
              <div key={ii} style={{ borderLeft: `3px solid ${t.main}`, background: t.bg, borderRadius: "0 12px 12px 0", padding: "10px 12px", marginBottom: ii < s.items.length - 1 ? 8 : 0 }}>
                {it.title && <p style={{ fontSize: 11, fontWeight: 800, color: t.text, margin: "0 0 3px" }}>{it.title}</p>}
                {it.text && <p style={{ fontSize: 12, color: "#5B5650", fontStyle: "italic", lineHeight: 1.5, margin: 0 }}>"{it.text}"</p>}
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
                  {it.title && <p style={{ fontSize: 12.5, fontWeight: 800, color: "#2A2520", margin: "0 0 2px", lineHeight: 1.35 }}>{it.title}</p>}
                  {it.text && <p style={{ fontSize: 11.5, color: "#8A817A", lineHeight: 1.5, margin: 0 }}>{it.text}</p>}
                </div>
              </div>
            ))}

            {s.layout === "grid" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {s.items.map((it, ii) => (
                  <div key={ii} style={{ background: t.bg, borderRadius: 14, padding: "12px 10px", textAlign: "center" }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{it.emoji || s.emoji}</div>
                    <p style={{ fontSize: 11.5, fontWeight: 800, color: "#2A2520", margin: "0 0 2px" }}>{it.title}</p>
                    {it.text && <p style={{ fontSize: 10.5, color: "#8A817A", margin: 0, lineHeight: 1.4 }}>{it.text}</p>}
                  </div>
                ))}
              </div>
            )}

            {s.layout === "timeline" && (
              <div style={{ position: "relative", paddingLeft: 28 }}>
                <div style={{ position: "absolute", left: 10, top: 10, bottom: 10, width: 2, background: "#F1E6DF" }} />
                {s.items.map((it, ii) => (
                  <div key={ii} style={{ position: "relative", marginBottom: ii < s.items.length - 1 ? 16 : 0 }}>
                    <div style={{
                      position: "absolute", left: -28, top: -1,
                      width: 22, height: 22, borderRadius: "50%",
                      background: "#fff", color: ORANGE.c,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700,
                      border: `2px solid ${ORANGE.c}`,
                    }}>{ii + 1}</div>
                    {it.meta && <p style={{ fontSize: 9.5, fontWeight: 700, color: ORANGE.c, letterSpacing: "0.5px", margin: "0 0 2px", textTransform: "uppercase" }}>{it.meta}</p>}
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#1F1B18", margin: "0 0 3px", letterSpacing: "-0.2px" }}>{it.title}</p>
                    {it.text && <p style={{ fontSize: 12, color: "#5B5650", lineHeight: 1.6, margin: 0, fontWeight: 400 }}>{it.text}</p>}
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
                  {/* Celebration banner when all done */}
                  {allDone && (
                    <div style={{ position: "relative", overflow: "hidden", display: "flex", alignItems: "center", gap: 10, background: "linear-gradient(135deg,#FFF7F1,#FFEEDF)", border: `1.5px solid #FBD9C4`, borderRadius: 16, padding: "10px 12px", marginBottom: 10, animation: "ar-pop-b 0.5s cubic-bezier(.16,1,.3,1) both" }}>
                      {[0,1,2,3,4,5].map(ci => (
                        <span key={ci} style={{ position: "absolute", top: -6, left: `${12 + ci * 16}%`, width: 6, height: 6, borderRadius: 2, background: ["#C2740C","#FBBF24","#F97316","#EA580C","#E8541A","#D98324"][ci], animation: `ar-confetti ${1.2 + ci * 0.15}s ease-in ${ci * 0.1}s infinite` }} />
                      ))}
                      <img src={CHARS.celebrate} alt="" style={{ width: 38, height: "auto", animation: "ar-float2 2.5s ease-in-out infinite" }} />
                      <div style={{ position: "relative" }}>
                        <p style={{ fontSize: 12.5, fontWeight: 800, color: "#9A3412", margin: 0 }}>Гайхалтай! Бүгдийг хийлээ 🎉</p>
                        <p style={{ fontSize: 10.5, color: "#C2410C", margin: "1px 0 0" }}>Өнөөдрийн алхмаа дуусгасан танд баяр хүргэе</p>
                      </div>
                    </div>
                  )}
                  {/* Progress header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#9A8E86" }}>
                      {allDone ? "Бүгдийг гүйцэтгэлээ!" : `${doneCount}/${total} гүйцэтгэсэн`}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: allDone ? ORANGE.c : "#9A8E86" }}>{pct}%</span>
                  </div>
                  <div style={{ height: 7, background: "#F2EFEC", borderRadius: 5, overflow: "hidden", marginBottom: 12 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${ORANGE.c}, ${ORANGE.c3})`, borderRadius: 5, transition: "width 0.5s cubic-bezier(.16,1,.3,1)", boxShadow: pct > 0 ? `0 0 8px ${ORANGE.glow}` : "none" }} />
                  </div>
                  {s.items.map((it, ii) => {
                    const k = `${si}-${ii}`
                    const checked = !!done[k]
                    return (
                      <button key={ii} onClick={() => toggleDone(k)} style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 11,
                        background: checked ? "linear-gradient(135deg,#FFF7F1,#FFF1E8)" : "#fff",
                        border: `1.5px solid ${checked ? "#FBD9C4" : "#F0EDEA"}`,
                        borderRadius: 15, padding: "13px 13px",
                        marginBottom: ii < s.items.length - 1 ? 8 : 0,
                        cursor: "pointer", textAlign: "left", transition: "all 0.25s cubic-bezier(.16,1,.3,1)",
                        boxShadow: checked ? `0 2px 10px ${ORANGE.glow}` : "0 1px 4px rgba(0,0,0,0.03)",
                      }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                          border: `2px solid ${checked ? ORANGE.c : "#D8D5D1"}`,
                          background: checked ? `linear-gradient(135deg,${ORANGE.c2},${ORANGE.c})` : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.25s", transform: checked ? "scale(1.08)" : "scale(1)",
                          boxShadow: checked ? `0 3px 8px ${ORANGE.glow}` : "none",
                        }}>
                          {checked
                            ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                            : <span style={{ fontSize: 10, fontWeight: 800, color: "#9A8E86" }}>{ii + 1}</span>}
                        </div>
                        <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: checked ? "#9A8E86" : "#2A2520", textDecoration: checked ? "line-through" : "none", lineHeight: 1.4, transition: "color 0.2s" }}>
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
          position: "relative",
          background: "#fff",
          border: `1.5px solid #F0EAE6`, borderRadius: 18, padding: "16px",
          marginBottom: 6, boxShadow: "0 2px 14px rgba(20,14,10,0.05)",
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 13 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: ORANGE.soft, border: `1px solid #F6DECE`, display: "flex", alignItems: "flex-end", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
              <img src={CHARS.phone} alt="" style={{ width: 36, height: "auto", marginBottom: -2 }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13.5, fontWeight: 700, color: "#1F1B18", margin: "0 0 2px", letterSpacing: "-0.2px" }}>AI зөвлөхөөс асуух</p>
              <p style={{ fontSize: 11, color: "#8A817A", margin: 0, lineHeight: 1.4 }}>Үр дүнгийнхээ талаар юу ч асууж болно</p>
            </div>
          </div>
          {/* Suggested question chips */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {suggestions.map((q, i) => (
              <button key={i} onClick={() => onAskAI(q)} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                width: "100%", background: "#FFFBF8", border: `1.5px solid #F2E7DF`,
                borderRadius: 12, padding: "12px 14px", cursor: "pointer", textAlign: "left",
                transition: "all 0.2s",
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#43403C", letterSpacing: "-0.1px" }}>{q}</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={ORANGE.c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M9 18l6-6-6-6"/></svg>
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
        padding: "10px 14px", background: "#fff", borderTop: "1px solid #F1ECE8", flexShrink: 0,
      }}>
        <button onClick={() => goChap(chap - 1)} disabled={chap === 0} style={{
          display: "flex", alignItems: "center", gap: 5,
          background: "#fff", border: `1.5px solid ${chap === 0 ? "#F4EEEA" : "#F0E6DF"}`, borderRadius: 12,
          padding: "8px 14px", fontSize: 11.5, fontWeight: 700,
          color: chap === 0 ? "#D6CEC8" : "#7C6F66",
          cursor: chap === 0 ? "default" : "pointer", transition: "all 0.2s",
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          Өмнөх
        </button>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          {chapters.map((_, i) => (
            <button key={i} onClick={() => goChap(i)} style={{
              width: i === chap ? 20 : 6, height: 6, borderRadius: 4,
              background: i === chap ? ORANGE.c : "#EFE3DB", border: "none", cursor: "pointer",
              transition: "all 0.3s cubic-bezier(.34,1.56,.64,1)", padding: 0,
            }} />
          ))}
        </div>
        <button onClick={() => isLastChap ? onAskAI("Миний үр дүнгийн хамгийн чухал зүйл юу вэ?") : goChap(chap + 1)} style={{
          display: "flex", alignItems: "center", gap: 5,
          background: `linear-gradient(135deg, ${ORANGE.c}, ${ORANGE.c2})`,
          border: "none", borderRadius: 12,
          padding: "9px 18px", fontSize: 11.5, fontWeight: 700, color: "#fff",
          cursor: "pointer", transition: "all 0.2s",
          boxShadow: `0 5px 14px ${ORANGE.glow}`,
        }}>
          {isLastChap ? "AI-аас асуух" : "Дараах"}
          {!isLastChap && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>}
        </button>
      </div>
    </div>
  )
}

// ── Full Results ──────────────────────────────────────────────────────────────
// Animated background motif for the insight cards — cycles between a flowing
// wave, pulsing neurons, and an expanding ring so each card feels alive.
function InsightMotif({ idx }: { idx: number }) {
  if (idx === 1) {
    return (
      <svg width="120" height="64" viewBox="0 0 120 64" style={{ position: "absolute", left: 10, bottom: 12 }}>
        <line x1="28" y1="28" x2="58" y2="18" stroke="rgba(255,255,255,.4)" strokeWidth="2" />
        <line x1="28" y1="28" x2="52" y2="46" stroke="rgba(255,255,255,.4)" strokeWidth="2" />
        <line x1="58" y1="18" x2="88" y2="33" stroke="rgba(255,255,255,.4)" strokeWidth="2" />
        <line x1="52" y1="46" x2="88" y2="33" stroke="rgba(255,255,255,.4)" strokeWidth="2" />
        <circle cx="28" cy="28" r="6" fill="#fff"><animate attributeName="r" values="6;8;6" dur="1.6s" repeatCount="indefinite" /></circle>
        <circle cx="58" cy="18" r="5" fill="#fff" opacity="0.85"><animate attributeName="opacity" values=".4;1;.4" dur="1.8s" repeatCount="indefinite" /></circle>
        <circle cx="88" cy="33" r="6.5" fill="#fff"><animate attributeName="r" values="6.5;9;6.5" dur="2s" repeatCount="indefinite" begin="0.3s" /></circle>
        <circle cx="52" cy="46" r="5" fill="#fff" opacity="0.8"><animate attributeName="opacity" values=".4;1;.4" dur="1.5s" repeatCount="indefinite" begin="0.6s" /></circle>
      </svg>
    )
  }
  if (idx === 2) {
    return (
      <svg width="84" height="74" viewBox="0 0 84 74" style={{ position: "absolute", left: 14, bottom: 8 }}>
        <circle cx="34" cy="38" r="10" fill="none" stroke="#fff" strokeWidth="2.5" />
        <circle cx="34" cy="38" r="10" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="2">
          <animate attributeName="r" values="10;26;10" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values=".7;0;.7" dur="2.4s" repeatCount="indefinite" />
        </circle>
        <path d="M34 32v6l4 3" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </svg>
    )
  }
  return (
    <svg width="100%" height="56" viewBox="0 0 220 56" style={{ position: "absolute", left: 0, bottom: 16 }} fill="none">
      <path d="M5 36 Q 30 36 40 20 T 80 30 T 120 14 T 160 34 T 215 22" stroke="rgba(255,255,255,.92)" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="2 11">
        <animate attributeName="stroke-dashoffset" values="0;-26" dur="1.3s" repeatCount="indefinite" />
      </path>
    </svg>
  )
}

// Warm liquid-glass analysis view — the approved dashboard redesign. Self-
// contained (segmented tabs + bottom nav) and data-driven, so EVERY test gets
// the same look (replaces the legacy overview / journey / insights pages).
function WarmOverview({ data, onAskAI, onClose }: { data: AnalysisData; onAskAI: (q: string) => void; onClose?: () => void }) {
  const [tab, setTab] = useState(0)
  const rawScore = data.displayScore != null ? data.displayScore : Math.round(data.healthScore)
  const rawMax = data.displayScore != null ? (data.displayMaxScore || 100) : 100
  const band = data.displayLabel || data.summary?.title || ""
  const message = data.highlightMessage || data.summary?.description || ""
  const metrics = data.metrics || []
  const riskLabel = data.riskLevel === "Low" ? "Бага" : data.riskLevel === "Medium" ? "Дунд" : data.riskLevel === "High" ? "Өндөр" : (data.riskLevel || "—")
  const advice = (data.insights || []).filter(x => x && (x.title || x.description))
  // Which end of the scale needs attention depends on the test's direction.
  // On a symptom test (low-good) the HIGHEST sub-score is the problem area; on a
  // strength/profile test the LOWEST is the least developed one. Picking the
  // lowest unconditionally labelled the mildest symptom as the "weak spot".
  const symptomTest = data.scoreDirection === "low-good"
  const concern = metrics.length ? metrics.reduce((a, b) => {
    const ra = a.maxScore ? a.score / a.maxScore : 0, rb = b.maxScore ? b.score / b.maxScore : 0
    return (symptomTest ? rb > ra : rb < ra) ? b : a
  }) : null
  const weakest = concern
  const weakestLabel = symptomTest ? "Хамгийн их анхаарах" : "Сул тал"
  const concernScorePct = concern && concern.maxScore ? Math.round((concern.score / concern.maxScore) * 100) : 0
  // How much attention this area needs — a high symptom score and a low strength
  // score both mean "needs attention", so invert for non-symptom tests.
  const concernPct = symptomTest ? concernScorePct : 100 - concernScorePct
  const concernLevel = concernPct >= 66 ? "Өндөр" : concernPct >= 33 ? "Дунд" : "Бага"
  const todos = ((data.todayGoals && data.todayGoals.length ? data.todayGoals : (data.roadmap || []).flatMap(r => r.tasks || [])) || []).filter(Boolean).slice(0, 6)
  const [done, setDone] = useState<number[]>([])
  const toggleDone = (i: number) => setDone(d => d.includes(i) ? d.filter(x => x !== i) : [...d, i])
  // Tap-to-expand for the "Гол ойлголтууд" cards — cards clamp their text, the
  // sheet shows the full insight.
  const [openInsight, setOpenInsight] = useState<number | null>(null)

  const barC = (p: number) => p >= 70 ? "#E8541A" : p >= 45 ? "#F06835" : "#D9892B"
  const barC2 = (p: number) => p >= 70 ? "#FF8A4C" : p >= 45 ? "#FF9F5A" : "#F0C068"
  const glass = {
    background: "linear-gradient(160deg, rgba(255,255,255,0.82), rgba(255,251,248,0.55))",
    backdropFilter: "blur(20px) saturate(175%)",
    WebkitBackdropFilter: "blur(20px) saturate(175%)",
    border: "1px solid rgba(232,84,26,0.14)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 8px 22px rgba(176,80,30,0.06)",
  }
  const TABS = ["Тойм", "Дэд бүлэг", "Зөвлөмж"]
  const navBtn = { width: 44, height: 44, borderRadius: "50%", border: "none", background: "transparent", color: "#9A8E86", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 50, background: "#FAF6F2", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif", animation: "ar-in 0.3s ease" }}>
      <style>{`@keyframes ar-in{from{opacity:0;transform:scale(0.985)}to{opacity:1;transform:none}}.ar-car{scrollbar-width:none}.ar-car::-webkit-scrollbar{display:none}`}</style>
      <div style={{ position: "absolute", top: -40, right: -30, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,138,76,0.16), transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: 110, left: -40, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,170,115,0.12), transparent 72%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, flex: 1, overflowY: "auto", overflowX: "hidden", padding: "16px 15px 14px" }}>
        {/* Segmented tabs */}
        <div style={{ display: "flex", borderRadius: 18, padding: 5, marginBottom: tab === 0 ? 34 : 16, ...glass }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{ flex: 1, padding: "9px 0", borderRadius: 14, border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "center", background: tab === i ? "linear-gradient(160deg,#fff,#FFF7F2)" : "transparent", fontSize: 13, fontWeight: tab === i ? 700 : 500, color: tab === i ? "#E8541A" : "#9A8E86", boxShadow: tab === i ? "0 3px 10px rgba(232,84,26,0.12)" : "none", transition: "all 0.25s" }}>{t}</button>
          ))}
        </div>

        {/* ── TAB 0: Тойм ── */}
        {tab === 0 && (
          <>
            <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
              <div style={{ position: "absolute", top: -22, width: 66, height: 66, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3, ...glass }}>
                <ScoreRing score={data.healthScore} size={56} display={data.displayScore != null && data.displayMaxScore ? { score: data.displayScore, max: data.displayMaxScore } : undefined} />
              </div>
              <div style={{ position: "relative", width: "100%", background: "linear-gradient(150deg, #FF8A4C 0%, #E8541A 60%, #D9472A 100%)", borderRadius: 26, padding: "46px 22px 20px", overflow: "hidden", boxShadow: "0 14px 34px rgba(216,71,42,0.28)" }}>
                <svg style={{ position: "absolute", top: -26, right: -26, opacity: 0.2 }} width="140" height="140" viewBox="0 0 140 140" fill="none" stroke="#fff" strokeWidth="2"><circle cx="70" cy="70" r="38"/><circle cx="70" cy="70" r="55"/><circle cx="70" cy="70" r="72"/></svg>
                {band && <div style={{ position: "relative", display: "inline-block", background: "rgba(255,255,255,0.22)", color: "#fff", fontSize: 11, fontWeight: 600, padding: "4px 11px", borderRadius: 20, marginBottom: 10 }}>{band}</div>}
                {message && <div style={{ position: "relative", color: "#fff", fontSize: 16, fontWeight: 700, lineHeight: 1.45 }}>{message}</div>}
                <div style={{ position: "relative", display: "flex", gap: 10, marginTop: 18 }}>
                  <button onClick={() => onAskAI("Энэ үр дүнгийн талаар дэлгэрэнгүй тайлбарлаач")} style={{ flex: 1, border: "1.5px solid rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.12)", color: "#fff", borderRadius: 15, padding: "11px 0", fontSize: 13.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>Дэлгэрэнгүй</button>
                  <button onClick={() => onAskAI("Энэ үр дүнд тулгуурлан надад зөвлөгөө өгөөч")} style={{ flex: 1.25, border: "none", background: "#fff", color: "#D9472A", borderRadius: 15, padding: "11px 0", fontSize: 13.5, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>Зөвлөгөө авах</button>
                </div>
              </div>
            </div>

            {metrics.length > 0 && (
              <div style={{ borderRadius: 24, padding: "17px 18px", marginTop: 14, ...glass }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 13 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#2A2520" }}>Дэд бүлгийн задаргаа</span>
                  <span style={{ fontSize: 11, color: "#9A8E86" }}>оноо</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                  {metrics.slice(0, 6).map((m, i) => {
                    const pct = m.maxScore > 0 ? Math.round((m.score / m.maxScore) * 100) : 0
                    return (
                      <div key={i}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, gap: 8 }}>
                          <span style={{ fontSize: 12.5, color: "#43403C", display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: barC(pct), flexShrink: 0 }} />
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.label}</span>
                          </span>
                          <span style={{ fontSize: 12.5, fontWeight: 800, color: "#2A2520", flexShrink: 0 }}>{m.score}<span style={{ fontSize: 10, color: "#9A8E86", fontWeight: 500 }}>/{m.maxScore}</span></span>
                        </div>
                        <div style={{ height: 7, borderRadius: 5, background: "rgba(232,84,26,0.1)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, borderRadius: 5, background: `linear-gradient(90deg, ${barC2(pct)}, ${barC(pct)})` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
              <div style={{ borderRadius: 22, padding: 16, ...glass }}>
                <div style={{ fontSize: 12, color: "#9A8E86" }}>Нийт оноо</div>
                <div style={{ fontSize: 24, fontWeight: 800, margin: "1px 0 12px" }}>{rawScore}<span style={{ fontSize: 12, color: "#9A8E86", fontWeight: 500 }}>/{rawMax}</span></div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 40 }}>
                  {(metrics.length ? metrics : [{ score: 1, maxScore: 1, label: "", status: "" }]).slice(0, 5).map((m, i) => {
                    const p = m.maxScore > 0 ? m.score / m.maxScore : 0
                    return <div key={i} style={{ flex: 1, height: `${Math.max(14, Math.round(p * 100))}%`, borderRadius: 5, background: i === 0 ? "linear-gradient(180deg,#FF8A4C,#E8541A)" : "#F6DECE" }} />
                  })}
                </div>
              </div>
              <div style={{ borderRadius: 22, padding: 16, ...glass }}>
                <div style={{ fontSize: 12, color: "#9A8E86" }}>{weakestLabel}</div>
                <div style={{ fontSize: 15, fontWeight: 800, margin: "3px 0 10px", lineHeight: 1.2, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{weakest ? weakest.label : "—"}</div>
                <svg width="100%" height="36" viewBox="0 0 120 38" fill="none">
                  <path d="M4 9 L28 16 L46 11 L70 24 L92 20 L116 31" stroke="#E8541A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="116" cy="31" r="4" fill="#E8541A"/>
                </svg>
              </div>
            </div>
          </>
        )}

        {/* ── TAB 1: Дэд бүлэг ── */}
        {tab === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {metrics.length === 0 && <div style={{ borderRadius: 20, padding: 18, textAlign: "center", color: "#9A8E86", fontSize: 13, ...glass }}>Дэд бүлгийн мэдээлэл алга.</div>}
            {metrics.map((m, i) => {
              const pct = m.maxScore > 0 ? Math.round((m.score / m.maxScore) * 100) : 0
              return (
                <div key={i} style={{ borderRadius: 20, padding: "15px 16px", ...glass }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 8 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: "#2A2520", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.label}</span>
                    <span style={{ fontSize: 16, fontWeight: 900, color: barC(pct), flexShrink: 0 }}>{m.score}<span style={{ fontSize: 11, color: "#9A8E86", fontWeight: 600 }}>/{m.maxScore}</span></span>
                  </div>
                  <div style={{ height: 8, borderRadius: 5, background: "rgba(232,84,26,0.1)", overflow: "hidden", marginBottom: m.status ? 8 : 0 }}>
                    <div style={{ height: "100%", width: `${pct}%`, borderRadius: 5, background: `linear-gradient(90deg, ${barC2(pct)}, ${barC(pct)})` }} />
                  </div>
                  {m.status && <div style={{ fontSize: 12, color: "#7C6F66", lineHeight: 1.5 }}>{m.status}</div>}
                </div>
              )
            })}
          </div>
        )}

        {/* ── TAB 2: Зөвлөмж ── */}
        {tab === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Гол анхаарах (no score — that lives on the Тойм tab) */}
            {concern && (
              <div style={{ borderRadius: 22, padding: "15px 16px", ...glass }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#9A8E86", fontWeight: 700, letterSpacing: 0.4, marginBottom: 9 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#E8541A" }} />ГОЛ АНХААРАХ
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 9, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{concern.label}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{ flex: 1, height: 9, borderRadius: 6, background: "rgba(232,84,26,0.1)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${concernPct}%`, borderRadius: 6, background: "linear-gradient(90deg,#FF8A4C,#E8541A)" }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#E8541A", whiteSpace: "nowrap" }}>{concernLevel}</span>
                </div>
              </div>
            )}

            {/* Action plan — interactive checklist */}
            {todos.length > 0 && (
              <div style={{ borderRadius: 22, padding: "16px 17px", ...glass }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700 }}>Юунаас эхлэх вэ?</div>
                    <div style={{ fontSize: 11, color: "#9A8E86", marginTop: 1 }}>Дарж тэмдэглээрэй</div>
                  </div>
                  <svg width="46" height="46" viewBox="0 0 46 46">
                    <circle cx="23" cy="23" r="18" fill="none" stroke="rgba(232,84,26,0.12)" strokeWidth="5" />
                    <circle cx="23" cy="23" r="18" fill="none" stroke="#E8541A" strokeWidth="5" strokeLinecap="round" strokeDasharray={2 * Math.PI * 18} strokeDashoffset={2 * Math.PI * 18 * (1 - done.length / todos.length)} transform="rotate(-90 23 23)" style={{ transition: "stroke-dashoffset 0.5s cubic-bezier(.34,1.56,.64,1)" }} />
                    <text x="23" y="27" textAnchor="middle" fontSize="12" fontWeight="800" fill="#E8541A">{done.length}/{todos.length}</text>
                  </svg>
                </div>
                <div style={{ marginTop: 4 }}>
                  {todos.map((t, i) => {
                    const on = done.includes(i)
                    return (
                      <div key={i} onClick={() => toggleDone(i)} style={{ display: "flex", alignItems: "flex-start", gap: 11, padding: "11px 0", cursor: "pointer", borderBottom: i < todos.length - 1 ? "1px solid rgba(232,84,26,0.07)" : "none" }}>
                        <span style={{ width: 23, height: 23, borderRadius: 8, flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s cubic-bezier(.34,1.56,.64,1)", border: on ? "2px solid #E8541A" : "2px solid #E8BFA8", background: on ? "linear-gradient(135deg,#FF8A4C,#E8541A)" : "rgba(255,255,255,0.5)" }}>
                          {on && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
                        </span>
                        <span style={{ fontSize: 13, lineHeight: 1.45, color: on ? "#B8AEA6" : "#43403C", textDecoration: on ? "line-through" : "none", transition: "color 0.3s" }}>{t}</span>
                      </div>
                    )
                  })}
                </div>
                {done.length === todos.length && (
                  <div style={{ marginTop: 11, textAlign: "center", fontSize: 12.5, fontWeight: 700, color: "#E8541A", background: "linear-gradient(160deg,#FFEEE4,#FBD9C4)", borderRadius: 13, padding: 10 }}>Бүгдийг тэмдэглэлээ! Сайн эхлэл 🎉</div>
                )}
              </div>
            )}

            {/* Гол ойлголтууд — animated swipeable carousel */}
            {advice.length > 0 && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 11 }}>
                  <div style={{ fontSize: 15, fontWeight: 800 }}>Гол ойлголтууд</div>
                  <div style={{ fontSize: 11, color: "#B8AEA6", display: "flex", alignItems: "center", gap: 4 }}>гүйлгэх<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M9 6l6 6-6 6" /></svg></div>
                </div>
                <div className="ar-car" style={{ display: "flex", gap: 13, overflowX: "auto", scrollSnapType: "x mandatory", paddingBottom: 6 }}>
                  {advice.map((x, i) => (
                    <div key={i} onClick={() => setOpenInsight(i)} style={{ flex: "0 0 76%", scrollSnapAlign: "center", borderRadius: 24, overflow: "hidden", cursor: "pointer", ...glass }}>
                      <div style={{ position: "relative", height: 104, padding: 13, display: "flex", alignItems: "flex-end", background: ["linear-gradient(135deg,#FF9259,#E8541A)", "linear-gradient(135deg,#FFA84C,#F06835)", "linear-gradient(135deg,#FF7A45,#D9472A)"][i % 3] }}>
                        <span style={{ position: "absolute", top: 12, right: 14, fontSize: 30 }}>{x.emoji || "💡"}</span>
                        <InsightMotif idx={i % 3} />
                        {x.title && <span style={{ position: "relative", fontSize: 11, fontWeight: 700, color: "#fff", background: "rgba(255,255,255,0.25)", padding: "4px 10px", borderRadius: 20, maxWidth: "72%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{x.title}</span>}
                      </div>
                      <div style={{ padding: "14px 15px", background: "rgba(255,255,255,0.55)" }}>
                        <div style={{ fontSize: 12.8, color: "#7C6F66", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{x.description || x.detail || ""}</div>
                        <div style={{ marginTop: 9, display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "#E8541A" }}>
                          Дэлгэрэнгүй
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M7 13l5 5 5-5M7 6l5 5 5-5" /></svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => onAskAI("Энэ үр дүнд тулгуурлан надад дэлгэрэнгүй зөвлөгөө, төлөвлөгөө гаргаж өгөөч")} style={{ marginTop: 2, border: "none", borderRadius: 16, padding: "13px 0", background: "linear-gradient(135deg,#FF8A4C,#E8541A)", color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", boxShadow: "0 6px 16px rgba(232,84,26,0.3)" }}>AI-аас зөвлөгөө авах</button>
          </div>
        )}
      </div>

      {/* Гол ойлголт — tap-to-expand bottom sheet */}
      {openInsight !== null && advice[openInsight] && (() => {
        const x = advice[openInsight]
        return (
          <div
            onClick={() => setOpenInsight(null)}
            style={{ position: "absolute", inset: 0, zIndex: 60, background: "rgba(38,28,22,0.42)", backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)", display: "flex", alignItems: "flex-end", animation: "ar-fade 0.2s ease" }}
          >
            <style>{`@keyframes ar-fade{from{opacity:0}to{opacity:1}}@keyframes ar-sheet{from{transform:translateY(100%)}to{transform:none}}`}</style>
            <div
              onClick={e => e.stopPropagation()}
              style={{ width: "100%", maxHeight: "82%", overflowY: "auto", background: "#FFFDFB", borderRadius: "26px 26px 0 0", boxShadow: "0 -12px 40px rgba(176,80,30,0.25)", animation: "ar-sheet 0.32s cubic-bezier(.16,1,.3,1)" }}
            >
              {/* Grab handle */}
              <div style={{ display: "flex", justifyContent: "center", paddingTop: 10 }}>
                <div style={{ width: 40, height: 5, borderRadius: 3, background: "rgba(232,84,26,0.22)" }} />
              </div>
              {/* Gradient header */}
              <div style={{ position: "relative", margin: "12px 14px 0", borderRadius: 20, overflow: "hidden", padding: "18px 18px 16px", display: "flex", alignItems: "center", gap: 12, background: ["linear-gradient(135deg,#FF9259,#E8541A)", "linear-gradient(135deg,#FFA84C,#F06835)", "linear-gradient(135deg,#FF7A45,#D9472A)"][openInsight % 3] }}>
                <span style={{ fontSize: 34, flexShrink: 0 }}>{x.emoji || "💡"}</span>
                <div style={{ color: "#fff", fontSize: 16.5, fontWeight: 800, lineHeight: 1.3 }}>{x.title || "Гол ойлголт"}</div>
                <button onClick={() => setOpenInsight(null)} aria-label="Хаах" style={{ position: "absolute", top: 12, right: 12, width: 30, height: 30, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.28)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
              {/* Body */}
              <div style={{ padding: "16px 18px 8px" }}>
                {x.description && <div style={{ fontSize: 14, color: "#43403C", lineHeight: 1.6 }}>{x.description}</div>}
                {x.detail && (
                  <div style={{ marginTop: 14, borderRadius: 16, padding: "13px 15px", background: "#FFF3EC", border: "1px solid rgba(232,84,26,0.16)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, color: "#E8541A", letterSpacing: 0.3, marginBottom: 6 }}>
                      <span style={{ fontSize: 13 }}>💡</span>ЗӨВЛӨМЖ
                    </div>
                    <div style={{ fontSize: 13.5, color: "#5C534C", lineHeight: 1.55 }}>{x.detail}</div>
                  </div>
                )}
              </div>
              {/* Ask AI about this insight */}
              <div style={{ padding: "6px 18px 20px" }}>
                <button
                  onClick={() => { const q = x.title ? `"${x.title}" гэдгийг дэлгэрэнгүй тайлбарлаж, надад зөвлөгөө өгөөч` : "Энэ ойлголтыг дэлгэрэнгүй тайлбарлаач"; setOpenInsight(null); onAskAI(q) }}
                  style={{ width: "100%", border: "none", borderRadius: 15, padding: "13px 0", background: "linear-gradient(135deg,#FF8A4C,#E8541A)", color: "#fff", fontSize: 13.5, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", boxShadow: "0 6px 16px rgba(232,84,26,0.28)" }}
                >AI-аас энэ талаар асуух</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Bottom glass nav */}
      <div style={{ position: "relative", zIndex: 2, margin: "0 15px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, borderRadius: 28, padding: 7, ...glass }}>
        <button onClick={() => onClose?.()} aria-label="Буцах" style={navBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <button onClick={() => setTab(0)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, border: "none", borderRadius: 22, padding: "13px 0", background: "linear-gradient(135deg,#FF8A4C,#E8541A)", color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", boxShadow: "0 6px 16px rgba(232,84,26,0.3)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>Тайлан
        </button>
        <button onClick={() => setTab(2)} aria-label="Зөвлөмж" style={navBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h7l-1 8 10-12h-7z"/></svg>
        </button>
        <button onClick={() => onAskAI("Энэ үр дүнгийн талаар асуумаар байна")} aria-label="AI асуух" style={navBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </button>
      </div>
    </div>
  )
}

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
  const metricColor = (pct: number) => pct > 0.6 ? "#C2410C" : pct > 0.3 ? "#FF9800" : PRIMARY
  const metricGrad = (_pct: number) => `linear-gradient(90deg,${PRIMARY},#FB923C)`
  const weekColors = ["#FB923C", "#E0703F", PRIMARY, "#FF9800"]
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

  // Every test now renders the warm liquid-glass view (journey + standard alike).
  return <WarmOverview data={data} onAskAI={onAskAI} onClose={onClose} />
}
