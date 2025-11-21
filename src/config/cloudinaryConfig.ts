import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import logger from "../utils/logger.js";

export function cloudinaryConfig() {
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
  params: async (req, file) => {
    let folder = "chatAppUploads";
    let resourceType: CloudinaryResourceType = "auto"; // Automatically detect resource type
    let allowedFormats = [];

    // Determine folder and settings based on file type
    if (file.mimetype.startsWith("image/")) {
      folder = "chatAppUploads/images";
      allowedFormats = ["jpg", "png", "jpeg", "gif", "webp", "svg"];
    } else if (file.mimetype.startsWith("video/")) {
      folder = "chatAppUploads/videos";
      resourceType = "video";
      allowedFormats = ["mp4", "mov", "avi", "mkv", "webm"];
    } else if (file.mimetype.startsWith("audio/")) {
      folder = "chatAppUploads/audio";
      resourceType = "video"; // Cloudinary uses 'video' for audio too
      allowedFormats = ["mp3", "wav", "ogg", "m4a"];
    } else {
      folder = "chatAppUploads/documents";
      resourceType = "raw"; // For documents and other files
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
    }

    return {
      folder: folder,
      allowed_formats: allowedFormats,
      resource_type: resourceType,
    };
  },
});

// Multer upload instance
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  },
});

// Add helper to detect resource type from publicId
const getResourceTypeFromPublicId = (
  publicId: string
): CloudinaryResourceType => {
  if (publicId.includes("/videos/")) return "video";
  if (publicId.includes("/audio/")) return "video"; // Cloudinary uses 'video' for audio
  if (publicId.includes("/documents/")) return "raw";
  return "image";
};

// Helper function to delete file from Cloudinary
export const deleteFromCloudinary = async (
  publicId: string,
  resourceType?: CloudinaryResourceType
): Promise<boolean> => {
  try {
    // Auto-detect if not provided
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
