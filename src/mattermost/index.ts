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
    messages: ChatCompletionRequestMessage[],
    metadata: Record<string, unknown>
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
    const id = await this.getId()
    console.log("ID:", id)
    console.log("EVENT:", event)

    if (
      event.event === "posted" &&
      event.data.mentions &&
      JSON.parse(event.data.mentions).includes(id)
    ) {
      const post = JSON.parse(event.data.post)
      const posts = await this.getPosts(post.id)

      const history = posts.map(
        (post) =>
          ({
            content: post.message,
            role: post.user_id === id ? "assistant" : "user",
          } as ChatCompletionRequestMessage)
      )

      const metadata = {
        channel_id: post.channel_id,
        root_id: post.root_id || post.id,
      }

      history.unshift({
        role: "system",
        content: `You are a helpful Mattermost bot named ${this.bot.name} who provides succinct answers in Markdown format.
When added to a channel, give your greetings, thank the person who added you and introduce yourself explaining what kind of help you can provide.
Also explain that to interact with you, people must prefix their messages with ${this.bot.name}. Give a message example to interact with you,  in Markdown format.`,
      })

      this.onMessages(history, metadata)
    }
  }

  async send(message: string, metadata: Record<string, unknown>) {
    await this.httpClient.createPost({ message, ...metadata })
  }
}
