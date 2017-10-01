import { IOperationModel, Operation } from '../../../models/operation';
import { IFailedJobs, Travis } from '../../utils/travis';
import { HandlerBase } from '../base';

export default class extends HandlerBase {
  public handle() {
    const {state, target_url, repository} = this.payload;
    if (state === 'failure') {
      if (target_url && target_url.includes('travis')) {
        this.logger.info(`Status passed for build url: ${target_url}`);

        const repoOwner = repository.owner.login;
        const repoName = repository.name;

        Travis.getFailedJobs(target_url, repoOwner, repoName).then((response: IFailedJobs) => {
          const {prNumber, failedJobs} = response;
          if (failedJobs.length === 0) {
            Operation.findOne({
              relatedId: `${repository.full_name}:${prNumber}`,
              temporaryEntry: true,
              type: 'build_failed_comment'
            }).then((operation: IOperationModel) => {
              this.deleteComment(operation.selfId, repoOwner, repoName);
              operation.remove();
            });
          }
        });
      }
    }
  }
}
