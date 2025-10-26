import DevLoggerButton from './components/DevLoggerButton';
import { useState, useEffect } from 'react';
import { SnitchSidebar } from './components/SnitchSidebar';
import { SnitchRightSidebar } from './components/SnitchRightSidebar';
import { SnitchHome } from './components/pages/SnitchHome';
import { SnitchDiscover } from './components/pages/SnitchDiscover';
import { SnitchWarps } from './components/pages/SnitchWarps';
import { SnitchGroups } from './components/pages/SnitchGroups';
import { SnitchMarketplace } from './components/pages/SnitchMarketplace';
import { Notifications } from './components/pages/Notifications';
import { Messages } from './components/pages/Messages';
import { Profile } from './components/pages/Profile';
import { ComposeTweet } from './components/ComposeTweet';
import { NoInternet } from './components/NoInternet';
import { FeedSkeleton } from './components/LoadingSkeleton';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark' | 'incognito'>('light');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Apply theme to document
    document.documentElement.classList.remove('light', 'dark', 'incognito');
    document.documentElement.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Monitor online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (!navigator.onLine) {
        setIsOnline(false);
      }
    }, 1000);
  };

  const handlePostClick = (postId: string) => {
    setSelectedPostId(postId);
  };

  const handleBackFromDetail = () => {
    setSelectedPostId(null);
  };

  const renderPage = () => {
    if (isLoading) {
      return <FeedSkeleton />;
    }

    switch (currentPage) {
      case 'home':
        return <SnitchHome onPostClick={handlePostClick} theme={theme} />;
      case 'discover':
        return <SnitchDiscover onPostClick={handlePostClick} theme={theme} />;
      case 'warps':
        return <SnitchWarps />;
      case 'groups':
        return <SnitchGroups theme={theme} />;
      case 'marketplace':
        return <SnitchMarketplace theme={theme} />;
      case 'notifications':
        return <Notifications />;
      case 'messages':
        return <Messages />;
      case 'profile':
        return <Profile onTweetClick={handlePostClick} accountType="personal" accountStatus="good" />;
      default:
        return <SnitchHome onPostClick={handlePostClick} theme={theme} />;
    }
  };

  if (!isOnline) {
    return <NoInternet onRetry={handleRetry} />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SnitchSidebar
        currentPage={currentPage}
        onNavigate={(page) => {
          setIsLoading(true);
          setTimeout(() => {
            setCurrentPage(page);
            setIsLoading(false);
          }, 500);
        }}
        onCompose={() => setIsComposeOpen(true)}
        theme={theme}
      />
      {renderPage()}
      <SnitchRightSidebar theme={theme} onThemeChange={setTheme} />
      <ComposeTweet isOpen={isComposeOpen} onClose={() => setIsComposeOpen(false)} />
      <DevLoggerButton />
</div>
  );
}
