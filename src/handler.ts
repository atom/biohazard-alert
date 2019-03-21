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
    const source = context.payload.comment.html_url

    // Don't process deleted comments
    if (context.payload.action === 'deleted') {
      this.log.info(`Skipping deleted comment ${source}`)

      return
    }

    // Don't process comments in private repositories
    if (context.payload.repository.private && config.skipPrivateRepos) {
      this.log.info(`Skipping comment in private repository ${source}`)

      return
    }

    const content = context.payload.comment.body

    let score = 0

    try {
      score = await this.analyzer.analyze(source, content)
    } catch (e) {
      this.notifier.notifyError(source, content, e.error.error.message, e.message)

      throw e
    }

    this.log.info(`Toxicity score ${score} for ${source}`)

    if (score > config.toxicityThreshold) {
      this.notifier.notify(source, content, score)
    }
  }
}
