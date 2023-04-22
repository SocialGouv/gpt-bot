import * as dotenv from "dotenv"
dotenv.config()

import type { ChatCompletionRequestMessage } from "openai"

import Mattermost from "./mattermost"
import OpenAI from "./openai"

const mattermost = new Mattermost()
const openai = new OpenAI()

mattermost.onMessages = async (
  messages: ChatCompletionRequestMessage[],
  metadata: Record<string, unknown>
) => {
  console.log("Mattermost messages:", messages)
  const response = await openai.request(messages)
  console.log("OpenAI response:", response)
  await mattermost.send(response, metadata)
}
