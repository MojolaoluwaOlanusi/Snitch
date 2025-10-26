import { List, Pin, Lock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';

export function Lists() {
  const lists = [
    {
      id: '1',
      name: 'Tech Leaders',
      description: 'Influential people in tech',
      members: 45,
      isPinned: true,
      isPrivate: false,
    },
    {
      id: '2',
      name: 'Design Inspiration',
      description: 'Amazing designers and their work',
      members: 67,
      isPinned: false,
      isPrivate: true,
    },
    {
      id: '3',
      name: 'News Sources',
      description: 'Reliable news outlets',
      members: 23,
      isPinned: false,
      isPrivate: false,
    },
  ];

  return (
    <div className="flex-1 border-r border-gray-200">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-10">
        <div className="p-4">
          <h1>Lists</h1>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="your" className="w-full">
        <TabsList className="w-full h-auto p-0 bg-transparent border-b border-gray-200 rounded-none">
          <TabsTrigger
            value="your"
            className="flex-1 rounded-none data-[state=active]:border-b-4 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent py-4"
          >
            Your Lists
          </TabsTrigger>
          <TabsTrigger
            value="discover"
            className="flex-1 rounded-none data-[state=active]:border-b-4 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent py-4"
          >
            Discover
          </TabsTrigger>
        </TabsList>

        <TabsContent value="your" className="mt-0">
          <div className="p-4">
            <Button className="w-full mb-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full">
              Create a new List
            </Button>
            
            {lists.map((list) => (
              <button
                key={list.id}
                className="w-full p-4 border-b border-gray-200 hover:bg-gray-50 text-left"
              >
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded bg-gray-200 flex-shrink-0 flex items-center justify-center">
                    <List className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="truncate">{list.name}</h3>
                      {list.isPinned && <Pin className="w-4 h-4 text-gray-500" />}
                      {list.isPrivate && <Lock className="w-4 h-4 text-gray-500" />}
                    </div>
                    {list.description && (
                      <p className="text-gray-500 text-sm mb-1 truncate">
                        {list.description}
                      </p>
                    )}
                    <div className="text-gray-500 text-sm">
                      {list.members} members
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="discover" className="mt-0">
          <div className="p-8 text-center">
            <div className="max-w-sm mx-auto">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <List className="w-12 h-12 text-gray-400" />
              </div>
              <h2 className="mb-2">Discover new Lists</h2>
              <p className="text-gray-500">
                Lists are curated groups of accounts. You can create your own or
                subscribe to lists created by others.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
