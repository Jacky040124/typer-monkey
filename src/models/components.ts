export interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface AvatarButtonProps {
  onModalOpenChange: (isOpen: boolean) => void;
}

