import { Settings, Mail, Search, MoreHorizontal, ImageIcon, Smile, Info } from 'lucide-react';
import { Input } from '../ui/input';
import { useState } from 'react';
import { Textarea } from '../ui/textarea';

export function Messages() {
  const [selectedChat, setSelectedChat] = useState<string | null>('1');
  const [messageInput, setMessageInput] = useState('');

  const conversations = [
    {
      id: '1',
      user: {
        name: 'Sarah Johnson',
        handle: '@sarahj',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHBlcnNvbnxlbnwxfHx8fDE3NjExNzc4NDd8MA&ixlib=rb-4.1.0&q=80&w=1080',
      },
      lastMessage: 'Thanks for the update! Looking forward to it.',
      timestamp: '2h',
      unread: true,
    },
    {
      id: '2',
      user: {
        name: 'Tech News',
        handle: '@technews',
        avatar: 'https://images.unsplash.com/photo-1623715537851-8bc15aa8c145?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwd29ya3NwYWNlfGVufDF8fHx8MTc2MTE3NTc2MHww&ixlib=rb-4.1.0&q=80&w=1080',
      },
      lastMessage: 'Check out our latest article!',
      timestamp: '1d',
      unread: false,
    },
    {
      id: '3',
      user: {
        name: 'Design Tips',
        handle: '@designtips',
        avatar: 'https://images.unsplash.com/photo-1669038045897-3869080bf458?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGFydHxlbnwxfHx8fDE3NjExNDg4OTl8MA&ixlib=rb-4.1.0&q=80&w=1080',
      },
      lastMessage: 'Would love to collaborate!',
      timestamp: '2d',
      unread: false,
    },
  ];

  const messages = [
    {
      id: '1',
      senderId: '1',
      text: 'Hey! How are you doing?',
      timestamp: '10:30 AM',
    },
    {
      id: '2',
      senderId: 'me',
      text: 'Hey Sarah! I\'m doing great, thanks for asking. How about you?',
      timestamp: '10:32 AM',
    },
    {
      id: '3',
      senderId: '1',
      text: 'I\'m doing well! Just wanted to check in about the project.',
      timestamp: '10:35 AM',
    },
    {
      id: '4',
      senderId: 'me',
      text: 'Sure! We\'re making great progress. Should have an update for you by end of week.',
      timestamp: '10:36 AM',
    },
    {
      id: '5',
      senderId: '1',
      text: 'Thanks for the update! Looking forward to it.',
      timestamp: '10:38 AM',
    },
  ];

  return (
    <div className="flex-1 flex">
      {/* Conversations List */}
      <div className="w-96 border-r border-gray-200">
        <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
          <div className="flex items-center justify-between p-4">
            <h1>Messages</h1>
            <div className="flex gap-2">
              <button className="p-2 rounded-full hover:bg-gray-100">
                <Settings className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100">
                <Mail className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <Input
                placeholder="Search Direct Messages"
                className="pl-12 bg-gray-100 border-0 rounded-full"
              />
            </div>
          </div>
        </div>

        <div>
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedChat(conv.id)}
              className={`w-full p-4 border-b border-gray-200 hover:bg-gray-50 text-left ${
                selectedChat === conv.id ? 'bg-gray-100' : ''
              }`}
            >
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
                  <img
                    src={conv.user.avatar}
                    alt={conv.user.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate">{conv.user.name}</span>
                      <span className="text-gray-500 truncate">
                        {conv.user.handle}
                      </span>
                    </div>
                    <span className="text-gray-500 text-sm flex-shrink-0 ml-2">
                      {conv.timestamp}
                    </span>
                  </div>
                  <div
                    className={`truncate ${
                      conv.unread ? '' : 'text-gray-500'
                    }`}
                  >
                    {conv.lastMessage}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
                  <img
                    src={conversations.find((c) => c.id === selectedChat)?.user.avatar}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div>
                    {conversations.find((c) => c.id === selectedChat)?.user.name}
                  </div>
                  <div className="text-gray-500 text-sm">
                    {conversations.find((c) => c.id === selectedChat)?.user.handle}
                  </div>
                </div>
              </div>
              <button className="p-2 rounded-full hover:bg-gray-100">
                <Info className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.senderId === 'me' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-sm ${
                    message.senderId === 'me'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200'
                  } rounded-3xl px-4 py-2`}
                >
                  <p>{message.text}</p>
                  <div
                    className={`text-xs mt-1 ${
                      message.senderId === 'me' ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <Textarea
                  placeholder="Start a new message"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="resize-none pr-20 rounded-3xl"
                  rows={1}
                />
                <div className="absolute right-3 bottom-3 flex gap-1">
                  <button className="p-2 rounded-full hover:bg-blue-50 text-blue-500">
                    <ImageIcon className="w-5 h-5" />
                  </button>
                  <button className="p-2 rounded-full hover:bg-blue-50 text-blue-500">
                    <Smile className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm">
            <h2 className="mb-2">Select a message</h2>
            <p className="text-gray-500 mb-4">
              Choose from your existing conversations, start a new one, or just keep
              swimming.
            </p>
            <button className="bg-blue-500 text-white px-6 py-3 rounded-full hover:bg-blue-600">
              New message
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
