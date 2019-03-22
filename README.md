# biohazard-alert

> A GitHub App built with [Probot](https://github.com/probot/probot) to deliver notifications of toxic comments

## Description

Listens for new or edited issues, pull requests, or comments. It sends the content of those events to a semantic analysis API that can rate the toxicity of the content. If the toxicity is rated above a threshold, a notification email is sent.

## Configuration

This Probot app reads its configuration from two files:

* **Global settings:** `.github` repository under the user or organization it is installed in from the `.github/biohazard-alert.yml` file
* **Repo-specific settings:** `.github/biohazard-alert.yml` file

Configuration settings are:

* `skipPrivateRepos`: `true` means that events from private repositories will be ignored (**default** `true`)
* `toxicityThreshold`: Toxicity ratings higher than this number will generate notifications (**default** `0.8`)

## Development

```sh
# Install dependencies
npm install

# Build the app
npm run build

# Run the bot locally
npm run dev
```

## License

[MIT](LICENSE.md)
