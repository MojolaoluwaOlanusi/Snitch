import { ReelCard } from '../ReelCard';

export function SnitchReels() {
  const reels = [
    {
      video: {
        thumbnail: 'https://images.unsplash.com/photo-1730875648117-ff32ae9b98c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmllbmRzJTIwc29jaWFsJTIwZ2F0aGVyaW5nfGVufDF8fHx8MTc2MTI5ODc4NHww&ixlib=rb-4.1.0&q=80&w=1080',
        views: '1.2M',
      },
      author: {
        name: 'Sarah Johnson',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHBlcnNvbnxlbnwxfHx8fDE3NjExNzc4NDd8MA&ixlib=rb-4.1.0&q=80&w=1080',
      },
      caption: 'Best night out with friends! 🎉 #FriendshipGoals #NightOut',
    },
    {
      video: {
        thumbnail: 'https://images.unsplash.com/photo-1532980400857-e8d9d275d858?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb29kJTIwcGhvdG9ncmFwaHl8ZW58MXx8fHwxNzYxMjU3Njc1fDA&ixlib=rb-4.1.0&q=80&w=1080',
        views: '890K',
      },
      author: {
        name: 'Food Lover',
        avatar: 'https://images.unsplash.com/photo-1532980400857-e8d9d275d858?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb29kJTIwcGhvdG9ncmFwaHl8ZW58MXx8fHwxNzYxMjU3Njc1fDA&ixlib=rb-4.1.0&q=80&w=1080',
      },
      caption: 'Making the perfect pasta! 🍝 Recipe in bio #Cooking #FoodPorn',
    },
    {
      video: {
        thumbnail: 'https://images.unsplash.com/photo-1528543606781-2f6e6857f318?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmF2ZWwlMjBhZHZlbnR1cmV8ZW58MXx8fHwxNzYxMjQ3MjA4fDA&ixlib=rb-4.1.0&q=80&w=1080',
        views: '2.5M',
      },
      author: {
        name: 'Travel Tales',
        avatar: 'https://images.unsplash.com/photo-1528543606781-2f6e6857f318?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmF2ZWwlMjBhZHZlbnR1cmV8ZW58MXx8fHwxNzYxMjQ3MjA4fDA&ixlib=rb-4.1.0&q=80&w=1080',
      },
      caption: 'Hiking through paradise 🏔️ #Travel #Adventure #Nature',
    },
    {
      video: {
        thumbnail: 'https://images.unsplash.com/photo-1618688862225-ac941a9da58f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwd29ya291dHxlbnwxfHx8fDE3NjEyNDMwNTh8MA&ixlib=rb-4.1.0&q=80&w=1080',
        views: '1.8M',
      },
      author: {
        name: 'Fitness Pro',
        avatar: 'https://images.unsplash.com/photo-1618688862225-ac941a9da58f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwd29ya291dHxlbnwxfHx8fDE3NjEyNDMwNTh8MA&ixlib=rb-4.1.0&q=80&w=1080',
      },
      caption: '30-minute HIIT workout 💪 Follow along! #Fitness #Workout',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {reels.map((reel, idx) => (
            <ReelCard key={idx} {...reel} />
          ))}
        </div>
      </div>
    </div>
  );
}
