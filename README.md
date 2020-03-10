# biohazard-alert

> A GitHub App built with [Probot](https://github.com/probot/probot) to deliver notifications of toxic comments

## Description

Listens for new or edited issues, pull requests, or comments. It sends the content of those events to a semantic analysis API that can rate the content on multiple sentiment axes. If the content is rated above a threshold on any axis, a notification email is sent to humans to investigate and decide whether to take action.

## Configuration

This Probot app reads its configuration from two files:

* **Global settings:** `.github` repository under the user or organization it is installed in from the `.github/biohazard-alert.yml` file
* **Repo-specific settings:** `.github/biohazard-alert.yml` file

Configuration settings are:

* `notifyOnError`: `true` means that notifications are generated when errors are encountered (**default** `true`)
* `skipPrivateRepos`: `true` means that events from private repositories will be ignored (**default** `true`)
* `threshold`: Analysis ratings higher than this number will generate notifications (**default** `0.8`)

## Analysis

This app uses [Google's Perspective API](https://www.perspectiveapi.com/#/) to analyze the content using the following [models](https://github.com/conversationai/perspectiveapi/blob/master/api_reference.md#models):

* `TOXICITY`
* `SEVERE_TOXICITY`
* `IDENTITY_ATTACK`
* `INSULT`
* `PROFANITY`
* `THREAT`
* `SEXUALLY_EXPLICIT`
* `FLIRTATION`
* `UNSUBSTANTIAL`

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
