import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import logger from "../utils/logger.js";

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
  },
});

export const uploadProfile = multer({
  storage: profileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB for profiles
  },
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
