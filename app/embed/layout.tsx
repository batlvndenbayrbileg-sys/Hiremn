export const metadata = {
  title: 'hire.mn AI Assistant',
}

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="mn" style={{ background: 'transparent' }}>
      <body style={{ 
        margin: 0, 
        padding: 0, 
        background: 'transparent',
        overflow: 'visible',
        minHeight: '100%',
      }}>
        {children}
      </body>
    </html>
  )
}
