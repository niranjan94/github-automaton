import { Document, Model, model, Schema } from 'mongoose';

export interface IOperationModel extends Document {
  relatedId: string;
  selfId: string | number;
  temporaryEntry: boolean;
  type: string;
}

const operationSchema: Schema = new Schema({
  relatedId: String,
  selfId: String,
  temporaryEntry: Boolean,
  type: String
});

export const Operation: Model<IOperationModel> = model<IOperationModel>('Operation', operationSchema);
