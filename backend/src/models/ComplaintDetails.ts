import mongoose, { Schema, Document } from 'mongoose';

export interface IComplaintDetails extends Document {
  complaintId: number;
  description: string;
  imageUrl: string;
  resolutionImageUrl?: string | null;
}

const ComplaintDetailsSchema: Schema = new Schema({
  complaintId: { type: Number, required: true, unique: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  resolutionImageUrl: { type: String, default: null },
});

export default mongoose.model<IComplaintDetails>('ComplaintDetails', ComplaintDetailsSchema);
