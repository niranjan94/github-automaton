const GitHubApi = require("github");

const options = {
    debug: true,
    protocol: "https",
    headers: {
        "user-agent": process.env.USER_AGENT
    }
};

/**
 * Initialize the github API client
 */
export const github = new GitHubApi(options);

export const createInstance = function () {
    return new GitHubApi(options);
};