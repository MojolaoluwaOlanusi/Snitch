import { Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Badge } from './ui/badge';

interface AccountStatusBadgeProps {
  status: 'good' | 'moderate' | 'banned';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function AccountStatusBadge({ status, showLabel = true, size = 'md' }: AccountStatusBadgeProps) {
  const config = {
    good: {
      icon: CheckCircle2,
      color: 'bg-green-100 text-green-700 border-green-500',
      label: 'Good Standing',
      tooltip: 'Account is in good standing',
    },
    moderate: {
      icon: AlertTriangle,
      color: 'bg-yellow-100 text-yellow-700 border-yellow-500',
      label: 'Warning',
      tooltip: 'Account has received warnings',
    },
    banned: {
      icon: Shield,
      color: 'bg-red-100 text-red-700 border-red-500',
      label: 'Suspended',
      tooltip: 'Account is suspended',
    },
  };

  const { icon: Icon, color, label, tooltip } = config[status];

  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const textSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <Badge
      variant="outline"
      className={`flex items-center gap-1 border-2 ${color} ${textSize[size]}`}
      title={tooltip}
    >
      <Icon className={iconSize[size]} />
      {showLabel && <span>{label}</span>}
    </Badge>
  );
}
