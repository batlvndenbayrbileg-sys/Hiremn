export default function WidgetLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { background: transparent; overflow: hidden; }
        `}</style>
      </head>
      <body style={{ background: "transparent" }}>
        {children}
      </body>
    </html>
  )
}
