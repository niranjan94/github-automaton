import { IUser } from './user';

export interface IComment {
  url: string;
  html_url: string;
  issue_url: string;
  id: number;
  user: IUser;
  created_at: string;
  updated_at: string;
  body: string;
}

