import { supabase } from './supabaseClient';
import { BirthdayUser, BirthdayTemplate } from './types';

const TEMPLATE_KEY = 'birthday_template';

const defaultTemplate: BirthdayTemplate = {
  isActive: true,
  bodyText:
    '🎉 ¡Feliz Cumpleaños {{first_name}}! Queremos desearte un día lleno de alegría y éxito. Gracias por ser parte de El Castillo.',
  sendTime: '09:00',
  channel: 'IN_APP',
};

const computeBirthday = (birthDate: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentYear = today.getFullYear();

  const [y, m, d] = birthDate.split('-').map(Number);
  let nextBday = new Date(currentYear, m - 1, d);
  if (nextBday.getTime() < today.getTime()) {
    nextBday = new Date(currentYear + 1, m - 1, d);
  }
  const diffTime = nextBday.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return { nextBday, daysLeft };
};

const BirthdayService = {
  async getBirthdays(filters?: { from?: string; to?: string; search?: string }) {
    const { data, error } = await supabase
      .from('users')
      .select('user_id, user_name, user_surname, user_birthdate, user_photo_url, profiles(prof_name)')
      .not('user_birthdate', 'is', null)
      .order('user_name', { ascending: true });

    if (error) {
      console.error('Birthday users error', error);
      return [] as BirthdayUser[];
    }

    const enriched: BirthdayUser[] = (data || []).map((user: any) => {
      const birthDate = user.user_birthdate;
      const { nextBday, daysLeft } = computeBirthday(birthDate);
      return {
        userId: user.user_id,
        fullName: `${user.user_name || ''} ${user.user_surname || ''}`.trim(),
        profilePhotoUrl: user.user_photo_url || undefined,
        birthDate,
        nextBirthday: nextBday.toISOString().split('T')[0],
        daysLeft,
        isToday: daysLeft === 0,
        roleName: user.profiles?.prof_name || 'Usuario',
      };
    });

    let sorted = enriched.sort((a, b) => a.daysLeft - b.daysLeft);

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      sorted = sorted.filter((u) => u.fullName.toLowerCase().includes(q));
    }

    if (filters?.from && filters?.to) {
      const fromDate = new Date(filters.from);
      const toDate = new Date(filters.to);
      sorted = sorted.filter((u) => {
        const date = new Date(u.nextBirthday);
        return date >= fromDate && date <= toDate;
      });
    }

    return sorted;
  },

  async getWeekBirthdays() {
    const all = await BirthdayService.getBirthdays();
    return all.filter((u) => u.daysLeft >= 0 && u.daysLeft <= 7);
  },

  async getTemplate(): Promise<BirthdayTemplate> {
    const { data, error } = await supabase
      .from('settings')
      .select('set_value')
      .eq('set_key', TEMPLATE_KEY)
      .maybeSingle();

    if (error) {
      console.error('Birthday template error', error);
    }

    if (data?.set_value) {
      try {
        return { ...defaultTemplate, ...JSON.parse(data.set_value) } as BirthdayTemplate;
      } catch {
        return { ...defaultTemplate };
      }
    }

    return { ...defaultTemplate };
  },

  async saveTemplate(template: BirthdayTemplate) {
    await supabase
      .from('settings')
      .upsert(
        [
          {
            set_key: TEMPLATE_KEY,
            set_value: JSON.stringify(template),
            set_description: 'Birthday template configuration',
          },
        ],
        { onConflict: 'set_key' }
      );

    return template;
  },
};

export default BirthdayService;
