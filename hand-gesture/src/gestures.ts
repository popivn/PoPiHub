export type GestureName =
  | 'Open Palm'
  | 'Fist'
  | 'Peace'
  | 'Thumbs Up'
  | 'Pointing'
  | 'Pointing Down'
  | 'Sword Mudra'
  | 'Wave'
  | 'None'

interface FingerStates {
  thumb: boolean
  index: boolean
  middle: boolean
  ring: boolean
  pinky: boolean
}

const FINGER_TIPS = [4, 8, 12, 16, 20]
const FINGER_PIPS = [3, 6, 10, 14, 18]
const FINGER_MCPS = [2, 5, 9, 13, 17]

function getFingerStates(landmarks: { x: number; y: number }[]): FingerStates {
  const states: FingerStates = {
    thumb: false,
    index: false,
    middle: false,
    ring: false,
    pinky: false,
  }

  const fingerNames: (keyof FingerStates)[] = [
    'thumb',
    'index',
    'middle',
    'ring',
    'pinky',
  ]

  // Thumb: check distance from wrist relative to thumb base
  const thumbTip = landmarks[4]
  const thumbMcp = landmarks[2]
  const wrist = landmarks[0]
  const distThumb = Math.hypot(thumbTip.x - wrist.x, thumbTip.y - wrist.y)
  const distMcp = Math.hypot(thumbMcp.x - wrist.x, thumbMcp.y - wrist.y)
  states.thumb = distThumb > distMcp

  // Other fingers: if tip is further from knuckle (MCP) than PIP, the finger is extended
  for (let i = 1; i < 5; i++) {
    const tip = landmarks[FINGER_TIPS[i]]
    const pip = landmarks[FINGER_PIPS[i]]
    const mcp = landmarks[FINGER_MCPS[i]]

    const distTipMcp = Math.hypot(tip.x - mcp.x, tip.y - mcp.y)
    const distPipMcp = Math.hypot(pip.x - mcp.x, pip.y - mcp.y)

    states[fingerNames[i]] = distTipMcp > distPipMcp
  }

  return states
}

export function detectGesture(landmarks: { x: number; y: number }[]): GestureName {
  if (!landmarks || landmarks.length < 21) return 'None'

  const fingers = getFingerStates(landmarks)
  const { thumb, index, middle, ring, pinky } = fingers

  // 1. PRIORITIZE SWORD MUDRA: If index and middle are extended and held close together,
  // it is ALWAYS Sword Mudra (Ngự Kiếm), regardless of other fingers to prevent misclassifying as Open Palm!
  if (index && middle) {
    const tip8 = landmarks[8]
    const tip12 = landmarks[12]
    const mcp5 = landmarks[5]
    
    const tipDist = Math.hypot(tip8.x - tip12.x, tip8.y - tip12.y)
    const indexLength = Math.hypot(tip8.x - mcp5.x, tip8.y - mcp5.y)
    
    if (tipDist < indexLength * 0.5) {
      return 'Sword Mudra'
    }
  }

  // Fist: all fingers closed
  if (!thumb && !index && !middle && !ring && !pinky) return 'Fist'

  // Open Palm: all fingers extended
  if (thumb && index && middle && ring && pinky) return 'Open Palm'

  // Peace: index and middle up, others down
  if (!thumb && index && middle && !ring && !pinky) return 'Peace'

  // Thumbs Up: only thumb extended (strict check)
  if (thumb && !index && !middle && !ring && !pinky) return 'Thumbs Up'

  // Pointing Up vs Pointing Down
  if (!thumb && index && !middle && !ring && !pinky) {
    const tip = landmarks[8]
    const mcp = landmarks[5]
    // If the index tip is above its knuckle, it is pointing UP, otherwise pointing DOWN
    return tip.y < mcp.y ? 'Pointing' : 'Pointing Down'
  }

  return 'None'
}

export const GESTURE_EMOJIS: Record<GestureName, string> = {
  'Open Palm': '✋',
  Fist: '✊',
  Peace: '✌️',
  'Thumbs Up': '👍',
  Pointing: '☝️',
  'Pointing Down': '👇',
  'Sword Mudra': '⚔️',
  Wave: '👋',
  None: '—',
}
