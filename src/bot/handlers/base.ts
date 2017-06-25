import * as GitHubApi from 'github';
import * as winston from 'winston';

import { IPullRequest } from '../interfaces/pull-request';
import { IEventBase } from '../interfaces/event-base';
import { IComment } from '../interfaces/comment';
import { IReview } from '../interfaces/review';
import { ILabel } from '../interfaces/label';
import { IIssue } from '../interfaces/issue';
import { GitHub } from '../utils/github';
import { Messages } from '../messages'
import { Auth } from '../utils/auth';


interface IPrimaryPayload<T> {
  primary: T;
  apiTarget: string;
}

interface IBasicData<T> extends IPrimaryPayload<T> {
  owner: string;
  repo: string;
  number: number;
}

/**
 * The base handler. All other handlers must extend this.
 *
 * This provides a context aware API to GitHub
 */
export abstract class HandlerBase {
  payload: IEventBase;
  github: GitHubApi;
  logger: winston.Winston;
  commentQueue: string[];

  /**
   * Get the payload and initialize logger and github api
   *
   * @param payload
   */
  constructor(payload: any) {
    this.payload = payload;
    this.logger = winston;
    this.commentQueue = [];
    this.github = GitHub.createInstance();
  }

  /**
   * Obtain a token for that specific installation and set it to the new Github API instance
   **/
  public initialize(): any {
    if (!this.payload.hasOwnProperty('installation')) {
      return this.logger.error('The payload has no property installation. Cannot proceed');
    }
    let username = null;
    if (this.payload.hasOwnProperty('repository')) {
      username = this.payload.repository.owner.login;
    }
    Auth.getIntegrationAccessToken(this.payload.installation.id, username).then(token => {
      this.github.authenticate({
        type: 'token',
        token: token
      });
      this.logger.info('Token obtained. Handling event now.');
      this.handle();
    }).catch(e => {
      return this.logger.error('Error during token authentication.', e);
    });
  }

  /**
   * Handle an event. Must be implemented in the child that extends this class
   */
  abstract handle();

  /**
   * Queue an issue/PR comment
   *
   * @param body
   */
  protected queueComment(body) {
    this.commentQueue.push(body);
  }

  /**
   * Get the primary payload (Pull request or issue or label or comment)
   *
   * Note: All PRs are issues and some functions are shared with the issue API.
   *
   * @param target
   * @return {*}
   */
  protected getPrimaryPayload(target?: string): IPrimaryPayload<any> | null {
    if (target === 'pull_request' || (!target && this.payload.hasOwnProperty('pull_request'))) {
      return { primary: this.payload.pull_request, apiTarget: (!target ? 'issues' : 'pullRequests') };
    } else if (target === 'issue' || (!target && this.payload.hasOwnProperty('issue'))) {
      return { primary: this.payload.issue, apiTarget: 'issues' };
    } else if (target === 'label' || (!target && this.payload.hasOwnProperty('label'))) {
      return { primary: this.payload.label, apiTarget: 'issues' };
    } else if (target === 'comment' || (!target && this.payload.hasOwnProperty('comment'))) {
      return { primary: this.payload.comment, apiTarget: 'issues' };
    } else if (target === 'review' || (!target && this.payload.hasOwnProperty('review'))) {
      return { primary: this.payload.review, apiTarget: (!target ? 'issues' : 'pullRequests') };
    }
    return null;
  }

  /**
   * Get the basic data required for most requests
   *
   * @param target
   * @param owner
   * @param repo
   * @param number
   * @return {{primary: (IIssue|IPullRequest|ILabel|IComment|IReview), apiTarget: string, owner: string, repo: string, number: number}}
   */
  protected getBasicData (target?: string, owner?: string, repo?: string, number?: number): IBasicData<any> {
    let { primary, apiTarget } = this.getPrimaryPayload(target);

    if (!owner) {
      owner = this.payload.repository.owner.login;
    }

    if (!repo) {
      repo = this.payload.repository.name;
    }

    if (!number && primary) {
      number = primary.number;
    }

    return { primary, apiTarget, owner, repo, number };
  }


  /**
   * Add labels to issues/PRs
   *
   * @param labels
   * @param _target
   * @param _owner
   * @param _repo
   * @param _number
   *
   * @return {Promise}
   */
  addLabels(labels = [], _target?: string, _owner?: string, _repo?: string, _number?: number): Promise<any> {
    let { owner, repo, number } = this.getBasicData(_target, _owner, _repo, _number);
    return this.github.issues.addLabels({
      owner, repo, number, labels
    });
  }

  /**
   * Remove labels from issues/pr
   * @param labels
   * @param _target
   * @param _owner
   * @param _repo
   * @param _number
   *
   * @return {Promise}
   */
  removeLabels(labels = [], _target?: string, _owner?: string, _repo?: string, _number?: number): Promise<any> {
    let { owner, repo, number } = this.getBasicData(_target, _owner, _repo, _number);
    let promises = [];
    labels.forEach(label => {
      promises.push(this.github.issues.removeLabel({
        owner, repo, number,
        name: label
      }));
    });
    return Promise.all(promises);
  }

  /**
   * Replace labels on issues/PRs
   *
   * @param labels
   * @param _target
   * @param _owner
   * @param _repo
   * @param _number
   *
   * @return {Promise}
   */
  replaceLabels(labels = [], _target?: string, _owner?: string, _repo?: string, _number?: number): Promise<any> {
    let { owner, repo, number } = this.getBasicData(_target, _owner, _repo, _number) as IBasicData<IIssue>;
    return this.github.issues.replaceAllLabels({
      owner, repo, number, labels
    });
  }

  /**
   * Add comment (Will also send all queued comments)
   *
   * @param comments
   * @param username
   * @param _target
   * @param _owner
   * @param _repo
   * @param _number
   *
   * @return {Promise}
   */
  addComments(comments = [], username?: string, _target?: string, _owner?: string, _repo?: string, _number?: number): Promise<any> {
    let { primary, owner, repo, number } = this.getBasicData(_target, _owner, _repo, _number) as IBasicData<IIssue>;
    if (!username && primary) {
      username = primary.user.login;
    }

    comments.push(...this.commentQueue);

    if (username && comments.length > 0) {
      comments.unshift(Messages.greeting(username))
    }

    if (comments.length > 0) {
      this.commentQueue = [];
      return this.github.issues.createComment({
        owner, repo, number,
        body: comments.join(`\n\n`).trim()
      });
    }
    return new Promise(function (resolve, reject) { reject ('No comments added.') });
  }

  /**
   * Delete a comment
   *
   * @param id
   * @param _owner
   * @param _repo
   *
   * @return {Promise}
   */
  deleteComment(id?: string, _owner?:string , _repo?:string ): Promise<any> {
    let { primary, owner, repo } = this.getBasicData('comment', _owner, _repo) as IBasicData<IComment>;
    if (!id && primary) {
      id = String(primary.id);
    }
    return this.github.issues.deleteComment({
      id, owner, repo
    });
  }

  /**
   * Create an issue
   *
   * @param title
   * @param body
   * @param _owner
   * @param _repo
   * @return {Promise}
   */
  createIssue(title: string, body = '', _owner?: string, _repo?: string): Promise<any> {
    let { owner, repo } = this.getBasicData('issue', _owner, _repo);
    return this.github.issues.create({
      owner, repo, title, body
    })
  }

  /**
   *  Close an issue
   *
   * @param _number
   * @param _owner
   * @param _repo
   * @return {Promise}
   */
  closeIssue(_number?: number, _owner?: string, _repo?: string): Promise<any> {
    let { owner, repo, number } = this.getBasicData('issue', _owner, _repo, _number);
    return this.github.issues.edit({
      owner, repo, number,
      state: "closed"
    });
  }

  /**
   *  Open an issue
   *
   * @param _number
   * @param _owner
   * @param _repo
   * @return {Promise}
   */
  openIssue(_number?: number, _owner?: string, _repo?: string): Promise<any> {
    let { owner, repo, number } = this.getBasicData('issue', _owner, _repo, _number);
    return this.github.issues.edit({
      owner, repo, number,
      state: "open"
    });
  }

  /**
   * Lock the issue
   *
   * @param _number
   * @param _owner
   * @param _repo
   * @return {Promise}
   */
  lockIssue(_number?: number, _owner?: string, _repo?: string): Promise<any> {
    let { owner, repo, number } = this.getBasicData('issue', _owner, _repo, _number);
    return this.github.issues.lock({ owner, repo, number });
  }

  /**
   * Unlock an issue
   *
   * @param _number
   * @param _owner
   * @param _repo
   * @return {Promise}
   */
  unlockIssue(_number?: number, _owner?: string, _repo?: string): Promise<any> {
    let { owner, repo, number } = this.getBasicData('issue', _owner, _repo, _number);
    return this.github.issues.unlock({ owner, repo, number });
  }

  /**
   * Create a PR review request
   *
   * @param users
   * @param _owner
   * @param _repo
   * @param _number
   * @return {Promise}
   */
  createPrReviewRequest(users: string[], _owner?: string, _repo?: string, _number?: number) {
    let { owner, repo, number } = this.getBasicData('pull_request', _owner, _repo, _number);
    return this.github.pullRequests.createReviewRequest({ owner, repo, number, reviewers: users });
  }

}