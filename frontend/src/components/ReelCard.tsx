import { Heart, MessageCircle, Send, Bookmark, MoreVertical, Volume2 } from 'lucide-react';

interface ReelCardProps {
  video: {
    thumbnail: string;
    views: string;
  };
  author: {
    name: string;
    avatar: string;
  };
  caption: string;
}

export function ReelCard({ video, author, caption }: ReelCardProps) {
  return (
    <div className="relative aspect-[9/16] bg-black rounded-xl overflow-hidden group cursor-pointer">
      <img
        src={video.thumbnail}
        alt=""
        className="w-full h-full object-cover"
      />
      
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />
      
      {/* Play indicator */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-16 h-16 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
          <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-white border-b-8 border-b-transparent ml-1" />
        </div>
      </div>

      {/* Views count */}
      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm">
        {video.views} views
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-end justify-between">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white">
                <img src={author.avatar} alt={author.name} className="w-full h-full object-cover" />
              </div>
              <span className="text-white text-sm font-semibold">{author.name}</span>
            </div>
            <p className="text-white text-sm line-clamp-2">{caption}</p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 items-center">
            <button className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform">
              <Heart className="w-7 h-7" />
              <span className="text-xs">1.2K</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform">
              <MessageCircle className="w-7 h-7" />
              <span className="text-xs">89</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform">
              <Send className="w-7 h-7" />
              <span className="text-xs">Share</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform">
              <MoreVertical className="w-7 h-7" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
