import fs from 'fs'
import path from 'path'

import Handler from '../src/handler'

function fixture (fileName: string): string {
  const filePath = path.join(__dirname, 'fixtures', fileName)

  return fs.readFileSync(filePath).toString()
}

describe('Handler', () => {
  let handler: Handler

  beforeEach(() => {
    process.env.FROM_EMAIL = 'test@example.com'
    process.env.NOTIFICATION_EMAIL = 'notify@example.com'
    process.env.PERSPECTIVE_KEY = 'test'
    process.env.SENDGRID_KEY = 'test'

    handler = new Handler(console)
  })

  afterEach(() => {
    delete process.env.FROM_EMAIL
    delete process.env.NOTIFICATION_EMAIL
    delete process.env.PERSPECTIVE_KEY
    delete process.env.SENDGRID_KEY
  })

  describe('stripEmailReply', () => {
    test('does not modify content with no blockquote', () => {
      let content = 'foo bar baz'

      expect(handler.stripEmailReply(content)).toBe(content)
    })

    test('leaves unaltered content that has no blockquote at the end', () => {
      let content = fixture('blockquote-at-beginning.md')

      expect(handler.stripEmailReply(content)).toBe(content)
    })

    test('strips any blockquote at the end of the content', () => {
      let content = fixture('email-comment.md')
      let stripped = fixture('stripped-email-comment.md')

      expect(handler.stripEmailReply(content).trim()).toBe(stripped.trim())
    })
  })
})
