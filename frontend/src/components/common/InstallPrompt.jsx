import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import { SnitchLogoSmall } from '../svgs/snitch.jsx';

const InstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        // Check if already installed (standalone mode)
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Check if user already dismissed this session
        if (sessionStorage.getItem('install-prompt-dismissed') === 'true') {
            setIsDismissed(true);
            return;
        }

        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        window.addEventListener('appinstalled', () => {
            setIsInstalled(true);
            setIsVisible(false);
            toast.success('Snitch installed! 🎉');
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setIsInstalled(true);
            setIsVisible(false);
            toast.success('Snitch installed! 🎉');
        } else {
            toast.info('Installation declined');
        }

        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setIsDismissed(true);
        setIsVisible(false);
        sessionStorage.setItem('install-prompt-dismissed', 'true');
    };

    if (isInstalled || !isVisible || isDismissed) return null;

    // Detect mobile vs desktop
    const isMobile = window.innerWidth < 768;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:max-w-sm z-50 animate-slide-up">
            <div className="bg-base-100 rounded-2xl shadow-2xl border border-base-300 p-4 md:p-5">
                {/* Close button */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 p-1.5 hover:bg-base-200 rounded-full transition-colors"
                    aria-label="Dismiss install prompt"
                >
                    <X className="w-4 h-4 text-base-content/50 hover:text-base-content" />
                </button>

                <div className="flex items-start gap-3">
                    {/* App Icon */}
                    <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shadow-sm">
                        <SnitchLogoSmall className="w-8 h-8 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base-content text-sm md:text-base">Install Snitch</h3>
                        <p className="text-xs text-base-content/60 mt-0.5">
                            Get the app for a faster, offline-ready experience.
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-base-content/40">
                            {isMobile ? (
                                <>
                                    <Smartphone className="w-3 h-3" />
                                    <span>Add to Home Screen</span>
                                </>
                            ) : (
                                <>
                                    <Monitor className="w-3 h-3" />
                                    <span>Install on Desktop</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 mt-3">
                    <button
                        onClick={handleInstall}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-content rounded-lg py-2 px-3 text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Install
                    </button>
                    <button
                        onClick={handleDismiss}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-base-200 text-base-content/70 rounded-lg py-2 px-3 text-sm font-medium hover:bg-base-300 transition-colors"
                    >
                        Not now
                    </button>
                </div>

                {/* Optional: 'Why install?' info */}
                <div className="mt-2 text-[10px] text-center text-base-content/30">
                    Install once, use anytime – no browser tab needed.
                </div>
            </div>
        </div>
    );
};

export default InstallPrompt;