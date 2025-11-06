import mongoose, { Document, Schema } from "mongoose";

export interface IConnection extends Document {
  _id: string;
  followerId: mongoose.Types.ObjectId;
  followingId: mongoose.Types.ObjectId;
  status: "pending" | "accepted" | "blocked";
  createdAt: Date;
  updatedAt: Date;
}

const ConnectionSchema = new Schema<IConnection>(
  {
    followerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    followingId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "blocked"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate connections
ConnectionSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

export default mongoose.models.Connection ||
  mongoose.model<IConnection>("Connection", ConnectionSchema);
