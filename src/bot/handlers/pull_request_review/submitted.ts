import { IReview } from '../../interfaces/review';
import { HandlerBase, IBasicData } from '../base';

export default class extends HandlerBase {
  public handle() {
    const {primary: {state}} = this.getBasicData('review') as IBasicData<IReview>;
    if (state === 'approved' || state === 'rejected') {
      this.removeLabels(['needs-review']);
    }
  }
}
