import {
  Home,
  Users,
  FileText,
  MapPin,
  Monitor,
  Settings,
  FileBarChart,
  MessageSquare,
  ShieldCheck,
  Key,
  ShoppingCart,
  Archive,
  Camera,
  CreditCard as PaymentIcon,
  Wallet,
  Cake,
  Clock,
  Share2,
  Banknote,
} from 'lucide-react';
import { SidebarSection, PricingTier, User, Room } from './types';

export const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    title: 'Generales',
    items: [
      { id: 'inicio', icon: Home, label: 'Inicio' },
      { id: 'usuarios', icon: Users, label: 'Usuarios' },
      { id: 'solicitudes', icon: FileText, label: 'Solicitudes' },
      { id: 'localizaciones', icon: MapPin, label: 'Localizaciones' },
      { id: 'asistencia', icon: Clock, label: 'Asistencia (ZK)' },
      { id: 'cumpleanos', icon: Cake, label: 'Cumpleanos' },
      { id: 'billetera', icon: Wallet, label: 'Billetera' },
    ],
  },
  {
    title: 'Tienda',
    items: [
      { id: 'tienda', icon: ShoppingCart, label: 'Tienda' },
      { id: 'inventario', icon: Archive, label: 'Inventario y Compras' },
    ],
  },
  {
    title: 'Modelos',
    items: [
      { id: 'estudios', icon: Monitor, label: 'Estudios' },
      { id: 'venta_contenido', icon: Share2, label: 'Venta de Contenido' },
      { id: 'monetizacion', icon: Banknote, label: 'Monetizacion' },
      { id: 'fotografia', icon: Camera, label: 'Fotografia' },
      { id: 'control_cuartos', icon: Key, label: 'Control de Cuartos' },
    ],
  },
  {
    title: 'Reportes',
    items: [
      { id: 'liquidacion_modelos', icon: FileBarChart, label: 'Liquidacion Modelos' },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { id: 'membresia', icon: PaymentIcon, label: 'Pagos / Membresia' },
      { id: 'chat', icon: MessageSquare, label: 'Chat Interno' },
      { id: 'chat_admin', icon: ShieldCheck, label: 'Politicas de Chat' },
      { id: 'config_global', icon: Settings, label: 'Configuracion Global' },
    ],
  },
];
// --- MOCK DATA ---

export const MOCK_USERS: User[] = [
    { 
        user_id: 3990, 
        user_name: 'Jennifer', 
        user_surname: 'Zuluaga', 
        user_email: 'jennifer@example.com', 
        user_identification: '12345678', 
        user_active: 1, 
        user_age: 25, 
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
        profile: { prof_id: 3, prof_name: 'MODELO' }
    },
    { 
        user_id: 3988, 
        user_name: 'Sofia', 
        user_surname: 'Mosquera', 
        user_email: 'sofia@example.com', 
        user_identification: '87654321', 
        user_active: 1, 
        profile: { prof_id: 2, prof_name: 'MONITOR' }
    },
    { 
        user_id: 3989, 
        user_name: 'Ana', 
        user_surname: 'Acero', 
        user_email: 'ana@example.com', 
        user_identification: '11223344', 
        user_active: 1, 
        profile: { prof_id: 3, prof_name: 'MODELO' }
    },
    {
        user_id: 1,
        user_name: 'Admin',
        user_surname: 'Castillo',
        user_email: 'admin@elcastillo.app',
        user_identification: '1144184353',
        user_active: 1,
        profile: { prof_id: 1, prof_name: 'ADMINISTRADOR' }
    }
];

export const MOCK_REQUESTS = [
    { id: '1', consecutive: '001', type: 'FOTO', user: 'Jennifer Zuluaga', status: 'ABIERTO', nick: 'jenniferz', page: 'OnlyFans', createdAt: '2025-05-20', updatedAt: '2025-05-21' },
    { id: '2', consecutive: '002', type: 'VIDEO', user: 'Ana Acero', status: 'EN PROCESO', nick: 'ana_acero', page: 'Camsoda', createdAt: '2025-05-22', updatedAt: '2025-05-22' }
];

export const MOCK_LOCATIONS = [
    { id: 'col', name: 'COLOMBIA', states: [
        { id: 'ant', name: 'ANTIOQUIA', cities: [{ id: 'med', name: 'MEDELLÍN' }] },
        { id: 'vac', name: 'VALLE DEL CAUCA', cities: [{ id: 'cal', name: 'CALI' }] }
    ]}
];

export const MOCK_PAYROLL = [
    { id: '1', modelName: 'Jennifer Zuluaga', studio: 'Red Dreams', usd: 1200, eur: 0, copConversion: 4800000, discounts: 200000, netTotal: 4600000, retefuente: 0, totalPayable: 4600000, status: 'PENDIENTE' },
    { id: '2', modelName: 'Ana Acero', studio: 'Red Dreams', usd: 800, eur: 0, copConversion: 3200000, discounts: 50000, netTotal: 3150000, retefuente: 0, totalPayable: 3150000, status: 'PAGADO' }
];

export const MOCK_ROOMS: Room[] = [
    { id: 'r1', code: 'H-101', type: 'Standard', status: 'ACTIVE', inventory: [], incidents_count: 0 },
    { id: 'r2', code: 'H-102', type: 'Premium', status: 'ACTIVE', inventory: [], incidents_count: 0 }
];

export const MOCK_CHAT_ROLES = [
    { id: 1, name: 'ADMINISTRADOR' },
    { id: 2, name: 'MONITOR' },
    { id: 3, name: 'MODELO' },
    { id: 5, name: 'SOPORTE' }
];

export const SUBSCRIPTION_TIERS: PricingTier[] = [
    { id: 't1', name: 'Plan Fortaleza', min: 1, max: 10, monthly_price: 49, annual_price: 490 },
    { id: 't2', name: 'Plan Ciudadela', min: 11, max: 50, monthly_price: 99, annual_price: 990 },
    { id: 't3', name: 'Plan Imperio', min: 51, max: 1000, monthly_price: 199, annual_price: 1990 }
];

