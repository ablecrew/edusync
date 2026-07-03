import React, { useEffect, useState } from 'react';

interface UserAvatarProps {
  name?: string | null;
  src?: string | null;
  size?: number;                    // pixel size, default 36
  className?: string;               // extra classes for the wrapper
  ringClassName?: string;           // e.g. 'ring-2 ring-[#08428C]/30'
}

// Deterministic color palette — same name always gets the same gradient
const GRADIENTS = [
  'from-[#08428C] to-[#0a4fa8]',
  'from-emerald-500 to-emerald-700',
  'from-amber-500 to-amber-700',
  'from-rose-500 to-rose-700',
  'from-violet-500 to-violet-700',
  'from-sky-500 to-sky-700',
  'from-teal-500 to-teal-700',
  'from-fuchsia-500 to-fuchsia-700',
];

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function initialsFrom(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  src,
  size = 36,
  className = '',
  ringClassName = 'ring-2 ring-[#08428C]/30',
}) => {
  const [errored, setErrored] = useState(false);

  // If the src changes (e.g. user updates their avatar), give the new URL a chance
  useEffect(() => { setErrored(false); }, [src]);

  const showImage = src && !errored;
  const initials = initialsFrom(name);
  const gradient = GRADIENTS[hashName(name ?? 'x') % GRADIENTS.length];
  const style: React.CSSProperties = { width: size, height: size };
  const fontSize = Math.max(10, Math.round(size * 0.36));

  if (showImage) {
    return (
      <img
        src={src!}
        alt={name ?? 'Avatar'}
        style={style}
        className={`rounded-full object-cover shrink-0 ${ringClassName} ${className}`}
        onError={() => setErrored(true)}
        referrerPolicy="no-referrer"       // avoids some Supabase/CORS 403s
        loading="lazy"
      />
    );
  }

  return (
    <div
      style={style}
      className={`rounded-full bg-gradient-to-br ${gradient} text-white font-black flex items-center justify-center shrink-0 ${ringClassName} ${className}`}
      aria-label={name ?? 'User'}
      title={name ?? undefined}
    >
      <span style={{ fontSize }}>{initials}</span>
    </div>
  );
};