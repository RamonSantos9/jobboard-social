import mongoose, { Document, Schema } from "mongoose";

export interface IMessage extends Document {
  _id: string;
  senderId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  content: string;
  postId?: mongoose.Types.ObjectId; // Post anexado (opcional)
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, "Conteúdo da mensagem é obrigatório"],
      maxlength: [2000, "Mensagem deve ter no máximo 2000 caracteres"],
    },
    postId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índices para busca eficiente
MessageSchema.index({ senderId: 1, createdAt: -1 });
MessageSchema.index({ recipientId: 1, read: 1, createdAt: -1 });

export default mongoose.models.Message ||
  mongoose.model<IMessage>("Message", MessageSchema);

