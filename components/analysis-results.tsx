"use client"

import { useState, useEffect, useRef, useCallback } from "react"

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

const scoreColor = (s: number) => s >= 70 ? TEAL : s >= 40 ? "#FF9800" : "#FF4444"
const riskColor = (r: string) => r === "Low" ? TEAL : r === "Medium" ? "#FF9800" : "#FF4444"
const potColor = (p: string) => p === "High" ? TEAL : p === "Medium" ? "#FF9800" : "#FF4444"

// ── SVG Illustrations ────────────────────────────────────────────────────────
const LungsSVG = () => (
  <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
    <ellipse cx="30" cy="60" rx="18" ry="26" fill="#FFB3C1" opacity="0.9" />
    <ellipse cx="70" cy="60" rx="18" ry="26" fill="#FFB3C1" opacity="0.9" />
    <rect x="46" y="20" width="8" height="50" rx="4" fill="#E57373" />
    <path d="M30 34 C22 34 16 42 16 52 C16 65 22 74 30 76" stroke="#E57373" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M70 34 C78 34 84 42 84 52 C84 65 78 74 70 76" stroke="#E57373" strokeWidth="2" fill="none" strokeLinecap="round" />
    <circle cx="30" cy="55" r="5" fill="#F48FB1" />
    <circle cx="70" cy="55" r="5" fill="#F48FB1" />
    <path d="M24 50 Q30 45 36 50" stroke="#E57373" strokeWidth="1.5" fill="none" />
    <path d="M64 50 Q70 45 76 50" stroke="#E57373" strokeWidth="1.5" fill="none" />
    {/* Leaf decorations */}
    <ellipse cx="18" cy="38" rx="6" ry="9" fill="#66BB6A" transform="rotate(-30 18 38)" opacity="0.8" />
    <ellipse cx="82" cy="38" rx="6" ry="9" fill="#66BB6A" transform="rotate(30 82 38)" opacity="0.8" />
    {/* Shield */}
    <path d="M44 68 L50 72 L56 68 L56 60 L50 56 L44 60 Z" fill="#00C48C" opacity="0.9" />
    <path d="M47 64 L49.5 66.5 L53 63" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
  </svg>
)

const HeartSVG = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
    <path d="M18 30 L5 17 C2 14 2 9 5 6 C8 3 13 3 16 6 L18 8 L20 6 C23 3 28 3 31 6 C34 9 34 14 31 17 Z" fill="#FF5252" />
    <path d="M18 30 L5 17 C2 14 2 9 5 6 C8 3 13 3 16 6" fill="#FF1744" opacity="0.5" />
  </svg>
)

const TargetSVG = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
    <circle cx="22" cy="22" r="20" fill="#FF5722" opacity="0.15" />
    <circle cx="22" cy="22" r="15" fill="#FF5722" opacity="0.25" />
    <circle cx="22" cy="22" r="10" fill="#FF5722" opacity="0.4" />
    <circle cx="22" cy="22" r="5" fill="#FF5722" />
    <path d="M30 8 L26 12 L30 16 L34 12 Z" fill="#FFD700" />
    <rect x="21" y="12" width="2" height="10" rx="1" fill="#795548" transform="rotate(-45 22 22)" />
  </svg>
)

const RobotSVG = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <rect x="10" y="16" width="28" height="22" rx="8" fill="#7C4DFF" />
    <rect x="14" y="20" width="8" height="7" rx="3" fill="white" />
    <rect x="26" y="20" width="8" height="7" rx="3" fill="white" />
    <circle cx="18" cy="23" r="2.5" fill="#7C4DFF" />
    <circle cx="30" cy="23" r="2.5" fill="#7C4DFF" />
    <rect x="18" y="31" width="12" height="3" rx="1.5" fill="white" />
    <rect x="20" y="10" width="8" height="6" rx="3" fill="#7C4DFF" />
    <circle cx="24" cy="10" r="3" fill="#FF5722" />
    <rect x="6" y="22" width="4" height="10" rx="2" fill="#5C35CC" />
    <rect x="38" y="22" width="4" height="10" rx="2" fill="#5C35CC" />
    <rect x="16" y="38" width="6" height="4" rx="2" fill="#5C35CC" />
    <rect x="26" y="38" width="6" height="4" rx="2" fill="#5C35CC" />
  </svg>
)

const ThumbsUpSVG = () => (
  <svg width="70" height="90" viewBox="0 0 70 90" fill="none">
    <ellipse cx="35" cy="72" rx="28" ry="14" fill="#E0E0E0" opacity="0.4" />
    {/* Body */}
    <rect x="14" y="28" width="42" height="40" rx="20" fill="#4CAF50" />
    {/* Head */}
    <circle cx="35" cy="22" r="16" fill="#FFCC80" />
    {/* Eyes */}
    <circle cx="29" cy="20" r="3" fill="#5D4037" />
    <circle cx="41" cy="20" r="3" fill="#5D4037" />
    <circle cx="30" cy="19" r="1" fill="white" />
    <circle cx="42" cy="19" r="1" fill="white" />
    {/* Smile */}
    <path d="M28 27 Q35 32 42 27" stroke="#5D4037" strokeWidth="2" fill="none" strokeLinecap="round" />
    {/* Arm with thumbs up */}
    <rect x="50" y="32" width="12" height="7" rx="3.5" fill="#FFCC80" />
    <rect x="54" y="24" width="7" height="15" rx="3.5" fill="#FFCC80" />
    <rect x="54" y="23" width="5" height="3" rx="1.5" fill="#FFCC80" />
  </svg>
)

// ── Score Ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 130 }: { score: number; size?: number }) {
  const [disp, setDisp] = useState(0)
  const [off, setOff] = useState(0)
  const r = size * 0.37
  const circ = 2 * Math.PI * r
  const color = scoreColor(score)

  useEffect(() => {
    const end = Math.min(Math.max(score, 0), 100)
    const dur = 1600, st = performance.now()
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
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`${color}20`} strokeWidth={size * 0.068} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#scoreGrad)`}
          strokeWidth={size * 0.068} strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" />
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={`${color}99`} />
          </linearGradient>
        </defs>
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size * 0.28, fontWeight: 900, color: "#1E293B", lineHeight: 1 }}>{disp}</span>
        <span style={{ fontSize: size * 0.1, color: "#94A3B8", fontWeight: 600 }}>/100</span>
      </div>
    </div>
  )
}

// ── Bottom Sheet ─────────────────────────────────────────────────────────────
function Sheet({ insight, onClose }: { insight: AnalysisData["insights"][0] | null; onClose: () => void }) {
  const [vis, setVis] = useState(false)
  useEffect(() => { if (insight) setTimeout(() => setVis(true), 10); else setVis(false) }, [insight])
  if (!insight) return null
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: `rgba(0,0,0,${vis ? 0.4 : 0})`,
      zIndex: 200, display: "flex", alignItems: "flex-end",
      transition: "background 0.25s", backdropFilter: "blur(4px)"
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", background: "#fff", borderRadius: "24px 24px 0 0",
        transform: vis ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.38s cubic-bezier(.16,1,.3,1)",
        maxHeight: "80vh", overflowY: "auto"
      }}>
        <div style={{ padding: "14px 0 0", display: "flex", justifyContent: "center" }}>
          <div style={{ width: 36, height: 4, background: "#E2E8F0", borderRadius: 2 }} />
        </div>
        <div style={{ padding: "16px 20px 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: "#F0FDF4", fontSize: 26, display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid #BBF7D0", flexShrink: 0 }}>
              {insight.emoji}
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1E293B", margin: 0, lineHeight: 1.3 }}>{insight.title}</h3>
          </div>
          <div style={{ background: "#F8FAFF", borderRadius: 14, padding: "14px", marginBottom: 16, border: "1px solid #E2E8F0" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.6px", margin: "0 0 8px" }}>ЯАГААД ЧУХАЛ ВЭ</p>
            <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.7, margin: 0 }}>{insight.detail}</p>
          </div>
          {insight.actions?.length > 0 && (
            <>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.6px", margin: "0 0 10px" }}>ХИЙЖ БОЛОХ АЛХМУУД</p>
              {insight.actions.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, padding: "11px 14px", background: "#F0FDF4", borderRadius: 12, border: "1px solid #BBF7D0", alignItems: "flex-start" }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: TEAL, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                    <span style={{ color: "#fff", fontSize: 11, fontWeight: 800 }}>✓</span>
                  </div>
                  <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{a}</span>
                </div>
              ))}
            </>
          )}
          <button onClick={onClose} style={{
            width: "100%", marginTop: 12, padding: "13px",
            background: `linear-gradient(135deg, ${TEAL}, #00A876)`,
            border: "none", borderRadius: 14, color: "#fff",
            fontSize: 14, fontWeight: 700, cursor: "pointer",
            boxShadow: `0 4px 16px ${TEAL}40`
          }}>Хаах</button>
        </div>
      </div>
    </div>
  )
}

// ── Compact Card ─────────────────────────────────────────────────────────────
export function AnalysisCard({ data, title, onExpand }: { data: AnalysisData; title: string; onExpand: () => void }) {
  const [hov, setHov] = useState(false)
  const [bar, setBar] = useState(false)
  const [scoreDisp, setScoreDisp] = useState(0)
  const color = scoreColor(data.healthScore)
  const circ = 2 * Math.PI * 28
  const [off, setOff] = useState(circ)

  useEffect(() => {
    setTimeout(() => setBar(true), 400)
    const end = data.healthScore, dur = 1400, st = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - st) / dur, 1)
      const e = 1 - Math.pow(1 - p, 3)
      setScoreDisp(Math.round(e * end))
      setOff(circ - e * (end / 100) * circ)
      if (p < 1) requestAnimationFrame(tick)
    }
    setTimeout(() => requestAnimationFrame(tick), 350)
  }, [data.healthScore, circ])

  return (
    <div onClick={onExpand} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      background: "#fff", borderRadius: 20, overflow: "hidden", cursor: "pointer",
      boxShadow: hov ? "0 16px 48px rgba(0,0,0,0.13), 0 0 0 2px rgba(0,196,140,0.3)" : "0 4px 20px rgba(0,0,0,0.08)",
      transform: hov ? "translateY(-3px)" : "translateY(0)",
      transition: "all 0.25s cubic-bezier(.16,1,.3,1)"
    }}>
      {/* Header gradient */}
      <div style={{ background: "linear-gradient(135deg, #E8FFF6 0%, #D0F7EB 100%)", borderBottom: "1px solid #B2F5E3", padding: "16px 18px 14px", display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{ position: "relative", width: 68, height: 68, flexShrink: 0 }}>
          <svg width="68" height="68" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="34" cy="34" r="28" fill="none" stroke={`${color}25`} strokeWidth="6" />
            <circle cx="34" cy="34" r="28" fill="none" stroke={color} strokeWidth="6" strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: "#1E293B", lineHeight: 1 }}>{scoreDisp}</span>
            <span style={{ fontSize: 8, color: "#94A3B8" }}>/100</span>
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
      </div>

      {/* KPI row */}
      <div style={{ display: "flex", borderBottom: "1px solid #F1F5F9" }}>
        {[
          { icon: "🚬", label: "Хамаарал", value: data.metrics[0] ? `${data.metrics[0].score}/${data.metrics[0].maxScore}` : "—", color: BRAND },
          { icon: "🛡️", label: "Эрсдэл", value: data.riskLevel === "Low" ? "Бага" : data.riskLevel === "Medium" ? "Дунд" : "Өндөр", color: riskColor(data.riskLevel) },
          { icon: "🚀", label: "Боломж", value: data.quitPotential === "High" ? "Өндөр" : data.quitPotential === "Medium" ? "Дунд" : "Бага", color: potColor(data.quitPotential) },
        ].map((k, i) => (
          <div key={i} style={{ flex: 1, padding: "10px 6px", textAlign: "center", borderRight: i < 2 ? "1px solid #F1F5F9" : "none" }}>
            <p style={{ fontSize: 9, color: "#94A3B8", fontWeight: 700, margin: "0 0 2px", letterSpacing: "0.3px" }}>{k.icon} {k.label}</p>
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

// ── FULL ANALYSIS RESULTS ─────────────────────────────────────────────────────
export function AnalysisResults({ data, reportTitle, onClose, onAskAI }: Props) {
  const [page, setPage] = useState(0) // 0=Overview, 1=Insights, 2=Plan
  const [insDetail, setInsDetail] = useState<AnalysisData["insights"][0] | null>(null)
  const [roadWeek, setRoadWeek] = useState(0)
  const [goals, setGoals] = useState<boolean[]>([false, false, false])
  const [chatInput, setChatInput] = useState("")
  const [bar, setBar] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const touchX = useRef(0)
  const PAGES = ["Тоймлол", "AI Дүн", "30 Хоног"]

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
  const toggleGoal = useCallback((i: number) => {
    setGoals(prev => { const n = [...prev]; n[i] = !n[i]; return n })
  }, [])
  const handleAI = useCallback(() => {
    if (!chatInput.trim()) return
    onAskAI(chatInput.trim())
    setChatInput("")
    close()
  }, [chatInput, onAskAI])

  const color = scoreColor(data.healthScore)
  const rc = riskColor(data.riskLevel)
  const pc = potColor(data.quitPotential)
  const metricColor = (pct: number) => pct > 0.6 ? "#FF4444" : pct > 0.3 ? "#FF9800" : TEAL
  const metricGrad = (pct: number) => pct > 0.6 ? "linear-gradient(90deg,#FF4444,#FF6B6B)" : pct > 0.3 ? "linear-gradient(90deg,#FF9800,#FFCC44)" : `linear-gradient(90deg,${TEAL},#00E5A0)`
  const weekColors = ["#6C63FF", "#FF6B6B", TEAL, "#FF9800"]
  const weekIcons = ["📋", "⚡", "🔄", "🏆"]

  const onTS = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX }
  const onTE = (e: React.TouchEvent) => {
    const d = touchX.current - e.changedTouches[0].clientX
    if (Math.abs(d) > 50) { if (d > 0 && page < 2) setPage(p => p + 1); if (d < 0 && page > 0) setPage(p => p - 1) }
  }

  return (
    <div style={{ position: "absolute", inset: 0, background: "#F0F4F8", display: "flex", flexDirection: "column", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif", zIndex: 50, animation: "ar-in 0.3s ease" }}>

      {/* ── Header ── */}
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
        {/* Page tabs */}
        <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 12, padding: 3, gap: 2 }}>
          {PAGES.map((p, i) => (
            <button key={i} onClick={() => setPage(i)} style={{ flex: 1, padding: "7px", fontSize: 11, fontWeight: 700, border: "none", borderRadius: 10, cursor: "pointer", background: page === i ? "#fff" : "transparent", color: page === i ? "#1E293B" : "#94A3B8", boxShadow: page === i ? "0 2px 8px rgba(0,0,0,0.08)" : "none", transition: "all 0.2s" }}>{p}</button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }} onTouchStart={onTS} onTouchEnd={onTE}>

        {/* PAGE 0 — Overview */}
        {page === 0 && (
          <div style={{ padding: "14px", animation: "si 0.25s ease" }}>

            {/* Health Score card */}
            <div style={{ background: "#fff", borderRadius: 20, padding: "20px 16px", marginBottom: 12, boxShadow: "0 2px 14px rgba(0,0,0,0.07)", display: "flex", alignItems: "center", gap: 16 }}>
              <div>
                <ScoreRing score={data.healthScore} size={100} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 16 }}>💙</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.4px" }}>HEALTH SCORE</span>
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: `${color}15`, borderRadius: 20, padding: "4px 12px", border: `1.5px solid ${color}25`, marginBottom: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, display: "inline-block" }} />
                  <span style={{ color, fontWeight: 800, fontSize: 13 }}>{data.summary.title}</span>
                </div>
                <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.6, margin: 0 }}>{data.summary.description}</p>
              </div>
            </div>

            {/* KPI 3 cards horizontal */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 12 }}>
              {[
                { icon: "🚬", title: "Никотин хамаарал", value: data.metrics[0] ? `${data.metrics[0].score}/10` : "—", sub: data.metrics[0]?.status || "", color: BRAND, bg: "#FFF5F0", border: "#FFD0B8", barPct: data.metrics[0] ? (data.metrics[0].score / data.metrics[0].maxScore) * 100 : 0 },
                { icon: "🛡️", title: "Эрсдэл (Risk)", value: data.riskLevel === "Low" ? "Low" : data.riskLevel === "Medium" ? "Mid" : "High", sub: data.riskLevel === "Low" ? "Эрсдэл бага" : data.riskLevel === "Medium" ? "Дунд эрсдэл" : "Өндөр эрсдэл", color: rc, bg: rc === TEAL ? "#F0FDF4" : rc === "#FF9800" ? "#FFFBEB" : "#FFF2F2", border: `${rc}30`, barPct: data.riskLevel === "Low" ? 20 : data.riskLevel === "Medium" ? 55 : 90 },
                { icon: "🚀", title: "Гарах боломж", value: data.quitPotential === "High" ? "High" : data.quitPotential === "Medium" ? "Mid" : "Low", sub: data.quitPotential === "High" ? "Амжилтын боломж өндөр" : data.quitPotential === "Medium" ? "Дунд боломж" : "Боломж бага", color: pc, bg: pc === TEAL ? "#F0FDF4" : pc === "#FF9800" ? "#FFFBEB" : "#FFF2F2", border: `${pc}30`, barPct: data.quitPotential === "High" ? 85 : data.quitPotential === "Medium" ? 50 : 20 },
              ].map((k, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "12px 10px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: `1.5px solid ${k.border}` }}>
                  <div style={{ width: 30, height: 30, borderRadius: 10, background: k.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, marginBottom: 7 }}>{k.icon}</div>
                  <p style={{ fontSize: 8, color: "#94A3B8", fontWeight: 700, margin: "0 0 2px", letterSpacing: "0.3px", lineHeight: 1.3 }}>{k.title.toUpperCase()}</p>
                  <p style={{ fontSize: 18, fontWeight: 900, color: k.color, margin: "0 0 1px", lineHeight: 1 }}>{k.value}</p>
                  <p style={{ fontSize: 8, color: "#94A3B8", margin: "0 0 6px", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k.sub}</p>
                  <div style={{ background: "#F1F5F9", borderRadius: 6, height: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 6, width: bar ? `${k.barPct}%` : "0%", background: k.color, transition: "width 1s cubic-bezier(.16,1,.3,1)" }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Highlight green card with illustration */}
            <div style={{ background: "linear-gradient(135deg, #E8FFF6 0%, #D0F7EB 100%)", borderRadius: 20, padding: "18px", marginBottom: 12, border: "1.5px solid #A7F3D0", boxShadow: "0 4px 16px rgba(0,196,140,0.12)", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ flexShrink: 0 }}><LungsSVG /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 16, fontWeight: 900, color: "#064E3B", margin: "0 0 6px" }}>
                  {data.insights[0]?.title || "Сайн мэдээ!"}
                </p>
                <p style={{ fontSize: 12, color: "#065F46", lineHeight: 1.6, margin: "0 0 12px" }}>
                  {data.insights[0]?.description || data.summary.description}
                </p>
                <button onClick={() => data.insights[0] && setInsDetail(data.insights[0])} style={{ background: TEAL, border: "none", borderRadius: 22, padding: "9px 18px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: `0 4px 14px ${TEAL}50` }}>
                  Дэлгэрэнгүй үзэх →
                </button>
              </div>
            </div>

            {/* Metric bars */}
            {data.metrics.map((m, i) => (
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

            {/* Strengths + Risks */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
              <div style={{ background: "#fff", borderRadius: 16, padding: "14px 12px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", border: "1.5px solid #BBF7D0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <span style={{ fontSize: 16 }}>💪</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#059669" }}>Давуу талууд</span>
                </div>
                {data.strengths.slice(0, 4).map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 6, marginBottom: 7, alignItems: "flex-start" }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#D1FAE5", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                      <span style={{ color: TEAL, fontSize: 9, fontWeight: 800 }}>✓</span>
                    </div>
                    <span style={{ fontSize: 11, color: "#374151", lineHeight: 1.4 }}>{s}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: "#fff", borderRadius: 16, padding: "14px 12px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", border: "1.5px solid #FED7AA" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <span style={{ fontSize: 16 }}>⚠️</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#EA580C" }}>Анхаарах эрсдэлүүд</span>
                </div>
                {data.risks.slice(0, 4).map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: 6, marginBottom: 7, alignItems: "flex-start" }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#FFF7ED", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                      <span style={{ color: "#FF9800", fontSize: 9, fontWeight: 800 }}>!</span>
                    </div>
                    <span style={{ fontSize: 11, color: "#374151", lineHeight: 1.4 }}>{r}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Extra stats row */}
            <div style={{ background: "#fff", borderRadius: 16, padding: "14px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", marginBottom: 8 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, textAlign: "center" }}>
                {[
                  { icon: "🫁", label: "Ушигны нас", value: `${Math.round(20 + (data.metrics[0]?.score || 3) * 2)}`, sub: "Норм: 20-30" },
                  { icon: "❤️", label: "Зүрхний эрүүл мэнд", value: data.healthScore >= 70 ? "Good" : data.healthScore >= 40 ? "Fair" : "Poor", sub: "Сайн" },
                  { icon: "💰", label: "Жилд хэмнэх мөнгө", value: `₮${Math.round((10 - (data.metrics[0]?.score || 5)) * 43800 / 1000)}K`, sub: "Тооцоолол" },
                  { icon: "📅", label: "Тамхигүй өдрүүд", value: "0", sub: "Эхлэж байна" },
                ].map((s, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 20, marginBottom: 3 }}>{s.icon}</div>
                    <p style={{ fontSize: 13, fontWeight: 900, color: "#1E293B", margin: "0 0 1px", lineHeight: 1 }}>{s.value}</p>
                    <p style={{ fontSize: 8, color: "#94A3B8", margin: 0, lineHeight: 1.3 }}>{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigate to next page */}
            <button onClick={() => setPage(1)} style={{ width: "100%", padding: "12px", background: "#F1F5F9", border: "1.5px solid #E2E8F0", borderRadius: 14, color: "#475569", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              AI Дүн шинжилгээ харах →
            </button>
          </div>
        )}

        {/* PAGE 1 — AI Insights */}
        {page === 1 && (
          <div style={{ padding: "14px", animation: "si 0.25s ease" }}>

            {/* Header card */}
            <div style={{ background: "linear-gradient(135deg, #667EEA 0%, #764BA2 100%)", borderRadius: 20, padding: "18px 16px", marginBottom: 14, display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ flexShrink: 0 }}><RobotSVG /></div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 900, color: "#fff", margin: "0 0 4px" }}>AI Insights</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", margin: 0, lineHeight: 1.5 }}>Таны тестийн үр дүнд үндэслэсэн ухаалаг дүн шинжилгээ</p>
              </div>
            </div>

            {/* Insights list */}
            {data.insights.map((ins, i) => (
              <div key={i} onClick={() => setInsDetail(ins)} style={{ background: "#fff", borderRadius: 18, padding: "14px 16px", marginBottom: 10, display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1.5px solid transparent", transition: "all 0.2s", animation: `ci 0.35s ease ${i * 0.08}s both` }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${TEAL}40`; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)" }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "transparent"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)" }}>
                <div style={{ width: 46, height: 46, borderRadius: 14, background: i === 0 ? "#F0FDF4" : i === 1 ? "#FFF5F0" : "#F0F4FF", fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1.5px solid ${i === 0 ? "#BBF7D0" : i === 1 ? "#FFD0B8" : "#C7D2FE"}` }}>{ins.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 800, color: "#1E293B", margin: "0 0 3px" }}>{ins.title}</p>
                  <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 6px", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ins.description}</p>
                  <span style={{ fontSize: 10, color: TEAL, fontWeight: 700 }}>Дэлгэрэнгүй харах →</span>
                </div>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"><path d="M6 4l4 4-4 4" /></svg>
                </div>
              </div>
            ))}

            {/* Strengths + Risks side by side with illustration */}
            <div style={{ background: "#fff", borderRadius: 18, padding: "16px", marginBottom: 10, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
                <ThumbsUpSVG />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 800, color: "#059669", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 5 }}>💪 Давуу талууд</p>
                  {data.strengths.map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "flex-start" }}>
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
                    <div key={i} style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "flex-start" }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#FFF7ED", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                        <span style={{ color: "#FF9800", fontSize: 10, fontWeight: 800 }}>!</span>
                      </div>
                      <span style={{ fontSize: 11, color: "#374151", lineHeight: 1.4 }}>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={() => setPage(2)} style={{ width: "100%", padding: "12px", background: "#F1F5F9", border: "1.5px solid #E2E8F0", borderRadius: 14, color: "#475569", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              30 Хоногийн төлөвлөгөө харах →
            </button>
          </div>
        )}

        {/* PAGE 2 — 30 Day Plan + Goals */}
        {page === 2 && (
          <div style={{ padding: "14px", animation: "si 0.25s ease" }}>

            {/* Goals card */}
            <div style={{ background: "#fff", borderRadius: 18, padding: "16px", marginBottom: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <TargetSVG />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "#1E293B", margin: "0 0 1px" }}>Өнөөдрийн зорилго</p>
                    <p style={{ fontSize: 10, color: "#94A3B8", margin: 0 }}>Зорилгоо тэмдэглэж явна уу</p>
                  </div>
                </div>
                <div style={{ background: "#F0FDF4", borderRadius: 20, padding: "4px 12px", border: `1px solid ${TEAL}30` }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: TEAL }}>{goals.filter(Boolean).length}<span style={{ color: "#94A3B8", fontWeight: 400 }}>/3</span></span>
                </div>
              </div>
              {/* Progress bar for goals */}
              <div style={{ background: "#F1F5F9", borderRadius: 8, height: 6, marginBottom: 14, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 8, background: `linear-gradient(90deg, ${TEAL}, #00E5A0)`, width: `${(goals.filter(Boolean).length / 3) * 100}%`, transition: "width 0.4s ease" }} />
              </div>
              {data.roadmap[0]?.tasks.slice(0, 3).map((task, i) => (
                <div key={i} onClick={() => toggleGoal(i)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", marginBottom: 8, cursor: "pointer", borderRadius: 14, background: goals[i] ? "#F0FDF4" : "#FAFAFA", border: `1.5px solid ${goals[i] ? TEAL + "40" : "#E2E8F0"}`, transition: "all 0.25s ease", userSelect: "none" }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, background: goals[i] ? TEAL : "#fff", border: `2px solid ${goals[i] ? TEAL : "#CBD5E1"}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.25s ease" }}>
                    {goals[i] && <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M3 8l4 4 6-7" /></svg>}
                  </div>
                  <span style={{ fontSize: 13, color: goals[i] ? "#059669" : "#374151", fontWeight: goals[i] ? 700 : 500, textDecoration: goals[i] ? "line-through" : "none", flex: 1, transition: "all 0.2s" }}>{task}</span>
                  {goals[i] && <span style={{ fontSize: 14 }}>🎉</span>}
                </div>
              ))}
              {goals.filter(Boolean).length === 3 && (
                <div style={{ background: "linear-gradient(135deg, #F0FDF4, #DCFCE7)", borderRadius: 12, padding: "10px 14px", border: `1px solid ${TEAL}30`, textAlign: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#059669" }}>🎉 Бүх зорилгоо биелүүллээ!</span>
                </div>
              )}
            </div>

            {/* 30 day roadmap */}
            <div style={{ background: "#fff", borderRadius: 18, padding: "16px", marginBottom: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 18 }}>📅</span>
                <p style={{ fontSize: 13, fontWeight: 800, color: "#1E293B", margin: 0 }}>30 Хоногийн Телевлегее</p>
              </div>

              {/* Week selector dots */}
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

              {/* Active week */}
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
                    <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, padding: "10px 12px", background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", alignItems: "flex-start", animation: `ci 0.3s ease ${i * 0.06}s both` }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: `${weekColors[roadWeek % weekColors.length]}20`, border: `1.5px solid ${weekColors[roadWeek % weekColors.length]}40`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                        <span style={{ color: weekColors[roadWeek % weekColors.length], fontSize: 10, fontWeight: 800 }}>✓</span>
                      </div>
                      <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{task}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Week navigation buttons */}
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button onClick={() => setRoadWeek(w => Math.max(0, w - 1))} disabled={roadWeek === 0} style={{ flex: 1, padding: "11px", borderRadius: 14, border: "1.5px solid #E2E8F0", background: "#fff", color: roadWeek === 0 ? "#CBD5E1" : "#475569", fontSize: 13, fontWeight: 700, cursor: roadWeek === 0 ? "not-allowed" : "pointer", transition: "all 0.2s" }}>← Өмнөх</button>
                <button onClick={() => setRoadWeek(w => Math.min(data.roadmap.length - 1, w + 1))} disabled={roadWeek === data.roadmap.length - 1} style={{ flex: 1, padding: "11px", borderRadius: 14, border: "none", background: roadWeek === data.roadmap.length - 1 ? "#F1F5F9" : `linear-gradient(135deg, ${weekColors[roadWeek % weekColors.length]}, ${weekColors[(roadWeek + 1) % weekColors.length]})`, color: roadWeek === data.roadmap.length - 1 ? "#CBD5E1" : "#fff", fontSize: 13, fontWeight: 700, cursor: roadWeek === data.roadmap.length - 1 ? "not-allowed" : "pointer", boxShadow: roadWeek === data.roadmap.length - 1 ? "none" : `0 4px 14px ${weekColors[roadWeek % weekColors.length]}40`, transition: "all 0.2s" }}>Дараах →</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── AI Chat Bar (always visible) ── */}
      <div style={{ background: "#fff", borderTop: "1px solid #E2E8F0", padding: "10px 14px", flexShrink: 0, boxShadow: "0 -4px 20px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #667EEA, #764BA2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🤖</div>
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
            placeholder="Жишээ нь: Тамхи татах хүсэл төрөх үед яах вэ?"
            style={{ flex: 1, background: "#F1F5F9", border: "1.5px solid #E2E8F0", borderRadius: 22, padding: "9px 16px", color: "#1E293B", fontSize: 12, outline: "none", fontFamily: "inherit", transition: "border-color 0.2s" }}
            onFocus={e => (e.target as HTMLElement).style.borderColor = TEAL}
            onBlur={e => (e.target as HTMLElement).style.borderColor = "#E2E8F0"}
          />
          <button onClick={handleAI} style={{ width: 38, height: 38, borderRadius: "50%", border: "none", background: chatInput.trim() ? `linear-gradient(135deg, ${TEAL}, #00A876)` : "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", cursor: chatInput.trim() ? "pointer" : "not-allowed", flexShrink: 0, boxShadow: chatInput.trim() ? `0 4px 12px ${TEAL}40` : "none", transition: "all 0.2s" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={chatInput.trim() ? "white" : "#94A3B8"} strokeWidth="2.5" strokeLinecap="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" fill={chatInput.trim() ? "white" : "#94A3B8"} stroke="none" />
            </svg>
          </button>
        </div>
      </div>

      {/* Page dots indicator */}
      <div style={{ background: "#fff", padding: "6px 0 8px", display: "flex", justifyContent: "center", gap: 6, flexShrink: 0, borderTop: "1px solid #F1F5F9" }}>
        {PAGES.map((_, i) => (
          <button key={i} onClick={() => setPage(i)} style={{ width: i === page ? 20 : 7, height: 7, borderRadius: 4, background: i === page ? TEAL : "#E2E8F0", border: "none", cursor: "pointer", transition: "all 0.3s cubic-bezier(.34,1.56,.64,1)", padding: 0 }} />
        ))}
      </div>

      <Sheet insight={insDetail} onClose={() => setInsDetail(null)} />

      <style>{`
        @keyframes ar-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes si { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ci { from{opacity:0;transform:translateY(10px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
      `}</style>
    </div>
  )
}