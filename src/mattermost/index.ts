import type { WebSocketMessage } from "@mattermost/client"
import type { ChatCompletionRequestMessage } from "openai"

import HTTPClient from "./http-client"
import WSClient from "./websocket-client"

export default class Mattermost {
  bot: {
    id?: string
    name: string
  }
  wsClient
  httpClient
  id?: string
  onMessages: (
    post: Record<string, unknown>,
    history: ChatCompletionRequestMessage[],
    message?: string
  ) => void

  constructor() {
    const url = process.env.MATTERMOST_URL ?? ""
    const token = process.env.MATTERMOST_TOKEN ?? ""
    this.bot = { name: process.env.MATTERMOST_BOT_NAME ?? "" }

    this.onMessages = () => null
    this.httpClient = new HTTPClient({ token, url })

    const websocketUrl = new URL(this.httpClient.getWebSocketUrl())
    websocketUrl.protocol = websocketUrl.protocol === "https:" ? "wss" : "ws"

    this.wsClient = new WSClient({
      token,
      url: websocketUrl.toString(),
    })

    this.wsClient.addMessageListener(this.handleMessage.bind(this))
  }

  async getId() {
    if (this.bot.id) {
      return Promise.resolve(this.bot.id)
    } else {
      const { id } = await this.httpClient.getMe()
      return (this.bot.id = id)
    }
  }

  async getPosts(id: string) {
    const thread = await this.httpClient.getPostThread(id, true, false, true)

    return [...new Set(thread.order)]
      .map((id) => thread.posts[id])
      .filter((a) => a.create_at > Date.now() - 1000 * 60 * 60 * 24 * 1)
      .sort((a, b) => a.create_at - b.create_at)
  }

  async handleMessage(event: WebSocketMessage<Record<string, string>>) {
    const botId = await this.getId()
    // console.log("ID:", botId)
    // console.log("EVENT:", event)

    if (
      event.event === "posted" &&
      event.data.mentions &&
      JSON.parse(event.data.mentions).includes(botId)
    ) {
      const post = JSON.parse(event.data.post)
      const posts = await this.getPosts(post.id)

      const history = posts.map(
        (post) =>
          ({
            content: post.message,
            role: post.user_id === botId ? "assistant" : "user",
          } as ChatCompletionRequestMessage)
      )

      const metadata = {
        channel_id: post.channel_id,
        root_id: post.root_id || post.id,
      }

      const message = history.pop()

      this.onMessages(metadata, history, message?.content)
    }
  }

  async send(message: string, post: Record<string, unknown>) {
    await this.httpClient.createPost({ message, ...post })
  }
}
