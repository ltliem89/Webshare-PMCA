import React from 'react';
import { Rocket } from 'lucide-react';

interface RocketFlyingProps {
  className?: string;
}

export const RocketFlying: React.FC<RocketFlyingProps> = ({ className }) => (
  <span className={`relative inline-flex items-center justify-center shrink-0 ${className ?? ''}`}>
    {/* Luồng lửa phụt ra phía sau — phía dưới, canh giữa theo chiều ngang của tên lửa */}
    <svg
      viewBox="0 0 100 100"
      className="absolute"
      style={{
        left: '50%',
        top: '65%',
        width: '80%',
        height: '150%',
        marginLeft: '-40%',
        zIndex: 0,
        overflow: 'visible',
        filter: 'drop-shadow(0 2px 5px rgba(239,68,68,0.6))',
        transformOrigin: '50% 0%',
        animation: 'rocket-flame-burst 0.3s ease-in-out infinite',
      }}
    >
      <defs>
        <linearGradient id="rocket-flame-grad" x1="50" y1="0" x2="50" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fca5a5" />
          <stop offset="45%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="12" rx="24" ry="56" fill="url(#rocket-flame-grad)" />
      <ellipse cx="50" cy="20" rx="18" ry="48" fill="#f97316" />
      <ellipse cx="50" cy="28" rx="13" ry="38" fill="#fbbf24" />
      <ellipse cx="50" cy="35" rx="8" ry="26" fill="#fef3c7" />
      <circle
        className="rocket-flame-spark"
        cx="50"
        cy="62"
        r="3"
        fill="#f87171"
        style={{ transformBox: 'fill-box', transformOrigin: 'center', animationDelay: '0s' }}
      />
      <circle
        className="rocket-flame-spark"
        cx="50"
        cy="70"
        r="2"
        fill="#facc15"
        style={{ transformBox: 'fill-box', transformOrigin: 'center', animationDelay: '0.12s' }}
      />
      <circle
        className="rocket-flame-spark"
        cx="50"
        cy="68"
        r="2.2"
        fill="#fb923c"
        style={{ transformBox: 'fill-box', transformOrigin: 'center', animationDelay: '0.06s' }}
      />
    </svg>
    <Rocket className="absolute w-full h-full" style={{ zIndex: 1 }} strokeWidth={2} />
  </span>
);