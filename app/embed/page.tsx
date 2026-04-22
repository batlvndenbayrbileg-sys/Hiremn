"use client"

import HireMnChatWidget from "@/components/hire-mn-chat-widget"

export default function EmbedPage() {
  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        html {
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        body {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
          background: transparent;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        #__next {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
      `}</style>
      <HireMnChatWidget />
    </>
  )
}
