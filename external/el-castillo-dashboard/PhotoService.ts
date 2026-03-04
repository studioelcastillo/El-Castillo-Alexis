
import { PhotoRequest, PhotoRequestStatus, PhotoAsset, PhotoRating, PhotoCalendarEvent, PhotoDashboardKPI, PhotoServiceType } from './types';
import { MOCK_USERS } from './constants';

// --- MOCK DATABASE ---
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
        .filter(r => ['CONFIRMED', 'IN_PROGRESS', 'DELIVERED', 'ACCEPTED'].includes(r.status))
        .map(r => ({
            id: r.id,
            title: `${r.requester_name} - ${r.type}`,
            start: r.confirmed_date || `${r.proposed_date}T${r.proposed_time}:00`,
            end: new Date(new Date(r.confirmed_date || `${r.proposed_date}T${r.proposed_time}:00`).getTime() + r.duration_minutes * 60000).toISOString(),
            type: 'SHOOT',
            status: r.status,
            resourceId: r.photographer_id
        }));
    
    // Add Mock Blocks
    events.push({
        id: 'block1',
        title: 'Mantenimiento Set',
        start: '2025-05-26T08:00:00',
        end: '2025-05-26T12:00:00',
        type: 'BLOCK'
    });

    return Promise.resolve(events);
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
  }
};

export default PhotoService;
