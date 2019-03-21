import { HtmlRenderer, Parser} from 'commonmark'
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

  /** Commonmark reader used to render Markdown */
  private reader: Parser

  /** Email address notifications will be sent to */
  private toEmail: string

  /** Commonmark writer used to render Markdown */
  private writer: HtmlRenderer

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
    this.reader = new Parser()
    this.toEmail = process.env.NOTIFICATION_EMAIL
    this.writer = new HtmlRenderer({safe: true, smart: true})

    mailer.setApiKey(this.key)
  }

  async notify(source: string, content: string, score: number): Promise<void> {
    this.log.debug(`Notify subscribers of score ${score} on ${source}`)

    const text = `
      ## Biohazard Alert

      [A comment](${source}) was found with a toxicity of ${score}. Please investigate!

      Original text follows:

      -----

      ${content}
    `

    await this.sendMail(text)
  }

  async notifyError(source: string, content: string, error: string, fullError: string): Promise<void> {
    this.log.debug(`Notify subscribers of error on ${source}`)

    const text = `
      ## Biohazard Alert Analysis Error

      An error occurred when analyzing [a comment](${source}): \`${error}\`

      Full error and original text follows:

      -----

      \`\`\`
      ${fullError}
      \`\`\`

      -----

      ${content}
    `

    await this.sendMail(text, 'Biohazard Alert: Error during analysis')
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
      html: html
    }

    this.log.info(`Send notification from ${this.fromEmail} to ${this.toEmail}`)
    await mailer.send(msg)
  }
}
