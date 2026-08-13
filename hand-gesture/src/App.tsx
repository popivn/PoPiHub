import { useState, useEffect } from 'react'
import HandGestureRecognizer from './HandGestureRecognizer'
import GestureDisplay from './GestureDisplay'

function App() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const mode = new URLSearchParams(window.location.search).get('mode')
  const isDisplayMode = mode === 'display'

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const fullscreenBtn =
    'fixed top-3 right-3 z-[1000] hidden max-lg:flex items-center justify-center w-11 h-11 rounded-full border border-border bg-social-bg text-text-h cursor-pointer transition-[background,box-shadow] duration-200 active:bg-accent-bg [-webkit-tap-highlight-color:transparent]'

  return (
    <>
      <button
        type="button"
        className={fullscreenBtn}
        onClick={toggleFullscreen}
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      >
        {isFullscreen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3v4a1 1 0 0 1-1 1H3" />
            <path d="M16 3v4a1 1 0 0 0 1 1h4" />
            <path d="M8 21v-4a1 1 0 0 0-1-1H3" />
            <path d="M16 21v-4a1 1 0 0 1 1-1h4" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8V5a2 2 0 0 1 2-2h3" />
            <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
            <path d="M3 16v3a2 2 0 0 0 2 2h3" />
            <path d="M21 16v3a2 2 0 0 1-2 2h-3" />
          </svg>
        )}
      </button>

      {isDisplayMode ? <GestureDisplay /> : <HandGestureRecognizer />}
    </>
  )
}

export default App
