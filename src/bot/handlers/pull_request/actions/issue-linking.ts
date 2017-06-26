import { IOperationModel, Operation } from '../../../../models/operation';
import { IApiResponse } from '../../../interfaces/api-response';
import { IComment } from '../../../interfaces/comment';
import { IPullRequest } from '../../../interfaces/pull-request';
import { Messages } from '../../../messages/index';
import { Detector } from '../../../utils/detection';
import { HandlerBase, IBasicData } from '../../base';

export class IssueLinkingAction {

  public static perform(handler: HandlerBase) {

    const {primary: {number, body}} = handler.getBasicData() as IBasicData<IPullRequest>;

    const issueNumbers = Detector.findIssueNumbers(body);

    Operation.findOne({
      relatedId: handler.getBasicData().primary.id,
      temporaryEntry: true,
      type: 'not_linked_comment',
    }, (err, existingOperation: IOperationModel) => {
      if (issueNumbers.length === 0) {
        handler.logInfo(`No linked issues found for PR ${number}.`);
        if (process.env.DISALLOW_PR_WITHOUT_ISSUE && process.env.DISALLOW_PR_WITHOUT_ISSUE !== 'false' && !existingOperation) {
          handler
            .addComments([Messages.unlinkedPullRequest()])
            .then((response: IApiResponse<IComment>) => {
              const {data} = response;
              const operation = new Operation();
              operation.relatedId = handler.getBasicData().primary.id;
              operation.temporaryEntry = true;
              operation.type = 'not_linked_comment';
              operation.selfId = data.id;
              operation.save();
            });
        }
      } else {
        if (existingOperation) {
          handler.deleteComment(existingOperation.selfId);
          existingOperation.remove();
        }
        issueNumbers.forEach((issueNumber) => {
          handler.addLabels(['has-PR'], null, null, null, parseInt(issueNumber));
        });
      }
    });
  }
}
