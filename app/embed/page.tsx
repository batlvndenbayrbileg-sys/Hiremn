"use client"

import HireMnChatWidget from "@/components/hire-mn-chat-widget"

export default function EmbedPage() {
  return (
    <>
      <style>{`
        html, body {
          margin: 0;
          padding: 0;
          background: transparent;
          overflow: hidden;
          width: 100%;
          height: 100%;
        }
      `}</style>
      <HireMnChatWidget />
    </>
  )
}
