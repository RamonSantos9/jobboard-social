import mongoose, { Document, Schema } from "mongoose";

export interface IPost extends Document {
  _id: string;
  authorId: mongoose.Types.ObjectId;
  content: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  mediaUrls?: string[]; // Para múltiplas imagens
  likes: mongoose.Types.ObjectId[];
  commentsCount: number;
  sharesCount: number;
  isJobPost: boolean;
  jobId?: mongoose.Types.ObjectId;
  hashtags: string[];
  mentions: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: [true, "Conteúdo é obrigatório"],
      maxlength: [2000, "Conteúdo deve ter no máximo 2000 caracteres"],
    },
    mediaUrl: String,
    mediaType: {
      type: String,
      enum: ["image", "video"],
    },
    mediaUrls: [String], // Para múltiplas imagens
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    commentsCount: {
      type: Number,
      default: 0,
    },
    sharesCount: {
      type: Number,
      default: 0,
    },
    isJobPost: {
      type: Boolean,
      default: false,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "Job",
    },
    hashtags: [
      {
        type: String,
        trim: true,
      },
    ],
    mentions: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Post ||
  mongoose.model<IPost>("Post", PostSchema);
