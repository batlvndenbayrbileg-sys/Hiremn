"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { parseTestMarkers, getTestById, type TestInfo } from "@/lib/test-db"

type Language = "mn" | "en"
type MessageRole = "user" | "bot"

interface Message {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
  isRichCard?: boolean
  richData?: TestResultData
  testIds?: number[]
}

interface TestResultData {
  title: string
  metrics: { label: string; score: number; max: number; color: string }[]
  overall: number
}

// Premium Brain Mascot - Elegant, Professional, Creative
function BrainMascot({
  size = 48,
  isThinking = false,
  isHovered = false,
  mood = "happy",
  variant = "default",
}: {
  size?: number
  isThinking?: boolean
  isHovered?: boolean
  mood?: "happy" | "thinking" | "excited" | "wink"
  variant?: "default" | "mini" | "fab"
}) {
  const pulseSpeed = isThinking ? "0.4s" : "2s"
  const glowIntensity = isThinking ? 0.6 : 0.3
  
  // Dynamic eye positions based on mood
  const eyeConfig = {
    happy: { leftY: 38, rightY: 38, pupilOffsetX: 0, eyeScale: 1, sparkle: true },
    thinking: { leftY: 36, rightY: 40, pupilOffsetX: 2, eyeScale: 0.9, sparkle: false },
    excited: { leftY: 38, rightY: 38, pupilOffsetX: 0, eyeScale: 1.15, sparkle: true },
    wink: { leftY: 38, rightY: 38, pupilOffsetX: 0, eyeScale: 1, sparkle: true, rightWink: true },
  }
  
  const eye = eyeConfig[mood]

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-all duration-500 ease-out ${variant === "fab" ? "brain-float" : ""} ${isHovered ? "brain-wiggle" : ""}`}
      style={{ 
        filter: isHovered 
          ? "drop-shadow(0 0 12px rgba(232, 84, 26, 0.5)) drop-shadow(0 4px 8px rgba(0,0,0,0.1))" 
          : "drop-shadow(0 2px 4px rgba(0,0,0,0.08))"
      }}
      aria-label="hire.mn brain mascot"
    >
      <defs>
        {/* Premium gradients */}
        <linearGradient id="brainMainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF5F0" />
          <stop offset="50%" stopColor="#FFE8E0" />
          <stop offset="100%" stopColor="#FFDDD0" />
        </linearGradient>
        
        <linearGradient id="brainStrokeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E8541A" />
          <stop offset="50%" stopColor="#FF6B35" />
          <stop offset="100%" stopColor="#D04010" />
        </linearGradient>
        
        <radialGradient id="innerGlow" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        
        <radialGradient id="thinkGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E8541A" stopOpacity={glowIntensity} />
          <stop offset="70%" stopColor="#FF6B35" stopOpacity={glowIntensity * 0.3} />
          <stop offset="100%" stopColor="#E8541A" stopOpacity="0" />
        </radialGradient>
        
        <linearGradient id="neuralGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E8541A" stopOpacity="0" />
          <stop offset="50%" stopColor="#E8541A" stopOpacity="1" />
          <stop offset="100%" stopColor="#E8541A" stopOpacity="0" />
        </linearGradient>
        
        <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        <clipPath id="brainClip">
          <path d="M40 8 C18 8 8 24 8 40 C8 58 20 72 40 72 C60 72 72 58 72 40 C72 24 62 8 40 8" />
        </clipPath>
      </defs>
      
      {/* Ambient glow when thinking */}
      {isThinking && (
        <circle cx="40" cy="40" r="36" fill="url(#thinkGlow)">
          <animate attributeName="r" values="34;38;34" dur="1.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0.8;0.5" dur="1.2s" repeatCount="indefinite" />
        </circle>
      )}
      
      {/* Main brain shape - organic cloud-like form */}
      <g>
        {/* Left hemisphere */}
        <path 
          d="M40 12 C28 12 20 16 16 22 C12 28 10 36 12 44 C14 52 18 60 26 66 C32 70 38 72 40 72"
          fill="url(#brainMainGrad)" 
          stroke="url(#brainStrokeGrad)" 
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        
        {/* Right hemisphere */}
        <path 
          d="M40 12 C52 12 60 16 64 22 C68 28 70 36 68 44 C66 52 62 60 54 66 C48 70 42 72 40 72"
          fill="url(#brainMainGrad)" 
          stroke="url(#brainStrokeGrad)" 
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        
        {/* Inner highlight */}
        <ellipse cx="40" cy="35" rx="24" ry="20" fill="url(#innerGlow)" />
        
        {/* Elegant brain folds - left side */}
        <path 
          d="M18 28 Q24 25 28 30 Q30 34 26 38" 
          fill="none" 
          stroke="#E8541A" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          opacity="0.35"
        />
        <path 
          d="M14 42 Q22 38 26 44 Q28 50 24 54" 
          fill="none" 
          stroke="#E8541A" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          opacity="0.3"
        />
        
        {/* Elegant brain folds - right side */}
        <path 
          d="M62 28 Q56 25 52 30 Q50 34 54 38" 
          fill="none" 
          stroke="#E8541A" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          opacity="0.35"
        />
        <path 
          d="M66 42 Q58 38 54 44 Q52 50 56 54" 
          fill="none" 
          stroke="#E8541A" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          opacity="0.3"
        />
        
        {/* Center division */}
        <path 
          d="M40 16 Q40 44 40 68" 
          fill="none" 
          stroke="#E8541A" 
          strokeWidth="1" 
          strokeDasharray="2 3"
          opacity="0.25"
        />
      </g>
      
      {/* Neural network visualization */}
      <g filter={isThinking ? "url(#softGlow)" : undefined}>
        {/* Neural nodes */}
        {[
          { cx: 22, cy: 22, r: 3, delay: "0s" },
          { cx: 40, cy: 14, r: 3.5, delay: "0.2s" },
          { cx: 58, cy: 22, r: 3, delay: "0.4s" },
          { cx: 14, cy: 40, r: 2.5, delay: "0.6s" },
          { cx: 66, cy: 40, r: 2.5, delay: "0.8s" },
          { cx: 22, cy: 58, r: 3, delay: "1s" },
          { cx: 40, cy: 66, r: 3, delay: "1.2s" },
          { cx: 58, cy: 58, r: 3, delay: "1.4s" },
        ].map((node, i) => (
          <g key={i}>
            <circle cx={node.cx} cy={node.cy} r={node.r} fill="#E8541A" opacity="0.2" />
            <circle cx={node.cx} cy={node.cy} r={node.r * 0.6} fill="#E8541A">
              <animate attributeName="opacity" values="0.4;1;0.4" dur={pulseSpeed} repeatCount="indefinite" begin={node.delay} />
              <animate attributeName="r" values={`${node.r * 0.5};${node.r * 0.8};${node.r * 0.5}`} dur={pulseSpeed} repeatCount="indefinite" begin={node.delay} />
            </circle>
          </g>
        ))}
        
        {/* Neural connections */}
        <g opacity="0.2">
          <line x1="22" y1="22" x2="40" y2="14" stroke="url(#neuralGrad)" strokeWidth="1.5">
            <animate attributeName="opacity" values="0.1;0.4;0.1" dur={pulseSpeed} repeatCount="indefinite" />
          </line>
          <line x1="40" y1="14" x2="58" y2="22" stroke="url(#neuralGrad)" strokeWidth="1.5">
            <animate attributeName="opacity" values="0.1;0.4;0.1" dur={pulseSpeed} repeatCount="indefinite" begin="0.15s" />
          </line>
          <line x1="22" y1="22" x2="14" y2="40" stroke="url(#neuralGrad)" strokeWidth="1">
            <animate attributeName="opacity" values="0.1;0.3;0.1" dur={pulseSpeed} repeatCount="indefinite" begin="0.3s" />
          </line>
          <line x1="58" y1="22" x2="66" y2="40" stroke="url(#neuralGrad)" strokeWidth="1">
            <animate attributeName="opacity" values="0.1;0.3;0.1" dur={pulseSpeed} repeatCount="indefinite" begin="0.45s" />
          </line>
        </g>
      </g>
      
      {/* Face - Eyes */}
      <g>
        {/* Left eye */}
        <ellipse 
          cx="30" 
          cy={eye.leftY} 
          rx={5.5 * eye.eyeScale} 
          ry={6.5 * eye.eyeScale} 
          fill="white"
          stroke="#2D2D2D"
          strokeWidth="0.8"
        >
          <animate attributeName="ry" values={`${6.5 * eye.eyeScale};${5.5 * eye.eyeScale};${6.5 * eye.eyeScale}`} dur="3s" repeatCount="indefinite" />
        </ellipse>
        
        {/* Left pupil */}
        <ellipse 
          cx={30 + eye.pupilOffsetX} 
          cy={eye.leftY + 0.5} 
          rx={2.8 * eye.eyeScale} 
          ry={3.2 * eye.eyeScale} 
          fill="#1A1A1A"
        >
          {isThinking && <animate attributeName="cx" values="28;32;28" dur="2s" repeatCount="indefinite" />}
        </ellipse>
        
        {/* Left eye highlight */}
        {eye.sparkle && (
          <g>
            <circle cx={31.5 + eye.pupilOffsetX} cy={eye.leftY - 1.5} r="1.5" fill="white" />
            <circle cx={29 + eye.pupilOffsetX} cy={eye.leftY + 1} r="0.8" fill="white" opacity="0.6" />
          </g>
        )}
        
        {/* Right eye */}
        {eye.rightWink ? (
          <path 
            d={`M45 ${eye.rightY} Q50 ${eye.rightY - 3} 55 ${eye.rightY}`}
            stroke="#2D2D2D" 
            strokeWidth="2.5" 
            fill="none" 
            strokeLinecap="round"
          />
        ) : (
          <>
            <ellipse 
              cx="50" 
              cy={eye.rightY} 
              rx={5.5 * eye.eyeScale} 
              ry={6.5 * eye.eyeScale} 
              fill="white"
              stroke="#2D2D2D"
              strokeWidth="0.8"
            >
              <animate attributeName="ry" values={`${6.5 * eye.eyeScale};${5.5 * eye.eyeScale};${6.5 * eye.eyeScale}`} dur="3s" repeatCount="indefinite" begin="0.1s" />
            </ellipse>
            
            {/* Right pupil */}
            <ellipse 
              cx={50 + eye.pupilOffsetX} 
              cy={eye.rightY + 0.5} 
              rx={2.8 * eye.eyeScale} 
              ry={3.2 * eye.eyeScale} 
              fill="#1A1A1A"
            >
              {isThinking && <animate attributeName="cx" values="48;52;48" dur="2s" repeatCount="indefinite" />}
            </ellipse>
            
            {/* Right eye highlight */}
            {eye.sparkle && (
              <g>
                <circle cx={51.5 + eye.pupilOffsetX} cy={eye.rightY - 1.5} r="1.5" fill="white" />
                <circle cx={49 + eye.pupilOffsetX} cy={eye.rightY + 1} r="0.8" fill="white" opacity="0.6" />
              </g>
            )}
          </>
        )}
      </g>
      
      {/* Blush cheeks */}
      <ellipse cx="20" cy="48" rx="5" ry="3" fill="#FFAA90" opacity="0.4">
        {isHovered && <animate attributeName="opacity" values="0.4;0.6;0.4" dur="0.8s" repeatCount="indefinite" />}
      </ellipse>
      <ellipse cx="60" cy="48" rx="5" ry="3" fill="#FFAA90" opacity="0.4">
        {isHovered && <animate attributeName="opacity" values="0.4;0.6;0.4" dur="0.8s" repeatCount="indefinite" begin="0.1s" />}
      </ellipse>
      
      {/* Mouth expressions */}
      {mood === "excited" ? (
        <path 
          d="M34 52 Q40 60 46 52" 
          fill="none" 
          stroke="#2D2D2D" 
          strokeWidth="2" 
          strokeLinecap="round"
        />
      ) : mood === "thinking" ? (
        <ellipse cx="40" cy="54" rx="3" ry="2" fill="#2D2D2D" opacity="0.7" />
      ) : (
        <path 
          d="M35 52 Q40 57 45 52" 
          fill="none" 
          stroke="#2D2D2D" 
          strokeWidth="1.8" 
          strokeLinecap="round"
        />
      )}
      
      {/* Sparkle effects when excited/hovered */}
      {(mood === "excited" || isHovered) && (
        <g>
          <path d="M12 18 L14 22 L12 26 L10 22 Z" fill="#FFD700" opacity="0.8">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="0.6s" repeatCount="indefinite" />
          </path>
          <path d="M68 16 L70 20 L68 24 L66 20 Z" fill="#FFD700" opacity="0.8">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="0.6s" repeatCount="indefinite" begin="0.3s" />
          </path>
        </g>
      )}
    </svg>
  )
}

// Mini brain avatar for messages - premium version
function MiniBrain({ isAnimated = false, mood = "happy" }: { isAnimated?: boolean; mood?: "happy" | "thinking" | "excited" | "wink" }) {
  return (
    <div className={`relative w-9 h-9 rounded-full bg-gradient-to-br from-[#FFF5F0] to-[#FFE0D0] flex items-center justify-center shrink-0 shadow-md ring-2 ring-primary/20 ${isAnimated ? "animate-bounce-subtle" : ""}`}>
      <div className="absolute inset-0 rounded-full bg-gradient-to-t from-primary/5 to-transparent" />
      <BrainMascot size={26} variant="mini" mood={mood} />
    </div>
  )
}

// Enhanced typing indicator with personality
function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 animate-fade-in">
      <MiniBrain isAnimated mood="thinking" />
      <div className="bg-gradient-to-br from-white/95 to-white/80 backdrop-blur-sm border border-primary/15 rounded-2xl rounded-bl-sm px-4 py-3 shadow-lg shadow-primary/5">
        <div className="flex gap-2 items-center">
          <span className="text-xs font-medium text-primary/70">Thinking</span>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-primary to-accent typing-dot"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Confetti particle effect
function Confetti({ trigger }: { trigger: boolean }) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; color: string; delay: number }>>([])
  
  useEffect(() => {
    if (trigger) {
      const newParticles = Array.from({ length: 12 }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 100,
        color: ["#E8541A", "#FFB5A0", "#D04010", "#FF8C5A"][Math.floor(Math.random() * 4)],
        delay: Math.random() * 0.3,
      }))
      setParticles(newParticles)
      setTimeout(() => setParticles([]), 1000)
    }
  }, [trigger])
  
  if (particles.length === 0) return null
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-2 h-2 rounded-full confetti-particle"
          style={{
            left: `${p.x}%`,
            bottom: 0,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

// Enhanced test result card with animated metrics
function TestResultCard({ data }: { data: TestResultData }) {
  const [animated, setAnimated] = useState(false)
  const [showCheckmark, setShowCheckmark] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100)
    const checkTimer = setTimeout(() => setShowCheckmark(true), 1200)
    return () => {
      clearTimeout(timer)
      clearTimeout(checkTimer)
    }
  }, [])

  return (
    <div className="bg-gradient-to-br from-white to-secondary/50 border-2 border-primary/20 rounded-2xl p-5 space-y-4 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-foreground font-bold text-sm">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          {data.title}
        </div>
        {showCheckmark && (
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center animate-scale-in">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
      
      <div className="space-y-3">
        {data.metrics.map((metric, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-foreground/70 font-medium">{metric.label}</span>
              <span className="font-bold text-foreground tabular-nums">{metric.score}/{metric.max}</span>
            </div>
            <div className="h-2.5 bg-primary/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                style={{
                  width: animated ? `${(metric.score / metric.max) * 100}%` : "0%",
                  transitionDelay: `${i * 200}ms`,
                  background: `linear-gradient(90deg, ${metric.color}, ${metric.color}dd)`,
                }}
              >
                <div className="absolute inset-0 shimmer-effect" />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="pt-3 border-t border-primary/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-foreground">Overall Score</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-primary tabular-nums">{data.overall}</span>
            <span className="text-sm text-primary/70">%</span>
          </div>
        </div>
        <div className="h-4 bg-primary/10 rounded-full overflow-hidden relative">
          <div
            className="h-full rounded-full transition-all duration-1200 ease-out relative overflow-hidden"
            style={{
              width: animated ? `${data.overall}%` : "0%",
              transitionDelay: "600ms",
              background: "linear-gradient(90deg, #E8541A, #FF8C5A, #E8541A)",
              backgroundSize: "200% 100%",
            }}
          >
            <div className="absolute inset-0 shimmer-effect" />
          </div>
          {/* Milestone markers */}
          <div className="absolute inset-0 flex justify-between px-px">
            {[25, 50, 75].map((mark) => (
              <div key={mark} className="w-px h-full bg-foreground/10" style={{ marginLeft: `${mark}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Test recommendation card - beautiful clickable cards
function TestCard({ test, lang }: { test: TestInfo; lang: Language }) {
  const isFree = test.priceEn === "Free"
  const displayPrice = isFree
    ? (lang === "mn" ? "Үнэгүй" : "Free")
    : `${test.price}₮`
  const displayName = test.name
  const displayDesc = test.descEn

  return (
    <a
      href={test.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex bg-white rounded-xl overflow-hidden border-2 border-primary/20 hover:border-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10 shadow-sm"
    >
      {/* Color swatch left bar */}
      <div
        className="w-14 shrink-0 flex flex-col items-center justify-center gap-1 py-3"
        style={{ background: test.color }}
      >
        <span className="text-2xl">{test.emoji}</span>
        <span className="text-[9px] font-bold text-white/80 tracking-wide uppercase">hire.mn</span>
      </div>

      {/* Content */}
      <div className="flex-1 px-3 py-2.5 min-w-0">
        <div className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
          {displayName}
        </div>
        <div className="text-xs text-foreground/50 mt-0.5 truncate">{displayDesc}</div>
        <div className="flex items-center gap-2 mt-2">
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${isFree ? "bg-green-50 text-green-600" : "bg-primary/10 text-primary"}`}>
            {displayPrice}
          </span>
          <span className="text-[10px] text-foreground/40 flex items-center gap-0.5">
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {test.time}
          </span>
          <span className="ml-auto text-[10px] font-semibold text-primary group-hover:underline">
            {lang === "mn" ? "Авах" : "Take"} &rarr;
          </span>
        </div>
      </div>
    </a>
  )
}

// Test cards carousel for multiple recommendations
function TestCardsCarousel({ testIds, lang }: { testIds: number[]; lang: Language }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const tests = testIds.map(id => getTestById(id)).filter(Boolean) as TestInfo[]
  
  if (tests.length === 0) return null
  
  const showCarousel = tests.length > 1
  const displayTests = showCarousel ? [tests[currentIndex]] : tests

  return (
    <div className="mt-3 space-y-2">
      {displayTests.map((test) => (
        <TestCard key={test.id} test={test} lang={lang} />
      ))}
      
      {/* Carousel controls */}
      {showCarousel && (
        <div className="flex items-center justify-between gap-2 px-2">
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + tests.length) % tests.length)}
            className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-all hover:scale-110 active:scale-95"
            aria-label="Previous test"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {/* Indicator dots */}
          <div className="flex gap-1.5 flex-1 justify-center">
            {tests.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentIndex
                    ? "bg-primary w-5"
                    : "bg-primary/20 w-1.5 hover:bg-primary/40"
                }`}
                aria-label={`Test ${i + 1}`}
              />
            ))}
          </div>
          
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % tests.length)}
            className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-all hover:scale-110 active:scale-95"
            aria-label="Next test"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Counter */}
      {showCarousel && (
        <div className="text-center text-xs text-foreground/50 font-medium">
          {currentIndex + 1} / {tests.length}
        </div>
      )}
    </div>
  )
}

// Enhanced message bubble with hover effects
function MessageBubble({ message, isLatest, lang }: { message: Message; isLatest: boolean; lang: Language }) {
  const isUser = message.role === "user"
  const [isHovered, setIsHovered] = useState(false)

  if (message.isRichCard && message.richData) {
    return (
      <div className="flex items-end gap-2.5 animate-slide-up">
        <MiniBrain />
        <div className="max-w-[88%]">
          <TestResultCard data={message.richData} />
          <div className="text-[10px] text-foreground/40 mt-1.5 ml-1 font-medium">
            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      </div>
    )
  }

  // Check if message has test recommendations
  const hasTestCards = !isUser && message.testIds && message.testIds.length > 0

  return (
    <div 
      className={`flex items-end gap-2.5 ${isLatest ? "animate-slide-up" : ""} ${isUser ? "flex-row-reverse" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {!isUser && <MiniBrain />}
      <div className="relative group flex-1 max-w-[88%]">
        <div
          className={`px-4 py-3 transition-all duration-200 ${
            isUser
              ? "bg-gradient-to-br from-primary to-accent text-white rounded-2xl rounded-br-md shadow-lg shadow-primary/20 max-w-[280px] ml-auto"
              : "bg-white/90 backdrop-blur-sm text-foreground border border-primary/10 rounded-2xl rounded-bl-md shadow-md"
          } ${isHovered ? "scale-[1.01]" : ""}`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        
        {/* Render test cards carousel if present */}
        {hasTestCards && (
          <TestCardsCarousel testIds={message.testIds!} lang={lang} />
        )}
        
        <div className={`text-[10px] text-foreground/40 mt-1 font-medium ${isUser ? "text-right mr-1" : "ml-1"}`}>
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  )
}

// Quick reply chips with ripple effect
function QuickReplyChips({
  onSelect,
  visible,
}: {
  onSelect: (text: string) => void
  visible: boolean
}) {
  const chips = ["What tests?", "Find my test", "My results", "Pricing"]

  if (!visible) return null

  return (
    <div className="flex flex-wrap gap-2 px-4 pb-4 animate-fade-in">
      {chips.map((chip, i) => (
        <button
          key={i}
          onClick={() => onSelect(chip)}
          className="px-4 py-2 text-xs font-semibold bg-white border-2 border-primary/30 text-primary rounded-full transition-all duration-300 hover:border-primary hover:bg-primary hover:text-white hover:shadow-lg hover:shadow-primary/20 active:scale-95"
        >
          {chip}
        </button>
      ))}
    </div>
  )
}

// Language toggle with smooth animation
function LanguageToggle({ lang, onChange }: { lang: Language; onChange: (lang: Language) => void }) {
  return (
    <div className="relative flex items-center bg-white/20 backdrop-blur-sm rounded-full p-1">
      <div
        className="absolute h-[calc(100%-8px)] w-[calc(50%-4px)] bg-white rounded-full shadow-sm transition-transform duration-300 ease-out"
        style={{ transform: lang === "mn" ? "translateX(4px)" : "translateX(calc(100% + 4px))" }}
      />
      <button
        onClick={() => onChange("mn")}
        className={`relative z-10 px-3 py-1 text-[11px] font-bold rounded-full transition-colors duration-200 ${
          lang === "mn" ? "text-primary" : "text-white/80 hover:text-white"
        }`}
      >
        MN
      </button>
      <button
        onClick={() => onChange("en")}
        className={`relative z-10 px-3 py-1 text-[11px] font-bold rounded-full transition-colors duration-200 ${
          lang === "en" ? "text-primary" : "text-white/80 hover:text-white"
        }`}
      >
        EN
      </button>
    </div>
  )
}

// Enhanced ticker bar
function TickerBar() {
  const items = [
    { text: "42+ tests" },
    { text: "3,512+ users" },
    { text: "New: SEMUT" },
    { text: "Free tests" },
  ]

  return (
    <div className="h-8 bg-gradient-to-r from-secondary via-muted to-secondary overflow-hidden flex items-center border-y border-primary/5">
      <div className="ticker-scroll flex whitespace-nowrap">
        {[0, 1, 2, 3].map((repeat) => (
          <div key={repeat} className="flex items-center">
            {items.map((item, i) => (
              <span key={i} className="flex items-center gap-1.5 mx-4 text-[11px] font-semibold text-accent">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                {item.text}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// Smart response engine
function getSmartResponse(
  input: string,
  lang: Language
): { text: string; isRichCard?: boolean; richData?: TestResultData } {
  const lower = input.toLowerCase()

  if (lower.includes("test") || lower.includes("available")) {
    return {
      text: `Here are the tests available on hire.mn:

- Personality Assessment
- Intelligence Test  
- Leadership Skills
- Emotional Intelligence
- Professional Performance
- Health Assessment

Which test interests you?`,
    }
  }

  if (lower.includes("find") || lower.includes("recommend") || lower.includes("ideal")) {
    return {
      text: `Let me find the perfect test for you!

Tell me about yourself:

- What is your current role?
- What is your goal?
  - Self-discovery
  - Job searching
  - Career growth`,
    }
  }

  if (lower.includes("result") || lower.includes("explain") || lower.includes("score")) {
    return {
      text: "",
      isRichCard: true,
      richData: {
        title: "Your Assessment Results",
        metrics: [
          { label: "Growth Mindset", score: 82, max: 100, color: "#E8541A" },
          { label: "Resilience", score: 74, max: 100, color: "#FF8C5A" },
          { label: "Adaptability", score: 91, max: 100, color: "#D04010" },
        ],
        overall: 82,
      },
    }
  }

  if (lower.includes("pric") || lower.includes("cost") || lower.includes("plan")) {
    return {
      text: `hire.mn pricing:

Free Tests
- AUDIT, SEMUT, nicotine test

Paid Tests
- Mindset test - 10,000 MNT
- Work-life test - 20,000 MNT  
- Communication test - 30,000 MNT

Members get up to 30% off!`,
    }
  }

  return {
    text: `Got it! hire.mn has 42+ professional tests.

What would you like to explore?
- Find your ideal test
- View your results
- See pricing options`,
  }
}

// Main widget component
export function HireMnChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [lang, setLang] = useState<Language>("mn")
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showQuickReplies, setShowQuickReplies] = useState(true)
  const [hasUnread, setHasUnread] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const [brainMood, setBrainMood] = useState<"happy" | "thinking" | "excited" | "wink">("happy")
  const [confettiTrigger, setConfettiTrigger] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping, scrollToBottom])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setBrainMood("excited")
      const welcomeMsg: Message = {
        id: "welcome",
        role: "bot",
        content: lang === "mn"
          ? "Hello! I am the hire.mn smart assistant.\n\nHow can I help you find your perfect test today?"
          : "Hello! I am the hire.mn smart assistant.\n\nHow can I help you find your perfect test today?",
        timestamp: new Date(),
      }
      setTimeout(() => {
        setMessages([welcomeMsg])
        setHasUnread(false)
        setBrainMood("happy")
      }, 300)
    }
  }, [isOpen, messages.length, lang])

  const handleSend = useCallback(
    async (text?: string) => {
      const messageText = text || inputValue.trim()
      if (!messageText) return

      setConfettiTrigger(true)
      setTimeout(() => setConfettiTrigger(false), 100)

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: messageText,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, userMsg])
      setInputValue("")
      setShowQuickReplies(false)
      setIsTyping(true)
      setBrainMood("thinking")

      try {
        // Call the AI backend API
        const apiMessages = messages.map((msg) => ({
          role: msg.role === "bot" ? "assistant" : "user",
          content: msg.content,
        }))
        apiMessages.push({ role: "user", content: messageText })

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: apiMessages,
            lang: lang === "mn" ? "mn" : "en",
          }),
        })

        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || "API error")
        }

        // Parse test markers from the response
        const { cleanText, testIds } = parseTestMarkers(data.reply || "")

        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "bot",
          content: cleanText,
          timestamp: new Date(),
          testIds: testIds.length > 0 ? testIds : undefined,
        }

        setIsTyping(false)
        setBrainMood(testIds.length > 0 ? "excited" : "happy")
        setMessages((prev) => [...prev, botMsg])
        
        // Add slight delay before showing happy mood
        setTimeout(() => setBrainMood("happy"), 1500)
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : "Unknown error"
        console.error("[v0] Chat error:", errMsg)
        
        // Show actual error for debugging
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "bot",
          content: `[ERROR] ${errMsg}`,
          timestamp: new Date(),
        }
        setIsTyping(false)
        setBrainMood("happy")
        setMessages((prev) => [...prev, errorMsg])
      }
    },
    [inputValue, lang, messages]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-[9999] font-sans" role="complementary" aria-label="Chat widget">
      {/* Chat Panel */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[400px] h-[600px] max-sm:fixed max-sm:inset-0 max-sm:w-full max-sm:h-full max-sm:bottom-0 max-sm:right-0 bg-gradient-to-b from-background to-secondary/30 rounded-3xl max-sm:rounded-none shadow-2xl shadow-primary/20 flex flex-col overflow-hidden animate-spring-up border border-primary/10">
          {/* Header */}
          <div className="relative h-20 bg-gradient-to-r from-[#E8541A] via-[#D04010] to-[#E8541A] px-5 flex items-center gap-4 shrink-0 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10 blur-sm" />
            <div className="absolute top-8 right-12 w-12 h-12 rounded-full bg-white/5" />
            <div className="absolute -bottom-2 left-1/3 w-16 h-16 rounded-full bg-black/5" />

            <div className="relative z-10 w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-lg">
              <BrainMascot size={42} variant="default" mood={brainMood} isThinking={isTyping} />
            </div>

            <div className="flex-1 relative z-10">
              <h2 className="text-white font-bold text-base">hire.mn Assistant</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400" />
                </span>
                <span className="text-white/80 text-xs font-medium">
                  {isTyping ? "Typing..." : "Online now"}
                </span>
              </div>
            </div>

            <LanguageToggle lang={lang} onChange={setLang} />

            <button
              onClick={() => setIsOpen(false)}
              className="sm:hidden w-9 h-9 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              aria-label="Close chat"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <TickerBar />

          {/* Messages */}
          <div className="flex-1 overflow-y-auto chat-messages p-4 space-y-4">
            <Confetti trigger={confettiTrigger} />
            {messages.map((msg, i) => (
              <MessageBubble key={msg.id} message={msg} isLatest={i === messages.length - 1} lang={lang} />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          <QuickReplyChips
            onSelect={handleSend}
            visible={showQuickReplies && messages.length <= 1}
          />

          {/* Input area */}
          <div className="p-4 border-t border-primary/10 bg-white/50 backdrop-blur-sm">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  rows={1}
                  className="w-full resize-none rounded-2xl border-2 border-primary/20 bg-white px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 max-h-24"
                  style={{ minHeight: "48px" }}
                />
              </div>
              <button
                onClick={() => handleSend()}
                disabled={!inputValue.trim()}
                className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center shrink-0 shadow-lg shadow-primary/30 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-primary/40 active:scale-95"
                aria-label="Send message"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="py-2.5 text-center text-[10px] text-muted-foreground bg-white/30 font-medium">
            Powered by <span className="text-primary font-bold">hire.mn</span> AI
          </div>
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          setHasUnread(false)
          setBrainMood(isOpen ? "happy" : "excited")
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#E8541A] to-[#D04010] shadow-xl shadow-primary/40 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-primary/50 active:scale-95"
        aria-label={isOpen ? "Close chat" : "Open chat"}
        aria-expanded={isOpen}
      >
        {/* Pulse rings */}
        {!isOpen && (
          <>
            <span className="absolute inset-0 rounded-full bg-primary pulse-ring" style={{ animationDelay: "0s" }} />
            <span className="absolute inset-0 rounded-full bg-primary pulse-ring" style={{ animationDelay: "0.6s" }} />
            <span className="absolute inset-0 rounded-full bg-primary pulse-ring" style={{ animationDelay: "1.2s" }} />
          </>
        )}

        <div className={`transition-all duration-300 ${isOpen ? "rotate-90 scale-90" : ""}`}>
          {isOpen ? (
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <BrainMascot size={42} variant="fab" isHovered={isHovered} mood={brainMood} />
          )}
        </div>

        {/* Notification badge */}
        {hasUnread && !isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white animate-bounce">
            1
          </span>
        )}
      </button>
    </div>
  )
}

export default HireMnChatWidget
