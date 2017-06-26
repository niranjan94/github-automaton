import { IPullRequest } from '../../interfaces/pull-request';
import { Messages } from '../../messages';
import { HandlerBase, IBasicData } from '../base';

export default class extends HandlerBase {
  public handle() {
    const {primary: {number, user: {login}, base}} = this.getBasicData() as IBasicData<IPullRequest>;
    this.replaceLabels(['needs-review']);
    const {repository} = this.payload;
    this.assignUsersToIssue([login]);
    if (process.env.STANDARD_REVIEWERS && process.env.STANDARD_REVIEWERS.trim() !== '') {
      console.log(`https://github.com/${repository.full_name}`);
      console.log(number, login, base.ref);
      const reviewers = process.env.STANDARD_REVIEWERS.split(',').filter((user) => user !== login);
      // Looks like this isn't supported in integrations yet. Let's just add a comment. :)
      // this.createPrReviewRequest(reviewers);
      this.addPlainComment(Messages.reviewPlease(reviewers));
    }
  }
}
