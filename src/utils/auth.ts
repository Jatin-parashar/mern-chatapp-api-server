import { compare, hash } from "bcrypt";
import jwt from "jsonwebtoken";
import { UserPayload } from "../types/user.js";
import { ACCESS_JWT_SECRET, REFRESH_JWT_SECRET } from "../config/envConfig.js";

const { sign, verify } = jwt;
const saltRounds = 10;

export const createAccessToken = (user: UserPayload): string =>
  sign(user, ACCESS_JWT_SECRET, { expiresIn: "1hr" });

export const createRefreshToken = (user: UserPayload): string =>
  sign(user, REFRESH_JWT_SECRET, { expiresIn: "7d" });

export const validateAccessToken = (token: string): string | jwt.JwtPayload => {
  return verify(token, ACCESS_JWT_SECRET);
};

export const validateRefreshToken = (
  token: string
): string | jwt.JwtPayload => {
  return verify(token, REFRESH_JWT_SECRET);
};

export const hashPassword = async (password: string): Promise<string> => {
  return await hash(password, saltRounds);
};

export const verifyPassword = async (
  password: string,
  hashedPasswordFromDB: string
): Promise<boolean> => {
  return await compare(password, hashedPasswordFromDB);
};
