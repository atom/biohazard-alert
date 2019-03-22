/**
 * Information about the event to be analyzed.
 */
interface EventInfo {
  /** GitHub username of the author of the event */
  author: string

  /** Markdown text content to be analyzed from the event */
  content: string

  /** GitHub webhook event name */
  event: string

  /** Probot-style full event name */
  fullEvent: string

  /** Indicates whether or not the repo the event occurred on is private */
  isRepoPrivate: boolean

  /** URI of the event */
  source: string
}
