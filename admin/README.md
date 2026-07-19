# Snitch Admin Dashboard

The admin panel for Snitch - a comprehensive dashboard for moderators and administrators to manage users, content, and system analytics.

---

## 📋 Project Overview

The Snitch Admin Dashboard provides moderators and administrators with tools to manage the platform, including user management, content moderation, system analytics, and moderation queues. It shares the same tech stack as the user-facing frontend but focuses on administrative features.

---

## 🛠️ Tech Stack

### Core Framework
- **React 18**: Modern React with hooks and concurrent features
- **Vite 5**: Lightning-fast build tool and dev server
- **TypeScript**: Type-safe development

### Styling
- **TailwindCSS 3**: Utility-first CSS framework
- **DaisyUI 4**: Component library built on TailwindCSS
- **Recharts**: Chart library for analytics visualizations

### Routing & State
- **React Router DOM v6**: Client-side routing
- **Zustand**: Lightweight state management

### API Integration
- **Axios**: HTTP client with interceptors for JWT auth

### Admin-Specific Libraries
- **Recharts**: Beautiful charts for analytics
- **React Table**: Advanced data tables for user/content management
- **Date-fns**: Date manipulation for analytics

---

## 📁 Folder Structure

`
src/
├── pages/              # Admin-specific page components
│   ├── Dashboard/      # Main dashboard with analytics
│   ├── Users/          # User management page
│   ├── Posts/          # Content moderation page
│   ├── Reports/        # Reported content queue
│   └── Settings/       # System settings page
├── components/         # Reusable admin components
│   ├── tables/         # Data table components
│   ├── charts/         # Chart components
│   ├── modals/         # Admin modal components
│   └── layout/         # Layout components (Sidebar, Header)
├── hooks/              # Custom React hooks
│   ├── useAuth.js      # Authentication hook
│   ├── useAdminData.js # Admin data fetching hook
│   └── usePagination.js # Pagination hook for tables
├── services/           # API client setup
│   └── axios.js        # Axios instance with interceptors
├── utils/              # Utility functions
│   ├── formatters.js   # Data formatting utilities
│   └── validators.js   # Input validation helpers
├── store/              # Zustand stores
│   ├── useAuthStore.js # Auth state
│   └── useAdminStore.js # Admin-specific state
├── App.jsx             # Root component with routing
└── main.jsx            # Entry point
`

### Directory Explanations

**src/pages/**: Admin-specific pages. Each page handles a different administrative area (Dashboard, Users, Posts, Reports, Settings).

**src/components/**: Reusable admin components. Includes data tables, charts, modals, and layout components.

**src/hooks/**: Custom hooks for admin-specific logic. useAdminData handles data fetching with proper error handling.

**src/services/**: API client setup. Same axios configuration as frontend but with admin-specific endpoints.

**src/utils/**: Utility functions for data formatting and validation specific to admin needs.

---

## 🔌 How it Connects to the Backend

### API Integration

The admin panel uses the same Axios instance as the frontend but accesses admin-specific routes:

`javascript
// Base URL from environment variable
const API_URL = import.meta.env.VITE_API_URL;

// Admin routes require elevated permissions
axiosInstance.get('/api/admin/users')
axiosInstance.post('/api/admin/ban-user', { userId })
`

### Authentication

Admin authentication uses the same JWT flow as the frontend:
- Login via /api/auth/login
- JWT stored in localStorage
- Axios interceptor injects token into requests
- Backend validates ole: 'admin' in JWT for admin routes

### Permission Checking

The backend validates admin permissions on every admin route:
`javascript
// Backend middleware checks JWT role
if (user.role !== 'admin') {
  return res.status(403).json({ error: 'Admin access required' });
}
`

---

## 🔐 Environment Variables

Create a .env file in the admin root:

`env
VITE_API_URL=https://api.snitch.fly.dev
`

### Variable Descriptions

- **VITE_API_URL**: The backend API URL. Same as frontend since both use the same backend.

**Note**: The admin panel typically doesn't use WebSockets, so VITE_WS_URL is not required.

---

## 🚀 Development Setup

### 1. Install dependencies

`ash
cd admin
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

The admin panel will be available at http://localhost:5174

### 4. Build for production

`ash
npm run build
`

This creates an optimized production build in the dist/ directory.

---

## 🌐 Deployment (Vercel)

### Automatic Deployment

1. Connect your GitHub repository to Vercel
2. Select the dmin directory as the root directory
3. Configure environment variables in Vercel dashboard:
   - VITE_API_URL: Your production backend URL
4. Deploy on push to main branch

### Manual Deployment

`ash
npm run build
vercel --prod
`

---

## 📊 Admin Features

### Dashboard
- Overview statistics (users, posts, reports)
- Real-time activity charts
- System health indicators
- Quick action buttons

### User Management
- View all users with pagination
- Search and filter users
- View user profiles and activity
- Ban/unban users
- Reset user passwords

### Content Moderation
- View all posts with moderation tools
- Delete inappropriate content
- View post reports
- Bulk moderation actions

### Reports Queue
- View reported content
- Review and take action on reports
- Track moderation history
- Escalate severe violations

### System Settings
- Configure platform settings
- Manage API keys
- View system logs
- Configure moderation rules

---

## 🔧 Troubleshooting

### Permission Denied Errors

If you see 403 errors:
- Ensure your JWT has ole: 'admin'
- Check that the backend admin middleware is correctly configured
- Verify the token hasn't expired

### Data Not Loading

If admin data fails to load:
- Check browser console for API errors
- Verify backend admin routes are accessible
- Ensure your admin account has proper permissions

### Chart Rendering Issues

If charts don't render:
- Check that Recharts is properly installed
- Verify data is in the correct format
- Check browser console for errors

---

## 📝 Additional Notes

### Security Considerations

- Admin panel should be deployed to a separate domain or path
- Consider implementing IP whitelisting for admin access
- Use strong authentication (2FA recommended)
- Log all admin actions for audit trails

### Performance

- Admin tables use virtual scrolling for large datasets
- Charts use memoization to prevent unnecessary re-renders
- API calls are debounced for search/filter operations

### Accessibility

- All admin components follow WCAG 2.1 AA guidelines
- Keyboard navigation is fully supported
- Screen reader compatible with ARIA labels

---

## 🤝 Contributing

When contributing to the admin panel:
- Follow the existing code style
- Use TypeScript for new components
- Add proper error handling for all API calls
- Test with different screen sizes
- Ensure accessibility compliance
- Add unit tests for critical components