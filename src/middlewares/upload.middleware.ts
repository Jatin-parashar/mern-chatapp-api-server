import { NextFunction, Response } from "express";
import AppError from "../utils/appError.js";
import logger from "../utils/logger.js";
import { FileRequest } from "../types/express.js";
import { sanitizeFilename } from "../utils/sanitization.js";

const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.sh', '.ps1', '.msi', '.app', '.deb', '.rpm',
  '.dmg', '.pkg', '.run', '.bin', '.com', '.scr', '.vbs', '.js', '.jar'
];

const FILE_SIZE_LIMITS: Record<string, number> = {
  image: 10 * 1024 * 1024,    // 10MB
  video: 50 * 1024 * 1024,    // 50MB
  document: 25 * 1024 * 1024, // 25MB
  default: 25 * 1024 * 1024   // 25MB
};

const MIME_TYPE_EXTENSIONS: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'video/mp4': ['.mp4'],
  'video/webm': ['.webm'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

interface CloudinaryFile extends Express.Multer.File {
  width?: number;
  height?: number;
  duration?: number;
}

const validateFile = (file: CloudinaryFile): void => {
  const ext = file.originalname.toLowerCase().match(/\.[^.]+$/)?.[0] || '';
  
  // Block dangerous extensions
  if (DANGEROUS_EXTENSIONS.includes(ext)) {
    throw new AppError(`File type ${ext} is not allowed`, 400);
  }
  
  // Validate MIME type matches extension
  const allowedExts = MIME_TYPE_EXTENSIONS[file.mimetype];
  if (allowedExts && !allowedExts.includes(ext)) {
    throw new AppError('File extension does not match MIME type', 400);
  }
  
  // Validate file size
  let sizeLimit = FILE_SIZE_LIMITS.default;
  if (file.mimetype.startsWith('image/')) sizeLimit = FILE_SIZE_LIMITS.image;
  else if (file.mimetype.startsWith('video/')) sizeLimit = FILE_SIZE_LIMITS.video;
  else if (file.mimetype.includes('pdf') || file.mimetype.includes('document')) {
    sizeLimit = FILE_SIZE_LIMITS.document;
  }
  
  if (file.size > sizeLimit) {
    throw new AppError(`File size exceeds limit of ${sizeLimit / 1024 / 1024}MB`, 400);
  }
};

export const processUploadedFiles = (
  req: FileRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    let attachments: any[] = [];

    if (req.files) {
      if (Array.isArray(req.files)) {
        // Multiple files via upload.array
        req.files.forEach(validateFile);
        attachments = req.files.map((file: CloudinaryFile) =>
          createAttachment(file)
        );
      } else {
        // Multiple fields via upload.fields
        for (const field in req.files) {
          req.files[field].forEach(validateFile);
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
    logger.error({ err: error }, "Error processing uploaded files");
    next(new AppError("Failed to process uploaded files", 500));
  }
};

// Helper function to create attachment object
const createAttachment = (file: CloudinaryFile) => {
  const attachment: any = {
    url: file.path,
    publicId: file.filename,
    originalName: sanitizeFilename(file.originalname),
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
