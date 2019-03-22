import { Context, Logger } from 'probot'

import Analyzer from './analyzer'
import Notifier from './notifier'

interface Config {
  skipPrivateRepos: boolean
  toxicityThreshold: number
}

type GetConfig = (context: Context, filename: string, defaults: Config) => Config

const getConfig = require('probot-config') as GetConfig

const defaults = {
  skipPrivateRepos: true,
  toxicityThreshold: 0.8
}

interface HandlerInfo {
  content: string
  event: string
  isRepoPrivate: boolean
  source: string
}

export default class Handler {
  private analyzer: Analyzer

  private log: Logger

  private notifier: Notifier

  constructor(logger: Logger) {
    this.analyzer = new Analyzer(logger)
    this.log = logger
    this.notifier = new Notifier(logger)
  }

  async handle(context: Context): Promise<void> {
    const config = await getConfig(context, 'biohazard-alert.yml', defaults)
    const info = this.parseContext(context)

    // Don't process events that we don't know how to parse
    if (!info) {
      return
    }

    // Don't process comments in private repositories
    if (info.isRepoPrivate && config.skipPrivateRepos) {
      this.log.info(`Skipping comment in private repository ${info.source}`)

      return
    }

    let score = 0

    try {
      score = await this.analyzer.analyze(info.source, info.content)
    } catch (e) {
      this.notifier.notifyError(info.source, info.content, e.error.error.message, e.message)

      throw e
    }

    this.log.info(`Toxicity score ${score} for ${info.source}`)

    if (score > config.toxicityThreshold) {
      this.notifier.notify(info.source, info.content, score)
    }
  }

  private parseContext(context: Context): HandlerInfo | null {
    const fullEvent = `${context.event}.${context.payload.action}`

    switch (fullEvent) {
      case 'issue_comment.created':
      case 'issue_comment.edited':
        return {
          event: context.event,
          isRepoPrivate: context.payload.repository.private,
          source: context.payload.comment.html_url,
          content: context.payload.comment.body
        }

      default: {
        this.log.info(`Skipping unhandleable event: ${fullEvent}`)

        return null
      }
    }
  }
}
