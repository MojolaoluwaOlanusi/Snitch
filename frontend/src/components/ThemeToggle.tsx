import { Moon, Sun, EyeOff } from 'lucide-react';
import { Button } from './ui/button';

interface ThemeToggleProps {
  theme: 'light' | 'dark' | 'incognito';
  onThemeChange: (theme: 'light' | 'dark' | 'incognito') => void;
}

export function ThemeToggle({ theme, onThemeChange }: ThemeToggleProps) {
  const getNextTheme = () => {
    if (theme === 'light') return 'dark';
    if (theme === 'dark') return 'incognito';
    return 'light';
  };

  const getIcon = () => {
    if (theme === 'light') return <Sun className="w-5 h-5" />;
    if (theme === 'dark') return <Moon className="w-5 h-5" />;
    return <EyeOff className="w-5 h-5" />;
  };

  const getLabel = () => {
    if (theme === 'light') return 'Light Mode';
    if (theme === 'dark') return 'Dark Mode';
    return 'Incognito Mode';
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onThemeChange(getNextTheme())}
      className="gap-2"
      title={getLabel()}
    >
      {getIcon()}
      <span className="hidden lg:inline">{getLabel()}</span>
    </Button>
  );
}
