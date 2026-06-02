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

const scoreColor = (s: number) => s >= 70 ? "#00C853" : s >= 40 ? "#FF9800" : "#F44336"
const riskLabel = (r: string) => r === "Low" ? "Бага" : r === "Medium" ? "Дунд" : "Өндөр"
const potLabel = (p: string) => p === "High" ? "Өндөр" : p === "Medium" ? "Дунд" : "Бага"

// ── Score Ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const [disp, setDisp] = useState(0)
  const [off, setOff] = useState(0)
  const r = size * 0.36
  const circ = 2 * Math.PI * r

  useEffect(() => {
    const end = Math.min(Math.max(score, 0), 100)
    const dur = 1400; const st = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - st) / dur, 1)
      const e = 1 - Math.pow(1 - p, 3)
      setDisp(Math.round(e * end))
      setOff(circ - e * (end / 100) * circ)
      if (p < 1) requestAnimationFrame(tick)
    }
    setTimeout(() => requestAnimationFrame(tick), 150)
  }, [score, circ])

  const c = scoreColor(score)
  const track = score >= 70 ? "#E8F5E9" : score >= 40 ? "#FFF3E0" : "#FFEBEE"

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={size * 0.075} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c} strokeWidth={size * 0.075}
          strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size * 0.28, fontWeight: 900, color: "#1A1A2E", lineHeight: 1 }}>{disp}</span>
        <span style={{ fontSize: size * 0.1, color: "#9E9E9E", fontWeight: 600 }}>/100</span>
      </div>
    </div>
  )
}

// ── Mini bar ─────────────────────────────────────────────────────────────────
function MiniBar({ pct, color, animated }: { pct: number; color: string; animated: boolean }) {
  return (
    <div style={{ background: "#F0F0F5", borderRadius: 8, height: 8, overflow: "hidden" }}>
      <div style={{
        height: "100%", borderRadius: 8, background: color,
        width: animated ? `${pct}%` : "0%",
        transition: "width 1.1s cubic-bezier(.16,1,.3,1)"
      }} />
    </div>
  )
}

// ── Bottom sheet ─────────────────────────────────────────────────────────────
function Sheet({ insight, onClose }: { insight: AnalysisData["insights"][0] | null; onClose: () => void }) {
  const [vis, setVis] = useState(false)
  useEffect(() => { if (insight) setTimeout(() => setVis(true), 10); else setVis(false) }, [insight])
  if (!insight) return null
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0,
      background: `rgba(0,0,0,${vis ? 0.45 : 0})`,
      zIndex: 200, display: "flex", alignItems: "flex-end",
      transition: "background 0.25s",
      backdropFilter: "blur(3px)"
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", background: "#fff",
        borderRadius: "24px 24px 0 0",
        transform: vis ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.38s cubic-bezier(.16,1,.3,1)",
        maxHeight: "78vh", overflowY: "auto"
      }}>
        <div style={{ padding: "14px 0 0", display: "flex", justifyContent: "center" }}>
          <div style={{ width: 36, height: 4, background: "#E0E0E0", borderRadius: 2 }} />
        </div>
        <div style={{ padding: "20px 24px 36px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 18,
              background: "#FFF3EE", fontSize: 28,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "1.5px solid #FFD0B8"
            }}>{insight.emoji}</div>
            <h3 style={{ fontSize: 19, fontWeight: 800, color: "#1A1A2E", margin: 0 }}>{insight.title}</h3>
          </div>
          <div style={{ background: "#F8F9FF", borderRadius: 16, padding: "16px", marginBottom: 18 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#9E9E9E", letterSpacing: "0.6px", margin: "0 0 8px" }}>ЯАГААД ЧУХАЛ ВЭ</p>
            <p style={{ fontSize: 14, color: "#424242", lineHeight: 1.7, margin: 0 }}>{insight.detail}</p>
          </div>
          {insight.actions?.length > 0 && (
            <>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#9E9E9E", letterSpacing: "0.6px", margin: "0 0 12px" }}>ХИЙЖ БОЛОХ АЛХМУУД</p>
              {insight.actions.map((a, i) => (
                <div key={i} style={{
                  display: "flex", gap: 12, marginBottom: 10,
                  padding: "12px 14px", background: "#F8F9FF",
                  borderRadius: 12, alignItems: "flex-start",
                  border: "1px solid #E8EAF6"
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: "#FFF3EE", border: `1px solid ${BRAND}30`,
                    flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <span style={{ color: BRAND, fontSize: 11, fontWeight: 800 }}>✓</span>
                  </div>
                  <span style={{ fontSize: 13, color: "#424242", lineHeight: 1.6 }}>{a}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Analysis Card (inline in chat) ───────────────────────────────────────────
export function AnalysisCard({ data, title, onExpand }: { data: AnalysisData; title: string; onExpand: () => void }) {
  const [hov, setHov] = useState(false)
  const [bar, setBar] = useState(false)
  const sc = scoreColor(data.healthScore)
  const rc = data.riskLevel === "Low" ? "#00C853" : data.riskLevel === "Medium" ? "#FF9800" : "#F44336"
  const pc = data.quitPotential === "High" ? "#00C853" : data.quitPotential === "Medium" ? "#FF9800" : "#F44336"

  useEffect(() => { setTimeout(() => setBar(true), 400) }, [])

  return (
    <div
      onClick={onExpand}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "#fff",
        borderRadius: 20, overflow: "hidden", cursor: "pointer",
        boxShadow: hov
          ? "0 16px 48px rgba(0,0,0,0.14), 0 0 0 1.5px rgba(232,84,26,0.2)"
          : "0 4px 20px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)",
        transform: hov ? "translateY(-3px)" : "translateY(0)",
        transition: "all 0.25s cubic-bezier(.16,1,.3,1)"
      }}
    >
      {/* Top gradient header */}
      <div style={{
        background: "linear-gradient(135deg, #FFF5F2 0%, #FFF0E8 100%)",
        borderBottom: "1px solid #FFE4D4",
        padding: "18px 20px 14px",
        display: "flex", alignItems: "center", gap: 16
      }}>
        <ScoreRing score={data.healthScore} size={72} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: BRAND, animation: "blink 2s ease infinite" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: BRAND, letterSpacing: "0.6px" }}>AI ШИНЖИЛГЭЭ</span>
          </div>
          <p style={{ fontSize: 15, fontWeight: 800, color: "#1A1A2E", margin: "0 0 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</p>
          <div style={{
            display: "inline-block", background: `${sc}18`,
            borderRadius: 20, padding: "3px 12px",
            border: `1px solid ${sc}30`
          }}>
            <span style={{ color: sc, fontSize: 11, fontWeight: 700 }}>{data.summary.title}</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", borderBottom: "1px solid #F5F5F5" }}>
        {[
          { label: "ХАМААРАЛ", value: data.metrics[0] ? `${data.metrics[0].score}/${data.metrics[0].maxScore}` : "—", color: BRAND },
          { label: "ЭРСДЭЛ", value: riskLabel(data.riskLevel), color: rc },
          { label: "БОЛОМЖ", value: potLabel(data.quitPotential), color: pc },
        ].map((s, i) => (
          <div key={i} style={{
            flex: 1, padding: "10px 8px", textAlign: "center",
            borderRight: i < 2 ? "1px solid #F5F5F5" : "none"
          }}>
            <p style={{ fontSize: 8, color: "#BDBDBD", fontWeight: 700, letterSpacing: "0.5px", margin: "0 0 4px" }}>{s.label}</p>
            <p style={{ fontSize: 17, fontWeight: 900, color: s.color, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Metric bars */}
      <div style={{ padding: "14px 18px 10px" }}>
        {data.metrics.slice(0, 2).map((m, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#424242" }}>{m.label}</span>
              <span style={{ fontSize: 11, color: "#9E9E9E" }}>{m.score}/{m.maxScore}</span>
            </div>
            <MiniBar
              pct={(m.score / m.maxScore) * 100}
              color={m.score / m.maxScore > 0.6 ? "#F44336" : m.score / m.maxScore > 0.3 ? "#FF9800" : "#00C853"}
              animated={bar}
            />
          </div>
        ))}
      </div>

      {/* Insight pills */}
      <div style={{ display: "flex", gap: 6, padding: "0 16px 14px" }}>
        {data.insights?.slice(0, 3).map((ins, i) => (
          <div key={i} style={{
            flex: 1, background: "#F8F9FF",
            borderRadius: 10, padding: "8px",
            border: "1px solid #EEF0FF"
          }}>
            <span style={{ fontSize: 16 }}>{ins.emoji}</span>
            <p style={{ fontSize: 10, fontWeight: 600, color: "#757575", margin: "4px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ins.title}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          background: `linear-gradient(135deg, ${BRAND}, #FF7043)`,
          borderRadius: 14, padding: "13px",
          boxShadow: "0 6px 20px rgba(232,84,26,0.3)",
          transform: hov ? "scale(1.02)" : "scale(1)",
          transition: "transform 0.2s"
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 800, letterSpacing: "-0.2px" }}>Дэлгэрэнгүй шинжилгээ</span>
        </div>
      </div>

      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  )
}

// ── Full screen results ───────────────────────────────────────────────────────
export function AnalysisResults({ data, reportTitle, onClose, onAskAI }: Props) {
  const [screen, setScreen] = useState(0)
  const [ins, setIns] = useState<AnalysisData["insights"][0] | null>(null)
  const [week, setWeek] = useState(0)
  const [chatInput, setChatInput] = useState("")
  const [bar, setBar] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const touchX = useRef(0)
  const sc = scoreColor(data.healthScore)
  const rc = data.riskLevel === "Low" ? "#00C853" : data.riskLevel === "Medium" ? "#FF9800" : "#F44336"
  const pc = data.quitPotential === "High" ? "#00C853" : data.quitPotential === "Medium" ? "#FF9800" : "#F44336"

  useEffect(() => { setTimeout(() => setBar(true), 350) }, [])

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

  const onTS = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX }
  const onTE = (e: React.TouchEvent) => {
    const d = touchX.current - e.changedTouches[0].clientX
    if (Math.abs(d) > 50) { if (d > 0 && screen < 3) setScreen(s => s + 1); if (d < 0 && screen > 0) setScreen(s => s - 1) }
  }

  const metricColor = (pct: number) => pct > 0.6 ? "#F44336" : pct > 0.3 ? "#FF9800" : "#00C853"

  return (
    <div style={{
      position: "absolute", inset: 0,
      background: "#F4F6FA",
      display: "flex", flexDirection: "column",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      zIndex: 50, animation: "ar-in 0.3s ease"
    }}>

      {/* ── Header ── */}
      <div style={{
        background: "#fff",
        borderBottom: "1px solid #EEEEEE",
        padding: "12px 16px 0", flexShrink: 0,
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <button onClick={close} style={{
            background: "#F5F5F5", border: "none",
            borderRadius: 20, padding: "6px 14px",
            fontSize: 13, color: "#616161", cursor: "pointer",
            fontWeight: 600, display: "flex", alignItems: "center", gap: 5,
            transition: "all 0.2s"
          }}>
            ← Буцах
          </button>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1A1A2E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 150 }}>
            {reportTitle}
          </span>
          <button onClick={expand} style={{
            background: "#F5F5F5", border: "none",
            borderRadius: 20, padding: "7px 10px",
            cursor: "pointer", color: "#757575",
            display: "flex", alignItems: "center", transition: "all 0.2s"
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              {expanded
                ? <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" />
                : <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />}
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex" }}>
          {SCREENS.map((s, i) => (
            <button key={i} onClick={() => setScreen(i)} style={{
              flex: 1, background: "none", border: "none",
              padding: "8px 4px 12px", fontSize: 12, fontWeight: 700,
              cursor: "pointer", color: screen === i ? BRAND : "#9E9E9E",
              borderBottom: screen === i ? `2.5px solid ${BRAND}` : "2.5px solid transparent",
              transition: "all 0.2s"
            }}>{s}</button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}
        onTouchStart={onTS} onTouchEnd={onTE}>

        {/* SCREEN 0 — Summary Dashboard */}
        {screen === 0 && (
          <div style={{ padding: "16px", animation: "si 0.25s ease" }}>

            {/* Score card */}
            <div style={{
              background: "#fff", borderRadius: 20,
              padding: "24px", marginBottom: 12,
              boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
              display: "flex", alignItems: "center", gap: 20
            }}>
              <ScoreRing score={data.healthScore} size={100} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, color: "#9E9E9E", fontWeight: 700, letterSpacing: "0.5px", margin: "0 0 6px" }}>ЭРҮҮЛ МЭНДИЙН ОНОО</p>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  background: `${sc}12`, borderRadius: 20, padding: "5px 14px",
                  border: `1.5px solid ${sc}25`, marginBottom: 8
                }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: sc }} />
                  <span style={{ color: sc, fontWeight: 800, fontSize: 13 }}>{data.summary.title}</span>
                </div>
                <p style={{ fontSize: 13, color: "#616161", lineHeight: 1.6, margin: 0 }}>{data.summary.description}</p>
              </div>
            </div>

            {/* KPI cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 12 }}>
              {[
                { label: "Хамаарал", value: data.metrics[0] ? `${data.metrics[0].score}/${data.metrics[0].maxScore}` : "—", sub: data.metrics[0]?.status, color: BRAND, bg: "#FFF5F2", border: "#FFD0B8" },
                { label: "Эрсдэл", value: riskLabel(data.riskLevel), sub: "түвшин", color: rc, bg: rc === "#00C853" ? "#F1FFF6" : rc === "#FF9800" ? "#FFF8E1" : "#FFF2F2", border: `${rc}30` },
                { label: "Боломж", value: potLabel(data.quitPotential), sub: "магадлал", color: pc, bg: pc === "#00C853" ? "#F1FFF6" : pc === "#FF9800" ? "#FFF8E1" : "#FFF2F2", border: `${pc}30` },
              ].map((c, i) => (
                <div key={i} style={{
                  background: c.bg, borderRadius: 16,
                  padding: "14px 10px", textAlign: "center",
                  border: `1.5px solid ${c.border}`
                }}>
                  <p style={{ fontSize: 9, color: "#9E9E9E", fontWeight: 700, letterSpacing: "0.5px", margin: "0 0 5px" }}>{c.label.toUpperCase()}</p>
                  <p style={{ fontSize: 19, fontWeight: 900, color: c.color, margin: "0 0 2px" }}>{c.value}</p>
                  <p style={{ fontSize: 10, color: "#BDBDBD", margin: 0 }}>{c.sub}</p>
                </div>
              ))}
            </div>

            {/* Metrics */}
            {data.metrics.map((m, i) => (
              <div key={i} style={{
                background: "#fff", borderRadius: 16,
                padding: "16px 18px", marginBottom: 10,
                boxShadow: "0 2px 12px rgba(0,0,0,0.05)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#1A1A2E", margin: "0 0 2px" }}>{m.label}</p>
                    <p style={{ fontSize: 11, fontWeight: 600, color: metricColor(m.score / m.maxScore), margin: 0 }}>{m.status}</p>
                  </div>
                  <div style={{
                    background: `${metricColor(m.score / m.maxScore)}12`,
                    borderRadius: 10, padding: "4px 10px",
                    border: `1px solid ${metricColor(m.score / m.maxScore)}25`
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: metricColor(m.score / m.maxScore) }}>
                      {m.score}/{m.maxScore}
                    </span>
                  </div>
                </div>
                <div style={{ background: "#F0F0F5", borderRadius: 8, height: 10, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 8,
                    width: bar ? `${(m.score / m.maxScore) * 100}%` : "0%",
                    background: `linear-gradient(90deg, ${metricColor(m.score / m.maxScore)}, ${metricColor(m.score / m.maxScore)}88)`,
                    transition: `width ${1.1 + i * 0.1}s cubic-bezier(.16,1,.3,1)`
                  }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SCREEN 1 — Insights */}
        {screen === 1 && (
          <div style={{ padding: "16px", animation: "si 0.25s ease" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#9E9E9E", letterSpacing: "0.6px", marginBottom: 14 }}>
              ТАНЫ ХУВИЙН ДҮГНЭЛТ — дарж дэлгэрэнгүй харна
            </p>
            {data.insights.map((insight, i) => (
              <div key={i} onClick={() => setIns(insight)} style={{
                background: "#fff", borderRadius: 18,
                padding: "16px 18px", marginBottom: 10,
                display: "flex", alignItems: "center", gap: 14,
                cursor: "pointer",
                boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                border: "1.5px solid transparent",
                transition: "all 0.2s",
                animation: `ci 0.35s ease ${i * 0.07}s both`
              }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = `${BRAND}30`
                  el.style.transform = "translateY(-2px)"
                  el.style.boxShadow = "0 8px 24px rgba(232,84,26,0.1)"
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = "transparent"
                  el.style.transform = "translateY(0)"
                  el.style.boxShadow = "0 2px 12px rgba(0,0,0,0.05)"
                }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 16,
                  background: "#FFF5F2", fontSize: 24,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "1.5px solid #FFD0B8", flexShrink: 0
                }}>{insight.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#1A1A2E", margin: "0 0 4px" }}>{insight.title}</p>
                  <p style={{ fontSize: 13, color: "#757575", margin: 0, lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{insight.description}</p>
                </div>
                <div style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: "#F5F5F5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                }}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#9E9E9E" strokeWidth="2" strokeLinecap="round">
                    <path d="M6 4l4 4-4 4" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SCREEN 2 — Strengths vs Risks */}
        {screen === 2 && (
          <div style={{ padding: "16px", animation: "si 0.25s ease" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div style={{
                background: "#fff", borderRadius: 18, padding: "18px 16px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                border: "1.5px solid #E8F5E9"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 10, background: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>💪</div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#2E7D32" }}>Давуу тал</span>
                </div>
                {data.strengths.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 9, alignItems: "flex-start", animation: `ci 0.3s ease ${i * 0.05}s both` }}>
                    <span style={{ color: "#00C853", fontWeight: 800, fontSize: 13, flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span style={{ fontSize: 12, color: "#424242", lineHeight: 1.5 }}>{s}</span>
                  </div>
                ))}
              </div>
              <div style={{
                background: "#fff", borderRadius: 18, padding: "18px 16px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                border: "1.5px solid #FFEBEE"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 10, background: "#FFEBEE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>⚠️</div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#C62828" }}>Эрсдэл</span>
                </div>
                {data.risks.map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 9, alignItems: "flex-start", animation: `ci 0.3s ease ${i * 0.05}s both` }}>
                    <span style={{ color: "#F44336", fontWeight: 800, fontSize: 13, flexShrink: 0, marginTop: 1 }}>•</span>
                    <span style={{ fontSize: 12, color: "#424242", lineHeight: 1.5 }}>{r}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI chat */}
            <div style={{
              background: "#fff", borderRadius: 18, padding: "18px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
              border: `1.5px solid ${BRAND}20`
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "#FFF5F2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>💬</div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E" }}>AI-ААС АСУУ</span>
              </div>
              <p style={{ fontSize: 12, color: "#9E9E9E", margin: "0 0 14px" }}>Тайлбар, зөвлөгөө авах боломжтой</p>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={chatInput} onChange={e => setChatInput(e.target.value)}
                  placeholder="Асуулт бичнэ үү..."
                  onKeyDown={e => { if (e.key === "Enter" && chatInput.trim()) { onAskAI(chatInput.trim()); setChatInput(""); close() } }}
                  style={{
                    flex: 1, background: "#F8F9FF", border: "1.5px solid #E8EAF6",
                    borderRadius: 12, padding: "10px 14px",
                    color: "#1A1A2E", fontSize: 13, outline: "none", fontFamily: "inherit"
                  }}
                />
                <button onClick={() => { if (chatInput.trim()) { onAskAI(chatInput.trim()); setChatInput(""); close() } }} style={{
                  background: `linear-gradient(135deg, ${BRAND}, #FF7043)`,
                  border: "none", borderRadius: 12,
                  padding: "10px 16px", color: "#fff",
                  fontWeight: 800, fontSize: 14, cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(232,84,26,0.3)"
                }}>→</button>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 3 — Roadmap */}
        {screen === 3 && (
          <div style={{ padding: "16px", animation: "si 0.25s ease" }}>
            {/* Step indicator */}
            <div style={{
              background: "#fff", borderRadius: 18, padding: "16px 18px",
              marginBottom: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.05)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {data.roadmap.map((_, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", flex: i < data.roadmap.length - 1 ? 1 : 0 }}>
                    <button onClick={() => setWeek(i)} style={{
                      width: 34, height: 34, borderRadius: "50%", border: "none",
                      background: i === week
                        ? `linear-gradient(135deg, ${BRAND}, #FF7043)`
                        : i < week ? "#FFF5F2" : "#F5F5F5",
                      cursor: "pointer", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: i === week ? "#fff" : i < week ? BRAND : "#9E9E9E",
                      fontWeight: 800, fontSize: 13,
                      transition: "all 0.25s ease",
                      boxShadow: i === week ? "0 4px 14px rgba(232,84,26,0.3)" : "none",
                      border: i < week && i !== week ? `1.5px solid ${BRAND}30` : "none"
                    } as any}>{i + 1}</button>
                    {i < data.roadmap.length - 1 && (
                      <div style={{
                        flex: 1, height: 2.5, marginLeft: 4,
                        background: i < week ? `linear-gradient(90deg, ${BRAND}, ${BRAND}40)` : "#EEEEEE",
                        borderRadius: 2, transition: "background 0.3s"
                      }} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Week card */}
            {data.roadmap[week] && (
              <div style={{
                background: "#fff", borderRadius: 20, padding: "22px 20px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                animation: "si 0.2s ease"
              }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "#FFF5F2", borderRadius: 10, padding: "4px 14px",
                  border: `1.5px solid ${BRAND}25`, marginBottom: 12
                }}>
                  <span style={{ color: BRAND, fontSize: 12, fontWeight: 800 }}>{data.roadmap[week].week}</span>
                </div>
                <h3 style={{ fontSize: 19, fontWeight: 900, color: "#1A1A2E", margin: "0 0 16px" }}>{data.roadmap[week].title}</h3>
                {data.roadmap[week].tasks.map((task, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 12, marginBottom: 10,
                    padding: "13px 16px", background: "#F8F9FF",
                    borderRadius: 14, border: "1px solid #E8EAF6",
                    animation: `ci 0.3s ease ${i * 0.07}s both`
                  }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: "50%",
                      background: "#FFF5F2", border: `1.5px solid ${BRAND}30`,
                      flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      <span style={{ color: BRAND, fontSize: 11, fontWeight: 800 }}>✓</span>
                    </div>
                    <span style={{ fontSize: 13, color: "#424242", lineHeight: 1.6 }}>{task}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button onClick={() => setWeek(w => Math.max(0, w - 1))} disabled={week === 0} style={{
                flex: 1, padding: "13px", borderRadius: 16,
                border: "1.5px solid #EEEEEE", background: "#fff",
                color: week === 0 ? "#BDBDBD" : "#424242",
                fontSize: 14, fontWeight: 700, cursor: week === 0 ? "not-allowed" : "pointer"
              }}>← Өмнөх</button>
              <button onClick={() => setWeek(w => Math.min(data.roadmap.length - 1, w + 1))} disabled={week === data.roadmap.length - 1} style={{
                flex: 1, padding: "13px", borderRadius: 16, border: "none",
                background: week === data.roadmap.length - 1 ? "#F5F5F5" : `linear-gradient(135deg, ${BRAND}, #FF7043)`,
                color: week === data.roadmap.length - 1 ? "#BDBDBD" : "#fff",
                fontSize: 14, fontWeight: 700,
                cursor: week === data.roadmap.length - 1 ? "not-allowed" : "pointer",
                boxShadow: week === data.roadmap.length - 1 ? "none" : "0 4px 14px rgba(232,84,26,0.3)"
              }}>Дараах →</button>
            </div>
          </div>
        )}
      </div>

      <Sheet insight={ins} onClose={() => setIns(null)} />

      <style>{`
        @keyframes ar-in { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes si { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ci { from{opacity:0;transform:translateY(10px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }
      `}</style>
    </div>
  )
}