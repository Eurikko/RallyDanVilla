import React from 'react';
import { PlayerAvatar } from './PlayerAvatar';

interface AvatarProps {
  name?: string;
  url?: string | null;
  photoUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name = 'Jogador',
  url,
  photoUrl,
  size = 'md',
  className = '',
}) => {
  return (
    <PlayerAvatar
      photoUrl={photoUrl || url}
      displayName={name}
      size={size}
      className={className}
      showBadge={true}
    />
  );
};
