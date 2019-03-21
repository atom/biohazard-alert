import { Application } from 'probot' // eslint-disable-line no-unused-vars

import Notifier from './notifier'
import SentimentAnalyzer from './sentiment-analyzer'

export = (app: Application) => {
  const analyzer = new SentimentAnalyzer(app.log)
  const notifier = new Notifier(app.log)

  app.log.debug('Install issue_comment handler')

  app.on('issue_comment', async (context) => {
    // Don't process deleted comments
    if (context.payload.action === 'deleted') {
      return
    }

    // Don't process comments in private repositories
    if (context.payload.repository.private) {
      return
    }

    const commentUrl = context.payload.comment.html_url
    const commentText = context.payload.comment.body
    const score = await analyzer.analyze(commentUrl, commentText)

    app.log.info(`Toxicity score ${score} for ${commentUrl}`)

    if (score > 0.8) {
      notifier.notify(commentUrl, commentText, score)
    }
  })
}
