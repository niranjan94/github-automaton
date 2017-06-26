/**
 * Typing for the env object for easy use within the project
 */
interface process {
  env: {
    PORT?: number,
    BOT_USERNAME: string,
    BOT_ID: string,
    KEY_FILE_NAME?: string,
    GITHUB_SECRET: string,
    MONGODB_URI: string,
    USER_AGENT: string,
    BASE64_PRIVATE_KEY?: string,
    STANDARD_REVIEWERS?: string
  }
}