const GitHubApi = require("github");

export default new GitHubApi({
    debug: true,
    protocol: "https",
    headers: {
        "user-agent": process.env.USER_AGENT
    },
});