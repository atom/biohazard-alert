import { Application } from 'probot' // eslint-disable-line no-unused-vars
import * as request from 'request-promise-native'

const perspectiveKey = process.env.PERSPECTIVE_KEY
const perspectiveApiUrl =
  `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${perspectiveKey}`

export = (app: Application) => {
  app.log.debug('Install issue_comment handler')

  app.on('issue_comment', async (context) => {
    const commentUrl = context.payload.comment.html_url
    const commentText = context.payload.comment.body
    const perspectiveRequest = {
      url: perspectiveApiUrl,
      body: {
        comment: {
          text: commentText
        },
        languages: ['en'],
        requestedAttributes: {
          TOXICITY: {}
        }
      },
      json: true
    }

    app.log.debug(`Call Perspective API on ${commentUrl}`)
    const perspectiveResponse = await (request.post(perspectiveRequest) as any)
    app.log.debug(perspectiveResponse, `Perspective API response for ${commentUrl}`)

    const score = perspectiveResponse.attributeScores.TOXICITY.summaryScore.value

    app.log.info(`Toxicity score ${score} for ${commentUrl}`)
  })
}
