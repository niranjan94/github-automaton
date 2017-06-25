import { HandlerBase } from '../base';
import { IFailedJobs, ITravisJob, Travis } from '../../utils/travis';
import { Operation } from '../../../models/operation';
import { Messages } from '../../messages';
import { IComment } from '../../interfaces/comment';
import { IApiResponse } from '../../interfaces/api-response';

export default class extends HandlerBase {
  handle() {
    const {state, target_url, repository, commit: {author}} = this.payload;
    if (state === 'failure') {
      if (state === 'failure') {
        if (target_url && target_url.includes('travis')) {
          this.logger.info(`Status failed for build url: ${target_url}`);

          const repoOwner = repository.owner.login;
          const repoName = repository.name;

          Travis.getFailedJobs(target_url, repoOwner, repoName).then((response: IFailedJobs) => {
            const {prNumber, failedJobs} = response;
            if (failedJobs.length > 0) {
              const initiator = author.login;
              this.queueComment(Messages.buildFailed());
              failedJobs.forEach((job: ITravisJob) => {
                this.queueComment(Messages.buildFailureItem(job.number, repoOwner, repoName, job.id));
              });
              this.addComments([], initiator, 'issue', repoOwner, repoName, prNumber).then((response: IApiResponse<IComment>) => {
                const {data} = response;
                let operation = new Operation();
                operation.relatedId = `${repository.full_name}:${prNumber}`;
                operation.temporaryEntry = true;
                operation.type = 'build_failed_comment';
                operation.selfId = data.id;
                operation.save();
              });
            }
          });
        }
      }
    }
  }
};