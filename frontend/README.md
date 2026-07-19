# Snitch Frontend

The user-facing React application for Snitch - a full-stack social media platform with real-time chat, posts, and social features.

---

## 📋 Project Overview

The Snitch frontend is a modern React application built with Vite, featuring real-time messaging, post feeds, user profiles, and search functionality. It connects to the backend API via REST and WebSocket for seamless real-time updates.

---

## 🛠️ Tech Stack Deep Dive

### Core Framework
- **React 18**: Modern React with hooks and concurrent features
- **Vite 5**: Lightning-fast build tool and dev server
- **TypeScript**: Type-safe development

### Styling
- **TailwindCSS 3**: Utility-first CSS framework
- **DaisyUI 4**: Component library built on TailwindCSS
- **Why chosen**: DaisyUI provides beautiful, accessible components out of the box while maintaining Tailwind's flexibility

### Routing & State
- **React Router DOM v6**: Client-side routing with nested routes
- **Zustand**: Lightweight state management
- **Why Zustand**: Simpler than Redux, no boilerplate, excellent TypeScript support

### API & Real-time
- **Axios**: HTTP client with interceptors for JWT auth
- **Socket.IO Client**: WebSocket client for real-time features
- **Why Socket.IO**: Automatic reconnection, room support, fallback to HTTP polling

### Other Key Libraries
- **Framer Motion**: Smooth animations and transitions
- **Sonner**: Beautiful toast notifications
- **Lucide React**: Modern icon library
- **React Virtuoso**: Virtual scrolling for performance
- **link-preview-js**: Link preview generation for chat messages

---

## 📁 Folder Structure

`
src/
├── pages/              # Route-based page components
│   ├── home/          # Home feed page
│   ├── profile/       # User profile page
│   ├── post/          # Post detail and create pages
│   ├── search/        # Search page
│   ├── chat/          # Chat/messaging page
│   ├── auth/          # Authentication pages (login, signup, etc.)
│   ├── notification/  # Notifications page
│   ├── ai/            # AI features page
│   └── warp/          # Warp features page
├── components/        # Reusable UI components
│   ├── common/        # Shared components (Sidebar, PostCard, etc.)
│   ├── skeletons/     # Loading skeleton components
│   └── svgs/          # SVG icon components
├── hooks/             # Custom React hooks
│   ├── useAuth.js     # Authentication hook
│   ├── useSocket.js   # WebSocket connection hook
│   └── useConversationSettings.js # Per-conversation settings
├── context/           # React Context providers
│   ├── AuthContext.jsx # Authentication state
│   ├── SocketContext.jsx # WebSocket state
│   └── ThemeContext.jsx # Theme state
├── services/          # API client setup
│   └── axios.js       # Axios instance with interceptors
├── utils/             # Utility functions
│   ├── date/          # Date formatting utilities
│   └── validators.js  # Input validation helpers
├── store/             # Zustand stores
│   ├── useAuthStore.js # Auth state
│   ├── useChatStore.js # Chat state
│   ├── useUserStore.js # User state
│   └── useMediaStore.js # Media state
├── App.jsx            # Root component with routing
└── main.jsx           # Entry point
`

### Directory Explanations

**src/pages/**: All route-based page components. Each page is a complete feature area (e.g., home feed, profile, chat).

**src/components/**: Reusable UI components used across multiple pages. Common components like Sidebar, PostCard, and MessageBubble live here.

**src/hooks/**: Custom React hooks that encapsulate reusable logic. useAuth handles authentication state, useSocket manages WebSocket connections.

**src/context/**: React Context providers for global state. AuthContext provides user auth state, SocketContext provides WebSocket connection.

**src/services/**: API client setup. The axios instance is configured with interceptors to automatically inject JWT tokens.

**src/utils/**: Pure utility functions. Date formatters, input validators, and other helper functions.

---

## 🔌 How it Connects to the Backend

### API Integration Pattern

The frontend uses Axios for HTTP requests with automatic JWT injection:

`javascript
// Base URL from environment variable
const API_URL = import.meta.env.VITE_API_URL;

// Auth token stored in localStorage
const token = localStorage.getItem('access-token');

// Axios interceptor injects token
axiosInstance.interceptors.request.use((config) => {
  if (token) {
    config.headers.Authorization = Bearer ;
  }
  return config;
});
`

### WebSocket Connection

WebSocket connection uses Socket.IO client with auth token passed via query parameter:

`javascript
const socket = io(VITE_WS_URL, {
  auth: { token: localStorage.getItem('access-token') },
  transports: ['websocket']
});
`

**Note**: WebSockets don't support custom headers, so the JWT is passed via the uth object which Socket.IO sends as a query parameter.

---

## 🔐 Environment Variables

Create a .env file in the frontend root:

`env
VITE_API_URL=https://api.snitch.fly.dev
VITE_WS_URL=wss://api.snitch.fly.dev
`

### Variable Descriptions

- **VITE_API_URL**: The backend API URL (Fly.io backend). All HTTP requests go here.
- **VITE_WS_URL**: The WebSocket endpoint. Usually the same domain as the API but with wss:// protocol.

---

## 🚀 Development Setup

### 1. Install dependencies

`ash
cd frontend
npm install
`

### 2. Configure environment variables

Copy .env.example to .env and configure:

`ash
cp .env.example .env
`

Edit .env with your backend URL.

### 3. Start development server

`ash
npm run dev
`

The app will be available at http://localhost:5173

### 4. Build for production

`ash
npm run build
`

This creates an optimized production build in the dist/ directory.

---

## 🌐 Deployment (Vercel)

### Automatic Deployment

1. Connect your GitHub repository to Vercel
2. Select the rontend directory as the root directory
3. Configure environment variables in Vercel dashboard:
   - VITE_API_URL: Your production backend URL
   - VITE_WS_URL: Your production WebSocket URL
4. Deploy on push to main branch

### Manual Deployment

`ash
npm run build
vercel --prod
`

---

## 🔧 Troubleshooting

### CORS Errors

If you see CORS errors:
- Ensure CLIENT_URL in backend .env matches your Vercel domain
- Check that the backend CORS configuration allows your frontend domain

### Case-Sensitive Imports on Linux

If you encounter import errors on Linux/Vercel:
- Ensure all import paths match the exact file/folder casing
- All relative imports should include file extensions (.js, .jsx, .ts, .tsx)
- Index files should be explicitly referenced (e.g., ./components/index.jsx)

### WebSocket Connection Drops

If WebSocket connections drop frequently:
- Check that VITE_WS_URL uses wss:// for HTTPS
- Verify backend WebSocket server is running
- Check browser console for connection errors

### Build Failures

If builds fail:
- Clear node_modules and reinstall: m -rf node_modules && npm install
- Check for TypeScript errors: 
pm run type-check
- Verify all imports have correct extensions

---

## 📝 Additional Notes

### State Management

The app uses Zustand for state management. Stores are located in src/store/:
- useAuthStore: Authentication state and user data
- useChatStore: Chat messages, conversations, and typing state
- useUserStore: User profiles and search results
- useMediaStore: Media upload state and progress

### Routing

Routes are defined in App.jsx using React Router:
- /: Home feed
- /profile/:username: User profile
- /post/:postId: Post detail
- /chat: Chat interface
- /search: Search page
- /auth/*: Authentication pages

### Styling

The app uses TailwindCSS with DaisyUI components. Theme customization is done via 	ailwind.config.js and DaisyUI theme classes.

---

## 🤝 Contributing

When contributing to the frontend:
- Follow the existing code style
- Use TypeScript for new components
- Add file extensions to all imports
- Test on both desktop and mobile viewports
- Ensure accessibility (ARIA labels, keyboard navigation)