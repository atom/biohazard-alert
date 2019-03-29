import Analyzer from './analyzer'
import Octokit from '@octokit/rest'

type IssueOrComment = Octokit.IssuesGetResponse | Octokit.IssuesGetCommentResponse
type Repo = Octokit.ReposGetResponse
type User = Octokit.IssuesGetResponseUser | Octokit.IssuesGetCommentResponseUser

export default class Cli {
  private octokit: Octokit

  constructor() {
    this.octokit = new Octokit()
  }

  async run() {
    const [options, info] = await this.parseArguments()
  }

  private action(item: IssueOrComment): string {
    return item.created_at === item.updated_at ? 'created' : 'edited'
  }

  private eventInfo(item: IssueOrComment, repo: Repo, eventName: string, uri: string): EventInfo {
    return {
      author: item.user.login,
      isBot: this.isBot(item.user),
      event: eventName,
      fullEvent: this.fullEvent(eventName, this.action(item)),
      isRepoPrivate: repo.private,
      source: uri,
      content: item.body
    }
  }

  private fullEvent(event: string, action: string): string {
    return `${event}.${action}`
  }

  private isBot(user: User): boolean {
    return user.type !== 'User'
  }

  private async parseArguments(): Promise<[object, EventInfo]> {
    const options = require('yargs')
    const info = await this.parseUri(options._)

    return [options, info]
  }

  private async parseUri(args: string[]): Promise<EventInfo> {
    const uriPattern =
      /^https:\/\/github.com\/([^/]+)\/([^/]+)\/issues\/(\d+)(#issuecomment-(\d+))?$/
    const uri = args[0]

    const match = uriPattern.exec(uri)
    if (!match) {
      throw new Error(`Invalid URI: ${uri}`)
    }

    const owner = match[1]
    const repoName = match[2]
    const issueNumber = Number(match[3])
    const commentNumber = Number(match[5])

    const {data: repo} = await this.octokit.repos.get({owner, repo: repoName})

    if (commentNumber) {
      const {data: comment} =
        await this.octokit.issues.getComment({owner, repo: repoName, comment_id: commentNumber})

      return this.eventInfo(comment, repo, 'issue_comment', uri)
    } else {
      const {data: issue} =
        await this.octokit.issues.get({owner, repo: repoName, number: issueNumber})

      return this.eventInfo(issue, repo, 'issues', uri)
    }
  }
}
