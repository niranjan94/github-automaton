import { HandlerBase, IBasicData } from '../base';
import { Messages } from '../../messages';
import { IPullRequest } from '../../interfaces/pull-request';

export default class extends HandlerBase {
  handle() {
    const { primary: { number, merged } } = this.getBasicData() as IBasicData<IPullRequest>;
    if (merged) {
      this.logger.info(`Adding ready to ship label on merged PR: ${number}`);
      this.replaceLabels(['ready-to-ship']);
    } else {
      this.logger.info(`Adding invalid label on closed PR: ${number}`);
      this.replaceLabels(['invalid']);
      this.addComments([Messages.closedWithoutMerging()]);
    }
  }
};