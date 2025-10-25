import mongoose, { model, Schema } from "mongoose";
import { IMessage } from "../types/models.js";

const messageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: { type: String, trim: true },
    messageType: {
      type: String,
      enum: ["text", "image", "video", "audio", "document", "file"],
      default: "text",
    },
    attachments: [
      {
        url: String,
        publicId: String,
        originalName: String,
        mimeType: String,
        size: Number,
      },
    ],
    replyTo: { type: Schema.Types.ObjectId, ref: "Message" },
    seenBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  {
    timestamps: true,
  }
);

// Add compound index for common queries
messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ conversationId: 1, sender: 1 });

const Message = mongoose.models.Message || model("Message", messageSchema);
export default Message;
