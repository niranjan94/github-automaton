import { ILabel } from './label';
import { IUser } from './user';

export interface IIssue {
  url: string;
  labels_url: string;
  comments_url: string;
  events_url: string;
  html_url: string;
  id: number;
  number: number;
  title: string;
  state: string;
  locked: boolean;
  assignee?: any;
  milestone?: any;
  comments: number;
  created_at: string;
  updated_at: string;
  closed_at?: any;
  body: string;

  user: IUser;
  labels: ILabel[];
}
