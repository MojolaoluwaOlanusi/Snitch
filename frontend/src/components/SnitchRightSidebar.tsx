import { TrendingUp, Users, CalendarDays, Settings } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface SnitchRightSidebarProps {
  theme: 'light' | 'dark' | 'incognito';
  onThemeChange: (theme: 'light' | 'dark' | 'incognito') => void;
}

export function SnitchRightSidebar({ theme, onThemeChange }: SnitchRightSidebarProps) {
  const trends = [
    { tag: '#TechNews', posts: '127K posts', category: 'Technology' },
    { tag: '#DesignTips', posts: '89K posts', category: 'Design' },
    { tag: '#AI2025', posts: '234K posts', category: 'Tech' },
    { tag: '#Fitness', posts: '156K posts', category: 'Health' },
    { tag: '#Travel', posts: '98K posts', category: 'Lifestyle' },
  ];

  const suggestions = [
    {
      name: 'Sarah Johnson',
      username: 'sarahj',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHBlcnNvbnxlbnwxfHx8fDE3NjExNzc4NDd8MA&ixlib=rb-4.1.0&q=80&w=1080',
      mutualFriends: 12,
    },
    {
      name: 'Tech Community',
      username: 'techcommunity',
      avatar: 'https://images.unsplash.com/photo-1623715537851-8bc15aa8c145?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwd29ya3NwYWNlfGVufDF8fHx8MTc2MTE3NTc2MHww&ixlib=rb-4.1.0&q=80&w=1080',
      mutualFriends: 8,
    },
    {
      name: 'Design Hub',
      username: 'designhub',
      avatar: 'https://images.unsplash.com/photo-1669038045897-3869080bf458?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGFydHxlbnwxfHx8fDE3NjExNDg4OTl8MA&ixlib=rb-4.1.0&q=80&w=1080',
      mutualFriends: 5,
    },
  ];

  const upcomingEvents = [
    {
      title: 'Tech Conference 2025',
      date: 'Dec 15, 2025',
      interested: 1234,
    },
    {
      title: 'Design Workshop',
      date: 'Dec 20, 2025',
      interested: 567,
    },
  ];

  return (
    <div className="w-80 h-screen sticky top-0 p-4 overflow-y-auto bg-background">
      {/* Theme Toggle */}
      <div className="mb-4 flex items-center justify-between">
        <ThemeToggle theme={theme} onThemeChange={onThemeChange} />
        <button className="p-2 hover:bg-muted rounded-lg transition-colors">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Trending Topics */}
      <div className="bg-card rounded-xl border border-border overflow-hidden mb-4">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h3>Trending Now</h3>
        </div>
        <div>
          {trends.map((trend, idx) => (
            <button
              key={idx}
              className="w-full p-4 hover:bg-muted transition-colors text-left border-b border-border last:border-0"
            >
              <div className="text-sm text-muted-foreground mb-1">{trend.category}</div>
              <div className="font-semibold mb-1">{trend.tag}</div>
              <div className="text-sm text-muted-foreground">{trend.posts}</div>
            </button>
          ))}
        </div>
        <button className="w-full p-3 text-blue-600 hover:bg-muted transition-colors text-center">
          Show more
        </button>
      </div>

      {/* Suggested Connections */}
      <div className="bg-card rounded-xl border border-border overflow-hidden mb-4">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          <h3>People You May Know</h3>
        </div>
        <div>
          {suggestions.map((user, idx) => (
            <div
              key={idx}
              className="p-4 hover:bg-muted transition-colors border-b border-border last:border-0"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-500">
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{user.name}</div>
                  <div className="text-sm text-muted-foreground truncate">@{user.username}</div>
                  <div className="text-xs text-muted-foreground">{user.mutualFriends} mutual friends</div>
                </div>
              </div>
              <button
                className={`w-full py-2 rounded-lg transition-colors ${
                  theme === 'incognito'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Connect
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-blue-600" />
          <h3>Upcoming Events</h3>
        </div>
        <div>
          {upcomingEvents.map((event, idx) => (
            <button
              key={idx}
              className="w-full p-4 hover:bg-muted transition-colors text-left border-b border-border last:border-0"
            >
              <div className="font-semibold mb-1">{event.title}</div>
              <div className="text-sm text-muted-foreground mb-2">{event.date}</div>
              <div className="text-xs text-blue-600">{event.interested} people interested</div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 p-4 text-xs text-muted-foreground space-y-2">
        <div className="flex flex-wrap gap-2">
          <a href="#" className="hover:underline">About</a>
          <span>·</span>
          <a href="#" className="hover:underline">Help</a>
          <span>·</span>
          <a href="#" className="hover:underline">Privacy</a>
          <span>·</span>
          <a href="#" className="hover:underline">Terms</a>
        </div>
        <div>© 2025 Snitch. All rights reserved.</div>
      </div>
    </div>
  );
}
