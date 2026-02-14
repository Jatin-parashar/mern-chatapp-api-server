import { compare, hash } from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { UserPayload } from "../types/user.js";
import { ACCESS_JWT_SECRET, REFRESH_JWT_SECRET, ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from "../config/envConfig.js";
import { BCRYPT_SALT_ROUNDS } from "../config/constants.js";

const { sign, verify } = jwt;

export const createAccessToken = (user: UserPayload): string =>
  sign(user, ACCESS_JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY } as SignOptions);

export const createRefreshToken = (user: UserPayload): string =>
  sign(user, REFRESH_JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY } as SignOptions);

export const validateAccessToken = (token: string): string | jwt.JwtPayload => {
  return verify(token, ACCESS_JWT_SECRET);
};

export const validateRefreshToken = (
  token: string
): string | jwt.JwtPayload => {
  return verify(token, REFRESH_JWT_SECRET);
};

export const hashPassword = async (password: string): Promise<string> => {
  return await hash(password, BCRYPT_SALT_ROUNDS);
};

export const verifyPassword = async (
  password: string,
  hashedPasswordFromDB: string
): Promise<boolean> => {
  return await compare(password, hashedPasswordFromDB);
};
