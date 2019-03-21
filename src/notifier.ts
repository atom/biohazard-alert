import * as commonmark from 'commonmark'
import { Logger } from 'probot'
import mailer from '@sendgrid/mail'
import stripIndent from 'strip-indent'

import InvalidEnvironmentError from './invalid-environment-error'

export default class Notifier {
  /** Email address notifications will be sent from */
  private fromEmail: string

  /** API key used to send emails */
  private key: string

  /** Probot logger */
  private log: Logger

  /** Email address notifications will be sent to */
  private toEmail: string

  constructor(logger: Logger) {
    if (!process.env.FROM_EMAIL) {
      throw new InvalidEnvironmentError('FROM_EMAIL')
    }

    if (!process.env.NOTIFICATION_EMAIL) {
      throw new InvalidEnvironmentError('NOTIFICATION_EMAIL')
    }

    if (!process.env.SENDGRID_KEY) {
      throw new InvalidEnvironmentError('SENDGRID_KEY')
    }

    this.fromEmail = process.env.FROM_EMAIL
    this.key = process.env.SENDGRID_KEY
    this.log = logger
    this.toEmail = process.env.NOTIFICATION_EMAIL

    mailer.setApiKey(this.key)
  }

  async notify(sourceUrl: string, content: string, score: number): Promise<void> {
    this.log.debug(`Notify subscribers of score ${score} on ${sourceUrl}`)

    const text = stripIndent(`
      ## Biohazard Alert

      [A comment](${sourceUrl}) was found with a toxicity of ${score}. Please investigate!

      Original text follows:

      -----

      ${content}
    `)

    await this.sendMail(text)
  }

  private toHtml(text: string): string {
    const reader = new commonmark.Parser()
    const writer = new commonmark.HtmlRenderer({safe: true, smart: true})

    const parsed = reader.parse(text)

    return writer.render(parsed)
  }

  private async sendMail(text: string) {
    const html = this.toHtml(text)

    const msg = {
      to: this.toEmail,
      from: this.fromEmail,
      subject: 'Biohazard Alert!',
      text: text,
      html: html
    }

    this.log.info(`Send notification from ${this.fromEmail} to ${this.toEmail}`)
    await mailer.send(msg)
  }
}
