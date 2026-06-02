"use client"

import { useState, useRef, useEffect } from "react"

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
  const [displayScore, setDisplayScore] = useState(0)
  const [offset, setOffset] = useState(circ)

  useEffect(() => {
    if (!animated) return
    let start = 0
    const end = score
    const duration = 1500
    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(eased * end)
      setDisplayScore(current)
      setOffset(circ - (eased * score / 100) * circ)
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [animated, score, circ])

  const color = score >= 70 ? "#34C759" : score >= 40 ? "#FF9F0A" : "#FF3B30"

  return (
    <div style={{ position: "relative", width: 140, height: 140 }}>
      <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke 0.3s" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center"
      }}>
        <span style={{ fontSize: 36, fontWeight: 800, color: "#1a1a1a", lineHeight: 1 }}>
          {displayScore}
        </span>
        <span style={{ fontSize: 11, color: "#888", fontWeight: 500 }}>/100</span>
      </div>
    </div>
  )
}

function BottomSheet({ insight, onClose }: { insight: AnalysisData["insights"][0] | null; onClose: () => void }) {
  useEffect(() => {
    if (insight) document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [insight])

  if (!insight) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
        zIndex: 100, display: "flex", alignItems: "flex-end",
        animation: "fadeIn 0.2s ease"
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", background: "#fff",
          borderRadius: "24px 24px 0 0",
          padding: "28px 24px 40px",
          animation: "slideUp 0.3s cubic-bezier(.16,1,.3,1)",
          maxHeight: "75vh", overflowY: "auto"
        }}
      >
        <div style={{ width: 36, height: 4, background: "#e0e0e0", borderRadius: 2, margin: "0 auto 24px" }} />
        <div style={{ fontSize: 28, marginBottom: 8 }}>{insight.emoji}</div>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", marginBottom: 16 }}>{insight.title}</h3>

        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#888", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 8 }}>
            ЯАГААД ЧУХАЛ ВЭ
          </p>
          <p style={{ fontSize: 15, color: "#333", lineHeight: 1.6 }}>{insight.detail}</p>
        </div>

        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#888", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 12 }}>
            ХИЙЖ БОЛОХ АЛХМУУД
          </p>
          {insight.actions?.map((action, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%",
                background: `${BRAND}15`, display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0
              }}>
                <span style={{ fontSize: 11, color: BRAND }}>✓</span>
              </div>
              <span style={{ fontSize: 14, color: "#333", lineHeight: 1.5 }}>{action}</span>
            </div>
          ))}
        </div>
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
  const touchStartX = useRef(0)

  useEffect(() => {
    setTimeout(() => setAnimated(true), 100)
  }, [])

  const riskColor = data.riskLevel === "Low" ? "#34C759" : data.riskLevel === "Medium" ? "#FF9F0A" : "#FF3B30"
  const potentialColor = data.quitPotential === "High" ? "#34C759" : data.quitPotential === "Medium" ? "#FF9F0A" : "#FF3B30"
  const scoreColor = data.healthScore >= 70 ? "#34C759" : data.healthScore >= 40 ? "#FF9F0A" : "#FF3B30"

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0 && screen < 3) setScreen(s => s + 1)
      if (diff < 0 && screen > 0) setScreen(s => s - 1)
    }
  }

  return (
    <div style={{
      position: "absolute", inset: 0, background: "#F2F2F7",
      display: "flex", flexDirection: "column",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      zIndex: 50, overflowY: "auto"
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 20px 12px",
        background: "rgba(242,242,247,0.9)",
        backdropFilter: "blur(20px)",
        position: "sticky", top: 0, zIndex: 10
      }}>
        <button onClick={onClose} style={{
          background: "rgba(0,0,0,0.06)", border: "none", borderRadius: 20,
          padding: "6px 14px", fontSize: 14, color: BRAND, cursor: "pointer", fontWeight: 600
        }}>
          ← Буцах
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>
          {reportTitle || "Үнэлгээний дүн"}
        </span>
        <div style={{ width: 60 }} />
      </div>

      {/* Screen Nav */}
      <div style={{ display: "flex", gap: 6, padding: "0 20px 16px", overflowX: "auto" }}>
        {SCREENS.map((s, i) => (
          <button key={i} onClick={() => setScreen(i)} style={{
            background: screen === i ? BRAND : "rgba(0,0,0,0.06)",
            color: screen === i ? "#fff" : "#666",
            border: "none", borderRadius: 20, padding: "6px 14px",
            fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
            transition: "all 0.2s"
          }}>{s}</button>
        ))}
      </div>

      {/* Content */}
      <div
        style={{ flex: 1, padding: "0 16px 24px" }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >

        {/* SCREEN 0: Summary */}
        {screen === 0 && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            {/* Score Card */}
            <div style={{
              background: "#fff", borderRadius: 24, padding: "28px 24px",
              marginBottom: 16, textAlign: "center",
              boxShadow: "0 2px 20px rgba(0,0,0,0.06)"
            }}>
              <p style={{ fontSize: 13, color: "#888", fontWeight: 600, marginBottom: 20, letterSpacing: "0.3px" }}>
                ЭРҮҮЛ МЭНДИЙН ОНОО
              </p>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                <CircularScore score={data.healthScore} animated={animated} />
              </div>
              <div style={{
                display: "inline-block",
                background: `${scoreColor}15`, borderRadius: 20,
                padding: "6px 18px", marginBottom: 12
              }}>
                <span style={{ color: scoreColor, fontWeight: 700, fontSize: 15 }}>
                  {data.summary.title}
                </span>
              </div>
              <p style={{ fontSize: 14, color: "#555", lineHeight: 1.6, margin: 0 }}>
                {data.summary.description}
              </p>
            </div>

            {/* Metric Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
              {/* Dependency */}
              {data.metrics[0] && (
                <div style={{
                  background: "#fff", borderRadius: 18, padding: "16px 12px",
                  textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.06)"
                }}>
                  <p style={{ fontSize: 10, color: "#888", fontWeight: 600, marginBottom: 8, letterSpacing: "0.3px" }}>
                    {data.metrics[0].label.toUpperCase()}
                  </p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: "#1a1a1a", margin: "0 0 2px" }}>
                    {data.metrics[0].score}
                    <span style={{ fontSize: 12, color: "#bbb", fontWeight: 500 }}>/{data.metrics[0].maxScore}</span>
                  </p>
                  <p style={{ fontSize: 11, color: BRAND, fontWeight: 600, margin: 0 }}>{data.metrics[0].status}</p>
                </div>
              )}
              {/* Risk */}
              <div style={{
                background: "#fff", borderRadius: 18, padding: "16px 12px",
                textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.06)"
              }}>
                <p style={{ fontSize: 10, color: "#888", fontWeight: 600, marginBottom: 8, letterSpacing: "0.3px" }}>
                  ЭРСДЭЛ
                </p>
                <p style={{ fontSize: 20, fontWeight: 800, color: riskColor, margin: "0 0 2px" }}>
                  {data.riskLevel === "Low" ? "Бага" : data.riskLevel === "Medium" ? "Дунд" : "Өндөр"}
                </p>
                <p style={{ fontSize: 11, color: "#888", fontWeight: 500, margin: 0 }}>түвшин</p>
              </div>
              {/* Potential */}
              <div style={{
                background: "#fff", borderRadius: 18, padding: "16px 12px",
                textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.06)"
              }}>
                <p style={{ fontSize: 10, color: "#888", fontWeight: 600, marginBottom: 8, letterSpacing: "0.3px" }}>
                  БОЛОМЖ
                </p>
                <p style={{ fontSize: 20, fontWeight: 800, color: potentialColor, margin: "0 0 2px" }}>
                  {data.quitPotential === "High" ? "Өндөр" : data.quitPotential === "Medium" ? "Дунд" : "Бага"}
                </p>
                <p style={{ fontSize: 11, color: "#888", fontWeight: 500, margin: 0 }}>магадлал</p>
              </div>
            </div>

            {/* All Metrics */}
            {data.metrics.slice(1).map((m, i) => (
              <div key={i} style={{
                background: "#fff", borderRadius: 18, padding: "16px 18px",
                marginBottom: 10, boxShadow: "0 2px 12px rgba(0,0,0,0.06)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{m.label}</span>
                  <span style={{ fontSize: 13, color: "#888" }}>{m.score}/{m.maxScore}</span>
                </div>
                <div style={{ background: "#f0f0f0", borderRadius: 4, height: 6, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 4,
                    width: animated ? `${(m.score / m.maxScore) * 100}%` : "0%",
                    background: `linear-gradient(90deg, ${BRAND}, #FF8C42)`,
                    transition: "width 1s cubic-bezier(.16,1,.3,1)"
                  }} />
                </div>
                <p style={{ fontSize: 12, color: BRAND, fontWeight: 600, marginTop: 6 }}>{m.status}</p>
              </div>
            ))}
          </div>
        )}

        {/* SCREEN 1: Insights */}
        {screen === 1 && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <p style={{ fontSize: 13, color: "#888", fontWeight: 600, marginBottom: 16, letterSpacing: "0.3px" }}>
              ТАНЫ ХУВИЙН ДҮГНЭЛТ
            </p>
            {data.insights.map((insight, i) => (
              <div
                key={i}
                onClick={() => setSelectedInsight(insight)}
                style={{
                  background: "#fff", borderRadius: 20, padding: "18px 20px",
                  marginBottom: 12, cursor: "pointer",
                  boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
                  display: "flex", alignItems: "center", gap: 16,
                  transition: "transform 0.15s, box-shadow 0.15s",
                  active: { transform: "scale(0.98)" }
                }}
              >
                <div style={{
                  width: 50, height: 50, borderRadius: 16,
                  background: `${BRAND}12`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24, flexShrink: 0
                }}>
                  {insight.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", margin: "0 0 4px" }}>
                    {insight.title}
                  </p>
                  <p style={{ fontSize: 13, color: "#666", margin: 0, lineHeight: 1.5 }}>
                    {insight.description}
                  </p>
                </div>
                <span style={{ color: "#ccc", fontSize: 18 }}>›</span>
              </div>
            ))}
          </div>
        )}

        {/* SCREEN 2: Strengths vs Risks */}
        {screen === 2 && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {/* Strengths */}
              <div style={{
                background: "#fff", borderRadius: 20, padding: "20px 16px",
                boxShadow: "0 2px 16px rgba(0,0,0,0.06)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 20 }}>💪</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>Давуу тал</span>
                </div>
                {data.strengths.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
                    <span style={{ color: "#34C759", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 13, color: "#333", lineHeight: 1.4 }}>{s}</span>
                  </div>
                ))}
              </div>

              {/* Risks */}
              <div style={{
                background: "#fff", borderRadius: 20, padding: "20px 16px",
                boxShadow: "0 2px 16px rgba(0,0,0,0.06)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 20 }}>⚠️</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>Эрсдэл</span>
                </div>
                {data.risks.map((r, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
                    <span style={{ color: "#FF3B30", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>•</span>
                    <span style={{ fontSize: 13, color: "#333", lineHeight: 1.4 }}>{r}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Chat prompt */}
            <div style={{
              background: `linear-gradient(135deg, ${BRAND}, #FF8C42)`,
              borderRadius: 20, padding: "20px",
              marginTop: 16, boxShadow: "0 4px 20px rgba(232,84,26,0.3)"
            }}>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 600, letterSpacing: "0.3px", margin: "0 0 8px" }}>
                💬 AI-ААС АСУУ
              </p>
              <p style={{ color: "#fff", fontSize: 15, fontWeight: 600, margin: "0 0 16px" }}>
                "Давуу талуудаа хэрхэн ашиглах вэ?"
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Асуулт бичнэ үү..."
                  onKeyDown={e => {
                    if (e.key === "Enter" && chatInput.trim()) {
                      onAskAI(chatInput.trim())
                      setChatInput("")
                      onClose()
                    }
                  }}
                  style={{
                    flex: 1, background: "rgba(255,255,255,0.2)",
                    border: "1.5px solid rgba(255,255,255,0.3)",
                    borderRadius: 12, padding: "10px 14px",
                    color: "#fff", fontSize: 14, outline: "none",
                  }}
                />
                <button
                  onClick={() => {
                    if (chatInput.trim()) {
                      onAskAI(chatInput.trim())
                      setChatInput("")
                      onClose()
                    }
                  }}
                  style={{
                    background: "#fff", border: "none", borderRadius: 12,
                    padding: "10px 16px", color: BRAND,
                    fontWeight: 700, fontSize: 14, cursor: "pointer"
                  }}
                >
                  Илгээх
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 3: 30 Day Journey */}
        {screen === 3 && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <p style={{ fontSize: 13, color: "#888", fontWeight: 600, marginBottom: 16, letterSpacing: "0.3px" }}>
              30 ХОНОГИЙН ЗАМНАЛ
            </p>

            {/* Progress bar */}
            <div style={{
              background: "#fff", borderRadius: 20, padding: "20px",
              marginBottom: 16, boxShadow: "0 2px 16px rgba(0,0,0,0.06)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                {data.roadmap.map((_, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", flex: i < data.roadmap.length - 1 ? 1 : 0 }}>
                    <button
                      onClick={() => setRoadmapWeek(i)}
                      style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: i <= roadmapWeek ? BRAND : "#e0e0e0",
                        border: "none", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.3s", flexShrink: 0
                      }}
                    >
                      <span style={{ color: i <= roadmapWeek ? "#fff" : "#999", fontSize: 11, fontWeight: 700 }}>
                        {i + 1}
                      </span>
                    </button>
                    {i < data.roadmap.length - 1 && (
                      <div style={{
                        flex: 1, height: 3, marginLeft: 4,
                        background: i < roadmapWeek ? BRAND : "#e0e0e0",
                        borderRadius: 2, transition: "background 0.3s"
                      }} />
                    )}
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 12, color: "#888", margin: 0 }}>
                {data.roadmap[roadmapWeek]?.week} / 4
              </p>
            </div>

            {/* Week card */}
            {data.roadmap[roadmapWeek] && (
              <div style={{
                background: "#fff", borderRadius: 24, padding: "28px 24px",
                boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                animation: "fadeIn 0.2s ease"
              }}>
                <div style={{
                  display: "inline-block",
                  background: `${BRAND}12`, borderRadius: 12,
                  padding: "4px 12px", marginBottom: 16
                }}>
                  <span style={{ color: BRAND, fontSize: 12, fontWeight: 700 }}>
                    {data.roadmap[roadmapWeek].week}
                  </span>
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a", margin: "0 0 20px" }}>
                  {data.roadmap[roadmapWeek].title}
                </h3>
                {data.roadmap[roadmapWeek].tasks.map((task, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "flex-start", gap: 12,
                    marginBottom: 14, padding: "12px 16px",
                    background: "#F8F8F8", borderRadius: 14
                  }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: "50%",
                      background: `${BRAND}15`, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      <span style={{ color: BRAND, fontSize: 12 }}>✓</span>
                    </div>
                    <span style={{ fontSize: 14, color: "#333", lineHeight: 1.5 }}>{task}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Week navigation */}
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button
                onClick={() => setRoadmapWeek(w => Math.max(0, w - 1))}
                disabled={roadmapWeek === 0}
                style={{
                  flex: 1, padding: "12px", borderRadius: 16,
                  border: "1.5px solid #e0e0e0", background: "#fff",
                  color: roadmapWeek === 0 ? "#ccc" : "#333",
                  fontSize: 14, fontWeight: 600, cursor: roadmapWeek === 0 ? "not-allowed" : "pointer"
                }}
              >
                ← Өмнөх
              </button>
              <button
                onClick={() => setRoadmapWeek(w => Math.min(data.roadmap.length - 1, w + 1))}
                disabled={roadmapWeek === data.roadmap.length - 1}
                style={{
                  flex: 1, padding: "12px", borderRadius: 16,
                  border: "none",
                  background: roadmapWeek === data.roadmap.length - 1 ? "#e0e0e0" : BRAND,
                  color: roadmapWeek === data.roadmap.length - 1 ? "#999" : "#fff",
                  fontSize: 14, fontWeight: 600, cursor: roadmapWeek === data.roadmap.length - 1 ? "not-allowed" : "pointer"
                }}
              >
                Дараах →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sheet */}
      <BottomSheet insight={selectedInsight} onClose={() => setSelectedInsight(null)} />

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </div>
  )
}