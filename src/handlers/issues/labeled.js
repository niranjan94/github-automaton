import Base from '../base'
import messages from '../../messages/load'
import db from '../../db'

export default class extends Base {
    handle() {
        const { innerPayload: { name } } = this.getInnerPayload('label');
        console.log(name);
        if (name === 'needs-info') {
            this.addComments([messages.needsInfo()]).then(response => {
                const { data } = response;
                db.insert({
                    relatedId: this.getInnerPayload().innerPayload.id,
                    temporaryEntry: true,
                    type: 'needs_info_comment',
                    selfId: data.id
                });
            });
        }
    }
};