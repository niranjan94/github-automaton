import Base from '../base'
import winston from 'winston-color'

export default class extends Base {
    handle() {
        const { innerPayload: { body, number } } = this.getInnerPayload();
        if (body.length <= 20) {
            winston.info(`Adding needs-info label on issue: ${number}`);
            this.addLabels(['needs-info']);
        }
    }
};