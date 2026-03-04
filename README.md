# Elevate Messaging — Server

Production-ready real-time chat server built with Node.js, TypeScript, Express 5, Socket.IO, and MongoDB.

## Tech Stack

| | |
|---|---|
| **Node.js 18+** | Runtime |
| **TypeScript 5.9** | Strict mode |
| **Express 5.1** | Web framework |
| **Socket.IO 4.8** | Real-time communication |
| **MongoDB 5+** | Database (replica set required for transactions) |
| **Mongoose 8** | ODM with connection pooling |
| **JWT** | Stateless auth (access + refresh tokens) |
| **bcrypt** | Password hashing |
| **Multer + Cloudinary** | File upload and cloud storage |
| **Helmet** | Security headers (CSP, HSTS, noSniff) |
| **express-rate-limit** | Per-route rate limiting (production only) |
| **Joi** | Request validation schemas |
| **Pino** | Structured JSON logging |

## Features

### Messaging
- Real-time delivery via Socket.IO — server emits after every REST call, no client-side socket emissions needed
- File attachments — up to 10 files per message (images 10MB, videos 50MB, documents 25MB)
- Message replies with quoted reference
- Read receipts — delivered + seen, per-user in groups
- Typing indicators per conversation
- Cursor-based pagination for messages (efficient under load)
- Offset pagination for conversations, users, calls

### Calls
- WebRTC peer-to-peer audio and video via simple-peer
- Call history with duration tracking
- Missed call detection — configurable ring timeout (default 45s)
- Max call duration — auto-end after 4h (configurable)
- ICE candidate throttling — 50/second max
- Graceful disconnect handling

### Users
- Atomic registration — MongoDB transaction ensures no orphaned auth/user records
- JWT access tokens (15m) + refresh tokens (7d)
- Timing attack prevention on login (fake hash comparison for unknown emails)
- User search by name or username — text index for fast queries
- Profile pictures via Cloudinary
- Status messages (up to 200 chars)
- Real-time online/offline presence

### Security
- Rate limiting (production only): login 5/15min, register/refresh 10/15min, API 100/min, messages 60/min
- All user endpoints return public fields only — email/password never exposed
- XSS protection — HTML entity encoding on all user content
- File upload security — extension blocking, MIME/extension mismatch detection, size limits
- Socket authentication — JWT validated on every connection
- CORS restricted to `CLIENT_URL` only

## Prerequisites

- Node.js 18+
- MongoDB 5+ (local replica set or Atlas)
- Cloudinary account

## Quick Start

```bash
cd server
npm install
cp .env.example .env   # fill in values
npm run dev
```

## Environment Variables

```env
# Server
NODE_ENV=development
PORT=3000
CLIENT_URL=http://localhost:5173

# Database — replica set required for transactions
DATABASE_URI=mongodb://localhost:27017/chatAppDB?replicaSet=rs0
# Atlas: DATABASE_URI=mongodb+srv://user:pass@cluster.mongodb.net/chatAppDB

# JWT — use 32+ random characters in production
ACCESS_JWT_SECRET=your-access-secret
REFRESH_JWT_SECRET=your-refresh-secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Optional
CALL_RING_TIMEOUT=45000       # ms, default 45s
CALL_MAX_DURATION=14400000    # ms, default 4h
CLEANUP_INTERVAL=300000       # ms, default 5min
STALE_THRESHOLD=1800000       # ms, default 30min
```

## Local MongoDB Replica Set (one-time setup)

Required for transactions. Skip if using Atlas.

1. Add to `mongod.cfg`:
```yaml
replication:
  replSetName: "rs0"
```

2. Restart MongoDB (as administrator):
```bash
net stop MongoDB && net start MongoDB
```

3. Initiate replica set in mongo shell:
```js
rs.initiate()
```

4. Use `?replicaSet=rs0` in `DATABASE_URI`.

## Scripts

```bash
npm run dev           # Hot reload with tsx
npm run dev:debug     # With VS Code debugger
npm run build         # Compile TypeScript → dist/
npm start             # Run compiled build
npm test              # Jest
npm run test:coverage # Jest with coverage
```

## REST API

**Base URL:** `/api/v1`  
Endpoints marked 🔒 require `Authorization: Bearer <accessToken>`.

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Create account (multipart: name, email, username, password, profilePic?, status?) |
| `POST` | `/auth/login` | `{ email, password }` → `{ user, accessToken, refreshToken }` |
| `POST` | `/auth/logout` 🔒 | Invalidate session |
| `POST` | `/auth/refreshToken` | `{ refreshToken }` → `{ user, accessToken }` |
| `GET` | `/auth/check-username/:username` | `{ available: boolean }` |

### Users 🔒

All responses return public fields only: `_id, name, username, profilePic, status`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/user/me` | Your profile |
| `GET` | `/user/all` | All users — query: `limit`, `skip` |
| `GET` | `/user/search?keyword=` | Search by name or username |
| `GET` | `/user/:id` | User by ID |
| `PATCH` | `/user/update` | Update status — `{ status }` |

### Conversations 🔒

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/conversation?isGroup=true\|false` | Create direct chat or group |
| `GET` | `/conversation` | Your conversations sorted by latest activity — query: `limit`, `skip` |
| `GET` | `/conversation/:id` | Single conversation (must be participant) |

### Messages 🔒

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/message` | Send message (multipart: `conversationId`, `content?`, `files[]?`, `replyTo?`) |
| `GET` | `/message/conversation/:id` | Offset pagination — query: `limit`, `skip` |
| `GET` | `/message/conversation/:id/cursor` | Cursor pagination — query: `cursor?`, `limit` |
| `PATCH` | `/message/seen/conversation/:id` | Mark all unread in conversation as seen |
| `PATCH` | `/message/seen/:id` | Mark single message as seen |

### Calls 🔒

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/call/history` | Call history — query: `limit`, `skip` |
| `GET` | `/call/:callId` | Single call record |

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | `{ uptime, database, memory, environment }` |

## Socket.IO Events

Connect with JWT:
```js
const socket = io('http://localhost:3000', { auth: { token: accessToken } });
```

### Presence

| Event | Direction | Payload |
|---|---|---|
| `setup` | Client → Server | — Marks online, joins conversation rooms, delivers offline messages |
| `onlineUsers` | Server → Client | `string[]` — array of online user IDs |

### Messaging

| Event | Direction | Payload |
|---|---|---|
| `joinRoom` | Client → Server | `{ conversationId }` |
| `messageReceived` | Server → Client | Full populated message |
| `conversationReceived` | Server → Client | Full populated conversation |
| `typing` | Client → Server | `{ conversationId }` |
| `stopTyping` | Client → Server | `{ conversationId }` |
| `messageDeliveredUpdate` | Server → Client | `{ conversationId, messageId, userId }` or `{ conversationId, messageIds[], userId }` |
| `messageSeenUpdate` | Server → Client | `{ conversationId, messageId, userId }` |
| `conversationMessagesSeenUpdate` | Server → Client | `{ conversationId, userId }` |

### Calls (WebRTC flow)

| Event | Direction | Payload |
|---|---|---|
| `callInitiated` | Client → Server | `{ callId, receiverId, callerInfo, isVideoCall, signal }` |
| `callReceived` | Server → Client | `{ callId, callerInfo, isVideoCall, signal }` |
| `callAccepted` | Client → Server | `{ callId, signal }` |
| `callDeclined` | Client → Server | `{ callId, reason? }` |
| `callEnded` | Client → Server | `{ callId }` |
| `callSignal` | Bidirectional | `{ callId, signal }` — trickle ICE candidates |
| `callPeerDisconnected` | Server → Client | `{ callId }` |

## Data Models

### User
```ts
{ _id, name, username, profilePic, status, createdAt, updatedAt }
```

### Auth (internal — never returned to clients)
```ts
{ _id, email, password }  // bcrypt hash
```

### Conversation
```ts
{ _id, isGroup, name, participants[], admins[], lastMessage, createdAt, updatedAt }
```

### Message
```ts
{
  _id, conversationId, sender, content, messageType,
  attachments: [{ url, publicId, originalName, mimeType, size }],
  replyTo, deliveredTo[], seenBy[], createdAt, updatedAt
}
// messageType: 'text' | 'image' | 'video' | 'audio' | 'document' | 'file'
```

### Call
```ts
{
  _id, callId, caller, receiver, isVideoCall,
  status: 'calling' | 'accepted' | 'declined' | 'ended' | 'missed',
  duration, startedAt, endedAt, createdAt, updatedAt
}
```

## Performance

### Database Indexes

**Message:**
- `{ conversationId: 1, createdAt: 1 }` — cursor pagination
- `{ conversationId: 1, sender: 1 }` — message queries
- `{ conversationId: 1, deliveredTo: 1 }` — delivery updates
- `{ conversationId: 1, seenBy: 1 }` — seen updates
- `{ conversationId: 1, sender: 1, deliveredTo: 1 }` — pending delivery query

**Conversation:**
- `{ participants: 1 }` — user's conversations
- `{ participants: 1, updatedAt: -1 }` — sorted conversations
- `{ isGroup: 1, participants: 1 }` — group queries

**User:**
- `{ username: 1 }` — unique, fast lookup
- `{ name: 'text', username: 'text' }` — full-text search

### Query Optimizations

- `.lean()` on all read queries — plain JS objects, skips Mongoose document overhead
- `sendMessage` — single `Conversation.findById` (fetches `participants` + `lastMessage` in one projection, returns `isFirstMessage` to controller — no pre-flight read)
- `createMessageInConversation` — 2 DB writes total: `Message.create` + single `Conversation.findByIdAndUpdate` (sets both `lastMessage` and `updatedAt` together)
- `$addToSet` for seen/delivered — atomic, race-condition safe
- Connection pooling — `maxPoolSize: 10`
- Bulk offline message delivery on reconnect — batched `updateMany`, grouped by conversation

## Project Structure

```
server/src/
├── config/
│   ├── constants.ts          # All limits, messages, enum values
│   ├── dbConfig.ts           # Connection pooling
│   └── envConfig.ts          # Validates all env vars on startup
├── controllers/              # Thin — request/response only
├── services/
│   ├── message.service.ts
│   ├── conversation.service.ts
│   ├── user.service.ts
│   └── socket.service.ts     # All socket emissions centralised here
├── socket/
│   ├── handlers/             # One file per event group
│   └── utils/
│       ├── socketAuth.ts     # JWT validation on connect
│       └── socketHelpers.ts  # In-memory online users + active calls
├── middlewares/
│   ├── auth.middleware.ts
│   ├── rateLimit.middleware.ts   # No-op in dev, active in production
│   ├── upload.middleware.ts
│   └── validation.middleware.ts
├── models/                   # Mongoose schemas with indexes
├── routes/                   # Rate limiters applied per-route
├── utils/
│   ├── sanitization.ts       # XSS + filename sanitization
│   ├── queryBuilder.ts       # Reusable paginated queries
│   └── validationSchemas.ts  # Joi schemas
└── app.ts
```

## Error Responses

```json
{ "status": "fail", "message": "What went wrong" }
```

| Code | Meaning |
|---|---|
| 400 | Validation failed |
| 401 | Missing or invalid token |
| 403 | Not authorized for this resource |
| 404 | Resource not found |
| 500 | Server error (details hidden in production) |

## Production Checklist

- [ ] `NODE_ENV=production`
- [ ] Strong JWT secrets (32+ random chars)
- [ ] MongoDB Atlas URI (already a replica set)
- [ ] `CLIENT_URL` set to production frontend domain
- [ ] HTTPS enabled (required for WebRTC)
- [ ] Cloudinary production account configured
- [ ] Error monitoring (Sentry, etc.)
- [ ] Log aggregation
- [ ] Automated DB backups

## Recommended Hosting

- **Server:** Railway, Render, AWS EC2, DigitalOcean
- **Database:** MongoDB Atlas (free tier works)
- **Files:** Cloudinary (already configured)

## Troubleshooting

**Transaction errors locally**
```
MongoServerError: Transaction numbers are only allowed on a replica set member
```
→ Follow the replica set setup above. Ensure `DATABASE_URI` includes `?replicaSet=rs0`.

**Socket.IO won't connect** → Check `CLIENT_URL` matches frontend origin exactly. Verify JWT is valid.

**File upload fails** → Check Cloudinary credentials. Verify file type and size are within limits.

**JWT errors** → Verify secrets are set. Header must be `Authorization: Bearer <token>`.

## Author

Jatin Parashar
