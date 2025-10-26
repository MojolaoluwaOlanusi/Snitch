import { StoryCard } from '../StoryCard';
import { PostCard } from '../PostCard';
import { Image, Video, Smile } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface SnitchHomeProps {
  onPostClick: (postId: string) => void;
  theme: 'light' | 'dark' | 'incognito';
}

export function SnitchHome({ onPostClick, theme }: SnitchHomeProps) {
  const [postContent, setPostContent] = useState('');

  const stories = [
    {
      user: { name: 'Your Story', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NjEyNDQyMzZ8MA&ixlib=rb-4.1.0&q=80&w=1080' },
      image: 'https://images.unsplash.com/photo-1730875648117-ff32ae9b98c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmllbmRzJTIwc29jaWFsJTIwZ2F0aGVyaW5nfGVufDF8fHx8MTc2MTI5ODc4NHww&ixlib=rb-4.1.0&q=80&w=1080',
      isOwn: true,
    },
    {
      user: { name: 'Sarah Johnson', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHBlcnNvbnxlbnwxfHx8fDE3NjExNzc4NDd8MA&ixlib=rb-4.1.0&q=80&w=1080' },
      image: 'https://images.unsplash.com/photo-1532980400857-e8d9d275d858?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb29kJTIwcGhvdG9ncmFwaHl8ZW58MXx8fHwxNzYxMjU3Njc1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      user: { name: 'Travel Tales', avatar: 'https://images.unsplash.com/photo-1528543606781-2f6e6857f318?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmF2ZWwlMjBhZHZlbnR1cmV8ZW58MXx8fHwxNzYxMjQ3MjA4fDA&ixlib=rb-4.1.0&q=80&w=1080' },
      image: 'https://images.unsplash.com/photo-1528543606781-2f6e6857f318?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmF2ZWwlMjBhZHZlbnR1cmV8ZW58MXx8fHwxNzYxMjQ3MjA4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      user: { name: 'Fitness Pro', avatar: 'https://images.unsplash.com/photo-1618688862225-ac941a9da58f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwd29ya291dHxlbnwxfHx8fDE3NjEyNDMwNTh8MA&ixlib=rb-4.1.0&q=80&w=1080' },
      image: 'https://images.unsplash.com/photo-1618688862225-ac941a9da58f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwd29ya291dHxlbnwxfHx8fDE3NjEyNDMwNTh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      user: { name: 'Fashion Hub', avatar: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwc3R5bGV8ZW58MXx8fHwxNzYxMTcxNTI3fDA&ixlib=rb-4.1.0&q=80&w=1080' },
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwc3R5bGV8ZW58MXx8fHwxNzYxMTcxNTI3fDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
  ];

  const posts = [
    {
      id: '1',
      author: {
        name: 'Sarah Johnson',
        username: 'sarahj',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHBlcnNvbnxlbnwxfHx8fDE3NjExNzc4NDd8MA&ixlib=rb-4.1.0&q=80&w=1080',
        verified: true,
      },
      content: 'Just had the most amazing dinner at this new restaurant! 🍽️ The food was absolutely incredible and the atmosphere was perfect. Highly recommend checking it out!',
      timestamp: '2 hours ago',
      images: ['https://images.unsplash.com/photo-1532980400857-e8d9d275d858?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb29kJTIwcGhvdG9ncmFwaHl8ZW58MXx8fHwxNzYxMjU3Njc1fDA&ixlib=rb-4.1.0&q=80&w=1080'],
      stats: {
        likes: 1234,
        comments: 89,
        shares: 45,
      },
    },
    {
      id: '2',
      author: {
        name: 'Travel Tales',
        username: 'traveltales',
        avatar: 'https://images.unsplash.com/photo-1528543606781-2f6e6857f318?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmF2ZWwlMjBhZHZlbnR1cmV8ZW58MXx8fHwxNzYxMjQ3MjA4fDA&ixlib=rb-4.1.0&q=80&w=1080',
        verified: true,
      },
      content: 'Exploring the mountains has been an incredible journey! The views are breathtaking and every moment feels like a dream. 🏔️✨\n\n#Travel #Adventure #Nature',
      timestamp: '5 hours ago',
      images: ['https://images.unsplash.com/photo-1528543606781-2f6e6857f318?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmF2ZWwlMjBhZHZlbnR1cmV8ZW58MXx8fHwxNzYxMjQ3MjA4fDA&ixlib=rb-4.1.0&q=80&w=1080'],
      stats: {
        likes: 2456,
        comments: 156,
        shares: 89,
      },
    },
    {
      id: '3',
      author: {
        name: 'Fitness Pro',
        username: 'fitnesspro',
        avatar: 'https://images.unsplash.com/photo-1618688862225-ac941a9da58f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwd29ya291dHxlbnwxfHx8fDE3NjEyNDMwNTh8MA&ixlib=rb-4.1.0&q=80&w=1080',
      },
      content: 'Morning workout complete! 💪 Remember, consistency is key to achieving your fitness goals. Keep pushing!\n\n#Fitness #Motivation #HealthyLifestyle',
      timestamp: '8 hours ago',
      images: ['https://images.unsplash.com/photo-1618688862225-ac941a9da58f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwd29ya291dHxlbnwxfHx8fDE3NjEyNDMwNTh8MA&ixlib=rb-4.1.0&q=80&w=1080'],
      stats: {
        likes: 892,
        comments: 67,
        shares: 34,
      },
    },
    {
      id: '4',
      author: {
        name: 'Fashion Hub',
        username: 'fashionhub',
        avatar: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwc3R5bGV8ZW58MXx8fHwxNzYxMTcxNTI3fDA&ixlib=rb-4.1.0&q=80&w=1080',
        verified: true,
      },
      content: 'New fall collection is here! 🍂 Loving these cozy vibes and warm tones. What\'s your favorite fall fashion trend?',
      timestamp: '1 day ago',
      images: [
        'https://images.unsplash.com/photo-1483985988355-763728e1935b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwc3R5bGV8ZW58MXx8fHwxNzYxMTcxNTI3fDA&ixlib=rb-4.1.0&q=80&w=1080',
      ],
      stats: {
        likes: 3421,
        comments: 234,
        shares: 112,
      },
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border z-10">
        <Tabs defaultValue="foryou" className="w-full">
          <TabsList className="w-full h-auto p-0 bg-transparent border-0 rounded-none">
            <TabsTrigger
              value="foryou"
              className={`flex-1 rounded-none data-[state=active]:bg-transparent py-4 ${
                theme === 'incognito'
                  ? 'data-[state=active]:border-b-4 data-[state=active]:border-red-600'
                  : 'data-[state=active]:border-b-4 data-[state=active]:border-blue-600'
              }`}
            >
              For You
            </TabsTrigger>
            <TabsTrigger
              value="following"
              className={`flex-1 rounded-none data-[state=active]:bg-transparent py-4 ${
                theme === 'incognito'
                  ? 'data-[state=active]:border-b-4 data-[state=active]:border-red-600'
                  : 'data-[state=active]:border-b-4 data-[state=active]:border-blue-600'
              }`}
            >
              Following
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Stories */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {stories.map((story, idx) => (
            <StoryCard key={idx} {...story} />
          ))}
        </div>

        {/* Post Composer */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 overflow-hidden flex-shrink-0">
              <img
                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NjEyNDQyMzZ8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="User"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <Textarea
                placeholder="What's on your mind, John?"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                className="border-0 bg-muted resize-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl min-h-[80px] mb-3"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button className={`p-2 rounded-lg transition-colors ${
                    theme === 'incognito'
                      ? 'hover:bg-red-600/10 text-muted-foreground'
                      : 'hover:bg-blue-50 text-muted-foreground'
                  }`}>
                    <Image className="w-6 h-6" />
                  </button>
                  <button className={`p-2 rounded-lg transition-colors ${
                    theme === 'incognito'
                      ? 'hover:bg-red-600/10 text-muted-foreground'
                      : 'hover:bg-blue-50 text-muted-foreground'
                  }`}>
                    <Video className="w-6 h-6" />
                  </button>
                  <button className={`p-2 rounded-lg transition-colors ${
                    theme === 'incognito'
                      ? 'hover:bg-red-600/10 text-muted-foreground'
                      : 'hover:bg-blue-50 text-muted-foreground'
                  }`}>
                    <Smile className="w-6 h-6" />
                  </button>
                </div>
                <Button
                  disabled={!postContent.trim()}
                  className={`${
                    theme === 'incognito'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600'
                  } text-white rounded-xl px-6`}
                >
                  Post
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Feed */}
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} {...post} onClick={() => onPostClick(post.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}
