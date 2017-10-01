import * as GitHubApi from 'github';

export class GitHub {

  private static options = {
    debug: false,
    headers: {
      'user-agent': process.env.USER_AGENT
    },
    protocol: 'https'
  };

  public static createInstance(): GitHubApi {
    return new GitHubApi(GitHub.options);
  }
}
