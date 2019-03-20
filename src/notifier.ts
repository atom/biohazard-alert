import { Logger } from 'probot'

export default class Notifier {
  log: Logger

  constructor(logger: Logger) {
    this.log = logger
  }

  async notify(sourceUrl: string, content: string, score: number): Promise<void> {
    this.log.debug(`Notify subscribers of score ${score} on ${sourceUrl}`)
  }
}
