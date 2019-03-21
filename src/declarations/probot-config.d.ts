interface Config {
  skipPrivateRepos: boolean
}

function getConfig(context: Context, filename: string): Config
