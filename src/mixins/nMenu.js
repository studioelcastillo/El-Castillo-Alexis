// /////////////// //
// NAVIGATION MENU //
// /////////////// //

var nMenu = [
  // {
  //   title: 'Docs',
  //   caption: 'quasar.dev',
  //   icon: 'school',
  //   link: 'https://quasar.dev'
  // },
  // {
  //   title: 'Github',
  //   caption: 'github.com/quasarframework',
  //   icon: 'code',
  //   link: 'https://github.com/quasarframework'
  // },
  // {
  //   title: 'Discord Chat Channel',
  //   caption: 'chat.quasar.dev',
  //   icon: 'chat',
  //   link: 'https://chat.quasar.dev'
  // },
  // {
  //   title: 'Forum',
  //   caption: 'forum.quasar.dev',
  //   icon: 'record_voice_over',
  //   link: 'https://forum.quasar.dev'
  // },
  // {
  //   title: 'Twitter',
  //   caption: '@quasarframework',
  //   icon: 'rss_feed',
  //   link: 'https://twitter.quasar.dev'
  // },
  // {
  //   title: 'Facebook',
  //   caption: '@QuasarFramework',
  //   icon: 'public',
  //   link: 'https://facebook.quasar.dev'
  // },
  // {
  //   title: 'Quasar Awesome',
  //   caption: 'Community Quasar projects',
  //   icon: 'favorite',
  //   link: 'https://awesome.quasar.dev'
  // },
  {
    title: 'Inicio',
    group: 'generals',
    // caption: 'quasar.dev',
    icon: 'home',
    link: 'dashboard',
  },
  {
    title: 'Dashboard Clasico',
    group: 'generals',
    icon: 'space_dashboard',
    link: 'home',
  },
  {
    title: 'Usuarios',
    group: 'generals',
    // caption: 'github.com/quasarframework',
    icon: 'supervisor_account',
    link: 'users',
    gate: 'menu-users',
  },
  {
    title: 'Mi Perfil',
    group: 'generals',
    // caption: 'github.com/quasarframework',
    icon: 'supervisor_account',
    link: 'myprofile',
    gate: 'myprofile',
  },
  {
    title: 'Solicitudes',
    group: 'generals',
    // caption: 'github.com/quasarframework',
    icon: 'fact_check',
    link: 'petitions',
    gate: 'petitions',
  },
  {
    title: 'Localizaciones',
    group: 'generals',
    icon: 'map',
    link: 'locations',
    gate: 'locations',
  },
  {
    title: 'Notificaciones',
    group: 'system',
    // caption: 'github.com/quasarframework',
    icon: 'notifications',
    link: 'notifications'
  },
  {
    title: 'Log',
    group: 'system',
    // caption: 'github.com/quasarframework',
    icon: 'compare_arrows',
    link: 'logs',
    gate: 'menu-logs',
  },
  {
    title: 'Categorías',
    group: 'shop',
    // caption: 'github.com/quasarframework',
    icon: 'ballot',
    link: 'categories',
    gate: 'menu-categories',
  },
  {
    title: 'Tasas de cambio',
    group: 'generals',
    // caption: 'github.com/quasarframework',
    icon: 'currency_exchange',
    link: 'exchanges_rates',
    gate: 'menu-exchanges_rates',
  },
  {
    title: 'Cuentas',
    group: 'generals',
    // caption: 'github.com/quasarframework',
    icon: 'account_balance',
    link: 'accounts',
    gate: 'accounts',
  },
  {
    title: 'Estudios',
    group: 'models',
    // caption: 'github.com/quasarframework',
    icon: 'real_estate_agent',
    link: 'studios',
    gate: 'menu-studios',
  },
  {
    title: 'Tipos de transferencias',
    group: 'generals',
    // caption: 'github.com/quasarframework',
    icon: 'payments',
    link: 'transactions_types',
    gate: 'menu-transactions_types',
  },
  {
    title: 'Productos',
    group: 'shop',
    // caption: 'github.com/quasarframework',
    icon: 'shopping_bag',
    link: 'products',
    gate: 'menu-products',
  },
  // {
  //   title: 'Cuartos',
  //   group: 'models',
  //   // caption: 'github.com/quasarframework',
  //   icon: 'meeting_room',
  //   link: 'studios_rooms',
  //   gate: 'menu-studios_rooms',
  // },
  /*{
    title: 'Modelos',
    group: 'models',
    // caption: 'github.com/quasarframework',
    icon: 'face_3',
    link: 'studios_models',
    gate: 'menu-studios_models',
  },
  {
    title: 'Cuentas',
    group: 'models',
    // caption: 'github.com/quasarframework',
    icon: 'face_3',
    link: 'models_accounts',
    gate: 'menu-models_accounts',
  },*/
  // {
  //   title: 'Metas',
  //   group: 'models',
  //   // caption: 'github.com/quasarframework',
  //   icon: 'sports_score',
  //   link: 'models_goals',
  //   gate: 'menu-models_goals',
  // },
  // {
  //   title: 'Transacciones',
  //   group: 'models',
  //   // caption: 'github.com/quasarframework',
  //   icon: 'payments',
  //   link: 'models_transactions',
  //   gate: 'menu-models_transactions',
  // },
  // {
  //   title: 'Streams',
  //   group: 'models',
  //   // caption: 'github.com/quasarframework',
  //   icon: 'stream',
  //   link: 'models_streams',
  //   gate: 'menu-models_streams',
  // },
  {
    title: 'Clientes',
    group: 'models',
    // caption: 'github.com/quasarframework',
    icon: 'group',
    link: 'models_streams_customers',
    gate: 'menu-models_streams_customers',
  },
  {
    title: 'Cargue de Streams',
    group: 'models',
    // caption: 'github.com/quasarframework',
    icon: 'upload_file',
    link: 'massive_liquidation',
    gate: 'menu-massive_liquidation',
  },
  {
    title: 'Periodos',
    group: 'reports',
    // caption: 'github.com/quasarframework',
    icon: 'calendar_month',
    link: 'periods',
    gate: 'menu-periods',
  },
  {
    title: 'Liquidación de modelos',
    group: 'reports',
    // caption: 'github.com/quasarframework',
    icon: 'query_stats',
    link: 'models_liquidation',
    gate: 'menu-models_liquidation',
  },
  {
    title: 'Liquidación de estudios',
    group: 'reports',
    // caption: 'github.com/quasarframework',
    icon: 'query_stats',
    link: 'studios_liquidation',
    gate: 'menu-studios_liquidation',
  },
  {
    title: 'Historial de sesiones',
    group: 'system',
    // caption: 'github.com/quasarframework',
    icon: 'manage_search',
    link: 'login_history',
    gate: 'login_history',
  },
  {
    title: 'Configurar Comisiones',
    group: 'commissions',
    // caption: 'github.com/quasarframework',
    icon: 'attach_money',
    link: 'setup_commissions',
    gate: 'menu-setup_commissions'
  },
  {
    title: 'Comisiones',
    group: 'commissions',
    // caption: 'github.com/quasarframework',
    icon: 'account_tree',
    link: 'commissions',
    gate: 'menu-commission_tree'
  },
  {
    title: 'Nomina',
    group: 'reports',
    // caption: 'github.com/quasarframework',
    icon: 'query_stats',
    link: 'paysheet',
    gate: 'menu-paysheet'
  },
]

export { nMenu }
