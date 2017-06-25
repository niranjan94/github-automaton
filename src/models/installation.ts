import { Document, Model, model, Schema } from 'mongoose';

export interface IInstallationModel extends Document {
  installationId: number,
  token: string,
  expiresAt: number,
  username: string
}

const InstallationSchema: Schema = new Schema({
  installationId: Number,
  token: String,
  expiresAt: Number,
  username: String
});

export const Installation: Model<IInstallationModel> = model<IInstallationModel>('Installation', InstallationSchema);
