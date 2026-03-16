import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { useAuth } from './lib/auth';
import { AbsencesPage } from './pages/AbsencesPage';
import { AttendancePage } from './pages/AttendancePage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { BranchesPage } from './pages/BranchesPage';
import { CatalogsPage } from './pages/CatalogsPage';
import { CompaniesPage } from './pages/CompaniesPage';
import { DashboardPage } from './pages/DashboardPage';
import { GoalsPage } from './pages/GoalsPage';
import { HrDisciplinaryActionsPage } from './pages/HrDisciplinaryActionsPage';
import { HrIncapacitiesPage } from './pages/HrIncapacitiesPage';
import { HrVacationsPage } from './pages/HrVacationsPage';
import { LoginPage } from './pages/LoginPage';
import { ModelsPage } from './pages/ModelsPage';
import { OnlineTimePage } from './pages/OnlineTimePage';
import { OperationsPage } from './pages/OperationsPage';
import { PayrollPage } from './pages/PayrollPage';
import { PayrollNoveltiesPage } from './pages/PayrollNoveltiesPage';
import { PeoplePage } from './pages/PeoplePage';
import { PermissionsPage } from './pages/PermissionsPage';
import { RolesPage } from './pages/RolesPage';
import { StaffPage } from './pages/StaffPage';
import { UsersPage } from './pages/UsersPage';
import { FinanceAccountsPage } from './pages/FinanceAccountsPage';
import { FinanceTransactionsPage } from './pages/FinanceTransactionsPage';

function AppSplash() {
  return (
    <div className="app-splash">
      <div className="splash-card panel fade-up">
        <span className="eyebrow">StudioCore ERP</span>
        <h1>Preparando shell operativa...</h1>
        <p>Validando sesion, tenant activo y contratos base del nuevo ERP.</p>
      </div>
    </div>
  );
}

function LoginRoute() {
  const { ready, session } = useAuth();

  if (!ready) {
    return <AppSplash />;
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LoginPage />;
}

function ProtectedLayout() {
  const { ready, session } = useAuth();
  const location = useLocation();

  if (!ready) {
    return <AppSplash />;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  return <Outlet />;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route element={<ProtectedLayout />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/branches" element={<BranchesPage />} />
          <Route path="/absences" element={<AbsencesPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/catalogs" element={<CatalogsPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/hr/discipline" element={<HrDisciplinaryActionsPage />} />
          <Route path="/hr/incapacities" element={<HrIncapacitiesPage />} />
          <Route path="/hr/vacations" element={<HrVacationsPage />} />
          <Route path="/models" element={<ModelsPage />} />
          <Route path="/online-time" element={<OnlineTimePage />} />
          <Route path="/operations" element={<OperationsPage />} />
          <Route path="/payroll" element={<PayrollPage />} />
          <Route path="/payroll-novelties" element={<PayrollNoveltiesPage />} />
          <Route path="/people" element={<PeoplePage />} />
          <Route path="/staff" element={<StaffPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/roles" element={<RolesPage />} />
          <Route path="/permissions" element={<PermissionsPage />} />
          <Route path="/audit" element={<AuditLogsPage />} />
          <Route path="/finance/accounts" element={<FinanceAccountsPage />} />
          <Route path="/finance/transactions" element={<FinanceTransactionsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
