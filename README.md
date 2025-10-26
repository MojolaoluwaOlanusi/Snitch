# 🕵️‍♂️ Snitch — The Next-Gen Social Media App

Snitch is a **full-stack MERN** (MongoDB, Express, React, Node.js) social media platform that combines the best features of **X (Twitter)**, **Facebook**, and **Instagram** into one unified experience.

Built for scalability, real-time interaction, and media-rich content sharing — Snitch lets users post, follow, chat, like, comment, and share content seamlessly.

---

## 🚀 Features

### 🧠 Core Social Features
- 📝 Create, edit, delete, and share posts (text, images, videos)
- ❤️ Like, comment, and repost (retweet-style)
- 👥 Follow/unfollow users
- 🧵 Threaded conversations (like X)
- 🧩 Stories & Reels (Instagram-style short media)
- 📸 Media uploads with AWS S3 pre-signed URLs

### ⚡ Realtime + Engagement
- 🔔 Live notifications via **Socket.io**
- 💬 Realtime chat (private DMs and group chats)
- 📡 News feed auto-refresh
- 🕵️ Activity indicators ("typing", "online now")

### 🧰 Platform & System
- 🔐 JWT-based authentication + refresh tokens (secure rotation)
- 🧾 MongoDB for scalable data storage
- 🧱 Mongoose ORM for schema validation
- 🚀 Express backend (RESTful API)
- ⚛️ React + TypeScript + Tailwind frontend (Vite)
- 🧊 Dockerized full stack (MongoDB, Backend, Frontend)
- ⚙️ GitHub Actions CI (build + test on push)
- 🧩 Unit tests (Jest + Supertest) + E2E readiness

---

## 🧱 Tech Stack

| Layer | Technology |
|--------|-------------|
| Frontend | React (Vite + TypeScript + Tailwind CSS) |
| Backend | Node.js + Express + TypeScript |
| Database | MongoDB (with Mongoose) |
| Realtime | Socket.io |
| Storage | AWS S3 (pre-signed uploads) |
| Auth | JWT + Refresh Tokens |
| CI/CD | GitHub Actions |
| Infrastructure | Docker & Docker Compose |

---

## ⚙️ Project Structure

snitch/
├── backend/
│ ├── src/
│ │ ├── controllers/
│ │ ├── models/
│ │ ├── routes/
│ │ ├── services/
│ │ └── index.ts
│ ├── Dockerfile
│ └── package.json
│
├── frontend/
│ ├── src/
│ ├── public/
│ ├── Dockerfile
│ ├── vite.config.ts
│ └── package.json
│
├── docker-compose.yml
├── .dockerignore
├── .gitignore
├── .gitattributes
├── README.md
└── .github/
└── workflows/
└── ci.yml