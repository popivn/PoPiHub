import { useEffect, useRef, useState, useCallback } from 'react'
import {
  HandLandmarker,
  FilesetResolver,
  type HandLandmarkerResult,
} from '@mediapipe/tasks-vision'
import { detectGesture, GESTURE_EMOJIS, type GestureName } from './gestures'
import { useGestureSocket } from './useGestureSocket'

export default function HandGestureRecognizer() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const landmarkerRef = useRef<HandLandmarker | null>(null)
  const rafRef = useRef<number>(0)
  const waveHistoryRef = useRef<GestureName[]>([])

  const [gesture, setGesture] = useState<GestureName>('None')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [cameraOn, setCameraOn] = useState(false)

  const { sendGesture, connected } = useGestureSocket()
  const gestureRef = useRef<GestureName>('None')
  const lastSentRef = useRef<GestureName>('None')
  const lastPosSentTimeRef = useRef(0)

  const initLandmarker = useCallback(async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm'
      )
      const landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 1,
      })
      landmarkerRef.current = landmarker
      setLoading(false)
    } catch {
      setError('Không thể tải model HandLandmarker. Kiểm tra kết nối internet.')
      setLoading(false)
    }
  }, [])

  const startCamera = useCallback(async () => {
    if (!landmarkerRef.current) {
      await initLandmarker()
    }
    if (!landmarkerRef.current) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setCameraOn(true)
        detectLoop()
      }
    } catch {
      setError('Không thể truy cập camera. Vui lòng cấp quyền camera.')
    }
  }, [initLandmarker])

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    const stream = videoRef.current?.srcObject as MediaStream | null
    stream?.getTracks().forEach((t) => t.stop())
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraOn(false)
    setGesture('None')
    waveHistoryRef.current = []
  }, [])

  const drawLandmarks = (
    ctx: CanvasRenderingContext2D,
    landmarks: { x: number; y: number }[],
    width: number,
    height: number
  ) => {
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [5, 9], [9, 10], [10, 11], [11, 12],
      [9, 13], [13, 14], [14, 15], [15, 16],
      [13, 17], [17, 18], [18, 19], [19, 20],
      [0, 17],
    ]

    ctx.strokeStyle = 'rgba(170, 59, 255, 0.8)'
    ctx.lineWidth = 3
    for (const [a, b] of connections) {
      ctx.beginPath()
      ctx.moveTo(landmarks[a].x * width, landmarks[a].y * height)
      ctx.lineTo(landmarks[b].x * width, landmarks[b].y * height)
      ctx.stroke()
    }

    ctx.fillStyle = '#aa3bff'
    for (const lm of landmarks) {
      ctx.beginPath()
      ctx.arc(lm.x * width, lm.y * height, 5, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const detectLoop = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    const landmarker = landmarkerRef.current

    if (!video || !canvas || !landmarker || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(detectLoop)
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = video.videoWidth
    const h = video.videoHeight
    if (canvas.width !== w) canvas.width = w
    if (canvas.height !== h) canvas.height = h

    const startTimeMs = performance.now()
    const result: HandLandmarkerResult = landmarker.detectForVideo(video, startTimeMs)

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    let handPos: { x: number; y: number } | undefined

    if (result.landmarks && result.landmarks.length > 0) {
      const landmarks = result.landmarks[0]
      drawLandmarks(ctx, landmarks, canvas.width, canvas.height)

      const detected = detectGesture(landmarks)

      // Capture hand center coordinates (normalized 0 to 1)
      if (landmarks[9]) {
        handPos = { x: landmarks[9].x, y: landmarks[9].y }
      }

      // Wave detection: alternate Open Palm / Fist over last 10 frames
      waveHistoryRef.current.push(detected)
      if (waveHistoryRef.current.length > 10) waveHistoryRef.current.shift()

      const hasOpen = waveHistoryRef.current.includes('Open Palm' as GestureName)
      const hasFist = waveHistoryRef.current.includes('Fist' as GestureName)
      const alternations = waveHistoryRef.current.filter(
        (g) => g === 'Open Palm' || g === 'Fist'
      ).length

      let finalGesture: GestureName
      if (hasOpen && hasFist && alternations >= 4) {
        finalGesture = 'Wave'
      } else {
        finalGesture = detected
      }
      setGesture(finalGesture)
      gestureRef.current = finalGesture
    } else {
      setGesture('None')
      gestureRef.current = 'None'
      waveHistoryRef.current = []
    }

    const now = performance.now()
    const isChasing = gestureRef.current === 'Sword Mudra'

    if (gestureRef.current !== lastSentRef.current) {
      sendGesture(gestureRef.current, handPos?.x, handPos?.y)
      lastSentRef.current = gestureRef.current
      lastPosSentTimeRef.current = now
    } else if (isChasing && handPos && now - lastPosSentTimeRef.current > 33) {
      // Continuously stream Ngự Kiếm coordinates at ~30fps for ultra-smooth movement
      sendGesture(gestureRef.current, handPos.x, handPos.y)
      lastPosSentTimeRef.current = now
    }

    rafRef.current = requestAnimationFrame(detectLoop)
  }

  useEffect(() => {
    initLandmarker()
    return () => {
      cancelAnimationFrame(rafRef.current)
      const stream = videoRef.current?.srcObject as MediaStream | null
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [initLandmarker])

  return (
    <div className="w-full max-w-[640px] mx-auto flex flex-col items-center gap-4 max-lg:gap-3 max-[480px]:gap-2.5 p-4 max-lg:p-3">
      <div className="text-center">
        <h2 className="text-2xl text-text-h m-0 mb-1 max-lg:text-xl">Nhận diện cử chỉ tay</h2>
        <p className="text-sm text-text m-0 max-lg:text-[13px]">Sử dụng camera để nhận diện cử động tay theo thời gian thực</p>
        <div className="flex justify-center gap-4 mt-2">
          <a
            href="/?mode=display"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent font-medium hover:underline flex items-center gap-1"
          >
            Mở màn hình nhận stream (Display Mode) ↗
          </a>
        </div>
        <div className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-2xl text-xs font-medium ${connected ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'}`}>
          <span className="w-2 h-2 rounded-full bg-current [animation:pulse_1.5s_ease-in-out_infinite]" />
          {connected ? 'Đã kết nối' : 'Mất kết nối'}
        </div>
      </div>

      <div className="relative w-full aspect-[4/3] max-lg:aspect-[3/4] max-[480px]:aspect-[9/16] max-[480px]:rounded-none max-[480px]:border-x-0 rounded-2xl max-lg:rounded-xl overflow-hidden bg-black border border-border shadow-card">
        <video ref={videoRef} className="w-full h-full object-cover -scale-x-100" playsInline muted />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full -scale-x-100 pointer-events-none" />

        {!cameraOn && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg">
            {loading ? (
              <div className="flex flex-col items-center gap-3 text-text">
                <div className="w-10 h-10 border-3 border-border border-t-accent rounded-full [animation:spin_0.8s_linear_infinite]" />
                <p className="text-sm">Đang tải model AI...</p>
              </div>
            ) : error ? (
              <div className="text-center p-5 text-danger text-sm">{error}</div>
            ) : (
              <button
                className="flex flex-col items-center gap-2 px-8 py-5 rounded-xl border border-accent-border bg-accent-bg text-accent text-base font-medium cursor-pointer transition-all duration-200 hover:bg-accent hover:text-white active:scale-95 max-lg:px-7 max-lg:py-4 max-lg:text-[15px]"
                onClick={startCamera}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 7l-7 5 7 5V7z" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
                Bật camera
              </button>
            )}
          </div>
        )}

        {cameraOn && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-2 rounded-3xl bg-black/65 backdrop-blur-md text-white pointer-events-none max-lg:bottom-2.5 max-lg:px-4 max-lg:py-1.5">
            <span className="text-[28px] leading-none max-lg:text-6">{GESTURE_EMOJIS[gesture]}</span>
            <span className="text-base font-semibold max-lg:text-sm">{gesture}</span>
          </div>
        )}
      </div>

      {/* Tắt camera button */}
      {cameraOn && (
        <button
          className="px-6 py-2 rounded-lg border border-border bg-social-bg text-text-h text-sm cursor-pointer transition-all duration-200 hover:bg-accent-bg hover:border-accent-border active:scale-95 max-lg:px-7 max-lg:py-2.5 max-lg:min-h-11"
          onClick={stopCamera}
        >
          Tắt camera
        </button>
      )}

      {/* Supported gestures HUD */}
      <div className="w-full text-center">
        <h3 className="text-base text-text-h m-0 mb-3 max-lg:text-sm max-lg:mb-2">Cử chỉ hỗ trợ</h3>
        <div className="flex flex-wrap justify-center gap-3 max-lg:gap-1.5 max-[480px]:gap-1">
          <GestureItem emoji="✋" label="Open Palm" active={gesture === 'Open Palm'} />
          <GestureItem emoji="✊" label="Fist" active={gesture === 'Fist'} />
          <GestureItem emoji="✌️" label="Peace" active={gesture === 'Peace'} />
          <GestureItem emoji="👍" label="Thumbs Up" active={gesture === 'Thumbs Up'} />
          <GestureItem emoji="☝️" label="Pointing" active={gesture === 'Pointing'} />
          <GestureItem emoji="👇" label="Pointing Down" active={gesture === 'Pointing Down'} />
          <GestureItem emoji="👋" label="Wave" active={gesture === 'Wave'} />
        </div>
      </div>
    </div>
  )
}

function GestureItem({ emoji, label, active }: { emoji: string; label: string; active: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[20px] border text-sm text-text-h transition-all duration-200 max-lg:px-2.5 max-lg:py-1 max-lg:text-xs max-[480px]:px-2 max-[480px]:py-0.5 max-[480px]:text-[11px] ${active ? 'bg-accent-bg border-accent text-accent scale-105' : 'bg-social-bg border-border'}`}>
      <span className="text-xl max-lg:text-[18px] max-[480px]:text-base">{emoji}</span>
      <span>{label}</span>
    </div>
  )
}
