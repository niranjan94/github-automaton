import { ILink } from './link';
import { IUser } from './user';

interface IReviewLinks {
  html: ILink;
  pull_request: ILink;
}

export interface IReview {
  id: number;
  body: string;
  submitted_at: string;
  state: string;
  html_url: string;
  pull_request_url: string;
  number?: number; // Does not exist
  user: IUser;
  _links: IReviewLinks;
}
