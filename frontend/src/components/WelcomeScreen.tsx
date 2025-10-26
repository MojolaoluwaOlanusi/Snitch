import { Logo } from './Logo';
import { Button } from './ui/button';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500 flex items-center justify-center p-6">
      <div className="max-w-2xl text-center">
        <div className="mb-8 flex justify-center animate-fade-in">
          <Logo className="w-64 h-64" />
        </div>
        
        <h1 className="text-6xl text-white mb-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          Welcome to Snitch
        </h1>
        
        <p className="text-xl text-blue-100 mb-8 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          Connect, Share, and Discover with the world's most feature-rich social platform
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <Button
            onClick={onGetStarted}
            className="bg-white text-blue-700 hover:bg-blue-50 rounded-xl px-8 py-6 text-lg shadow-2xl"
          >
            Get Started
          </Button>
          <Button
            variant="outline"
            className="border-2 border-white text-white hover:bg-white/10 rounded-xl px-8 py-6 text-lg"
          >
            Learn More
          </Button>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-8 text-white animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
          <div>
            <div className="text-4xl mb-2">📱</div>
            <div className="text-sm opacity-90">Social Posts</div>
          </div>
          <div>
            <div className="text-4xl mb-2">🎥</div>
            <div className="text-sm opacity-90">Reels & Videos</div>
          </div>
          <div>
            <div className="text-4xl mb-2">🛍️</div>
            <div className="text-sm opacity-90">Marketplace</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
