import mongoose, { Document, Schema } from "mongoose";

export interface IApplication extends Document {
  _id: string;
  jobId: mongoose.Types.ObjectId;
  candidateId: mongoose.Types.ObjectId;
  resumeUrl?: string;
  coverLetter?: string;
  status: "pending" | "reviewed" | "accepted" | "rejected";
  notes?: string;
  appliedAt: Date;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema = new Schema<IApplication>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "Vacancy",
      required: true,
    },
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resumeUrl: String,
    coverLetter: {
      type: String,
      maxlength: [
        1000,
        "Carta de apresentação deve ter no máximo 1000 caracteres",
      ],
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "accepted", "rejected"],
      default: "pending",
    },
    notes: String,
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate applications
ApplicationSchema.index({ jobId: 1, candidateId: 1 }, { unique: true });

export default mongoose.models.Application ||
  mongoose.model<IApplication>("Application", ApplicationSchema);
