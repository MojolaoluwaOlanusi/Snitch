# Snitch Backend

The core API and WebSocket server for Snitch - a Node.js/Express/TypeScript backend with real-time messaging, MongoDB persistence, Redis caching, and Cloudflare R2 storage.

---

## 📋 Project Overview

The Snitch backend is the brains of the operation, providing a REST API for all CRUD operations and a WebSocket server for real-time messaging. It uses MongoDB for data persistence, Redis for caching and pub/sub, and Cloudflare R2 for object storage. Built with TypeScript for type safety and Express for the web framework.

---

## 🛠️ Tech Stack Deep Dive

### Core Runtime
- **Node.js 20+**: JavaScript runtime with latest features
- **Express**: Fast, minimalist web framework
- **TypeScript**: Type-safe development with full type checking

### Database & ORM
- **MongoDB Atlas**: NoSQL database for persistent data
- **Mongoose**: MongoDB ODM with schema validation and middleware
- **Why MongoDB**: Flexible schema for social data, excellent for real-time apps

### Real-time
- **Socket.IO**: WebSocket server with automatic reconnection and room support
- **ioredis**: Redis client for pub/sub and caching
- **Why Socket.IO**: Built-in reconnection, room management, HTTP fallback

### Job Queue
- **BullMQ**: Redis-based job queue for background tasks
- **Why BullMQ**: Reliable job processing, retry logic, job scheduling

### Storage
- **aws-sdk/client-s3**: S3-compatible client for Cloudflare R2
- **Why R2**: Zero egress fees, S3-compatible API

### Security
- **bcryptjs**: Password hashing with salt
- **jsonwebtoken**: JWT token generation and validation
- **web-push**: Web Push API for browser notifications

### Other Key Libraries
- **cheerio**: HTML parsing for link previews
- **axios**: HTTP client for external API calls
- **multer**: File upload handling (for presigned URLs)

---

## 📁 Complete Folder Structure

`
src/
├── routes/             # REST endpoint files
│   ├── auth.ts         # Authentication routes (login, signup, etc.)
│   ├── users.ts        # User management routes
│   ├── posts.ts        # Post CRUD routes
│   ├── reposts.ts      # Repost routes
│   ├── search.ts       # Search routes
│   ├── chat.ts         # Chat/messaging routes
│   ├── admin.ts        # Admin-only routes
│   ├── uploads.ts      # File upload/presign routes
│   └── notifications.ts # Push notification routes
├── controllers/        # Business logic for routes
│   ├── authController.ts
│   ├── userController.ts
│   ├── postController.ts
│   ├── chatController.ts
│   └── adminController.ts
├── models/             # Mongoose schemas
│   ├── User.ts         # User schema
│   ├── Post.ts         # Post schema
│   ├── Repost.ts       # Repost schema
│   ├── Message.ts      # Message schema
│   ├── Conversation.ts # Conversation schema
│   ├── Notification.ts # Notification schema
│   ├── Contact.ts      # Contact schema
│   ├── Sticker.ts      # Sticker schema
│   ├── ThemeColor.ts   # Theme color schema
│   └── UserWallpaper.ts # User wallpaper schema
├── services/           # External service integrations
│   ├── redisCache.ts   # Redis caching utilities
│   ├── pushNotifications.ts # Web Push setup
│   ├── r2Storage.ts    # R2/S3 storage client
│   └── linkPreview.ts  # Link preview generation
├── middleware/         # Express middleware
│   ├── protectRoute.ts # JWT authentication middleware
│   ├── rateLimiter.ts  # Rate limiting middleware
│   ├── errorHandler.ts # Global error handler
│   └── validation.ts   # Request validation middleware
├── realtime/           # WebSocket server setup
│   ├── socket.ts       # Socket.IO server configuration
│   ├── handlers/       # Socket event handlers
│   │   ├── messageHandler.ts
│   │   ├── typingHandler.ts
│   │   └── callHandler.ts
│   └── redisRoomStore.ts # Redis-backed room management
├── worker/             # BullMQ processors
│   ├── processor.ts    # Background job processor
│   └── jobs/           # Job definitions
│       ├── sendPushNotification.ts
│       ├── deleteOrphanedFiles.ts
│       └── processMedia.ts
├── utils/              # Helper functions
│   ├── hashing.ts      # Password hashing utilities
│   ├── jwt.ts          # JWT token utilities
│   ├── validators.ts   # Input validation
│   └── date.ts         # Date formatting
├── types/              # TypeScript types
│   ├── express.d.ts    # Express type extensions
│   └── index.ts        # Shared types
├── app.ts              # Express app configuration
└── server.ts           # Server entry point
`

### Directory Explanations

**src/routes/**: All REST endpoint files. Each file handles a specific resource (auth, users, posts, etc.).

**src/controllers/**: Business logic separated from routes. Controllers handle request processing and response formatting.

**src/models/**: Mongoose schemas defining data structure and validation rules for MongoDB collections.

**src/services/**: External service integrations. Redis caching, push notifications, R2 storage, and link previews.

**src/middleware/**: Express middleware functions. Auth guards, rate limiting, error handling, and validation.

**src/realtime/**: WebSocket server setup. Socket.IO configuration, event handlers, and Redis-backed room management.

**src/worker/**: BullMQ background job processors. Handles tasks like sending push notifications and cleaning up files.

**src/utils/**: Pure utility functions. Password hashing, JWT utilities, input validation, and date formatting.

**src/types/**: TypeScript type definitions and extensions.

---

## 📡 REST API Endpoint Documentation

### Authentication Routes (/api/auth)

#### POST /api/auth/register
Register a new user account.

**Authentication**: No

**Request Body**:
`json
{
  "username": "string (required, unique)",
  "email": "string (required, unique)",
  "password": "string (required, min 8 chars)",
  "displayName": "string (optional)"
}
`

**Success Response** (201):
`json
{
  "user": {
    "_id": "string",
    "username": "string",
    "email": "string",
    "displayName": "string",
    "avatarUrl": "string"
  },
  "token": "string (JWT)"
}
`

**Error Responses**:
- 400: Invalid input or missing fields
- 409: Username or email already exists

**Example**:
`ash
curl -X POST https://api.snitch.fly.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"john","email":"john@example.com","password":"password123"}'
`

#### POST /api/auth/login
Authenticate a user and receive a JWT token.

**Authentication**: No

**Request Body**:
`json
{
  "username": "string (required)",
  "password": "string (required)"
}
`

**Success Response** (200):
`json
{
  "user": {
    "_id": "string",
    "username": "string",
    "email": "string",
    "displayName": "string",
    "avatarUrl": "string"
  },
  "token": "string (JWT)"
}
`

**Error Responses**:
- 400: Missing credentials
- 401: Invalid credentials

**Example**:
`ash
curl -X POST https://api.snitch.fly.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"john","password":"password123"}'
`

#### POST /api/auth/logout
Logout a user (invalidate token on server if using refresh tokens).

**Authentication**: Required (JWT)

**Request Body**: None

**Success Response** (200):
`json
{
  "message": "Logged out successfully"
}
`

---

### User Routes (/api/users)

#### GET /api/users/profile/:username
Get a user's public profile.

**Authentication**: Optional

**URL Params**:
- username: User's username

**Success Response** (200):
`json
{
  "_id": "string",
  "username": "string",
  "displayName": "string",
  "avatarUrl": "string",
  "bio": "string",
  "followersCount": "number",
  "followingCount": "number",
  "postsCount": "number"
}
`

**Error Responses**:
- 404: User not found

#### PUT /api/users/profile
Update current user's profile.

**Authentication**: Required (JWT)

**Request Body**:
`json
{
  "displayName": "string (optional)",
  "bio": "string (optional)",
  "avatarUrl": "string (optional)",
  "links": ["string (optional)"]
}
`

**Success Response** (200):
`json
{
  "user": {
    "_id": "string",
    "username": "string",
    "displayName": "string",
    "bio": "string",
    "avatarUrl": "string"
  }
}
`

**Error Responses**:
- 400: Invalid input
- 401: Not authenticated

#### POST /api/users/follow/:userId
Follow a user.

**Authentication**: Required (JWT)

**URL Params**:
- userId: ID of user to follow

**Success Response** (200):
`json
{
  "message": "User followed successfully"
}
`

**Error Responses**:
- 400: Cannot follow yourself
- 404: User not found
- 409: Already following

#### DELETE /api/users/follow/:userId
Unfollow a user.

**Authentication**: Required (JWT)

**URL Params**:
- userId: ID of user to unfollow

**Success Response** (200):
`json
{
  "message": "User unfollowed successfully"
}
`

---

### Post Routes (/api/posts)

#### GET /api/posts/feed
Get the current user's feed (posts from followed users).

**Authentication**: Required (JWT)

**Query Params**:
- page: Page number (default: 1)
- limit: Posts per page (default: 20)

**Success Response** (200):
`json
{
  "posts": [
    {
      "_id": "string",
      "content": "string",
      "media": ["string"],
      "author": {
        "_id": "string",
        "username": "string",
        "displayName": "string",
        "avatarUrl": "string"
      },
      "likesCount": "number",
      "commentsCount": "number",
      "createdAt": "string (ISO date)"
    }
  ],
  "total": "number",
  "page": "number",
  "hasMore": "boolean"
}
`

#### POST /api/posts
Create a new post.

**Authentication**: Required (JWT)

**Request Body**:
`json
{
  "content": "string (required)",
  "media": ["string (optional)"],
  "hashtags": ["string (optional)"]
}
`

**Success Response** (201):
`json
{
  "post": {
    "_id": "string",
    "content": "string",
    "media": ["string"],
    "author": {
      "_id": "string",
      "username": "string",
      "displayName": "string"
    },
    "createdAt": "string (ISO date)"
  }
}
`

**Error Responses**:
- 400: Invalid input or empty content
- 401: Not authenticated

#### GET /api/posts/:postId
Get a single post by ID.

**Authentication**: Optional

**URL Params**:
- postId: Post ID

**Success Response** (200):
`json
{
  "_id": "string",
  "content": "string",
  "media": ["string"],
  "author": {
    "_id": "string",
    "username": "string",
    "displayName": "string",
    "avatarUrl": "string"
  },
  "likesCount": "number",
  "commentsCount": "number",
  "createdAt": "string (ISO date)"
}
`

**Error Responses**:
- 404: Post not found

#### PUT /api/posts/:postId
Update a post.

**Authentication**: Required (JWT)

**URL Params**:
- postId: Post ID

**Request Body**:
`json
{
  "content": "string (required)"
}
`

**Success Response** (200):
`json
{
  "post": {
    "_id": "string",
    "content": "string",
    "updatedAt": "string (ISO date)"
  }
}
`

**Error Responses**:
- 400: Invalid input
- 401: Not authenticated
- 403: Not the post author
- 404: Post not found

#### DELETE /api/posts/:postId
Delete a post.

**Authentication**: Required (JWT)

**URL Params**:
- postId: Post ID

**Success Response** (200):
`json
{
  "message": "Post deleted successfully"
}
`

**Error Responses**:
- 401: Not authenticated
- 403: Not the post author
- 404: Post not found

#### POST /api/posts/:postId/like
Like a post.

**Authentication**: Required (JWT)

**URL Params**:
- postId: Post ID

**Success Response** (200):
`json
{
  "liked": true,
  "likesCount": "number"
}
`

#### DELETE /api/posts/:postId/like
Unlike a post.

**Authentication**: Required (JWT)

**URL Params**:
- postId: Post ID

**Success Response** (200):
`json
{
  "liked": false,
  "likesCount": "number"
}
`

---

### Search Routes (/api/search)

#### GET /api/search/users
Search for users by username or display name.

**Authentication**: Required (JWT)

**Query Params**:
- q: Search query (required)
- page: Page number (default: 1)
- limit: Results per page (default: 20)

**Success Response** (200):
`json
{
  "users": [
    {
      "_id": "string",
      "username": "string",
      "displayName": "string",
      "avatarUrl": "string"
    }
  ],
  "total": "number"
}
`

#### GET /api/search/posts
Search for posts by content or hashtags.

**Authentication**: Required (JWT)

**Query Params**:
- q: Search query (required)
- page: Page number (default: 1)
- limit: Results per page (default: 20)

**Success Response** (200):
`json
{
  "posts": [
    {
      "_id": "string",
      "content": "string",
      "author": {
        "_id": "string",
        "username": "string",
        "displayName": "string"
      }
    }
  ],
  "total": "number"
}
`

---

### Chat Routes (/api/chat)

#### GET /api/chat/conversations
Get all conversations for the current user.

**Authentication**: Required (JWT)

**Success Response** (200):
`json
{
  "conversations": [
    {
      "_id": "string",
      "participants": [
        {
          "_id": "string",
          "username": "string",
          "displayName": "string",
          "avatarUrl": "string"
        }
      ],
      "lastMessage": {
        "_id": "string",
        "text": "string",
        "createdAt": "string"
      },
      "updatedAt": "string (ISO date)"
    }
  ]
}
`

#### POST /api/chat/conversation/:userId
Get or create a conversation with a user.

**Authentication**: Required (JWT)

**URL Params**:
- userId: ID of the other user

**Success Response** (200):
`json
{
  "_id": "string",
  "participants": [
    {
      "_id": "string",
      "username": "string",
      "displayName": "string"
    }
  ],
  "isGroup": false
}
`

#### GET /api/chat/messages/:conversationId
Get messages in a conversation.

**Authentication**: Required (JWT)

**URL Params**:
- conversationId: Conversation ID

**Query Params**:
- limit: Number of messages (default: 50)
- efore: Get messages before this message ID (pagination)

**Success Response** (200):
`json
{
  "messages": [
    {
      "_id": "string",
      "conversationId": "string",
      "senderId": "string",
      "text": "string",
      "media": ["string"],
      "createdAt": "string (ISO date)"
    }
  ]
}
`

#### POST /api/chat/group
Create a group chat.

**Authentication**: Required (JWT)

**Request Body**:
`json
{
  "name": "string (required)",
  "participantIds": ["string (required)"],
  "avatar": "string (optional)",
  "description": "string (optional)"
}
`

**Success Response** (201):
`json
{
  "_id": "string",
  "groupName": "string",
  "participants": ["string"],
  "isGroup": true,
  "admin": "string"
}
`

---

### Admin Routes (/api/admin)

#### GET /api/admin/users
Get all users (admin only).

**Authentication**: Required (JWT, admin role)

**Query Params**:
- page: Page number (default: 1)
- limit: Results per page (default: 50)
- search: Search query (optional)

**Success Response** (200):
`json
{
  "users": [
    {
      "_id": "string",
      "username": "string",
      "email": "string",
      "role": "string",
      "isBanned": "boolean",
      "createdAt": "string"
    }
  ],
  "total": "number"
}
`

**Error Responses**:
- 401: Not authenticated
- 403: Not an admin

#### POST /api/admin/ban-user
Ban a user (admin only).

**Authentication**: Required (JWT, admin role)

**Request Body**:
`json
{
  "userId": "string (required)",
  "reason": "string (optional)"
}
`

**Success Response** (200):
`json
{
  "message": "User banned successfully"
}
`

#### DELETE /api/admin/posts/:postId
Delete any post (admin only).

**Authentication**: Required (JWT, admin role)

**URL Params**:
- postId: Post ID

**Success Response** (200):
`json
{
  "message": "Post deleted successfully"
}
`

---

### Upload Routes (/api/media)

#### POST /api/media/presign
Get a presigned URL for direct upload to R2.

**Authentication**: Required (JWT)

**Request Body**:
`json
{
  "filename": "string (required)",
  "contentType": "string (required)",
  "size": "number (optional)",
  "folder": "string (optional)"
}
`

**Success Response** (200):
`json
{
  "ok": true,
  "uploadUrl": "string (presigned URL)",
  "method": "PUT",
  "key": "string (object key)",
  "publicUrl": "string (public URL)"
}
`

**Example**:
`ash
curl -X POST https://api.snitch.fly.dev/api/media/presign \
  -H "Authorization: Bearer " \
  -H "Content-Type: application/json" \
  -d '{"filename":"photo.jpg","contentType":"image/jpeg"}'
`

---

## 🔌 WebSocket Server Documentation

### Connection URL

`
wss://api.snitch.fly.dev
`

### Authentication

JWT token is passed via the uth object in the Socket.IO connection:

`javascript
const socket = io('wss://api.snitch.fly.dev', {
  auth: { token: 'your-jwt-token' }
});
`

### Events (Client → Server)

#### join-room
Join a conversation room for real-time updates.

**Payload**:
`json
{
  "roomId": "string (conversation ID)"
}
`

#### leave-room
Leave a conversation room.

**Payload**:
`json
{
  "roomId": "string (conversation ID)"
}
`

#### send-message
Send a message to a conversation.

**Payload**:
`json
{
  "conversationId": "string",
  "text": "string",
  "media": ["string"],
  "replyTo": "string (message ID, optional)"
}
`

**Ack**:
`json
{
  "ok": true,
  "message": {
    "_id": "string",
    "text": "string",
    "createdAt": "string"
  }
}
`

#### 	yping:start
Indicate user is typing.

**Payload**:
`json
{
  "conversationId": "string"
}
`

#### 	yping:stop
Indicate user stopped typing.

**Payload**:
`json
{
  "conversationId": "string"
}
`

#### message:edit
Edit a message.

**Payload**:
`json
{
  "messageId": "string",
  "newText": "string"
}
`

#### message:delete
Delete a message.

**Payload**:
`json
{
  "messageId": "string"
}
`

#### eaction:add
Add a reaction to a message.

**Payload**:
`json
{
  "messageId": "string",
  "reaction": "string (emoji)"
}
`

### Events (Server → Client)

#### eceive_message
New message received.

**Payload**:
`json
{
  "_id": "string",
  "conversationId": "string",
  "senderId": "string",
  "text": "string",
  "media": ["string"],
  "createdAt": "string"
}
`

#### message:edited
Message was edited.

**Payload**:
`json
{
  "messageId": "string",
  "newText": "string"
}
`

#### message:deleted
Message was deleted.

**Payload**:
`json
{
  "messageId": "string"
}
`

#### 	yping:start
User started typing.

**Payload**:
`json
{
  "userId": "string",
  "conversationId": "string"
}
`

#### 	yping:stop
User stopped typing.

**Payload**:
`json
{
  "userId": "string",
  "conversationId": "string"
}
`

#### user_online
User came online.

**Payload**:
`json
{
  "userId": "string"
}
`

#### user_offline
User went offline.

**Payload**:
`json
{
  "userId": "string"
}
`

#### eaction:update
Message reactions updated.

**Payload**:
`json
{
  "messageId": "string",
  "reactions": {
    "👍": ["userId1", "userId2"],
    "❤️": ["userId3"]
  }
}
`

### Redis Pub/Sub

WebSocket servers on multiple Fly.io instances synchronize messages via Redis Pub/Sub:

1. When a user sends a message, the server publishes to a Redis channel
2. All backend instances subscribe to the channel
3. Each instance forwards the message to connected clients in the room
4. This ensures real-time sync across multiple backend instances

---

## 🔄 Background Workers (BullMQ)

### Job Queue Setup

BullMQ uses Redis as the job queue backend. Jobs are queued from the main application and processed by worker processes.

### Job Types

#### send-push-notification
Send a web push notification to a user.

**Payload**:
`json
{
  "userId": "string",
  "title": "string",
  "body": "string",
  "icon": "string (optional)"
}
`

**Trigger**: When a user receives a message or mention.

#### delete-orphaned-files
Delete files from R2 that are no longer referenced.

**Payload**:
`json
{
  "fileKeys": ["string"]
}
`

**Trigger**: Scheduled job runs daily.

#### process-media
Process uploaded media (resize, compress, generate thumbnails).

**Payload**:
`json
{
  "fileKey": "string",
  "fileType": "string"
}
`

**Trigger**: When a file is uploaded via presigned URL.

### Processing

Jobs are processed by src/worker/processor.ts. The worker:
1. Connects to Redis
2. Processes jobs from the queue
3. Handles retries and failures
4. Logs job completion

Run the worker separately:

`ash
npm run worker
`

---

## 🗄️ Database Models

### User
- _id: ObjectId
- username: String (unique, required)
- email: String (unique, required)
- passwordHash: String (required)
- displayName: String
- vatarUrl: String
- io: String
- links: [String]
- ollowers: [ObjectId]
- ollowing: [ObjectId]
- ole: String ('user' | 'admin')
- isBanned: Boolean
- createdAt: Date
- updatedAt: Date

### Post
- _id: ObjectId
- uthor: ObjectId (ref: User)
- content: String (required)
- media: [String]
- hashtags: [String]
- likes: [ObjectId]
- comments: [ObjectId]
- eposts: [ObjectId]
- createdAt: Date
- updatedAt: Date

### Message
- _id: ObjectId
- conversationId: ObjectId (ref: Conversation)
- senderId: ObjectId (ref: User)
- 	ext: String
- media: [String]
- eplyTo: ObjectId (ref: Message)
- eactions: Object (emoji → [userId])
- iewedBy: [ObjectId]
- iewOnce: Boolean
- createdAt: Date
- updatedAt: Date

### Conversation
- _id: ObjectId
- participants: [ObjectId] (ref: User)
- isGroup: Boolean
- groupName: String
- groupAvatar: String
- groupDescription: String
- dmin: ObjectId (ref: User)
- lastMessage: ObjectId (ref: Message)
- createdAt: Date
- updatedAt: Date

---

## 🔐 Environment Variables

Create a .env file in the backend root:

`env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/snitch?retryWrites=true&w=majority&tls=true
REDIS_URL=rediss://username:password@redis-host:6379
JWT_SECRET=your-super-secret-jwt-key
HMAC_VERIFICATION_CODE_SECRET=your-hmac-secret
R2_ACCESS_KEY=your-r2-access-key
R2_SECRET_KEY=your-r2-secret-key
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
R2_BUCKET=snitch-media
WEB_PUSH_PUBLIC_KEY=your-vapid-public-key
WEB_PUSH_PRIVATE_KEY=your-vapid-private-key
CLIENT_URL=http://localhost:5173
GIPHY_API_KEY=your-giphy-api-key
UNSPLASH_ACCESS_KEY=your-unsplash-access-key
`

### Variable Descriptions

- **PORT**: Server port (default: 5000)
- **NODE_ENV**: Environment (development/production)
- **MONGODB_URI**: MongoDB connection string with TLS enabled
- **REDIS_URL**: Redis connection string (use ediss:// for TLS)
- **JWT_SECRET**: Secret key for JWT signing
- **HMAC_VERIFICATION_CODE_SECRET**: Secret for HMAC verification
- **R2_ACCESS_KEY**: Cloudflare R2 access key
- **R2_SECRET_KEY**: Cloudflare R2 secret key
- **R2_ENDPOINT**: R2 endpoint URL (must be HTTPS)
- **R2_BUCKET**: R2 bucket name
- **WEB_PUSH_PUBLIC_KEY**: VAPID public key for push notifications
- **WEB_PUSH_PRIVATE_KEY**: VAPID private key for push notifications
- **CLIENT_URL**: Frontend URL for CORS configuration
- **GIPHY_API_KEY**: Giphy API key for GIF search (optional)
- **UNSPLASH_ACCESS_KEY**: Unsplash API key for wallpapers (optional)

---

## 🚀 Local Development Setup

### 1. Install dependencies

`ash
cd backend
npm install
`

### 2. Configure environment variables

Copy .env.example to .env:

`ash
cp .env.example .env
`

Edit .env with your credentials.

### 3. Start development server

`ash
npm run dev
`

The server will start at http://localhost:5000

### 4. Run tests (if available)

`ash
npm test
`

### 5. Run background worker (if needed)

`ash
npm run worker
`

---

## 🌐 Production Deployment (Fly.io)

### fly.toml Configuration

`	oml
app = "snitch-backend"
primary_region = "iad"

[build]
  builder = "heroku/builder"

[env]
  PORT = "5000"
  NODE_ENV = "production"

[http_service]
  internal_port = 5000
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1

  [[http_service.checks]]
    interval = "30s"
    timeout = "10s"
    grace_period = "5s"
    method = "GET"
    path = "/health"

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 1024
`

### WebSocket Support

For WebSocket connections, add this to ly.toml:

`	oml
[http_service]
  idle_timeout = "24h"
`

### Set Secrets

`ash
flyctl secrets set MONGODB_URI="your-mongodb-uri"
flyctl secrets set REDIS_URL="your-redis-url"
flyctl secrets set JWT_SECRET="your-jwt-secret"
flyctl secrets set R2_ACCESS_KEY="your-r2-key"
flyctl secrets set R2_SECRET_KEY="your-r2-secret"
flyctl secrets set R2_ENDPOINT="your-r2-endpoint"
flyctl secrets set R2_BUCKET="your-r2-bucket"
flyctl secrets set WEB_PUSH_PUBLIC_KEY="your-vapid-public"
flyctl secrets set WEB_PUSH_PRIVATE_KEY="your-vapid-private"
flyctl secrets set CLIENT_URL="https://your-frontend.vercel.app"
`

### Deploy

`ash
flyctl deploy
`

---

## 🔒 Security Considerations

### JWT Handling

- JWT tokens expire after 7 days
- Refresh tokens can be implemented for longer sessions
- Tokens are stored in httpOnly cookies in production
- Verify token signature on every protected route

### CORS Configuration

CORS is configured to allow requests from your Vercel domains:

`javascript
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
`

### Rate Limiting

Rate limiting is implemented to prevent abuse:
- 100 requests per minute per IP
- Stricter limits for auth endpoints
- Configured via src/middleware/rateLimiter.ts

### File Upload Security

- File type validation (only allow images, videos)
- File size limits (max 10MB per file)
- Virus scanning can be added via R2 integrations
- Presigned URLs expire after 1 hour

### TLS/SSL

**IMPORTANT**: NODE_TLS_REJECT_UNAUTHORIZED MUST NOT be set to   in production.

- MongoDB: Use mongodb+srv:// with &tls=true
- Redis: Use ediss:// for TLS connections
- R2: Use https:// endpoint
- Proper certificate validation is enforced

---

## 🐛 Developer Notes & Troubleshooting

### "Cannot find module" Errors

If you encounter module resolution errors:
- Ensure all imports use correct file extensions (.js for compiled output)
- Check that 	sconfig.json has correct outDir and ootDir
- Run 
pm run build to compile TypeScript to JavaScript

### Redis Connectivity Issues

If Redis connection fails:
- Verify REDIS_URL is correct
- Check that Redis TLS is configured (ediss://)
- Ensure Redis Cloud allows connections from Fly.io IP ranges
- Test connection: edis-cli -u rediss://your-url ping

### WebSocket Idle Timeout

If WebSocket connections drop:
- Check idle_timeout in ly.toml is set to "24h"
- Verify Socket.IO configuration allows reconnection
- Check Fly.io logs for timeout errors

### Debugging with Fly.io

View logs in real-time:

`ash
flyctl logs
`

View logs for a specific region:

`ash
flyctl logs --region iad
`

SSH into a running instance:

`ash
flyctl ssh console
`

### Common Gotchas

- **MongoDB connection string**: Must include &tls=true for TLS
- **Redis URL**: Use ediss:// for TLS, not edis://
- **R2 endpoint**: Must be https://, not http://
- **Environment variables**: All secrets must be set via lyctl secrets set
- **WebSocket auth**: Token passed via uth object, not headers

---

## 📝 Additional Notes

### TypeScript Configuration

The backend uses strict TypeScript settings. See 	sconfig.json:
- strict: true for strict type checking
- 
oImplicitAny: false to allow any types where needed
- useUnknownInCatchVariables: false for easier error handling

### API Versioning

The API uses URL path versioning (e.g., /api/v1/posts). All current routes are v1.

### Error Handling

Global error handler in src/middleware/errorHandler.ts:
- Catches all errors
- Logs error details
- Returns appropriate HTTP status codes
- Sanitizes error messages in production

### Logging

Use console.log for development. Consider adding a logging library like Winston for production.

---

## 🤝 Contributing

When contributing to the backend:
- Follow TypeScript best practices
- Add JSDoc comments for public functions
- Write unit tests for new features
- Update API documentation for new routes
- Ensure all environment variables are documented
- Test WebSocket functionality thoroughly
- Verify Redis pub/sub works across instances