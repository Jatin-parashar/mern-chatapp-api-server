import mongoose, { model, Schema, UpdateQuery } from "mongoose";
import { ICall } from "../types/models.js";

const callSchema = new Schema<ICall>({
  callId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true,
  },
  caller: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    index: true,
  },
  receiver: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    index: true,
  },
  isVideoCall: { 
    type: Boolean, 
    default: false 
  },
  status: {
    type: String,
    enum: ['calling', 'accepted', 'declined', 'ended', 'missed'],
    default: 'calling',
    index: true,
  },
  duration: { 
    type: Number, // in seconds
    default: 0 
  },
  startedAt: { 
    type: Date, 
    default: Date.now,
    index: true,
  },
  endedAt: Date,
}, { 
  timestamps: true 
});

// Compound indexes
callSchema.index({ caller: 1, createdAt: -1 });
callSchema.index({ receiver: 1, createdAt: -1 });
callSchema.index({ status: 1, createdAt: -1 });

// Pre-save hook
callSchema.pre('save', function (next) {
  if (this.endedAt && this.startedAt) {
    this.duration = Math.floor((this.endedAt.getTime() - this.startedAt.getTime()) / 1000);
  }
  next();
});

// Pre findOneAndUpdate hook (TS-safe)
callSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate() as UpdateQuery<ICall> | null;
  if (!update) return next();

  // Determine endedAt value
  const endedAt = update.endedAt || update.$set?.endedAt;
  if (!endedAt) return next();

  // Fetch current document
  const docToUpdate = await this.model.findOne(this.getQuery());
  if (!docToUpdate?.startedAt) return next();

  // Calculate duration
  const endedDate = new Date(endedAt);
  const duration = Math.floor((endedDate.getTime() - docToUpdate.startedAt.getTime()) / 1000);

  // Attach duration to update
  if (!update.$set) update.$set = {};
  update.$set.duration = duration;

  this.setUpdate(update);

  next();
});

const Call = mongoose.models.Call || model<ICall>("Call", callSchema);
export default Call;