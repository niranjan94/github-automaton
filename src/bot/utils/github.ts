import * as GitHubApi from 'github';

export class GitHub {

  private static options = {
    debug: false,
    protocol: 'https',
    headers: {
      'user-agent': process.env.USER_AGENT
    }
  };

  public static createInstance(): GitHubApi {
    return new GitHubApi(GitHub.options);
  }
}