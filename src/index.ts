import { Application } from 'probot' // eslint-disable-line no-unused-vars

export = (app: Application) => {
  app.on('issue_comment', async (context) => {
    const commentText = context.payload.comment.body
  })
}
