import Base from '../base'
import messages from '../../messages/load'
import { getFailedJobs } from '../../travis'
import db  from '../../db'

export default class extends Base {
    handle() {
        const { state, target_url, repository, commit: { author } } = this.payload;
        if (state === 'failure') {
            if (target_url && target_url.includes('travis')) {
                this.logger.info(`Status failed for build url: ${target_url}`);

                const repoOwner = repository.owner.login;
                const repoName  = repository.name;

                const { prNumber, failedJobs } = getFailedJobs(target_url, repoOwner, repoName);
                if (failedJobs.length > 0) {
                    const initiator = author.login;
                    this.queueComment(messages.buildFailed());
                    failedJobs.forEach(job => {
                        this.queueComment(messages.buildFailureItem(job.number, repoOwner, repoName, job.id));
                    });
                    this.addComments([], initiator, 'issue', repoOwner, repoName, prNumber).then(response => {
                        const { data } = response;
                        db.insert({
                            relatedId: `${repository.full_name}:${prNumber}`,
                            temporaryEntry: true,
                            type: 'build_failed_comment',
                            selfId: data.id
                        });
                    });
                }
            }
        }
    }
};