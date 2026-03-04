
import { BirthdayUser, BirthdayTemplate } from './types';
import { MOCK_USERS } from './constants';

// Mock DB for template settings (Multi-tenant simulation)
let localTemplate: BirthdayTemplate = {
  isActive: true,
  bodyText: "🎉 ¡Feliz Cumpleaños {{first_name}}! Queremos desearte un día lleno de alegría y éxito. Gracias por ser parte de El Castillo.",
  sendTime: "09:00",
  channel: 'IN_APP'
};

const BirthdayService = {
  
  // 1. Calculate and Sort Birthdays
  getBirthdays: async (filters?: { from?: string, to?: string, search?: string }) => {
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 600));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentYear = today.getFullYear();

    // 1. Enrich Mock Users with Birthday Data
    const enrichedUsers: BirthdayUser[] = MOCK_USERS.map(user => {
        // --- TEST FORCE: Force Jennifer (3990) to have birthday TODAY ---
        let birthDateStr = user.birth_date;
        if (user.user_id === 3990) {
            const m = (today.getMonth() + 1).toString().padStart(2, '0');
            const d = today.getDate().toString().padStart(2, '0');
            birthDateStr = `1995-${m}-${d}`;
        }
        // ----------------------------------------------------------------

        // Fallback if still no date
        if (!birthDateStr) {
             const mockMonth = (user.user_id % 12) + 1;
             const mockDay = (user.user_id % 28) + 1;
             birthDateStr = `1995-${String(mockMonth).padStart(2, '0')}-${String(mockDay).padStart(2, '0')}`;
        }
        
        const [y, m, d] = birthDateStr.split('-').map(Number);
        
        // Calculate Next Birthday
        let nextBday = new Date(currentYear, m - 1, d);
        
        // If birthday has passed this year, next one is next year
        // We compare timestamps to avoid issues with time
        if (nextBday.getTime() < today.getTime()) {
            nextBday = new Date(currentYear + 1, m - 1, d);
        }

        // Diff in Days
        const diffTime = nextBday.getTime() - today.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        return {
            userId: user.user_id,
            fullName: `${user.user_name} ${user.user_surname}`,
            profilePhotoUrl: user.image,
            birthDate: birthDateStr,
            nextBirthday: nextBday.toISOString().split('T')[0],
            daysLeft: daysLeft,
            isToday: daysLeft === 0,
            roleName: user.profile?.prof_name || 'Usuario'
        };
    });

    // 2. Sort by Days Left (Ascending)
    let sorted = enrichedUsers.sort((a, b) => a.daysLeft - b.daysLeft);

    // 3. Apply Filters
    if (filters?.search) {
        const q = filters.search.toLowerCase();
        sorted = sorted.filter(u => u.fullName.toLowerCase().includes(q));
    }

    if (filters?.from && filters?.to) {
        const fromDate = new Date(filters.from);
        const toDate = new Date(filters.to);
        sorted = sorted.filter(u => {
            const date = new Date(u.nextBirthday);
            return date >= fromDate && date <= toDate;
        });
    }

    return sorted;
  },

  // 2. Get This Week's Birthdays (Widget)
  getWeekBirthdays: async () => {
      const all = await BirthdayService.getBirthdays();
      // Filter for next 7 days
      return all.filter(u => u.daysLeft >= 0 && u.daysLeft <= 7);
  },

  // 3. Configuration
  getTemplate: async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return { ...localTemplate };
  },

  saveTemplate: async (data: BirthdayTemplate) => {
      await new Promise(resolve => setTimeout(resolve, 800));
      localTemplate = data;
      return localTemplate;
  }
};

export default BirthdayService;
