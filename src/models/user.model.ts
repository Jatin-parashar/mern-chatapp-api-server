import mongoose, { model, Schema } from "mongoose";
import { IUser } from "../types/models.js";

const userSchema = new Schema<IUser>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    profilePic: { type: String, default: "" },
    status: { type: String, default: "Hey there! I am using ChatApp" },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ name: 1 });

const User = mongoose.models.User || model("User", userSchema);
export default User;
