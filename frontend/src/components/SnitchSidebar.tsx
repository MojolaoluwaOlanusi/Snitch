import { Home, Compass, Zap, Users, ShoppingBag, Bell, MessageSquare, User, Menu, Plus } from 'lucide-react';
import { LogoSmall } from './Logo';
import { Button } from './ui/button';

interface SnitchSidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onCompose: () => void;
  theme: 'light' | 'dark' | 'incognito';
}

export function SnitchSidebar({ currentPage, onNavigate, onCompose, theme }: SnitchSidebarProps) {
  const navItems = [
    { icon: Home, label: 'Home', page: 'home' },
    { icon: Compass, label: 'Discover', page: 'discover' },
    { icon: Zap, label: 'Warps', page: 'warps' },
    { icon: Users, label: 'Groups', page: 'groups' },
    { icon: ShoppingBag, label: 'Marketplace', page: 'marketplace' },
    { icon: Bell, label: 'Notifications', page: 'notifications' },
    { icon: MessageSquare, label: 'Messages', page: 'messages' },
    { icon: User, label: 'Profile', page: 'profile' },
  ];

  return (
    <div className="w-72 h-screen sticky top-0 flex flex-col bg-card border-r border-border">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <LogoSmall className="w-10 h-10" />
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            Snitch
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.page;
          return (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl w-full transition-all ${
                isActive
                  ? theme === 'incognito'
                    ? 'bg-red-600/20 text-red-500'
                    : 'bg-blue-600/10 text-blue-600'
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className={isActive ? 'font-semibold' : ''}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Create Button */}
      <div className="p-4 border-t border-border">
        <Button
          onClick={onCompose}
          className={`w-full ${
            theme === 'incognito'
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600'
          } text-white rounded-xl h-12 gap-2 shadow-lg`}
        >
          <Plus className="w-5 h-5" />
          Create Post
        </Button>

        {/* User Profile */}
        <button className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted w-full mt-3 transition-colors">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NjEyNDQyMzZ8MA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="User"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 text-left">
            <div className="font-semibold">John Doe</div>
            <div className="text-sm text-muted-foreground">@johndoe</div>
          </div>
          <Menu className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
