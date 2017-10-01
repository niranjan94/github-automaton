import { Document, Model, model, Schema } from 'mongoose';

export interface IUserModel extends Document {
  avatarUrl: string;
  htmlUrl: string;
  userId: number;
  login: string;
  siteAdmin: boolean;
  type: string;
}

export const userSchema: Schema = new Schema({
  avatarUrl: String,
  htmlUrl: String,
  login: String,
  siteAdmin: Boolean,
  type: String,
  userId: Number
});

export const User: Model<IUserModel> = model<IUserModel>('User', userSchema);
