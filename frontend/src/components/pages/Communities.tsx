import { Users, Search } from 'lucide-react';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';

export function Communities() {
  const communities = [
    {
      id: '1',
      name: 'Tech Enthusiasts',
      description: 'A community for people passionate about technology',
      members: 12500,
      banner: 'https://images.unsplash.com/photo-1623715537851-8bc15aa8c145?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwd29ya3NwYWNlfGVufDF8fHx8MTc2MTE3NTc2MHww&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      id: '2',
      name: 'Design Lovers',
      description: 'Share and discuss amazing designs',
      members: 8900,
      banner: 'https://images.unsplash.com/photo-1669038045897-3869080bf458?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGFydHxlbnwxfHx8fDE3NjExNDg4OTl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      id: '3',
      name: 'Nature Photography',
      description: 'Beautiful photos from around the world',
      members: 15600,
      banner: 'https://images.unsplash.com/photo-1617634667039-8e4cb277ab46?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYXR1cmUlMjBsYW5kc2NhcGV8ZW58MXx8fHwxNzYxMTcyNDI5fDA&ixlib=rb-4.1.0&q=80&w=1080',
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
        <div className="p-4">
          <h1 className="mb-4">Communities</h1>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              placeholder="Search communities"
              className="pl-12 bg-gray-100 border-0 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="discover" className="w-full">
        <TabsList className="w-full h-auto p-0 bg-transparent border-b border-gray-200 rounded-none">
          <TabsTrigger
            value="discover"
            className="flex-1 rounded-none data-[state=active]:border-b-4 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent py-4"
          >
            Discover
          </TabsTrigger>
          <TabsTrigger
            value="your"
            className="flex-1 rounded-none data-[state=active]:border-b-4 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent py-4"
          >
            Your Communities
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="mt-0">
          <div className="p-6">
            {communities.map((community) => (
              <div
                key={community.id}
                className="mb-6 border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 transition-colors"
              >
                <div className="h-32 bg-gray-300 overflow-hidden">
                  <img
                    src={community.banner}
                    alt={community.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-16 h-16 rounded-full bg-gray-200 border-4 border-white -mt-8 flex items-center justify-center">
                      <Users className="w-8 h-8 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0 mt-2">
                      <h3 className="mb-1">{community.name}</h3>
                      <div className="text-gray-500 text-sm">
                        {formatNumber(community.members)} Members
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">{community.description}</p>
                  <Button className="w-full bg-black hover:bg-gray-800 text-white rounded-full">
                    Join
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="your" className="mt-0">
          <div className="p-8 text-center">
            <div className="max-w-sm mx-auto">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Users className="w-12 h-12 text-gray-400" />
              </div>
              <h2 className="mb-2">Join a Community</h2>
              <p className="text-gray-500 mb-4">
                Communities are groups of people on X who share common interests. Find
                and join communities to connect with people like you.
              </p>
              <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-6">
                Discover Communities
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
