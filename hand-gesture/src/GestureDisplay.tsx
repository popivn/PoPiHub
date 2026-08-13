import { useEffect, useRef, useState } from 'react'
import { Application, Graphics, Sprite, Container, Texture } from 'pixi.js'
import { GESTURE_EMOJIS } from './gestures'
import { useGestureSocket } from './useGestureSocket'

interface SwordInstance {
  sprite: Sprite
  baseX: number
  baseY: number
  bobOffset: number
  bobSpeed: number
  rotationSpeed: number
  scale: number
  state: 'idle' | 'gathering' | 'preparing' | 'spearing'
  spearSpeed: number
  spearDelay: number
}

const SWORD_COLORS = [
  0x38bdf8, // Cyan (Băng Kiếm)
  0xc084fc, // Purple (Lôi Kiếm)
  0xfb7185, // Pink-Red (Hỏa Kiếm)
  0x34d399, // Green (Mộc Kiếm)
  0xfbbf24, // Gold (Hoàng Kim Kiếm)
]

export default function GestureDisplay() {
  const { gesture, handPos, connected } = useGestureSocket()
  const [swordCount, setSwordCount] = useState(0)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const swordsRef = useRef<SwordInstance[]>([])
  const swordTextureRef = useRef<Texture | null>(null)
  const lastGestureRef = useRef<string>('None')

  // Keep a ref to the current handPos so the effect can read its latest value without re-running
  const handPosRef = useRef(handPos)
  useEffect(() => {
    handPosRef.current = handPos
  }, [handPos])

  const gestureRef = useRef(gesture)
  useEffect(() => {
    gestureRef.current = gesture
  }, [gesture])

  // 1. Initialize PixiJS Application
  useEffect(() => {
    if (!containerRef.current) return

    const app = new Application()
    appRef.current = app
    let isDestroyed = false

    const initPixi = async () => {
      try {
        await app.init({
          resizeTo: containerRef.current!,
          backgroundAlpha: 0,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
        })

        if (isDestroyed) {
          app.destroy(true, { children: true, texture: true })
          return
        }

        if (containerRef.current) {
          containerRef.current.appendChild(app.canvas)
        }

        // Generate the Sword Texture once
        const g = new Graphics()

        // Outer glow under-layer (semi-transparent wider blade)
        g.fill({ color: 0xffffff, alpha: 0.25 })
        g.beginPath()
        g.moveTo(-7, 20)
        g.lineTo(7, 20)
        g.lineTo(7, -110)
        g.lineTo(0, -135)
        g.lineTo(-7, -110)
        g.closePath()
        g.fill()

        // Main Steel Blade (Gradient / Bright Center)
        g.fill({ color: 0xf8fafc })
        g.beginPath()
        g.moveTo(-4, 20)
        g.lineTo(4, 20)
        g.lineTo(4, -110)
        g.lineTo(0, -130)
        g.lineTo(-4, -110)
        g.closePath()
        g.fill()

        // Guard (Chắn tay kiếm vàng hình phượng hoàng)
        g.fill({ color: 0xfbbf24 })
        g.beginPath()
        g.moveTo(-15, 20)
        g.quadraticCurveTo(0, 16, 15, 20)
        g.quadraticCurveTo(8, 26, 0, 24)
        g.quadraticCurveTo(-8, 26, -15, 20)
        g.closePath()
        g.fill()

        // Guard Gem (Hồng ngọc)
        g.fill({ color: 0xef4444 })
        g.circle(0, 21, 2.5)
        g.fill()

        // Hilt (Chuôi kiếm sẫm màu)
        g.fill({ color: 0x1e293b })
        g.rect(-2, 24, 4, 35)
        g.fill()

        // Pommel (Đốc kiếm vàng)
        g.fill({ color: 0xfbbf24 })
        g.circle(0, 60, 4)
        g.fill()

        // Red Tassels (Tua rua đỏ bay bổng)
        g.stroke({ color: 0xef4444, width: 2 })
        g.beginPath()
        g.moveTo(0, 62)
        g.quadraticCurveTo(-4, 75, -2, 85)
        g.moveTo(0, 62)
        g.quadraticCurveTo(4, 75, 2, 85)
        g.stroke()

        const texture = app.renderer.generateTexture(g)
        swordTextureRef.current = texture
        g.destroy()

        // 2. Ticker loop to animate swords
        app.ticker.add((ticker) => {
          const delta = ticker.deltaTime
          const currentGesture = gestureRef.current
          const currentHandPos = handPosRef.current
          const isChasing = currentGesture === 'Sword Mudra'
          const isPreparing = currentGesture === 'Open Palm'
          const isNone = currentGesture === 'None'

          swordsRef.current.forEach((item) => {
            // If gesture is None, handle progressive spearing with delay
            if (isNone && item.state !== 'spearing') {
              if (item.spearDelay > 0) {
                // Still waiting: keep sword at top (preparing position) until delay expires
                item.spearDelay -= delta / 60
                item.sprite.x += (item.baseX - item.sprite.x) * 0.08 * delta
                item.sprite.y += (40 - item.sprite.y) * 0.08 * delta
                item.sprite.rotation = Math.PI
                return
              } else {
                item.state = 'spearing'
                item.spearSpeed = 12 + Math.random() * 8
              }
            }

            if (item.state === 'spearing') {
              // SPEARING STATE: Accelerate downwards off the screen!
              item.spearSpeed += 0.8 * delta
              item.sprite.y += item.spearSpeed * delta
              
              // Keep pointing straight down (Math.PI)
              item.sprite.rotation = Math.PI

              // Once fully off screen:
              if (item.sprite.y > app.screen.height + 150) {
                if (currentGesture === 'None') {
                  // If still None, loop back to top with a small random delay so they don't all fall at once
                  item.sprite.y = -150
                  item.sprite.x = 80 + Math.random() * (app.screen.width - 160)
                  item.spearSpeed = 12 + Math.random() * 8
                  item.spearDelay = Math.random() * 1.5 // staggered re-entry 0-1.5s
                } else {
                  // Otherwise reset to idle and drift back down to home
                  item.state = 'idle'
                  item.sprite.y = -100
                }
              }
            } else if (isChasing && currentHandPos) {
              item.state = 'gathering'
              // Convert 0-1 coordinate to absolute screen pixels
              const targetX = (1 - currentHandPos.x) * app.screen.width
              const targetY = currentHandPos.y * app.screen.height

              // Move smoothly towards pointing coordinate (converge)
              item.sprite.x += (targetX - item.sprite.x) * 0.05 * delta
              item.sprite.y += (targetY - item.sprite.y) * 0.05 * delta

              // Rotate to face the target! 
              const dx = targetX - item.sprite.x
              const dy = targetY - item.sprite.y
              const targetAngle = Math.atan2(dy, dx) + Math.PI / 2

              // Smoothly interpolate rotation (handling PI wrapping safely)
              let diff = targetAngle - item.sprite.rotation
              diff = Math.atan2(Math.sin(diff), Math.cos(diff))
              item.sprite.rotation += diff * 0.1 * delta
            } else if (isPreparing) {
              item.state = 'preparing'
              // PREPARING STATE: Fly straight up to top of screen (y = 40) and align with baseX
              item.sprite.x += (item.baseX - item.sprite.x) * 0.08 * delta
              item.sprite.y += (40 - item.sprite.y) * 0.08 * delta

              // Face straight down (Math.PI)
              const targetAngle = Math.PI
              let diff = targetAngle - item.sprite.rotation
              diff = Math.atan2(Math.sin(diff), Math.cos(diff))
              item.sprite.rotation += diff * 0.1 * delta
            } else {
              // Idle state: swords are planted into the ground (cắm xuống đất), pointing downward
              item.state = 'idle'
              item.bobOffset += item.bobSpeed * 0.05 * delta
              
              // Move to base X position smoothly
              item.sprite.x += (item.baseX - item.sprite.x) * 0.05 * delta
              // Plant at ground level (bottom of screen), with slight bob
              const groundY = app.screen.height - 40 + Math.sin(item.bobOffset) * 3
              item.sprite.y += (groundY - item.sprite.y) * 0.05 * delta

              // Point straight down (Math.PI) with gentle sway
              const targetAngle = Math.PI + Math.sin(item.bobOffset * 0.2) * 0.05
              let diff = targetAngle - item.sprite.rotation
              diff = Math.atan2(Math.sin(diff), Math.cos(diff))
              item.sprite.rotation += diff * 0.05 * delta
            }
          })
        })
      } catch (err) {
        console.error('Pixi init error:', err)
      }
    }

    initPixi()

    return () => {
      isDestroyed = true
      if (app.renderer) {
        app.destroy(true, { children: true, texture: true })
      }
      appRef.current = null
    }
  }, [])

  // 3. Handle Gesture Summoning / Recalling
  useEffect(() => {
    const app = appRef.current
    const texture = swordTextureRef.current
    if (!app || !texture) return

    // Summon: Not Thumbs Up -> Thumbs Up
    if (gesture === 'Thumbs Up' && lastGestureRef.current !== 'Thumbs Up') {
      const width = app.screen.width
      const height = app.screen.height
      const hp = handPosRef.current

      // Spawn 100 swords at once!
      for (let i = 0; i < 100; i++) {
        const sprite = new Sprite(texture)
        sprite.anchor.set(0.5, 0.4) // Pivot near center of sword

        const color = SWORD_COLORS[Math.floor(Math.random() * SWORD_COLORS.length)]
        sprite.tint = color // Colored mystical sword!
        
        // Slightly smaller scale so a high quantity of swords fits gracefully on screen
        const scale = 0.35 + Math.random() * 0.45
        sprite.scale.set(0) // Start at scale 0 for pop-in animation
        
        // Calculate coordinates: Map 0-1 from camera to fullscreen pixels
        let spawnX = 80 + Math.random() * (width - 160)
        let spawnY = 80 + Math.random() * (height - 160)

        if (hp) {
          // Mirrored camera coordinates -> Map 1-1 to screen with circular dispersion
          const centerX = (1 - hp.x) * width
          const centerY = hp.y * height
          const angle = Math.random() * Math.PI * 2
          const radius = Math.random() * 180 // Scatter within a circle of 180px radius
          spawnX = centerX + Math.cos(angle) * radius
          spawnY = centerY + Math.sin(angle) * radius
        }

        sprite.x = spawnX
        sprite.y = spawnY
        sprite.rotation = -0.5 + Math.random() * 1.0 // facing slightly random angles

        app.stage.addChild(sprite)

        const sword: SwordInstance = {
          sprite,
          baseX: sprite.x,
          baseY: sprite.y,
          bobOffset: Math.random() * 100,
          bobSpeed: 0.5 + Math.random() * 1.0,
          rotationSpeed: -0.2 + Math.random() * 0.4,
          scale,
          state: 'idle',
          spearSpeed: 0,
          spearDelay: 0,
        }

        // Pop-in scale animation
        let currentScale = 0
        const popTicker = (ticker: any) => {
          currentScale += 0.08 * ticker.deltaTime
          if (currentScale >= scale) {
            sprite.scale.set(scale)
            app.ticker.remove(popTicker)
          } else {
            sprite.scale.set(currentScale)
          }
        }
        app.ticker.add(popTicker)

        swordsRef.current.push(sword)
      }

      setSwordCount(swordsRef.current.length)
    }

    // Recall / Clear logic removed ("k xoá kiếm")

    // Trigger Progressive Spearing Down: Open Palm (preparing) -> None
    // Swords spear in increasing batches: 1, then 2, then 3, then 4... until all are spearing
    if (gesture === 'None' && lastGestureRef.current === 'Open Palm') {
      const swords = swordsRef.current
      // Sort by x position for a visual left-to-right cascade
      const sorted = [...swords].sort((a, b) => a.sprite.x - b.sprite.x)

      let batch = 1
      let index = 0
      let delay = 0
      const delayIncrement = 0.25 // seconds between each batch

      while (index < sorted.length) {
        for (let i = 0; i < batch && index < sorted.length; i++) {
          sorted[index].spearDelay = delay
          sorted[index].state = 'preparing' // keep at top until delay expires
          index++
        }
        batch++
        delay += delayIncrement
      }
    }

    lastGestureRef.current = gesture
  }, [gesture])

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#030407] text-white font-sans select-none">
      {/* Mystical Background Aura */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0%,transparent_80%)] pointer-events-none z-10" />

      {/* Floating Header / Instructions */}
      <div className="absolute top-6 left-6 text-left z-20 max-sm:top-4 max-sm:left-4">
        <h2 className="text-xl font-bold tracking-widest text-indigo-400 uppercase max-sm:text-lg [text-shadow:0_0_12px_rgba(99,102,241,0.4)]">Vạn Kiếm Trận (WebGL)</h2>
        <p className="text-xs text-slate-400 mt-1 max-sm:text-[11px] flex flex-col gap-0.5">
          <span>👍 Thumbs Up: Triệu hồi Tiên Kiếm (Bình thường bay lơ lửng)</span>
          <span>⚔️ Ngự Kiếm (Khép trỏ & giữa): Tụ Kiếm (Đuổi theo ngự trị tọa độ tay)</span>
          <span>✋ Open Palm: Dàn trận hàng ngang ở trần (Top 0)</span>
          <span>— None (Hạ tay xuống): **VẠN KIẾM THIÊN LÔI** (Mưa kiếm đâm xuống đất liên tục tuần hoàn!)</span>
          {handPos && (
            <span className="font-mono text-xs text-emerald-400 font-bold mt-1 tracking-wide animate-pulse">
              📍 Tọa độ ngự kiếm: X: {(100 * (1 - handPos.x)).toFixed(1)}%, Y: {(100 * handPos.y).toFixed(1)}%
            </span>
          )}
        </p>
      </div>

      {/* Sword Count Display */}
      <div className="absolute top-6 right-6 text-right z-20 max-sm:top-4 max-sm:right-4">
        <div className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">Số lượng Tiên Kiếm</div>
        <div className="text-4xl font-black text-white [text-shadow:0_0_15px_rgba(99,102,241,0.6)]">{swordCount}</div>
      </div>

      {/* Fullscreen PixiJS Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full bg-transparent z-0">
        {swordCount === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700 gap-2 pointer-events-none z-10">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="animate-pulse">
              <path d="M14.5 17.5L3 5M13 3.5l8 8" />
              <path d="M8.5 11.5l1 1" />
              <path d="M19 19l-3-3" />
            </svg>
            <p className="text-sm font-medium tracking-wide">Kiếm trận vô chủ. Hãy Thumbs Up 👍 để ngự kiếm!</p>
          </div>
        )}
      </div>

      {/* Floating Bottom-Right Gesture Display */}
      <div className="absolute bottom-6 right-6 z-20 flex flex-col items-end gap-2 max-sm:bottom-4 max-sm:right-4">
        {/* Connection status */}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-lg ${
          connected ? 'bg-success/15 text-success border border-success/30' : 'bg-danger/15 text-danger border border-danger/30'
        }`}>
          <span className="w-2 h-2 rounded-full bg-current [animation:pulse_1.5s_ease-in-out_infinite]" />
          {connected ? 'Đã kết nối' : 'Mất kết nối'}
        </div>

        {/* Gesture pill */}
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-2xl transition-all duration-300 scale-100 hover:scale-105">
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Cử chỉ nhận diện</span>
            <span className="text-sm font-bold text-slate-200">{gesture}</span>
          </div>
          <span className="text-3xl leading-none" key={gesture}>
            {GESTURE_EMOJIS[gesture]}
          </span>
        </div>
      </div>
    </div>
  )
}
