import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import ProfileModal from '@/components/profile/ProfileModal';

interface AvatarButtonProps {
  onModalOpenChange?: (isOpen: boolean) => void;
}

function AvatarButton({ onModalOpenChange }: AvatarButtonProps) {
  const { user } = useAuth();
  const { profile, getAvatarUrl } = useProfile();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const avatarUrl = getAvatarUrl();
  const nickname = profile?.nickname;

  if (!user) return null;

  const getInitials = () => {
    if (nickname) {
      return nickname.charAt(0).toUpperCase();
    }
    return user.email?.charAt(0).toUpperCase() || '?';
  };

  const handleOpen = () => {
    setIsModalOpen(true);
    onModalOpenChange?.(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    onModalOpenChange?.(false);
  };

  return (
    <>
      <button
        className="profile-banner"
        onClick={handleOpen}
        aria-label="Open profile"
      >
        <div className="profile-banner-avatar">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="profile-banner-image" />
          ) : (
            <div className="profile-banner-placeholder">
              {getInitials()}
            </div>
          )}
        </div>
      </button>
      <ProfileModal isOpen={isModalOpen} onClose={handleClose} />
    </>
  );
}

export default AvatarButton;

