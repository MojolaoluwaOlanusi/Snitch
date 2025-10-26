import { Plus } from 'lucide-react';

interface StoryCardProps {
  user: {
    name: string;
    avatar: string;
  };
  image: string;
  isOwn?: boolean;
}

export function StoryCard({ user, image, isOwn }: StoryCardProps) {
  return (
    <button className="relative flex-shrink-0 w-28 h-40 rounded-xl overflow-hidden group">
      <img
        src={image}
        alt={user.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
      
      {isOwn ? (
        <>
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center border-4 border-white">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <div className="absolute bottom-2 left-0 right-0 text-center">
            <span className="text-white text-sm">Create Story</span>
          </div>
        </>
      ) : (
        <>
          <div className="absolute top-3 left-3 w-10 h-10 rounded-full border-4 border-blue-600 overflow-hidden">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute bottom-2 left-2 right-2">
            <span className="text-white text-sm line-clamp-2">{user.name}</span>
          </div>
        </>
      )}
    </button>
  );
}
