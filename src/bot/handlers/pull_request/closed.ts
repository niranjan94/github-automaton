import { IPullRequest } from '../../interfaces/pull-request';
import { Messages } from '../../messages';
import { HandlerBase, IBasicData } from '../base';

export default class extends HandlerBase {
  public handle() {
    const {primary: {merged}} = this.getBasicData() as IBasicData<IPullRequest>;
    if (merged) {
      this.replaceLabels(['ready-to-ship']);
    } else {
      this.replaceLabels(['invalid']);
    }
  }
}
