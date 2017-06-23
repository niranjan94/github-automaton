import github from '../github'
import Parser from '../parser'
import messages from '../messages/load'

export default class {
    constructor(payload) {
        this.payload = new Parser(payload);
        this.commentQueue = [];
    }

    create() {
        this.payload.token.then((token) => {
            github.authenticate({
                type: "token",
                token: token,
            });
            this.handle();
        })
    }

    getInnerPayload(target = null) {
        if (target === 'pull_request' || (! target && this.payload.hasOwnProperty('pull_request'))) {
            // All PRs are issues and some functions are shared with the issue API.
            return { innerPayload: this.payload.pull_request, githubTarget: (!target ? github.issues : github.pullRequests) };
        } else if (target === 'issue' || (! target && this.payload.hasOwnProperty('issue'))) {
            return { innerPayload: this.payload.issue, githubTarget: github.issues };
        } else if (target === 'label' || (! target && this.payload.hasOwnProperty('label'))) {
            return { innerPayload: this.payload.label, githubTarget: github.issues };
        }
        return null;
    }

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


    addLabels(labels = [], _target = null, _owner = null, _repo = null, _number = null) {
        let { owner, repo, number } = this.getIssuePrAuth(_target, _owner, _repo, _number);
        github.issues.addLabels({
            owner, repo, number, labels
        });
    }

    replaceLabels(labels = [], _target = null, _owner = null, _repo = null, _number = null) {
        let { owner, repo, number } = this.getIssuePrAuth(_target, _owner, _repo, _number);
        github.issues.replaceAllLabels({
            owner, repo, number, labels
        });
    }

    queueComment(body) {
        this.commentQueue.push(body);
    }

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