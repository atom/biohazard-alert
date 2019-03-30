import { Logger } from 'probot' // eslint-disable-line no-unused-vars
import * as request from 'request-promise-native'

import InvalidEnvironmentError from './invalid-environment-error'

/**
 * Analyzes text for toxicity and other attributes.
 *
 * Requires the `PERSPECTIVE_KEY` environment variable to be set with a Google API key that has
 * access to the Perspective API.
 */
export default class Analyzer {
  /** Perspective API URL */
  private apiUrl: string

  /** Length of a chunk of content when it needs to be broken up because it is too long */
  private chunkLength: number

  /** Probot logger */
  private log: Logger

  /** Maximum length of content that can be processed by the analysis API */
  private maxLength: number

  /** Amount of content to slice off that is less than the length of a chunk so they overlap */
  private sliceLength: number

  constructor (logger: Logger, maxLength = 3000) {
    if (!process.env.PERSPECTIVE_KEY) {
      throw new InvalidEnvironmentError('PERSPECTIVE_KEY')
    }

    const key = process.env.PERSPECTIVE_KEY

    this.apiUrl = `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${key}`
    this.log = logger

    this.maxLength = maxLength

    // Create some overlap in the chunks so that toxicity can't hide on borders between chunks
    const overlapLength = Math.floor(this.maxLength / 6)
    this.chunkLength = this.maxLength - overlapLength
    this.sliceLength = this.maxLength - (overlapLength * 2)
  }

  /**
   * Analyzes the event in `info` and returns a toxicity value in the range `[0,1]`.
   *
   * If the text in `info.content` is [too long](https://github.com/atom/biohazard-alert/issues/1):
   *
   * 1. The text is split into chunks
   * 2. Each chunk is analyzed separately
   * 3. The highest score for a chunk is returned as the score for the event
   */
  async analyze (info: EventInfo): Promise<number> {
    const chunks = this.split(info.content)
    const scores = await Promise.all(chunks.map(async chunk => {
      return this.analyzeChunk(info, chunk)
    }))

    this.log.debug(scores, `Toxicity values for chunks of ${info.source}`)

    return Math.max(...scores)
  }

  /**
   * Gets the raw analysis from the Perspective API.
   */
  async getAnalysis (info: EventInfo): Promise<Perspective.Response[]> {
    const chunks = this.split(info.content)

    return Promise.all(chunks.map(async chunk => {
      return this.getChunkAnalysis(info, chunk)
    }))
  }

  /**
   * Analyzes a chunk of the content and returns a toxicity value in the range `[0,1]`.
   */
  private async analyzeChunk (info: EventInfo, chunk: string): Promise<number> {
    const response = await this.getChunkAnalysis(info, chunk)

    return response.attributeScores.TOXICITY.summaryScore.value
  }

  /**
   * Gets the raw analysis of a chunk of content.
   */
  private async getChunkAnalysis (info: EventInfo, chunk: string): Promise<Perspective.Response> {
    const apiRequest = {
      url: this.apiUrl,
      body: {
        comment: {
          text: chunk
        },
        doNotStore: info.isRepoPrivate,
        requestedAttributes: {
          TOXICITY: {}
        }
      },
      json: true
    }

    this.log.debug(request, `Call Perspective API on ${info.source}`)
    const response = await (request.post(apiRequest) as unknown as Perspective.Response)
    this.log.debug(response, `Perspective API response for ${info.source}`)

    return response
  }

  /**
   * Splits `content` into an array of strings each short enough to be processed by the API.
   */
  private split (content: string): string[] {
    let chunks: string[] = []

    while (content.length > this.maxLength) {
      let chunk = content.slice(0, this.chunkLength)

      chunks.push(chunk)

      content = content.slice(this.sliceLength, -1)
    }

    chunks.push(content)

    return chunks
  }
}
