import { WebSocketServer } from 'ws'

const PORT = 3001

const wss = new WebSocketServer({ port: PORT, host: '0.0.0.0' })

const clients = new Set()

let lastGesture = 'None'
let lastTimestamp = Date.now()

wss.on('connection', (ws) => {
  clients.add(ws)
  console.log(`[WS] Client connected. Total: ${clients.size}`)

  // Send current state to new client
  ws.send(JSON.stringify({ type: 'gesture', gesture: lastGesture, timestamp: lastTimestamp }))

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString())
      if (msg.type === 'gesture') {
        console.log(`[WS Server] Received gesture: "${msg.gesture}". Broadcasting to other clients...`)
        
        // Broadcast to all other clients
        const payload = JSON.stringify(msg)
        let broadcastCount = 0
        for (const client of clients) {
          if (client !== ws && client.readyState === 1) {
            client.send(payload)
            broadcastCount++
          }
        }
        console.log(`[WS Server] Broadcasted to ${broadcastCount} clients.`)
      }
    } catch (e) {
      console.error('[WS Server] Failed to parse message:', e)
    }
  })

  ws.on('close', () => {
    clients.delete(ws)
    console.log(`[WS] Client disconnected. Total: ${clients.size}`)
  })
})

console.log(`[WS] Gesture relay server running on ws://localhost:${PORT}`)
