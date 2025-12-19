# 💬 Chat App Server

> A modern, production-ready real-time chat server that actually works. Built with the good stuff: Node.js, TypeScript, Socket.IO, and MongoDB.

**What makes this special?** It's not just another chat app. This server handles everything from instant messaging to WebRTC video calls, with proper authentication, file uploads, and all the real-time features you'd expect from a modern chat platform. Think WhatsApp or Discord, but you own the code.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green)](https://nodejs.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-black)](https://socket.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.13-green)](https://www.mongodb.com/)

## ✨ Features

This isn't your basic CRUD app. Here's what makes it powerful:

### 💬 Messaging
- **Real-time messaging** - Messages appear instantly via Socket.IO (server-side emissions)
- **File sharing** - Send images, videos, documents (up to 10 files, 50MB max)
- **Message replies** - Quote and reply to specific messages
- **Read receipts** - See who's read your messages (those double check marks)
- **Typing indicators** - "John is typing..." you know the drill
- **Group chats** - Create groups with multiple participants
- **Cursor pagination** - Efficient message loading for large conversations

### 📞 Voice & Video Calls
- **WebRTC calling** - Peer-to-peer audio and video calls
- **Call history** - Track all your calls with duration
- **Missed call detection** - Automatic timeout (45s configurable)
- **Call duration limits** - Auto-end after 4 hours (configurable)
- **ICE candidate throttling** - Prevents signal overflow
- **Multi-device support** - Take calls on any device
- **Graceful disconnect handling** - Proper cleanup on connection loss

### 👥 User Management
- **JWT authentication** - Secure token-based auth with refresh tokens
- **User profiles** - Profile pictures, status messages, the works
- **User search** - Find people by name or username
- **Online presence** - See who's online in real-time

### 🔒 Security (Because we care)
- **Password hashing** - bcrypt with proper salting
- **Rate limiting** - Stop those brute force attacks
- **Input validation** - Joi schemas + sanitization for everything
- **XSS protection** - HTML entity encoding on all user input
- **File upload security** - Extension blocking, MIME validation, size limits
- **Security headers** - Helmet configured properly
- **CORS protection** - Only your frontend can talk to this
- **Socket authentication** - JWT validation on every connection

## 🛠️ Tech Stack

We picked the best tools for the job:

**Core**
- **Node.js** (v16+) - Because JavaScript everywhere
- **TypeScript** (v5.9) - Type safety saves lives (and bugs)
- **Express.js** (v5.1) - The classic, battle-tested web framework
- **MongoDB** (v8.13) - Flexible NoSQL for our data
- **Socket.IO** (v4.8) - Real-time magic with proper architecture ✨

**Authentication & Security**
- **JWT** - Stateless authentication done right
- **bcrypt** - Password hashing that actually works
- **Helmet** - Security headers on autopilot
- **express-rate-limit** - Keep the bad actors out

**File Handling**
- **Multer** - Multipart form data parsing
- **Cloudinary** - Cloud storage (no server disk space wasted)

**Developer Experience**
- **Pino** - Fast, structured logging
- **Joi** - Schema validation that makes sense
- **tsx** - TypeScript execution without the hassle

## 📋 Prerequisites

Before you dive in, make sure you have:

- **Node.js** (v16+) - [Download here](https://nodejs.org/)
- **MongoDB** - Either [local install](https://www.mongodb.com/try/download/community) or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier works great)
- **Cloudinary account** - [Sign up free](https://cloudinary.com/) for file uploads
- **A code editor** - VS Code recommended, but you do you

That's it! No Docker, no Kubernetes, no complicated setup. Just the essentials.

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd server
npm install
```

### 2. Set Up Environment Variables
Create a `.env` file in the root directory. Don't skip this - the app won't work without it!

```bash
cp .env.example .env  # If you have an example file
# Or create it manually
```

See the [Environment Variables](#-environment-variables) section below for what to put in there.

### 3. Fire It Up! 🔥
```bash
npm run dev
```

If you see "Server running on port 3000" - you're golden! 🎉

## 🔐 Environment Variables

Create a `.env` file with these variables. Pro tip: Use strong secrets in production!

```env
# Server Configuration
NODE_ENV=development              # development or production
PORT=3000                         # Server port (default: 3000)
CLIENT_URL=http://localhost:5173  # Your frontend URL (important for CORS!)

# Database
DATABASE_URI=mongodb://localhost:27017/chatAppDB  # Local MongoDB
# Or use MongoDB Atlas:
# DATABASE_URI=mongodb+srv://username:password@cluster.mongodb.net/chatAppDB

# JWT Secrets (CHANGE THESE! Use random strings)
ACCESS_JWT_SECRET=your-super-secret-access-token-change-this-in-production
REFRESH_JWT_SECRET=your-super-secret-refresh-token-also-change-this

# Cloudinary (Get these from your Cloudinary dashboard)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Call Configuration (optional - defaults provided)
CALL_RING_TIMEOUT=45000           # Ring timeout in ms (default: 45 seconds)
CALL_MAX_DURATION=14400000        # Max call duration in ms (default: 4 hours)

# Cleanup Configuration (optional - defaults provided)
CLEANUP_INTERVAL=300000           # Cleanup interval in ms (default: 5 minutes)
STALE_THRESHOLD=1800000           # Stale entry threshold in ms (default: 30 minutes)
```

**🎯 Quick Tips:**
- **Development mode**: Detailed logs, CORS for localhost, easier debugging
- **Production mode**: Optimized performance, security headers, minimal logs
- **JWT Secrets**: Use at least 32 random characters. Don't use "secret123" 😅
- **Cloudinary**: Free tier gives you 25GB storage - plenty to start!

## 🎮 Running the Application

```bash
# Development mode (auto-restarts on file changes)
npm run dev

# Development with debugging (for VS Code debugger)
npm run dev:debug

# Build for production
npm run build

# Run production build
npm start
```

**What's happening?**
- `npm run dev` uses `tsx` to run TypeScript directly with hot reload
- `npm run build` compiles TypeScript to JavaScript in the `dist/` folder
- `npm start` runs the compiled code (use this in production)

Server runs on **port 3000** by default. Visit `http://localhost:3000` to see if it's alive!


## 📡 REST API Endpoints

**Base URL:** `http://localhost:3000/api/v1`

**Quick test:** Hit `GET http://localhost:3000/` to see if the server is running. You'll get a nice JSON response with all available endpoints.

**Authentication:** Endpoints marked with 🔒 need a JWT token in the header:
```
Authorization: Bearer your-jwt-token-here
```

No token? You'll get a friendly 401 Unauthorized. Get your token from the login or register endpoints first!

---

### 🔑 Authentication

The gateway to everything. Start here!

#### **POST** `/api/v1/auth/register`
Create a new account with optional profile picture.

**Body:** `multipart/form-data`
- `name` ✅ - Your full name
- `email` ✅ - Email address
- `username` ✅ - Unique username
- `password` ✅ - Password (we'll hash it with bcrypt)
- `profilePic` - Profile picture file (optional)
- `status` - Status message (optional)

**Returns:** `{ user, accessToken, refreshToken }`

**Status:** 201 Created

---

#### **POST** `/api/v1/auth/login`
Log in with your credentials.

**Body:** `{ email, password }`

**Returns:** `{ user, accessToken, refreshToken }`

**Status:** 200 OK

---

#### **POST** `/api/v1/auth/logout` 🔒
Log out (client should discard tokens).

**Returns:** Success message

**Status:** 200 OK

---

#### **POST** `/api/v1/auth/refreshToken`
Get a new access token when yours expires.

**Body:** `{ refreshToken }`

**Returns:** `{ user, accessToken }`

**Status:** 200 OK

---

#### **GET** `/api/v1/auth/check-username/:username`
Check if a username is available before registering.

**Returns:** `{ available: boolean }`

**Status:** 200 OK

---

### 👤 User Management

All about users - profiles, search, updates.

#### **GET** `/api/v1/user/me` 🔒
Get your own profile.

**Returns:** Current user data

**Status:** 200 OK

---

#### **GET** `/api/v1/user/all` 🔒
Get all registered users (for finding people to chat with).

**Returns:** Array of user profiles (passwords excluded, obviously)

**Status:** 200 OK

---

#### **GET** `/api/v1/user/search?keyword={search}` 🔒
Search for users by name or username.

**Query:** `keyword` - Search term (case-insensitive)

**Returns:** Filtered user list

**Status:** 200 OK

---

#### **GET** `/api/v1/user/:id` 🔒
Get a specific user's profile.

**Params:** `id` - User's MongoDB ObjectId

**Returns:** User profile data

**Status:** 200 OK

---

#### **PATCH** `/api/v1/user/update` 🔒
Update your profile.

**Body:** `{ name?, status?, profilePic? }` (all optional)

**Returns:** Updated user data

**Status:** 200 OK

---

### 💭 Conversations

Create and manage chats (both direct and group).

#### **POST** `/api/v1/conversation` 🔒
Start a new conversation or group chat.

**Query:** `isGroup=true` for groups, omit for direct messages

**Body:**
- `participants` ✅ - Array of user IDs (don't include yourself)
- `name` - Group name (required if isGroup=true)

**Smart behavior:** For direct chats, if a conversation already exists between you two, we'll return that instead of creating a duplicate.

**Returns:** `{ conversation }` with participant details

**Status:** 201 Created (new) or 200 OK (existing)

---

#### **GET** `/api/v1/conversation` 🔒
Get all your conversations with pagination.

**Query:**
- `limit` - Conversations per page (default: 50)
- `skip` - Skip this many (default: 0)

**Returns:** `{ data: [...conversations], total, limit, skip, hasMore }`

Each conversation includes participants, latest message, and timestamps.

**Status:** 200 OK

---

#### **GET** `/api/v1/conversation/:id` 🔒
Get details of a specific conversation.

**Params:** `id` - Conversation ID

**Security:** You must be a participant to access this.

**Returns:** `{ conversation }` with full details

**Status:** 200 OK

---

### 📨 Messages

The heart of the chat app - sending and receiving messages.

#### **POST** `/api/v1/message` 🔒
Send a message with optional file attachments.

**Body:** `multipart/form-data`
- `conversationId` ✅ - Which conversation
- `content` - Text message (optional if you're sending files, max 10,000 chars)
- `files[]` - Up to 10 files (images: 10MB, videos: 50MB, documents: 25MB)
- `messageType` - Auto-detected from file type
- `replyTo` - Message ID you're replying to (optional)

**Magic:** 
- Auto-detects message type from MIME types
- Sanitizes content for XSS protection
- Validates file extensions and MIME types
- Server automatically emits socket event to all participants

**Returns:** `{ message }` with file URLs from Cloudinary

**Status:** 201 Created

**Important:** No need to emit socket events - server handles it automatically!

---

#### **GET** `/api/v1/message/conversation/:id` 🔒
Get messages from a conversation (offset pagination).

**Params:** `id` - Conversation ID

**Query:**
- `limit` - Messages per page (default: 50)
- `skip` - Skip this many (default: 0)

**Returns:** `{ data: [...messages], total, limit, skip, hasMore }`

Messages are sorted newest first.

**Status:** 200 OK

---

#### **GET** `/api/v1/message/conversation/:id/cursor` 🔒
Get messages with cursor-based pagination (more efficient for large chats).

**Params:** `id` - Conversation ID

**Query:**
- `cursor` - Message ID to start from (optional)
- `limit` - Messages per page (default: 50)

**Returns:** `{ messages: [...], nextCursor: string | null }`

**Why cursor?** Better performance for real-time chats, no skipped messages.

**Status:** 200 OK

---

#### **PATCH** `/api/v1/message/seen/conversation/:id` 🔒
Mark all messages in a conversation as read.

**Params:** `id` - Conversation ID

**Smart behavior:** Only marks messages you haven't seen yet, and only messages you didn't send.

**Returns:** `{ count }` - Number of messages marked

**Status:** 200 OK

**Important:** Server automatically emits socket event to notify others!

---

#### **PATCH** `/api/v1/message/seen/:id` 🔒
Mark a specific message as read.

**Params:** `id` - Message ID

**Body:** `{ conversationId }` - Required for socket notification

**Returns:** Success message

**Status:** 200 OK

**Important:** Server automatically emits socket event to notify others!

---

### 📞 Call Management

Track your call history and details.

#### **GET** `/api/v1/call/history` 🔒
Get your call history (incoming and outgoing).

**Query:** `limit` - Number of calls (default: 50)

**Returns:** Array of calls with:
- Call ID, caller, receiver
- Video or audio call
- Status (calling, accepted, declined, ended, missed)
- Duration in seconds
- Timestamps

**Status:** 200 OK

---

#### **GET** `/api/v1/call/:callId` 🔒
Get details of a specific call.

**Params:** `callId` - Unique call identifier

**Returns:** Complete call info with participants

**Status:** 200 OK

---

### ❤️ Health Check

#### **GET** `/api/v1/health`
Is the server alive? Check here!

**Returns:**
- Server uptime
- Database connection status
- Memory usage
- Environment (dev/prod)

Perfect for monitoring tools or just checking if everything's okay.

**Status:** 200 OK


## 🔌 Real-time Communication (Socket.IO)

This is where the magic happens! Socket.IO powers all the real-time features.

### 🎯 Single Source of Truth Architecture

**Important:** The server now handles socket emissions automatically!

**Old way (race conditions):**
```javascript
// ❌ Client had to do two things
await api.sendMessage(data);        // 1. REST API
socket.emit('newMessage', message); // 2. Socket event
```

**New way (atomic, reliable):**
```javascript
// ✅ Just call REST API - server handles socket emission
await api.sendMessage(data);  // Server emits to all participants automatically
```

**Benefits:**
- No race conditions
- Guaranteed delivery
- Works even if client has network issues
- Simpler client code

### Socket Authentication

All socket connections need a JWT token. Here's how to connect:

```javascript
const socket = io('http://localhost:3000', {
  auth: { token: 'your-jwt-access-token' }
});
```

**What happens:**
- Server validates your token using `authenticateSocket` middleware
- Invalid/missing token? Connection rejected immediately with disconnect
- Valid token? Your userId is attached to the socket for all events

### Socket.IO Configuration

- **CORS**: Only accepts connections from CLIENT_URL
- **Ping Timeout**: 60 seconds (connection dies if no response)
- **Ping Interval**: 25 seconds (heartbeat frequency)
- **Credentials**: Enabled for cross-origin requests

---

### 👋 Connection & Presence

#### **Event:** `setup` (Client → Server)
Tell the server you're online.

**Payload:** None (uses your authenticated userId)

**What happens:**
1. Adds you to online users map
2. Joins you to your personal room (for direct messages)
3. Broadcasts updated online users list to everyone

**Response:** Everyone gets `onlineUsers` event

---

#### **Event:** `onlineUsers` (Server → Client)
Get the list of who's online right now.

**Payload:** Array of online user IDs

**When:** Triggered whenever someone connects/disconnects

**Use it to:** Show green dots next to online users in your UI

---

#### **Event:** `disconnect` (Automatic)
Handles cleanup when you lose connection.

**What happens:**
1. Removes you from online users
2. Cleans up any active calls
3. Notifies call participants if you were in a call
4. Broadcasts updated online users list

**Automatic:** Socket.IO triggers this on connection loss

---

### 💬 Real-time Messaging

#### **Event:** `joinRoom` (Client → Server)
Join a conversation room to receive messages.

**Payload:** `conversationId` (string)

**Important:** You must join a room before you'll receive messages for that conversation!

**Use it:** Call this when user opens a conversation

---

#### **Event:** `messageReceived` (Server → Client)
Receive a new message in real-time.

**Payload:** Complete message object with sender info

**When:** Someone sends a message to your conversation

**Use it:** Display the message immediately in your UI

---

#### **Event:** `conversationReceived` (Server → Client)
Someone added you to a conversation!

**Payload:** `{ conversation }` with full details

**Use it:** Add the conversation to your UI's conversation list

---

#### **Event:** `typing` (Client → Server)
Let others know you're typing.

**Payload:** `{ conversationId }`

**What happens:** Broadcasts to conversation with your userId

**Response:** Others receive `{ userId, conversationId }`

**Use it:** Call when user starts typing in message input

---

#### **Event:** `stopTyping` (Client → Server)
Let others know you stopped typing.

**Payload:** `{ conversationId }`

**Use it:** Call when user stops typing or sends the message

---

#### **Event:** `messageDeliveredUpdate` (Server → Client)
Your message was delivered!

**Payload:** `{ conversationId, messageId, userId }`

**When:** Recipient comes online and message is marked as delivered

**Use it:** Show gray double check marks (delivered but not read)

---

#### **Event:** `messageSeenUpdate` (Server → Client)
Someone read your message!

**Payload:** `{ conversationId, messageId, userId }`

**Use it:** Show blue double check marks or "Read by..." in UI

---

#### **Event:** `conversationMessagesSeenUpdate` (Server → Client)
Someone read all messages in the conversation.

**Payload:** `{ conversationId, userId }`

**Use it:** Update all message read receipts at once

---

### 📞 Voice & Video Calling

WebRTC calling with the server as signaling server. The actual audio/video goes peer-to-peer!

### How Calls Work

1. **Caller** emits `callInitiated` with WebRTC offer
2. **Server** creates call record and forwards to receiver
3. **Receiver** gets `callReceived` notification
4. **Receiver** emits `callAccepted` with WebRTC answer
5. **Server** forwards answer to caller
6. **Both** exchange ICE candidates via `callSignal`
7. **Direct** peer-to-peer connection established! 🎉
8. **Either** party emits `callEnded` to hang up

---

#### **Event:** `callInitiated` (Client → Server)
Start a call!

**Payload:**
- `callId` ✅ - Unique UUID for this call
- `receiverId` ✅ - Who you're calling
- `callerInfo` ✅ - `{ _id, name, username, profilePic }`
- `isVideoCall` ✅ - true for video, false for audio
- `signal` ✅ - WebRTC offer from your peer connection

**What happens:**
1. Validates you're not calling yourself (that would be weird)
2. Creates call record in database
3. Stores in active calls map
4. Forwards to receiver if they're online
5. Sets 30-second timeout (marks as missed if no answer)

**Security:** Your callerInfo._id must match your authenticated userId

---

#### **Event:** `callReceived` (Server → Client)
Incoming call!

**Payload:** `{ callId, callerInfo, isVideoCall, signal }`

**Use it:** Show incoming call UI with accept/decline buttons

**Note:** `signal` contains the WebRTC offer you need to create an answer

---

#### **Event:** `callAccepted` (Client → Server)
Accept an incoming call.

**Payload:**
- `callId` ✅ - Call identifier
- `signal` ✅ - WebRTC answer from your peer connection

**What happens:**
1. Updates call status to "accepted"
2. Forwards your answer to the caller
3. Both peers can now establish direct connection

---

#### **Event:** `callDeclined` (Client → Server)
Decline an incoming call.

**Payload:**
- `callId` ✅ - Call identifier
- `reason` - Why you declined (optional)

**What happens:**
1. Updates call status to "declined"
2. Removes from active calls
3. Notifies caller

---

#### **Event:** `callEnded` (Client → Server)
Hang up!

**Payload:** `{ callId }`

**What happens:**
1. Updates call status to "ended"
2. Calculates and stores duration
3. Removes from active calls
4. Notifies both participants

**Note:** Also triggered automatically if someone disconnects

---

#### **Event:** `callSignal` (Bidirectional)
Exchange WebRTC signaling data (ICE candidates).

**Payload:**
- `callId` ✅ - Call identifier
- `signal` ✅ - ICE candidate or other signaling data

**What happens:** Server forwards signal to the other participant

**Use it:** Exchange ICE candidates for NAT traversal

**Frequency:** Multiple times during call setup

---

#### **Event:** `callPeerDisconnected` (Server → Client)
The other person lost connection.

**Payload:** `{ callId }`

**When:** Call participant closes browser or loses connection

**Use it:** Show "Call ended - peer disconnected" message

---

### Call Status Values

- `calling` - Ringing... waiting for answer
- `accepted` - They picked up! Establishing connection...
- `declined` - They declined your call
- `ended` - Call finished normally
- `missed` - They didn't answer within 30 seconds


## 📊 Data Models

Here's what the data looks like in MongoDB:

### User Schema
```typescript
{
  _id: ObjectId,              // References Auth collection
  name: string,               // Full name
  username: string,           // Unique username
  profilePic: string,         // Cloudinary URL (default: "")
  status: string,             // Status message (default: "Hey there! I am using ChatApp")
  createdAt: Date,
  updatedAt: Date
}
```

### Conversation Schema
```typescript
{
  _id: ObjectId,
  isGroup: boolean,           // true for groups, false for direct
  name: string,               // Group name (optional for direct chats)
  participants: ObjectId[],   // Array of User IDs
  admins: ObjectId[],         // Array of admin User IDs (for groups)
  lastMessage: ObjectId,      // Reference to last Message
  createdAt: Date,
  updatedAt: Date
}
```

### Message Schema
```typescript
{
  _id: ObjectId,
  conversationId: ObjectId,   // Which conversation
  sender: ObjectId,           // Who sent it
  content: string,            // Message text
  messageType: string,        // text|image|video|audio|document|file
  attachments: [{
    url: string,              // Cloudinary URL
    publicId: string,         // Cloudinary public ID
    originalName: string,     // Original filename
    mimeType: string,         // File MIME type
    size: number              // File size in bytes
  }],
  replyTo: ObjectId,          // Message being replied to
  deliveredTo: ObjectId[],    // Who received this message (came online)
  seenBy: ObjectId[],         // Who's seen this message
  createdAt: Date,
  updatedAt: Date
}
```

### Call Schema
```typescript
{
  _id: ObjectId,
  callId: string,             // Unique UUID
  caller: ObjectId,           // Who initiated
  receiver: ObjectId,         // Who received
  isVideoCall: boolean,       // true = video, false = audio
  status: string,             // calling|accepted|declined|ended|missed
  duration: number,           // Call duration in seconds
  startedAt: Date,            // When call started
  endedAt: Date,              // When call ended
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🚨 Error Handling

### REST API Errors

All errors return this format:
```json
{
  "success": false,
  "message": "What went wrong",
  "statusCode": 400
}
```

**Status codes you'll see:**
- `400` - Bad Request (validation failed, invalid input)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (you don't have permission)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error (something broke on our end)

### Socket Errors

- **Authentication fails** → Socket disconnected with error message
- **Invalid event data** → Logged but doesn't disconnect you
- **Missing required fields** → Logged as warnings

### Global Error Handler

- Catches all unhandled errors
- Logs with full stack traces
- Returns user-friendly messages
- Hides sensitive info in production

---

## 🔒 Security Features

We take security seriously:

**Authentication**
- JWT tokens (access + refresh)
- Access tokens are short-lived
- Refresh tokens for renewal
- bcrypt password hashing with salt

**Network Security**
- CORS configured for CLIENT_URL only
- Helmet security headers:
  - Content Security Policy (CSP)
  - HTTP Strict Transport Security (HSTS)
  - X-Content-Type-Options (noSniff)
  - XSS Filter
  - Referrer Policy
- Rate limiting on auth endpoints
- Trust proxy for proper IP detection

**Input Validation**
- Joi schemas validate everything
- File upload limits (10 files, 10MB max)
- File type validation
- SQL injection protection (MongoDB)

**Socket Security**
- Token validation on connection
- UserId verification on every event
- Automatic cleanup on disconnect

---

## 📝 Logging

Using Pino for fast, structured logging:

**Log Levels:**
- `debug` - Detailed flow (socket connections, events)
- `info` - General info (server start, DB connection)
- `warn` - Warnings (missing data, invalid requests)
- `error` - Errors with stack traces
- `fatal` - Critical errors causing shutdown

**What gets logged:**
- All HTTP requests (method, URL, status, duration)
- All socket events (event name, userId)
- Errors with full context
- Database queries (in debug mode)

---

## 🏗️ Project Structure

**Clean Architecture** - Layered design with clear separation of concerns:

```
server/
├── src/
│   ├── config/              # Configuration files
│   │   ├── cloudinaryConfig.ts
│   │   ├── dbConfig.ts
│   │   └── envConfig.ts
│   ├── controllers/         # Request handlers (thin, orchestration only)
│   │   ├── auth.controller.ts
│   │   ├── call.controller.ts
│   │   ├── conversation.controller.ts
│   │   ├── health.controller.ts
│   │   ├── message.controller.ts
│   │   └── user.controller.ts
│   ├── services/            # Business logic + DB operations
│   │   ├── auth.service.ts
│   │   ├── call.service.ts
│   │   ├── conversation.service.ts
│   │   ├── message.service.ts
│   │   ├── socket.service.ts    # ✨ Socket emission layer
│   │   └── user.service.ts
│   ├── socket/              # Socket.IO real-time layer
│   │   ├── handlers/
│   │   │   ├── call.handlers.ts
│   │   │   ├── chat.handlers.ts
│   │   │   ├── disconnect.handler.ts  # ✨ Disconnect cleanup
│   │   │   ├── presence.handlers.ts
│   │   │   └── typing.handlers.ts
│   │   ├── utils/
│   │   │   ├── socketAuth.ts
│   │   │   ├── socketConstants.ts
│   │   │   └── socketHelpers.ts
│   │   └── socketServer.ts
│   ├── middlewares/         # Express middlewares
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── rateLimit.middleware.ts
│   │   ├── requestLogger.middleware.ts
│   │   └── upload.middleware.ts
│   ├── models/              # Mongoose schemas
│   │   ├── auth.model.ts
│   │   ├── call.model.ts
│   │   ├── conversation.model.ts
│   │   ├── message.model.ts
│   │   └── user.model.ts
│   ├── routes/              # API routes
│   │   ├── auth.routes.ts
│   │   ├── call.routes.ts
│   │   ├── conversation.routes.ts
│   │   ├── health.routes.ts
│   │   ├── message.routes.ts
│   │   ├── user.routes.ts
│   │   └── index.ts
│   ├── types/               # TypeScript types
│   ├── utils/               # Helper functions
│   │   └── sanitization.ts  # ✨ XSS protection
│   └── app.ts               # Entry point
├── dist/                    # Compiled JS (after build)
├── .env                     # Environment variables
├── .env.example             # Environment template
├── package.json
├── tsconfig.json
└── README.md                # You are here!
```

**Architecture Principles:**
- **Controllers** → Thin, handle requests/responses only
- **Services** → Business logic + database operations
- **Socket Service** → Centralized real-time emissions
- **Handlers** → Event-specific socket logic
- **Single Source of Truth** → REST API triggers socket events server-side

---

## ⚡ Performance

**Database Optimization:**
- Indexes on frequently queried fields
- Connection pooling
- Cursor-based pagination for messages (more efficient)
- Offset pagination for other resources

**Socket.IO Optimization:**
- Rooms for efficient broadcasting
- Automatic cleanup on disconnect
- Heartbeat monitoring (60s timeout, 25s interval)
- ICE candidate throttling (50/second)
- Optimized online user broadcasts (only on changes)

**Memory Management:**
- Periodic cleanup (every 5 minutes)
- Stale entry removal (30 minutes threshold)
- Timeout cleanup on all code paths
- Graceful shutdown with memory clearing

**File Handling:**
- Direct upload to Cloudinary (no server storage)
- Automatic file type detection
- Size limits enforced (10MB images, 50MB videos, 25MB documents)
- Dangerous extension blocking
- MIME type validation

---

## 🧪 Development Tips

### Testing API Endpoints

Use Postman or Thunder Client:

1. Register: `POST /api/v1/auth/register`
2. Copy the `accessToken`
3. Add header: `Authorization: Bearer <token>`
4. Test away!

### Testing Socket.IO

Browser console:
```javascript
const socket = io('http://localhost:3000', {
  auth: { token: 'your-token' }
});

socket.on('connect', () => {
  console.log('Connected!', socket.id);
  socket.emit('setup');
});

socket.on('onlineUsers', (users) => {
  console.log('Online:', users);
});
```

### Debugging

- `npm run dev:debug` for VS Code debugger
- Check logs for detailed flow
- Use browser DevTools Network tab for Socket.IO
- Enable Mongoose debug mode for DB queries

---

## 🚀 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Configure production MongoDB URI (MongoDB Atlas)
- [ ] Set production CLIENT_URL
- [ ] Enable rate limiting (uncomment in code)
- [ ] Configure CORS for production domain
- [ ] Set up Cloudinary production account
- [ ] Configure call timeouts (CALL_RING_TIMEOUT, CALL_MAX_DURATION)
- [ ] Configure cleanup intervals (CLEANUP_INTERVAL, STALE_THRESHOLD)
- [ ] Enable HTTPS/SSL
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Configure log aggregation
- [ ] Set up automated backups
- [ ] Test WebRTC in production environment
- [ ] Verify graceful shutdown works

### Recommended Hosting

- **Server**: AWS EC2, DigitalOcean, Heroku, Railway, Render
- **Database**: MongoDB Atlas (free tier available)
- **File Storage**: Cloudinary (already configured)
- **Domain**: Use HTTPS in production (required for WebRTC)

---

## 🐛 Troubleshooting

**Socket.IO won't connect**
- Check CORS matches CLIENT_URL
- Verify JWT token is valid
- Check firewall allows WebSocket

**File upload fails**
- Verify Cloudinary credentials
- Check file size < 10MB
- Ensure file type is supported

**Database connection error**
- Verify MongoDB is running
- Check DATABASE_URI format
- Ensure network access

**JWT token errors**
- Check secrets are set in .env
- Verify token hasn't expired
- Ensure header format: `Bearer <token>`

---

## 📚 Core Libraries

**Production:**
- Express.js (v5.1.0) - Web framework
- Socket.IO (v4.8.1) - Real-time communication
- Mongoose (v8.13.2) - MongoDB ODM
- jsonwebtoken (v9.0.2) - JWT auth
- bcrypt (v5.1.1) - Password hashing
- Multer (v1.4.5) - File uploads
- Cloudinary (v1.41.3) - Cloud storage
- Helmet (v8.1.0) - Security headers
- express-rate-limit (v8.1.0) - Rate limiting
- Joi (v17.13.3) - Validation
- Pino (v9.6.0) - Structured logging

**Development:**
- TypeScript (v5.9.3)
- tsx (v4.20.6) - TS execution

## 🏆 Code Quality

**Architecture:**
- ✅ Clean layered architecture (Controller → Service → Model)
- ✅ SOLID principles throughout
- ✅ Single source of truth for real-time events
- ✅ Separation of concerns (socket service layer)
- ✅ DRY code (no duplication)

**Security:**
- ✅ XSS protection with HTML entity encoding
- ✅ File upload validation (extension, MIME, size)
- ✅ Input sanitization on all user data
- ✅ Socket authentication with JWT
- ✅ Regex injection prevention

**Performance:**
- ✅ Cursor-based pagination
- ✅ Memory leak prevention
- ✅ Graceful shutdown
- ✅ ICE candidate throttling
- ✅ Optimized broadcasts

**Maintainability:**
- ✅ TypeScript for type safety
- ✅ Structured logging with context
- ✅ Clear file organization
- ✅ Comprehensive error handling
- ✅ Well-documented code

---

## 📄 License

ISC

## 👨‍💻 Author

**Jatin Parashar**

---

## 🎉 Final Notes

This server is production-ready but always room for improvement! Feel free to:
- Add more features
- Optimize performance
- Improve security
- Fix bugs
- Make it your own!

**Questions?** Check the code - it's well-commented and organized. Each file has a clear purpose.

**Happy coding!** 🚀
