import { HandlerBase, IBasicData } from '../base';
import { IPullRequest } from '../../interfaces/pull-request';

export default class extends HandlerBase {
  handle() {
    const { primary: { number, user: { login }, base } } = this.getBasicData() as IBasicData<IPullRequest>;
    this.logger.info(`Adding needs-review label on new PR: ${number}`);
    this.replaceLabels(['needs-review']);
    const { repository } = this.payload;
    console.log(`https://github.com/${repository.full_name}`);
    console.log(number, login, base.ref);
  }
};