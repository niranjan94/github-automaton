/**
 * Typing for the env object for easy use within the project
 */
interface process {
  env: {
    PORT?: Number,
    BOT_USERNAME: String,
    BOT_ID: String,
    KEY_FILE_NAME?: String,
    GITHUB_SECRET: String,
    MONGODB_URI: String,
    USER_AGENT: String,
    BASE64_PRIVATE_KEY?: String
  }
}