import mongoose, { Document, Schema } from "mongoose";

export interface INotification extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  type:
    | "like"
    | "comment"
    | "connection"
    | "job"
    | "message"
    | "company_invite";
  title: string;
  message: string;
  link?: string;
  read: boolean;
  accepted?: boolean;
  relatedUserId?: mongoose.Types.ObjectId;
  relatedPostId?: mongoose.Types.ObjectId;
  metadata?: {
    companyId?: mongoose.Types.ObjectId;
    inviteId?: mongoose.Types.ObjectId;
    role?: string;
    invitedBy?: mongoose.Types.ObjectId;
  };
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "like",
        "comment",
        "connection",
        "job",
        "message",
        "company_invite",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    link: String,
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    accepted: {
      type: Boolean,
      default: undefined,
    },
    relatedUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    relatedPostId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
    },
    metadata: {
      companyId: {
        type: Schema.Types.ObjectId,
        ref: "Company",
      },
      inviteId: {
        type: Schema.Types.ObjectId,
        ref: "Invite",
      },
      role: String,
      invitedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index para buscar notificações não lidas rapidamente
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export default mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);
