import { HandlerBase, IBasicData } from '../base';
import { IPullRequest } from '../../interfaces/pull-request';
import { Messages } from '../../messages';
import { IApiResponse } from '../../interfaces/api-response';

export default class extends HandlerBase {
  handle() {
    const { primary: { number } } = this.getBasicData() as IBasicData<IPullRequest>;
    const { repository } = this.payload;

    this.github.pullRequests.get({
      owner: repository.owner.login,
      repo: repository.name,
      number
    }).then((response: IApiResponse<IPullRequest>) => {
      const { mergeable, rebaseable } = response.data;
      if (!mergeable && !rebaseable) {
        this.addComments([Messages.prHasConflicts()]);
      } else if (!rebaseable) {
        this.addComments([Messages.prCannotBeRebased()]);
      } else {

      }
    });
  }
};