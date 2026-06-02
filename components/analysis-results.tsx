"use client"

import { useState, useEffect, useRef } from "react"

interface AnalysisData {
  healthScore: number
  riskLevel: string
  quitPotential: string
  summary: { title: string; description: string }
  metrics: Array<{ label: string; score: number; maxScore: number; status: string }>
  strengths: string[]
  risks: string[]
  insights: Array<{ emoji: string; title: string; description: string; detail: string; actions: string[] }>
  roadmap: Array<{ week: string; title: string; tasks: string[] }>
}

interface Props {
  data: AnalysisData
  reportTitle: string
  onClose: () => void
  onAskAI: (question: string) => void
}

const BRAND = "#E8541A"
const SCREENS = ["Тоймлол", "Дүн шинжилгээ", "Хүч/Эрсдэл", "30 хоног"]

function CircularScore({ score, animated }: { score: number; animated: boolean }) {
  const r = 54
  const circ = 2 * Math.PI * r
  const [display, setDisplay] = useState(0)
  const [offset, setOffset] = useState(circ)

  useEffect(() => {
    if (!animated) return
    const end = Math.min(Math.max(score, 0), 100)
    const duration = 1400
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const e = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(e * end))
      setOffset(circ - e * (end / 100) * circ)
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [animated, score, circ])

  const color = score >= 70 ? "#34C759" : score >= 40 ? "#FF9F0A" : "#FF3B30"

  return (
    <div style={{ position: "relative", width: 140, height: 140, margin: "0 auto" }}>
      <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="#F0F0F0" strokeWidth="12" />
        <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke 0.3s" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 38, fontWeight: 800, color: "#111", lineHeight: 1 }}>{display}</span>
        <span style={{ fontSize: 12, color: "#999", fontWeight: 500 }}>/100</span>
      </div>
    </div>
  )
}

function BottomSheet({ insight, onClose }: { insight: AnalysisData["insights"][0] | null; onClose: () => void }) {
  if (!insight) return null
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      zIndex: 200, display: "flex", alignItems: "flex-end",
      animation: "bs-fade 0.2s ease"
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", background: "#fff",
        borderRadius: "24px 24px 0 0",
        padding: "0 0 40px",
        animation: "bs-up 0.35s cubic-bezier(.16,1,.3,1)",
        maxHeight: "80vh", overflowY: "auto"
      }}>
        {/* Handle */}
        <div style={{ padding: "16px 0 0", display: "flex", justifyContent: "center" }}>
          <div style={{ width: 40, height: 4, background: "#E0E0E0", borderRadius: 2 }} />
        </div>

        {/* Header */}
        <div style={{ padding: "20px 24px 16px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 18,
            background: `${BRAND}12`, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, flexShrink: 0
          }}>{insight.emoji}</div>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: "#111", margin: 0 }}>{insight.title}</h3>
        </div>

        <div style={{ padding: "0 24px" }}>
          {/* Why it matters */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#999", letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: 10 }}>
              ЯАГААД ЧУХАЛ ВЭ
            </p>
            <p style={{ fontSize: 15, color: "#333", lineHeight: 1.7, margin: 0 }}>{insight.detail}</p>
          </div>

          {/* Actions */}
          {insight.actions?.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#999", letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: 12 }}>
                ХИЙЖ БОЛОХ АЛХМУУД
              </p>
              {insight.actions.map((a, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12,
                  padding: "12px 16px", background: "#F8F8F8", borderRadius: 14
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: `${BRAND}15`, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <span style={{ color: BRAND, fontSize: 12, fontWeight: 700 }}>✓</span>
                  </div>
                  <span style={{ fontSize: 14, color: "#333", lineHeight: 1.5 }}>{a}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
// ─── Compact inline card — чат дотор харагдана ─────────────────────────────
export function AnalysisCard({
  data,
  title,
  onExpand,
}: {
  data: AnalysisData
  title: string
  onExpand: () => void
}) {
  const [barAnimated, setBarAnimated] = useState(false)
  useEffect(() => { setTimeout(() => setBarAnimated(true), 200) }, [])

  const scoreColor = data.healthScore >= 70 ? "#34C759" : data.healthScore >= 40 ? "#FF9F0A" : "#FF3B30"
  const riskColor = data.riskLevel === "Low" ? "#34C759" : data.riskLevel === "Medium" ? "#FF9F0A" : "#FF3B30"
  const potColor = data.quitPotential === "High" ? "#34C759" : data.quitPotential === "Medium" ? "#FF9F0A" : "#FF3B30"
  const circ = 2 * Math.PI * 28
  const offset = circ - (data.healthScore / 100) * circ

  return (
    <div style={{
      background: "#fff",
      borderRadius: 20,
      overflow: "hidden",
      boxShadow: "0 4px 24px rgba(0,0,0,0.09)",
      border: "1px solid rgba(0,0,0,0.05)",
      animation: "fadeSlide 0.4s ease"
    }}>
      {/* Gradient header */}
      <div style={{
        background: "linear-gradient(135deg, #E8541A 0%, #FF6B3D 60%, #FF9F42 100%)",
        padding: "18px 18px 16px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: 700, margin: "0 0 4px", letterSpacing: "0.5px" }}>
              🧠 AI ШИНЖИЛГЭЭ
            </p>
            <p style={{
              color: "#fff", fontSize: 15, fontWeight: 800, margin: 0,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
            }}>{title}</p>
          </div>
          {/* Score ring */}
          <div style={{ position: "relative", width: 64, height: 64, flexShrink: 0, marginLeft: 12 }}>
            <svg width="64" height="64" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="6" />
              <circle cx="32" cy="32" r="28" fill="none" stroke="#fff" strokeWidth="6"
                strokeDasharray={circ}
                strokeDashoffset={barAnimated ? offset : circ}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.16,1,.3,1)" }} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 18, fontWeight: 900, lineHeight: 1 }}>{data.healthScore}</span>
              <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 8, fontWeight: 600 }}>/100</span>
            </div>
          </div>
        </div>

        {/* Summary pill */}
        <div style={{
          marginTop: 12,
          background: "rgba(255,255,255,0.15)",
          borderRadius: 10, padding: "6px 12px",
          display: "inline-flex", alignItems: "center", gap: 6
        }}>
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>{data.summary.title}</span>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 1, background: "#F4F4F4" }}>
        {[
          { label: "ХАМААРАЛ", value: data.metrics[0] ? `${data.metrics[0].score}/${data.metrics[0].maxScore}` : "—", sub: data.metrics[0]?.status, color: "#E8541A" },
          { label: "ЭРСДЭЛ", value: data.riskLevel === "Low" ? "Бага" : data.riskLevel === "Medium" ? "Дунд" : "Өндөр", sub: "түвшин", color: riskColor },
          { label: "БОЛОМЖ", value: data.quitPotential === "High" ? "Өндөр" : data.quitPotential === "Medium" ? "Дунд" : "Бага", sub: "магадлал", color: potColor },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, background: "#fff", padding: "12px 8px", textAlign: "center" }}>
            <p style={{ fontSize: 9, color: "#aaa", fontWeight: 700, letterSpacing: "0.4px", margin: "0 0 5px" }}>{s.label}</p>
            <p style={{ fontSize: 17, fontWeight: 900, color: s.color, margin: "0 0 2px" }}>{s.value}</p>
            <p style={{ fontSize: 10, color: "#bbb", margin: 0 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Metrics bars */}
      <div style={{ padding: "14px 16px 4px" }}>
        {data.metrics.slice(0, 2).map((m, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#333" }}>{m.label}</span>
              <span style={{ fontSize: 11, color: "#aaa" }}>{m.score}/{m.maxScore}</span>
            </div>
            <div style={{ background: "#F0F0F0", borderRadius: 6, height: 7, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 6,
                width: barAnimated ? `${(m.score / m.maxScore) * 100}%` : "0%",
                background: m.score / m.maxScore > 0.6
                  ? "linear-gradient(90deg, #FF3B30, #FF6B6B)"
                  : m.score / m.maxScore > 0.3
                    ? "linear-gradient(90deg, #FF9F0A, #FFCC44)"
                    : "linear-gradient(90deg, #34C759, #4CD964)",
                transition: "width 1.1s cubic-bezier(.16,1,.3,1)"
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Insights preview */}
      {data.insights?.length > 0 && (
        <div style={{ padding: "4px 16px 12px", display: "flex", gap: 8, overflowX: "hidden" }}>
          {data.insights.slice(0, 3).map((ins, i) => (
            <div key={i} style={{
              flex: 1, background: "#F8F8F8", borderRadius: 12,
              padding: "8px 10px", minWidth: 0
            }}>
              <span style={{ fontSize: 16 }}>{ins.emoji}</span>
              <p style={{
                fontSize: 11, fontWeight: 600, color: "#333", margin: "4px 0 0",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
              }}>{ins.title}</p>
            </div>
          ))}
        </div>
      )}

      {/* Expand button */}
      <div style={{ padding: "0 16px 16px" }}>
        <button onClick={onExpand} style={{
          width: "100%", padding: "13px 16px",
          background: "linear-gradient(135deg, #1a1a1a 0%, #333 100%)",
          border: "none", borderRadius: 14, cursor: "pointer",
          color: "#fff", fontSize: 14, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          transition: "all 0.2s ease",
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)"
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.2)" }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
          Дэлгэрэнгүй шинжилгээ харах
        </button>
      </div>
    </div>
  )
}
export function AnalysisResults({ data, reportTitle, onClose, onAskAI }: Props) {
  const [screen, setScreen] = useState(0)
  const [selectedInsight, setSelectedInsight] = useState<AnalysisData["insights"][0] | null>(null)
  const [roadmapWeek, setRoadmapWeek] = useState(0)
  const [chatInput, setChatInput] = useState("")
  const [animated, setAnimated] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const touchStartX = useRef(0)

  useEffect(() => { setTimeout(() => setAnimated(true), 100) }, [])

  const scoreColor = data.healthScore >= 70 ? "#34C759" : data.healthScore >= 40 ? "#FF9F0A" : "#FF3B30"
  const riskColor = data.riskLevel === "Low" ? "#34C759" : data.riskLevel === "Medium" ? "#FF9F0A" : "#FF3B30"
  const potColor = data.quitPotential === "High" ? "#34C759" : data.quitPotential === "Medium" ? "#FF9F0A" : "#FF3B30"

  const handleExpand = () => {
    const next = !isExpanded
    setIsExpanded(next)
    if (typeof window !== "undefined" && window.parent !== window) {
      window.parent.postMessage(
        { type: next ? "HIREMN_ANALYSIS_EXPAND" : "HIREMN_ANALYSIS_COLLAPSE" },
        "*"
      )
    }
  }

  const handleClose = () => {
    if (isExpanded && typeof window !== "undefined" && window.parent !== window) {
      window.parent.postMessage({ type: "HIREMN_ANALYSIS_COLLAPSE" }, "*")
    }
    onClose()
  }

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0 && screen < 3) setScreen(s => s + 1)
      if (diff < 0 && screen > 0) setScreen(s => s - 1)
    }
  }

  return (
    <div style={{
      position: "absolute", inset: 0,
      background: "#F2F2F7",
      display: "flex", flexDirection: "column",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      zIndex: 50,
      animation: "fadeSlide 0.3s ease"
    }}>
      {/* Header */}
      <div style={{
        background: "#fff",
        padding: "14px 16px 0",
        borderBottom: "1px solid #F0F0F0",
        flexShrink: 0
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <button onClick={handleClose} style={{
            background: "#F2F2F7", border: "none", borderRadius: 20,
            padding: "6px 14px", fontSize: 14, color: BRAND,
            cursor: "pointer", fontWeight: 600
          }}>← Буцах</button>

          <span style={{ fontSize: 15, fontWeight: 700, color: "#111", maxWidth: 160, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {reportTitle}
          </span>

          {/* Expand button */}
          <button onClick={handleExpand} style={{
            background: "#F2F2F7", border: "none", borderRadius: 20,
            padding: "6px 10px", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            {isExpanded ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round">
                <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
            )}
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, overflowX: "auto" }}>
          {SCREENS.map((s, i) => (
            <button key={i} onClick={() => setScreen(i)} style={{
              background: "none", border: "none",
              padding: "8px 12px", fontSize: 13, fontWeight: 600,
              cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
              color: screen === i ? BRAND : "#888",
              borderBottom: screen === i ? `2.5px solid ${BRAND}` : "2.5px solid transparent",
              transition: "all 0.2s"
            }}>{s}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

        {/* SCREEN 0 — Summary */}
        {screen === 0 && (
          <div style={{ animation: "fadeSlide 0.25s ease" }}>
            {/* Score */}
            <div style={{
              background: "#fff", borderRadius: 24, padding: "28px 20px 24px",
              marginBottom: 12, textAlign: "center",
              boxShadow: "0 2px 16px rgba(0,0,0,0.06)"
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#999", letterSpacing: "0.6px", marginBottom: 20 }}>
                ЭРҮҮЛ МЭНДИЙН ОНОО
              </p>
              <CircularScore score={data.healthScore} animated={animated} />
              <div style={{
                display: "inline-block", marginTop: 16, marginBottom: 10,
                background: `${scoreColor}15`, borderRadius: 20, padding: "6px 20px"
              }}>
                <span style={{ color: scoreColor, fontWeight: 700, fontSize: 16 }}>{data.summary.title}</span>
              </div>
              <p style={{ fontSize: 14, color: "#555", lineHeight: 1.6, margin: 0 }}>{data.summary.description}</p>
            </div>

            {/* 3 stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 12 }}>
              {[
                { label: "ХАМААРЛЫН ТҮВШИН", value: data.metrics[0] ? `${data.metrics[0].score}/${data.metrics[0].maxScore}` : "-", sub: data.metrics[0]?.status || "", color: BRAND },
                { label: "ЭРСДЭЛ", value: data.riskLevel === "Low" ? "Бага" : data.riskLevel === "Medium" ? "Дунд" : "Өндөр", sub: "түвшин", color: riskColor },
                { label: "БОЛОМЖ", value: data.quitPotential === "High" ? "Өндөр" : data.quitPotential === "Medium" ? "Дунд" : "Бага", sub: "магадлал", color: potColor },
              ].map((c, i) => (
                <div key={i} style={{
                  background: "#fff", borderRadius: 18, padding: "14px 10px",
                  textAlign: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
                }}>
                  <p style={{ fontSize: 9, color: "#999", fontWeight: 700, letterSpacing: "0.4px", marginBottom: 8 }}>{c.label}</p>
                  <p style={{ fontSize: 18, fontWeight: 800, color: c.color, margin: "0 0 2px" }}>{c.value}</p>
                  <p style={{ fontSize: 10, color: "#aaa", margin: 0 }}>{c.sub}</p>
                </div>
              ))}
            </div>

            {/* Metrics */}
            {data.metrics.map((m, i) => (
              <div key={i} style={{
                background: "#fff", borderRadius: 18, padding: "16px 18px",
                marginBottom: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>{m.label}</span>
                  <span style={{ fontSize: 13, color: "#aaa" }}>{m.score}/{m.maxScore}</span>
                </div>
                <div style={{ background: "#F0F0F0", borderRadius: 6, height: 8, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 6,
                    width: animated ? `${(m.score / m.maxScore) * 100}%` : "0%",
                    background: m.score / m.maxScore > 0.6 ? "#FF3B30" : m.score / m.maxScore > 0.3 ? "#FF9F0A" : "#34C759",
                    transition: "width 1.2s cubic-bezier(.16,1,.3,1)"
                  }} />
                </div>
                <p style={{ fontSize: 12, color: BRAND, fontWeight: 600, marginTop: 6 }}>{m.status}</p>
              </div>
            ))}
          </div>
        )}

        {/* SCREEN 1 — Insights */}
        {screen === 1 && (
          <div style={{ animation: "fadeSlide 0.25s ease" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#999", letterSpacing: "0.5px", marginBottom: 14 }}>
              ТАНЫ ХУВИЙН ДҮГНЭЛТ — дарж дэлгэрэнгүй харна
            </p>
            {data.insights.map((ins, i) => (
              <div key={i} onClick={() => setSelectedInsight(ins)} style={{
                background: "#fff", borderRadius: 20, padding: "18px 20px",
                marginBottom: 12, cursor: "pointer",
                boxShadow: "0 2px 14px rgba(0,0,0,0.06)",
                display: "flex", alignItems: "center", gap: 16,
                transition: "transform 0.15s, box-shadow 0.15s",
                border: "1.5px solid transparent",
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"
                    ; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(232,84,26,0.12)"
                    ; (e.currentTarget as HTMLElement).style.borderColor = `${BRAND}30`
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)"
                    ; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 14px rgba(0,0,0,0.06)"
                    ; (e.currentTarget as HTMLElement).style.borderColor = "transparent"
                }}
              >
                <div style={{
                  width: 54, height: 54, borderRadius: 18,
                  background: `${BRAND}10`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 26, flexShrink: 0
                }}>{ins.emoji}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: "0 0 4px" }}>{ins.title}</p>
                  <p style={{ fontSize: 13, color: "#666", margin: 0, lineHeight: 1.5 }}>{ins.description}</p>
                </div>
                <div style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: "#F8F8F8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                }}>
                  <span style={{ color: "#ccc", fontSize: 16, fontWeight: 300 }}>›</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SCREEN 2 — Strengths vs Risks */}
        {screen === 2 && (
          <div style={{ animation: "fadeSlide 0.25s ease" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div style={{ background: "#fff", borderRadius: 20, padding: "20px 16px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 20 }}>💪</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>Давуу тал</span>
                </div>
                {data.strengths.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "flex-start" }}>
                    <span style={{ color: "#34C759", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 13, color: "#333", lineHeight: 1.4 }}>{s}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: "#fff", borderRadius: 20, padding: "20px 16px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 20 }}>⚠️</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>Эрсдэл</span>
                </div>
                {data.risks.map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "flex-start" }}>
                    <span style={{ color: "#FF3B30", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>•</span>
                    <span style={{ fontSize: 13, color: "#333", lineHeight: 1.4 }}>{r}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI chat prompt */}
            <div style={{
              background: `linear-gradient(135deg, ${BRAND}, #FF8C42)`,
              borderRadius: 20, padding: "20px",
              boxShadow: "0 6px 24px rgba(232,84,26,0.28)"
            }}>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: 700, letterSpacing: "0.4px", margin: "0 0 6px" }}>💬 AI-ААС АСУУ</p>
              <p style={{ color: "#fff", fontSize: 14, fontWeight: 600, margin: "0 0 14px" }}>
                "Давуу талуудаа хэрхэн ашиглах вэ?"
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                  placeholder="Асуулт бичнэ үү..."
                  onKeyDown={e => {
                    if (e.key === "Enter" && chatInput.trim()) {
                      onAskAI(chatInput.trim()); setChatInput(""); handleClose()
                    }
                  }}
                  style={{
                    flex: 1, background: "rgba(255,255,255,0.18)",
                    border: "1.5px solid rgba(255,255,255,0.3)",
                    borderRadius: 12, padding: "10px 14px",
                    color: "#fff", fontSize: 14, outline: "none",
                  }} />
                <button onClick={() => {
                  if (chatInput.trim()) { onAskAI(chatInput.trim()); setChatInput(""); handleClose() }
                }} style={{
                  background: "#fff", border: "none", borderRadius: 12,
                  padding: "10px 16px", color: BRAND, fontWeight: 700, fontSize: 14, cursor: "pointer"
                }}>Илгээх</button>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 3 — Roadmap */}
        {screen === 3 && (
          <div style={{ animation: "fadeSlide 0.25s ease" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#999", letterSpacing: "0.5px", marginBottom: 14 }}>
              30 ХОНОГИЙН ЗАМНАЛ
            </p>

            {/* Step indicator */}
            <div style={{
              background: "#fff", borderRadius: 20, padding: "18px 20px",
              marginBottom: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.05)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {data.roadmap.map((_, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", flex: i < data.roadmap.length - 1 ? 1 : 0 }}>
                    <button onClick={() => setRoadmapWeek(i)} style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: i <= roadmapWeek ? BRAND : "#E8E8E8",
                      border: "none", cursor: "pointer", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.3s", color: i <= roadmapWeek ? "#fff" : "#999",
                      fontWeight: 700, fontSize: 13
                    }}>{i + 1}</button>
                    {i < data.roadmap.length - 1 && (
                      <div style={{
                        flex: 1, height: 3, marginLeft: 4,
                        background: i < roadmapWeek ? BRAND : "#E8E8E8",
                        borderRadius: 2, transition: "background 0.3s"
                      }} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Week card */}
            {data.roadmap[roadmapWeek] && (
              <div style={{
                background: "#fff", borderRadius: 24, padding: "24px 22px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                animation: "fadeSlide 0.2s ease"
              }}>
                <div style={{
                  display: "inline-block", background: `${BRAND}12`,
                  borderRadius: 12, padding: "4px 14px", marginBottom: 14
                }}>
                  <span style={{ color: BRAND, fontSize: 12, fontWeight: 700 }}>{data.roadmap[roadmapWeek].week}</span>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: "#111", margin: "0 0 18px" }}>
                  {data.roadmap[roadmapWeek].title}
                </h3>
                {data.roadmap[roadmapWeek].tasks.map((task, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "flex-start", gap: 12,
                    marginBottom: 12, padding: "12px 16px",
                    background: "#F8F8F8", borderRadius: 14
                  }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: "50%",
                      background: `${BRAND}15`, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      <span style={{ color: BRAND, fontSize: 12, fontWeight: 700 }}>✓</span>
                    </div>
                    <span style={{ fontSize: 14, color: "#333", lineHeight: 1.5 }}>{task}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button onClick={() => setRoadmapWeek(w => Math.max(0, w - 1))}
                disabled={roadmapWeek === 0}
                style={{
                  flex: 1, padding: "13px", borderRadius: 16,
                  border: "1.5px solid #E0E0E0", background: "#fff",
                  color: roadmapWeek === 0 ? "#ccc" : "#333",
                  fontSize: 14, fontWeight: 600, cursor: roadmapWeek === 0 ? "not-allowed" : "pointer"
                }}>← Өмнөх</button>
              <button onClick={() => setRoadmapWeek(w => Math.min(data.roadmap.length - 1, w + 1))}
                disabled={roadmapWeek === data.roadmap.length - 1}
                style={{
                  flex: 1, padding: "13px", borderRadius: 16, border: "none",
                  background: roadmapWeek === data.roadmap.length - 1 ? "#E0E0E0" : BRAND,
                  color: roadmapWeek === data.roadmap.length - 1 ? "#999" : "#fff",
                  fontSize: 14, fontWeight: 600, cursor: roadmapWeek === data.roadmap.length - 1 ? "not-allowed" : "pointer"
                }}>Дараах →</button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sheet */}
      <BottomSheet insight={selectedInsight} onClose={() => setSelectedInsight(null)} />

      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bs-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes bs-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}