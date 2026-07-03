import React from 'react';
import { Sparkles } from 'lucide-react';

/** A pulsing, glowing orb used as the AI's visual identity. */
export const AIAvatar: React.FC<{ size?: number; animated?: boolean; className?: string }> = ({
  size = 40, animated = true, className = '',
}) => (
  <div
    className={`relative rounded-full flex items-center justify-center shrink-0 ${className}`}
    style={{ width: size, height: size }}
  >
    {/* Outer glow rings */}
    {animated && (
      <>
        <span className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-400 via-fuchsia-400 to-cyan-400 opacity-70 blur-md animate-pulse" />
        <span className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 opacity-40 animate-ping" style={{ animationDuration: '2s' }} />
      </>
    )}
    {/* Core orb */}
    <div className="relative w-full h-full rounded-full bg-gradient-to-br from-slate-900 via-violet-900 to-slate-950 flex items-center justify-center shadow-inner overflow-hidden">
      {/* Inner sparkles */}
      <div className="absolute inset-0 opacity-60">
        <div className="absolute top-1/4 left-1/4 w-0.5 h-0.5 rounded-full bg-white animate-pulse" style={{ animationDelay: '0s' }} />
        <div className="absolute top-1/2 right-1/4 w-0.5 h-0.5 rounded-full bg-cyan-300 animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-0.5 h-0.5 rounded-full bg-fuchsia-300 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      <Sparkles className="text-white relative z-10" style={{ width: size * 0.5, height: size * 0.5 }} strokeWidth={2.2} />
    </div>
  </div>
);