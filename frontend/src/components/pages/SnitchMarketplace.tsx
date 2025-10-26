import { Search, MapPin, DollarSign, Heart } from 'lucide-react';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface SnitchMarketplaceProps {
  theme: 'light' | 'dark' | 'incognito';
}

export function SnitchMarketplace({ theme }: SnitchMarketplaceProps) {
  const listings = [
    {
      id: '1',
      title: 'iPhone 15 Pro - Like New',
      price: 999,
      location: 'San Francisco, CA',
      image: 'https://images.unsplash.com/photo-1623715537851-8bc15aa8c145?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwd29ya3NwYWNlfGVufDF8fHx8MTc2MTE3NTc2MHww&ixlib=rb-4.1.0&q=80&w=1080',
      seller: 'Sarah J.',
      condition: 'Like New',
    },
    {
      id: '2',
      title: 'Vintage Leather Jacket',
      price: 150,
      location: 'New York, NY',
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwc3R5bGV8ZW58MXx8fHwxNzYxMTcxNTI3fDA&ixlib=rb-4.1.0&q=80&w=1080',
      seller: 'Fashion Hub',
      condition: 'Good',
    },
    {
      id: '3',
      title: 'Mountain Bike - Excellent Condition',
      price: 450,
      location: 'Los Angeles, CA',
      image: 'https://images.unsplash.com/photo-1528543606781-2f6e6857f318?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmF2ZWwlMjBhZHZlbnR1cmV8ZW58MXx8fHwxNzYxMjQ3MjA4fDA&ixlib=rb-4.1.0&q=80&w=1080',
      seller: 'Mike D.',
      condition: 'Excellent',
    },
    {
      id: '4',
      title: 'Home Gym Equipment Set',
      price: 300,
      location: 'Chicago, IL',
      image: 'https://images.unsplash.com/photo-1618688862225-ac941a9da58f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwd29ya291dHxlbnwxfHx8fDE3NjEyNDMwNTh8MA&ixlib=rb-4.1.0&q=80&w=1080',
      seller: 'Fitness Pro',
      condition: 'Good',
    },
    {
      id: '5',
      title: 'Dining Table Set (6 Chairs)',
      price: 350,
      location: 'Austin, TX',
      image: 'https://images.unsplash.com/photo-1532980400857-e8d9d275d858?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb29kJTIwcGhvdG9ncmFwaHl8ZW58MXx8fHwxNzYxMjU3Njc1fDA&ixlib=rb-4.1.0&q=80&w=1080',
      seller: 'Home Decor',
      condition: 'Like New',
    },
    {
      id: '6',
      title: 'Designer Handbag - Authentic',
      price: 580,
      location: 'Miami, FL',
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwc3R5bGV8ZW58MXx8fHwxNzYxMTcxNTI3fDA&ixlib=rb-4.1.0&q=80&w=1080',
      seller: 'Luxury Items',
      condition: 'Excellent',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="mb-4">Marketplace</h1>
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search marketplace..."
              className="pl-12 bg-card border-border rounded-xl h-12"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="w-full h-auto p-0 bg-transparent border-b border-border rounded-none mb-6">
            <TabsTrigger
              value="browse"
              className={`flex-1 rounded-none data-[state=active]:bg-transparent py-3 ${
                theme === 'incognito'
                  ? 'data-[state=active]:border-b-4 data-[state=active]:border-red-600'
                  : 'data-[state=active]:border-b-4 data-[state=active]:border-blue-600'
              }`}
            >
              Browse All
            </TabsTrigger>
            <TabsTrigger
              value="vehicles"
              className={`flex-1 rounded-none data-[state=active]:bg-transparent py-3 ${
                theme === 'incognito'
                  ? 'data-[state=active]:border-b-4 data-[state=active]:border-red-600'
                  : 'data-[state=active]:border-b-4 data-[state=active]:border-blue-600'
              }`}
            >
              Vehicles
            </TabsTrigger>
            <TabsTrigger
              value="electronics"
              className={`flex-1 rounded-none data-[state=active]:bg-transparent py-3 ${
                theme === 'incognito'
                  ? 'data-[state=active]:border-b-4 data-[state=active]:border-red-600'
                  : 'data-[state=active]:border-b-4 data-[state=active]:border-blue-600'
              }`}
            >
              Electronics
            </TabsTrigger>
            <TabsTrigger
              value="home"
              className={`flex-1 rounded-none data-[state=active]:bg-transparent py-3 ${
                theme === 'incognito'
                  ? 'data-[state=active]:border-b-4 data-[state=active]:border-red-600'
                  : 'data-[state=active]:border-b-4 data-[state=active]:border-blue-600'
              }`}
            >
              Home & Garden
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((item) => (
                <div key={item.id} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer">
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <button className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors">
                      <Heart className="w-5 h-5" />
                    </button>
                    <div className={`absolute bottom-3 left-3 px-3 py-1 rounded-full text-white text-sm ${
                      theme === 'incognito' ? 'bg-red-600' : 'bg-blue-600'
                    }`}>
                      {item.condition}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className={`flex items-center gap-2 mb-2 ${
                      theme === 'incognito' ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      <DollarSign className="w-5 h-5" />
                      <span className="text-2xl font-bold">{item.price}</span>
                    </div>
                    <h3 className="mb-2 line-clamp-1">{item.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <MapPin className="w-4 h-4" />
                      <span>{item.location}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Sold by {item.seller}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="vehicles" className="mt-0">
            <div className="text-center py-12 text-muted-foreground">
              <p>No vehicle listings at the moment</p>
            </div>
          </TabsContent>

          <TabsContent value="electronics" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.slice(0, 1).map((item) => (
                <div key={item.id} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer">
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <button className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors">
                      <Heart className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-4">
                    <div className={`flex items-center gap-2 mb-2 ${
                      theme === 'incognito' ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      <DollarSign className="w-5 h-5" />
                      <span className="text-2xl font-bold">{item.price}</span>
                    </div>
                    <h3 className="mb-2">{item.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{item.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="home" className="mt-0">
            <div className="text-center py-12 text-muted-foreground">
              <p>No home & garden listings at the moment</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
