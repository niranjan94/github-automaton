import { HandlerBase, IBasicData } from '../base';
import { IReview } from '../../interfaces/review';

export default class extends HandlerBase {
  handle() {
    const { primary: { state } } = this.getBasicData('review') as IBasicData<IReview>;
    if (state === 'approved' || state === 'rejected') {
      this.removeLabels(['needs-review']);
    }
  }
};