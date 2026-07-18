# 🎨 Snitch Frontend - User Application

**The Face of Snitch: A Modern, Real-Time Social Media Experience**

This is the user-facing React application for Snitch. Built with React 18, Vite, TailwindCSS, and DaisyUI, it provides a responsive, feature-rich interface for posting, messaging, and connecting with communities.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack Deep Dive](#tech-stack-deep-dive)
- [Folder Structure](#folder-structure)
- [How to Connect to Backend](#how-to-connect-to-backend)
- [Environment Variables](#environment-variables)
- [Development Setup](#development-setup)
- [Build for Production](#build-for-production)
- [Deployment to Vercel](#deployment-to-vercel)
- [Troubleshooting](#troubleshooting)
- [Performance Tips](#performance-tips)

---

## 🎯 Overview

The Snitch frontend is a modern, responsive single-page application (SPA) that enables users to:

- ✍️ Create and manage posts with rich media
- 💬 Chat in real-time with other users
- 🔍 Search posts and discover content
- 🔔 Receive instant notifications
- 👤 Manage their profile and preferences
- 🌙 Toggle between light and dark themes

**Key Goals**:
- Deliver a blazing-fast user experience (Vite + optimized builds)
- Ensure responsive design (mobile-first)
- Maintain type safety (TypeScript)
- Handle real-time updates seamlessly (WebSocket integration)

---

## 🛠️ Tech Stack Deep Dive

### Core Framework
- **React 18** - Component-based UI library with hooks
  - Why: Industry standard, largest ecosystem, excellent dev tools
  - Hooks: State management, side effects, context

- **Vite** - Next-generation build tool
  - Why: Lightning-fast HMR, optimized production bundles, zero-config
  - Dev: <100ms rebuild times
  - Prod: Tree-shaking, code splitting, lazy loading

### Styling
- **TailwindCSS 3** - Utility-first CSS framework
  - Why: Rapid development, consistent design system, small production builds
  - Customization: Via `tailwind.config.js`

- **DaisyUI 4** - Component library built on Tailwind
  - Why: Pre-built components (buttons, forms, modals), follows Tailwind conventions
  - Usage: `<button class="btn btn-primary">Click me</button>`

### HTTP & Real-Time
- **Axios** - HTTP client library
  - Why: Promise-based, interceptor support, built-in timeout handling
  - Usage: `api.get()`, `api.post()`, `api.put()`, `api.delete()`
  - Interceptors: Auto-inject auth tokens, handle 401 refresh

- **Socket.IO Client** - WebSocket communication
  - Why: Fallback to HTTP long-polling if WebSocket unavailable
  - Events: Real-time chat, notifications, typing indicators
  - Auto-reconnect: Handles network interruptions

### Routing & State
- **React Router DOM** - Client-side routing
  - Why: Industry standard for SPAs, nested routes, lazy code splitting
  - Pages: Home, Chat, Profile, Search, Settings

- **React Context + Custom Hooks** - State management
  - Why: No external dependencies, simpler than Redux for this use case
  - Contexts: AuthContext, SocketContext, ThemeContext

### Utilities
- **Date-fns** - Date manipulation
- **Lodash** - Utility functions (debounce, throttle, etc.)
- **clsx** - Conditional classname merging

---

## 📁 Folder Structure

```
frontend/
├── README.md                      ← This file
├── index.html                     ← HTML entry point
├── package.json
├── vite.config.ts                ← Vite configuration
├── tailwind.config.js             ← TailwindCSS theme
├── postcss.config.cjs             ← PostCSS config
├── tsconfig.json                  ← TypeScript config
├── public/                        ← Static assets
│   ├── manifest.json             ← PWA manifest
│   ├── service-worker.js         ← Service worker for offline
│   ├── avatars/                  ← Placeholder avatars
│   └── sounds/                   ← Notification sounds
│
└── src/
    ├── main.jsx                  ← React mount point
    ├── App.jsx                   ← Root component
    ├── index.css                 ← Global styles
    │
    ├── pages/                    ← Route-based pages
    │   ├── Home.jsx             ← Post feed
    │   ├── Chat.jsx             ← Messaging interface
    │   ├── Profile.jsx          ← User profile
    │   ├── Search.jsx           ← Search results
    │   ├── Discover.jsx         ← Trending posts
    │   ├── Notifications.jsx    ← Notification center
    │   └── Settings.jsx         ← User preferences
    │
    ├── components/              ← Reusable UI components
    │   ├── common/
    │   │   ├── Navbar.jsx       ← Top navigation
    │   │   ├── Sidebar.jsx      ← Left sidebar menu
    │   │   ├── Footer.jsx       ← Footer
    │   │   └── Modal.jsx        ← Reusable modal
    │   │
    │   ├── Post/
    │   │   ├── PostCard.jsx     ← Single post display
    │   │   ├── PostForm.jsx     ← Create/edit post
    │   │   └── PostActions.jsx  ← Like, comment, share buttons
    │   │
    │   ├── Chat/
    │   │   ├── ConversationList.jsx  ← Inbox
    │   │   ├── MessageBubble.jsx     ← Individual message
    │   │   ├── ChatInput.jsx         ← Message input box
    │   │   └── TypingIndicator.jsx  ← "User is typing..." UI
    │   │
    │   └── skeletons/           ← Loading placeholders
    │       ├── PostSkeleton.jsx
    │       └── ChatSkeleton.jsx
    │
    ├── hooks/                   ← Custom React hooks
    │   ├── useAuth.js          ← Auth state & login/logout
    │   ├── useSocket.js        ← WebSocket connection & events
    │   ├── usePost.js          ← Post creation/deletion
    │   ├── useChat.js          ← Chat operations
    │   ├── useSearch.js        ← Search posts/users
    │   └── useLocalStorage.js  ← Persist state to browser
    │
    ├── context/                ← React Context providers
    │   ├── AuthContext.jsx     ← User auth state, JWT token
    │   ├── SocketContext.jsx   ← WebSocket client instance
    │   └── ThemeContext.jsx    ← Light/dark mode
    │
    ├── services/               ← External API & WebSocket setup
    │   ├── api.js             ← Axios instance with interceptors
    │   │   (Base URL from VITE_API_URL)
    │   │   (Auto-injects auth token)
    │   │   (Handles 401 token refresh)
    │   │
    │   └── socket.js          ← Socket.IO client initialization
    │       (Connection URL from VITE_WS_URL)
    │       (Passes auth token as query param)
    │
    ├── utils/                  ← Helper functions
    │   ├── dateFormat.js       ← Format timestamps
    │   ├── validators.js       ← Input validation
    │   ├── imageUtils.js       ← Image resizing, compression
    │   ├── fileUtils.js        ← File size checks, MIME types
    │   └── constants.js        ← App constants (endpoints, limits)
    │
    └── store/                  ← Optional: Global state (if using Zustand/Redux)
        └── (not used in basic setup, but provided for scaling)
```

### Key Files Explained

#### `pages/Home.jsx`
```javascript
// Displays feed of all posts
// Fetches: GET /api/posts?page=1&limit=20
// Real-time updates: Socket event 'new-post'
```

#### `pages/Chat.jsx`
```javascript
// Displays conversation list and active chat
// Fetches: GET /api/chat/conversations
// Real-time: Socket events 'new-message', 'user-typing', 'user-online'
```

#### `hooks/useAuth.js`
```javascript
// Manages user login/logout/token refresh
// Returns: { user, loading, error, login, logout, isAuthenticated }
// Token stored in: httpOnly cookie (set by server) or localStorage
```

#### `services/api.js`
```javascript
// Axios instance with:
// - Base URL: import.meta.env.VITE_API_URL
// - Auth interceptor: Adds 'Authorization: Bearer <token>' to all requests
// - Error handling: Handles 401, 403, 500 errors
```

---

## 🔌 How to Connect to Backend

### 1. **API Communication (HTTP/REST)**

All API calls go through the `api` service:

```javascript
// frontend/src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4500',
  withCredentials: true, // Include cookies
});

// Request interceptor: Add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

**Usage Example**:

```javascript
// In a component
import api from '../services/api';

const fetchPosts = async () => {
  const response = await api.get('/posts?page=1&limit=20');
  setPosts(response.data);
};
```

### 2. **Real-Time Communication (WebSocket)**

WebSocket events are managed through the `SocketContext`:

```javascript
// frontend/src/context/SocketContext.jsx
import io from 'socket.io-client';

const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:4500', {
  query: {
    token: localStorage.getItem('authToken'),
  },
  transports: ['websocket', 'polling'],
});

// Listen for real-time events
socket.on('new-message', (message) => {
  setMessages((prev) => [...prev, message]);
});
```

### 3. **Auth Token Injection**

Tokens are automatically added to all requests:

```javascript
// Backend expects: Authorization: Bearer <JWT_TOKEN>

// For WebSocket: Token passed as query parameter
const socket = io(url, {
  query: { token: authToken },
});

// Backend validates token from query parameters
```

### 4. **CORS Configuration**

The backend CORS settings allow:

```javascript
// Backend config
app.use(cors({
  origin: [
    'https://snitch.vercel.app',     // Production frontend
    'https://admin.snitch.vercel.app', // Production admin
    'http://localhost:5173',          // Dev frontend
  ],
  credentials: true,
}));
```

**Your VITE_API_URL must match backend CORS origin.**

---

## ⚙️ Environment Variables

Create a `.env` file in the frontend root with these variables:

```bash
# Backend API connection
VITE_API_URL=http://localhost:4500           # Dev: local backend
VITE_WS_URL=http://localhost:4500            # WebSocket endpoint

# Production (after deploying backend)
# VITE_API_URL=https://api.snitch.fly.dev
# VITE_WS_URL=wss://api.snitch.fly.dev
```

### Why the `VITE_` Prefix?

- Vite only exposes variables prefixed with `VITE_` to the browser (security best practice)
- Do NOT prefix secrets like API keys with `VITE_` - they'll leak
- Server-side secrets stay in backend `.env`

### Environment File Template

```bash
# .env.development
VITE_API_URL=http://localhost:4500
VITE_WS_URL=http://localhost:4500

# .env.production
VITE_API_URL=https://api.snitch.fly.dev
VITE_WS_URL=wss://api.snitch.fly.dev
```

---

## 💻 Development Setup

### Step 1: Install Dependencies

```bash
cd frontend
npm install
# or with pnpm
pnpm install
```

### Step 2: Create Environment File

```bash
cp .env.example .env
```

Edit `.env`:
```bash
VITE_API_URL=http://localhost:4500
VITE_WS_URL=http://localhost:4500
```

### Step 3: Start Development Server

```bash
npm run dev
```

Output:
```
  ➜  Local:   http://localhost:5173/
  ➜  Press h + enter to show help
```

### Step 4: Open in Browser

Visit `http://localhost:5173` - you should see the Snitch home page.

### Step 5: Test Backend Connection

1. Try signing up or logging in
2. Check browser console for any errors
3. Open DevTools Network tab to verify API calls to backend

---

## 🔨 Build for Production

### Development Build
```bash
npm run dev
```
- Hot Module Replacement (HMR) enabled
- Source maps for debugging
- Slower, but better DX

### Production Build
```bash
npm run build
```

This creates an optimized production bundle:
- Minified HTML, CSS, JavaScript
- Code splitting for lazy loading
- Tree-shaking to remove unused code
- Outputs to `dist/` folder

### Preview Production Build Locally
```bash
npm run preview
```
Starts a local server serving the `dist` folder (simulates production).

---

## 🚀 Deployment to Vercel

Vercel handles all the deployment complexity automatically!

### Option 1: Connect GitHub Repository (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Environment Variables**
   - In Vercel dashboard, go to Project → Settings → Environment Variables
   - Add:
     ```
     VITE_API_URL=https://api.snitch.fly.dev
     VITE_WS_URL=wss://api.snitch.fly.dev
     ```
   - Apply to: Production, Preview, Development

4. **Deploy**
   - Click "Deploy"
   - Vercel automatically runs `npm run build`
   - Your app is live at `https://snitch.vercel.app`

### Option 2: Manual Deployment with Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# For production
vercel --prod
```

### What Vercel Does Automatically

✅ Runs `npm install`  
✅ Runs `npm run build`  
✅ Serves `dist/` as static files  
✅ HTTPS with auto-renewing certificates  
✅ CDN for global distribution  
✅ Preview deployments for PRs  
✅ Auto-rollback on error  
✅ Analytics & monitoring  

### Preview Deployments

Every time you open a PR:
1. Vercel automatically builds and deploys
2. You get a unique preview URL (e.g., `https://snitch-preview-123.vercel.app`)
3. Test features before merging to main

---

## 🐛 Troubleshooting

### Issue: "Cannot GET /"
**Cause**: Vercel serving a route that doesn't exist  
**Solution**: The `src/App.jsx` and React Router must have a catch-all route

### Issue: CORS Error in Browser Console
```
Access to XMLHttpRequest blocked by CORS policy
```
**Causes & Solutions**:
1. **Wrong API URL**: Check `VITE_API_URL` in `.env`
2. **Backend not running**: Ensure backend is on `localhost:4500`
3. **Backend CORS not configured**: Check backend's CORS origin whitelist

### Issue: WebSocket Connection Fails
```
WebSocket connection failed
```
**Causes**:
1. **Wrong WS URL**: Ensure `VITE_WS_URL` matches backend
2. **Auth token not sent**: Verify token is in localStorage
3. **Backend not running**: Check backend server status

**Debug**:
```javascript
// In browser console
import io from 'socket.io-client';
const socket = io('http://localhost:4500', {
  query: { token: 'your-token-here' },
});
socket.on('connect', () => console.log('Connected!'));
socket.on('error', (err) => console.log('Error:', err));
```

### Issue: Import Errors (e.g., "Cannot find module './component'")
**Cause**: Case-sensitivity issues on Linux/Mac  
**Solution**: Ensure file names match imports exactly

```javascript
// ❌ Wrong (component.jsx)
import Component from './Component';

// ✅ Correct
import Component from './component';
```

### Issue: "Module not found: react"
```bash
npm install
npm run dev
```

### Issue: Slow Hot Module Replacement (HMR)
**Solution**: Vite can be slow with lots of files. Try:
```bash
npm run dev -- --host 0.0.0.0  # Expose to network
```

### Issue: Dark Mode Not Persisting
**Check**: TailwindCSS theme config in `tailwind.config.js`
```javascript
module.exports = {
  darkMode: 'class', // or 'media'
  // ...
};
```

---

## ⚡ Performance Tips

### 1. **Code Splitting**
Vite automatically splits routes:
```javascript
import { lazy, Suspense } from 'react';

const ChatPage = lazy(() => import('./pages/Chat'));

<Suspense fallback={<div>Loading...</div>}>
  <ChatPage />
</Suspense>
```

### 2. **Image Optimization**
- Compress images before upload
- Use WebP format where possible
- Lazy load below-the-fold images

### 3. **State Management**
- Avoid prop drilling → use Context
- Memoize expensive computations → `useMemo`
- Memoize component renders → `React.memo`

### 4. **Bundle Analysis**
See what's bloating your bundle:
```bash
npm install --save-dev vite-plugin-visualizer
# Then configure in vite.config.ts
```

### 5. **Monitoring**
Monitor real-time performance in production:
- Check Vercel Analytics → Performance
- Use browser DevTools Lighthouse audit

---

## 📚 Useful Resources

- [React 18 Docs](https://react.dev)
- [Vite Guide](https://vitejs.dev/guide/)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [DaisyUI Components](https://daisyui.com)
- [Axios Documentation](https://axios-http.com)
- [Socket.IO Client](https://socket.io/docs/v4/client-api/)
- [Vercel Deployment Docs](https://vercel.com/docs)

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/new-feature`
2. Make changes and test locally
3. Commit: `git commit -m 'Add new feature'`
4. Push: `git push origin feature/new-feature`
5. Open a Pull Request
6. Vercel will automatically create a preview deployment

---

## 💡 Quick Commands Reference

```bash
# Development
npm run dev              # Start dev server on port 5173
npm run build            # Build for production → dist/
npm run preview          # Preview production build locally

# Linting & Formatting
npm run lint             # ESLint check
npm run format           # Prettier format

# Deployment
vercel                   # Deploy to preview (Vercel CLI)
vercel --prod            # Deploy to production
```

---

**Questions?** Check [root README](../README.md) or [Backend README](../backend/README.md) for more context!

Happy building! 🚀
