import github from '../github'
import Parser from '../parser'
import messages from '../messages/load'

/**
 * All hook handlers should extend this
 */
export default class {

    /**
     * Hook payload
     *
     * @param payload
     */
    constructor(payload) {
        this.payload = new Parser(payload);
        this.commentQueue = [];
    }

    /**
     * Create a handler instance and handle the webhook
     */
    create() {
        this.payload.token.then((token) => {
            github.authenticate({
                type: "token",
                token: token,
            });
            this.handle();
        })
    }

    /**
     * Get the primary payload (Pull request or issue or label or comment)
     *
     * @param target
     * @return {*}
     */
    getInnerPayload(target = null) {
        if (target === 'pull_request' || (! target && this.payload.hasOwnProperty('pull_request'))) {
            // All PRs are issues and some functions are shared with the issue API.
            return { innerPayload: this.payload.pull_request, githubTarget: (!target ? github.issues : github.pullRequests) };
        } else if (target === 'issue' || (! target && this.payload.hasOwnProperty('issue'))) {
            return { innerPayload: this.payload.issue, githubTarget: github.issues };
        } else if (target === 'label' || (! target && this.payload.hasOwnProperty('label'))) {
            return { innerPayload: this.payload.label, githubTarget: github.issues };
        } else if (target === 'comment' || (! target && this.payload.hasOwnProperty('comment'))) {
            return { innerPayload: this.payload.comment, githubTarget: github.issues };
        }
        return null;
    }

    /**
     * Get the data required to authenticate the request
     *
     * @param target
     * @param owner
     * @param repo
     * @param number
     * @return {*}
     */
    getIssuePrAuth(target = null, owner = null, repo = null, number = null) {
        const { innerPayload, githubTarget } = this.getInnerPayload(target);

        if (!owner) {
            owner = this.payload.repository.owner.login;
        }

        if (!repo) {
            repo = this.payload.repository.name;
        }

        if (!number && innerPayload) {
            number = innerPayload.number;
        }

        return { innerPayload, githubTarget, owner, repo, number };
    }

    /**
     * Add labels to issues/PRs
     *
     * @param labels
     * @param _target
     * @param _owner
     * @param _repo
     * @param _number
     */
    addLabels(labels = [], _target = null, _owner = null, _repo = null, _number = null) {
        let { owner, repo, number } = this.getIssuePrAuth(_target, _owner, _repo, _number);
        github.issues.addLabels({
            owner, repo, number, labels
        });
    }

    /**
     * Replace labels on issues/PRs
     *
     * @param labels
     * @param _target
     * @param _owner
     * @param _repo
     * @param _number
     */
    replaceLabels(labels = [], _target = null, _owner = null, _repo = null, _number = null) {
        let { owner, repo, number } = this.getIssuePrAuth(_target, _owner, _repo, _number);
        github.issues.replaceAllLabels({
            owner, repo, number, labels
        });
    }

    /**
     * Queue an issue/PR comment
     *
     * @param body
     */
    queueComment(body) {
        this.commentQueue.push(body);
    }

    /**
     * Add comment (Will also send all queued comments)
     *
     * @param body
     * @param username
     * @param _target
     * @param _owner
     * @param _repo
     * @param _number
     * @return {Promise<any>}
     */
    addComments(body = [], username = null, _target = null, _owner = null, _repo = null, _number = null) {
        let { innerPayload, githubTarget, owner, repo, number } = this.getIssuePrAuth(_target, _owner, _repo, _number);

        if (!username && innerPayload) {
            username = innerPayload.user.login;
        }

        if (body.length === 0 && this.commentQueue.length !== 0) {
            body = this.commentQueue;
        }

        if (username && messages.length > 0) {
            body.unshift(messages.greeting(username))
        }

        if (messages.length > 0) {
            return githubTarget.createComment({
                owner, repo, number,
                body: body.join(`\n\n`).trim()
            });
        }
    }
}