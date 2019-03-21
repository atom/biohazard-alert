import { Logger } from 'probot'
import * as request from 'request-promise-native'

import InvalidEnvironmentError from './invalid-environment-error'

/**
 * Analyzes text for toxicity and other attributes.
 *
 * Requires the `PERSPECTIVE_KEY` environment variable to be set with a Google API key that has
 * access to the Perspective API.
 */
export default class Analyzer {
  private apiUrl: string
  private log: Logger

  constructor(logger: Logger) {
    if (!process.env.PERSPECTIVE_KEY) {
      throw new InvalidEnvironmentError('PERSPECTIVE_KEY')
    }

    const key = process.env.PERSPECTIVE_KEY

    this.apiUrl = `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${key}`
    this.log = logger
  }

  async analyze(source: string, content: string): Promise<number> {
    const apiRequest = {
      url: this.apiUrl,
      body: {
        comment: {
          text: content
        },
        requestedAttributes: {
          TOXICITY: {}
        }
      },
      json: true
    }

    this.log.debug(`Call Perspective API on ${source}`)
    const response = await (request.post(apiRequest) as any)
    this.log.debug(response, `Perspective API response for ${source}`)

    return response.attributeScores.TOXICITY.summaryScore.value
  }
}
