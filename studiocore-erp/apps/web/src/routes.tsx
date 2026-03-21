import type { LucideIcon } from 'lucide-react';
import {
  Banknote,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  Building,
  CalendarCheck2,
  CalendarClock,
  CalendarX2,
  Clock3,
  FileText,
  Fingerprint,
  Gavel,
  HeartPulse,
  LayoutDashboard,
  Plane,
  Target,
  Shield,
  ShieldCheck,
  Sparkles,
  UserCog,
  Users2,
} from 'lucide-react';

export type NavItem = {
  label: string;
  to: string;
  description: string;
  icon: LucideIcon;
  permission?: string;
};

export const navSections: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'Core',
    items: [
      {
        label: 'Dashboard',
        to: '/dashboard',
        description: 'Resumen ejecutivo del bootstrap, salud del API y contexto tenant.',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'Organizacion',
    items: [
      {
        label: 'Empresas',
        to: '/companies',
        description: 'Gobierno de la empresa activa y sus datos canonicos.',
        icon: Building2,
        permission: 'companies.view',
      },
      {
        label: 'Sedes',
        to: '/branches',
        description: 'Sedes visibles bajo la empresa activa.',
        icon: Building,
        permission: 'branches.view',
      },
      {
        label: 'Personas',
        to: '/people',
        description: 'Registro canonico inicial de personas, modelos y staff.',
        icon: Users2,
        permission: 'people.view',
      },
      {
        label: 'Modelos',
        to: '/models',
        description: 'Listado y detalle especializado para modelos sobre el nucleo de people.',
        icon: Sparkles,
        permission: 'models.view',
      },
      {
        label: 'Staff',
        to: '/staff',
        description: 'Listado y detalle especializado para administrativos y equipo interno.',
        icon: BriefcaseBusiness,
        permission: 'staff.view',
      },
      {
        label: 'Catalogos',
        to: '/catalogs',
        description: 'Listados canonicos reutilizados por people, contratos y documentos.',
        icon: BookOpen,
        permission: 'catalogs.view',
      },
    ],
  },
  {
    title: 'IAM',
    items: [
      {
        label: 'Usuarios',
        to: '/users',
        description: 'Usuarios, alcance tenant y superficie de permisos.',
        icon: UserCog,
        permission: 'users.view',
      },
      {
        label: 'Roles',
        to: '/roles',
        description: 'Roles operativos y paquetes de permisos por empresa.',
        icon: ShieldCheck,
        permission: 'roles.view',
      },
      {
        label: 'Permisos',
        to: '/permissions',
        description: 'Catalogo y matriz de permisos base de fase 0.',
        icon: Shield,
        permission: 'permissions.view',
      },
      {
        label: 'Auditoria',
        to: '/audit',
        description: 'Eventos sensibles versionados por modulo y actor.',
        icon: Fingerprint,
        permission: 'audit.view',
      },
    ],
  },
  {
    title: 'Operacion',
    items: [
      {
        label: 'Turnos',
        to: '/operations',
        description: 'Agenda operativa por sede, persona y plataforma.',
        icon: CalendarClock,
        permission: 'operations.view',
      },
      {
        label: 'Asistencia',
        to: '/attendance',
        description: 'Registro manual de asistencia enlazado a turnos o eventos libres.',
        icon: CalendarCheck2,
        permission: 'attendance.view',
      },
      {
        label: 'Inasistencias',
        to: '/absences',
        description: 'Ausencias reportadas, aprobadas o rechazadas por sede y persona.',
        icon: CalendarX2,
        permission: 'absences.view',
      },
      {
        label: 'Metas',
        to: '/goals',
        description: 'Metas y bonos base por periodo, persona o turno.',
        icon: Target,
        permission: 'goals.view',
      },
      {
        label: 'Tiempo en linea',
        to: '/online-time',
        description: 'Sesiones online por persona, turno, plataforma y monetizacion base.',
        icon: Clock3,
        permission: 'online_time.view',
      },
    ],
  },
  {
    title: 'Nomina',
    items: [
      {
        label: 'Periodos',
        to: '/payroll',
        description: 'Periodos base con calculo, cierre y reapertura sobre datos operativos.',
        icon: Banknote,
        permission: 'payroll.view',
      },
      {
        label: 'Novedades',
        to: '/payroll-novelties',
        description: 'Bonos, deducciones y eventos criticos vinculados al periodo.',
        icon: FileText,
        permission: 'payroll_novelties.view',
      },
    ],
  },
  {
    title: 'RRHH',
    items: [
      {
        label: 'Incapacidades',
        to: '/hr/incapacities',
        description: 'Casos medicos con soporte y sincronizacion base a nomina.',
        icon: HeartPulse,
        permission: 'hr.view',
      },
      {
        label: 'Vacaciones',
        to: '/hr/vacations',
        description: 'Solicitudes de descanso con aprobacion y enlace a nomina.',
        icon: Plane,
        permission: 'hr.view',
      },
      {
        label: 'Disciplina',
        to: '/hr/discipline',
        description: 'Llamados y sanciones con soporte e impacto opcional a nomina.',
        icon: Gavel,
        permission: 'hr.view',
      },
    ],
  },
  {
    title: 'Finanzas',
    items: [
      {
        label: 'Cuentas',
        to: '/finance/accounts',
        description: 'Cuentas bancarias y cajas menores de la empresa.',
        icon: Building2,
        permission: 'finance.view',
      },
      {
        label: 'Transacciones',
        to: '/finance/transactions',
        description: 'Historial de movimientos, ingresos y egresos registrados.',
        icon: Banknote,
        permission: 'finance.view',
      },
      {
        label: 'Reportes',
        to: '/finance/reports',
        description: 'Conciliacion operativa, balances y flujo consolidado por rango.',
        icon: FileText,
        permission: 'finance.view',
      },
    ],
  },
];

export const navItems = navSections.flatMap((section) => section.items);

export function getActiveNavItem(pathname: string) {
  return navItems.find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`));
}
