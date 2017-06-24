import Base from '../base'
import messages from '../../messages/load'

export default class extends Base {
    handle() {
        const { innerPayload: { number } } = this.getInnerPayload();

        const { repository } = this.payload;

        this.github.pullRequests.get({
            owner: repository.owner.login,
            repo: repository.name,
            number
        }).then(response => {
            const { mergeable, rebaseable } = response.data;
            if (!mergeable && !rebaseable) {
                this.addComments([messages.prHasConflicts()]);
            } else if (!rebaseable) {
                this.addComments([messages.prCannotBeRebased()]);
            } else {

            }
        });
    }
};