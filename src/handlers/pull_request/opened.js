import Base from '../base'

export default class extends Base {
    handle() {

        const { innerPayload: { number, user: { login }, base } } = this.getInnerPayload();
        this.logger.info(`Adding needs-review label on new PR: ${number}`);
        this.replaceLabels(['needs-review']);

        const { repository } = this.payload;

        console.log(`https://github.com/${repository.full_name}`);
        console.log(number, login, base.ref);
    }
};