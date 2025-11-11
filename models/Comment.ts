import mongoose, { Document, Schema } from "mongoose";
import type { ReactionType } from "./Post";

export interface IComment extends Document {
  _id: string;
  postId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  content: string;
  reactions: Array<{
    userId: mongoose.Types.ObjectId;
    type: ReactionType;
  }>;
  likes: mongoose.Types.ObjectId[]; // Mantido para compatibilidade
  replies: mongoose.Types.ObjectId[];
  parentCommentId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: [true, "Conteúdo do comentário é obrigatório"],
      maxlength: [500, "Comentário deve ter no máximo 500 caracteres"],
    },
    reactions: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        type: {
          type: String,
          enum: ["like", "celebrate", "support", "interesting", "funny", "love"],
          required: true,
        },
      },
    ],
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ], // Mantido para compatibilidade
    replies: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    parentCommentId: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Comment ||
  mongoose.model<IComment>("Comment", CommentSchema);
