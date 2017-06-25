import { HandlerBase, IBasicData } from '../base';
import { IIssue } from '../../interfaces/issue';

export default class extends HandlerBase {
  handle() {
    const {primary: {body, number}} = this.getBasicData() as IBasicData<IIssue>;
    if (body.length <= 20) {
      this.logger.info(`Adding needs-info label on issue: ${number}`);
      this.addLabels(['needs-info']);
    }
  }
};