const stripIndent = require('common-tags/lib/stripIndent');

export default {
    greeting(username) {
        return `Hi @${username}!`
    },
    needsInfo() {
        return stripIndent`
            Looks like you're missing some information we'll need to replicate this issue.
            
            The easier it is for us to decipher an issue with the info provided,
            the more likely it is that we'll be able to help.
            
            Please make sure you have the following information in this issue:
            
            1. The current (incorrect) behavior you're seeing
            2. The behavior you expect
            3. The browser & OS you use
            4. A [short, self-contained example](http://sscce.org/)
        `
    },
    unlinkedPullRequest() {
        return stripIndent`
            Looks like you haven't linked this to any issue. 
            It would be great if you could follow the best practices and link your PR with the correct issue :)
        `
    },
    pullRequestWithoutDeploymentLink() {
        return stripIndent`
            I'm unable to find a deployment link for this PR. 
            Did you forget to add one ? ;)
        `
    },
    buildFailed(failureItemsText) {
        return stripIndent`
            It looks like one or more of your builds have failed.
            I\'ve copied the relevant info below to save you some time.\n\n${failureItemsText}
        `
    },
    movedIssueBody(user, originalIssueUrl, originalIssueBody) {
        return stripIndent`
            ###### Original issue submitted by @${user} in ${originalIssueUrl}\n---\n${originalIssueBody}
        `
    },
    issueMovedComment(newIssueUrl) {
        return stripIndent`
            I've [moved your issue](${newIssueUrl}) to the correct repository.
            Please make sure to keep an eye on the new issue for the latest information.
        `
    }
};