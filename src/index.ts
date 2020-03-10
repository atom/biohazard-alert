import { Application } from 'probot'; // eslint-disable-line no-unused-vars

import Handler from './handler';

export = (app: Application) => {
  const handler = new Handler(app.log);

  app.log.debug('Install commit_comment handler');
  app.on('commit_comment', async context => {
    await handler.handle(context);
  });

  app.log.debug('Install issue_comment handler');
  app.on('issue_comment', async context => {
    await handler.handle(context);
  });

  app.log.debug('Install issues handler');
  app.on('issues', async context => {
    await handler.handle(context);
  });
};
