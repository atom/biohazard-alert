import { Application } from 'probot' // eslint-disable-line no-unused-vars

import Analyzer from './analyzer'
import Notifier from './notifier'

export = (app: Application) => {
  const analyzer = new Analyzer(app.log)
  const notifier = new Notifier(app.log)

  app.log.debug('Install issue_comment handler')

  app.on('issue_comment', async (context) => {
    const source = context.payload.comment.html_url

    // Don't process deleted comments
    if (context.payload.action === 'deleted') {
      app.log.info(`Skipping deleted comment ${source}`)

      return
    }

    // Don't process comments in private repositories
    if (context.payload.repository.private) {
      app.log.info(`Skipping comment in private repository ${source}`)

      return
    }

    const content = context.payload.comment.body

    let score = 0

    try {
      score = await analyzer.analyze(source, content)
    } catch (e) {
      notifier.notifyError(source, content, e.error.error.message, e.message)

      throw e
    }

    app.log.info(`Toxicity score ${score} for ${source}`)

    if (score > 0.8) {
      notifier.notify(source, content, score)
    }
  })
}
