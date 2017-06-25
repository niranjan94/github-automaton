import { IUser } from './user';

export interface IInnerCommit {
  author: {
    name: string,
    email: string,
    date: string
  };
  committer: {
    name: string,
    email: string,
    date: string
  };
  message: string;
  tree: {
    sha: string,
    url: string
  };
  url: string;
  comment_count: number;
}

export interface ICommit {
  sha: string;
  url: string;
  html_url?: string;
  comments_url?: string;
  commit?: IInnerCommit;
  author?: IUser;
  committer?: IUser;
  parents?: any[];
}
