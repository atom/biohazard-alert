import * as CommonMark from 'commonmark'
import { Logger } from 'probot'
import mailer from '@sendgrid/mail'
import stripIndent from 'strip-indent'

import InvalidEnvironmentError from './invalid-environment-error'

/**
 * Sends notifications via Sendgrid to the configured email addresses.
 *
 * Requires the following environment variables to be set:
 *
 * * `FROM_EMAIL` -- Email address notifications will be sent from
 * * `NOTIFICATION_EMAIL` -- Email address notifications will be sent to
 * * `SENDGRID_KEY` -- API key for Sendgrid
 */
export default class Notifier {
  /** Email address notifications will be sent from */
  private fromEmail: string

  /** API key used to send emails */
  private key: string

  /** Probot logger */
  private log: Logger

  /** CommonMark reader used to parse Markdown */
  private reader: CommonMark.Parser

  /** Email address notifications will be sent to */
  private toEmail: string

  /** CommonMark writer used to render parsed Markdown into HTML */
  private writer: CommonMark.HtmlRenderer

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
    this.reader = new CommonMark.Parser()
    this.toEmail = process.env.NOTIFICATION_EMAIL
    this.writer = new CommonMark.HtmlRenderer({safe: true, smart: true})

    mailer.setApiKey(this.key)
  }

  /**
   * Sends a notification of the `score` ascribed to `info` to the notification email address.
   */
  async notify(info: EventInfo, score: number): Promise<void> {
    this.log.debug(info, `Notify subscribers of score ${score} on ${info.source}`)

    const text = `
## Biohazard Alert

${this.sourceLink(info)} by ${this.authorLink(info)} was found
with a toxicity of ${score}. Please investigate!

Original text follows:

-----

${info.content}
    `

    await this.sendMail(text)
  }

  /**
   * Sends a notification of an `error` that occurred analyzing the event in `info` to the
   * notification email address.
   */
  async notifyError(info: EventInfo, error: string, fullError: string): Promise<void> {
    this.log.debug(info, `Notify subscribers of error on ${info.source}`)

    const text = `
## Biohazard Alert Analysis Error

An error occurred when analyzing ${this.sourceLink(info)} by ${this.authorLink(info)}:
\`${error}\`

Full error and original text follows:

-----

\`\`\`
${fullError}
\`\`\`

-----

${info.content}
    `

    await this.sendMail(text, 'Biohazard Alert: Error during analysis')
  }

  private authorLink(info: EventInfo): string {
    return `[${info.author}](https://github.com/${info.author})`
  }

  private toHtml(text: string): string {
    const parsed = this.reader.parse(text)

    return this.writer.render(parsed)
  }

  private async sendMail(text: string, subject = 'Biohazard Alert!') {
    const html = this.toHtml(stripIndent(text))

    const msg = {
      to: this.toEmail,
      from: this.fromEmail,
      subject: subject,
      text: text,
      html: html,
      tracking_settings: {
        click_tracking: {
          enable: false
        }
      }
    }

    this.log.info(`Send notification from ${this.fromEmail} to ${this.toEmail}`)
    await mailer.send(msg)
  }

  private sourceLink(info: EventInfo): string {
    switch (info.event) {
      case 'commit_comment':
        return `[A code comment](${info.source})`

      case 'issues':
        return `[An issue](${info.source})`

      case 'issue_comment':
        return `[A comment](${info.source})`

      default:
        return info.source
    }
  }
}
