import { Request } from "express";

export interface AuthRequest extends Request {
  user?: {
    email: string;
    _id: string;
  };
}

export interface FileRequest extends Request {
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
}

export interface AuthFileRequest extends AuthRequest, FileRequest {}
