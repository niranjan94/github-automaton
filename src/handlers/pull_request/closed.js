import Base from '../base'
import messages from '../../messages/load'

export default class extends Base {
    handle() {
        const { innerPayload: { number, merged } } = this.getInnerPayload();
        if (merged) {
            this.logger.info(`Adding ready to ship label on merged PR: ${number}`);
            this.replaceLabels(['ready-to-ship']);
        } else {
            this.logger.info(`Adding invalid label on closed PR: ${number}`);
            this.replaceLabels(['invalid']);
            this.addComments([messages.closedWithoutMerging()]);
        }
    }
};