import Model from './models/model'
import PullRequest from './models/pull-request'
import Issue from './models/issue'
import User from './models/user'
import Repository from './models/repository'
import { getIntegrationAccessToken } from './auth'

export default class extends Model {
    get issue() {
        return this._issue;
    }

    set issue(issue) {
        this._issue = new Issue(issue);
    }

    get pull_request() {
        return this._pull_request;
    }

    set pull_request(pull_request) {
        this._pull_request = new PullRequest(pull_request);
    }

    set sender(sender) {
        this._sender = new User(sender);
    }

    get sender() {
        return this._sender;
    }

    set repository(repository) {
        this._repository = new Repository(repository);
    }

    get repository() {
        return this._repository;
    }

    /**
     * Get the promise that resolves into the current token
     *
     * @return Promise
     */
    get token() {
        if (!this.hasOwnProperty('installation')) {
            return null;
        }
        return getIntegrationAccessToken(this.installation.id);
    }
}