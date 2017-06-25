import { IRepository } from './repository';
import { IUser } from './user';

export interface IBaseHead {
  label: string;
  ref: string;
  sha: string;

  user: IUser;
  repo: IRepository;
}
