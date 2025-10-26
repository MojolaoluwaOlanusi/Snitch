import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, ThumbsUp, Send } from 'lucide-react';
import { useState } from 'react';

interface PostCardProps {
  author: {
    name: string;
    username: string;
    avatar: string;
    verified?: boolean;
  };
  content: string;
  timestamp: string;
  images?: string[];
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
  onClick?: () => void;
}

export function PostCard({ author, content, timestamp, images, stats, onClick }: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-500">
              <img src={author.avatar} alt={author.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-semibold">{author.name}</span>
                {author.verified && (
                  <svg viewBox="0 0 22 22" className="w-5 h-5 text-blue-600" fill="currentColor">
                    <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
                  </svg>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                @{author.username} · {timestamp}
              </div>
            </div>
          </div>
          <button className="p-2 hover:bg-muted rounded-full transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <p className="mb-3 whitespace-pre-wrap">{content}</p>

        {/* Images */}
        {images && images.length > 0 && (
          <div className={`grid gap-2 mb-3 ${
            images.length === 1 ? 'grid-cols-1' :
            images.length === 2 ? 'grid-cols-2' :
            images.length === 3 ? 'grid-cols-2' :
            'grid-cols-2'
          }`}>
            {images.map((img, idx) => (
              <div
                key={idx}
                className={`rounded-lg overflow-hidden ${
                  images.length === 3 && idx === 0 ? 'col-span-2' : ''
                } ${images.length > 4 && idx >= 3 ? 'hidden' : ''}`}
              >
                <img
                  src={img}
                  alt=""
                  className="w-full h-full object-cover aspect-square hover:scale-105 transition-transform cursor-pointer"
                  onClick={onClick}
                />
              </div>
            ))}
            {images.length > 4 && (
              <div className="absolute bottom-2 right-2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                +{images.length - 4}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <button className="flex items-center gap-2 text-muted-foreground hover:text-blue-600 transition-colors">
            <ThumbsUp className="w-5 h-5" />
            <span className="text-sm">{formatNumber(stats.likes)}</span>
          </button>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{formatNumber(stats.comments)} comments</span>
            <span>{formatNumber(stats.shares)} shares</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLiked(!liked)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${
              liked ? 'text-blue-600 bg-blue-50' : 'hover:bg-muted'
            }`}
          >
            <ThumbsUp className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
            <span>Like</span>
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-muted transition-colors">
            <MessageCircle className="w-5 h-5" />
            <span>Comment</span>
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-muted transition-colors">
            <Share2 className="w-5 h-5" />
            <span>Share</span>
          </button>
          <button
            onClick={() => setBookmarked(!bookmarked)}
            className={`p-2 rounded-lg transition-colors ${
              bookmarked ? 'text-blue-600 bg-blue-50' : 'hover:bg-muted'
            }`}
          >
            <Bookmark className={`w-5 h-5 ${bookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
