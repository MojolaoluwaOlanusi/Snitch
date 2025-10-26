import { ArrowLeft, MessageCircle, Repeat2, Heart, BarChart2, Share, Bookmark, MoreHorizontal, Image, Smile } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { useState } from 'react';
import { TweetCard } from '../TweetCard';

interface TweetDetailProps {
  onBack: () => void;
}

export function TweetDetail({ onBack }: TweetDetailProps) {
  const [replyContent, setReplyContent] = useState('');

  const tweet = {
    author: {
      name: 'Sarah Johnson',
      handle: 'sarahj',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHBlcnNvbnxlbnwxfHx8fDE3NjExNzc4NDd8MA&ixlib=rb-4.1.0&q=80&w=1080',
      verified: true,
    },
    content: 'Just launched our new product! 🚀 Excited to share what we\'ve been working on for the past 6 months. Check it out and let me know what you think!',
    timestamp: '2:34 PM · Oct 23, 2025',
    stats: {
      replies: 234,
      retweets: 1200,
      likes: 4500,
      views: 125000,
    },
  };

  const replies = [
    {
      id: '1',
      author: {
        name: 'Tech News',
        handle: 'technews',
        avatar: 'https://images.unsplash.com/photo-1623715537851-8bc15aa8c145?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwd29ya3NwYWNlfGVufDF8fHx8MTc2MTE3NTc2MHww&ixlib=rb-4.1.0&q=80&w=1080',
        verified: true,
      },
      content: 'Congratulations on the launch! This looks amazing 🎉',
      timestamp: '30m',
      stats: {
        replies: 5,
        retweets: 12,
        likes: 89,
        views: 1200,
      },
    },
    {
      id: '2',
      author: {
        name: 'Design Tips',
        handle: 'designtips',
        avatar: 'https://images.unsplash.com/photo-1669038045897-3869080bf458?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGFydHxlbnwxfHx8fDE3NjExNDg4OTl8MA&ixlib=rb-4.1.0&q=80&w=1080',
      },
      content: 'Been waiting for this! Great work team! 👏',
      timestamp: '1h',
      stats: {
        replies: 2,
        retweets: 8,
        likes: 45,
        views: 890,
      },
    },
  ];

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="flex-1 border-r border-gray-200">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-10">
        <div className="flex items-center gap-8 p-4">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-gray-100 -ml-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1>Post</h1>
        </div>
      </div>

      {/* Tweet Detail */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gray-300 overflow-hidden">
            <img
              src={tweet.author.avatar}
              alt={tweet.author.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1 mb-1">
              <span>{tweet.author.name}</span>
              {tweet.author.verified && (
                <svg viewBox="0 0 22 22" className="w-5 h-5 text-blue-500" fill="currentColor">
                  <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
                </svg>
              )}
            </div>
            <div className="text-gray-500">@{tweet.author.handle}</div>
          </div>
          <button className="p-2 rounded-full hover:bg-gray-100 h-fit">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        <p className="text-2xl mb-4">{tweet.content}</p>
        <div className="text-gray-500 mb-4">{tweet.timestamp}</div>

        <div className="flex items-center gap-6 py-4 border-y border-gray-200 mb-4">
          <div>
            <span>{formatNumber(tweet.stats.retweets)}</span>{' '}
            <span className="text-gray-500">Reposts</span>
          </div>
          <div>
            <span>{formatNumber(tweet.stats.likes)}</span>{' '}
            <span className="text-gray-500">Likes</span>
          </div>
          <div>
            <span>{formatNumber(tweet.stats.views)}</span>{' '}
            <span className="text-gray-500">Views</span>
          </div>
        </div>

        <div className="flex items-center justify-around py-2 border-b border-gray-200">
          <button className="p-2 rounded-full text-gray-500 hover:text-blue-500 hover:bg-blue-50">
            <MessageCircle className="w-6 h-6" />
          </button>
          <button className="p-2 rounded-full text-gray-500 hover:text-green-500 hover:bg-green-50">
            <Repeat2 className="w-6 h-6" />
          </button>
          <button className="p-2 rounded-full text-gray-500 hover:text-pink-500 hover:bg-pink-50">
            <Heart className="w-6 h-6" />
          </button>
          <button className="p-2 rounded-full text-gray-500 hover:text-blue-500 hover:bg-blue-50">
            <BarChart2 className="w-6 h-6" />
          </button>
          <div className="flex gap-2">
            <button className="p-2 rounded-full text-gray-500 hover:text-blue-500 hover:bg-blue-50">
              <Bookmark className="w-6 h-6" />
            </button>
            <button className="p-2 rounded-full text-gray-500 hover:text-blue-500 hover:bg-blue-50">
              <Share className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Reply Box */}
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
              placeholder="Post your reply"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="border-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 min-h-[60px] mb-3"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button className="p-2 rounded-full hover:bg-blue-50 text-blue-500">
                  <Image className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-full hover:bg-blue-50 text-blue-500">
                  <Smile className="w-5 h-5" />
                </button>
              </div>
              <Button
                disabled={!replyContent.trim()}
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4"
              >
                Reply
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Replies */}
      <div>
        {replies.map((reply) => (
          <TweetCard key={reply.id} {...reply} onClick={() => {}} />
        ))}
      </div>
    </div>
  );
}
