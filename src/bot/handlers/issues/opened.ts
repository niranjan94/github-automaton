import { IIssue } from '../../interfaces/issue';
import { HandlerBase, IBasicData } from '../base';

export default class extends HandlerBase {
  public handle() {
    const {primary: {body}} = this.getBasicData() as IBasicData<IIssue>;
    if (body.length <= 20) {
      this.addLabels(['needs-info']);
    }
  }
}
