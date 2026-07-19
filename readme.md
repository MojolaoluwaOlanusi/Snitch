# Snitch

**A full-stack social media application with real-time chat, posts, reposts, search, push notifications, and an admin dashboard.**

---

## 🌟 Project Overview

Snitch is a modern, feature-rich social media platform designed for seamless real-time communication and content sharing. Built with a serverless-friendly architecture, it combines the power of React for the frontend, Node.js/Express for the backend, and MongoDB Atlas for data persistence. The application features real-time messaging via WebSockets, Redis-backed caching and pub/sub, and zero-egress object storage via Cloudflare R2.

### What problem does it solve?

Snitch addresses the need for a scalable, real-time social platform that can handle concurrent messaging, content sharing, and moderation without the complexity of traditional monolithic architectures. It's designed for developers who want to build social applications with modern infrastructure patterns.

### Who is it for?

- **Developers** looking for a reference implementation of a full-stack social media application
- **Teams** needing a scalable real-time communication platform
- **Organizations** requiring an admin dashboard for content moderation

### Why is it special?

- **Real-time architecture**: WebSocket + Redis Pub/Sub for instant messaging across multiple backend instances
- **Serverless-friendly design**: Vercel for frontend + Fly.io for backend enables easy scaling
- **Zero-egress storage**: Cloudflare R2 eliminates bandwidth costs for media uploads
- **Type-safe**: Full TypeScript implementation across backend and frontend

---

## ✨ Core Features

### User Features
- **Authentication**: JWT-based auth with secure token management
- **Posts**: Create, edit, delete, and repost content with media attachments
- **Real-time messaging**: WebSocket-powered chat with typing indicators, read receipts, and reactions
- **Search**: Full-text search for users, posts, and hashtags
- **Push notifications**: Web Push API for browser notifications
- **File uploads**: Direct-to-R2 uploads via presigned URLs
- **User profiles**: Customizable profiles with avatars, bios, and social links
- **Content moderation**: Report system for inappropriate content

### Admin Features
- **Dashboard**: Analytics and system overview
- **User management**: View, edit, and ban users
- **Content moderation**: Review and remove reported posts
- **System analytics**: Monitor platform health and usage

---

## 🏗️ Architecture Overview

`
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Vercel        │         │   Fly.io        │         │   MongoDB Atlas │
│   (Frontend)    │◄────────►│   (Backend)     │◄────────►│   (Database)    │
│   React + Vite  │  HTTPS  │   Express + TS  │  TLS    │   Primary DB    │
└─────────────────┘         └────────┬────────┘         └─────────────────┘
                                     │
                                     │ TLS
                                     ▼
                            ┌─────────────────┐
                            │   Redis Cloud   │
                            │   (Cache + Pub) │
                            └─────────────────┘
                                     │
                                     │ HTTPS
                                     ▼
                            ┌─────────────────┐
                            │  Cloudflare R2  │
                            │  (Object Store) │
                            └─────────────────┘
`

**Flow Description:**
1. **Frontend (Vercel)**: React applications served via Vercel CDN
2. **Backend (Fly.io)**: REST API + WebSocket server handles all business logic
3. **MongoDB Atlas**: Primary database for persistent data
4. **Redis Cloud**: Caching layer and WebSocket Pub/Sub for real-time sync across instances
5. **Cloudflare R2**: Object storage for images, videos, and media with zero egress fees

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + Vite | User-facing UI |
| | TailwindCSS 3 + DaisyUI 4 | Styling framework |
| | React Router DOM | Client-side routing |
| | Axios | HTTP client |
| | Socket.IO Client | WebSocket client |
| | Zustand | State management |
| **Admin Panel** | React 18 + Vite | Admin dashboard UI |
| | TailwindCSS 3 + DaisyUI 4 | Styling framework |
| | React Router DOM | Client-side routing |
| | Axios | HTTP client |
| **Backend** | Node.js 20+ | Runtime environment |
| | Express | Web framework |
| | TypeScript | Type safety |
| | Socket.IO | WebSocket server |
| | Mongoose | MongoDB ODM |
| | ioredis | Redis client |
| | BullMQ | Job queue |
| | aws-sdk/client-s3 | R2 storage client |
| | bcryptjs | Password hashing |
| | jsonwebtoken | JWT auth |
| | web-push | Push notifications |
| **Database** | MongoDB Atlas | Primary database |
| **Cache/Queue** | Redis Cloud | Caching + Pub/Sub + Job Queue |
| **Storage** | Cloudflare R2 | Object storage (images/videos) |
| **Deployment** | Vercel | Frontend & Admin hosting |
| | Fly.io | Backend hosting |

---

## 📋 Prerequisites

Before you begin, ensure you have the following:

- **Node.js** v20 or higher
- **npm** or **pnpm** package manager
- **Git** for version control
- **Fly.io account** for backend deployment
- **Vercel account** for frontend/admin deployment
- **MongoDB Atlas account** for database
- **Redis Cloud account** for caching and pub/sub
- **Cloudflare R2 account** for object storage

---

## 🚀 Quick Start (Development)

### 1. Clone the repository

`ash
git clone https://github.com/olanu/Snitch.git
cd Snitch
`

### 2. Install dependencies

`ash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install admin dependencies
cd ../admin
npm install
`

### 3. Configure environment variables

See the [Environment Variables](#environment-variables) section below for required variables. Copy the example .env files from each subdirectory and configure them with your credentials.

### 4. Start local development

`ash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev

# Terminal 3: Start admin (optional)
cd admin
npm run dev
`

For detailed setup instructions for each service, see the respective README files:
- [Frontend README](./frontend/README.md)
- [Admin README](./admin/README.md)
- [Backend README](./backend/README.md)

---

## 🌐 Deployment Overview

### Frontend & Admin (Vercel)
- Connected to GitHub repository
- Auto-deploys on push to main branch
- Environment variables configured in Vercel dashboard
- CDN caching for static assets

### Backend (Fly.io)
- Deployed via lyctl deploy
- Configured with ly.toml for WebSocket support
- Secrets managed via lyctl secrets set
- Auto-scaling enabled

### Database (MongoDB Atlas)
- Free tier available for development
- Production tier for scaling
- TLS connections required
- Atlas Search for full-text search

### Cache (Redis Cloud)
- Free tier available for development
- Production tier for scaling
- TLS connections required (ediss://)

### Storage (Cloudflare R2)
- Zero egress fees
- Presigned URLs for direct uploads
- Public URL generation for media access

---

## 🔐 Environment Variables

### Backend (.env)
| Variable | Description | Required |
|----------|-------------|----------|
| PORT | Server port | Yes |
| NODE_ENV | Environment (development/production) | Yes |
| MONGODB_URI | MongoDB connection string (with &tls=true) | Yes |
| REDIS_URL | Redis connection string (use ediss:// for TLS) | Yes |
| JWT_SECRET | Secret for JWT signing | Yes |
| HMAC_VERIFICATION_CODE_SECRET | Secret for HMAC verification | Yes |
| R2_ACCESS_KEY | Cloudflare R2 access key | Yes |
| R2_SECRET_KEY | Cloudflare R2 secret key | Yes |
| R2_ENDPOINT | R2 endpoint (must be https://) | Yes |
| R2_BUCKET | R2 bucket name | Yes |
| WEB_PUSH_PUBLIC_KEY | Web Push VAPID public key | Yes |
| WEB_PUSH_PRIVATE_KEY | Web Push VAPID private key | Yes |
| CLIENT_URL | Frontend URL for CORS | Yes |
| GIPHY_API_KEY | Giphy API key for GIF search | No |
| UNSPLASH_ACCESS_KEY | Unsplash API key for wallpapers | No |

### Frontend (.env)
| Variable | Description | Required |
|----------|-------------|----------|
| VITE_API_URL | Backend API URL (e.g., https://api.snitch.fly.dev) | Yes |
| VITE_WS_URL | WebSocket URL (usually same as API with wss://) | Yes |

### Admin (.env)
| Variable | Description | Required |
|----------|-------------|----------|
| VITE_API_URL | Backend API URL (same as frontend) | Yes |

**Note**: See individual README files for detailed .env.example files and configuration instructions.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👤 Author

[Your Name]

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

---

## 📞 Support

For support, please open an issue in the GitHub repository or contact [your-email@example.com].