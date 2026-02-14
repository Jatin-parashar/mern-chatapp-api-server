import mongoose, { model, Schema } from "mongoose";
import { IConversation } from "../types/models.js";
import { MODEL_NAMES } from "../config/constants.js";

const conversationSchema = new Schema<IConversation>(
  {
    isGroup: { type: Boolean, default: false, index: true },
    name: String,
    participants: [{ type: Schema.Types.ObjectId, ref: MODEL_NAMES.USER }],
    admins: [{ type: Schema.Types.ObjectId, ref: MODEL_NAMES.USER }],
    lastMessage: { type: Schema.Types.ObjectId, ref: MODEL_NAMES.MESSAGE },
  },
  {
    timestamps: true,
  }
);

// Add indexes for common queries
conversationSchema.index({ participants: 1 });
conversationSchema.index({ participants: 1, updatedAt: -1 });
conversationSchema.index({ isGroup: 1, participants: 1 });

const Conversation =
  mongoose.models.Conversation || model(MODEL_NAMES.CONVERSATION, conversationSchema);
export default Conversation;
