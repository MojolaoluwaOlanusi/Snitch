import { Home, Search, Bell, Mail, BookmarkIcon, Users, User, MoreHorizontal, Feather } from 'lucide-react';
import { Button } from './ui/button';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onCompose: () => void;
}

export function Sidebar({ currentPage, onNavigate, onCompose }: SidebarProps) {
  const navItems = [
    { icon: Home, label: 'Home', page: 'home' },
    { icon: Search, label: 'Explore', page: 'explore' },
    { icon: Bell, label: 'Notifications', page: 'notifications' },
    { icon: Mail, label: 'Messages', page: 'messages' },
    { icon: BookmarkIcon, label: 'Bookmarks', page: 'bookmarks' },
    { icon: Users, label: 'Communities', page: 'communities' },
    { icon: User, label: 'Profile', page: 'profile' },
    { icon: MoreHorizontal, label: 'More', page: 'more' },
  ];

  return (
    <div className="w-64 h-screen sticky top-0 flex flex-col justify-between p-4 border-r border-gray-200">
      <div>
        {/* Logo */}
        <div className="mb-4 p-3">
          <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.page;
            return (
              <button
                key={item.page}
                onClick={() => onNavigate(item.page)}
                className={`flex items-center gap-4 px-4 py-3 rounded-full w-full transition-colors ${
                  isActive ? '' : 'hover:bg-gray-100'
                }`}
              >
                <Icon className={`w-7 h-7 ${isActive ? 'stroke-[2.5]' : ''}`} />
                <span className={isActive ? '' : ''}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Post Button */}
        <Button
          onClick={onCompose}
          className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full h-12"
        >
          Post
        </Button>
      </div>

      {/* User Profile */}
      <button className="flex items-center gap-3 p-3 rounded-full hover:bg-gray-100 w-full">
        <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NjEyNDQyMzZ8MA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="User"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 text-left">
          <div>John Doe</div>
          <div className="text-gray-500">@johndoe</div>
        </div>
        <MoreHorizontal className="w-5 h-5" />
      </button>
    </div>
  );
}
