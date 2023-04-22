import { WebSocketClient } from "@mattermost/client"
import { WebSocket } from "ws"

if (!global.WebSocket) {
  // @ts-expect-error force WebSocket
  global.WebSocket = WebSocket
}

export default class WSClient extends WebSocketClient {
  constructor({ url, token }: { url: string; token: string }) {
    super()
    this.addCloseListener((count) => console.log("close", count))
    this.addErrorListener((event) => console.log("Error:", event))
    this.initialize(url, token)
  }
}
