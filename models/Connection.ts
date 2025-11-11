import mongoose, { Document, Schema } from "mongoose";

export interface IConnection extends Document {
  _id: string;
  followerId: mongoose.Types.ObjectId; // Quem segue
  followingId: mongoose.Types.ObjectId; // Quem é seguido (pode ser User ou Company)
  type: "user" | "company"; // Tipo do seguido
  typeModel?: "User" | "Company"; // Modelo para refPath
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
      refPath: "typeModel",
      required: true,
    },
    type: {
      type: String,
      enum: ["user", "company"],
      required: true,
      default: "user",
    },
    typeModel: {
      type: String,
      enum: ["User", "Company"],
      required: true,
      default: "User",
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "blocked"],
      default: "accepted", // Para seguir, aceito automaticamente
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate connections
ConnectionSchema.index({ followerId: 1, followingId: 1, type: 1 }, { unique: true });

export default mongoose.models.Connection ||
  mongoose.model<IConnection>("Connection", ConnectionSchema);
