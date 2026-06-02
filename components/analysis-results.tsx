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

// ── Animated circular score ──────────────────────────────────────────────────
function CircularScore({ score, size = 140 }: { score: number; size?: number }) {
  const [display, setDisplay] = useState(0)
  const [animated, setAnimated] = useState(false)
  const r = size * 0.38
  const circ = 2 * Math.PI * r
  const [offset, setOffset] = useState(circ)

  useEffect(() => {
    const t = setTimeout(() => {
      setAnimated(true)
      const end = Math.min(Math.max(score, 0), 100)
      const dur = 1600
      const st = performance.now()
      const tick = (now: number) => {
        const p = Math.min((now - st) / dur, 1)
        const e = 1 - Math.pow(1 - p, 4)
        setDisplay(Math.round(e * end))
        setOffset(circ - e * (end / 100) * circ)
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, 200)
    return () => clearTimeout(t)
  }, [score, circ])

  const color = score >= 70 ? "#30D158" : score >= 40 ? "#FF9F0A" : "#FF453A"
  const bg = score >= 70 ? "#30D15820" : score >= 40 ? "#FF9F0A20" : "#FF453A20"

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="rgba(255,255,255,0.08)" strokeWidth={size * 0.07} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={size * 0.07}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke 0.4s ease, filter 0.4s" }}
          filter={animated ? `drop-shadow(0 0 ${size * 0.05}px ${color})` : "none"} />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center"
      }}>
        <span style={{
          fontSize: size * 0.26, fontWeight: 900,
          color: "#fff", lineHeight: 1,
          fontVariantNumeric: "tabular-nums"
        }}>{display}</span>
        <span style={{ fontSize: size * 0.09, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>/100</span>
      </div>
    </div>
  )
}

// ── Bottom sheet ─────────────────────────────────────────────────────────────
function BottomSheet({ insight, onClose }: {
  insight: AnalysisData["insights"][0] | null; onClose: () => void
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (insight) setTimeout(() => setVisible(true), 10)
    else setVisible(false)
  }, [insight])

  if (!insight) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: `rgba(0,0,0,${visible ? 0.6 : 0})`,
        zIndex: 200,
        display: "flex", alignItems: "flex-end",
        transition: "background 0.3s ease",
        backdropFilter: "blur(4px)"
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%",
          background: "#1C1C1E",
          borderRadius: "28px 28px 0 0",
          padding: "0 0 env(safe-area-inset-bottom, 32px)",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.4s cubic-bezier(.16,1,.3,1)",
          maxHeight: "82vh", overflowY: "auto",
        }}
      >
        {/* Handle */}
        <div style={{ padding: "14px 0 0", display: "flex", justifyContent: "center" }}>
          <div style={{ width: 36, height: 4, background: "rgba(255,255,255,0.15)", borderRadius: 2 }} />
        </div>

        <div style={{ padding: "20px 24px 32px" }}>
          {/* Emoji + title */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
            <div style={{
              width: 60, height: 60, borderRadius: 20,
              background: `${BRAND}25`,
              border: `1.5px solid ${BRAND}40`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28
            }}>{insight.emoji}</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.3 }}>
              {insight.title}
            </h3>
          </div>

          {/* Detail */}
          <div style={{
            background: "rgba(255,255,255,0.06)",
            borderRadius: 16, padding: "16px 18px", marginBottom: 20
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.6px", margin: "0 0 10px" }}>
              ЯАГААД ЧУХАЛ ВЭ
            </p>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.85)", lineHeight: 1.7, margin: 0 }}>
              {insight.detail}
            </p>
          </div>

          {/* Actions */}
          {insight.actions?.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.6px", margin: "0 0 14px" }}>
                ХИЙЖ БОЛОХ АЛХМУУД
              </p>
              {insight.actions.map((a, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: 14,
                  marginBottom: 12, padding: "14px 16px",
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.08)"
                }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%",
                    background: `${BRAND}25`, border: `1px solid ${BRAND}40`,
                    flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <span style={{ color: BRAND, fontSize: 12, fontWeight: 800 }}>✓</span>
                  </div>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>{a}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Compact card (inline in chat) ────────────────────────────────────────────
export function AnalysisCard({ data, title, onExpand }: {
  data: AnalysisData; title: string; onExpand: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const [barW, setBarW] = useState(false)
  const scoreColor = data.healthScore >= 70 ? "#30D158" : data.healthScore >= 40 ? "#FF9F0A" : "#FF453A"
  const r = 28, circ = 2 * Math.PI * r
  const [offset, setOffset] = useState(circ)
  const [scoreDisplay, setScoreDisplay] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => {
      setBarW(true)
      const end = data.healthScore
      const dur = 1400
      const st = performance.now()
      const tick = (now: number) => {
        const p = Math.min((now - st) / dur, 1)
        const e = 1 - Math.pow(1 - p, 3)
        setScoreDisplay(Math.round(e * end))
        setOffset(circ - e * (end / 100) * circ)
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, 300)
    return () => clearTimeout(t)
  }, [data.healthScore, circ])

  const riskColor = data.riskLevel === "Low" ? "#30D158" : data.riskLevel === "Medium" ? "#FF9F0A" : "#FF453A"
  const potColor = data.quitPotential === "High" ? "#30D158" : data.quitPotential === "Medium" ? "#FF9F0A" : "#FF453A"

  return (
    <div style={{
      borderRadius: 22, overflow: "hidden",
      background: "#111",
      boxShadow: hovered
        ? "0 20px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08)"
        : "0 8px 32px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.06)",
      transition: "box-shadow 0.3s ease, transform 0.3s ease",
      transform: hovered ? "translateY(-3px)" : "translateY(0)",
      cursor: "pointer",
    }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onExpand}
    >
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        padding: "20px 20px 16px",
        position: "relative", overflow: "hidden"
      }}>
        {/* Glow orb */}
        <div style={{
          position: "absolute", top: -40, right: -40,
          width: 120, height: 120, borderRadius: "50%",
          background: `radial-gradient(circle, ${scoreColor}30, transparent 70%)`,
          animation: "orb-pulse 3s ease-in-out infinite"
        }} />

        <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative" }}>
          {/* Score ring */}
          <div style={{ position: "relative", width: 70, height: 70, flexShrink: 0 }}>
            <svg width="70" height="70" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="35" cy="35" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
              <circle cx="35" cy="35" r={r} fill="none" stroke={scoreColor} strokeWidth="6"
                strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 4px ${scoreColor})`, transition: "stroke-dashoffset 0.1s" }} />
            </svg>
            <div style={{
              position: "absolute", inset: 0, display: "flex",
              flexDirection: "column", alignItems: "center", justifyContent: "center"
            }}>
              <span style={{ color: "#fff", fontSize: 18, fontWeight: 900, lineHeight: 1 }}>{scoreDisplay}</span>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 8 }}>/100</span>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)",
              letterSpacing: "0.6px", marginBottom: 4
            }}>🧠 AI ШИНЖИЛГЭЭ</div>
            <div style={{
              fontSize: 15, fontWeight: 800, color: "#fff",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
            }}>{title}</div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              marginTop: 6, background: `${scoreColor}20`,
              borderRadius: 20, padding: "3px 10px",
              border: `1px solid ${scoreColor}30`
            }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: scoreColor }} />
              <span style={{ color: scoreColor, fontSize: 11, fontWeight: 700 }}>{data.summary.title}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", background: "#161616" }}>
        {[
          { label: "ХАМААРАЛ", value: data.metrics[0] ? `${data.metrics[0].score}/${data.metrics[0].maxScore}` : "—", color: BRAND },
          { label: "ЭРСДЭЛ", value: data.riskLevel === "Low" ? "Бага" : data.riskLevel === "Medium" ? "Дунд" : "Өндөр", color: riskColor },
          { label: "БОЛОМЖ", value: data.quitPotential === "High" ? "Өндөр" : data.quitPotential === "Medium" ? "Дунд" : "Бага", color: potColor },
        ].map((s, i) => (
          <div key={i} style={{
            flex: 1, padding: "12px 8px", textAlign: "center",
            borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none"
          }}>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 700, letterSpacing: "0.5px", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Metrics */}
      <div style={{ padding: "14px 18px 6px", background: "#111" }}>
        {data.metrics.slice(0, 2).map((m, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{m.label}</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{m.score}/{m.maxScore}</span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 6, height: 6, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 6,
                width: barW ? `${(m.score / m.maxScore) * 100}%` : "0%",
                background: m.score / m.maxScore > 0.6
                  ? "linear-gradient(90deg, #FF453A, #FF6B6B)"
                  : m.score / m.maxScore > 0.3
                    ? "linear-gradient(90deg, #FF9F0A, #FFD60A)"
                    : "linear-gradient(90deg, #30D158, #34C759)",
                transition: "width 1.2s cubic-bezier(.16,1,.3,1)",
                boxShadow: "0 0 8px currentColor"
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Insights preview */}
      <div style={{ padding: "4px 16px 14px", display: "flex", gap: 8, background: "#111" }}>
        {data.insights?.slice(0, 3).map((ins, i) => (
          <div key={i} style={{
            flex: 1, background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12, padding: "8px 10px",
            transition: "background 0.2s"
          }}>
            <span style={{ fontSize: 16 }}>{ins.emoji}</span>
            <p style={{
              fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.55)",
              margin: "4px 0 0", overflow: "hidden",
              textOverflow: "ellipsis", whiteSpace: "nowrap"
            }}>{ins.title}</p>
          </div>
        ))}
      </div>

      {/* Expand button */}
      <div style={{ padding: "0 16px 16px", background: "#111" }}>
        <div style={{
          width: "100%", padding: "13px",
          background: "linear-gradient(135deg, #E8541A, #FF6B3D)",
          borderRadius: 14,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          boxShadow: "0 4px 20px rgba(232,84,26,0.35)",
          transition: "all 0.2s ease",
          transform: hovered ? "scale(1.02)" : "scale(1)"
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
          <span style={{ color: "#fff", fontSize: 14, fontWeight: 800, letterSpacing: "-0.2px" }}>
            Дэлгэрэнгүй шинжилгээ
          </span>
        </div>
      </div>

      <style>{`
        @keyframes orb-pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  )
}

// ── Full Analysis Results ────────────────────────────────────────────────────
export function AnalysisResults({ data, reportTitle, onClose, onAskAI }: Props) {
  const [screen, setScreen] = useState(0)
  const [prevScreen, setPrevScreen] = useState(0)
  const [selectedInsight, setSelectedInsight] = useState<AnalysisData["insights"][0] | null>(null)
  const [roadmapWeek, setRoadmapWeek] = useState(0)
  const [chatInput, setChatInput] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)
  const [barsAnimated, setBarsAnimated] = useState(false)
  const touchX = useRef(0)

  useEffect(() => { setTimeout(() => setBarsAnimated(true), 400) }, [])

  const goTo = (i: number) => {
    setPrevScreen(screen)
    setScreen(i)
  }

  const scoreColor = data.healthScore >= 70 ? "#30D158" : data.healthScore >= 40 ? "#FF9F0A" : "#FF453A"
  const riskColor = data.riskLevel === "Low" ? "#30D158" : data.riskLevel === "Medium" ? "#FF9F0A" : "#FF453A"
  const potColor = data.quitPotential === "High" ? "#30D158" : data.quitPotential === "Medium" ? "#FF9F0A" : "#FF453A"

  const handleExpand = () => {
    const next = !isExpanded
    setIsExpanded(next)
    if (typeof window !== "undefined" && window.parent !== window) {
      window.parent.postMessage({ type: next ? "HIREMN_ANALYSIS_EXPAND" : "HIREMN_ANALYSIS_COLLAPSE" }, "*")
    }
  }

  const handleClose = () => {
    if (isExpanded && typeof window !== "undefined" && window.parent !== window) {
      window.parent.postMessage({ type: "HIREMN_ANALYSIS_COLLAPSE" }, "*")
    }
    onClose()
  }

  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX }
  const onTouchEnd = (e: React.TouchEvent) => {
    const d = touchX.current - e.changedTouches[0].clientX
    if (Math.abs(d) > 50) {
      if (d > 0 && screen < 3) goTo(screen + 1)
      if (d < 0 && screen > 0) goTo(screen - 1)
    }
  }

  return (
    <div style={{
      position: "absolute", inset: 0,
      background: "#0A0A0A",
      display: "flex", flexDirection: "column",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      zIndex: 50,
      animation: "ar-in 0.35s cubic-bezier(.16,1,.3,1)"
    }}>

      {/* ── Top Bar ── */}
      <div style={{
        background: "rgba(10,10,10,0.95)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "14px 16px 0",
        flexShrink: 0
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <button onClick={handleClose} style={{
            background: "rgba(255,255,255,0.08)", border: "none",
            borderRadius: 20, padding: "7px 14px",
            fontSize: 13, color: "rgba(255,255,255,0.7)",
            cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
            transition: "all 0.2s"
          }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.14)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"}
          >
            ← Буцах
          </button>

          <span style={{
            fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.85)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 150
          }}>{reportTitle}</span>

          <button onClick={handleExpand} style={{
            background: "rgba(255,255,255,0.08)", border: "none",
            borderRadius: 20, padding: "7px 10px",
            cursor: "pointer", color: "rgba(255,255,255,0.6)",
            display: "flex", alignItems: "center", transition: "all 0.2s"
          }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.14)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {isExpanded
                ? <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" />
                : <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />}
            </svg>
          </button>
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 2 }}>
          {SCREENS.map((s, i) => (
            <button key={i} onClick={() => goTo(i)} style={{
              flex: 1, background: "none", border: "none",
              padding: "8px 4px 12px", fontSize: 12, fontWeight: 700,
              cursor: "pointer", whiteSpace: "nowrap",
              color: screen === i ? "#fff" : "rgba(255,255,255,0.35)",
              borderBottom: screen === i ? `2px solid ${BRAND}` : "2px solid transparent",
              transition: "all 0.25s ease", letterSpacing: "-0.1px"
            }}>{s}</button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

        {/* SCREEN 0 — Summary */}
        {screen === 0 && (
          <div style={{ animation: "screen-in 0.3s ease" }}>
            {/* Hero */}
            <div style={{
              background: "linear-gradient(160deg, #1a0a00 0%, #0d0d1a 50%, #001a0d 100%)",
              padding: "32px 20px 28px", textAlign: "center",
              position: "relative", overflow: "hidden"
            }}>
              {/* Ambient glow */}
              <div style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%,-50%)",
                width: 200, height: 200, borderRadius: "50%",
                background: `radial-gradient(circle, ${scoreColor}15, transparent 70%)`,
                animation: "glow-pulse 3s ease-in-out infinite"
              }} />

              <div style={{ position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                  <CircularScore score={data.healthScore} size={130} />
                </div>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: `${scoreColor}15`, borderRadius: 24,
                  padding: "8px 20px", border: `1px solid ${scoreColor}30`,
                  marginBottom: 12
                }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: scoreColor, boxShadow: `0 0 8px ${scoreColor}` }} />
                  <span style={{ color: scoreColor, fontWeight: 800, fontSize: 16 }}>{data.summary.title}</span>
                </div>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 1.7, margin: 0, maxWidth: 280, marginInline: "auto" }}>
                  {data.summary.description}
                </p>
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, background: "rgba(255,255,255,0.04)", margin: "1px 0" }}>
              {[
                { label: "ХАМААРАЛ", value: data.metrics[0] ? `${data.metrics[0].score}/${data.metrics[0].maxScore}` : "—", sub: data.metrics[0]?.status, color: BRAND },
                { label: "ЭРСДЭЛ", value: data.riskLevel === "Low" ? "Бага" : data.riskLevel === "Medium" ? "Дунд" : "Өндөр", sub: "түвшин", color: riskColor },
                { label: "БОЛОМЖ", value: data.quitPotential === "High" ? "Өндөр" : data.quitPotential === "Medium" ? "Дунд" : "Бага", sub: "магадлал", color: potColor },
              ].map((c, i) => (
                <div key={i} style={{
                  background: "#111", padding: "16px 12px", textAlign: "center",
                  transition: "background 0.2s"
                }}>
                  <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 700, letterSpacing: "0.5px", margin: "0 0 6px" }}>{c.label}</p>
                  <p style={{ fontSize: 22, fontWeight: 900, color: c.color, margin: "0 0 2px", lineHeight: 1 }}>{c.value}</p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0 }}>{c.sub}</p>
                </div>
              ))}
            </div>

            {/* Metrics */}
            <div style={{ padding: "20px 16px" }}>
              {data.metrics.map((m, i) => (
                <div key={i} style={{
                  background: "#111",
                  borderRadius: 18, padding: "16px 18px",
                  marginBottom: 10,
                  border: "1px solid rgba(255,255,255,0.06)",
                  transition: "border-color 0.2s"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{m.label}</span>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", fontVariantNumeric: "tabular-nums" }}>
                      {m.score}/{m.maxScore}
                    </span>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 8, height: 8, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 8,
                      width: barsAnimated ? `${(m.score / m.maxScore) * 100}%` : "0%",
                      background: m.score / m.maxScore > 0.6
                        ? "linear-gradient(90deg, #FF453A, #FF6B6B)"
                        : m.score / m.maxScore > 0.3
                          ? "linear-gradient(90deg, #FF9F0A, #FFD60A)"
                          : "linear-gradient(90deg, #30D158, #34C759)",
                      transition: `width ${1.2 + i * 0.15}s cubic-bezier(.16,1,.3,1)`,
                      boxShadow: "0 0 12px currentColor"
                    }} />
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: BRAND, marginTop: 8 }}>{m.status}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SCREEN 1 — Insights */}
        {screen === 1 && (
          <div style={{ padding: "20px 16px", animation: "screen-in 0.3s ease" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.6px", marginBottom: 16 }}>
              ТАНЫ ХУВИЙН ДҮГНЭЛТ — дарж дэлгэрэнгүй харна
            </p>
            {data.insights.map((ins, i) => (
              <div
                key={i}
                onClick={() => setSelectedInsight(ins)}
                style={{
                  background: "#111",
                  borderRadius: 20, padding: "18px 20px",
                  marginBottom: 10, cursor: "pointer",
                  border: "1px solid rgba(255,255,255,0.06)",
                  display: "flex", alignItems: "center", gap: 16,
                  transition: "all 0.2s ease",
                  animation: `card-in 0.4s cubic-bezier(.16,1,.3,1) ${i * 0.08}s both`
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = "#1a1a1a"
                  el.style.borderColor = `${BRAND}40`
                  el.style.transform = "translateY(-2px)"
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = "#111"
                  el.style.borderColor = "rgba(255,255,255,0.06)"
                  el.style.transform = "translateY(0)"
                }}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: 18,
                  background: `${BRAND}15`,
                  border: `1px solid ${BRAND}25`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 26, flexShrink: 0
                }}>{ins.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.9)", margin: "0 0 4px" }}>{ins.title}</p>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.5 }}>{ins.description}</p>
                </div>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "rgba(255,255,255,0.06)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0
                }}>
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 16 }}>›</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SCREEN 2 — Strengths vs Risks */}
        {screen === 2 && (
          <div style={{ padding: "20px 16px", animation: "screen-in 0.3s ease" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {/* Strengths */}
              <div style={{
                background: "#0d1a0d",
                borderRadius: 20, padding: "18px 16px",
                border: "1px solid rgba(48,209,88,0.15)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: "rgba(48,209,88,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16
                  }}>💪</div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#30D158" }}>Давуу тал</span>
                </div>
                {data.strengths.map((s, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 8, marginBottom: 10, alignItems: "flex-start",
                    animation: `card-in 0.35s ease ${i * 0.06}s both`
                  }}>
                    <span style={{ color: "#30D158", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>{s}</span>
                  </div>
                ))}
              </div>

              {/* Risks */}
              <div style={{
                background: "#1a0d0d",
                borderRadius: 20, padding: "18px 16px",
                border: "1px solid rgba(255,69,58,0.15)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: "rgba(255,69,58,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16
                  }}>⚠️</div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#FF453A" }}>Эрсдэл</span>
                </div>
                {data.risks.map((r, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 8, marginBottom: 10, alignItems: "flex-start",
                    animation: `card-in 0.35s ease ${i * 0.06}s both`
                  }}>
                    <span style={{ color: "#FF453A", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>•</span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>{r}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Chat prompt */}
            <div style={{
              background: "linear-gradient(135deg, #1a0800, #2a1200)",
              borderRadius: 20, padding: "20px",
              border: `1px solid ${BRAND}30`
            }}>
              <p style={{ color: `${BRAND}80`, fontSize: 10, fontWeight: 700, letterSpacing: "0.5px", margin: "0 0 6px" }}>💬 AI-ААС АСУУ</p>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: 600, margin: "0 0 16px" }}>
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
                    flex: 1, background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 12, padding: "11px 14px",
                    color: "#fff", fontSize: 14, outline: "none",
                    fontFamily: "inherit"
                  }} />
                <button
                  onClick={() => {
                    if (chatInput.trim()) { onAskAI(chatInput.trim()); setChatInput(""); handleClose() }
                  }}
                  style={{
                    background: `linear-gradient(135deg, ${BRAND}, #FF6B3D)`,
                    border: "none", borderRadius: 12,
                    padding: "11px 18px", color: "#fff",
                    fontWeight: 800, fontSize: 14, cursor: "pointer",
                    boxShadow: `0 4px 16px ${BRAND}40`
                  }}
                >→</button>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 3 — Roadmap */}
        {screen === 3 && (
          <div style={{ padding: "20px 16px", animation: "screen-in 0.3s ease" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.6px", marginBottom: 16 }}>
              30 ХОНОГИЙН ЗАМНАЛ
            </p>

            {/* Week selector */}
            <div style={{
              background: "#111", borderRadius: 20, padding: "18px 20px",
              marginBottom: 14, border: "1px solid rgba(255,255,255,0.06)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {data.roadmap.map((_, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", flex: i < data.roadmap.length - 1 ? 1 : 0 }}>
                    <button
                      onClick={() => setRoadmapWeek(i)}
                      style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: i === roadmapWeek
                          ? `linear-gradient(135deg, ${BRAND}, #FF6B3D)`
                          : i < roadmapWeek
                            ? "rgba(232,84,26,0.25)"
                            : "rgba(255,255,255,0.08)",
                        border: i === roadmapWeek ? "none" : "1px solid rgba(255,255,255,0.08)",
                        cursor: "pointer", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: i <= roadmapWeek ? "#fff" : "rgba(255,255,255,0.3)",
                        fontWeight: 800, fontSize: 13,
                        transition: "all 0.3s ease",
                        boxShadow: i === roadmapWeek ? `0 4px 16px ${BRAND}40` : "none"
                      }}
                    >{i + 1}</button>
                    {i < data.roadmap.length - 1 && (
                      <div style={{
                        flex: 1, height: 2, marginLeft: 4,
                        background: i < roadmapWeek
                          ? `linear-gradient(90deg, ${BRAND}60, ${BRAND}20)`
                          : "rgba(255,255,255,0.06)",
                        borderRadius: 2, transition: "background 0.3s"
                      }} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Week content */}
            {data.roadmap[roadmapWeek] && (
              <div style={{
                background: "#111", borderRadius: 22, padding: "24px 22px",
                border: "1px solid rgba(255,255,255,0.06)",
                animation: "screen-in 0.25s ease"
              }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: `${BRAND}15`, borderRadius: 12,
                  padding: "5px 14px", marginBottom: 14,
                  border: `1px solid ${BRAND}25`
                }}>
                  <span style={{ color: BRAND, fontSize: 12, fontWeight: 800 }}>{data.roadmap[roadmapWeek].week}</span>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: "#fff", margin: "0 0 18px" }}>
                  {data.roadmap[roadmapWeek].title}
                </h3>
                {data.roadmap[roadmapWeek].tasks.map((task, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "flex-start", gap: 14,
                    marginBottom: 12, padding: "14px 16px",
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)",
                    animation: `card-in 0.3s ease ${i * 0.07}s both`
                  }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: "50%",
                      background: `${BRAND}20`, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: `1px solid ${BRAND}30`
                    }}>
                      <span style={{ color: BRAND, fontSize: 12, fontWeight: 800 }}>✓</span>
                    </div>
                    <span style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>{task}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button
                onClick={() => setRoadmapWeek(w => Math.max(0, w - 1))}
                disabled={roadmapWeek === 0}
                style={{
                  flex: 1, padding: "13px", borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.05)",
                  color: roadmapWeek === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)",
                  fontSize: 14, fontWeight: 700, cursor: roadmapWeek === 0 ? "not-allowed" : "pointer",
                  transition: "all 0.2s"
                }}>← Өмнөх</button>
              <button
                onClick={() => setRoadmapWeek(w => Math.min(data.roadmap.length - 1, w + 1))}
                disabled={roadmapWeek === data.roadmap.length - 1}
                style={{
                  flex: 1, padding: "13px", borderRadius: 16, border: "none",
                  background: roadmapWeek === data.roadmap.length - 1
                    ? "rgba(255,255,255,0.06)"
                    : `linear-gradient(135deg, ${BRAND}, #FF6B3D)`,
                  color: roadmapWeek === data.roadmap.length - 1 ? "rgba(255,255,255,0.25)" : "#fff",
                  fontSize: 14, fontWeight: 700,
                  cursor: roadmapWeek === data.roadmap.length - 1 ? "not-allowed" : "pointer",
                  boxShadow: roadmapWeek === data.roadmap.length - 1 ? "none" : `0 4px 16px ${BRAND}40`,
                  transition: "all 0.2s"
                }}>Дараах →</button>
            </div>
          </div>
        )}
      </div>

      <BottomSheet insight={selectedInsight} onClose={() => setSelectedInsight(null)} />

      <style>{`
        @keyframes ar-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes screen-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes card-in {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.4; transform: translate(-50%,-50%) scale(1); }
          50% { opacity: 0.8; transform: translate(-50%,-50%) scale(1.15); }
        }
        @keyframes orb-pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  )
}