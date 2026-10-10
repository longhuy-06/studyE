import React from 'react';

interface UserAvatarProps {
  name?: string;
  avatarUrl?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

function getInitials(name?: string): string {
  if (!name || !name.trim()) return 'HV';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  const first = parts[0][0];
  const last = parts[parts.length - 1][0];
  return (first + last).toUpperCase();
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

// Check if an avatar is a real user-uploaded or explicitly chosen image.
// Never display external auto-generated person portraits (Unsplash portraits, Google mock avatars, etc.)
function isValidCustomAvatar(url?: string): boolean {
  if (!url || !url.trim()) return false;
  const trimmed = url.trim().toLowerCase();
  if (
    trimmed.includes('images.unsplash.com') ||
    trimmed.includes('lh3.googleusercontent.com') ||
    trimmed.includes('pravatar') ||
    trimmed.includes('dicebear') ||
    trimmed.includes('randomuser.me')
  ) {
    return false;
  }
  return true;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name = 'Học viên',
  avatarUrl,
  className = '',
  size = 'sm',
}) => {
  const [imgError, setImgError] = React.useState(false);

  // If user explicitly uploaded or set their own image (not an auto-generated portrait), render it
  if (isValidCustomAvatar(avatarUrl) && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-[#dbe1ff] ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

  // Default: circular avatar with uppercase initials of user's name
  const initials = getInitials(name);

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-[#0650cc] text-white font-bold flex items-center justify-center select-none shadow-xs shrink-0 ring-2 ring-[#dbe1ff] ${className}`}
      aria-label={name}
      title={name}
    >
      <span>{initials}</span>
    </div>
  );
};
