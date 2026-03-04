// HTTP Status Messages
export const HTTP_MESSAGES = {
  AUTH: {
    MISSING_HEADER: "Missing Auth Header in the request",
    INVALID_HEADER_FORMAT: "Invalid Auth Header format. Expected: Bearer <token>",
    TOKEN_NOT_PROVIDED: "Token not provided",
    INVALID_PAYLOAD: "Invalid token payload",
    TOKEN_EXPIRED: "Token has expired",
    INVALID_TOKEN: "Invalid token",
    AUTH_FAILED: "Authentication failed",
    SESSION_EXPIRED: "Your token has expired! Please log in again.",
    INVALID_CREDENTIALS: "Invalid email or password",
    EMAIL_IN_USE: "Email already in use",
    USERNAME_TAKEN: "Username already taken",
    USER_NOT_EXIST: "User does not exist",
    ALL_FIELDS_REQUIRED: "All fields are required",
  },
  VALIDATION: {
    INVALID_EMAIL: "Invalid email format",
    INVALID_ID: "Invalid ID format",
    INVALID_CONVERSATION_ID: "Invalid conversation ID",
    INVALID_MESSAGE_ID: "Invalid message ID",
    CONTENT_OR_ATTACHMENTS_REQUIRED: "Message must have either content or attachments",
    INVALID_MESSAGE_TYPE: "Invalid message type",
    PARTICIPANT_REQUIRED: "At least one participant is required",
    GROUP_NAME_REQUIRED: "Group chats need a name",
    MIN_PARTICIPANTS_GROUP: "At least 3 participants are required for group chats (including you)",
    EXACT_TWO_PARTICIPANTS: "One-on-one chat must have exactly 2 participants",
  },
  ERROR: {
    NOT_FOUND: "not found",
    UNAUTHORIZED: "Unauthorized access to this conversation",
    CANNOT_MARK_OWN_MESSAGE: "Cannot mark your own message as seen",
    NOT_PARTICIPANT: "You are not a participant in this conversation",
    DUPLICATE_FIELD: "Duplicate field value",
    INVALID_INPUT: "Invalid input data",
    SOMETHING_WRONG: "Something went wrong!",
    ROUTE_NOT_FOUND: "Can't find",
  },
  FILE: {
    TYPE_NOT_ALLOWED: "File type not allowed for security reasons",
    TYPE_NOT_SUPPORTED: "File type not supported",
    SIZE_EXCEEDS: "File size exceeds limit",
    ONLY_IMAGES_ALLOWED: "Only image files are allowed for profile pictures",
  },
} as const;

// File Upload Limits
export const FILE_LIMITS = {
  PROFILE_IMAGE: 5 * 1024 * 1024, // 5MB
  MESSAGE_IMAGE: 10 * 1024 * 1024, // 10MB
  MESSAGE_VIDEO: 50 * 1024 * 1024, // 50MB
  MESSAGE_DOCUMENT: 25 * 1024 * 1024, // 25MB
  DEFAULT: 25 * 1024 * 1024, // 25MB
  MAX_FILES_PER_REQUEST: 10,
} as const;

// Validation Limits
export const VALIDATION_LIMITS = {
  NAME_MIN: 3,
  NAME_MAX: 30,
  USERNAME_MIN: 3,
  USERNAME_MAX: 20,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 20,
  STATUS_MAX: 200,
  MESSAGE_CONTENT_MAX: 10000,
  GROUP_NAME_MAX: 100,
} as const;

// Bcrypt
export const BCRYPT_SALT_ROUNDS = 10;

// Timing Attack Prevention
export const FAKE_HASH = "$2b$10$invalidhashtopreventtimingattack";

// Shutdown
export const SHUTDOWN_TIMEOUT = 30000; // 30 seconds

// Allowed MIME Types
export const ALLOWED_MIME_TYPES = {
  IMAGE: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  VIDEO: ["video/mp4", "video/webm", "video/quicktime"],
  AUDIO: ["audio/mpeg", "audio/wav", "audio/ogg"],
  DOCUMENT: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
  ],
} as const;

// Dangerous File Extensions
export const DANGEROUS_EXTENSIONS = [
  ".exe", ".bat", ".cmd", ".sh", ".ps1", ".msi", ".app", ".deb", ".rpm",
  ".dmg", ".pkg", ".run", ".bin", ".com", ".scr", ".vbs", ".js", ".jar"
] as const;

// Message Types
export const MESSAGE_TYPES = ["text", "image", "video", "audio", "document", "file"] as const;

// Call Status
export const CALL_STATUS = {
  CALLING: "calling",
  ACCEPTED: "accepted",
  DECLINED: "declined",
  ENDED: "ended",
  MISSED: "missed",
} as const;

export type CallStatusType = typeof CALL_STATUS[keyof typeof CALL_STATUS];

// Model Names
export const MODEL_NAMES = {
  USER: "User",
  AUTH: "Auth",
  CONVERSATION: "Conversation",
  MESSAGE: "Message",
  CALL: "Call",
  AUTH_CREDENTIAL: "AuthCredential",
} as const;

// Entity Names for Error Messages
export const ENTITY_NAMES = {
  USER: "User",
  CONVERSATION: "Conversation",
  MESSAGE: "Message",
  STATUS_FIELD: "Status field",
  USERNAME: "Username",
} as const;

// Validation Constants
export const VALIDATION_CONSTANTS = {
  EMPTY_STRING: "",
  USERNAME_MAX_LENGTH: 50,
  STATUS_MAX_LENGTH: 200,
} as const;

// User Defaults
export const USER_DEFAULTS = {
  PROFILE_PIC: "",
  STATUS: "Hey there! I am using ChatApp",
} as const;

// Message Defaults
export const MESSAGE_DEFAULTS = {
  TYPE: "text",
} as const;

// Conversation Errors
export const CONVERSATION_ERRORS = {
  MUST_BE_PARTICIPANT: "You must be part of the conversation participants",
  UNAUTHORIZED_ACCESS: "Unauthorized access to this conversation",
} as const;

// WebRTC Signal Types
export const WEBRTC_SIGNAL_TYPES = {
  OFFER: 'offer',
  ANSWER: 'answer',
} as const;

// Call Decline Reasons
export const CALL_DECLINE_REASONS = {
  AUTH_ERROR: "Authentication error",
  CANNOT_CALL_SELF: "Cannot call yourself",
  NO_ANSWER: "No answer",
  USER_OFFLINE: "User is offline",
  ERROR: "error",
  USER_DECLINED: "user declined",
} as const;

// HTTP Methods
export const HTTP_METHODS = {
  OPTIONS: "OPTIONS",
} as const;

// Validation Sources
export const VALIDATION_SOURCES = {
  BODY: "body",
  QUERY: "query",
  PARAMS: "params",
} as const;

// Query Options
export const QUERY_OPTIONS = {
  CASE_INSENSITIVE: "i",
} as const;

// Boolean String Values
export const BOOLEAN_STRINGS = {
  TRUE: "true",
  FALSE: "false",
} as const;

// Auth Constants
export const AUTH_CONSTANTS = {
  BEARER_PREFIX: "Bearer ",
  BEARER_PREFIX_LENGTH: 7,
  TOKEN_ERROR_EXPIRED: "TokenExpiredError",
  TOKEN_ERROR_INVALID: "JsonWebTokenError",
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  USER_CREATED: "User created successfully",
  USER_LOGGED_IN: "User logged in",
  LOGGED_OUT: "Logged out",
  TOKEN_REFRESHED: "Token refreshed successfully",
  USER_FETCHED: "User fetched successfully",
  USERS_FETCHED: "Users fetched successfully",
  USER_UPDATED: "User updated successfully",
  USERNAME_CHECKED: "Username availability checked",
  CALL_HISTORY_FETCHED: "Call history fetched successfully",
  CALL_DETAILS_FETCHED: "Call details fetched successfully",
  CONVERSATION_EXISTS: "Conversation already exists",
  CONVERSATIONS_FETCHED: "User conversations fetched successfully",
  CONVERSATION_FETCHED: "Conversation fetched successfully",
  HEALTH_CHECK: "Health check successful",
  MESSAGE_SENT: "Message sent successfully",
  MESSAGES_FETCHED: "Messages fetched successfully",
  MESSAGE_MARKED_SEEN: "Message marked as seen successfully",
  MESSAGE_ALREADY_SEEN: "Message already marked as seen",
} as const;

// Message Prefixes
export const MESSAGE_PREFIXES = {
  GROUP_CHAT: "group ",
  EMPTY: "",
} as const;

// Response Status
export const RESPONSE_STATUS = {
  SUCCESS: "success",
} as const;

// Express Settings
export const EXPRESS_SETTINGS = {
  TRUST_PROXY: "trust proxy",
} as const;

// Health Status
export const HEALTH_STATUS = {
  ACTIVE: "active",
} as const;

// Form Field Names
export const FORM_FIELDS = {
  PROFILE_PIC: "profilePic",
  ROOM_ID: "roomId",
  CONVERSATION_ID: "conversationId",
} as const;

// Socket Actions
export const SOCKET_ACTIONS = {
  STARTED_TYPING: "started typing",
  STOPPED_TYPING: "stopped typing",
} as const;

// Error Messages (Auth specific)
export const AUTH_ERROR_MESSAGES = {
  NO_REFRESH_TOKEN: "No Refresh Token",
  INVALID_REFRESH_TOKEN: "Invalid or expired refresh token",
  USERNAME_REQUIRED: "Username is required",
} as const;

// Populate Fields
export const USER_SELECT_FIELDS = "_id name username profilePic status" as const;
export const MESSAGE_SELECT_FIELDS = "content messageType sender createdAt" as const;

// Rate Limit Config
export const RATE_LIMITS = {
  LOGIN:   { WINDOW_MS: 15 * 60 * 1000, MAX: 5   },   // 5 req / 15 min  — strictest
  AUTH:    { WINDOW_MS: 15 * 60 * 1000, MAX: 10  },   // 10 req / 15 min — register, refresh
  API:     { WINDOW_MS: 60 * 1000,      MAX: 100 },   // 100 req / 1 min
  MESSAGE: { WINDOW_MS: 60 * 1000,      MAX: 60  },   // 60 req / 1 min
} as const;

// Populate Paths
export const POPULATE_PATHS = {
  SENDER: "sender",
  DELIVERED_TO: "deliveredTo",
  SEEN_BY: "seenBy",
  REPLY_TO: "replyTo",
  PARTICIPANTS: "participants",
  ADMINS: "admins",
  LAST_MESSAGE: "lastMessage",
  CALLER: "caller",
  RECEIVER: "receiver",
} as const;
