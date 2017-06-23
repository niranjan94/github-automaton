import Base from '../base'
import { findIssueNumbers } from '../../utils/detection'
import messages  from '../../messages/load'

export default class extends Base {
    handle() {
        const { innerPayload: { body, number, user: { login } } } = this.getInnerPayload();
        this.logger.info(`Adding needs-review label on new PR: ${number}`);
        this.replaceLabels(['needs-review']);
        const linkedIssues = findIssueNumbers(body);

        if (!login.endsWith('[bot]')) {
            if (linkedIssues.length === 0) {
                this.logger.info(`No issues found for PR: ${number}`);
                this.replaceLabels(['needs-review']);
                this.queueComment(messages.unlinkedPullRequest());
            }

            if (!body.includes('herokuapp.com') && !body.includes(`${login}.github.io`) && !body.includes(process.env.DEPLOYMENT_DOMAIN)) {
                this.queueComment(messages.pullRequestWithoutDeploymentLink());
            }
        }

        this.addComments();
    }
};