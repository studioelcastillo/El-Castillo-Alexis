const prefix = "El Castillo";
const routes = [
  // original use quasar
  // {
  //   path: '/',
  //   component: () => import('layouts/MainLayout.vue'),
  //   children: [
  //     { path: '', component: () => import('pages/IndexPage.vue') }
  //   ]
  // },
  {
    name: "",
    path: "/",
    redirect: (to, from, next) => {
      if (localStorage.getItem("user")) {
        return "/dashboard";
      } else {
        return "/login";
      }
    },
  },
  {
    name: "login",
    path: "/login",
    component: () => import("layouts/AuthLayout.vue"),
    children: [
      {
        name: "login",
        path: "",
        component: () => import("pages/Login.vue"),
        props: { view: "abc" },
      },
    ],
    meta: {
      title: prefix + " | Inicia sesión",
    },
  },
  {
    name: "auth-callback",
    path: "/auth/callback",
    component: () => import("pages/AuthCallback.vue"),
    meta: {
      title: prefix + " | Autenticando...",
    },
  },
  {
    name: "logout", // see src/router/index.js to see how works
    path: "/logout",
    meta: {
      requiresSession: true,
    },
  },
  {
    name: "recovery-password",
    path: "/recovery-password",
    component: () => import("layouts/AuthLayout.vue"),
    children: [
      {
        name: "recovery-password",
        path: "",
        component: () => import("pages/RecoveryPassword.vue"),
      },
      {
        name: "recovery-password-change",
        path: ":u/:t",
        component: () => import("pages/RecoveryPassword.vue"),
      },
    ],
    meta: {
      title: prefix + " | Recuperar contraseña",
    },
  },
  {
    name: "change-password",
    path: "/change-password",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        name: "change-password",
        path: "",
        component: () => import("pages/ChangePasswordForm.vue"),
      },
    ],
    meta: {
      title: prefix + " | Cambiar contraseña",
      requiresSession: true,
    },
  },
  {
    name: "home",
    path: "/home",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        name: "home",
        path: "",
        component: () => import("pages/Dashboard.vue"),
      },
      {
        name: "show-as-user",
        path: "as/:id",
        component: () => import("pages/Dashboard.vue"),
        props: { modeprop: "as" },
      },
    ],
    meta: {
      title: prefix + " | Dashboard Clasico",
      requiresSession: true,
    },
  },
  {
    name: "dashboard-react",
    path: "/dashboard",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        name: "dashboard-react",
        path: "",
        component: () => import("pages/DashboardReact.vue"),
      },
    ],
    meta: {
      title: prefix + " | Dashboard",
      requiresSession: true,
    },
  },
  {
    name: "users",
    path: "/users",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        name: "users",
        path: "",
        component: () => import("pages/User/Users.vue"),
      },
      {
        name: "new-users",
        path: "new",
        component: () => import("pages/User/UserForm.vue"),
        props: { modeprop: "create" },
      },
      {
        name: "edit-users",
        path: "edit/:id",
        component: () => import("pages/User/UserForm.vue"),
        props: { modeprop: "edit" },
      },
      {
        name: "show-users",
        path: "show/:id",
        component: () => import("pages/User/UserForm.vue"),
        props: { modeprop: "show" },
      },
    ],
    meta: {
      title: prefix + " | Usuarios",
      requiresSession: true,
    },
  },
  {
    name: "myprofile",
    path: "/myprofile",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        name: "myprofile",
        path: "",
        component: () => import("pages/User/UserForm.vue"),
        props: { modeprop: "edit-myprofile" },
      },
    ],
    meta: {
      title: prefix + " | Usuarios",
      requiresSession: true,
    },
  },
  {
    name: "petitions",
    path: "/petitions",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        name: "petitions",
        path: "",
        component: () => import("pages/Petitions/Petitions.vue"),
      },
      {
        name: "new-petition",
        path: "new",
        component: () => import("pages/Petitions/PetitionForm.vue"),
        props: { modeprop: "create" },
      },
      {
        name: "show-petition",
        path: "show/:id",
        component: () => import("pages/Petitions/PetitionForm.vue"),
        props: { modeprop: "show" },
      },
      {
        name: "edit-petition",
        path: "edit/:id",
        component: () => import("pages/Petitions/PetitionForm.vue"),
        props: { modeprop: "edit" },
      },
    ],
    meta: {
      title: prefix + " | Solicitudes",
      requiresSession: true,
    },
  },
  {
    name: "banks_accounts",
    path: "/banks_accounts",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        name: "banks_accounts",
        path: "",
        component: () => import("pages/BankAccount/BanksAccounts.vue"),
      },
      {
        name: "new-banks_accounts",
        path: "new",
        component: () => import("pages/BankAccount/BankAccountForm.vue"),
        props: { modeprop: "create" },
      },
      {
        name: "edit-banks_accounts",
        path: "edit/:id",
        component: () => import("pages/BankAccount/BankAccountForm.vue"),
        props: { modeprop: "edit" },
      },
      {
        name: "show-banks_accounts",
        path: "show/:id",
        component: () => import("pages/BankAccount/BankAccountForm.vue"),
        props: { modeprop: "show" },
      },
    ],
    meta: {
      title: prefix + " | Cuentas bancarias",
      requiresSession: true,
    },
  },
  {
    name: "categories",
    path: "/categories",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        name: "categories",
        path: "",
        component: () => import("pages/Category/Categories.vue"),
      },
      {
        name: "new-categories",
        path: "new",
        component: () => import("pages/Category/CategoryForm.vue"),
        props: { modeprop: "create" },
      },
      {
        name: "edit-categories",
        path: "edit/:id",
        component: () => import("pages/Category/CategoryForm.vue"),
        props: { modeprop: "edit" },
      },
      {
        name: "show-categories",
        path: "show/:id",
        component: () => import("pages/Category/CategoryForm.vue"),
        props: { modeprop: "show" },
      },
    ],
    meta: {
      title: prefix + " | Categorías",
      requiresSession: true,
    },
  },
  {
    name: "exchanges_rates",
    path: "/exchanges_rates",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        name: "exchanges_rates",
        path: "",
        component: () => import("pages/ExchangeRate/ExchangesRates.vue"),
      },
      {
        name: "new-exchanges_rates",
        path: "new",
        component: () => import("pages/ExchangeRate/ExchangeRateForm.vue"),
        props: { modeprop: "create" },
      },
      {
        name: "edit-exchanges_rates",
        path: "edit/:id",
        component: () => import("pages/ExchangeRate/ExchangeRateForm.vue"),
        props: { modeprop: "edit" },
      },
      {
        name: "show-exchanges_rates",
        path: "show/:id",
        component: () => import("pages/ExchangeRate/ExchangeRateForm.vue"),
        props: { modeprop: "show" },
      },
    ],
    meta: {
      title: prefix + " | Tasas de cambio",
      requiresSession: true,
    },
  },
  {
    name: "models_accounts",
    path: "/models_accounts",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        name: "models_accounts",
        path: "",
        component: () => import("pages/ModelAccount/ModelsAccounts.vue"),
      },
      {
        name: "new-models_accounts",
        path: "new",
        component: () => import("pages/ModelAccount/ModelAccountForm.vue"),
        props: { modeprop: "create" },
      },
      {
        name: "edit-models_accounts",
        path: "edit/:id",
        component: () => import("pages/ModelAccount/ModelAccountForm.vue"),
        props: { modeprop: "edit" },
      },
      {
        name: "show-models_accounts",
        path: "show/:id",
        component: () => import("pages/ModelAccount/ModelAccountForm.vue"),
        props: { modeprop: "show" },
      },
    ],
    meta: {
      title: prefix + " | Cuentas",
      requiresSession: true,
    },
  },
  {
    name: "models_goals",
    path: "/models_goals",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        name: "models_goals",
        path: "",
        component: () => import("pages/ModelGoal/ModelsGoals.vue"),
      },
      {
        name: "new-models_goals",
        path: "new",
        component: () => import("pages/ModelGoal/ModelGoalForm.vue"),
        props: { modeprop: "create" },
      },
      {
        name: "edit-models_goals",
        path: "edit/:id",
        component: () => import("pages/ModelGoal/ModelGoalForm.vue"),
        props: { modeprop: "edit" },
      },
      {
        name: "show-models_goals",
        path: "show/:id",
        component: () => import("pages/ModelGoal/ModelGoalForm.vue"),
        props: { modeprop: "show" },
      },
    ],
    meta: {
      title: prefix + " | Metas",
      requiresSession: true,
    },
  },
  {
    name: "models_streams",
    path: "/models_streams",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        name: "models_streams",
        path: "",
        component: () => import("pages/ModelStream/ModelsStreams.vue"),
      },
      {
        name: "new-models_streams",
        path: "new",
        component: () => import("pages/ModelStream/ModelStreamForm.vue"),
        props: { modeprop: "create" },
      },
      {
        name: "edit-models_streams",
        path: "edit/:id",
        component: () => import("pages/ModelStream/ModelStreamForm.vue"),
        props: { modeprop: "edit" },
      },
      {
        name: "show-models_streams",
        path: "show/:id",
        component: () => import("pages/ModelStream/ModelStreamForm.vue"),
        props: { modeprop: "show" },
      },
    ],
    meta: {
      title: prefix + " | Streams",
      requiresSession: true,
    },
  },
  {
    name: "models_streams_customers",
    path: "/models_streams_customers",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        name: "models_streams_customers",
        path: "",
        component: () =>
          import("pages/ModelStreamCustomer/ModelsStreamsCustomers.vue"),
      },
      {
        name: "new-models_streams_customers",
        path: "new",
        component: () =>
          import("pages/ModelStreamCustomer/ModelStreamCustomerForm.vue"),
        props: { modeprop: "create" },
      },
      {
        name: "edit-models_streams_customers",
        path: "edit/:id",
        component: () =>
          import("pages/ModelStreamCustomer/ModelStreamCustomerForm.vue"),
        props: { modeprop: "edit" },
      },
      {
        name: "show-models_streams_customers",
        path: "show/:id",
        component: () =>
          import("pages/ModelStreamCustomer/ModelStreamCustomerForm.vue"),
        props: { modeprop: "show" },
      },
    ],
    meta: {
      title: prefix + " | Clientes",
      requiresSession: true,
    },
  },
  {
    name: "models_streams_files",
    path: "/models_streams_files",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        name: "models_streams_files",
        path: "",
        component: () => import("pages/ModelStreamFile/ModelsStreamsFiles.vue"),
      },
      {
        name: "new-models_streams_files",
        path: "new",
        component: () =>
          import("pages/ModelStreamFile/ModelStreamFileForm.vue"),
        props: { modeprop: "create" },
      },
      {
        name: "edit-models_streams_files",
        path: "edit/:id",
        component: () =>
          import("pages/ModelStreamFile/ModelStreamFileForm.vue"),
        props: { modeprop: "edit" },
      },
      {
        name: "show-models_streams_files",
        path: "show/:id",
        component: () =>
          import("pages/ModelStreamFile/ModelStreamFileForm.vue"),
        props: { modeprop: "show" },
      },
    ],
    meta: {
      title: prefix + " | Cargues de streams",
      requiresSession: true,
    },
  },
  {
    name: "models_transactions",
    path: "/models_transactions",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        name: "models_transactions",
        path: "",
        component: () =>
          import("pages/ModelTransaction/ModelsTransactions.vue"),
      },
      {
        name: "new-models_transactions",
        path: "new",
        component: () =>
          import("pages/ModelTransaction/ModelTransactionForm.vue"),
        props: { modeprop: "create" },
      },
      {
        name: "edit-models_transactions",
        path: "edit/:id",
        component: () =>
          import("pages/ModelTransaction/ModelTransactionForm.vue"),
        props: { modeprop: "edit" },
      },
      {
        name: "show-models_transactions",
        path: "show/:id",
        component: () =>
          import("pages/ModelTransaction/ModelTransactionForm.vue"),
        props: { modeprop: "show" },
      },
    ],
    meta: {
      title: prefix + " | Transacciones",
      requiresSession: true,
    },
  },
  {
    name: "transactions",
    path: "/transactions",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        name: "transactions",
        path: "",
        component: () => import("pages/Transaction/Transactions.vue"),
      },
      {
        name: "new-transactions",
        path: "new",
        component: () => import("pages/Transaction/TransactionForm.vue"),
        props: { modeprop: "create" },
      },
      {
        name: "edit-transactions",
        path: "edit/:id",
        component: () => import("pages/Transaction/TransactionForm.vue"),
        props: { modeprop: "edit" },
      },
      {
        name: "show-transactions",
        path: "show/:id",
        component: () => import("pages/Transaction/TransactionForm.vue"),
        props: { modeprop: "show" },
      },
    ],
    meta: {
      title: prefix + " | Transacciones",
      requiresSession: true,
    },
  },
  {
    name: "payments",
    path: "/payments",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        name: "payments",
        path: "",
        component: () => import("pages/Payment/Payments.vue"),
      },
      {
        name: "new-payments",
        path: "new",
        component: () => import("pages/Payment/PaymentForm.vue"),
        props: { modeprop: "create" },
      },
      {
        name: "edit-payments",
        path: "edit/:id",
        component: () => import("pages/Payment/PaymentForm.vue"),
        props: { modeprop: "edit" },
      },
      {
        name: "show-payments",
        path: "show/:id",
        component: () => import("pages/Payment/PaymentForm.vue"),
        props: { modeprop: "show" },
      },
    ],
    meta: {
      title: prefix + " | Pagos",
      requiresSession: true,
    },
  },
  {
    name: "payments_files",
    path: "/payments_files",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        name: "payments_files",
        path: "",
        component: () => import("pages/PaymentFile/PaymentsFiles.vue"),
      },
      {
        name: "new-payments_files",
        path: "new",
        component: () => import("pages/PaymentFile/PaymentFileForm.vue"),
        props: { modeprop: "create" },
      },
      {
        name: "edit-payments_files",
        path: "edit/:id",
        component: () => import("pages/PaymentFile/PaymentFileForm.vue"),
        props: { modeprop: "edit" },
      },
      {
        name: "show-payments_files",
        path: "show/:id",
        component: () => import("pages/PaymentFile/PaymentFileForm.vue"),
        props: { modeprop: "show" },
      },
    ],
    meta: {
      title: prefix + " | Cargues de pagos",
      requiresSession: true,
    },
  },
  {
    name: "products",
    path: "/products",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        name: "products",
        path: "",
        component: () => import("pages/Product/Products.vue"),
      },
      {
        name: "new-products",
        path: "new",
        component: () => import("pages/Product/ProductForm.vue"),
        props: { modeprop: "create" },
      },
      {
        name: "edit-products",
        path: "edit/:id",
        component: () => import("pages/Product/ProductForm.vue"),
        props: { modeprop: "edit" },
      },
      {
        name: "show-products",
        path: "show/:id",
        component: () => import("pages/Product/ProductForm.vue"),
        props: { modeprop: "show" },
      },
    ],
    meta: {
      title: prefix + " | Productos",
      requiresSession: true,
    },
  },
  {
    name: "studios",
    path: "/studios",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        name: "studios",
        path: "",
        component: () => import("pages/Studio/Studios.vue"),
      },
      {
        name: "new-studios",
        path: "new",
        component: () => import("pages/Studio/StudioForm.vue"),
        props: { modeprop: "create" },
      },
      {
        name: "edit-studios",
        path: "edit/:id",
        component: () => import("pages/Studio/StudioForm.vue"),
        props: { modeprop: "edit" },
      },
      {
        name: "show-studios",
        path: "show/:id",
        component: () => import("pages/Studio/StudioForm.vue"),
        props: { modeprop: "show" },
      },
    ],
    meta: {
      title: prefix + " | Estudios",
      requiresSession: true,
    },
  },
  /*{
    name: 'studios_models',
    path: '/studios_models',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      //{ name: 'studios_models', path: '', component: () => import('pages/StudioModel/StudiosModels.vue') },
      { name: 'new-studios_models', path: 'new', component: () => import('pages/StudioModel/StudioModelForm.vue'), props: { modeprop: 'create' } },
      { name: 'edit-studios_models', path: 'edit/:id', component: () => import('pages/StudioModel/StudioModelForm.vue'), props: { modeprop: 'edit' } },
      { name: 'show-studios_models', path: 'show/:id', component: () => import('pages/StudioModel/StudioModelForm.vue'), props: { modeprop: 'show' } },
    ],
    meta: {
      title: prefix + ' | Modelos',
      requiresSession: true,
    }
  },*/
  {
    name: "studios_rooms",
    path: "/studios_rooms",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        name: "studios_rooms",
        path: "",
        component: () => import("pages/StudioRoom/StudiosRooms.vue"),
      },
      {
        name: "new-studios_rooms",
        path: "new",
        component: () => import("pages/StudioRoom/StudioRoomForm.vue"),
        props: { modeprop: "create" },
      },
      {
        name: "edit-studios_rooms",
        path: "edit/:id",
        component: () => import("pages/StudioRoom/StudioRoomForm.vue"),
        props: { modeprop: "edit" },
      },
      {
        name: "show-studios_rooms",
        path: "show/:id",
        component: () => import("pages/StudioRoom/StudioRoomForm.vue"),
        props: { modeprop: "show" },
      },
    ],
    meta: {
      title: prefix + " | Cuartos",
      requiresSession: true,
    },
  },
  {
    name: "studios_shifts",
    path: "/studios_shifts",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        name: "studios_shifts",
        path: "",
        component: () => import("pages/StudioShift/StudiosShifts.vue"),
      },
      {
        name: "new-studios_shifts",
        path: "new",
        component: () => import("pages/StudioShift/StudioShiftForm.vue"),
        props: { modeprop: "create" },
      },
      {
        name: "edit-studios_shifts",
        path: "edit/:id",
        component: () => import("pages/StudioShift/StudioShiftForm.vue"),
        props: { modeprop: "edit" },
      },
      {
        name: "show-studios_shifts",
        path: "show/:id",
        component: () => import("pages/StudioShift/StudioShiftForm.vue"),
        props: { modeprop: "show" },
      },
    ],
    meta: {
      title: prefix + " | Turnos",
      requiresSession: true,
    },
  },
  {
    name: "transactions_types",
    path: "/transactions_types",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        name: "transactions_types",
        path: "",
        component: () => import("pages/TransactionType/TransactionsTypes.vue"),
      },
      {
        name: "new-transactions_types",
        path: "new",
        component: () =>
          import("pages/TransactionType/TransactionTypeForm.vue"),
        props: { modeprop: "create" },
      },
      {
        name: "edit-transactions_types",
        path: "edit/:id",
        component: () =>
          import("pages/TransactionType/TransactionTypeForm.vue"),
        props: { modeprop: "edit" },
      },
      {
        name: "show-transactions_types",
        path: "show/:id",
        component: () =>
          import("pages/TransactionType/TransactionTypeForm.vue"),
        props: { modeprop: "show" },
      },
    ],
    meta: {
      title: prefix + " | Tipos de transferencias",
      requiresSession: true,
    },
  },
  {
    name: "notifications",
    path: "/notifications",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        name: "notifications",
        path: "",
        component: () => import("pages/Notification/Notifications.vue"),
      },
    ],
    meta: {
      title: prefix + " | Notificaciones",
      requiresSession: true,
    },
  },
  {
    name: "massive_liquidation",
    path: "/massive_liquidation",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        name: "massive_liquidation",
        path: "",
        component: () => import("pages/ModelStream/ModelsStreamsImport.vue"),
      },
    ],
    meta: {
      title: prefix + " | Notifications",
      requiresSession: true,
    },
  },
  {
    name: "periods",
    path: "/periods",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        name: "periods",
        path: "",
        component: () => import("pages/Periods/Periods.vue"),
      },
    ],
    meta: {
      title: prefix + " | Notifications",
      requiresSession: true,
    },
  },
  {
    name: "studios_liquidation",
    path: "/studios_liquidation",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        name: "studios_liquidation",
        path: "",
        component: () => import("pages/Report/StudioLiquidation.vue"),
      },
    ],
    meta: {
      title: prefix + " | Notifications",
      requiresSession: true,
    },
  },
  {
    name: "models_liquidation",
    path: "/models_liquidation",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        name: "models_liquidation",
        path: "",
        component: () => import("pages/Report/ModelLiquidation.vue"),
      },
    ],
    meta: {
      title: prefix + " | Liquidación",
      requiresSession: true,
    },
  },
  {
    name: "logs",
    path: "/logs",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      { name: "logs", path: "", component: () => import("pages/Log/Logs.vue") },
      {
        name: "view-logs",
        path: "view/:id",
        component: () => import("pages/Log/LogForm.vue"),
      },
    ],
    meta: {
      title: prefix + " | Logs",
      requiresSession: true,
    },
  },
  {
    name: "locations",
    path: "/locations",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        name: "locations",
        path: "",
        component: () => import("pages/Location/Locations.vue"),
      },
    ],
    meta: {
      title: prefix + " | Localizaciones",
      requiresSession: true,
    },
  },
  {
    name: "accounts",
    path: "/accounts",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        name: "accounts",
        path: "",
        component: () => import("pages/Account/Accounts.vue"),
      },
      {
        name: "edit-accounts",
        path: "edit/:id",
        component: () => import("pages/Account/Accounts.vue"),
        props: { modeprop: "edit" },
      },
      {
        name: "show-accounts",
        path: "show/:id",
        component: () => import("pages/Account/Accounts.vue"),
        props: { modeprop: "show" },
      },
    ],
    meta: {
      title: prefix + " | Cuentas",
      requiresSession: true,
    },
  },
  {
    name: "login_history",
    path: "/login_history",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        name: "login_history",
        path: "",
        component: () => import("pages/LoginHistory/LoginHistory.vue"),
      },
    ],
    meta: {
      title: prefix + " | Historial sesiones",
      requiresSession: true,
    },
  },
  {
    name: "monitors",
    path: "/monitors",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        name: "monitors",
        path: "",
        component: () => import("pages/Monitor/Monitors.vue"),
      },
    ],
    meta: {
      title: prefix + " | Monitores",
      requiresSession: true,
    },
  },
  {
    name: "setup_commissions",
    path: "/setup_commissions",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        name: "setup_commissions",
        path: "",
        component: () => import("pages/Commission/SetupCommissions.vue"),
      },
      {
        name: "new-setup_commissions",
        path: "new",
        component: () => import("pages/Commission/SetupCommissionForm.vue"),
        props: { modeprop: "create" },
      },
      {
        name: "edit-setup_commissions",
        path: "edit/:id",
        component: () => import("pages/Commission/SetupCommissionForm.vue"),
        props: { modeprop: "edit" },
      },
      {
        name: "show-setup_commissions",
        path: "show/:id",
        component: () => import("pages/Commission/SetupCommissionForm.vue"),
        props: { modeprop: "show" },
      },
    ],
    meta: {
      title: prefix + " | Configuracion Comisiones",
      requiresSession: true,
    },
  },
  {
    name: "commissions",
    path: "/commissions",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        name: "commissions",
        path: "",
        component: () =>
          import("pages/Commission/AssignCommission/AsssignCommission.vue"),
      },
    ],
    meta: {
      title: prefix + " | Comisiones",
      requiresSession: true,
    },
  },
  {
    name: "api_modules",
    path: "/api_modules",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        name: "api_modules",
        path: "",
        component: () => import("pages/ApiModules/ApiModules.vue"),
      },
    ],
    meta: {
      title: prefix + " | Módulos API",
      requiresSession: true,
    },
  },
  {
    name: "paysheet",
    path: "/paysheet",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        name: "paysheet",
        path: "",
        component: () => import("pages/Paysheet/Paysheet.vue"),
      },
    ],
    meta: {
      title: prefix + " | Nómina",
      requiresSession: true,
    },
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes;
