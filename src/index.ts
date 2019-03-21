import { Application } from 'probot' // eslint-disable-line no-unused-vars

import Handler from './handler'

export = (app: Application) => {
  const handler = new Handler(app.log)

  app.log.debug('Install issue_comment handler')

  app.on('issue_comment', async (context) => {
    handler.handle(context)
  })
}
