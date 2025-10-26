import { TweetCard } from '../TweetCard';
import { Sparkles, Image, Smile, Calendar, MapPin } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { useState } from 'react';

interface HomeProps {
  onTweetClick: (tweetId: string) => void;
}

export function Home({ onTweetClick }: HomeProps) {
  const [tweetContent, setTweetContent] = useState('');

  const tweets = [
    {
      id: '1',
      author: {
        name: 'Sarah Johnson',
        handle: 'sarahj',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHBlcnNvbnxlbnwxfHx8fDE3NjExNzc4NDd8MA&ixlib=rb-4.1.0&q=80&w=1080',
        verified: true,
      },
      content: 'Just launched our new product! 🚀 Excited to share what we\'ve been working on for the past 6 months. Check it out and let me know what you think!',
      timestamp: '2h',
      stats: {
        replies: 234,
        retweets: 1200,
        likes: 4500,
        views: 125000,
      },
    },
    {
      id: '2',
      author: {
        name: 'Tech News',
        handle: 'technews',
        avatar: 'https://images.unsplash.com/photo-1623715537851-8bc15aa8c145?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwd29ya3NwYWNlfGVufDF8fHx8MTc2MTE3NTc2MHww&ixlib=rb-4.1.0&q=80&w=1080',
        verified: true,
      },
      content: 'Breaking: Major tech companies announce new AI collaboration initiative. This could change everything we know about artificial intelligence development.',
      timestamp: '4h',
      image: 'https://images.unsplash.com/photo-1623715537851-8bc15aa8c145?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwd29ya3NwYWNlfGVufDF8fHx8MTc2MTE3NTc2MHww&ixlib=rb-4.1.0&q=80&w=1080',
      stats: {
        replies: 456,
        retweets: 2300,
        likes: 8900,
        views: 234000,
      },
    },
    {
      id: '3',
      author: {
        name: 'Design Tips',
        handle: 'designtips',
        avatar: 'https://images.unsplash.com/photo-1669038045897-3869080bf458?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGFydHxlbnwxfHx8fDE3NjExNDg4OTl8MA&ixlib=rb-4.1.0&q=80&w=1080',
      },
      content: '10 UI design principles every designer should know:\n\n1. Consistency is key\n2. Clear visual hierarchy\n3. Use white space effectively\n4. Make it accessible\n5. Keep it simple',
      timestamp: '6h',
      stats: {
        replies: 89,
        retweets: 567,
        likes: 2100,
        views: 45000,
      },
      isRetweet: true,
      retweetedBy: 'John Doe',
    },
    {
      id: '4',
      author: {
        name: 'Nature Photos',
        handle: 'naturepics',
        avatar: 'https://images.unsplash.com/photo-1617634667039-8e4cb277ab46?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYXR1cmUlMjBsYW5kc2NhcGV8ZW58MXx8fHwxNzYxMTcyNDI5fDA&ixlib=rb-4.1.0&q=80&w=1080',
      },
      content: 'Morning views from the mountains. Sometimes you just need to disconnect and enjoy nature 🏔️',
      timestamp: '8h',
      image: 'https://images.unsplash.com/photo-1617634667039-8e4cb277ab46?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYXR1cmUlMjBsYW5kc2NhcGV8ZW58MXx8fHwxNzYxMTcyNDI5fDA&ixlib=rb-4.1.0&q=80&w=1080',
      stats: {
        replies: 123,
        retweets: 890,
        likes: 5600,
        views: 78000,
      },
    },
    {
      id: '5',
      author: {
        name: 'City Explorer',
        handle: 'cityexplorer',
        avatar: 'https://images.unsplash.com/photo-1493134799591-2c9eed26201a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwc2t5bGluZXxlbnwxfHx8fDE3NjExMzkzMDN8MA&ixlib=rb-4.1.0&q=80&w=1080',
        verified: true,
      },
      content: 'The city never sleeps 🌃 Captured this stunning skyline view last night during my evening walk.',
      timestamp: '12h',
      image: 'https://images.unsplash.com/photo-1493134799591-2c9eed26201a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwc2t5bGluZXxlbnwxfHx8fDE3NjExMzkzMDN8MA&ixlib=rb-4.1.0&q=80&w=1080',
      stats: {
        replies: 67,
        retweets: 345,
        likes: 1800,
        views: 34000,
      },
    },
  ];

  return (
    <div className="flex-1 border-r border-gray-200">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-10">
        <div className="flex items-center justify-between p-4">
          <h1>Home</h1>
          <button className="p-2 rounded-full hover:bg-gray-100">
            <Sparkles className="w-5 h-5" />
          </button>
        </div>
        <div className="flex border-b border-gray-200">
          <button className="flex-1 py-4 hover:bg-gray-100 relative">
            <span>For you</span>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-full"></div>
          </button>
          <button className="flex-1 py-4 hover:bg-gray-100 text-gray-500">
            Following
          </button>
        </div>
      </div>

      {/* Tweet Composer */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
            <img
              src="https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NjEyNDQyMzZ8MA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="User"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <Textarea
              placeholder="What is happening?!"
              value={tweetContent}
              onChange={(e) => setTweetContent(e.target.value)}
              className="border-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 min-h-[60px] text-xl"
            />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-1">
                <button className="p-2 rounded-full hover:bg-blue-50 text-blue-500">
                  <Image className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-full hover:bg-blue-50 text-blue-500">
                  <Smile className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-full hover:bg-blue-50 text-blue-500">
                  <Calendar className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-full hover:bg-blue-50 text-blue-500">
                  <MapPin className="w-5 h-5" />
                </button>
              </div>
              <Button
                disabled={!tweetContent.trim()}
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4"
              >
                Post
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div>
        {tweets.map((tweet) => (
          <TweetCard
            key={tweet.id}
            {...tweet}
            onClick={() => onTweetClick(tweet.id)}
          />
        ))}
      </div>
    </div>
  );
}
