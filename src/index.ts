import * as dotenv from "dotenv"
dotenv.config()

import { Model } from "@chewam/mozart"
import { SearchEngine } from "@chewam/mozart/dist/tools"
import type { ChatCompletionRequestMessage } from "openai"
import { UrlScraper } from "./tools/scrapper"

import Mattermost from "./mattermost"

const mattermost = new Mattermost()

// const SYSTEM_PROMPT = `You are a helpful Mattermost bot named ${mattermost.bot.name} who provides succinct answers in Markdown format.
// When responding to a user you must respect the following rules:
//   - You must use the informal "you" instead of the formal "you".
//   - You must only answer questions about la Fabrique Numérique des ministères sociaux. If the topic of the question is not about la Fabrique Numérique des ministères sociaux, tell the user that you cannot answer his question.
//   - When you miss information about la Fabrique Numérique des ministères sociaux, use the provided tools to gather the needed information without asking the user for permission.
//   - When you mention la Fabrique Numérique des ministères sociaux, just use la Fabrique Numérique or la Fabrique instead to make it shorter.
//   - You must use line breaks to improve readability.
//   - When you are added to a channel and only when you are added to a channel:
//     - you must give your greetings to the users of the channel
//     - you must thank the person who added you
//     - you must introduce yourself explaining what kind of help you can provide
//     - you must explain that to interact with you in this channel, a user must prefix their messages with ${mattermost.bot.name}
//     - you must give a message example to interact with you, in Markdown format`

const SYSTEM_PROMPT = `Hello ChatGPT, I want you to act as a Mattermost bot that provides information about the Fabrique Numérique des ministères sociaux in France, using a set of provided tools.

When responding to users, follow these rules:
1. Address users informally by using "tu" instead of "vous".
2. Only answer questions related to the Fabrique Numérique des ministères sociaux. If the question's subject is unrelated, inform the user that you cannot answer the question.
3. Before answering questions use the provided tools, such as the 'UrlScraper' or the 'SearchEngine', to gather the necessary information about the Fabrique Numérique des ministères sociaux
4. Prefer using shorter forms of "la Fabrique Numérique des ministères sociaux" such as "la Fabrique Numérique" or "la Fabrique".
5. Use line breaks to improve readability.

When you are added to a channel and only when you are added to a channel:
a. Greet the channel's users.
b. Thank the person who added you.
c. Introduce yourself by explaining the type of help you can provide, mention the available tools, and how to use them.
d. Explain that to interact with you on the channel, users must prefix their messages with ${mattermost.bot.name}.
e. Provide an example message to interact with you, in Markdown format."
`

const TOOLKIT_PREFIX = "Tools available:"

const TOOLKIT_SUFFIX = `When using the provided tools:
a. Use the tools as many times as needed to find the final answer to the question.
b. When using a tool, only send the required input for the tool as a message, do not send any additional text before or after the required input for the tool.
c. Try the provided tools before considering that they cannot be useful.
d. Never ask the user for permission to use the tools, and never ask the user how to use the tools. Simply use the tools in the way you deem correct until you obtain the final answer. If you consider that the provided tools are not helpful, give a reason.`

// const TRAINING_DATA = [
//   { role: "user", content: "gptbot a été ajouté au canal par gary." },
//   {
//     role: "assistant",
//     content: `Bonjour à tous!
// Je voudrais remercier gary de m'avoir ajouté à ce canal :)
// Je suis un bot utile pour répondre à toutes vos questions sur la Fabrique Numérique.
// N'hésitez pas à me demander de l'aide en préfixant vos messages avec ${mattermost.bot.name}.
// Par exemple, vous pouvez me demander: ${mattermost.bot.name} Qu'est-ce que la Fabrique Numérique?`,
//   },
//   { role: "user", content: `${mattermost.bot.name} Bonjour !` },
//   {
//     role: "assistant",
//     content: `Salut!
//     Comment puis-je t'aider au sujet de la Fabrique Numérique aujourd'hui ?`,
//   },
//   {
//     role: "user",
//     content: `${mattermost.bot.name} Qui est le chef de la Fabrique ?`,
//   },
//   {
//     role: "assistant",
//     content:
//       '{ "tool": "search-engine", "input": "Qui dirige la Fabrique Numérique des ministères sociaux? "}',
//   },
//   {
//     role: "user",
//     content:
//       '{ "tool": "search-engine", "input": "Qui dirige la Fabrique Numérique des ministères sociaux?", "output": "Yann-Fanch MADAULE - Chef de mission Fabrique Numérique des Ministères Sociaux - Ministère des Affaires sociales et de la Santé | LinkedIn."}',
//   },
//   {
//     role: "assistant",
//     content:
//       "Après avoir effectué une recherche sur Google, les informations les plus récentes que j'ai trouvées indiquent que La Fabrique Numérique est dirigée par un responsable nommé Yann-Fanch Madaule.",
//   },
// ]

const model = new Model({
  model: "gpt-3.5-turbo",
  tools: [new UrlScraper(), new SearchEngine()],
  toolkitConfig: {
    prefix: TOOLKIT_PREFIX,
    suffix: TOOLKIT_SUFFIX,
  },
})

mattermost.onMessages = async (
  post: Record<string, unknown>,
  history: ChatCompletionRequestMessage[],
  message?: string
) => {
  // console.log("system:", system)
  console.log("Mattermost history:", history)
  console.log("Mattermost message:", message)

  const { content: response } = await model.use({
    message,
    system: SYSTEM_PROMPT,
    history,
    // history: [...TRAINING_DATA, ...history] as ChatCompletionRequestMessage[],
  })
  console.log("OpenAI system:", model.prompt.system)
  console.log("OpenAI history:", model.prompt.history)
  console.log("OpenAI response:", response)
  await mattermost.send(response, post)
}
