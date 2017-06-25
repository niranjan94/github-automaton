import { Operation } from '../../../models/operation';
import { IApiResponse } from '../../interfaces/api-response';
import { IComment } from '../../interfaces/comment';
import { ILabel } from '../../interfaces/label';
import { Messages } from '../../messages/index';
import { HandlerBase, IBasicData } from '../base';

export default class extends HandlerBase {
  public handle() {
    const {primary: {name}} = this.getBasicData('label') as IBasicData<ILabel>;
    if (name === 'needs-info') {
      this.addComments([Messages.needsInfo()]).then((response: IApiResponse<IComment>) => {
        const {data} = response;
        const operation = new Operation();
        operation.relatedId = this.getBasicData().primary.id;
        operation.temporaryEntry = true;
        operation.type = 'needs_info_comment';
        operation.selfId = data.id;
        operation.save();
      });
    }
  }
}
