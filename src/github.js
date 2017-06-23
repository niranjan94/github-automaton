const GitHubApi = require("github");

/**
 * Initialize the github API client
 */
export default new GitHubApi({
    debug: true,
    protocol: "https",
    headers: {
        "user-agent": process.env.USER_AGENT
    },
});