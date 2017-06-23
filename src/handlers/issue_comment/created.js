import Base from '../base'
import messages from '../../messages/load'

export default class extends Base {
    handle() {
        const { innerPayload: { id, body } } = this.getInnerPayload('comment');
        console.log(name);
        if (name === 'needs-info') {
            this.addComments([messages.needsInfo()]);
        }
    }
};