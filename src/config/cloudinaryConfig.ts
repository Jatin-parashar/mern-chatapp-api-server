import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import logger from "../utils/logger.js";
import AppError from "../utils/appError.js";

export function cloudinaryConfig() {
  // Configure using individual credentials
  // Alternative: Use CLOUDINARY_URL env variable (cloudinary://api_key:api_secret@cloud_name)
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Allowed resource types for Cloudinary
type CloudinaryResourceType = "image" | "video" | "raw" | "auto";

// File type validation
const ALLOWED_MIME_TYPES = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  video: ["video/mp4", "video/webm", "video/quicktime"],
  audio: ["audio/mpeg", "audio/wav", "audio/ogg"],
  document: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
  ],
};

const DANGEROUS_EXTENSIONS = [
  ".exe", ".bat", ".cmd", ".sh", ".ps1", ".msi", ".app", ".deb", ".rpm",
  ".dmg", ".pkg", ".run", ".bin", ".com", ".scr", ".vbs", ".js", ".jar"
];

// File filter for multer
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check for dangerous extensions
  const ext = file.originalname.toLowerCase().match(/\.[^.]+$/)?.[0] || "";
  if (DANGEROUS_EXTENSIONS.includes(ext)) {
    return cb(new AppError(`File type ${ext} is not allowed for security reasons`, 400));
  }

  // Check MIME type
  const allAllowedTypes = Object.values(ALLOWED_MIME_TYPES).flat();
  if (!allAllowedTypes.includes(file.mimetype)) {
    return cb(new AppError(`File type ${file.mimetype} is not supported`, 400));
  }

  cb(null, true);
};

const profileFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (!ALLOWED_MIME_TYPES.image.includes(file.mimetype)) {
    return cb(new AppError("Only image files are allowed for profile pictures", 400));
  }
  cb(null, true);
};

// Storage for chat attachments (images, videos, documents, etc.)
export const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req: any, file) => {
    const conversationId = req.body.conversationId || 'unknown';
    const userId = req.user?._id?.toString() || 'unknown';
    const messageId = req.body.messageId || Date.now().toString();
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    let folder = `chatAppUploads/conversations/${conversationId}/${year}/${month}`;
    let resourceType: CloudinaryResourceType = "auto";
    let allowedFormats = [];
    let fileType = 'file';

    // Determine folder and settings based on file type
    if (file.mimetype.startsWith("image/")) {
      allowedFormats = ["jpg", "png", "jpeg", "gif", "webp", "svg"];
      fileType = 'image';
    } else if (file.mimetype.startsWith("video/")) {
      resourceType = "video";
      allowedFormats = ["mp4", "mov", "avi", "mkv", "webm"];
      fileType = 'video';
    } else if (file.mimetype.startsWith("audio/")) {
      resourceType = "video";
      allowedFormats = ["mp3", "wav", "ogg", "m4a"];
      fileType = 'audio';
    } else {
      resourceType = "raw";
      allowedFormats = [
        "pdf",
        "doc",
        "docx",
        "xls",
        "xlsx",
        "ppt",
        "pptx",
        "txt",
        "zip",
        "rar",
      ];
      fileType = 'document';
    }

    return {
      folder: folder,
      allowed_formats: allowedFormats,
      resource_type: resourceType,
      tags: [
        `conversation:${conversationId}`,
        `user:${userId}`,
        `type:${fileType}`,
        `year:${year}`,
        `month:${month}`
      ],
      context: {
        conversationId: conversationId,
        messageId: messageId,
        senderId: userId,
        uploadDate: now.toISOString(),
        fileType: fileType
      }
    };
  },
});

// Storage for profile pictures
export const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req: any) => {
    const userId = req.body.username || 'unknown';
    return {
      folder: `chatAppUploads/users/${userId}`,
      allowed_formats: ["jpg", "png", "jpeg", "gif", "webp"],
      resource_type: "image",
      public_id: 'avatar',
      tags: [`user:${userId}`, 'type:avatar'],
      context: {
        userId: userId,
        uploadType: 'profile',
        uploadDate: new Date().toISOString()
      }
    };
  },
});

// Multer upload instance
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max (matches validation)
    files: 10, // Max 10 files per request
  },
  fileFilter: fileFilter,
});

export const uploadProfile = multer({
  storage: profileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB for profiles
    files: 1,
  },
  fileFilter: profileFileFilter,
});

// Add helper to detect resource type from publicId
const getResourceTypeFromPublicId = (
  publicId: string
): CloudinaryResourceType => {
  if (publicId.includes("/users/")) return "image";
  if (publicId.match(/\.(mp4|mov|avi|mkv|webm|mp3|wav|ogg|m4a)$/)) return "video";
  if (publicId.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar)$/)) return "raw";
  return "image";
};

// Helper function to delete file from Cloudinary
export const deleteFromCloudinary = async (
  publicId: string,
  resourceType?: CloudinaryResourceType
): Promise<boolean> => {
  try {
    const type = resourceType || getResourceTypeFromPublicId(publicId);
    await cloudinary.uploader.destroy(publicId, {
      resource_type: type,
    });
    return true;
  } catch (error) {
    logger.error({ err: error }, "Error deleting from Cloudinary");
    return false;
  }
};
