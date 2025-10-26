import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Logo } from './Logo';

interface NoInternetProps {
  onRetry: () => void;
}

export function NoInternet({ onRetry }: NoInternetProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <Logo className="w-32 h-32 opacity-50" />
        </div>

        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/20 rounded-full blur-2xl animate-pulse" />
            <div className="relative bg-card border-2 border-red-500 rounded-full p-8">
              <WifiOff className="w-16 h-16 text-red-500" />
            </div>
          </div>
        </div>

        <h1 className="mb-3">No Internet Connection</h1>
        
        <p className="text-muted-foreground mb-6">
          Oops! Looks like you're offline. Please check your internet connection and try again.
        </p>

        <div className="space-y-3">
          <Button
            onClick={onRetry}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl h-12 gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </Button>

          <div className="text-sm text-muted-foreground">
            <p className="mb-2">Troubleshooting tips:</p>
            <ul className="text-left space-y-1 text-xs">
              <li>• Check your WiFi or mobile data connection</li>
              <li>• Make sure airplane mode is off</li>
              <li>• Restart your router if needed</li>
              <li>• Contact your service provider if issues persist</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Your data will be synced once connection is restored
          </p>
        </div>
      </div>
    </div>
  );
}
