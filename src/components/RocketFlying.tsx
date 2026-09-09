import React from 'react';
import { Flame, Rocket } from 'lucide-react';

interface RocketFlyingProps {
  className?: string;
}

export const RocketFlying: React.FC<RocketFlyingProps> = ({ className }) => (
  <span className={`relative inline-flex items-center justify-center shrink-0 ${className ?? ''}`}>
    <Flame
      className="absolute"
      fill="currentColor"
      strokeWidth={0}
      style={{
        width: '1.6em',
        height: '1.6em',
        left: '-45%',
        bottom: '-40%',
        transform: 'rotate(135deg)',
        color: '#ef4444',
        filter: 'drop-shadow(0 0 6px rgba(239,68,68,0.9))',
        animation: 'rocket-flame-flicker 0.35s ease-in-out infinite',
        transformOrigin: 'center',
        zIndex: 0,
      }}
    />
    <Flame
      className="absolute"
      fill="currentColor"
      strokeWidth={0}
      style={{
        width: '1.15em',
        height: '1.15em',
        left: '-30%',
        bottom: '-25%',
        transform: 'rotate(135deg)',
        color: '#f97316',
        filter: 'drop-shadow(0 0 4px rgba(249,115,22,0.9))',
        animation: 'rocket-flame-flicker 0.3s ease-in-out infinite reverse',
        transformOrigin: 'center',
        zIndex: 0,
      }}
    />
    <Flame
      className="absolute"
      fill="currentColor"
      strokeWidth={0}
      style={{
        width: '0.8em',
        height: '0.8em',
        left: '-16%',
        bottom: '-10%',
        transform: 'rotate(135deg)',
        color: '#fde047',
        filter: 'drop-shadow(0 0 4px rgba(253,224,71,0.9))',
        animation: 'rocket-flame-flicker 0.28s ease-in-out infinite alternate',
        transformOrigin: 'center',
        zIndex: 0,
      }}
    />
    <Rocket className="absolute w-full h-full" style={{ zIndex: 1 }} strokeWidth={2} />
  </span>
);