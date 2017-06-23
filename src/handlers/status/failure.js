import Base from '../base'
import messages from '../../messages/load'
import { buildIdRe, getBuildInfo } from '../../travis'

export default class extends Base {
    handle() {
        const { state, target_url, repository, commit: { author } } = this.payload;
        if (state === 'failure') {
            if (target_url && target_url.includes('travis')) {
                this.logger.info(`Status failed for build url: ${target_url}`);
                const [, buildID] = target_url.match(buildIdRe) || [];
                if (buildID) {
                    this.logger.info(`Status failed for build ID: ${buildID}`);
                    const repoOwner = repository.owner.login;
                    const repoName  = repository.name;
                    const buildInfo = getBuildInfo(repoOwner, repoName, buildID);
                    if (buildInfo) {
                        const prNumber = buildInfo.build.pull_request_number;
                        if (prNumber) {
                            const initiator = author.login;
                            const failedJobs = buildInfo.jobs.filter(build => build.state === 'failed');
                            if (failedJobs.length > 0) {
                                this.queueComment(messages.buildFailed());
                                failedJobs.forEach(job => {
                                    this.queueComment(messages.buildFailureItem(job.number, repoOwner, repoName, job.id));
                                });
                                this.addComments([], initiator, 'issue', repoOwner, repoName, prNumber);
                            }
                        }
                    }
                }
            }
        }
    }
};