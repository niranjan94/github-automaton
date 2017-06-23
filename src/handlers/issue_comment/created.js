import Base from '../base'
import messages from '../../messages/load'
import { isInvalidComment, getIssueMoveCommand } from '../../utils/detection'

export default class extends Base {
    handle() {
        const { innerPayload: { id, body, user: { login } } } = this.getInnerPayload('comment');
        if (isInvalidComment(body)) {
            this.logger.info(`Removing invalid comment (Body: ${body} id: ${id}`);
            return this.deleteComment();
        }

        const moveToTarget = getIssueMoveCommand(body);
        if (moveToTarget) {

            const [owner, repo] = moveToTarget.split('/');
            const { issue, repository } = this.payload;

            const organization = repository.owner.login;

            if (repository.full_name !== moveToTarget.trim()) {
                this.github.orgs.checkMembership({
                    org: organization,
                    username: login
                }).then(() => {
                    this.createIssue(issue.title, messages.movedIssueBody(login, issue.html_url, issue.body), owner, repo)
                        .then((newIssue) => {
                            this.logger.info(`New issue clone created at ${newIssue.data.html_url}.`);
                            this.addComments([messages.issueMovedComment(newIssue.data.html_url)]);
                            this.closeIssue();
                            this.logger.info(`Old issue closed at ${issue.data.html_url}.`);
                        });
                }).catch(e => {
                    console.log(e);
                    this.logger.info(`Non-member (${login}} trying to make a move request. Ignoring.`)
                });
            } else {
                this.logger.info(`Cannot move to same repo ${repository.full_name} >> ${moveToTarget}.`)
            }
        }
    }
};