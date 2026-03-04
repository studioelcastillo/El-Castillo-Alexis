
import { 
  ContentAsset, ContentPlatform, ContentTask, 
  ContentAssetStatus 
} from './types';
import { MOCK_USERS } from './constants';

const TODAY = new Date().toISOString().split('T')[0];

let localPlatforms: ContentPlatform[] = [
  { id: 'plt_1', studio_id: '1', name: 'Instagram', icon: 'Instagram', is_active: true, color: 'text-pink-600' },
  { id: 'plt_2', studio_id: '1', name: 'X (Twitter)', icon: 'Twitter', is_active: true, color: 'text-slate-900' },
  { id: 'plt_3', studio_id: '1', name: 'TikTok', icon: 'Music2', is_active: true, color: 'text-black' },
  { id: 'plt_4', studio_id: '1', name: 'Facebook', icon: 'Facebook', is_active: true, color: 'text-blue-600' },
  { id: 'plt_5', studio_id: '1', name: 'OnlyFans', icon: 'Lock', is_active: true, color: 'text-blue-400' }
];

let localAssets: ContentAsset[] = [
  { 
    id: 'as_1', studio_id: '1', model_user_id: 3990, model_name: 'Jennifer Zuluaga', 
    type: 'PHOTO', preview_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=300', 
    file_url: '', status: 'PENDING_REVIEW', tags_json: ['Casual', 'Set Neon'], created_at: new Date().toISOString() 
  },
  { 
    id: 'as_2', studio_id: '1', model_user_id: 3990, model_name: 'Jennifer Zuluaga', 
    type: 'PHOTO', preview_url: 'https://images.unsplash.com/photo-1529139513055-07f909e3c5ba?auto=format&fit=crop&w=300', 
    file_url: '', status: 'APPROVED', tags_json: ['Exterior'], created_at: new Date().toISOString() 
  }
];

let localTasks: ContentTask[] = [
    { 
        id: 'tk_1', studio_id: '1', model_user_id: 3990, model_name: 'Jennifer Zuluaga', 
        status: 'PENDING', streamate_hours: 14.5, platforms: ['plt_1', 'plt_3'], 
        created_at: new Date().toISOString(), model_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
    }
];

const ContentSalesService = {
  getEligibleModels: async (studioId: string): Promise<ContentTask[]> => {
    await new Promise(r => setTimeout(r, 600));
    return localTasks.filter(t => t.completed_date !== TODAY);
  },

  getAssets: async (status?: ContentAssetStatus): Promise<ContentAsset[]> => {
    if (status) return localAssets.filter(a => a.status === status);
    return [...localAssets];
  },

  updateAssetStatus: async (id: string, status: ContentAssetStatus) => {
    localAssets = localAssets.map(a => a.id === id ? { ...a, status } : a);
    return { success: true };
  },

  createTask: async (data: Partial<ContentTask>) => {
    await new Promise(r => setTimeout(r, 1000));
    const newTask: ContentTask = {
        id: `tk_${Date.now()}`,
        studio_id: '1',
        model_user_id: data.model_user_id!,
        model_name: data.model_name!,
        model_avatar: data.model_avatar,
        status: 'SCHEDULED',
        streamate_hours: data.streamate_hours || 12,
        platforms: data.platforms || [],
        scheduled_at: data.scheduled_at,
        created_at: new Date().toISOString()
    };
    localTasks.unshift(newTask);
    return newTask;
  },

  assignTask: async (taskId: string, userId: number, userName: string) => {
      localTasks = localTasks.map(t => t.id === taskId ? { ...t, assigned_to_user_id: userId, assigned_name: userName } : t);
      return { success: true };
  },

  markAsDone: async (taskId: string) => {
    const now = new Date();
    localTasks = localTasks.map(t => t.id === taskId ? { 
        ...t, 
        status: 'DONE', 
        completed_at: now.toISOString(),
        completed_date: TODAY 
    } : t);
    return { success: true };
  },

  getPlatforms: async (): Promise<ContentPlatform[]> => {
    return localPlatforms.filter(p => p.is_active);
  }
};

export default ContentSalesService;
