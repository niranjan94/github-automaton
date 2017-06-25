import * as GitHubApi from 'github';
import * as winston from 'winston';

import { IPullRequest } from '../interfaces/pull-request';
import { IEventBase } from '../interfaces/event-base';
import { IComment } from '../interfaces/comment';
import { IReview } from '../interfaces/review';
import { ILabel } from '../interfaces/label';
import { IIssue } from '../interfaces/issue';
import { GitHub } from '../utils/github';
import { Auth } from '../utils/auth';

interface IPrimaryPayload {
  primary: IIssue | IPullRequest | ILabel | IComment | IReview;
  apiTarget: string;
}

interface IBasicData extends IPrimaryPayload {
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
  protected getPrimaryPayload(target?: string): IPrimaryPayload | null {
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
  protected getBasicData(target?: string, owner?: string, repo?: string, number?: number): IBasicData {
    const { primary, apiTarget } = this.getPrimaryPayload(target);

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
  addLabels(labels = [], _target = null, _owner = null, _repo = null, _number = null): Promise<any> {
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
  removeLabels(labels = [], _target = null, _owner = null, _repo = null, _number = null): Promise<any> {
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
  replaceLabels(labels = [], _target = null, _owner = null, _repo = null, _number = null): Promise<any> {
    let { owner, repo, number } = this.getBasicData(_target, _owner, _repo, _number);
    return this.github.issues.replaceAllLabels({
      owner, repo, number, labels
    });
  }


}