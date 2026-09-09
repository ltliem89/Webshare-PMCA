import React from 'react';
import { Rocket } from 'lucide-react';

interface RocketFlyingProps {
  className?: string;
}

export const RocketFlying: React.FC<RocketFlyingProps> = ({ className }) => (
  <span className={`relative inline-flex items-center justify-center shrink-0 ${className ?? ''}`}>
    {/* Luồng lửa phụt ra phía sau (góc dưới-trái của tên lửa, kéo dài xuống dưới-trái) */}
    <svg
      viewBox="0 0 100 100"
      className="absolute"
      style={{
        left: '-75%',
        top: '60%',
        width: '90%',
        height: '90%',
        zIndex: 0,
        overflow: 'visible',
        filter: 'drop-shadow(0 2px 5px rgba(239,68,68,0.6))',
        transformOrigin: '100% 0%',
        animation: 'rocket-flame-burst 0.3s ease-in-out infinite',
      }}
    >
      <defs>
        <linearGradient id="rocket-flame-grad" x1="100" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fca5a5" />
          <stop offset="45%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
      </defs>
      <ellipse cx="70" cy="4" rx="22" ry="56" fill="url(#rocket-flame-grad)" transform="rotate(45 70 4)" />
      <ellipse cx="58" cy="12" rx="17" ry="48" fill="#f97316" transform="rotate(45 58 12)" />
      <ellipse cx="47" cy="20" rx="12" ry="38" fill="#fbbf24" transform="rotate(45 47 20)" />
      <ellipse cx="39" cy="27" rx="8" ry="26" fill="#fef3c7" transform="rotate(45 39 27)" />
      <circle
        className="rocket-flame-spark"
        cx="14"
        cy="52"
        r="3"
        fill="#f87171"
        style={{ transformBox: 'fill-box', transformOrigin: 'center', animationDelay: '0s' }}
      />
      <circle
        className="rocket-flame-spark"
        cx="8"
        cy="60"
        r="2"
        fill="#facc15"
        style={{ transformBox: 'fill-box', transformOrigin: 'center', animationDelay: '0.12s' }}
      />
      <circle
        className="rocket-flame-spark"
        cx="22"
        cy="58"
        r="2.2"
        fill="#fb923c"
        style={{ transformBox: 'fill-box', transformOrigin: 'center', animationDelay: '0.06s' }}
      />
    </svg>
    <Rocket className="absolute w-full h-full" style={{ zIndex: 1 }} strokeWidth={2} />
  </span>
);