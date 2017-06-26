import { IUser } from './user';

export interface IInstallationPermissions {
  pull_requests?: string;
  contents?: string;
  repository_projects?: string;
  deployments?: string;
  statuses?: string;
  issues?: string;
  pages?: string;
  administration?: string;
  metadata?: string;
}

export interface IInstallation {
  id: number;
  account?: IUser;
  repository_selection?: string;
  access_tokens_url?: string;
  repositories_url?: string;
  html_url?: string;
  app_id?: number;
  target_id?: number;
  target_type?: string;
  permissions?: IInstallationPermissions;
  events?: string[];
  created_at?: number;
  updated_at?: number;
  single_file_name?: any;
}
