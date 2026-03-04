
import React, { useMemo } from 'react';
import { PresenceStatus } from '../types';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: PresenceStatus;
  version?: number; // Cache busting
  className?: string;
  isGroup?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  name, 
  size = 'md', 
  status, 
  version = 1,
  className = '',
  isGroup = false
}) => {
  
  // 1. Size Mapping
  const sizeMap = {
    xs: { px: 24, dim: 'w-6 h-6', text: 'text-[9px]' },
    sm: { px: 32, dim: 'w-8 h-8', text: 'text-xs' },
    md: { px: 48, dim: 'w-12 h-12', text: 'text-sm' },
    lg: { px: 96, dim: 'w-24 h-24', text: 'text-2xl' },
    xl: { px: 128, dim: 'w-32 h-32', text: 'text-4xl' },
  };

  const { px, dim, text } = sizeMap[size];

  // 2. Optimized URL Generation (Simulating CDN)
  const optimizedSrc = useMemo(() => {
    if (!src) return null;
    // Simulate resizing params if using a real CDN like Cloudinary/Imgix
    // If it's a base64 or blob, returns as is.
    if (src.startsWith('data:') || src.startsWith('blob:')) return src;
    
    const separator = src.includes('?') ? '&' : '?';
    return `${src}${separator}w=${px}&h=${px}&fit=crop&q=80&v=${version}`;
  }, [src, px, version]);

  // 3. Fallback Initials
  const initials = useMemo(() => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [name]);

  // 4. Presence Status Logic
  const getStatusColor = (s?: PresenceStatus) => {
    switch(s) {
      case 'available': return 'bg-emerald-500 border-white';
      case 'busy': return 'bg-amber-500 border-white';
      case 'away': return 'bg-yellow-400 border-white';
      case 'offline': return 'bg-slate-400 border-white';
      default: return null;
    }
  };

  const statusClass = getStatusColor(status);
  const statusSize = size === 'xs' || size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5';

  // 5. Consistent Background Color for Fallback
  const getBgColor = (str: string) => {
    const colors = ['bg-slate-200 text-slate-600', 'bg-blue-100 text-blue-600', 'bg-amber-100 text-amber-600', 'bg-emerald-100 text-emerald-600', 'bg-purple-100 text-purple-600', 'bg-pink-100 text-pink-600'];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div 
        className={`
          ${dim} rounded-2xl flex items-center justify-center font-black select-none overflow-hidden transition-transform shadow-sm
          ${!optimizedSrc ? getBgColor(name) : 'bg-slate-100'}
          ${isGroup ? 'rounded-2xl' : 'rounded-2xl'}
        `}
      >
        {optimizedSrc ? (
          <img 
            src={optimizedSrc} 
            alt={name} 
            loading="lazy"
            className="w-full h-full object-cover"
            onError={(e) => {
              // Simple fallback if image fails to load
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement?.classList.add(...getBgColor(name).split(' '));
              const span = document.createElement('span');
              span.innerText = initials;
              span.className = text;
              e.currentTarget.parentElement?.appendChild(span);
            }}
          />
        ) : (
          <span className={text}>{initials}</span>
        )}
      </div>

      {statusClass && !isGroup && (
        <div className={`absolute -bottom-1 -right-1 ${statusSize} border-2 rounded-full ${statusClass} shadow-sm z-10`} />
      )}
    </div>
  );
};

export default Avatar;
