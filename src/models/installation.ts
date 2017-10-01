import { Document, Model, model, Schema } from 'mongoose';
import { IUserModel, userSchema } from './user';

export interface IInstallationModel extends Document {
  account: IUserModel;
  expiresAt: string;
  installationId: number;
  token: string;
  username: string;
  appId: number;
  targetId: number;
  targetType: string;
  htmlUrl: string;
}

const installationSchema: Schema = new Schema({
  account: userSchema as any,
  appId: Number,
  expiresAt: String,
  htmlUrl: String,
  installationId: Number,
  targetId: Number,
  targetType: String,
  token: String,
  username: String
});

export const Installation: Model<IInstallationModel> = model<IInstallationModel>('Installation', installationSchema);
