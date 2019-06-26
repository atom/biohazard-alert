export default class InvalidEnvironmentError extends Error {
  constructor(envVar: string) {
    super(`${envVar} environment variable must be defined`);
  }
}
