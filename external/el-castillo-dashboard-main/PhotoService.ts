
import { PhotoRequest, PhotoRequestStatus, PhotoAsset, PhotoRating, PhotoCalendarEvent, PhotoDashboardKPI, PhotoServiceType, PhotoRestrictionConfig, PhotoRestrictionStatus } from './types';
import { MOCK_USERS } from './constants';

// --- MOCK DATABASE ---
let photographerAvailability = {
    workingDays: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
    startTime: '08:00',
    endTime: '18:00',
    blockedDates: [] as string[]
};

let restrictionConfig: PhotoRestrictionConfig = {
    restrictionDays: 45,
    unlockedUsers: []
};

let manualBlocks: PhotoCalendarEvent[] = [
  {
    id: 'block1',
    title: 'Mantenimiento Set',
    start: '2025-05-26T08:00:00',
    end: '2025-05-26T12:00:00',
    type: 'BLOCK'
  }
];

let requests: PhotoRequest[] = [
  {
    id: 'PH-1001',
    studio_id: '1',
    requester_id: 3990,
    requester_name: 'Jennifer Zuluaga',
    type: 'FOTO',
    objective: 'REDES',
    location: 'Sede Principal - Set Neon',
    proposed_date: '2025-05-25',
    proposed_time: '10:00',
    duration_minutes: 60,
    confirmed_date: '2025-05-25T10:00:00',
    style_references: 'Estilo cyberpunk, luces neón azul y rosa. https://pinterest.com/example',
    requires_makeup: true,
    makeup_artist_id: 3988, // Sofia as mock MUA
    makeup_artist_name: 'Sofia Mosquera',
    status: 'IN_PROGRESS',
    priority: 'NORMAL',
    assets: [],
    created_at: '2025-05-20T08:00:00Z',
    updated_at: '2025-05-21T09:00:00Z',
    history_log: [
        { user: 'Jennifer Zuluaga', action: 'Solicitud Creada', date: '2025-05-20T08:00:00Z' },
        { user: 'Admin', action: 'Confirmada', date: '2025-05-21T09:00:00Z' }
    ]
  },
  {
    id: 'PH-1002',
    studio_id: '1',
    requester_id: 3989,
    requester_name: 'Ana Acero',
    type: 'VIDEO',
    objective: 'CONTENIDO',
    location: 'Sede Norte - Habitación 101',
    proposed_date: '2025-05-28',
    proposed_time: '14:00',
    duration_minutes: 90,
    style_references: 'Video para Reels, transición rápida.',
    requires_makeup: false,
    status: 'SENT',
    priority: 'HIGH',
    assets: [],
    created_at: '2025-05-22T11:00:00Z',
    updated_at: '2025-05-22T11:00:00Z',
    history_log: [
        { user: 'Ana Acero', action: 'Solicitud Creada', date: '2025-05-22T11:00:00Z' }
    ]
  }
];

let ratings: PhotoRating[] = [];

// --- SERVICE IMPLEMENTATION ---

const PhotoService = {
  
  // 1. Requests Management
  getRequests: async (filters: { studioId: string, role?: string, userId?: number }) => {
    // Simulate role-based filtering
    let data = [...requests];
    if (filters.role === 'MODELO' && filters.userId) {
        data = data.filter(r => r.requester_id === filters.userId);
    }
    // Sort by creation date desc
    return Promise.resolve(data.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
  },

  createRequest: async (request: Partial<PhotoRequest>) => {
    const newRequest: PhotoRequest = {
        id: `PH-${Math.floor(Math.random() * 9000) + 1000}`,
        studio_id: '1',
        requester_id: request.requester_id!,
        requester_name: request.requester_name!,
        type: request.type || 'FOTO',
        objective: request.objective || 'CONTENIDO',
        location: request.location || 'Sede Principal',
        proposed_date: request.proposed_date!,
        proposed_time: request.proposed_time!,
        duration_minutes: request.duration_minutes || 60,
        style_references: request.style_references || '',
        requires_makeup: request.requires_makeup || false,
        makeup_artist_id: request.makeup_artist_id, // Optional preference
        status: 'SENT',
        priority: request.priority || 'NORMAL',
        assets: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        history_log: [{ user: request.requester_name!, action: 'Solicitud Creada', date: new Date().toISOString() }]
    };
    requests.unshift(newRequest);

    // Update last session date for the user to trigger restriction
    const user = MOCK_USERS.find(u => u.user_id === request.requester_id);
    if (user) {
        user.last_photo_session = new Date().toISOString().split('T')[0];
    }

    return Promise.resolve(newRequest);
  },

  updateStatus: async (id: string, status: PhotoRequestStatus, user: string, notes?: string, rescheduleData?: {date: string, time: string}) => {
    const req = requests.find(r => r.id === id);
    if (!req) throw new Error("Request not found");

    req.status = status;
    req.updated_at = new Date().toISOString();
    req.history_log.push({ user, action: `Cambio estado a ${status} ${notes ? `(${notes})` : ''}`, date: new Date().toISOString() });

    if (status === 'CONFIRMED' || status === 'ACCEPTED') {
        // If confirmed, set the final date (simplification: accepting proposed)
        if (!req.confirmed_date) req.confirmed_date = `${req.proposed_date}T${req.proposed_time}:00`;
    }

    if (status === 'RESCHEDULE_PROPOSED' && rescheduleData) {
        req.proposed_date = rescheduleData.date;
        req.proposed_time = rescheduleData.time;
        // In real app, this might go to a different field like 'counter_proposal'
    }

    if (status === 'DELIVERED') {
        // Logic to notify model would go here
    }

    return Promise.resolve(req);
  },

  // 2. Drive & Assets (Mock)
  uploadAsset: async (requestId: string, file: File) => {
    const req = requests.find(r => r.id === requestId);
    if (!req) throw new Error("Request not found");

    // Simulate Drive Upload delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newAsset: PhotoAsset = {
        id: `asset_${Date.now()}`,
        request_id: requestId,
        drive_file_id: `drive_${Date.now()}`, // Mock Drive ID
        // Mock specific URLs based on file type
        drive_url: URL.createObjectURL(file), // Using blob for demo download
        preview_url: file.type.startsWith('video') 
            ? 'https://via.placeholder.com/300x200/000000/FFFFFF?text=VIDEO+PROXY' 
            : URL.createObjectURL(file), // In real app, this is a compressed thumb from server
        type: file.type.startsWith('video') ? 'VIDEO' : 'PHOTO',
        created_at: new Date().toISOString()
    };

    req.assets.push(newAsset);
    return Promise.resolve(newAsset);
  },

  // 3. Calendar
  getCalendarEvents: async (): Promise<PhotoCalendarEvent[]> => {
    // Convert requests to calendar events
    const events: PhotoCalendarEvent[] = requests
        .filter(r => ['CONFIRMED', 'IN_PROGRESS', 'DELIVERED', 'ACCEPTED', 'PHOTOS_TAKEN'].includes(r.status))
        .map(r => ({
            id: r.id,
            title: `${r.requester_name} - ${r.type}`,
            start: r.confirmed_date || `${r.proposed_date}T${r.proposed_time}:00`,
            end: new Date(new Date(r.confirmed_date || `${r.proposed_date}T${r.proposed_time}:00`).getTime() + r.duration_minutes * 60000).toISOString(),
            type: 'SHOOT',
            status: r.status,
            resourceId: r.photographer_id || 101 // Default to first photographer if not set
        }));
    
    return Promise.resolve([...events, ...manualBlocks]);
  },

  blockSlot: async (block: Omit<PhotoCalendarEvent, 'id'>) => {
    const newBlock: PhotoCalendarEvent = {
        ...block,
        id: `block_${Date.now()}`,
        type: 'BLOCK'
    };
    manualBlocks.push(newBlock);
    return Promise.resolve(newBlock);
  },

  removeBlock: async (id: string) => {
    manualBlocks = manualBlocks.filter(b => b.id !== id);
    return Promise.resolve();
  },

  // 4. Ratings
  submitRating: async (rating: Omit<PhotoRating, 'id' | 'created_at'>) => {
    const newRating: PhotoRating = {
        ...rating,
        id: `rating_${Date.now()}`,
        created_at: new Date().toISOString()
    };
    ratings.push(newRating);
    
    // Check if request is fully rated to close it? (Optional business logic)
    const req = requests.find(r => r.id === rating.request_id);
    if (req && req.status === 'DELIVERED') {
        req.status = 'RATED';
    }

    return Promise.resolve(newRating);
  },

  // 5. Admin Dashboard
  getDashboardStats: async (): Promise<PhotoDashboardKPI> => {
    return Promise.resolve({
        total_requests: requests.length,
        avg_confirmation_time_hours: 4.5,
        avg_delivery_time_hours: 48,
        rating_photographer_avg: 4.8,
        rating_makeup_avg: 4.9,
        reschedule_rate: 15,
        status_distribution: [
            { name: 'Entregado', value: 45 },
            { name: 'Pendiente', value: 20 },
            { name: 'En Proceso', value: 15 },
            { name: 'Cancelado', value: 5 }
        ],
        top_photographers: [
            { name: 'Carlos (Foto)', rating: 4.9, jobs: 24 },
            { name: 'Laura (Video)', rating: 4.7, jobs: 18 }
        ]
    });
  },
  // 6. Availability Management
  getAvailability: async () => {
    return Promise.resolve(photographerAvailability);
  },

  getMockUsers: () => {
    return MOCK_USERS;
  },

  updateAvailability: async (data: typeof photographerAvailability) => {
    photographerAvailability = { ...data };
    return Promise.resolve(photographerAvailability);
  },

  // 7. Restriction Management
  getRestrictionConfig: async (): Promise<PhotoRestrictionConfig> => {
    return Promise.resolve(restrictionConfig);
  },

  updateRestrictionConfig: async (config: Partial<PhotoRestrictionConfig>) => {
    restrictionConfig = { ...restrictionConfig, ...config };
    return Promise.resolve(restrictionConfig);
  },

  checkUserRestriction: async (userId: number): Promise<PhotoRestrictionStatus> => {
    if (restrictionConfig.unlockedUsers.includes(userId)) {
        return { isRestricted: false };
    }

    const userRequests = requests
        .filter(r => r.requester_id === userId && !['REJECTED', 'CANCELLED'].includes(r.status))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (userRequests.length === 0) {
        return { isRestricted: false };
    }

    const lastRequest = userRequests[0];
    const lastDate = new Date(lastRequest.created_at);
    const now = new Date();
    
    const diffTime = Math.abs(now.getTime() - lastDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < restrictionConfig.restrictionDays) {
        const unlockDate = new Date(lastDate);
        unlockDate.setDate(lastDate.getDate() + restrictionConfig.restrictionDays);
        
        return {
            isRestricted: true,
            lastRequestDate: lastDate.toISOString(),
            unlockDate: unlockDate.toISOString(),
            daysRemaining: restrictionConfig.restrictionDays - diffDays
        };
    }

    return { isRestricted: false };
  },

  toggleUserUnlock: async (userId: number) => {
    if (restrictionConfig.unlockedUsers.includes(userId)) {
        restrictionConfig.unlockedUsers = restrictionConfig.unlockedUsers.filter(id => id !== userId);
    } else {
        restrictionConfig.unlockedUsers.push(userId);
    }
    return Promise.resolve(restrictionConfig);
  }
};

export default PhotoService;
