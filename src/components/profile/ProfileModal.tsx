import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import './ProfileModal.css';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user } = useAuth();
  const { profile, loading, updateNickname, updateAvatar, getAvatarUrl } = useProfile();
  const [nickname, setNickname] = useState(profile?.nickname || '');
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarUrl = getAvatarUrl();

  // Sync nickname with profile changes
  useEffect(() => {
    if (profile?.nickname !== undefined) {
      setNickname(profile.nickname || '');
    }
  }, [profile?.nickname]);

  // Clear error when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setError(null);
    }
  }, [isOpen]);

  const handleNicknameSave = async () => {
    setError(null);
    const { error } = await updateNickname(nickname);
    if (error) {
      setError(error.message || 'Failed to update nickname');
    } else {
      setIsEditingNickname(false);
    }
  };

  const handleNicknameCancel = () => {
    setNickname(profile?.nickname || '');
    setIsEditingNickname(false);
    setError(null);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setError(null);
    setIsUploading(true);

    const { error } = await updateAvatar(file);
    if (error) {
      setError(error.message || 'Failed to upload avatar');
    }

    setIsUploading(false);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  // Show loading state
  if (loading) {
    return (
      <div className="profile-modal-overlay" onClick={onClose}>
        <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
          <div className="profile-modal-content" style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="profile-modal-close" onClick={onClose}>
          ×
        </button>
        
        <div className="profile-modal-header">
          <h2>Profile</h2>
        </div>

        <div className="profile-modal-content">
          <div className="profile-avatar-section">
            <div className="profile-avatar-container" onClick={handleAvatarClick}>
              {isUploading ? (
                <div className="profile-avatar-loading">Uploading...</div>
              ) : avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="profile-avatar-image" />
              ) : (
                <div className="profile-avatar-placeholder">
                  {nickname ? nickname.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
              <div className="profile-avatar-overlay">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
            <p className="profile-avatar-hint">Click to change avatar</p>
          </div>

          <div className="profile-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={user?.email || ''}
              disabled
              className="profile-input-disabled"
            />
          </div>

          <div className="profile-field">
            <label htmlFor="nickname">Nickname</label>
            {isEditingNickname ? (
              <div className="profile-nickname-edit">
                <input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="profile-input"
                  placeholder="Enter your nickname"
                  maxLength={50}
                  autoFocus
                />
                <div className="profile-nickname-actions">
                  <button
                    onClick={handleNicknameSave}
                    className="profile-btn-primary"
                    disabled={nickname === (profile?.nickname || '')}
                  >
                    Save
                  </button>
                  <button
                    onClick={handleNicknameCancel}
                    className="profile-btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="profile-nickname-display">
                <span className={nickname ? '' : 'profile-nickname-empty'}>
                  {nickname || 'No nickname set'}
                </span>
                <button
                  onClick={() => setIsEditingNickname(true)}
                  className="profile-btn-edit"
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          {error && <div className="profile-error">{error}</div>}
        </div>
      </div>
    </div>
  );
}

export default ProfileModal;

