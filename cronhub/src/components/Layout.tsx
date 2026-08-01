import type { ReactNode } from 'react'
import Header, { type View } from './Header'
import Footer from './Footer'

type LayoutProps = {
  view: View
  onNavigate: (view: View) => void
  children: ReactNode
}

export default function Layout({ view, onNavigate, children }: LayoutProps) {
  return (
    <div className="flex min-h-svh flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
      <Header view={view} onNavigate={onNavigate} />
      <main className="mx-auto w-full max-w-[1180px] flex-1 px-6 py-8">
        {children}
      </main>
      <Footer />
    </div>
  )
}
