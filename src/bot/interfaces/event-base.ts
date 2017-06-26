import { IBranch } from './branch';
import { IComment } from './comment';
import { ICommit } from './commit';
import { IInstallation } from './installation';
import { IIssue } from './issue';
import { ILabel } from './label';
import { IPullRequest } from './pull-request';
import { IRepository } from './repository';
import { IReview } from './review';
import { IUser } from './user';

export interface IEventBase {
  id?: number;
  sha?: string;
  name?: string;
  action?: string;
  number?: number;
  target_url?: string;
  context: string;
  description?: any;
  state: string;
  repository_selection?: string;

  created_at?: string;
  updated_at?: string;

  label?: ILabel;
  comment?: IComment;
  commit?: ICommit;
  branches?: IBranch[];
  pull_request?: IPullRequest;
  issue?: IIssue;
  review?: IReview;
  repository?: IRepository;
  sender: IUser;
  installation?: IInstallation;
  repositories_added?: IRepository[];
  repositories_removed?: IRepository[];
}
