import mongoose, { model, Schema } from "mongoose";
import { IConversation } from "../types/models.js";

const conversationSchema = new Schema<IConversation>(
  {
    isGroup: { type: Boolean, default: false, index: true },
    name: String,
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    admins: [{ type: Schema.Types.ObjectId, ref: "User" }],
    lastMessage: { type: Schema.Types.ObjectId, ref: "Message" },
  },
  {
    timestamps: true,
  }
);

// ✅ Add indexes for common queries
conversationSchema.index({ participants: 1 });
conversationSchema.index({ participants: 1, updatedAt: -1 });
conversationSchema.index({ isGroup: 1, participants: 1 });

const Conversation =
  mongoose.models.Conversation || model("Conversation", conversationSchema);
export default Conversation;
