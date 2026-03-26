import React, { lazy } from 'react';
import ResourcePage from './components/admin/ResourcePage';
import UsersPage from './components/UsersPage';
import RequestsPage from './components/RequestsPage';
import { isAdminRoute } from './utils/permissions';

const Dashboard = lazy(() => import('./components/Dashboard'));
const ModelPayrollPage = lazy(() => import('./components/ModelPayrollPage'));
const StudioLiquidationPage = lazy(() => import('./components/StudioLiquidationPage'));
const Users2Page = lazy(() => import('./components/Users2Page'));
const UserPermissions2Page = lazy(() => import('./components/UserPermissions2Page'));
const ChangePasswordPage = lazy(() => import('./components/ChangePasswordPage'));
const MyProfilePage = lazy(() => import('./components/MyProfilePage'));
const StudiosPage = lazy(() => import('./components/StudiosPage'));
const ChatPage = lazy(() => import('./components/ChatPage'));
const ChatPolicyAdmin = lazy(() => import('./components/ChatPolicyAdmin'));
const RoomControlPage = lazy(() => import('./components/RoomControlPage'));
const StorefrontPage = lazy(() => import('./components/StorefrontPage'));
const InventoryPage = lazy(() => import('./components/InventoryPage'));
const PhotographyPage = lazy(() => import('./components/PhotographyPage'));
const CategoriesPage = lazy(() => import('./components/CategoriesPage'));
const TransactionTypesPage = lazy(() => import('./components/TransactionTypesPage'));
const ExchangeRatesPage = lazy(() => import('./components/ExchangeRatesPage'));
const UtilityDashboard = lazy(() => import('./components/UtilityDashboard'));
const MembershipPage = lazy(() => import('./components/MembershipPage'));
const WalletPage = lazy(() => import('./components/WalletPage'));
const MasterSettingsPage = lazy(() => import('./components/MasterSettingsPage'));
const BirthdaysPage = lazy(() => import('./components/BirthdaysPage'));
const AttendancePage = lazy(() => import('./components/AttendancePage'));
const MonetizationPage = lazy(() => import('./components/MonetizationPage'));
const ContentSalesPage = lazy(() => import('./components/ContentSalesPage'));
const RemoteDesktopPage = lazy(() => import('./components/RemoteDesktopPage'));
const ShiftAssignmentPage = lazy(() => import('./components/ShiftAssignmentPage'));
const SubscriptionManagementPage = lazy(() => import('./components/SubscriptionManagementPage'));
const LocationsPage = lazy(() => import('./components/LocationsPage'));
const AdminDataPage = lazy(() => import('./components/AdminDataPage'));
const SubscriptionLockScreen = lazy(() => import('./components/SubscriptionLockScreen'));
const ScrapingPaginasPage = lazy(() => import('./components/ScrapingPaginasPage'));

export const PAGE_TO_PATH: Record<string, string> = {
  inicio: '/dashboard',
  myprofile: '/myprofile',
  change_password: '/change-password',
  recovery_password: '/recovery-password',
  auth_callback: '/auth/callback',
  monetizacion: '/monetizacion',
  venta_contenido: '/venta_contenido',
  asistencia: '/asistencia',
  cumpleanos: '/cumpleanos',
  membresia: '/membresia',
  billetera: '/billetera',
  usuarios: '/users',
  solicitudes: '/petitions',
  localizaciones: '/locations',
  admin_datos: '/admin_datos',
  chat: '/chat',
  chat_admin: '/chat_admin',
  control_cuartos: '/control_cuartos',
  tienda: '/tienda',
  inventario: '/inventario',
  fotografia: '/fotografia',
  utilidades: '/utilidades',
  liquidacion_modelos: '/liquidacion_modelos',
  studios_liquidation: '/studios_liquidation',
  estudios: '/studios',
  config_global: '/config_global',
  control_licencias: '/control_licencias',
  escritorio_remoto: '/escritorio_remoto',
  asignacion_turnos: '/asignacion_turnos',
  categories: '/categories',
  transactions_types: '/transactions_types',
  exchanges_rates: '/exchanges_rates',
  accounts: '/accounts',
  banks_accounts: '/banks_accounts',
  products: '/products',
  transactions: '/transactions',
  payments: '/payments',
  payments_files: '/payments_files',
  periods: '/periods',
  notifications: '/notifications',
  logs: '/logs',
  login_history: '/login_history',
  studios_rooms: '/studios_rooms',
  studios_shifts: '/studios_shifts',
  studios_accounts: '/studios_accounts',
  studios_models: '/studios_models',
  models_accounts: '/models_accounts',
  models_goals: '/models_goals',
  models_streams: '/models_streams',
  models_streams_customers: '/models_streams_customers',
  models_streams_files: '/models_streams_files',
  models_transactions: '/models_transactions',
  monitors: '/monitors',
  commissions: '/commissions',
  setup_commissions: '/setup_commissions',
  api_modules: '/api_modules',
  api_permissions: '/api_permissions',
  api_user_overrides: '/api_user_overrides',
  users2: '/users2',
  users_permissions2: '/users_permissions2',
  paysheet: '/paysheet',
  massive_liquidation: '/massive_liquidation',
  scraping_paginas: '/scraping_paginas',
};

export const PATH_ALIASES: Record<string, string> = {
  '/': '/dashboard',
  '/home': '/dashboard',
  '/models_liquidation': '/liquidacion_modelos',
};

const LEGACY_ROUTE_LABELS: Record<string, string> = {};

const RESOURCE_ROUTE_KEYS = new Set([
  'accounts',
  'banks_accounts',
  'products',
  'transactions',
  'payments',
  'payments_files',
  'periods',
  'notifications',
  'logs',
  'login_history',
  'studios_rooms',
  'studios_shifts',
  'studios_accounts',
  'studios_models',
  'models_accounts',
  'models_goals',
  'models_streams',
  'models_streams_customers',
  'models_streams_files',
  'models_transactions',
  'monitors',
  'commissions',
  'setup_commissions',
  'api_modules',
  'api_permissions',
  'api_user_overrides',
  'paysheet',
  'massive_liquidation',
]);

const renderLegacyPlaceholder = (title: string) => (
  <div className="p-8">
    <div className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex items-center gap-3 text-slate-900">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 font-black text-amber-600">
          !
        </div>
        <div>
          <p className="text-lg font-black">{title}</p>
          <p className="text-sm font-medium text-slate-500">
            Esta seccion esta en proceso de migracion a React. Estamos unificando toda la funcionalidad en un solo proyecto.
          </p>
        </div>
      </div>
    </div>
  </div>
);

export const normalizePath = (pathname: string) => {
  const trimmed = pathname.replace(/\/+$/, '') || '/';
  const aliasEntry = Object.entries(PATH_ALIASES).find(([prefix]) => {
    return trimmed === prefix || trimmed.startsWith(`${prefix}/`);
  });

  if (!aliasEntry) return trimmed;

  const [prefix, target] = aliasEntry;
  return trimmed.replace(prefix, target);
};

export const getPageFromPath = (pathname: string) => {
  const normalized = normalizePath(pathname);
  const match = Object.entries(PAGE_TO_PATH).find(([, path]) => {
    return normalized === path || normalized.startsWith(`${path}/`);
  });
  return match ? match[0] : 'inicio';
};

export const getLegacyLabel = (pathname: string) => {
  const normalized = normalizePath(pathname);
  const match = Object.entries(LEGACY_ROUTE_LABELS).find(([prefix]) => {
    return normalized === prefix || normalized.startsWith(`${prefix}/`);
  });
  return match ? match[1] : null;
};

type RenderAppPageProps = {
  currentPage: string;
  legacyLabel: string | null;
  isAdmin: boolean;
  subscriptionStatus: 'ACTIVE' | 'EXPIRED' | null;
  onNavigate: (id: string) => void;
  targetUserIdForProfile: number | null;
  onClearTargetUser: () => void;
};

export const renderAppPage = ({
  currentPage,
  legacyLabel,
  isAdmin,
  subscriptionStatus,
  onNavigate,
  targetUserIdForProfile,
  onClearTargetUser,
}: RenderAppPageProps) => {
  if (subscriptionStatus === 'EXPIRED') {
    if (currentPage === 'membresia') {
      return <MembershipPage />;
    }

    return <SubscriptionLockScreen onNavigateToPayment={() => onNavigate('membresia')} isExpired={true} />;
  }

  if (legacyLabel) {
    return renderLegacyPlaceholder(legacyLabel);
  }

  if (isAdminRoute(currentPage) && !isAdmin) {
    return (
      <div className="p-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8">
          <h2 className="text-lg font-black text-slate-900">Acceso restringido</h2>
          <p className="mt-2 text-sm text-slate-500">No tienes permisos para acceder a este modulo.</p>
        </div>
      </div>
    );
  }

  if (RESOURCE_ROUTE_KEYS.has(currentPage)) {
    return <ResourcePage resourceKey={currentPage} />;
  }

  switch (currentPage) {
    case 'inicio': return <Dashboard />;
    case 'monetizacion': return <MonetizationPage />;
    case 'venta_contenido': return <ContentSalesPage />;
    case 'escritorio_remoto': return <RemoteDesktopPage />;
    case 'asignacion_turnos': return <ShiftAssignmentPage />;
    case 'asistencia': return <AttendancePage />;
    case 'cumpleanos': return <BirthdaysPage />;
    case 'membresia': return <MembershipPage />;
    case 'billetera': return <WalletPage />;
    case 'usuarios': return <UsersPage targetUserId={targetUserIdForProfile} onClearTarget={() => onClearTargetUser()} />;
    case 'solicitudes': return <RequestsPage onNavigate={onNavigate} />;
    case 'localizaciones': return <LocationsPage />;
    case 'admin_datos': return <AdminDataPage />;
    case 'chat': return <ChatPage />;
    case 'chat_admin': return <ChatPolicyAdmin />;
    case 'control_cuartos': return <RoomControlPage />;
    case 'tienda': return <StorefrontPage />;
    case 'inventario': return <InventoryPage />;
    case 'fotografia': return <PhotographyPage />;
    case 'utilidades': return <UtilityDashboard />;
    case 'liquidacion_modelos': return <ModelPayrollPage />;
    case 'studios_liquidation': return <StudioLiquidationPage />;
    case 'estudios': return <StudiosPage />;
    case 'config_global': return <MasterSettingsPage />;
    case 'control_licencias': return <SubscriptionManagementPage />;
    case 'myprofile': return <MyProfilePage />;
    case 'change_password': return <ChangePasswordPage />;
    case 'categories': return <CategoriesPage />;
    case 'transactions_types': return <TransactionTypesPage />;
    case 'exchanges_rates': return <ExchangeRatesPage />;
    case 'users2': return <Users2Page />;
    case 'users_permissions2': return <UserPermissions2Page />;
    case 'scraping_paginas': return <ScrapingPaginasPage />;
    default: return <Dashboard />;
  }
};
