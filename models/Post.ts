import mongoose, { Document, Schema } from "mongoose";

export type ReactionType = "like" | "celebrate" | "support" | "interesting" | "funny" | "love";

export interface IPost extends Document {
  _id: string;
  authorId: mongoose.Types.ObjectId;
  content?: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  mediaUrls?: string[]; // Para múltiplas imagens
  reactions: Array<{
    userId?: mongoose.Types.ObjectId;
    companyId?: mongoose.Types.ObjectId;
    type: ReactionType;
  }>;
  likes?: mongoose.Types.ObjectId[]; // Mantido para compatibilidade durante migração
  commentsCount: number;
  sharesCount: number;
  isJobPost: boolean;
  jobId?: mongoose.Types.ObjectId;
  hashtags: string[];
  mentions: mongoose.Types.ObjectId[];
  isHighlighted?: boolean;
  highlightedBy?: mongoose.Types.ObjectId;
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
      default: "",
      maxlength: [2000, "Conteúdo deve ter no máximo 2000 caracteres"],
    },
    mediaUrl: String,
    mediaType: {
      type: String,
      enum: ["image", "video"],
    },
    mediaUrls: [String], // Para múltiplas imagens
    reactions: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: false,
        },
        companyId: {
          type: Schema.Types.ObjectId,
          ref: "Company",
          required: false,
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
    ], // Mantido para compatibilidade durante migração
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
      ref: "Vacancy",
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
    isHighlighted: {
      type: Boolean,
      default: false,
    },
    highlightedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Validação: userId OU companyId deve existir (não ambos, não nenhum)
PostSchema.path("reactions").validate(function (reactions: any[]) {
  if (!reactions || reactions.length === 0) return true;
  
  return reactions.every((reaction) => {
    const hasUserId = !!reaction.userId;
    const hasCompanyId = !!reaction.companyId;
    return (hasUserId && !hasCompanyId) || (!hasUserId && hasCompanyId);
  });
}, "Reaction must have either userId or companyId, but not both");

export default mongoose.models.Post ||
  mongoose.model<IPost>("Post", PostSchema);
