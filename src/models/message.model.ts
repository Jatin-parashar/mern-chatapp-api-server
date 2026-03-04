import mongoose, { model, Schema } from "mongoose";
import { IMessage } from "../types/models.js";
import { MESSAGE_TYPES, MODEL_NAMES, MESSAGE_DEFAULTS } from "../config/constants.js";

const messageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: MODEL_NAMES.CONVERSATION,
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: MODEL_NAMES.USER,
      required: true,
      index: true,
    },
    content: { type: String, trim: true },
    messageType: {
      type: String,
      enum: MESSAGE_TYPES,
      default: MESSAGE_DEFAULTS.TYPE,
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
    replyTo: { type: Schema.Types.ObjectId, ref: MODEL_NAMES.MESSAGE },
    deliveredTo: [{ type: Schema.Types.ObjectId, ref: MODEL_NAMES.USER }],
    seenBy: [{ type: Schema.Types.ObjectId, ref: MODEL_NAMES.USER }],
  },
  {
    timestamps: true,
  }
);

// Add compound index for common queries
messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ conversationId: 1, sender: 1 });
messageSchema.index({ conversationId: 1, deliveredTo: 1 });
messageSchema.index({ conversationId: 1, seenBy: 1 });
messageSchema.index({ conversationId: 1, sender: 1, deliveredTo: 1 });

const Message = mongoose.models.Message || model(MODEL_NAMES.MESSAGE, messageSchema);
export default Message;
