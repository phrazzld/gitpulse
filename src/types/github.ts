// Github API related type definitions

export type InstallationAccount = {
  login: string;
  type: string;
  avatarUrl?: string;
};

export type Installation = {
  id: number;
  account: InstallationAccount;
  appSlug: string;
  appId: number;
  repositorySelection: string;
  targetType: string;
};

export type Repository = {
  id: number;
  full_name: string;
  name: string;
  owner: {
    login: string;
  };
  private: boolean;
  language?: string | null;
};