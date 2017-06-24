import Base from '../base'
import db from '../../db'

export default class extends Base {
    handle() {
        const { innerPayload: { id, body, number } } = this.getInnerPayload();
        if (body.length > 20) {
            this.logger.info(`Removing needs-info label on issue: ${number}`);
            this.removeLabels(['needs-info']);
            db.findOne({
                relatedId: id,
                temporaryEntry: true,
                type: 'needs_info_comment'
            }, (err, doc) => {
                console.log(doc);
                if (doc) {
                    this.logger.info(`Deleting comment (${doc.type}) with ID : ${doc.selfId}`);
                    this.deleteComment(doc.selfId);
                    db.remove({ _id: doc._id });
                }
            });
        }
    }
};