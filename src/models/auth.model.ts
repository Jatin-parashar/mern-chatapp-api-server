import mongoose, { model, Schema } from "mongoose";
import { IAuthCredential } from "../types/models.js";

const authCredentialSchema = new Schema<IAuthCredential>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const AuthCredential =
  mongoose.models.AuthCredential ||
  model("AuthCredential", authCredentialSchema);
export default AuthCredential;
