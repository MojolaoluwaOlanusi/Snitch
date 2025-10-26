import { Search, MoreHorizontal } from 'lucide-react';
import { Input } from './ui/input';

export function RightSidebar() {
  const trends = [
    { category: 'Technology', topic: '#AI', posts: '127K' },
    { category: 'Sports', topic: 'World Cup', posts: '89K' },
    { category: 'Entertainment', topic: '#NewMovie', posts: '56K' },
    { category: 'Politics', topic: 'Election 2024', posts: '234K' },
    { category: 'Gaming', topic: '#GameRelease', posts: '45K' },
  ];

  const suggestions = [
    {
      name: 'Sarah Johnson',
      handle: '@sarahj',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHBlcnNvbnxlbnwxfHx8fDE3NjExNzc4NDd8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      name: 'Tech News',
      handle: '@technews',
      avatar: 'https://images.unsplash.com/photo-1623715537851-8bc15aa8c145?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwd29ya3NwYWNlfGVufDF8fHx8MTc2MTE3NTc2MHww&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      name: 'Design Tips',
      handle: '@designtips',
      avatar: 'https://images.unsplash.com/photo-1669038045897-3869080bf458?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGFydHxlbnwxfHx8fDE3NjExNDg4OTl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
  ];

  return (
    <div className="w-96 h-screen sticky top-0 p-4">
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <Input
          placeholder="Search"
          className="pl-12 bg-gray-100 border-0 rounded-full"
        />
      </div>

      {/* Subscribe */}
      <div className="bg-gray-100 rounded-2xl p-4 mb-4">
        <h2 className="mb-2">Subscribe to Premium</h2>
        <p className="text-gray-600 mb-3">
          Subscribe to unlock new features and if eligible, receive a share of ads revenue.
        </p>
        <button className="bg-black text-white px-4 py-2 rounded-full hover:bg-gray-800">
          Subscribe
        </button>
      </div>

      {/* Trends */}
      <div className="bg-gray-100 rounded-2xl overflow-hidden mb-4">
        <h2 className="p-4">What's happening</h2>
        <div>
          {trends.map((trend, index) => (
            <button
              key={index}
              className="w-full p-4 hover:bg-gray-200 transition-colors text-left"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="text-gray-500 text-sm">{trend.category}</div>
                  <div>{trend.topic}</div>
                  <div className="text-gray-500 text-sm">{trend.posts} posts</div>
                </div>
                <MoreHorizontal className="w-5 h-5 text-gray-500" />
              </div>
            </button>
          ))}
        </div>
        <button className="w-full p-4 text-blue-500 hover:bg-gray-200 text-left">
          Show more
        </button>
      </div>

      {/* Who to follow */}
      <div className="bg-gray-100 rounded-2xl overflow-hidden">
        <h2 className="p-4">Who to follow</h2>
        <div>
          {suggestions.map((user, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 hover:bg-gray-200 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div>{user.name}</div>
                  <div className="text-gray-500">{user.handle}</div>
                </div>
              </div>
              <button className="bg-black text-white px-4 py-2 rounded-full hover:bg-gray-800">
                Follow
              </button>
            </div>
          ))}
        </div>
        <button className="w-full p-4 text-blue-500 hover:bg-gray-200 text-left">
          Show more
        </button>
      </div>

      {/* Footer Links */}
      <div className="flex flex-wrap gap-2 p-4 text-gray-500 text-sm">
        <a href="#" className="hover:underline">Terms of Service</a>
        <a href="#" className="hover:underline">Privacy Policy</a>
        <a href="#" className="hover:underline">Cookie Policy</a>
        <a href="#" className="hover:underline">Accessibility</a>
        <a href="#" className="hover:underline">Ads info</a>
        <a href="#" className="hover:underline">More</a>
        <div>© 2025 X Corp.</div>
      </div>
    </div>
  );
}
