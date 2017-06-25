import { HandlerBase, IBasicData } from '../base';
import { IOperationModel, Operation } from '../../../models/operation';
import { IIssue } from '../../interfaces/issue';

export default class extends HandlerBase {
  handle() {
    const {primary: {id, body, number}} = this.getBasicData() as IBasicData<IIssue>;
    if (body.length > 20) {
      this.logger.info(`Removing needs-info label on issue: ${number}`);
      this.removeLabels(['needs-info']);
      Operation.findOne({
        relatedId: id,
        temporaryEntry: true,
        type: 'needs_info_comment'
      }).then((operation: IOperationModel) => {
        this.deleteComment(operation.selfId);
        operation.remove();
      });
    }
  }
};