import { IIssue } from '../../interfaces/issue';
import { HandlerBase, IBasicData } from '../base';

export default class extends HandlerBase {
  public handle() {
    const {primary: {body, number}} = this.getBasicData() as IBasicData<IIssue>;
    if (body.length <= 20) {
      this.logger.info(`Adding needs-info label on issue: ${number}`);
      this.addLabels(['needs-info']);
    }
  }
}
