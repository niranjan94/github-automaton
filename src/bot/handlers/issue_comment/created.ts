import { IApiResponse } from '../../interfaces/api-response';
import { IComment } from '../../interfaces/comment';
import { IIssue } from '../../interfaces/issue';
import { Messages } from '../../messages';
import { Detector } from '../../utils/detection';
import { HandlerBase, IBasicData } from '../base';

export default class extends HandlerBase {

  /**
   * Move the issue to a new owner/repo
   * @param organization
   * @param login
   * @param issue
   * @param owner
   * @param repo
   */
  private moveIssue(organization: string, login: string, issue: IIssue, owner: string, repo: string) {
    this.github.orgs.checkMembership({
      org: organization,
      username: login,
    }).then(() => {
      this.createIssue(issue.title, Messages.movedIssueBody(login, issue.html_url, issue.body), owner, repo)
        .then((response: IApiResponse<IIssue>) => {
          this.logger.info(`New issue clone created at ${response.data.html_url}.`);
          this.addComments([Messages.issueMovedComment(response.data.html_url)]);
          this.closeIssue();
          this.logger.info(`Old issue closed at ${issue.html_url}.`);
        });
    }).catch((e) => {
      console.log(e);
      this.logger.info(`Non-member (${login}} trying to make a move request. Ignoring.`);
    });
  }

  public handle() {
    const {primary: {id, body, user: {login}}} = this.getBasicData('comment') as IBasicData<IComment>;

    if (Detector.isInvalidComment(body)) {
      this.logger.info(`Removing invalid comment (Body: ${body} id: ${id}`);
      return this.deleteComment();
    }

    const moveToTarget = Detector.getIssueMoveCommand(body);
    if (moveToTarget) {
      const [newOwner, newRepo] = moveToTarget.split('/');
      const {issue, repository} = this.payload;
      const organization = repository.owner.login;
      if (repository.full_name !== moveToTarget.trim()) {
        this.moveIssue(organization, login, issue, newOwner, newRepo);
      } else {
        this.logger.info(`Cannot move to same repo ${repository.full_name} >> ${moveToTarget}.`);
        return this.deleteComment();
      }
    }
  }
}
