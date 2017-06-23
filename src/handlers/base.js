import { createInstance } from '../github'
import Parser from '../parser'
import messages from '../messages/load'
import winston from 'winston-color'

/**
 * All hook handlers should extend this.
 *
 * This provides a context aware API to GitHub
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
        this.logger = winston;
        this.github = createInstance();
    }

    /**
     * Create a handler instance and handle the webhook
     */
    create() {
        this.payload.token.then((token) => {
            this.github.authenticate({
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
            return { innerPayload: this.payload.pull_request, githubTarget: (!target ? this.github.issues : this.github.pullRequests) };
        } else if (target === 'issue' || (! target && this.payload.hasOwnProperty('issue'))) {
            return { innerPayload: this.payload.issue, githubTarget: this.github.issues };
        } else if (target === 'label' || (! target && this.payload.hasOwnProperty('label'))) {
            return { innerPayload: this.payload.label, githubTarget: this.github.issues };
        } else if (target === 'comment' || (! target && this.payload.hasOwnProperty('comment'))) {
            return { innerPayload: this.payload.comment, githubTarget: this.github.issues };
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
        this.github.issues.addLabels({
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
        this.github.issues.replaceAllLabels({
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

        if (username && body.length > 0) {
            body.unshift(messages.greeting(username))
        }

        if (body.length > 0) {
            return githubTarget.createComment({
                owner, repo, number,
                body: body.join(`\n\n`).trim()
            });
        }
    }

    /**
     * Delete a comment
     *
     * @param id
     * @param _owner
     * @param _repo
     * @return {Promise<any>}
     */
    deleteComment(id = null, _owner = null, _repo = null) {
        let { innerPayload, githubTarget, owner, repo } = this.getIssuePrAuth('comment', _owner, _repo);
        if (!id) {
            id = innerPayload.id;
        }
        return githubTarget.deleteComment({
            id, owner, repo
        })
    }

    /**
     * Create an issue
     *
     * @param title
     * @param body
     * @param _owner
     * @param _repo
     * @param _target
     *
     * @return {Promise<any>}
     */
    createIssue(title, body = '', _owner = null, _repo = null, _target = null) {
        let { owner, repo } = this.getIssuePrAuth(_target, _owner, _repo);
        return this.github.issues.create({
            owner, repo, title, body
        })
    }

    /**
     * Close an issue
     * @param _owner
     * @param _repo
     * @param _number
     * @param _target
     * @return {Promise<any>}
     */
    closeIssue(_owner = null, _repo = null, _number = null, _target = null) {
        let { owner, repo, number } = this.getIssuePrAuth(_target, _owner, _repo, _number);
        return this.github.issues.edit({
            owner, repo, number,
            state: "closed"
        });
    }

    /**
     * Open an issue
     *
     * @param _owner
     * @param _repo
     * @param _number
     * @param _target
     * @return {Promise<any>}
     */
    openIssue(_owner = null, _repo = null, _number = null, _target = null) {
        let { owner, repo, number } = this.getIssuePrAuth(_target, _owner, _repo, _number);
        return this.github.issues.edit({
            owner, repo, number,
            state: "open"
        });
    }

    /**
     * Lock an issue
     *
     * @param _owner
     * @param _repo
     * @param _number
     * @param _target
     * @return {Promise<any>}
     */
    lockIssue(_owner = null, _repo = null, _number = null, _target = null) {
        let { owner, repo, number } = this.getIssuePrAuth(_target, _owner, _repo, _number);
        return this.github.issues.lock({ owner, repo, number });
    }

    /**
     * Unlock an issue
     *
     * @param _owner
     * @param _repo
     * @param _number
     * @param _target
     * @return {Promise<any>}
     */
    unlockIssue(_owner = null, _repo = null, _number = null, _target = null) {
        let { owner, repo, number } = this.getIssuePrAuth(_target, _owner, _repo, _number);
        return this.github.issues.unlock({ owner, repo, number });
    }

    /**
     * Create a PR review request
     *
     * @param users
     * @param _owner
     * @param _repo
     * @param _number
     * @param _target
     * @return {Promise<any>}
     */
    createPrReviewRequest(users, _owner = null, _repo = null, _number = null, _target = null) {
        let { owner, repo, number } = this.getIssuePrAuth(_target, _owner, _repo, _number);
        return this.github.pullRequests.createReviewRequest({ owner, repo, number, reviewers: users });
    }
}