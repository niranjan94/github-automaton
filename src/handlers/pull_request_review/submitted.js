import Base from '../base'


export default class extends Base {
    handle() {
        const { innerPayload: { state, user: { login }, base } } = this.getInnerPayload('review');
        if (state === 'approved' || state === 'rejected') {
            this.removeLabels(['needs-review']);
        }
    }
};