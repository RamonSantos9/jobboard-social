import mongoose, { Document, Schema } from "mongoose";

export type InteractionItemType = "job" | "post";
export type InteractionType =
  | "view"
  | "click"
  | "save"
  | "apply"
  | "like"
  | "comment"
  | "share"
  | "dismiss";

export interface IUserInteraction extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  itemType: InteractionItemType;
  itemId: mongoose.Types.ObjectId;
  interactionType: InteractionType;
  duration?: number; // Tempo em segundos (para views)
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserInteractionSchema = new Schema<IUserInteraction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    itemType: {
      type: String,
      enum: ["job", "post"],
      required: true,
      index: true,
    },
    itemId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    interactionType: {
      type: String,
      enum: ["view", "click", "save", "apply", "like", "comment", "share", "dismiss"],
      required: true,
      index: true,
    },
    duration: {
      type: Number,
      default: 0,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índices compostos para queries eficientes
UserInteractionSchema.index({ userId: 1, itemType: 1, timestamp: -1 });
UserInteractionSchema.index({ itemId: 1, interactionType: 1 });
UserInteractionSchema.index({ userId: 1, itemId: 1, interactionType: 1 });

export default mongoose.models.UserInteraction ||
  mongoose.model<IUserInteraction>("UserInteraction", UserInteractionSchema);

