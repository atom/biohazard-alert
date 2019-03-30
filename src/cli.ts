import Octokit from '@octokit/rest'

import Analyzer from './analyzer'

type IssueOrComment = Octokit.IssuesGetResponse | Octokit.IssuesGetCommentResponse
type Repo = Octokit.ReposGetResponse
type User = Octokit.IssuesGetResponseUser | Octokit.IssuesGetCommentResponseUser

// Disable Probot logging
const logger = {
  debug: () => {},
  info: () => {}
}

/**
 * Command-line interface for the analysis API.
 */
export default class Cli {
  /** Access to the analysis API */
  private analyzer: Analyzer

  /** Access to the GitHub API */
  private octokit: Octokit

  constructor () {
    this.octokit = new Octokit()
    this.analyzer = new Analyzer(logger)
  }

  /**
   * Execute the command according to the arguments passed on the command line.
   */
  async run () {
    try {
      const [options, info] = await this.parseArguments() // eslint-disable-line no-unused-vars

      const analysis = await this.analyzer.getAnalysis(info)
      analysis.forEach(report => {
        console.log(JSON.stringify(report, null, 2))
      })
    } catch (e) {
      console.error(e)
    }
  }

  private action (item: IssueOrComment): string {
    return item.created_at === item.updated_at ? 'created' : 'edited'
  }

  private eventInfo (item: IssueOrComment, repo: Repo, eventName: string, uri: string): EventInfo {
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

  private fullEvent (event: string, action: string): string {
    return `${event}.${action}`
  }

  private isBot (user: User): boolean {
    return user.type !== 'User'
  }

  private async parseArguments (): Promise<[object, EventInfo]> {
    const options = require('yargs').argv
    const info = await this.parseUri(options._)

    return [options, info]
  }

  private async parseUri (args: string[]): Promise<EventInfo> {
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

    const { data: repo } = await this.octokit.repos.get({ owner, repo: repoName })

    if (commentNumber) {
      const { data: comment } =
        await this.octokit.issues.getComment({ owner, repo: repoName, comment_id: commentNumber })

      return this.eventInfo(comment, repo, 'issue_comment', uri)
    } else {
      const { data: issue } =
        await this.octokit.issues.get({ owner, repo: repoName, number: issueNumber })

      return this.eventInfo(issue, repo, 'issues', uri)
    }
  }
}
