import { HandlerBase, IBasicData } from '../base';
import { Operation } from '../../../models/operation';
import { ILabel } from '../../interfaces/label';
import { IApiResponse } from '../../interfaces/api-response';
import { Messages } from '../../messages/index';
import { IComment } from '../../interfaces/comment';

export default class extends HandlerBase {
  handle() {
    const {primary: {name}} = this.getBasicData('label') as IBasicData<ILabel>;
    if (name === 'needs-info') {
      this.addComments([Messages.needsInfo()]).then((response: IApiResponse<IComment>) => {
        const {data} = response;
        let operation = new Operation();
        operation.relatedId = this.getBasicData().primary.id;
        operation.temporaryEntry = true;
        operation.type = 'needs_info_comment';
        operation.selfId = data.id;
        operation.save();
      });
    }
  }
};