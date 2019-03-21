import { Logger } from 'probot'
import * as request from 'request-promise-native'

export default class Analyzer {
  private apiUrl: string
  private log: Logger

  constructor(logger: Logger) {
    const key = process.env.PERSPECTIVE_KEY

    this.apiUrl = `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${key}`
    this.log = logger
  }

  async analyze(sourceUrl: string, content: string): Promise<number> {
    const apiRequest = {
      url: this.apiUrl,
      body: {
        comment: {
          text: content
        },
        languages: ['en'],
        requestedAttributes: {
          TOXICITY: {}
        }
      },
      json: true
    }

    this.log.debug(`Call Perspective API on ${sourceUrl}`)
    const response = await (request.post(apiRequest) as any)
    this.log.debug(response, `Perspective API response for ${sourceUrl}`)

    return response.attributeScores.TOXICITY.summaryScore.value
  }
}
