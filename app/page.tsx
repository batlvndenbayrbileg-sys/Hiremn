import HireMnChatWidget from "@/components/hire-mn-chat-widget"

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      <div className="relative overflow-hidden">
        <section className="relative min-h-screen flex items-center justify-center px-6">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-foreground">
                AI-Powered Talent Platform
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-foreground tracking-tight text-balance">
              <span className="text-primary">hire.mn</span>
              <br />
              <span className="text-foreground/80">Right person, right place</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed text-pretty">
              Mongolia&apos;s first professional assessment and talent platform. 
              42+ tests, 3,500+ users.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <button className="px-8 py-4 bg-primary text-primary-foreground rounded-full font-semibold text-lg hover:bg-accent transition-colors duration-200 shadow-lg shadow-primary/25">
                Take a Test
              </button>
              <button className="px-8 py-4 bg-card text-foreground rounded-full font-semibold text-lg border border-border hover:border-primary/50 transition-colors duration-200">
                Learn More
              </button>
            </div>

            <div className="pt-12 grid grid-cols-3 gap-8 max-w-lg mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary">42+</div>
                <div className="text-sm text-muted-foreground mt-1">Tests</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary">3.5K+</div>
                <div className="text-sm text-muted-foreground mt-1">Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary">98%</div>
                <div className="text-sm text-muted-foreground mt-1">Satisfaction</div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </section>

        <section className="py-24 px-6 bg-card">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Why hire.mn?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                We help you understand yourself better
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-background rounded-2xl p-8 border border-border hover:border-primary/30 transition-colors duration-200">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Smart AI</h3>
                <p className="text-muted-foreground leading-relaxed">
                  AI-powered recommendations that deeply analyze your results.
                </p>
              </div>

              <div className="bg-background rounded-2xl p-8 border border-border hover:border-primary/30 transition-colors duration-200">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Detailed Reports</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Detailed reports with charts and development recommendations for each test.
                </p>
              </div>

              <div className="bg-background rounded-2xl p-8 border border-border hover:border-primary/30 transition-colors duration-200">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Secure</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Your data is fully encrypted and stored in a secure location.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-br from-primary to-accent rounded-3xl p-12 md:p-16 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />

              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Get Started Today
                </h2>
                <p className="text-lg text-white/80 max-w-xl mx-auto mb-8">
                  Chat with the assistant in the bottom right corner to find the perfect test for you!
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <span className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 rounded-full text-white font-medium">
                    <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                    AI Assistant Online
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="py-8 px-6 border-t border-border">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary">hire.mn</span>
              <span className="text-muted-foreground">2026</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Right person, right place
            </p>
          </div>
        </footer>
      </div>

      <div className="fixed bottom-6 right-6 z-50">
        <HireMnChatWidget />
      </div>
    </main>
  )
}
