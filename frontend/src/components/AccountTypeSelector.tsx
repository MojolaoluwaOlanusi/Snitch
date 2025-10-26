import { User, Briefcase, Building } from 'lucide-react';
import { Button } from './ui/button';

interface AccountTypeSelectorProps {
  selected: 'personal' | 'business' | 'work';
  onSelect: (type: 'personal' | 'business' | 'work') => void;
}

export function AccountTypeSelector({ selected, onSelect }: AccountTypeSelectorProps) {
  const types = [
    {
      value: 'personal' as const,
      label: 'Personal',
      icon: User,
      description: 'For individual users',
      color: 'from-gray-500 to-gray-600',
      bgColor: 'hover:bg-gray-50',
    },
    {
      value: 'business' as const,
      label: 'Business',
      icon: Building,
      description: 'For companies & brands',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'hover:bg-purple-50',
    },
    {
      value: 'work' as const,
      label: 'Work',
      icon: Briefcase,
      description: 'For professional networking',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'hover:bg-blue-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {types.map((type) => {
        const Icon = type.icon;
        const isSelected = selected === type.value;
        
        return (
          <button
            key={type.value}
            onClick={() => onSelect(type.value)}
            className={`p-6 rounded-xl border-2 transition-all ${
              isSelected
                ? 'border-blue-600 bg-blue-50 shadow-lg scale-105'
                : 'border-border bg-card hover:shadow-md'
            } ${type.bgColor}`}
          >
            <div className={`w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br ${type.color} flex items-center justify-center`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="mb-2">{type.label}</h3>
            <p className="text-sm text-muted-foreground">{type.description}</p>
            {isSelected && (
              <div className="mt-4 text-sm text-blue-600 font-semibold">
                ✓ Selected
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
