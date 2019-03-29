import Analyzer from './analyzer'
import Octokit from '@octokit/rest'

const octokit = new Octokit()

interface HasBody {
  body: string
}

interface HasLogin {
  login: string
}

interface HasPrivate {
  private: boolean
}

interface HasTimestamps {
  created_at: Octokit.date
  updated_at: Octokit.date
}

interface HasType {
  type: string
}

interface HasUser {
  user: HasLogin & HasType
}

type IssueOrComment = HasBody & HasUser & HasTimestamps

export default class Cli {
  async run() {
    const [options, info] = await this.parseArguments()
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

    const {data: repo} = await octokit.repos.get({owner, repo: repoName})

    if (commentNumber) {
      const {data: comment} =
        await octokit.issues.getComment({owner, repo: repoName, comment_id: commentNumber})

      return this.eventInfo(comment, repo, 'issue_comment', uri)
    } else {
      const {data: issue} = await octokit.issues.get({owner, repo: repoName, number: issueNumber})

      return this.eventInfo(issue, repo, 'issues', uri)
    }
  }

  private action(timestamped: HasTimestamps): string {
    return timestamped.created_at === timestamped.updated_at ? 'created' : 'edited'
  }

  private eventInfo(item: IssueOrComment, repo: HasPrivate, eventName: string, uri: string): EventInfo {
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

  private isBot(user: HasType): boolean {
    return user.type !== 'User'
  }
}
