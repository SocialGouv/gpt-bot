import { Client4 } from "@mattermost/client"

export default class HTTPClient extends Client4 {
  constructor({ url, token }: { url: string; token: string }) {
    super()
    this.setUrl(url)
    this.setToken(token)
  }
}
