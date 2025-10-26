import { X, Image, Smile, Calendar, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { useState } from 'react';

interface ComposeTweetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ComposeTweet({ isOpen, onClose }: ComposeTweetProps) {
  const [content, setContent] = useState('');
  const maxLength = 280;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <DialogTitle className="sr-only">Compose Tweet</DialogTitle>
        <DialogDescription className="sr-only">
          Create a new post to share with your followers
        </DialogDescription>
        <DialogHeader className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
            <Button
              disabled={content.length === 0 || content.length > maxLength}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4"
            >
              Post
            </Button>
          </div>
        </DialogHeader>

        <div className="p-4">
          <div className="flex gap-3">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
              <img
                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NjEyNDQyMzZ8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="User"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Input */}
            <div className="flex-1">
              <Textarea
                placeholder="What is happening?!"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="border-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 min-h-[120px] text-xl"
              />

              <div className="mt-4 pt-4 border-t border-gray-200">
                {/* Options */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button className="p-2 rounded-full hover:bg-blue-50 text-blue-500">
                      <Image className="w-5 h-5" />
                    </button>
                    <button className="p-2 rounded-full hover:bg-blue-50 text-blue-500">
                      <Smile className="w-5 h-5" />
                    </button>
                    <button className="p-2 rounded-full hover:bg-blue-50 text-blue-500">
                      <Calendar className="w-5 h-5" />
                    </button>
                    <button className="p-2 rounded-full hover:bg-blue-50 text-blue-500">
                      <MapPin className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-sm text-gray-500">
                      {content.length}/{maxLength}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
