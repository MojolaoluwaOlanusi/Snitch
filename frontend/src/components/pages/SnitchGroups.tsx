import { Users, Lock, Globe, TrendingUp } from 'lucide-react';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface SnitchGroupsProps {
  theme: 'light' | 'dark' | 'incognito';
}

export function SnitchGroups({ theme }: SnitchGroupsProps) {
  const groups = [
    {
      id: '1',
      name: 'Tech Enthusiasts',
      description: 'A community for people passionate about technology and innovation',
      members: 12500,
      posts: '234 posts today',
      cover: 'https://images.unsplash.com/photo-1623715537851-8bc15aa8c145?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwd29ya3NwYWNlfGVufDF8fHx8MTc2MTE3NTc2MHww&ixlib=rb-4.1.0&q=80&w=1080',
      isPublic: true,
      isMember: false,
    },
    {
      id: '2',
      name: 'Design Hub',
      description: 'Share and discuss amazing designs, get feedback on your work',
      members: 8900,
      posts: '156 posts today',
      cover: 'https://images.unsplash.com/photo-1669038045897-3869080bf458?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGFydHxlbnwxfHx8fDE3NjExNDg4OTl8MA&ixlib=rb-4.1.0&q=80&w=1080',
      isPublic: true,
      isMember: true,
    },
    {
      id: '3',
      name: 'Travel Lovers',
      description: 'Share your travel experiences and discover new destinations',
      members: 15600,
      posts: '345 posts today',
      cover: 'https://images.unsplash.com/photo-1528543606781-2f6e6857f318?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmF2ZWwlMjBhZHZlbnR1cmV8ZW58MXx8fHwxNzYxMjQ3MjA4fDA&ixlib=rb-4.1.0&q=80&w=1080',
      isPublic: false,
      isMember: false,
    },
    {
      id: '4',
      name: 'Fitness Community',
      description: 'Motivate each other to reach fitness goals and share workout tips',
      members: 20100,
      posts: '567 posts today',
      cover: 'https://images.unsplash.com/photo-1618688862225-ac941a9da58f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwd29ya291dHxlbnwxfHx8fDE3NjEyNDMwNTh8MA&ixlib=rb-4.1.0&q=80&w=1080',
      isPublic: true,
      isMember: true,
    },
  ];

  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="mb-2">Groups</h1>
          <p className="text-muted-foreground">Connect with people who share your interests</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="discover" className="w-full">
          <TabsList className="w-full h-auto p-0 bg-transparent border-b border-border rounded-none mb-6">
            <TabsTrigger
              value="discover"
              className={`flex-1 rounded-none data-[state=active]:bg-transparent py-3 ${
                theme === 'incognito'
                  ? 'data-[state=active]:border-b-4 data-[state=active]:border-red-600'
                  : 'data-[state=active]:border-b-4 data-[state=active]:border-blue-600'
              }`}
            >
              Discover
            </TabsTrigger>
            <TabsTrigger
              value="your"
              className={`flex-1 rounded-none data-[state=active]:bg-transparent py-3 ${
                theme === 'incognito'
                  ? 'data-[state=active]:border-b-4 data-[state=active]:border-red-600'
                  : 'data-[state=active]:border-b-4 data-[state=active]:border-blue-600'
              }`}
            >
              Your Groups
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups.map((group) => (
                <div key={group.id} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-32 overflow-hidden">
                    <img src={group.cover} alt={group.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="mb-1">{group.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          {group.isPublic ? (
                            <>
                              <Globe className="w-4 h-4" />
                              <span>Public Group</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4" />
                              <span>Private Group</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{group.description}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{formatNumber(group.members)} members</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        <span>{group.posts}</span>
                      </div>
                    </div>
                    <Button
                      className={`w-full ${
                        group.isMember
                          ? 'bg-muted text-foreground hover:bg-muted/80'
                          : theme === 'incognito'
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      } rounded-xl`}
                    >
                      {group.isMember ? 'Joined' : 'Join Group'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="your" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups
                .filter((g) => g.isMember)
                .map((group) => (
                  <div key={group.id} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="h-32 overflow-hidden">
                      <img src={group.cover} alt={group.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-4">
                      <h3 className="mb-2">{group.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{group.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{formatNumber(group.members)} members</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          <span>{group.posts}</span>
                        </div>
                      </div>
                      <Button
                        className={`w-full ${
                          theme === 'incognito'
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        } rounded-xl`}
                      >
                        View Group
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
