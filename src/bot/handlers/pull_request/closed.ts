import { IPullRequest } from '../../interfaces/pull-request';
import { HandlerBase, IBasicData } from '../base';

export default class extends HandlerBase {
  public handle() {
    const {primary: {merged}} = this.getBasicData() as IBasicData<IPullRequest>;
    if (merged) {
      this.replaceLabels(['ready-to-ship']);
    } else {
      this.replaceLabels(['invalid']);
      // this.addComments([Messages.closedWithoutMerging()]);
      // Removing this comment for now.
    }
  }
}
