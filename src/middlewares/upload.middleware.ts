import { NextFunction, Response } from "express";
import AppError from "../utils/appError.js";
import logger from "../utils/logger.js";
import { FileRequest } from "../types/express.js";

interface CloudinaryFile extends Express.Multer.File {
  width?: number;
  height?: number;
  duration?: number;
}

/**
 * Middleware to process uploaded files and prepare attachment data
 */
export const processUploadedFiles = (
  req: FileRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    let attachments: any[] = [];

    if (req.files) {
      if (Array.isArray(req.files)) {
        // Multiple files via upload.array
        attachments = req.files.map((file: CloudinaryFile) =>
          createAttachment(file)
        );
      } else {
        // Multiple fields via upload.fields
        for (const field in req.files) {
          attachments.push(
            ...req.files[field].map((file: CloudinaryFile) =>
              createAttachment(file)
            )
          );
        }
      }

      req.body.attachments = attachments;

      if (!req.body.messageType && attachments.length > 0) {
        const firstMimeType = attachments[0].mimeType;

        if (firstMimeType.startsWith("image/")) {
          req.body.messageType = "image";
        } else if (firstMimeType.startsWith("video/")) {
          req.body.messageType = "video";
        } else if (firstMimeType.startsWith("audio/")) {
          req.body.messageType = "audio";
        } else if (
          firstMimeType === "application/pdf" ||
          firstMimeType === "application/msword" ||
          firstMimeType ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
          firstMimeType === "application/vnd.ms-excel" ||
          firstMimeType ===
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
          firstMimeType === "application/vnd.ms-powerpoint" ||
          firstMimeType ===
            "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
          firstMimeType === "text/plain"
        ) {
          req.body.messageType = "document";
        } else {
          req.body.messageType = "file";
        }
      }

      logger.debug(`Processed ${attachments.length} file(s) for message`);
    }

    next();
  } catch (error) {
    logger.error({ error }, "Error processing uploaded files");
    next(new AppError("Failed to process uploaded files", 500));
  }
};

// Helper function to create attachment object
const createAttachment = (file: CloudinaryFile) => {
  const attachment: any = {
    url: file.path,
    publicId: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
  };

  if (file.width && file.height) {
    attachment.dimensions = { width: file.width, height: file.height };
  }

  if (file.duration) {
    attachment.duration = file.duration;
  }

  return attachment;
};
