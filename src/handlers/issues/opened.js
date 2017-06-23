import Base from '../base'

export default class extends Base {
    handle() {
        const { innerPayload: { body, number } } = this.getInnerPayload();
        if (body.length <= 20) {
            this.logger.info(`Adding needs-info label on issue: ${number}`);
            this.addLabels(['needs-info']);
        }
    }
};