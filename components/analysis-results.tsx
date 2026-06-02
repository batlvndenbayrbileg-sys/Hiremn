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

const TEAL = "#00C48C"
const BRAND = "#E8541A"

const sc = (s: number) => s >= 70 ? TEAL : s >= 40 ? "#FF9800" : "#FF4444"
const riskLabel = (r: string) => r === "Low" ? "Low" : r === "Medium" ? "Medium" : "High"
const riskMn = (r: string) => r === "Low" ? "Эрсдэл бага" : r === "Medium" ? "Дунд эрсдэл" : "Өндөр эрсдэл"
const potLabel = (p: string) => p === "High" ? "High" : p === "Medium" ? "Medium" : "Low"
const potMn = (p: string) => p === "High" ? "Амжилтын боломж өндөр" : p === "Medium" ? "Дунд боломж" : "Боломж бага"
const riskColor = (r: string) => r === "Low" ? TEAL : r === "Medium" ? "#FF9800" : "#FF4444"
const potColor = (p: string) => p === "High" ? TEAL : p === "Medium" ? "#FF9800" : "#FF4444"

// ── Score Ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 140 }: { score: number; size?: number }) {
  const [disp, setDisp] = useState(0)
  const [off, setOff] = useState(0)
  const r = size * 0.38, circ = 2 * Math.PI * r
  const color = sc(score)

  useEffect(() => {
    const end = Math.min(Math.max(score, 0), 100)
    const dur = 1600; const st = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - st) / dur, 1)
      const e = 1 - Math.pow(1 - p, 3)
      setDisp(Math.round(e * end))
      setOff(circ - e * (end / 100) * circ)
      if (p < 1) requestAnimationFrame(tick)
    }
    setTimeout(() => requestAnimationFrame(tick), 200)
  }, [score, circ])

  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={`${color}20`} strokeWidth={size * 0.07} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={size * 0.07}
          strokeDasharray={circ} strokeDashoffset={off}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color}60)` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size * 0.27, fontWeight: 900, color: "#1E293B", lineHeight: 1 }}>{disp}</span>
        <span style={{ fontSize: size * 0.1, color: "#94A3B8", fontWeight: 600 }}>/100</span>
      </div>
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
      background: `rgba(0,0,0,${vis ? 0.4 : 0})`,
      zIndex: 200, display: "flex", alignItems: "flex-end",
      transition: "background 0.25s", backdropFilter: "blur(3px)"
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", background: "#fff",
        borderRadius: "24px 24px 0 0",
        transform: vis ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.38s cubic-bezier(.16,1,.3,1)",
        maxHeight: "78vh", overflowY: "auto"
      }}>
        <div style={{ padding: "14px 0 0", display: "flex", justifyContent: "center" }}>
          <div style={{ width: 36, height: 4, background: "#E2E8F0", borderRadius: 2 }} />
        </div>
        <div style={{ padding: "20px 24px 36px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, background: "#F0FDF4", fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid #BBF7D0" }}>{insight.emoji}</div>
            <h3 style={{ fontSize: 19, fontWeight: 800, color: "#1E293B", margin: 0 }}>{insight.title}</h3>
          </div>
          <div style={{ background: "#F8FAFF", borderRadius: 16, padding: "16px", marginBottom: 18, border: "1px solid #E2E8F0" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.6px", margin: "0 0 8px" }}>ЯАГААД ЧУХАЛ ВЭ</p>
            <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.7, margin: 0 }}>{insight.detail}</p>
          </div>
          {insight.actions?.length > 0 && (
            <>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.6px", margin: "0 0 12px" }}>ХИЙЖ БОЛОХ АЛХМУУД</p>
              {insight.actions.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10, padding: "12px 14px", background: "#F0FDF4", borderRadius: 12, border: "1px solid #BBF7D0" }}>
                  <span style={{ color: TEAL, fontSize: 14, fontWeight: 800, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{a}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Compact card ─────────────────────────────────────────────────────────────
export function AnalysisCard({ data, title, onExpand }: { data: AnalysisData; title: string; onExpand: () => void }) {
  const [hov, setHov] = useState(false)
  const [bar, setBar] = useState(false)
  const color = sc(data.healthScore)
  const rc = riskColor(data.riskLevel)
  const pc = potColor(data.quitPotential)

  useEffect(() => { setTimeout(() => setBar(true), 400) }, [])

  const circ = 2 * Math.PI * 28
  const [off, setOff] = useState(circ)
  const [disp, setDisp] = useState(0)

  useEffect(() => {
    const end = data.healthScore
    const dur = 1400; const st = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - st) / dur, 1)
      const e = 1 - Math.pow(1 - p, 3)
      setDisp(Math.round(e * end))
      setOff(circ - e * (end / 100) * circ)
      if (p < 1) requestAnimationFrame(tick)
    }
    setTimeout(() => requestAnimationFrame(tick), 300)
  }, [data.healthScore, circ])

  return (
    <div onClick={onExpand} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: "#fff", borderRadius: 20, overflow: "hidden", cursor: "pointer",
        boxShadow: hov ? "0 20px 48px rgba(0,0,0,0.13), 0 0 0 1.5px rgba(0,196,140,0.25)" : "0 4px 20px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)",
        transform: hov ? "translateY(-3px)" : "translateY(0)",
        transition: "all 0.25s cubic-bezier(.16,1,.3,1)"
      }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #F0FEFA 0%, #E6FFF7 100%)", borderBottom: "1px solid #B2F5E3", padding: "18px 20px 14px", display: "flex", gap: 16, alignItems: "center" }}>
        <div style={{ position: "relative", width: 70, height: 70, flexShrink: 0 }}>
          <svg width="70" height="70" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="35" cy="35" r="28" fill="none" stroke={`${color}25`} strokeWidth="6" />
            <circle cx="35" cy="35" r="28" fill="none" stroke={color} strokeWidth="6"
              strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: "#1E293B", lineHeight: 1 }}>{disp}</span>
            <span style={{ fontSize: 8, color: "#94A3B8" }}>/100</span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: TEAL, letterSpacing: "0.5px" }}>💙 HEALTH SCORE</span>
          </div>
          <p style={{ fontSize: 15, fontWeight: 800, color: "#1E293B", margin: "0 0 5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: `${color}15`, borderRadius: 20, padding: "3px 10px", border: `1px solid ${color}30` }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: color }} />
            <span style={{ color, fontSize: 11, fontWeight: 700 }}>{data.summary.title}</span>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div style={{ display: "flex", borderBottom: "1px solid #F1F5F9" }}>
        {[
          { label: "Никотин хамаарал", value: data.metrics[0] ? `${data.metrics[0].score}/${data.metrics[0].maxScore}` : "—", sub: data.metrics[0]?.status || "", color: BRAND },
          { label: "Эрсдэл (Risk)", value: riskLabel(data.riskLevel), sub: riskMn(data.riskLevel), color: rc },
          { label: "Гарах боломж", value: potLabel(data.quitPotential), sub: potMn(data.quitPotential), color: pc },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, padding: "10px 6px", textAlign: "center", borderRight: i < 2 ? "1px solid #F1F5F9" : "none" }}>
            <p style={{ fontSize: 8, color: "#94A3B8", fontWeight: 700, letterSpacing: "0.4px", margin: "0 0 3px" }}>{s.label.toUpperCase()}</p>
            <p style={{ fontSize: 17, fontWeight: 900, color: s.color, margin: "0 0 1px", lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: 8, color: "#94A3B8", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Bar metrics */}
      <div style={{ padding: "12px 16px 8px" }}>
        {data.metrics.slice(0, 2).map((m, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#475569" }}>{m.label}</span>
              <span style={{ fontSize: 10, color: "#94A3B8" }}>{m.score}/{m.maxScore}</span>
            </div>
            <div style={{ background: "#F1F5F9", borderRadius: 8, height: 7, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 8,
                width: bar ? `${(m.score / m.maxScore) * 100}%` : "0%",
                background: m.score / m.maxScore > 0.6 ? "linear-gradient(90deg,#FF4444,#FF6B6B)" : m.score / m.maxScore > 0.3 ? "linear-gradient(90deg,#FF9800,#FFCC44)" : `linear-gradient(90deg,${TEAL},#00E5A0)`,
                transition: "width 1.1s cubic-bezier(.16,1,.3,1)"
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Insights preview */}
      <div style={{ display: "flex", gap: 6, padding: "0 14px 12px" }}>
        {data.insights?.slice(0, 3).map((ins, i) => (
          <div key={i} style={{ flex: 1, background: "#F8FAFF", borderRadius: 10, padding: "7px 8px", border: "1px solid #E2E8F0" }}>
            <span style={{ fontSize: 15 }}>{ins.emoji}</span>
            <p style={{ fontSize: 9, fontWeight: 600, color: "#64748B", margin: "3px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ins.title}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ padding: "0 14px 14px" }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          background: `linear-gradient(135deg, ${TEAL}, #00A876)`,
          borderRadius: 14, padding: "12px",
          boxShadow: `0 6px 20px ${TEAL}40`,
          transform: hov ? "scale(1.02)" : "scale(1)", transition: "transform 0.2s"
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 800 }}>Дэлгэрэнгүй шинжилгээ харах</span>
        </div>
      </div>
    </div>
  )
}

// ── Full dashboard ────────────────────────────────────────────────────────────
export function AnalysisResults({ data, reportTitle, onClose, onAskAI }: Props) {
  const [insDetail, setInsDetail] = useState<AnalysisData["insights"][0] | null>(null)
  const [bar, setBar] = useState(false)
  const [chatInput, setChatInput] = useState("")
  const [expanded, setExpanded] = useState(false)
  const [goalsDone, setGoalsDone] = useState<boolean[]>([false, false, false])

  useEffect(() => { setTimeout(() => setBar(true), 300) }, [])

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

  const color = sc(data.healthScore)
  const rc = riskColor(data.riskLevel)
  const pc = potColor(data.quitPotential)

  const metricColor = (pct: number) => pct > 0.6 ? "#FF4444" : pct > 0.3 ? "#FF9800" : TEAL
  const metricGrad = (pct: number) => pct > 0.6
    ? "linear-gradient(90deg,#FF4444,#FF6B6B)"
    : pct > 0.3
      ? "linear-gradient(90deg,#FF9800,#FFCC44)"
      : `linear-gradient(90deg,${TEAL},#00E5A0)`

  const weekColors = ["#6C63FF", "#FF6B6B", "#00C48C", "#FF9800"]
  const weekIcons = ["📋", "⚡", "🔄", "🏆"]

  // Simulated extra stats
  const lungAge = Math.round(data.metrics[0]?.score ? 20 + data.metrics[0].score * 2 : 28)
  const heartHealth = data.healthScore >= 70 ? "Good" : data.healthScore >= 40 ? "Fair" : "Poor"
  const moneySaved = Math.round((10 - (data.metrics[0]?.score || 5)) * 43800)
  const smokeFree = 0

  return (
    <div style={{
      position: "absolute", inset: 0,
      background: "#F0F4F8",
      display: "flex", flexDirection: "column",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
      zIndex: 50, animation: "ar-in 0.3s ease"
    }}>
      {/* ── Topbar ── */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #E2E8F0",
        padding: "10px 14px", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 1px 8px rgba(0,0,0,0.05)"
      }}>
        <button onClick={close} style={{
          background: "#F1F5F9", border: "none", borderRadius: 20,
          padding: "6px 14px", fontSize: 12, color: "#64748B",
          cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 5
        }}>← Буцах</button>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>
          {reportTitle}
        </span>
        <button onClick={expand} style={{
          background: "#F1F5F9", border: "none", borderRadius: 20,
          padding: "7px 10px", cursor: "pointer", color: "#94A3B8",
          display: "flex", alignItems: "center"
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            {expanded ? <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" /> : <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />}
          </svg>
        </button>
      </div>

      {/* ── Scrollable Content ── */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "14px" }}>

        {/* ROW 1: Health Score + 3 KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10, marginBottom: 10 }}>
          {/* Health Score */}
          <div style={{
            background: "#fff", borderRadius: 18, padding: "18px 14px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)", textAlign: "center"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 14 }}>💙</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.4px" }}>Health Score</span>
            </div>
            <ScoreRing score={data.healthScore} size={90} />
            <div style={{ marginTop: 10 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: color, margin: "0 0 3px" }}>{data.summary.title}</p>
              <p style={{ fontSize: 10, color: "#94A3B8", margin: 0, lineHeight: 1.4 }}>{data.summary.description}</p>
            </div>
          </div>

          {/* 3 KPI cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { icon: "🚬", label: "Никотин хамаарал", value: data.metrics[0] ? `${data.metrics[0].score}/10` : "—", sub: data.metrics[0]?.status || "Бага зэргийн хамаарал", color: BRAND, bg: "#FFF5F0", bar: data.metrics[0] ? (data.metrics[0].score / data.metrics[0].maxScore) * 100 : 0, barColor: BRAND },
              { icon: "🛡️", label: "Эрсдэл (Risk)", value: riskLabel(data.riskLevel), sub: riskMn(data.riskLevel), color: rc, bg: rc === TEAL ? "#F0FDF4" : rc === "#FF9800" ? "#FFFBEB" : "#FFF2F2", bar: data.riskLevel === "Low" ? 20 : data.riskLevel === "Medium" ? 55 : 90, barColor: rc },
              { icon: "🚀", label: "Гарах боломж", value: potLabel(data.quitPotential), sub: potMn(data.quitPotential), color: pc, bg: pc === TEAL ? "#F0FDF4" : pc === "#FF9800" ? "#FFFBEB" : "#FFF2F2", bar: data.quitPotential === "High" ? 85 : data.quitPotential === "Medium" ? 50 : 20, barColor: pc },
            ].map((k, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "10px 14px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: k.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>{k.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 9, color: "#94A3B8", fontWeight: 700, margin: "0 0 1px", letterSpacing: "0.3px" }}>{k.label.toUpperCase()}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 16, fontWeight: 900, color: k.color }}>{k.value}</span>
                      <span style={{ fontSize: 9, color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k.sub}</span>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 6, background: "#F1F5F9", borderRadius: 6, height: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 6, width: bar ? `${k.bar}%` : "0%", background: k.barColor, transition: "width 1s cubic-bezier(.16,1,.3,1)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Big green highlight card */}
        <div style={{
          background: "linear-gradient(135deg, #E8FFF6 0%, #D0F7EB 100%)",
          borderRadius: 18, padding: "18px 18px 18px 20px",
          border: "1.5px solid #A7F3D0",
          marginBottom: 10,
          display: "flex", alignItems: "center", gap: 14,
          boxShadow: "0 4px 16px rgba(0,196,140,0.12)"
        }}>
          <div style={{ fontSize: 40, flexShrink: 0 }}>
            {data.insights[0]?.emoji || "🌟"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 16, fontWeight: 900, color: "#064E3B", margin: "0 0 5px" }}>
              {data.insights[0]?.title || "Сайн мэдээ!"}
            </p>
            <p style={{ fontSize: 12, color: "#065F46", lineHeight: 1.6, margin: "0 0 12px" }}>
              {data.insights[0]?.description || data.summary.description}
            </p>
            <button
              onClick={() => setInsDetail(data.insights[0])}
              style={{
                background: TEAL, border: "none", borderRadius: 24,
                padding: "8px 18px", color: "#fff",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
                boxShadow: "0 4px 12px rgba(0,196,140,0.4)"
              }}>
              Дэлгэрэнгүй үзэх →
            </button>
          </div>
        </div>

        {/* ROW 3: AI Insights + Strengths/Risks */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 10, marginBottom: 10 }}>
          {/* AI Insights */}
          <div style={{ background: "#fff", borderRadius: 18, padding: "14px 12px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <span style={{ fontSize: 14 }}>✨</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#1E293B" }}>AI Insights</span>
            </div>
            {data.insights.map((ins, i) => (
              <div key={i} onClick={() => setInsDetail(ins)} style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                padding: "8px", marginBottom: 6, cursor: "pointer",
                borderRadius: 12, transition: "background 0.15s",
                border: "1px solid #F1F5F9"
              }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#F8FAFF"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "#fff"}
              >
                <div style={{ width: 34, height: 34, borderRadius: 10, background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{ins.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#1E293B", margin: "0 0 1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ins.title}</p>
                  <p style={{ fontSize: 10, color: "#94A3B8", margin: 0, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ins.description}</p>
                </div>
                <span style={{ color: "#CBD5E1", fontSize: 12, flexShrink: 0 }}>›</span>
              </div>
            ))}
            <button onClick={() => setInsDetail(data.insights[0])} style={{
              width: "100%", marginTop: 6, padding: "9px",
              background: "#F0FDF4", border: `1.5px solid ${TEAL}30`,
              borderRadius: 12, color: TEAL, fontSize: 11,
              fontWeight: 700, cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", gap: 6
            }}>
              ✨ AI-ээс илүү зөвлөгөө авах
            </button>
          </div>

          {/* Strengths + Risks */}
          <div style={{ background: "#fff", borderRadius: 18, padding: "14px 14px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              {/* Strengths */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
                  <span style={{ fontSize: 13 }}>💪</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#059669" }}>Давуу талууд</span>
                </div>
                {data.strengths.slice(0, 3).map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 5, marginBottom: 5, alignItems: "flex-start" }}>
                    <span style={{ color: TEAL, fontWeight: 800, fontSize: 10, flexShrink: 0, marginTop: 2 }}>✓</span>
                    <span style={{ fontSize: 10, color: "#374151", lineHeight: 1.4 }}>{s}</span>
                  </div>
                ))}
              </div>
              {/* Risks */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
                  <span style={{ fontSize: 13 }}>⚠️</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#DC2626" }}>Анхаарах эрсдэлүүд</span>
                </div>
                {data.risks.slice(0, 3).map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: 5, marginBottom: 5, alignItems: "flex-start" }}>
                    <span style={{ color: "#FF9800", fontWeight: 800, fontSize: 10, flexShrink: 0, marginTop: 2 }}>!</span>
                    <span style={{ fontSize: 10, color: "#374151", lineHeight: 1.4 }}>{r}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats row */}
            <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { icon: "🫁", label: "Ушигны нас", value: `${lungAge}`, unit: "", sub: "Норм: 20-30" },
                { icon: "❤️", label: "Зүрхний эрүүл мэнд", value: heartHealth, unit: "", sub: "Сайн" },
                { icon: "💰", label: "Жилд хэмнэх мөнгө", value: `₮${moneySaved.toLocaleString()}`, unit: "", sub: "Тооцоолол" },
                { icon: "📅", label: "Тамхигүй өдрүүд", value: `${smokeFree}`, unit: "", sub: "Эхлэж байна" },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <span style={{ fontSize: 18 }}>{s.icon}</span>
                  <p style={{ fontSize: 14, fontWeight: 900, color: "#1E293B", margin: "2px 0 0", lineHeight: 1 }}>{s.value}</p>
                  <p style={{ fontSize: 8, color: "#94A3B8", margin: "2px 0 0" }}>{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 30 Day Roadmap */}
        <div style={{ background: "#fff", borderRadius: 18, padding: "14px 14px 16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <span style={{ fontSize: 14 }}>📅</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#1E293B" }}>30 Хоногийн Төлөвлөгөө</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.roadmap.map((w, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "flex-start", gap: 10,
                padding: "10px 12px",
                background: i === 0 ? `${weekColors[i] || "#6C63FF"}08` : "#F8FAFF",
                borderRadius: 14,
                border: `1.5px solid ${i === 0 ? weekColors[i] + "25" : "#E2E8F0"}`
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 12, flexShrink: 0,
                  background: weekColors[i % weekColors.length],
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, boxShadow: `0 4px 10px ${weekColors[i % weekColors.length]}40`
                }}>
                  {weekIcons[i % weekIcons.length]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 9, color: "#94A3B8", fontWeight: 700, letterSpacing: "0.4px", margin: "0 0 2px" }}>{w.week.toUpperCase()}</p>
                  <p style={{ fontSize: 13, fontWeight: 800, color: "#1E293B", margin: "0 0 3px" }}>{w.title}</p>
                  <p style={{ fontSize: 10, color: "#64748B", margin: 0, lineHeight: 1.5 }}>{w.tasks.slice(0, 2).join(", ")}</p>
                </div>
              </div>
            ))}
          </div>
          <button style={{
            width: "100%", marginTop: 10, padding: "9px",
            background: "#F8FAFF", border: "1.5px solid #E2E8F0",
            borderRadius: 12, color: "#64748B", fontSize: 11,
            fontWeight: 700, cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center", gap: 6
          }}>
            Дэлгэрэнгүй төлөвлөгөө харах →
          </button>
        </div>

        {/* Today's goals */}
        <div style={{ background: "#fff", borderRadius: 18, padding: "14px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 14 }}>🎯</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#1E293B" }}>Өнөөдрийн зорилго</span>
            </div>
            <div style={{
              background: "#F0FDF4", borderRadius: 20, padding: "3px 10px",
              border: `1px solid ${TEAL}30`
            }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: TEAL }}>
                {goalsDone.filter(Boolean).length}/3 Зорилгоо биелүүллээ!
              </span>
            </div>
          </div>
          {data.roadmap[0]?.tasks.slice(0, 3).map((task, i) => (
            <div key={i}
              onClick={() => setGoalsDone(prev => { const n = [...prev]; n[i] = !n[i]; return n })}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", marginBottom: 6, cursor: "pointer",
                borderRadius: 12, background: goalsDone[i] ? "#F0FDF4" : "#FAFAFA",
                border: `1.5px solid ${goalsDone[i] ? TEAL + "40" : "#E2E8F0"}`,
                transition: "all 0.2s"
              }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                background: goalsDone[i] ? TEAL : "#fff",
                border: `2px solid ${goalsDone[i] ? TEAL : "#CBD5E1"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s"
              }}>
                {goalsDone[i] && <span style={{ color: "#fff", fontSize: 11, fontWeight: 800 }}>✓</span>}
              </div>
              <span style={{ fontSize: 12, color: goalsDone[i] ? "#059669" : "#374151", fontWeight: goalsDone[i] ? 700 : 500, textDecoration: goalsDone[i] ? "line-through" : "none", flex: 1 }}>{task}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── AI Chat Bar (sticky bottom) ── */}
      <div style={{
        background: "#fff", borderTop: "1px solid #E2E8F0",
        padding: "12px 14px", flexShrink: 0,
        boxShadow: "0 -4px 20px rgba(0,0,0,0.06)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 12, flexShrink: 0,
            background: "linear-gradient(135deg, #667EEA, #764BA2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18
          }}>🤖</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#1E293B", margin: "0 0 1px" }}>AI Таны туслах</p>
            <p style={{ fontSize: 9, color: "#94A3B8", margin: 0 }}>Асуултаа асуугарай, би танд туслахад бэлэн байна!</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <input
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            placeholder="Жишээ нь: Тамхи татах хүсэл төрөх үед яах вэ?"
            onKeyDown={e => { if (e.key === "Enter" && chatInput.trim()) { onAskAI(chatInput.trim()); setChatInput(""); close() } }}
            style={{
              flex: 1, background: "#F1F5F9", border: "1.5px solid #E2E8F0",
              borderRadius: 24, padding: "9px 16px",
              color: "#1E293B", fontSize: 12, outline: "none", fontFamily: "inherit"
            }}
          />
          <button
            onClick={() => { if (chatInput.trim()) { onAskAI(chatInput.trim()); setChatInput(""); close() } }}
            style={{
              width: 38, height: 38, borderRadius: "50%", border: "none",
              background: `linear-gradient(135deg, ${TEAL}, #00A876)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0,
              boxShadow: `0 4px 12px ${TEAL}40`
            }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" fill="white" stroke="none" />
            </svg>
          </button>
        </div>
      </div>

      <Sheet insight={insDetail} onClose={() => setInsDetail(null)} />

      <style>{`
        @keyframes ar-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  )
}