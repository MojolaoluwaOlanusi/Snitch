import { Search, Settings } from 'lucide-react';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { TweetCard } from '../TweetCard';

interface ExploreProps {
  onTweetClick: (tweetId: string) => void;
}

export function Explore({ onTweetClick }: ExploreProps) {
  const trendingTweets = [
    {
      id: '1',
      author: {
        name: 'Breaking News',
        handle: 'breakingnews',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHBlcnNvbnxlbnwxfHx8fDE3NjExNzc4NDd8MA&ixlib=rb-4.1.0&q=80&w=1080',
        verified: true,
      },
      content: '🚨 BREAKING: Major announcement expected in the tech industry today. Stay tuned for updates.',
      timestamp: '30m',
      stats: {
        replies: 1234,
        retweets: 5600,
        likes: 12000,
        views: 456000,
      },
    },
    {
      id: '2',
      author: {
        name: 'Sports Daily',
        handle: 'sportsdaily',
        avatar: 'https://images.unsplash.com/photo-1623715537851-8bc15aa8c145?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwd29ya3NwYWNlfGVufDF8fHx8MTc2MTE3NTc2MHww&ixlib=rb-4.1.0&q=80&w=1080',
        verified: true,
      },
      content: 'Game of the century! What a performance! 🏆',
      timestamp: '1h',
      image: 'https://images.unsplash.com/photo-1617634667039-8e4cb277ab46?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYXR1cmUlMjBsYW5kc2NhcGV8ZW58MXx8fHwxNzYxMTcyNDI5fDA&ixlib=rb-4.1.0&q=80&w=1080',
      stats: {
        replies: 890,
        retweets: 3400,
        likes: 9800,
        views: 234000,
      },
    },
  ];

  return (
    <div className="flex-1 border-r border-gray-200">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-10">
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              placeholder="Search"
              className="pl-12 bg-gray-100 border-0 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="foryou" className="w-full">
        <TabsList className="w-full h-auto p-0 bg-transparent border-b border-gray-200 rounded-none">
          <TabsTrigger
            value="foryou"
            className="flex-1 rounded-none data-[state=active]:border-b-4 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent py-4"
          >
            For you
          </TabsTrigger>
          <TabsTrigger
            value="trending"
            className="flex-1 rounded-none data-[state=active]:border-b-4 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent py-4"
          >
            Trending
          </TabsTrigger>
          <TabsTrigger
            value="news"
            className="flex-1 rounded-none data-[state=active]:border-b-4 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent py-4"
          >
            News
          </TabsTrigger>
          <TabsTrigger
            value="sports"
            className="flex-1 rounded-none data-[state=active]:border-b-4 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent py-4"
          >
            Sports
          </TabsTrigger>
          <TabsTrigger
            value="entertainment"
            className="flex-1 rounded-none data-[state=active]:border-b-4 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent py-4"
          >
            Entertainment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="foryou" className="mt-0">
          {/* Featured Image */}
          <div className="relative h-96 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1493134799591-2c9eed26201a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwc2t5bGluZXxlbnwxfHx8fDE3NjExMzkzMDN8MA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Featured"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <div className="text-white">
                <div className="text-sm mb-2">Trending in Technology</div>
                <h2 className="mb-2">The Future of AI Development</h2>
                <p className="text-sm text-gray-200">
                  Leading tech companies collaborate on groundbreaking AI initiative
                </p>
              </div>
            </div>
          </div>
          {trendingTweets.map((tweet) => (
            <TweetCard
              key={tweet.id}
              {...tweet}
              onClick={() => onTweetClick(tweet.id)}
            />
          ))}
        </TabsContent>

        <TabsContent value="trending" className="mt-0">
          {trendingTweets.map((tweet) => (
            <TweetCard
              key={tweet.id}
              {...tweet}
              onClick={() => onTweetClick(tweet.id)}
            />
          ))}
        </TabsContent>

        <TabsContent value="news" className="mt-0">
          {trendingTweets.slice(0, 1).map((tweet) => (
            <TweetCard
              key={tweet.id}
              {...tweet}
              onClick={() => onTweetClick(tweet.id)}
            />
          ))}
        </TabsContent>

        <TabsContent value="sports" className="mt-0">
          {trendingTweets.slice(1).map((tweet) => (
            <TweetCard
              key={tweet.id}
              {...tweet}
              onClick={() => onTweetClick(tweet.id)}
            />
          ))}
        </TabsContent>

        <TabsContent value="entertainment" className="mt-0">
          <div className="p-8 text-center text-gray-500">
            <p>No entertainment posts at the moment</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
