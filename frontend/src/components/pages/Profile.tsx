import { ArrowLeft, Calendar, Link as LinkIcon, MapPin, MoreHorizontal, Briefcase, User, Building, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { TweetCard } from '../TweetCard';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface ProfileProps {
  onTweetClick: (tweetId: string) => void;
  onBack?: () => void;
  accountType?: 'personal' | 'business' | 'work';
  accountStatus?: 'good' | 'moderate' | 'banned';
}

export function Profile({ onTweetClick, onBack, accountType = 'personal', accountStatus = 'good' }: ProfileProps) {
  const getAccountTypeIcon = () => {
    switch (accountType) {
      case 'business':
        return <Building className="w-4 h-4" />;
      case 'work':
        return <Briefcase className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getAccountTypeColor = () => {
    switch (accountType) {
      case 'business':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'work':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getAccountStatusConfig = () => {
    switch (accountStatus) {
      case 'good':
        return {
          icon: <CheckCircle2 className="w-4 h-4" />,
          color: 'bg-green-100 text-green-700 border-green-500',
          label: 'Account in Good Standing',
        };
      case 'moderate':
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          color: 'bg-yellow-100 text-yellow-700 border-yellow-500',
          label: 'Account Warning',
        };
      case 'banned':
        return {
          icon: <Shield className="w-4 h-4" />,
          color: 'bg-red-100 text-red-700 border-red-500',
          label: 'Account Suspended',
        };
    }
  };

  const statusConfig = getAccountStatusConfig();
  const profileTweets = [
    {
      id: '1',
      author: {
        name: 'John Doe',
        handle: 'johndoe',
        avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NjEyNDQyMzZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
        verified: true,
      },
      content: 'Working on some exciting new features! Can\'t wait to share more soon 🚀',
      timestamp: '3h',
      stats: {
        replies: 45,
        retweets: 120,
        likes: 890,
        views: 12000,
      },
    },
    {
      id: '2',
      author: {
        name: 'John Doe',
        handle: 'johndoe',
        avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NjEyNDQyMzZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
        verified: true,
      },
      content: 'Just hit 10K followers! Thank you all for your support! 🎉',
      timestamp: '1d',
      stats: {
        replies: 234,
        retweets: 456,
        likes: 3400,
        views: 45000,
      },
    },
  ];

  return (
    <div className="flex-1 border-r border-gray-200">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-10">
        <div className="flex items-center gap-8 p-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-full hover:bg-gray-100 -ml-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1>John Doe</h1>
            <div className="text-gray-500 text-sm">1,234 posts</div>
          </div>
        </div>
      </div>

      {/* Profile Header */}
      <div>
        {/* Cover Photo */}
        <div className="h-48 bg-gray-300 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1493134799591-2c9eed26201a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwc2t5bGluZXxlbnwxfHx8fDE3NjExMzkzMDN8MA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Cover"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="px-4 pb-4">
          {/* Profile Picture and Actions */}
          <div className="flex justify-between items-start -mt-16 mb-4">
            <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-300 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NjEyNDQyMzZ8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex gap-2 mt-3">
              <button className="p-2 rounded-full border border-gray-300 hover:bg-gray-100">
                <MoreHorizontal className="w-5 h-5" />
              </button>
              <Button className="rounded-full px-4 border border-gray-300 hover:bg-gray-100 bg-white text-black">
                Edit profile
              </Button>
            </div>
          </div>

          {/* Profile Info */}
          <div className="mb-4">
            <div className="flex items-center gap-1 mb-1">
              <h2>John Doe</h2>
              <svg viewBox="0 0 22 22" className="w-6 h-6 text-blue-500" fill="currentColor">
                <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
              </svg>
            </div>
            <div className="text-gray-500 mb-3">@johndoe</div>
            
            {/* Account Type and Status Badges */}
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className={`flex items-center gap-1 ${getAccountTypeColor()}`}>
                {getAccountTypeIcon()}
                <span className="capitalize">{accountType}</span>
              </Badge>
              <Badge variant="outline" className={`flex items-center gap-1 border-2 ${statusConfig.color}`}>
                {statusConfig.icon}
                <span>{statusConfig.label}</span>
              </Badge>
            </div>
            <p className="mb-3">
              Product Designer & Developer | Building amazing things | Sharing thoughts on tech, design, and life
            </p>
            <div className="flex flex-wrap gap-4 text-gray-500 mb-3">
              <div className="flex items-center gap-1">
                <MapPin className="w-5 h-5" />
                <span>San Francisco, CA</span>
              </div>
              <div className="flex items-center gap-1">
                <LinkIcon className="w-5 h-5" />
                <a href="#" className="text-blue-500 hover:underline">
                  johndoe.com
                </a>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-5 h-5" />
                <span>Joined March 2020</span>
              </div>
            </div>
            <div className="flex gap-4">
              <button className="hover:underline">
                <span>456</span>{' '}
                <span className="text-gray-500">Following</span>
              </button>
              <button className="hover:underline">
                <span>10.2K</span>{' '}
                <span className="text-gray-500">Followers</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="w-full h-auto p-0 bg-transparent border-b border-gray-200 rounded-none">
          <TabsTrigger
            value="posts"
            className="flex-1 rounded-none data-[state=active]:border-b-4 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent py-4"
          >
            Posts
          </TabsTrigger>
          <TabsTrigger
            value="replies"
            className="flex-1 rounded-none data-[state=active]:border-b-4 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent py-4"
          >
            Replies
          </TabsTrigger>
          <TabsTrigger
            value="media"
            className="flex-1 rounded-none data-[state=active]:border-b-4 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent py-4"
          >
            Media
          </TabsTrigger>
          <TabsTrigger
            value="likes"
            className="flex-1 rounded-none data-[state=active]:border-b-4 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent py-4"
          >
            Likes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-0">
          {profileTweets.map((tweet) => (
            <TweetCard
              key={tweet.id}
              {...tweet}
              onClick={() => onTweetClick(tweet.id)}
            />
          ))}
        </TabsContent>

        <TabsContent value="replies" className="mt-0">
          <div className="p-8 text-center text-gray-500">
            <p>No replies yet</p>
          </div>
        </TabsContent>

        <TabsContent value="media" className="mt-0">
          <div className="p-8 text-center text-gray-500">
            <p>No media posts yet</p>
          </div>
        </TabsContent>

        <TabsContent value="likes" className="mt-0">
          <div className="p-8 text-center text-gray-500">
            <p>No liked posts yet</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
