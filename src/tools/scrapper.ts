import * as puppeteer from "puppeteer"
import TurndownService from "turndown"
import { BaseTool } from "@chewam/mozart/dist/tools"

export class UrlScraper extends BaseTool {
  constructor() {
    const name = "url-scraper"
    const description = `- UrlScraper:
  - description:
    A tool to scrape web pages.
    Useful when you need to browse websites to find fresh information about any topic.
    It takes a single JSON object as an input and returns a single JSON object as an output
  - input: { "tool": "url-scraper", "input": <url> }
  - ouput: { "tool": "url-scraper", "input": <url>, "output": <the page content in Markdown format> }
    `
    super({ name, description })
  }

  async run(url: string): Promise<string> {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: "networkidle2" })

    const content = await page.evaluate(() => {
      return document.documentElement.innerHTML
    })

    const turndownService = new TurndownService()
    const markdown = turndownService.turndown(content)

    await browser.close()
    console.log("\n\n\n******* MARKDOWN: *********\n", markdown, "\n\n\n\n\n")
    return markdown
  }
}
