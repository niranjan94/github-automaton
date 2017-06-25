import { Document, Model, model, Schema } from 'mongoose';

export interface IInstallationModel extends Document {
  expiresAt: number;
  installationId: number;
  token: string;
  username: string;
}

const installationSchema: Schema = new Schema({
  expiresAt: Number,
  installationId: Number,
  token: String,
  username: String,
});

export const Installation: Model<IInstallationModel> = model<IInstallationModel>('Installation', installationSchema);
