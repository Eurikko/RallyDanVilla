import React, { useState } from 'react';
import { User } from 'lucide-react';

interface PlayerAvatarProps {
  photoUrl?: string | null;
  displayName?: string | null;
  username?: string | null;
  name?: string | null; // Generic fallback name
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showBadge?: boolean;
}

/**
 * Extracts 1-2 initials based on display name or username.
 * Examples:
 * - "Euriko Dias" -> "ED"
 * - "Euriko" -> "E"
 * - "Jogador10" -> "J"
 */
export function getAvatarInitials(displayName?: string | null, username?: string | null, genericName?: string | null): string {
  const primaryName = (displayName && displayName.trim()) || (genericName && genericName.trim()) || (username && username.trim());
  
  if (!primaryName) return 'J';

  const parts = primaryName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  if (parts.length >= 2) {
    const firstInitial = parts[0].charAt(0).toUpperCase();
    const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}`;
  }

  return 'J';
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  photoUrl,
  displayName,
  username,
  name,
  size = 'md',
  className = '',
  showBadge = false,
}) => {
  const [imgError, setImgError] = useState(false);

  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-20 h-20 text-2xl',
    '2xl': 'w-24 h-24 text-3xl',
  };

  const effectiveName = displayName || name || username || 'Jogador';
  const initials = getAvatarInitials(displayName, username, name);
  const altText = photoUrl && !imgError ? `Foto de perfil de ${effectiveName}` : `Avatar de ${effectiveName}`;

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full bg-[#0B192C] text-white font-bold shadow-sm border-2 border-white shrink-0 overflow-hidden select-none ${sizes[size]} ${className}`}
      title={effectiveName}
    >
      {photoUrl && !imgError ? (
        <img
          src={photoUrl}
          alt={altText}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover rounded-full"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="leading-none tracking-wider font-black text-white">
          {initials || <User className="w-1/2 h-1/2" />}
        </span>
      )}

      {showBadge && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#E63946] border-2 border-white rounded-full shadow-xs" />
      )}
    </div>
  );
};
