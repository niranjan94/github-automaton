import Base from '../base'
import messages from '../../messages/load'

export default class extends Base {
    handle() {
        const { innerPayload: { name } } = this.getInnerPayload('label');
        console.log(name);
        if (name === 'needs-info') {
            this.addComments([messages.needsInfo()]);
        }
    }
};