import * as stripIndent from 'common-tags/lib/stripIndent';

export default {
  greeting(username: string): string {
    return `Hi @${username}!`;
  },
  needsInfo(): string {
    return stripIndent`
            Looks like you're missing some information we'll need to replicate this issue.
            
            The easier it is for us to decipher an issue with the info provided,
            the more likely it is that we'll be able to help.
            
            Please make sure you have the following information in this issue:
            
            1. The current (incorrect) behavior you're seeing
            2. The behavior you expect
            3. The browser & OS you use
            4. A [short, self-contained example](http://sscce.org/)
        `;
  },
  unlinkedPullRequest(): string {
    return stripIndent`
            Looks like you haven't linked this to any issue. 
            It would be great if you could follow the best practices and link your PR with the correct issue :)
        `;
  },
  pullRequestWithoutDeploymentLink(): string {
    return stripIndent`
            I'm unable to find a deployment link for this PR. 
            Did you forget to add one ? ;)
        `;
  },
  buildFailed(): string {
    return stripIndent`
            It looks like one or more of your builds have failed.
            I\'ve added the relevant info below to save you some time.\n
        `;
  },
  buildFailureItem(buildNumber: string, owner: string, repo: string, id: string): string {
    return stripIndent`
            - [Build ${buildNumber}](https://travis-ci.org/${owner}/${repo}/jobs/${id}) has \`failed\`
        `;
  },
  movedIssueBody(user, originalIssueUrl, originalIssueBody): string {
    return stripIndent`
            ###### Original issue submitted by @${user} in ${originalIssueUrl}\n---\n${originalIssueBody}
        `;
  },
  issueMovedComment(newIssueUrl: string): string {
    return stripIndent`
            I've [moved your issue](${newIssueUrl}) to the correct repository.
            Please make sure to keep an eye on the new issue for the latest information.
        `;
  },
  closedWithoutMerging(): string {
    return stripIndent`
            Looks like this PR was closed without merging. 
            Please try not to make test/temporary PRs :) Keeps the repo clean.
        `;
  },
  prHasConflicts(): string {
    return stripIndent`
            Looks like your PR has some conflicts. :worried:
            Could you resolve them and rebase on top of the latest upstream code ?
        `;
  },
  prCannotBeRebased(): string {
    return stripIndent`
            Looks like your PR is behind the upstream
            Could you rebase it on top of the latest upstream code ?
        `;
  }

};