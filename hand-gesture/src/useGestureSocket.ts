import { useEffect, useRef, useState } from 'react'
import type { GestureName } from './gestures'

const h = window.location.hostname
const isLocal = h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || /^[0-9.]+$/.test(h)

const WS_URL = isLocal
  ? `ws://${h}:3001`
  : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`

export function useGestureSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const [gesture, setGesture] = useState<GestureName>('None')
  const [handPos, setHandPos] = useState<{ x: number; y: number } | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      console.log('[WS] Connected to Server')
    }
    ws.onclose = () => {
      setConnected(false)
      console.log('[WS] Disconnected from Server. Reconnecting...')
      setTimeout(() => {
        if (wsRef.current === ws) {
          wsRef.current = new WebSocket(WS_URL)
        }
      }, 2000)
    }
    ws.onerror = () => ws.close()

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'gesture') {
          console.log(`[WS] Received Broadcasted Gesture: %c${msg.gesture}`, 'color: #aa3bff; font-weight: bold; font-size: 14px;')
          setGesture(msg.gesture as GestureName)
          if (msg.x !== undefined && msg.y !== undefined) {
            setHandPos({ x: msg.x, y: msg.y })
          } else {
            setHandPos(null)
          }
        }
      } catch (err) {
        console.error('[WS] Error parsing message:', err)
      }
    }

    return () => {
      ws.close()
    }
  }, [])

  const sendGesture = (g: GestureName, x?: number, y?: number) => {
    if (wsRef.current?.readyState === 1) {
      console.log(`[WS] Broadcasting Gesture: %c${g} (X: ${x?.toFixed(3)}, Y: ${y?.toFixed(3)})`, 'color: #22c55e; font-weight: bold; font-size: 14px;')
      wsRef.current.send(JSON.stringify({ type: 'gesture', gesture: g, x, y }))
    }
  }

  return { gesture, handPos, connected, sendGesture }
}
