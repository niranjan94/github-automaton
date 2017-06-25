import { Document, Model, model, Schema } from 'mongoose';

export interface IOperationModel extends Document {
  relatedId: string,
  temporaryEntry: boolean,
  type: string,
  selfId: string | number
}

const OperationSchema: Schema = new Schema({
  relatedId: String,
  temporaryEntry: Boolean,
  type: String,
  selfId: String
});

export const Operation: Model<IOperationModel> = model<IOperationModel>('Operation', OperationSchema);
