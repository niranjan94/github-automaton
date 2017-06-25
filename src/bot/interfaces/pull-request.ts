import { IBaseHead } from './base-head';
import { ILink } from './link';
import { IUser } from './user';

export interface IPullRequestLinks {
  self: ILink;
  html: ILink;
  issue: ILink;
  comments: ILink;
  review_comments: ILink;
  review_comment: ILink;
  commits: ILink;
  statuses: ILink;
}

export interface IPullRequest {
  url: string;
  id: number;
  html_url: string;
  diff_url: string;
  patch_url: string;
  issue_url: string;
  number: number;
  state: string;
  locked: boolean;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
  closed_at?: any;
  merged_at?: any;
  merge_commit_sha?: any;
  assignee?: any;
  milestone?: any;
  commits_url: string;
  review_comments_url: string;
  review_comment_url: string;
  comments_url: string;
  statuses_url: string;
  merged: boolean;
  mergeable?: boolean;
  rebaseable?: boolean;
  mergeable_state: string;
  merged_by?: any;
  comments: number;
  review_comments: number;
  commits: number;
  additions: number;
  deletions: number;
  changed_files: number;

  user: IUser;
  head: IBaseHead;
  base: IBaseHead;
  _links: IPullRequestLinks;
}
