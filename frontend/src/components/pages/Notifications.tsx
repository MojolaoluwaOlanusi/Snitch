import { Heart, Repeat2, User, AtSign } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

export function Notifications() {
  const notifications = [
    {
      id: '1',
      type: 'like',
      users: [
        {
          name: 'Sarah Johnson',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHBlcnNvbnxlbnwxfHx8fDE3NjExNzc4NDd8MA&ixlib=rb-4.1.0&q=80&w=1080',
        },
        {
          name: 'Tech News',
          avatar: 'https://images.unsplash.com/photo-1623715537851-8bc15aa8c145?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwd29ya3NwYWNlfGVufDF8fHx8MTc2MTE3NTc2MHww&ixlib=rb-4.1.0&q=80&w=1080',
        },
      ],
      content: 'Just launched our new product! 🚀',
      timestamp: '2h',
    },
    {
      id: '2',
      type: 'retweet',
      users: [
        {
          name: 'Design Tips',
          avatar: 'https://images.unsplash.com/photo-1669038045897-3869080bf458?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGFydHxlbnwxfHx8fDE3NjExNDg4OTl8MA&ixlib=rb-4.1.0&q=80&w=1080',
        },
      ],
      content: 'Amazing insights on UI design principles',
      timestamp: '5h',
    },
    {
      id: '3',
      type: 'follow',
      users: [
        {
          name: 'Alex Chen',
          handle: 'alexchen',
          avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NjEyNDQyMzZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
        },
      ],
      timestamp: '1d',
    },
    {
      id: '4',
      type: 'mention',
      users: [
        {
          name: 'City Explorer',
          handle: 'cityexplorer',
          avatar: 'https://images.unsplash.com/photo-1493134799591-2c9eed26201a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwc2t5bGluZXxlbnwxfHx8fDE3NjExMzkzMDN8MA&ixlib=rb-4.1.0&q=80&w=1080',
        },
      ],
      content: '@johndoe Check out this amazing view from the city!',
      timestamp: '2d',
    },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-8 h-8 text-pink-500 fill-pink-500" />;
      case 'retweet':
        return <Repeat2 className="w-8 h-8 text-green-500" />;
      case 'follow':
        return <User className="w-8 h-8 text-blue-500" />;
      case 'mention':
        return <AtSign className="w-8 h-8 text-blue-500" />;
      default:
        return null;
    }
  };

  const getMessage = (type: string, users: any[]) => {
    const names = users.map((u) => u.name).join(', ');
    switch (type) {
      case 'like':
        return `${names} liked your post`;
      case 'retweet':
        return `${names} reposted your post`;
      case 'follow':
        return `${names} followed you`;
      case 'mention':
        return `${names} mentioned you`;
      default:
        return '';
    }
  };

  return (
    <div className="flex-1 border-r border-gray-200">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-10">
        <div className="p-4">
          <h1>Notifications</h1>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full h-auto p-0 bg-transparent border-b border-gray-200 rounded-none">
          <TabsTrigger
            value="all"
            className="flex-1 rounded-none data-[state=active]:border-b-4 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent py-4"
          >
            All
          </TabsTrigger>
          <TabsTrigger
            value="verified"
            className="flex-1 rounded-none data-[state=active]:border-b-4 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent py-4"
          >
            Verified
          </TabsTrigger>
          <TabsTrigger
            value="mentions"
            className="flex-1 rounded-none data-[state=active]:border-b-4 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent py-4"
          >
            Mentions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
            >
              <div className="flex gap-3">
                <div className="w-8 flex-shrink-0">{getIcon(notification.type)}</div>
                <div className="flex-1">
                  <div className="flex gap-2 mb-2">
                    {notification.users.map((user, idx) => (
                      <div
                        key={idx}
                        className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden"
                      >
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mb-1">
                    {getMessage(notification.type, notification.users)}
                  </div>
                  {notification.content && (
                    <p className="text-gray-500">{notification.content}</p>
                  )}
                  <div className="text-gray-500 text-sm mt-1">
                    {notification.timestamp}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="verified" className="mt-0">
          {notifications.slice(0, 2).map((notification) => (
            <div
              key={notification.id}
              className="p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
            >
              <div className="flex gap-3">
                <div className="w-8 flex-shrink-0">{getIcon(notification.type)}</div>
                <div className="flex-1">
                  <div className="flex gap-2 mb-2">
                    {notification.users.map((user, idx) => (
                      <div
                        key={idx}
                        className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden"
                      >
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mb-1">
                    {getMessage(notification.type, notification.users)}
                  </div>
                  {notification.content && (
                    <p className="text-gray-500">{notification.content}</p>
                  )}
                  <div className="text-gray-500 text-sm mt-1">
                    {notification.timestamp}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="mentions" className="mt-0">
          {notifications
            .filter((n) => n.type === 'mention')
            .map((notification) => (
              <div
                key={notification.id}
                className="p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex gap-3">
                  <div className="w-8 flex-shrink-0">{getIcon(notification.type)}</div>
                  <div className="flex-1">
                    <div className="flex gap-2 mb-2">
                      {notification.users.map((user, idx) => (
                        <div
                          key={idx}
                          className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden"
                        >
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mb-1">
                      {getMessage(notification.type, notification.users)}
                    </div>
                    {notification.content && (
                      <p className="text-gray-500">{notification.content}</p>
                    )}
                    <div className="text-gray-500 text-sm mt-1">
                      {notification.timestamp}
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
