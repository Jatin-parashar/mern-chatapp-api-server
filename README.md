# Chat App Server

A real-time chat application server built with Node.js, Express, Socket.IO, and MongoDB. Features include messaging, file sharing, voice/video calling, and user presence management.

## Features

- **Real-time Messaging** - Instant message delivery with Socket.IO
- **File Sharing** - Upload and share images, documents via Cloudinary
- **Voice/Video Calls** - WebRTC signaling for peer-to-peer calls
- **User Authentication** - JWT-based auth with refresh tokens
- **Online Presence** - Real-time user status tracking
- **Message Read Receipts** - Track message delivery and read status
- **Typing Indicators** - Show when users are typing
- **Call History** - Persistent call records with duration tracking
- **Group Chats** - Multi-participant conversations
- **Security** - Helmet, CORS, input validation, rate limiting

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.IO
- **Authentication**: JWT (jsonwebtoken)
- **File Upload**: Multer + Cloudinary
- **Security**: Helmet, CORS
- **Logging**: Pino
- **Environment**: dotenv

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Cloudinary account (for file uploads)

## Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Create a `.env` file in the root directory and configure the required environment variables (see Environment Variables section below).

## Environment Variables

Create a `.env` file with the following configuration:

```env
# Server Configuration
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database
DATABASE_URI=mongodb://localhost:27017/chatAppDB

# JWT Configuration
ACCESS_JWT_SECRET=your-access-token-secret
REFRESH_JWT_SECRET=your-refresh-token-secret

# Cloudinary (File Upload Service)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

**Environment Modes:**
- `development` - Enables detailed logging, CORS for localhost
- `production` - Optimized for production with security headers

## Running the Application

```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

## REST API Endpoints

### Authentication
**POST** `/api/v1/auth/register`
- Register new user with profile picture upload
- Body: `multipart/form-data` with name, username, password, profilePic (optional)
- Returns: User data with JWT tokens

**POST** `/api/v1/auth/login`
- User authentication with username and password
- Body: `{ username, password }`
- Returns: User data with access and refresh tokens

**POST** `/api/v1/auth/logout`
- Logout current user (requires authentication)
- Headers: `Authorization: Bearer <token>`
- Returns: Success message

**POST** `/api/v1/auth/refreshToken`
- Refresh expired access token
- Body: `{ refreshToken }`
- Returns: New access token

### User Management
**GET** `/api/v1/user/me`
- Get current authenticated user profile
- Headers: `Authorization: Bearer <token>`
- Returns: Current user data

**GET** `/api/v1/user/all`
- Get list of all registered users
- Returns: Array of user profiles

**GET** `/api/v1/user/search?keyword={search}`
- Search users by name or username
- Query: `keyword` - search term
- Returns: Filtered user list

**GET** `/api/v1/user/:id`
- Get specific user profile by ID
- Params: `id` - user ID
- Returns: User profile data

**PATCH** `/api/v1/user/update`
- Update current user profile information
- Body: `{ name?, status?, profilePic? }`
- Returns: Updated user data

### Conversations
**POST** `/api/v1/conversation`
- Create new conversation (direct or group)
- Query: `group=true/false`
- Body: `{ participants: [userId1, userId2], name? }`
- Returns: Created conversation with participant details

**GET** `/api/v1/conversation`
- Get all conversations for authenticated user
- Returns: Array of conversations with latest message

**GET** `/api/v1/conversation/:id`
- Get specific conversation details
- Params: `id` - conversation ID
- Returns: Conversation with participant information

### Messages
**POST** `/api/v1/message`
- Send message with optional file attachments
- Body: `multipart/form-data` with conversationId, content, files[] (up to 10)
- Returns: Created message with file URLs

**GET** `/api/v1/message/conversation/:id`
- Get messages for specific conversation with pagination
- Params: `id` - conversation ID
- Query: `page`, `limit` (default 50)
- Returns: Paginated message list

**PATCH** `/api/v1/message/seen/conversation/:id`
- Mark all messages in conversation as read
- Params: `id` - conversation ID
- Returns: Updated message read status

**PATCH** `/api/v1/message/seen/:id`
- Mark specific message as read
- Params: `id` - message ID
- Returns: Updated message with read status

### Call Management
**GET** `/api/v1/call/history`
- Get call history for authenticated user
- Query: `limit` (default 50)
- Returns: Array of call records with duration and status

**GET** `/api/v1/call/:callId`
- Get specific call details and metadata
- Params: `callId` - unique call identifier
- Returns: Call information with participants and duration

## Real-time Communication (Socket.IO)

### Connection & Presence Management
**Event:** `setup`
- Authenticate user connection and join user-specific room
- Payload: `{ userId }`
- Response: User added to online users list

**Event:** `onlineUsers`
- Server broadcasts list of currently online users
- Payload: Array of online user objects with status
- Triggered: When users connect/disconnect

### Real-time Messaging
**Event:** `newMessage`
- Send new message to conversation participants
- Payload: `{ conversationId, content, sender }`
- Response: Message delivered to all conversation members

**Event:** `messageReceived`
- Receive new message in real-time
- Payload: Complete message object with sender info
- Triggered: When someone sends message to your conversation

**Event:** `typing` / `stopTyping`
- Show typing indicators to conversation participants
- Payload: `{ conversationId, userId }`
- Response: Other participants see typing status

**Event:** `messageSeen`
- Mark message as read and notify sender
- Payload: `{ messageId, userId }`
- Response: Sender receives read receipt notification

**Event:** `conversationMessageSeen`
- Mark entire conversation as read
- Payload: `{ conversationId, userId }`
- Response: All participants notified of read status

## Voice & Video Calling System

### WebRTC Signaling Server
The server acts as a signaling server for WebRTC peer-to-peer connections, handling call setup, management, and teardown.

### Call Initiation
**Event:** `callInitiated`
- Start new voice or video call
- Payload: `{ callId, receiverId, callerInfo, isVideoCall, signal }`
- Process: Creates call record, notifies receiver, handles offline users
- Response: Receiver gets incoming call notification

**Event:** `callReceived`
- Incoming call notification to receiver
- Payload: `{ callId, callerInfo, isVideoCall, signal }`
- Triggered: When someone initiates call to you
- Action: Display incoming call interface

### Call Management
**Event:** `callAccepted`
- Accept incoming call and establish connection
- Payload: `{ callId, signal }`
- Process: Updates call status, forwards signal to caller
- Result: WebRTC connection established between peers

**Event:** `callDeclined`
- Decline incoming call
- Payload: `{ callId, reason }`
- Process: Updates call status to declined, notifies caller
- Result: Call terminated, caller receives decline notification

**Event:** `callEnded`
- End active call session
- Payload: `{ callId }`
- Process: Updates call duration, notifies all participants
- Result: Call terminated, resources cleaned up

### WebRTC Signal Exchange
**Event:** `callSignal`
- Exchange WebRTC signaling data (ICE candidates, offers, answers)
- Payload: `{ callId, signal }`
- Process: Forwards signaling data between call participants
- Purpose: Establish direct peer-to-peer connection

**Event:** `callPeerDisconnected`
- Handle unexpected peer disconnection
- Payload: `{ callId }`
- Triggered: When participant loses connection
- Action: Cleanup call, notify remaining participants

### Call Features
- **Audio Calls**: Voice-only communication with mute/unmute
- **Video Calls**: Audio + video with camera on/off controls
- **Call History**: Persistent storage of call records with duration
- **Missed Calls**: Automatic detection and notification of missed calls
- **Call Status**: Real-time status updates (calling, ringing, connected, ended)
- **Offline Handling**: Graceful handling of offline users with timeout
- **Connection Recovery**: Automatic cleanup on unexpected disconnections

## Core Libraries

- **Express.js** - Web framework for REST APIs
- **Socket.IO** - Real-time bidirectional communication
- **Mongoose** - MongoDB object modeling
- **jsonwebtoken** - JWT authentication
- **Multer + Cloudinary** - File upload and storage
- **Helmet** - Security middleware
- **Pino** - High-performance logging
- **bcryptjs** - Password hashing

## Key Features

### 🔐 Authentication & Security
- JWT-based authentication with refresh tokens
- Secure password hashing with bcrypt
- Protected routes with middleware
- CORS and security headers

### 💬 Real-time Messaging
- Instant message delivery via Socket.IO
- File attachments (images, documents)
- Message read receipts and delivery status
- Typing indicators
- Group and direct conversations

### 📞 Voice & Video Calling
- WebRTC peer-to-peer calling with signaling server
- Audio-only and video calling support
- Real-time call status management (calling, ringing, connected, ended)
- Call history with duration tracking and metadata
- Missed call detection and notifications
- Automatic cleanup on disconnections
- ICE candidate exchange for NAT traversal

### 👥 User Management
- User profiles with avatars
- Online presence tracking
- User search functionality
- Profile updates

### 📊 Data Persistence
- MongoDB with Mongoose ODM
- Conversation management
- Message history
- Call logs and metadata
- User authentication records

## Architecture

```
server/
├── config/         # Database & service configurations
├── controllers/    # HTTP request handlers
├── models/         # MongoDB schemas
├── routes/         # API route definitions
├── services/       # Business logic layer
├── socket/         # Real-time event handlers
├── middlewares/    # Authentication & validation
├── utils/          # Helper functions
└── app.js          # Application entry point
```