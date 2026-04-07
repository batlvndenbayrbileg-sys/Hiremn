"use client"

import { useState } from "react"

const WIDGET_URL = "https://v0-1-f7-jhpu-bi-wpp-o72jn-wt7-a-ob-xk-da-z-cv-be5-c2-b.vercel.app"

const SCRIPT_TAG = `<script src="${WIDGET_URL}/embed.js" async></script>`

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: copied ? "#059669" : "#E8541A",
        color: "#fff", border: "none", borderRadius: 8,
        padding: "8px 16px", fontSize: 13, fontWeight: 600,
        cursor: "pointer", transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      {copied ? (
        <>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M2 8l4 4 8-8" /></svg>
          Хуулагдлаа
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="5" y="5" width="9" height="9" rx="2" /><path d="M11 5V3a1 1 0 00-1-1H3a1 1 0 00-1 1v7a1 1 0 001 1h2" /></svg>
          Хуулах
        </>
      )}
    </button>
  )
}

function Step({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 18, marginBottom: 36 }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
        background: "linear-gradient(135deg, #F06030, #E8541A)",
        color: "#fff", fontWeight: 700, fontSize: 15,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 12px rgba(232,84,26,.3)",
        marginTop: 2,
      }}>{num}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: "#111827", marginBottom: 10 }}>{title}</div>
        {children}
      </div>
    </div>
  )
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div style={{
      background: "#0F172A", borderRadius: 12, overflow: "hidden",
      border: "1px solid #1E293B",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 16px", borderBottom: "1px solid #1E293B",
      }}>
        <div style={{ display: "flex", gap: 6 }}>
          {["#FF5F57", "#FEBC2E", "#28C840"].map(c => (
            <div key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c }} />
          ))}
        </div>
        <CopyButton text={code} />
      </div>
      <pre style={{
        margin: 0, padding: "16px 20px",
        color: "#E2E8F0", fontSize: 13, lineHeight: 1.7,
        overflowX: "auto", fontFamily: "monospace",
        whiteSpace: "pre-wrap", wordBreak: "break-all",
      }}>{code}</pre>
    </div>
  )
}

export default function EmbedGuidePage() {
  return (
    <div style={{
      minHeight: "100vh", background: "#F8F6F4",
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        background: "#fff",
        borderBottom: "1px solid #F0EBE7",
        padding: "0 24px",
      }}>
        <div style={{
          maxWidth: 760, margin: "0 auto",
          height: 64, display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, #F06030, #E8541A)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                <path d="M12 2a10 10 0 110 20 10 10 0 010-20zm0 6v4l3 2" />
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>hire.mn Widget</div>
              <div style={{ fontSize: 11, color: "#9CA3AF" }}>Суулгах заавар</div>
            </div>
          </div>
          <a
            href={WIDGET_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 12, color: "#E8541A", fontWeight: 600,
              textDecoration: "none", display: "flex", alignItems: "center", gap: 4,
            }}
          >
            Демо харах
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </a>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px" }}>

        {/* Hero */}
        <div style={{ marginBottom: 52, textAlign: "center" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "#FEF3EE", color: "#E8541A",
            fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 20,
            border: "1px solid #FDDCCC", marginBottom: 16,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />
            Нэг мөр кодоор суулгана
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#111827", margin: "0 0 12px", lineHeight: 1.25 }}>
            hire.mn AI Chatbot<br />таны сайтад суулгах
          </h1>
          <p style={{ fontSize: 16, color: "#6B7280", lineHeight: 1.7, margin: 0 }}>
            Нэг script tag нэмэхэд л болно. Тусдаа backend, build process шаардлагагүй.
          </p>
        </div>

        {/* Steps */}
        <div style={{
          background: "#fff", borderRadius: 20,
          border: "1px solid #F0EBE7",
          padding: "40px 36px",
          boxShadow: "0 4px 24px rgba(0,0,0,.06)",
          marginBottom: 32,
        }}>
          <Step num={1} title="Дараах script tag-ыг хуулна">
            <CodeBlock code={SCRIPT_TAG} />
            <p style={{ fontSize: 13, color: "#9CA3AF", marginTop: 12, marginBottom: 0 }}>
              Зөвхөн энэ нэг мөр л хэрэгтэй.
            </p>
          </Step>

          <Step num={2} title={`</body> таг-ын өмнө буулгана`}>
            <CodeBlock code={`<!DOCTYPE html>
<html lang="mn">
  <head>
    <meta charset="UTF-8" />
    <title>hire.mn</title>
  </head>
  <body>

    <!-- ... таны хуудасны агуулга ... -->

    <!-- hire.mn widget — энд буулгана -->
    ${SCRIPT_TAG}
  </body>
</html>`} />
          </Step>

          <Step num={3} title="Дууслаа! Хуудасаа refresh хийнэ">
            <div style={{
              background: "#F0FDF4", border: "1px solid #A7F3D0",
              borderRadius: 12, padding: "16px 20px",
              display: "flex", alignItems: "flex-start", gap: 12,
            }}>
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M2 8l4 4 8-8" />
              </svg>
              <div style={{ fontSize: 14, color: "#065F46", lineHeight: 1.6 }}>
                Баруун доод буланд <strong>оранж дугуй товч</strong> гарч ирнэ.
                Дарахад hire.mn AI chatbot нээгдэнэ.
                Бүх тестүүд hire.mn API-аас шууд татагдана.
              </div>
            </div>
          </Step>
        </div>

        {/* Tech specs */}
        <div style={{
          background: "#fff", borderRadius: 20,
          border: "1px solid #F0EBE7",
          padding: "32px 36px",
          boxShadow: "0 4px 24px rgba(0,0,0,.06)",
          marginBottom: 32,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: "0 0 24px" }}>
            Техникийн дэлгэрэнгүй
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { label: "Суулгах хугацаа", value: "30 секунд" },
              { label: "JS bundle хэмжээ", value: "~2 KB (loader only)" },
              { label: "CORS / Backend", value: "Шаардлагагүй" },
              { label: "Framework", value: "Ямар ч framework дэмжинэ" },
              { label: "Mobile", value: "Full-screen responsive" },
              { label: "API холболт", value: "hire.mn API шууд" },
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: "#FAFAFA", borderRadius: 10, padding: "14px 16px",
                border: "1px solid #F0EBE7",
              }}>
                <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 14, color: "#111827", fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* WordPress / Shopify */}
        <div style={{
          background: "#fff", borderRadius: 20,
          border: "1px solid #F0EBE7",
          padding: "32px 36px",
          boxShadow: "0 4px 24px rgba(0,0,0,.06)",
          marginBottom: 32,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>
            WordPress / Shopify
          </h2>
          <p style={{ fontSize: 14, color: "#6B7280", marginTop: 0, marginBottom: 20 }}>
            CMS ашигладаг бол Appearance → Theme Editor → footer.php (WordPress) эсвэл Themes → Edit code → theme.liquid (Shopify) файлд нэмнэ.
          </p>
          <CodeBlock code={SCRIPT_TAG} />
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", paddingTop: 16 }}>
          <p style={{ fontSize: 13, color: "#C0B0A8" }}>
            hire.mn &copy; {new Date().getFullYear()} &mdash; Зөв хүн, зөв газарт
          </p>
        </div>
      </div>
    </div>
  )
}
