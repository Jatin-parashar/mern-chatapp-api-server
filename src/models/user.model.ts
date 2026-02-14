import mongoose, { model, Schema } from "mongoose";
import { IUser } from "../types/models.js";
import { MODEL_NAMES, USER_DEFAULTS } from "../config/constants.js";

const userSchema = new Schema<IUser>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      ref: MODEL_NAMES.AUTH,
      required: true,
    },
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    profilePic: { type: String, default: USER_DEFAULTS.PROFILE_PIC },
    status: { type: String, default: USER_DEFAULTS.STATUS },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ name: 1 });

const User = mongoose.models.User || model(MODEL_NAMES.USER, userSchema);
export default User;
