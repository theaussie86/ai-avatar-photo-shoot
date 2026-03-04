"use client";

import { Clock, Cog, Sparkles, Check, AlertCircle } from 'lucide-react';
import type { ImageStage } from '@/lib/schemas';

interface StageConfig {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  icon: typeof Clock;
  animated?: boolean;
}

const STAGE_CONFIG: Record<ImageStage | 'unknown', StageConfig> = {
  queued: {
    label: 'Queued',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    icon: Clock
  },
  processing: {
    label: 'Processing',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    icon: Cog,
    animated: true
  },
  generating: {
    label: 'Generating',
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    icon: Sparkles,
    animated: true
  },
  completed: {
    label: 'Complete',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    icon: Check
  },
  failed: {
    label: 'Failed',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    icon: AlertCircle
  },
  unknown: {
    label: 'Unknown',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    icon: Clock
  }
};

interface StageIndicatorProps {
  stage: ImageStage | 'unknown';
  compact?: boolean;
}

export function StageIndicator({ stage, compact = false }: StageIndicatorProps) {
  const config = STAGE_CONFIG[stage];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bgColor}`}>
      <Icon
        className={`w-4 h-4 ${config.textColor} ${config.animated ? 'animate-spin' : ''}`}
      />
      {!compact && (
        <span className={`text-sm font-medium ${config.textColor}`}>
          {config.label}
        </span>
      )}
    </div>
  );
}
