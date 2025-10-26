import { MoreHorizontal } from 'lucide-react';
import { TweetCard } from '../TweetCard';

interface BookmarksProps {
  onTweetClick: (tweetId: string) => void;
}

export function Bookmarks({ onTweetClick }: BookmarksProps) {
  const bookmarkedTweets = [
    {
      id: '1',
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
      timestamp: '1d',
      image: 'https://images.unsplash.com/photo-1623715537851-8bc15aa8c145?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwd29ya3NwYWNlfGVufDF8fHx8MTc2MTE3NTc2MHww&ixlib=rb-4.1.0&q=80&w=1080',
      stats: {
        replies: 456,
        retweets: 2300,
        likes: 8900,
        views: 234000,
      },
    },
  ];

  return (
    <div className="flex-1 border-r border-gray-200">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-10">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1>Bookmarks</h1>
            <div className="text-gray-500 text-sm">@johndoe</div>
          </div>
          <button className="p-2 rounded-full hover:bg-gray-100">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bookmarked Tweets */}
      <div>
        {bookmarkedTweets.map((tweet) => (
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
