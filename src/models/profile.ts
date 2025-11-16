export interface Profile {
  id: string;
  nickname: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  updateNickname: (nickname: string) => Promise<{ error: any }>;
  updateAvatar: (file: File) => Promise<{ error: any }>;
  getAvatarUrl: () => string | null;
  refreshProfile: () => Promise<void>;
}

