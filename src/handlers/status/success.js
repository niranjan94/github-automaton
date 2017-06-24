import Base from '../base'
import { getFailedJobs } from '../../travis'
import db  from '../../db'

export default class extends Base {
    handle() {
        const { state, target_url, repository } = this.payload;
        if (state === 'failure') {
            if (target_url && target_url.includes('travis')) {
                this.logger.info(`Status passed for build url: ${target_url}`);

                const repoOwner = repository.owner.login;
                const repoName  = repository.name;

                const { prNumber, failedJobs } = getFailedJobs(target_url, repoOwner, repoName);
                if (failedJobs.length === 0) {
                    db.findOne({
                        relatedId: `${repository.full_name}:${prNumber}`,
                        temporaryEntry: true,
                        type: 'build_failed_comment',
                    }, (err, doc) => {
                        if (doc) {
                            this.logger.info(`Deleting comment (${doc.type}) with ID : ${doc.selfId}`);
                            this.deleteComment(doc.selfId, repoOwner, repoName);
                            db.remove({ _id: doc._id });
                        }
                    });
                }
            }
        }
    }
};