import * as request from 'request-promise-native';
import { RequestPromise } from 'request-promise-native';
import * as winston from 'winston';

export interface ITravisJob {
  id: string;
  config: {
    os: string;
  };
  number: string;
  state: string;
  started_at: string;
  finished_at: string;
}

export interface ITravisBuildResponse {
  build: {
    pull_request_number: number;
  };
  jobs: ITravisJob[];
}

export interface IFailedJobs {
  prNumber: number;
  failedJobs: ITravisJob[];
}

export class Travis {
  private static API_BASE = 'https://api.travis-ci.org';
  private static buildIdRe = /.+\/(\d+)/;
  private static headers = {
    'Accept': 'application/vnd.travis-ci.2+json',
    'User-Agent': process.env.USER_AGENT
  };

  /**
   * Get build info of a build
   *
   * @param repoOwner
   * @param repo
   * @param buildId
   * @return {requestPromise.RequestPromise}
   */
  public static getBuildInfo(repoOwner: string, repo: string, buildId: string): RequestPromise {
    winston.info(`${repoOwner}/${repo} -> Getting build info of build ID: ${buildId}.`);
    return request({
      headers: Travis.headers,
      json: true,
      method: 'GET',
      uri: `${Travis.API_BASE}/repos/${repoOwner}/${repo}/builds/${buildId}`
    });
  }

  /**
   * Get build ID from identifier
   * @param identifier
   * @return {String}
   */
  public static getBuildId(identifier: any): string {
    if (isNaN(identifier)) {
      const [, buildID] = identifier.match(Travis.buildIdRe) || [null, null];
      identifier = buildID;
    }
    return identifier;
  }

  /**
   * Get failed jobs for a build ID
   *
   * @param buildIdentifier
   * @param repoOwner
   * @param repoName
   * @return {Promise<IFailedJobs>}
   */
  public static getFailedJobs(buildIdentifier: string, repoOwner: string, repoName: string): Promise<IFailedJobs> {
    buildIdentifier = Travis.getBuildId(buildIdentifier);
    return new Promise((resolve, reject) => {
      if (!buildIdentifier) {
        return reject();
      }
      Travis.getBuildInfo(repoOwner, repoName, buildIdentifier)
        .then((response: ITravisBuildResponse) => {
          const prNumber = response.build.pull_request_number;
          if (prNumber) {
            resolve({
              failedJobs: response.jobs.filter((build) => build.state === 'failed'),
              prNumber
            });
          }
        });
    });
  }
}
