
import { api } from './api';
import { UserProfileData } from './types';

const ProfileService = {
  getProfiles: () => {
    return api.get<{ data: UserProfileData[] }>('/profiles');
  }
};

export default ProfileService;
