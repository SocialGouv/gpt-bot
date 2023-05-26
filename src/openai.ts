import {
  OpenAIApi,
  Configuration,
  type ChatCompletionRequestMessage,
} from "openai"

export default class OpenAI extends OpenAIApi {
  constructor() {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_API_ORG_ID,
    })
    super(configuration)
  }

  async request(messages: ChatCompletionRequestMessage[]): Promise<string> {
    const completion = await this.createChatCompletion({
      messages,
      model: "gpt-4",
    })

    const { content } =
      completion.data.choices[0].message || ({} as ChatCompletionRequestMessage)

    return content
  }
}
