import { IOperationModel, Operation } from '../../../models/operation';
import { IIssue } from '../../interfaces/issue';
import { HandlerBase, IBasicData } from '../base';

export default class extends HandlerBase {
  public handle() {
    const {primary: {id, body}} = this.getBasicData() as IBasicData<IIssue>;
    if (body.length > 20) {
      this.removeLabels(['needs-info']);
      Operation.findOne({
        relatedId: id,
        temporaryEntry: true,
        type: 'needs_info_comment',
      }).then((operation: IOperationModel) => {
        this.deleteComment(operation.selfId);
        operation.remove();
      });
    }
  }
}
