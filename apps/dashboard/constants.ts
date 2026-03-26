
import {
  Home, Users, FileText, MapPin, DollarSign, CreditCard,
  ArrowLeftRight, ShoppingBag, LayoutGrid, Monitor, Video,
  Settings, PieChart, Calendar, Award, Activity, Bell, List, UserPlus,
  FileBarChart, Briefcase, MessageSquare, ShieldCheck, Megaphone,
  FileJson, Zap, BookOpen, Key, ShoppingCart, Archive, Package, Camera, Image,
  CreditCard as PaymentIcon, Wallet, Cake, Clock, Share2, Banknote,
  History, UploadCloud, Database, Globe, ClipboardList
} from 'lucide-react';
import { SidebarSection, PricingTier, User, Room } from './types';

export const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    title: "General",
    items: [
      { id: 'inicio', icon: Home, label: "Inicio" },
      { id: 'monetizacion', icon: Banknote, label: "Monetización" },
      { id: 'venta_contenido', icon: Share2, label: "Venta de Contenido" },
      { id: 'asistencia', icon: Clock, label: "Asistencia (ZK)" },
      { id: 'cumpleanos', icon: Cake, label: "Cumpleaños" },
      { id: 'membresia', icon: PaymentIcon, label: "Pagos / Membresía" },
      { id: 'billetera', icon: Wallet, label: "Billetera" },
      { id: 'usuarios', icon: Users, label: "Usuarios" },
      { id: 'solicitudes', icon: FileText, label: "Solicitudes" },
      { id: 'localizaciones', icon: MapPin, label: "Localizaciones" },
    ]
  },
  {
    title: "Operativo",
    items: [
      { id: 'fotografia', icon: Camera, label: "Fotografía" },
      { id: 'control_cuartos', icon: Key, label: "Control de Cuartos" },
      { id: 'escritorio_remoto', icon: Monitor, label: "Acceso Remoto" },
      { id: 'asignacion_turnos', icon: Calendar, label: "Asignación de Modelos y Turnos" },
      { id: 'tienda', icon: ShoppingCart, label: "Tienda" },
      { id: 'inventario', icon: Archive, label: "Inventario y Compras" },
      { id: 'chat', icon: MessageSquare, label: "Chat Interno" },
    ]
  },
  {
    title: "Administración",
    items: [
      { id: 'utilidades', icon: PieChart, label: "Control de Utilidades" },
      { id: 'estudios', icon: Monitor, label: "Estudios" },
      { id: 'chat_admin', icon: ShieldCheck, label: "Políticas de Chat" },
      { id: 'config_global', icon: Settings, label: "Configuración Global" },
      { id: 'control_licencias', icon: Award, label: "Control de Licencias" },
      { id: 'admin_datos', icon: Database, label: "Admin Datos" }
    ]
  },
  {
    title: "Finanzas",
    items: [
      { id: 'accounts', icon: Briefcase, label: "Cuentas Contables" },
      { id: 'banks_accounts', icon: CreditCard, label: "Cuentas Bancarias" },
      { id: 'products', icon: ShoppingBag, label: "Productos" },
      { id: 'transactions', icon: ArrowLeftRight, label: "Transacciones" },
      { id: 'payments', icon: PaymentIcon, label: "Pagos" },
      { id: 'payments_files', icon: Archive, label: "Archivos de Pago" },
      { id: 'periods', icon: Calendar, label: "Periodos" },
      { id: 'paysheet', icon: FileBarChart, label: "Nomina" },
      { id: 'categories', icon: List, label: "Categorias" },
      { id: 'transactions_types', icon: ArrowLeftRight, label: "Tipos de Transferencia" },
      { id: 'exchanges_rates', icon: ArrowLeftRight, label: "Tasas de Cambio" },
    ]
  },
  {
    title: "Estudios",
    items: [
      { id: 'studios_rooms', icon: Key, label: "Cuartos" },
      { id: 'studios_shifts', icon: Clock, label: "Turnos" },
      { id: 'studios_accounts', icon: CreditCard, label: "Cuentas Estudio" },
      { id: 'studios_models', icon: Users, label: "Contratos" },
    ]
  },
  {
    title: "Modelos",
    items: [
      { id: 'models_accounts', icon: UserPlus, label: "Cuentas Modelos" },
      { id: 'models_goals', icon: Award, label: "Metas" },
      { id: 'models_streams', icon: Video, label: "Streams" },
      { id: 'models_streams_customers', icon: Users, label: "Clientes Stream" },
      { id: 'models_streams_files', icon: FileText, label: "Archivos Stream" },
      { id: 'models_transactions', icon: DollarSign, label: "Transacciones" },
    ]
  },
  {
    title: "Sistema",
    items: [
      { id: 'notifications', icon: Bell, label: "Notificaciones" },
      { id: 'logs', icon: FileText, label: "Logs" },
      { id: 'login_history', icon: History, label: "Historial Sesiones" },
      { id: 'api_modules', icon: FileJson, label: "Modulos API" },
      { id: 'api_permissions', icon: ShieldCheck, label: "Permisos API" },
      { id: 'api_user_overrides', icon: ShieldCheck, label: "Overrides API" },
      { id: 'setup_commissions', icon: Settings, label: "Config Comisiones" },
      { id: 'commissions', icon: DollarSign, label: "Comisiones" },
      { id: 'monitors', icon: Users, label: "Monitores" },
      { id: 'massive_liquidation', icon: UploadCloud, label: "Liquidacion Masiva" },
      { id: 'users2', icon: Users, label: "Usuarios (Legacy)" },
      { id: 'users_permissions2', icon: ShieldCheck, label: "Permisos Usuarios" },
    ]
  },
  {
    title: "Reportes",
    items: [
      { id: 'liquidacion_modelos', icon: FileBarChart, label: "Liquidación Modelos" },
      { id: 'studios_liquidation', icon: FileBarChart, label: "Liquidación Estudios" },
    ]
  },
  {
    title: "Herramientas",
    items: [
      { id: 'panel_vps', icon: Globe, label: "Panel VPS / Scrapers" },
      { id: 'scraping_paginas', icon: Globe, label: "Extracciones" },
      { id: 'supervision_tareas', icon: ClipboardList, label: "Supervisión de Tareas" },
      { id: 'gestion_pseudonimos', icon: Key, label: "Gestión de Pseudónimos" },
      { id: 'terceros', icon: Users, label: "Terceros" },
      { id: 'metas_bonos', icon: Award, label: "Metas Bonos" },
      { id: 'nomina_sugerida', icon: FileBarChart, label: "Nómina Sugerida" },
    ]
  }
];

// --- MOCK DATA REMOVED ---
// All functional modules (Locations, Petitions, Inventory, Payroll, Users)
// now use real data from Supabase or the Backend API.

export const SUBSCRIPTION_TIERS: PricingTier[] = [
    { id: 't1', name: '1 a 15 Licencias', min: 1, max: 15, monthly_price: 45, annual_price: 490 },
    { id: 't2', name: '16 a 30 Licencias', min: 16, max: 30, monthly_price: 80, annual_price: 900 },
    { id: 't3', name: '31 a 50 Licencias', min: 31, max: 50, monthly_price: 100, annual_price: 1100 },
    { id: 't4', name: '51 a 100 Licencias', min: 51, max: 100, monthly_price: 120, annual_price: 1390 },
    { id: 't5', name: '101 a 150 Licencias', min: 101, max: 150, monthly_price: 150, annual_price: 1700 },
    { id: 't6', name: '151 a 200 Licencias', min: 151, max: 200, monthly_price: 200, annual_price: 2200 },
    { id: 't7', name: '201 a 250 Licencias', min: 201, max: 250, monthly_price: 250, annual_price: 2800 },
    { id: 't8', name: '251 a 300 Licencias', min: 251, max: 300, monthly_price: 290, annual_price: 3300 },
    { id: 't9', name: 'Más de 300 Licencias', min: 301, max: 9999, monthly_price: 0, annual_price: 0 }
];
