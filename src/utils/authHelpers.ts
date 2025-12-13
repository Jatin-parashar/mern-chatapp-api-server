import { createAccessToken, createRefreshToken } from "./auth.js";
import { UserPayload } from "../types/user.js";

export const createTokenPair = (user: UserPayload) => ({
  accessToken: createAccessToken(user),
  refreshToken: createRefreshToken(user)
});