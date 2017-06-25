import * as GitHubApi from 'github';
import * as winston from 'winston';

import { IComment } from '../interfaces/comment';
import { IEventBase } from '../interfaces/event-base';
import { IIssue } from '../interfaces/issue';
import { ILabel } from '../interfaces/label';
import { IPullRequest } from '../interfaces/pull-request';
import { IReview } from '../interfaces/review';
import { Messages } from '../messages';
import { Auth } from '../utils/auth';
import { GitHub } from '../utils/github';

interface IPrimaryPayload<T> {
  primary: T;
  apiTarget: string;
}

export interface IBasicData<T> extends IPrimaryPayload<T> {
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
  protected payload: IEventBase;
  protected github: GitHubApi;
  protected logger: winston.Winston;
  protected commentQueue: string[];

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
   */
  public initialize(): any {
    if (!this.payload.hasOwnProperty('installation')) {
      return this.logger.error('The payload has no property installation. Cannot proceed');
    }
    let username = null;
    if (this.payload.hasOwnProperty('repository')) {
      username = this.payload.repository.owner.login;
    }
    Auth.getIntegrationAccessToken(this.payload.installation.id, username).then((token) => {
      this.github.authenticate({
        token,
        type: 'token',
      });
      this.logger.info('Token obtained. Handling event now.');
      this.handle();
    }).catch((e) => {
      return this.logger.error('Error during token authentication.', e);
    });
  }

  /**
   * Handle an event. Must be implemented in the child that extends this class
   */
  public abstract handle();

  protected logInfo(info: string) {
    try {
      this.logger.info(`[${this.payload.repository.full_name}] ${info}`)
    } catch (ignored) { /** ignored **/ }
  }
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
      return {primary: this.payload.pull_request, apiTarget: (!target ? 'issues' : 'pullRequests')};
    } else if (target === 'issue' || (!target && this.payload.hasOwnProperty('issue'))) {
      return {primary: this.payload.issue, apiTarget: 'issues'};
    } else if (target === 'label' || (!target && this.payload.hasOwnProperty('label'))) {
      return {primary: this.payload.label, apiTarget: 'issues'};
    } else if (target === 'comment' || (!target && this.payload.hasOwnProperty('comment'))) {
      return {primary: this.payload.comment, apiTarget: 'issues'};
    } else if (target === 'review' || (!target && this.payload.hasOwnProperty('review'))) {
      return {primary: this.payload.review, apiTarget: (!target ? 'issues' : 'pullRequests')};
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
  protected getBasicData(target?: string, owner?: string, repo?: string, number?: number): IBasicData<any> {
    const {primary, apiTarget} = this.getPrimaryPayload(target);

    if (!owner) {
      owner = this.payload.repository.owner.login;
    }

    if (!repo) {
      repo = this.payload.repository.name;
    }

    if (!number && primary) {
      number = primary.number;
    }

    return {primary, apiTarget, owner, repo, number};
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
public addLabels(labels = [], _target?: string, _owner?: string, _repo?: string, _number?: number): Promise<any> {
    const {owner, repo, number} = this.getBasicData(_target, _owner, _repo, _number);
    this.logInfo(`[Issue/PR: ${number}] adding labels: ${labels.join(',')}.`);
    return this.github.issues.addLabels({
      labels, number, owner, repo,
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
  public removeLabels(labels = [], _target?: string, _owner?: string, _repo?: string, _number?: number): Promise<any> {
    const {owner, repo, number} = this.getBasicData(_target, _owner, _repo, _number);
    const promises = [];
    this.logInfo(`[Issue/PR: ${number}] removing labels: ${labels.join(',')}.`);
    labels.forEach((label) => {
      promises.push(this.github.issues.removeLabel({
        name: label,
        number, owner, repo,
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
  public replaceLabels(labels = [], _target?: string, _owner?: string, _repo?: string, _number?: number): Promise<any> {
    const {owner, repo, number} = this.getBasicData(_target, _owner, _repo, _number) as IBasicData<IIssue>;
    this.logInfo(`[Issue/PR: ${number}] replacing labels: ${labels.join(',')}.`);
    return this.github.issues.replaceAllLabels({
      labels, number, owner, repo,
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
  public addComments(comments = [], username?: string, _target?: string, _owner?: string, _repo?: string, _number?: number): Promise<any> {
    const {primary, owner, repo, number} = this.getBasicData(_target, _owner, _repo, _number) as IBasicData<IIssue>;
    if (!username && primary) {
      username = primary.user.login;
    }

    comments.push(...this.commentQueue);

    if (username && comments.length > 0) {
      comments.unshift(Messages.greeting(username));
    }

    if (comments.length > 0) {
      this.logInfo(`Adding comments: (${comments.length}).`);
      this.commentQueue = [];
      return this.github.issues.createComment({
        body: comments.join(`\n\n`).trim(),
        number, owner, repo,
      });
    }
    return new Promise((resolve, reject) => reject('No comments added.'));
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
  public deleteComment(id?: string | number, _owner?: string, _repo?: string): Promise<any> {
    const {primary, owner, repo} = this.getBasicData('comment', _owner, _repo) as IBasicData<IComment>;
    if (!id && primary) {
      id = primary.id;
    }
    id = String(id);
    this.logInfo(`Deleting comment ID: ${id}.`);
    return this.github.issues.deleteComment({
      id, owner, repo,
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
  public createIssue(title: string, body = '', _owner?: string, _repo?: string): Promise<any> {
    const {owner, repo} = this.getBasicData('issue', _owner, _repo);
    this.logInfo(`Creating issue with title; ${title}`);
    return this.github.issues.create({
      body, owner, repo, title,
    });
  }

  /**
   *  Close an issue
   *
   * @param _number
   * @param _owner
   * @param _repo
   * @return {Promise}
   */
  public closeIssue(_number?: number, _owner?: string, _repo?: string): Promise<any> {
    const {owner, repo, number} = this.getBasicData('issue', _owner, _repo, _number);
    this.logInfo(`[Issue: ${number}] closing issue.`);
    return this.github.issues.edit({
      number, owner, repo,
      state: 'closed',
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
  public openIssue(_number?: number, _owner?: string, _repo?: string): Promise<any> {
    const {owner, repo, number} = this.getBasicData('issue', _owner, _repo, _number);
    this.logInfo(`[Issue: ${number}] opening issue.`);
    return this.github.issues.edit({
      number, owner, repo,
      state: 'open',
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
  public lockIssue(_number?: number, _owner?: string, _repo?: string): Promise<any> {
    const {owner, repo, number} = this.getBasicData('issue', _owner, _repo, _number);
    this.logInfo(`[Issue: ${number}] locking issue.`);
    return this.github.issues.lock({number, owner, repo});
  }

  /**
   * Unlock an issue
   *
   * @param _number
   * @param _owner
   * @param _repo
   * @return {Promise}
   */
  public unlockIssue(_number?: number, _owner?: string, _repo?: string): Promise<any> {
    const {owner, repo, number} = this.getBasicData('issue', _owner, _repo, _number);
    this.logInfo(`[Issue: ${number}] unlocking issue.`);
    return this.github.issues.unlock({number, owner, repo});
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
  public createPrReviewRequest(users: string[], _owner?: string, _repo?: string, _number?: number) {
    const {owner, repo, number} = this.getBasicData('pull_request', _owner, _repo, _number);
    this.logInfo(`[PR: ${number}] Creating PR review request to users: ${users.join(',')}`);
    return this.github.pullRequests.createReviewRequest({number, owner, repo, reviewers: users});
  }

}
