import { Search, TrendingUp } from 'lucide-react';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { PostCard } from '../PostCard';

interface SnitchDiscoverProps {
  onPostClick: (postId: string) => void;
  theme: 'light' | 'dark' | 'incognito';
}

export function SnitchDiscover({ onPostClick, theme }: SnitchDiscoverProps) {
  const trendingTopics = [
    { tag: '#TechNews', posts: '127K posts', growth: '+12%' },
    { tag: '#DesignTips', posts: '89K posts', growth: '+8%' },
    { tag: '#AI2025', posts: '234K posts', growth: '+25%' },
    { tag: '#Fitness', posts: '156K posts', growth: '+15%' },
    { tag: '#Travel', posts: '98K posts', growth: '+6%' },
  ];

  const trendingPosts = [
    {
      id: '1',
      author: {
        name: 'Tech Insider',
        username: 'techinsider',
        avatar: 'https://images.unsplash.com/photo-1623715537851-8bc15aa8c145?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwd29ya3NwYWNlfGVufDF8fHx8MTc2MTE3NTc2MHww&ixlib=rb-4.1.0&q=80&w=1080',
        verified: true,
      },
      content: 'Breaking: Major announcement in AI technology! This could change everything we know about machine learning. Read more about the implications. 🚀\n\n#TechNews #AI #Innovation',
      timestamp: '1 hour ago',
      images: ['https://images.unsplash.com/photo-1623715537851-8bc15aa8c145?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwd29ya3NwYWNlfGVufDF8fHx8MTc2MTE3NTc2MHww&ixlib=rb-4.1.0&q=80&w=1080'],
      stats: {
        likes: 12400,
        comments: 567,
        shares: 234,
      },
    },
    {
      id: '2',
      author: {
        name: 'Design Masters',
        username: 'designmasters',
        avatar: 'https://images.unsplash.com/photo-1669038045897-3869080bf458?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGFydHxlbnwxfHx8fDE3NjExNDg4OTl8MA&ixlib=rb-4.1.0&q=80&w=1080',
        verified: true,
      },
      content: '10 Design Trends That Will Dominate 2025 🎨\n\n1. Minimalist interfaces\n2. Bold typography\n3. 3D elements\n4. Dark mode everything\n5. Micro-interactions\n\nWhat\'s your favorite trend?',
      timestamp: '3 hours ago',
      stats: {
        likes: 8900,
        comments: 345,
        shares: 178,
      },
    },
    {
      id: '3',
      author: {
        name: 'Fitness Motivation',
        username: 'fitmotivation',
        avatar: 'https://images.unsplash.com/photo-1618688862225-ac941a9da58f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwd29ya291dHxlbnwxfHx8fDE3NjEyNDMwNTh8MA&ixlib=rb-4.1.0&q=80&w=1080',
      },
      content: 'Transform your body in 30 days! 💪 Here\'s my complete workout plan that helped me achieve my fitness goals. No gym equipment needed!\n\n#Fitness #Workout #HealthyLiving',
      timestamp: '5 hours ago',
      images: ['https://images.unsplash.com/photo-1618688862225-ac941a9da58f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwd29ya291dHxlbnwxfHx8fDE3NjEyNDMwNTh8MA&ixlib=rb-4.1.0&q=80&w=1080'],
      stats: {
        likes: 6700,
        comments: 234,
        shares: 156,
      },
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search for people, topics, or posts..."
              className="pl-12 bg-card border-border rounded-xl h-12"
            />
          </div>
        </div>

        {/* Trending Topics */}
        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className={`w-5 h-5 ${theme === 'incognito' ? 'text-red-600' : 'text-blue-600'}`} />
            <h2>Trending Topics</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trendingTopics.map((topic, idx) => (
              <button
                key={idx}
                className="p-4 bg-muted rounded-xl hover:bg-muted/70 transition-colors text-left"
              >
                <div className={`text-xl mb-1 ${theme === 'incognito' ? 'text-red-600' : 'text-blue-600'}`}>
                  {topic.tag}
                </div>
                <div className="text-sm text-muted-foreground mb-1">{topic.posts}</div>
                <div className={`text-sm ${theme === 'incognito' ? 'text-red-600' : 'text-blue-600'}`}>
                  {topic.growth} growth
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="trending" className="w-full">
          <TabsList className="w-full h-auto p-0 bg-transparent border-b border-border rounded-none mb-6">
            <TabsTrigger
              value="trending"
              className={`flex-1 rounded-none data-[state=active]:bg-transparent py-3 ${
                theme === 'incognito'
                  ? 'data-[state=active]:border-b-4 data-[state=active]:border-red-600'
                  : 'data-[state=active]:border-b-4 data-[state=active]:border-blue-600'
              }`}
            >
              Trending
            </TabsTrigger>
            <TabsTrigger
              value="latest"
              className={`flex-1 rounded-none data-[state=active]:bg-transparent py-3 ${
                theme === 'incognito'
                  ? 'data-[state=active]:border-b-4 data-[state=active]:border-red-600'
                  : 'data-[state=active]:border-b-4 data-[state=active]:border-blue-600'
              }`}
            >
              Latest
            </TabsTrigger>
            <TabsTrigger
              value="people"
              className={`flex-1 rounded-none data-[state=active]:bg-transparent py-3 ${
                theme === 'incognito'
                  ? 'data-[state=active]:border-b-4 data-[state=active]:border-red-600'
                  : 'data-[state=active]:border-b-4 data-[state=active]:border-blue-600'
              }`}
            >
              People
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trending" className="mt-0 space-y-4">
            {trendingPosts.map((post) => (
              <PostCard key={post.id} {...post} onClick={() => onPostClick(post.id)} />
            ))}
          </TabsContent>

          <TabsContent value="latest" className="mt-0 space-y-4">
            {trendingPosts.reverse().map((post) => (
              <PostCard key={post.id} {...post} onClick={() => onPostClick(post.id)} />
            ))}
          </TabsContent>

          <TabsContent value="people" className="mt-0">
            <div className="text-center py-12 text-muted-foreground">
              <p>Search for people to see results</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
