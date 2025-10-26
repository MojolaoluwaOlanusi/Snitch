# Snitch - Social Media Platform

A comprehensive social media web application that combines the best features of X (Twitter), Facebook, and Instagram into one unified platform.

## 🎨 Design Features

### Branding
- **3D Logo**: Custom hexagon-shaped logo with 3D text effect
- **Color Scheme**: 
  - Primary: Shades of blue (#1e3a8a, #2563eb, #60a5fa)
  - Accent: Black and touches of red
  - Three theme modes: Light, Dark, and Incognito

### Theme Modes
1. **Light Mode**: Clean blue and white interface
2. **Dark Mode**: Deep blue-black with blue accents
3. **Incognito Mode**: Special dark theme with red accents for privacy-focused browsing

## 🚀 Features

### Core Social Features (X/Twitter-like)
- ✅ Timeline feed with posts
- ✅ Like, comment, share functionality
- ✅ Real-time notifications
- ✅ Direct messaging
- ✅ User profiles with customization
- ✅ Bookmarks
- ✅ Trending topics

### Visual Content (Instagram-like)
- ✅ Stories feature with create/view
- ✅ **Warps** - Next-gen short-form video content (formerly Reels)
- ✅ Image gallery posts (1-4 images)
- ✅ Photo filters and effects support

### Community Features (Facebook-like)
- ✅ Groups (public/private)
- ✅ Events calendar
- ✅ Marketplace for buying/selling
- ✅ People suggestions
- ✅ Mutual friends display

### Enhanced Profile Features
- ✅ **Account Type Badges**: Personal, Business, or Work
- ✅ **Account Status Indicators**:
  - 🟢 Green: Good Standing
  - 🟡 Yellow: Account Warning
  - 🔴 Red: Account Suspended
- ✅ Verification badges
- ✅ Custom profile themes

### Performance & UX
- ✅ **Loading Skeletons** - Smooth loading states for slow connections
- ✅ **No Internet Page** - Custom offline experience with retry functionality
- ✅ **Auto-detect Online/Offline** - Real-time connection monitoring
- ✅ **Optimistic UI Updates** - Instant feedback on user actions
- ✅ **Responsive Design** - Works seamlessly on all devices

### Additional Features
- ✅ Discover page with trending content
- ✅ Advanced search functionality
- ✅ Theme toggle (Light/Dark/Incognito)
- ✅ Modern UI with smooth animations
- ✅ Accessibility features

## 📱 Pages

1. **Home** - Main feed with stories and post composer
2. **Discover** - Trending topics and posts
3. **Warps** - Lightning-fast short-form video content
4. **Groups** - Community groups and discussions
5. **Marketplace** - Buy and sell items
6. **Notifications** - Activity updates
7. **Messages** - Direct messaging
8. **Profile** - Enhanced user profile with account type and status

## 🎯 Key Components

### Navigation
- **SnitchSidebar** - Main navigation with logo and menu items
- **SnitchRightSidebar** - Trending topics, suggestions, and theme toggle

### Content Cards
- **PostCard** - Universal post component with images, likes, comments
- **StoryCard** - Stories with create functionality
- **WarpCard** - Next-gen short video content display with warp effects
- **TweetCard** - Legacy tweet-style posts

### Profile Components
- **AccountStatusBadge** - Visual status indicators (Good/Warning/Banned)
- **AccountTypeBadge** - Personal/Business/Work type indicators

### Loading States
- **LoadingSkeleton** - Multiple skeleton components:
  - PostSkeleton
  - StorySkeleton
  - WarpSkeleton
  - GroupSkeleton
  - MarketplaceSkeleton
  - ProfileSkeleton
  - FeedSkeleton

### Error States
- **NoInternet** - Beautiful offline page with retry functionality

### UI Elements
- **Logo** - 3D hexagon logo with gradient
- **ThemeToggle** - Switch between Light/Dark/Incognito modes
- **ComposeTweet** - Post creation dialog

## 🎨 Color Palette

### Light Theme
- Background: `#f0f4f8`
- Card: `#ffffff`
- Primary: `#1e3a8a`
- Secondary: `#3b82f6`
- Accent: `#60a5fa`

### Dark Theme
- Background: `#0a0e1a`
- Card: `#1a1f2e`
- Primary: `#1e40af`
- Accent: `#2563eb`

### Incognito Theme
- Background: `#0f0f0f`
- Card: `#1a1a1a`
- Accent: `#dc2626` (Red)
- Muted: Grayscale palette

## 🛠️ Technology Stack

- **React** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Radix UI** - Accessible components
- **Shadcn/UI** - Component library

## 🚦 Getting Started

The application is ready to use! Simply navigate through the sidebar to explore different features:

1. **Create Posts** - Click "Create Post" button
2. **View Warps** - Navigate to Warps section for quick video content
3. **Join Groups** - Discover and join communities
4. **Browse Marketplace** - Find items for sale
5. **Toggle Theme** - Use theme toggle in right sidebar
6. **Check Profile** - View account type and status badges

### Testing Features
- **Loading States**: Navigation automatically shows skeletons during page transitions
- **Offline Mode**: Disable your internet connection to see the No Internet page
- **Account Status**: Profile page displays different status badges
- **Theme Switching**: Toggle between Light, Dark, and Incognito modes

## 🌟 Special Features

### Incognito Mode
- Privacy-focused dark theme
- Red accent colors instead of blue
- Special visual indicators
- Enhanced anonymity features

### Warps (Next-Gen Video)
- Lightning-fast video content
- Unique warp animation effects
- Interactive engagement
- Optimized for mobile and desktop
- Replaces traditional "Reels" concept

### Stories
- Create your own stories
- View friends' stories
- 24-hour auto-deletion
- Interactive viewing experience

### Account Management
- **Account Types**:
  - Personal: Individual user accounts
  - Business: Company and brand profiles
  - Work: Professional networking
- **Status Monitoring**:
  - Real-time status updates
  - Visual color-coded indicators
  - Automatic compliance tracking

### Performance Optimization
- **Skeleton Loading**: Smooth transitions during data loading
- **Connection Detection**: Automatic online/offline monitoring
- **Offline Support**: Graceful degradation when offline
- **Retry Logic**: Smart reconnection handling

### Marketplace
- List items for sale
- Browse by category
- Location-based filtering
- Condition indicators

## 📸 Screenshots

The application features:
- Modern card-based layouts
- Smooth hover animations
- Gradient backgrounds
- Glass-morphism effects
- Responsive grid systems

## 🔐 Privacy & Security

- Incognito mode for anonymous browsing
- Private group options
- Direct message encryption (UI ready)
- Profile privacy settings

## 🎨 Design Philosophy

Snitch combines the best of modern social media:
- **X's** simplicity and real-time updates
- **Instagram's** visual-first approach
- **Facebook's** community features
- All in one cohesive, beautifully designed platform

## 📱 Responsive Design

Fully responsive across:
- Desktop (1920px+)
- Laptop (1024px+)
- Tablet (768px+)
- Mobile (320px+)

---

**Built with ❤️ using modern web technologies**
