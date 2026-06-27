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

  return (
    <div style={{ position: "absolute", inset: 0, background: "#FFFFFF", display: "flex", flexDirection: "column", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif", zIndex: 50, animation: "ar-in 0.3s ease" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: hasJourney ? "none" : "1px solid #F1ECE8", padding: "10px 14px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: hasJourney ? 0 : 10 }}>
          <button onClick={close} style={{ background: "#FAF6F3", border: "1px solid #F0E6DF", borderRadius: 20, padding: "6px 14px", fontSize: 12, color: "#7C6F66", cursor: "pointer", fontWeight: 600 }}>← Буцах</button>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#2A2520", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{reportTitle}</span>
          <button onClick={expand} style={{ background: "#FAF6F3", border: "1px solid #F0E6DF", borderRadius: 20, padding: "7px 10px", cursor: "pointer", color: "#B89A88", display: "flex", alignItems: "center" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              {expanded ? <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" /> : <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />}
            </svg>
          </button>
        </div>
        {!hasJourney && (
        <div style={{ display: "flex", background: "#FAF6F3", borderRadius: 12, padding: 3, gap: 2 }}>
          {PAGES.map((p, i) => (
            <button key={i} onClick={() => setPage(i)} style={{ flex: 1, padding: "7px", fontSize: 11, fontWeight: 700, border: "none", borderRadius: 10, cursor: "pointer", background: page === i ? "#fff" : "transparent", color: page === i ? "#2A2520" : "#A89E96", boxShadow: page === i ? "0 2px 8px rgba(0,0,0,0.08)" : "none", transition: "all 0.2s" }}>{p}</button>
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
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#A89E96", letterSpacing: "0.4px" }}>HEALTH SCORE</span>
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: `${color}15`, borderRadius: 20, padding: "4px 12px", border: `1.5px solid ${color}25`, marginBottom: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, display: "inline-block" }} />
                  <span style={{ color, fontWeight: 800, fontSize: 13 }}>{data.summary.title}</span>
                </div>
                <p style={{ fontSize: 12, color: "#8A817A", lineHeight: 1.6, margin: 0 }}>{data.summary.description}</p>
              </div>
              <Char type={heroChar} size={72} style={{ flexShrink: 0 }} />
            </div>

            {/* 3 KPI cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 12 }}>
              {[
                { label: kpi.metric1Label || "Хамаарал", value: data.metrics[0] ? `${data.metrics[0].score}/10` : "—", sub: data.metrics[0]?.status || "", color: BRAND, bg: "#FFF5F0", border: "#FFD0B8", barPct: data.metrics[0] ? (data.metrics[0].score / data.metrics[0].maxScore) * 100 : 0 },
                { label: kpi.riskLabel || "Эрсдэл", value: data.riskLevel === "Low" ? "Low" : data.riskLevel === "Medium" ? "Mid" : "High", sub: data.riskLevel === "Low" ? "Бага" : data.riskLevel === "Medium" ? "Дунд" : "Өндөр", color: rc, bg: rc === GREEN ? "#FFF6EA" : rc === AMBER ? "#FFFBEB" : "#FFF2F2", border: `${rc}30`, barPct: data.riskLevel === "Low" ? 20 : data.riskLevel === "Medium" ? 55 : 90 },
                { label: kpi.potentialLabel || "Боломж", value: data.quitPotential === "High" ? "High" : data.quitPotential === "Medium" ? "Mid" : "Low", sub: data.quitPotential === "High" ? "Өндөр" : data.quitPotential === "Medium" ? "Дунд" : "Бага", color: pc, bg: pc === GREEN ? "#FFF6EA" : pc === AMBER ? "#FFFBEB" : "#FFF2F2", border: `${pc}30`, barPct: data.quitPotential === "High" ? 85 : data.quitPotential === "Medium" ? 50 : 20 },
              ].map((k, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "12px 10px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: `1.5px solid ${k.border}` }}>
                  <p style={{ fontSize: 8, color: "#A89E96", fontWeight: 700, margin: "0 0 4px", letterSpacing: "0.3px", lineHeight: 1.3 }}>{k.label.toUpperCase()}</p>
                  <p style={{ fontSize: 18, fontWeight: 900, color: k.color, margin: "0 0 1px", lineHeight: 1 }}>{k.value}</p>
                  <p style={{ fontSize: 8, color: "#A89E96", margin: "0 0 6px", lineHeight: 1.3 }}>{k.sub}</p>
                  <div style={{ background: "#FAF6F3", borderRadius: 6, height: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 6, width: bar ? `${k.barPct}%` : "0%", background: k.color, transition: "width 1s cubic-bezier(.16,1,.3,1)" }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Dynamic highlight card */}
            <div style={{ background: "linear-gradient(135deg, #FFF6EA, #FCEBD2)", borderRadius: 20, padding: "18px 16px", marginBottom: 12, border: "1.5px solid #FBDFB3", boxShadow: "0 4px 16px rgba(0,196,140,0.12)", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 16, fontWeight: 900, color: "#5C2A12", margin: "0 0 6px" }}>
                  {data.highlightTitle || data.insights[0]?.title || "Сайн мэдээ!"}
                </p>
                <p style={{ fontSize: 12, color: "#7C3A1E", lineHeight: 1.6, margin: "0 0 12px" }}>
                  {data.highlightMessage || data.insights[0]?.description || data.summary.description}
                </p>
                <button onClick={() => data.insights[0] && setInsDetail(data.insights[0])} style={{ background: PRIMARY, border: "none", borderRadius: 22, padding: "9px 18px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: `0 4px 14px ${PRIMARY}50` }}>
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
                border: "1px solid #FAF6F3",
              }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: 14,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 9,
                      background: "linear-gradient(135deg, #FB923C, #C2410C)",
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
                      <p style={{ fontSize: 13, fontWeight: 800, color: "#2A2520", margin: "0 0 1px" }}>
                        Хэмжээсүүдийн задаргаа
                      </p>
                      <p style={{ fontSize: 9, color: "#A89E96", margin: 0, letterSpacing: 0.3 }}>
                        {data.dimensions.length} хэмжээс • Бодит тестээс
                      </p>
                    </div>
                  </div>
                  <div style={{
                    background: "#FFF4EC", color: "#C2410C",
                    fontSize: 10, fontWeight: 800,
                    padding: "4px 10px", borderRadius: 999,
                    border: "1px solid #FED7AA",
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
                      borderBottom: i < data.dimensions!.length - 1 ? "1px solid #FAF6F3" : "none",
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
                            fontSize: 12, fontWeight: 700, color: "#2A2520",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            flex: 1, minWidth: 0,
                          }}>{d.label.replace(/\s*\([A-ZА-ЯӨҮЁ]\)\s*/i, "")}</span>
                          <span style={{
                            fontSize: 13, fontWeight: 900, color: c, flexShrink: 0,
                            fontFeatureSettings: "'tnum'",
                          }}>{d.score}<span style={{ fontSize: 10, color: "#A89E96", fontWeight: 700 }}>/{d.maxScore}</span></span>
                        </div>
                        <div style={{
                          background: "#FAF6F3", borderRadius: 6, height: 6, overflow: "hidden",
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
                  background: "#FFF7F2", borderRadius: 10,
                  fontSize: 10.5, color: "#8A817A", fontWeight: 500,
                  lineHeight: 1.5, textAlign: "center",
                  border: "1px dashed #F0EAE6",
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
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#2A2520", margin: "0 0 1px" }}>{m.label}</p>
                    <p style={{ fontSize: 10, fontWeight: 700, color: metricColor(m.score / m.maxScore), margin: 0 }}>{m.status}</p>
                  </div>
                  <div style={{ background: `${metricColor(m.score / m.maxScore)}12`, borderRadius: 10, padding: "4px 10px", border: `1px solid ${metricColor(m.score / m.maxScore)}25` }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: metricColor(m.score / m.maxScore) }}>{m.score}/{m.maxScore}</span>
                  </div>
                </div>
                <div style={{ background: "#FAF6F3", borderRadius: 10, height: 10, overflow: "hidden" }}>
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
                  <p style={{ fontSize: 12, fontWeight: 800, color: "#B45309", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 5 }}>💪 Давуу талууд</p>
                  {data.strengths.map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: 7, marginBottom: 7 }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#FCEBD2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                        <span style={{ color: PRIMARY, fontSize: 10, fontWeight: 800 }}>✓</span>
                      </div>
                      <span style={{ fontSize: 11, color: "#5B5650", lineHeight: 1.4 }}>{s}</span>
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
                      <span style={{ fontSize: 11, color: "#5B5650", lineHeight: 1.4 }}>{r}</span>
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
                      <p style={{ fontSize: 13, fontWeight: 900, color: "#2A2520", margin: "0 0 1px", lineHeight: 1 }}>{s.value}</p>
                      <p style={{ fontSize: 8, color: "#A89E96", margin: 0, lineHeight: 1.3 }}>{s.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => setPage(1)} style={{ width: "100%", padding: "12px", background: "#FAF6F3", border: "1.5px solid #F0EAE6", borderRadius: 14, color: "#5B5650", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
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
              titleColor: "#B45309",
              bg: "linear-gradient(135deg, #FFF6EA, #FCEBD2)",
              border: "#FBDFB3",
              iconBg: "linear-gradient(135deg, #EFA53F, #B45309)",
              iconShadow: "0 8px 20px rgba(34,197,94,0.35)",
              icon: (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L4 6v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V6l-8-4z" fill="#fff" stroke="#D98324" strokeWidth="1.5"/>
                  <path d="M9 12l2 2 4-5" stroke="#B45309" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ),
              items: data.strengths.slice(0, 3),
              itemDot: "#D98324",
              ctaLabel: `${data.strengths.length} давуу тал`,
              ctaBg: "linear-gradient(135deg, #D98324, #B45309)",
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
              titleColor: "#B45309",
              bg: "linear-gradient(135deg, #FFF6EA, #FCEBD2)",
              border: "#FBDFB3",
              iconBg: "linear-gradient(135deg, #EFA53F, #C2740C)",
              iconShadow: "0 8px 20px rgba(16,185,129,0.35)",
              icon: (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                  <path d="M3 9h18v12H3z" fill="#C2740C" stroke="#B45309" strokeWidth="1.5"/>
                  <path d="M3 9v3h18V9M12 21V9" stroke="#B45309" strokeWidth="1.5"/>
                  <path d="M12 9c-3-3-6-1-6 1 0 2 3 2 6 0zM12 9c3-3 6-1 6 1 0 2-3 2-6 0z" fill="#fff" stroke="#B45309" strokeWidth="1.5"/>
                </svg>
              ),
              items: (data.insights[0]?.actions || data.insights.map(i => i.description)).slice(0, 3),
              itemDot: "#C2740C",
              ctaLabel: "Дэлгэрэнгүй",
              ctaBg: "linear-gradient(135deg, #C2740C, #B45309)",
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
                    bg: "linear-gradient(135deg, #FFF6EA 0%, #FCEBD2 50%, #FBDFB3 100%)",
                    border: "#FBDFB3", shadow: "rgba(34,197,94,0.12)",
                    label: "#B45309", num: "#5C2A12", body: "#7C3A1E",
                    chip: "💚", decor: ["#FBD89B", "#EFA53F", "#D98324"],
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
                    bg: "linear-gradient(135deg, #FFF2EE 0%, #FCE0D6 50%, #FBD3C2 100%)",
                    border: "#FBD3C2", shadow: "rgba(239,68,68,0.12)",
                    label: "#9A3412", num: "#7C2D12", body: "#7C2D12",
                    chip: "🫶", decor: ["#F0A07A", "#E0703F", "#C2410C"],
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
                      { color: "#EA580C", svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="13" width="4" height="8" rx="1" fill="#EA580C" opacity="0.5"/><rect x="10" y="8" width="4" height="13" rx="1" fill="#EA580C" opacity="0.75"/><rect x="17" y="4" width="4" height="17" rx="1" fill="#EA580C"/></svg> },
                      { color: "#F59E0B", svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="#F59E0B"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg> },
                      { color: "#FB923C", svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill="#FB923C" opacity="0.18"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" stroke="#FB923C" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="12" r="3" fill="#FB923C"/></svg> },
                    ]
                    const ic = icons[i] || icons[0]
                    return (
                      <div key={i} style={{
                        textAlign: "center", padding: "4px 2px",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                      }}>
                        {ic.svg}
                        <div style={{
                          fontSize: 8, fontWeight: 800, color: "#8A817A",
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
                <span style={{ fontSize: 14, fontWeight: 800, color: "#2A2520" }}>AI-ийн дүгнэлт</span>
              </div>
              <button onClick={() => current.key === "tips" && data.insights[0] && setInsDetail(data.insights[0])} style={{
                background: "none", border: "none",
                fontSize: 11, fontWeight: 700, color: "#B45309",
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
                    background: "#fff", border: "1.5px solid #F0EAE6",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", color: "#8A817A",
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
                    background: "#fff", border: "1.5px solid #F0EAE6",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", color: "#8A817A",
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
                                  fontSize: 11, fontWeight: 800, color: "#2A2520",
                                  marginBottom: 2, lineHeight: 1.3,
                                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                }}>{itemTitle}</div>
                              )}
                              <div style={{
                                fontSize: 10.5, color: itemTitle ? "#5B5650" : "#5B5650",
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
                      ? (cards[insCarousel].titleColor === "#EA580C" ? "#EA580C" : "#C2740C")
                      : "#F0EAE6",
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
              background: "linear-gradient(135deg, #FB923C 0%, #C2410C 100%)",
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
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#EFA53F", display: "inline-block", boxShadow: "0 0 6px #EFA53F" }}/>
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
                  background: f.active ? "#2A2520" : "#fff",
                  color: f.active ? "#fff" : "#8A817A",
                  border: f.active ? "none" : "1.5px solid #F0EAE6",
                  borderRadius: 999, padding: "6px 12px",
                  fontSize: 11, fontWeight: 700, cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s",
                  boxShadow: f.active ? "0 4px 12px rgba(30,41,59,0.2)" : "none",
                }}>
                  {f.label}
                  <span style={{
                    background: f.active ? "rgba(255,255,255,0.2)" : "#FAF6F3",
                    color: f.active ? "#fff" : "#A89E96",
                    borderRadius: 999, padding: "0 6px",
                    fontSize: 9, fontWeight: 800, minWidth: 14, textAlign: "center",
                  }}>{f.count}</span>
                </div>
              ))}
            </div>

            {/* ── Insight cards (rich) ── */}
            {data.insights.map((ins, i) => {
              const palettes = [
                { bg: "#FFF6EA", border: "#FBDFB3", color: PRIMARY, text: "Маш сайн", priority: "Өндөр" },
                { bg: "#FFF5F0", border: "#FFD0B8", color: BRAND, text: "Анхаарал", priority: "Дунд" },
                { bg: "#FFF7F2", border: "#FED7AA", color: "#EA580C", text: "Боломж", priority: "Чухал" },
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
                            background: "#FAF6F3", color: "#8A817A",
                            fontSize: 8, fontWeight: 700,
                            padding: "2px 7px", borderRadius: 999,
                          }}>
                            #{i + 1}
                          </span>
                        </div>
                        <p style={{ fontSize: 13, fontWeight: 800, color: "#2A2520", margin: "0 0 4px", lineHeight: 1.3 }}>{ins.title}</p>
                        <p style={{ fontSize: 11.5, color: "#8A817A", margin: 0, lineHeight: 1.5 }}>{ins.description}</p>
                      </div>
                    </div>

                    {/* Quick action chips */}
                    {ins.actions && ins.actions.length > 0 && (
                      <div style={{
                        display: "flex", gap: 5, flexWrap: "wrap",
                        marginBottom: 8, padding: "8px 0 0",
                        borderTop: "1px dashed #F0EAE6",
                      }}>
                        {ins.actions.slice(0, 2).map((a, j) => (
                          <span key={j} style={{
                            background: "#FFF7F2", color: "#5B5650",
                            border: "1px solid #F0EAE6",
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
              border: "1.5px solid #FAF6F3",
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
            }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: "#B45309", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 5 }}>💪 Давуу талууд</p>
                {data.strengths.slice(0, 3).map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "flex-start" }}>
                    <span style={{ color: PRIMARY, fontSize: 10, fontWeight: 800, marginTop: 1 }}>✓</span>
                    <span style={{ fontSize: 11, color: "#5B5650", lineHeight: 1.4 }}>{s}</span>
                  </div>
                ))}
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: "#EA580C", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 5 }}>⚠️ Анхаарал</p>
                {data.risks.slice(0, 3).map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "flex-start" }}>
                    <span style={{ color: "#FF9800", fontSize: 10, fontWeight: 800, marginTop: 1 }}>!</span>
                    <span style={{ fontSize: 11, color: "#5B5650", lineHeight: 1.4 }}>{r}</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setPage(2)} style={{
              width: "100%", marginTop: 4, padding: "12px",
              background: `linear-gradient(135deg, ${PRIMARY}, #F97316)`,
              border: "none", borderRadius: 14, color: "#fff",
              fontSize: 12, fontWeight: 800, cursor: "pointer",
              boxShadow: `0 4px 14px ${PRIMARY}40`,
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
                    <p style={{ fontSize: 13, fontWeight: 800, color: "#2A2520", margin: "0 0 1px" }}>Өнөөдрийн зорилго</p>
                    <p style={{ fontSize: 10, color: "#A89E96", margin: 0 }}>Зорилгоо тэмдэглэж явна уу</p>
                  </div>
                </div>
                <div style={{ background: "#FFF6EA", borderRadius: 20, padding: "4px 12px", border: `1px solid ${PRIMARY}30` }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: PRIMARY }}>{goals.filter(Boolean).length}<span style={{ color: "#A89E96", fontWeight: 400 }}>/{todayGoals.length}</span></span>
                </div>
              </div>
              <div style={{ background: "#FAF6F3", borderRadius: 8, height: 6, marginBottom: 14, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 8, background: `linear-gradient(90deg, ${PRIMARY}, #F97316)`, width: todayGoals.length > 0 ? `${(goals.filter(Boolean).length / todayGoals.length) * 100}%` : "0%", transition: "width 0.4s ease" }} />
              </div>
              {todayGoals.map((task, i) => (
                <div key={i} onClick={() => toggleGoal(i)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", marginBottom: 8, cursor: "pointer", borderRadius: 14, background: goals[i] ? "#FFF6EA" : "#FAFAFA", border: `1.5px solid ${goals[i] ? PRIMARY + "40" : "#F0EAE6"}`, transition: "all 0.25s ease", userSelect: "none" }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, background: goals[i] ? PRIMARY : "#fff", border: `2px solid ${goals[i] ? PRIMARY : "#DED5CD"}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.25s ease" }}>
                    {goals[i] && <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M3 8l4 4 6-7" /></svg>}
                  </div>
                  <span style={{ fontSize: 13, color: goals[i] ? "#B45309" : "#5B5650", fontWeight: goals[i] ? 700 : 500, textDecoration: goals[i] ? "line-through" : "none", flex: 1, transition: "all 0.2s" }}>{task}</span>
                  {goals[i] && <span style={{ fontSize: 14 }}>✅</span>}
                </div>
              ))}
              {allGoalsDone && (
                <div style={{ background: "linear-gradient(135deg, #FFF6EA, #FCEBD2)", borderRadius: 14, padding: "12px 16px", border: `1px solid ${PRIMARY}30`, display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
                  <Char type="celebrate" size={56} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#B45309" }}>🎉 Бүх зорилгоо биелүүллээ! Гайхалтай!</span>
                </div>
              )}
            </div>

            {/* Roadmap */}
            <div style={{ background: "#fff", borderRadius: 18, padding: "16px", marginBottom: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 18 }}>📅</span>
                <p style={{ fontSize: 13, fontWeight: 800, color: "#2A2520", margin: 0 }}>30 Хоногийн Төлөвлөгөө</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                {data.roadmap.map((_, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", flex: i < data.roadmap.length - 1 ? 1 : 0 }}>
                    <button onClick={() => setRoadWeek(i)} style={{ width: 32, height: 32, borderRadius: "50%", border: "none", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, background: i === roadWeek ? weekColors[i % weekColors.length] : i < roadWeek ? `${weekColors[i % weekColors.length]}30` : "#FAF6F3", color: i === roadWeek ? "#fff" : i < roadWeek ? weekColors[i % weekColors.length] : "#A89E96", transition: "all 0.25s ease", boxShadow: i === roadWeek ? `0 4px 12px ${weekColors[i % weekColors.length]}50` : "none" }}>
                      {i < roadWeek ? "✓" : i + 1}
                    </button>
                    {i < data.roadmap.length - 1 && (
                      <div style={{ flex: 1, height: 3, marginLeft: 4, background: i < roadWeek ? weekColors[i % weekColors.length] : "#F0EAE6", borderRadius: 2, transition: "background 0.3s" }} />
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
                      <p style={{ fontSize: 10, color: "#A89E96", fontWeight: 700, margin: "0 0 1px", letterSpacing: "0.4px" }}>{data.roadmap[roadWeek].week.toUpperCase()}</p>
                      <p style={{ fontSize: 15, fontWeight: 900, color: "#2A2520", margin: 0 }}>{data.roadmap[roadWeek].title}</p>
                    </div>
                  </div>
                  {data.roadmap[roadWeek].tasks.map((task, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, padding: "10px 12px", background: "#fff", borderRadius: 12, border: "1px solid #F0EAE6", animation: `ci 0.3s ease ${i * 0.06}s both` }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: `${weekColors[roadWeek % weekColors.length]}20`, border: `1.5px solid ${weekColors[roadWeek % weekColors.length]}40`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                        <span style={{ color: weekColors[roadWeek % weekColors.length], fontSize: 10, fontWeight: 800 }}>✓</span>
                      </div>
                      <span style={{ fontSize: 13, color: "#5B5650", lineHeight: 1.5 }}>{task}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button onClick={() => setRoadWeek(w => Math.max(0, w - 1))} disabled={roadWeek === 0} style={{ flex: 1, padding: "11px", borderRadius: 14, border: "1.5px solid #F0EAE6", background: "#fff", color: roadWeek === 0 ? "#DED5CD" : "#5B5650", fontSize: 13, fontWeight: 700, cursor: roadWeek === 0 ? "not-allowed" : "pointer", transition: "all 0.2s" }}>← Өмнөх</button>
                <button onClick={() => setRoadWeek(w => Math.min(data.roadmap.length - 1, w + 1))} disabled={roadWeek === data.roadmap.length - 1} style={{ flex: 1, padding: "11px", borderRadius: 14, border: "none", background: roadWeek === data.roadmap.length - 1 ? "#FAF6F3" : `linear-gradient(135deg, ${weekColors[roadWeek % weekColors.length]}, ${weekColors[(roadWeek + 1) % weekColors.length]})`, color: roadWeek === data.roadmap.length - 1 ? "#DED5CD" : "#fff", fontSize: 13, fontWeight: 700, cursor: roadWeek === data.roadmap.length - 1 ? "not-allowed" : "pointer", boxShadow: roadWeek === data.roadmap.length - 1 ? "none" : `0 4px 14px ${weekColors[roadWeek % weekColors.length]}40`, transition: "all 0.2s" }}>Дараах →</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Chat bar */}
      <div style={{ background: "#fff", borderTop: "1px solid #F0EAE6", padding: "10px 14px", flexShrink: 0, boxShadow: "0 -4px 20px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <Char type="phone" size={36} style={{ flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, color: "#2A2520", margin: "0 0 1px" }}>AI Таны туслах</p>
            <p style={{ fontSize: 9, color: "#A89E96", margin: 0 }}>Асуултаа асуугарай, би танд туслахад бэлэн байна!</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleAI() }}
            placeholder="Жишээ нь: Хэрхэн сайжрах вэ?"
            style={{ flex: 1, background: "#FAF6F3", border: "1.5px solid #F0EAE6", borderRadius: 22, padding: "9px 16px", color: "#2A2520", fontSize: 12, outline: "none", fontFamily: "inherit", transition: "border-color 0.2s" }}
            onFocus={e => (e.target as HTMLInputElement).style.borderColor = PRIMARY}
            onBlur={e => (e.target as HTMLInputElement).style.borderColor = "#F0EAE6"}
          />
          <button onClick={handleAI} disabled={!chatInput.trim()} style={{ width: 38, height: 38, borderRadius: "50%", border: "none", background: chatInput.trim() ? `linear-gradient(135deg, ${PRIMARY}, #F97316)` : "#F0EAE6", display: "flex", alignItems: "center", justifyContent: "center", cursor: chatInput.trim() ? "pointer" : "not-allowed", flexShrink: 0, boxShadow: chatInput.trim() ? `0 4px 12px ${PRIMARY}40` : "none", transition: "all 0.2s" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={chatInput.trim() ? "white" : "#A89E96"} strokeWidth="2.5" strokeLinecap="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" fill={chatInput.trim() ? "white" : "#A89E96"} stroke="none" />
            </svg>
          </button>
        </div>
      </div>

      {/* Page dots (legacy paged mode only) */}
      {!hasJourney && (
      <div style={{ background: "#fff", padding: "6px 0 8px", display: "flex", justifyContent: "center", gap: 6, flexShrink: 0, borderTop: "1px solid #FAF6F3" }}>
        {PAGES.map((_, i) => (
          <button key={i} onClick={() => setPage(i)} style={{ width: i === page ? 20 : 7, height: 7, borderRadius: 4, background: i === page ? PRIMARY : "#F0EAE6", border: "none", cursor: "pointer", transition: "all 0.3s cubic-bezier(.34,1.56,.64,1)", padding: 0 }} />
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
        @keyframes ar-float { 0%,100%{transform:translateY(0) rotate(-1.5deg)} 50%{transform:translateY(-7px) rotate(1.5deg)} }
        @keyframes ar-float2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes ar-orb { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(10px,-8px) scale(1.1)} 66%{transform:translate(-6px,6px) scale(0.95)} }
        @keyframes ar-shimmer { 0%{transform:translateX(-120%)} 100%{transform:translateX(220%)} }
        @keyframes ar-glow { 0%,100%{opacity:0.5;transform:scale(1)} 50%{opacity:0.85;transform:scale(1.08)} }
        @keyframes ar-pop-b { 0%{opacity:0;transform:scale(0.5)} 55%{transform:scale(1.18)} 100%{opacity:1;transform:scale(1)} }
        @keyframes ar-confetti { 0%{opacity:1;transform:translateY(0) rotate(0)} 100%{opacity:0;transform:translateY(120px) rotate(360deg)} }
        @keyframes ar-ring-spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes ar-sheen { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        .hw-card-tilt { transition: transform 0.25s cubic-bezier(.16,1,.3,1), box-shadow 0.25s ease; }
      `}</style>
    </div>
  )
}
