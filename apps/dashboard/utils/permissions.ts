import { SidebarSection } from '../types';

export const ADMIN_ONLY_PAGE_IDS = new Set([
  'admin_datos',
  'control_licencias',
  'config_global',
  'supervision_tareas',
  'gestion_pseudonimos',
  'terceros',
  'metas_bonos',
  'panel_vps',
  'api_modules',
  'api_permissions',
  'api_user_overrides',
  'users_permissions2',
  'logs',
  'login_history',
  'setup_commissions',
  'commissions',
  'massive_liquidation',
  'monitors',
  'notifications',
  'users2',
]);

const ADMIN_PROFILE_IDS = new Set([1, 11]);
const ADMIN_ROLE_NAMES = new Set([
  'ADMIN',
  'ADMINISTRADOR',
  'SUPER_ADMIN',
  'SUPERADMIN',
]);

export const isAdminUser = (user: any) => {
  if (!user) return false;
  const profId = user.prof_id ?? user.profile?.prof_id ?? user.profiles?.prof_id;
  if (profId && ADMIN_PROFILE_IDS.has(Number(profId))) return true;
  const roleName = String(user.profile?.prof_name || user.prof_name || '').toUpperCase();
  return ADMIN_ROLE_NAMES.has(roleName);
};

export const filterSidebarSections = (sections: SidebarSection[], isAdmin: boolean) => {
  if (isAdmin) return sections;
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !ADMIN_ONLY_PAGE_IDS.has(item.id)),
    }))
    .filter((section) => section.items.length > 0);
};

export const isAdminRoute = (pageId: string) => ADMIN_ONLY_PAGE_IDS.has(pageId);
