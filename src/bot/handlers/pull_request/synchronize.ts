import { HandlerBase } from '../base';

export default class extends HandlerBase {
  public handle() {
    // const {primary: {number}} = this.getBasicData() as IBasicData<IPullRequest>;
    // const {repository} = this.payload;

    /* this.github.pullRequests.get({
      number,
      owner: repository.owner.login,
      repo: repository.name
    }).then((response: IApiResponse<IPullRequest>) => {
      const {mergeable, rebaseable} = response.data;
      if (!mergeable && !rebaseable) {
        this.addComments([Messages.prHasConflicts()]);
      } else if (!rebaseable) {
        this.addComments([Messages.prCannotBeRebased()]);
      }
    }); */
  }
}
