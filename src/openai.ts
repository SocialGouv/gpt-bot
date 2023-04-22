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
      model: "gpt-3.5-turbo",
    })

    const { content } =
      completion.data.choices[0].message || ({} as ChatCompletionRequestMessage)

    return content
  }
}

// export default class OpenAI {
//   client: OpenAIApi
//   clientConfig: Record<string, unknown>

//   constructor() {
//     this.clientConfig = {
//       apiKey: process.env.OPENAI_API_KEY,
//       organization: process.env.OPENAI_API_ORG_ID,
//     }

//     const configuration = new Configuration(this.clientConfig)

//     this.client = new OpenAIApi(configuration)
//   }

//   async request(messages: ChatCompletionRequestMessage[]): Promise<string> {
//     const completion = await this.client.createChatCompletion({
//       messages,
//       model: "gpt-3.5-turbo",
//     })

//     const { content } =
//       completion.data.choices[0].message || ({} as ChatCompletionRequestMessage)

//     return content
//   }
// }
