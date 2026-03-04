
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import UsersPage from './components/UsersPage';
import RequestsPage from './components/RequestsPage';
import LocationsPage from './components/LocationsPage';
import ModelPayrollPage from './components/ModelPayrollPage';
import StudiosPage from './components/StudiosPage';
import Onboarding from './components/Onboarding';
import LoginPage from './components/LoginPage';
import ChatPage from './components/ChatPage';
import ChatPolicyAdmin from './components/ChatPolicyAdmin';
import ChatWidget from './components/ChatWidget';
import RoomControlPage from './components/RoomControlPage';
import StorefrontPage from './components/StorefrontPage';
import InventoryPage from './components/InventoryPage';
import PhotographyPage from './components/PhotographyPage'; 
import UtilityDashboard from './components/UtilityDashboard'; // NUEVO
import MembershipPage from './components/MembershipPage'; 
import WalletPage from './components/WalletPage'; 
import MasterSettingsPage from './components/MasterSettingsPage'; 
import BirthdaysPage from './components/BirthdaysPage'; 
import AttendancePage from './components/AttendancePage';
import MonetizationPage from './components/MonetizationPage'; // NUEVO
import ContentSalesPage from './components/ContentSalesPage'; // NUEVO
import RemoteDesktopPage from './components/RemoteDesktopPage'; // NUEVO
import ShiftAssignmentPage from './components/ShiftAssignmentPage'; // NUEVO
import SubscriptionManagementPage from './components/SubscriptionManagementPage'; // NUEVO
import SubscriptionLockScreen from './components/SubscriptionLockScreen'; 
import LogoutConfirmDialog from './components/LogoutConfirmDialog';
import AuthService from './AuthService';
import { Lock, AlertTriangle, X, Crown } from 'lucide-react'; 
import { getStoredUser } from './session';
import BillingService from './BillingService';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!getStoredUser();
  });
  
  const [isOnboarded, setIsOnboarded] = useState(() => {
     return !!getStoredUser();
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState('inicio');
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'ACTIVE' | 'EXPIRED'>('ACTIVE');
  
  const [daysUntilDue, setDaysUntilDue] = useState(0); 
  const [showWarningModal, setShowWarningModal] = useState(false);

  // State for navigating to specific user profile from header/alerts
  const [targetUserIdForProfile, setTargetUserIdForProfile] = useState<number | null>(null);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  const redirectToLogin = () => {
    try {
      const target = window.top ?? window;
      target.location.href = '/login';
    } catch (error) {
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    const loadSubscription = async () => {
      const sub = await BillingService.getSubscription();
      setSubscriptionStatus(sub.status || 'ACTIVE');
      setDaysUntilDue(sub.days_until_due || 0);
      setShowWarningModal((sub.days_until_due || 0) <= 5 && (sub.days_until_due || 0) > 0);
    };
    loadSubscription();
  }, []);
  
  const handleNavigate = (id: string) => {
    setCurrentPage(id);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleLogin = () => {
      setIsAuthenticated(true);
      setIsOnboarded(true);
  };

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await AuthService.logout();
    } catch (error) {
      console.error('Error during API logout:', error);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('dashboard_user');
      localStorage.removeItem('token');
      localStorage.removeItem('dashboardMode');
      redirectToLogin();
    }
  };

  const handleCompleteOnboarding = (data: any) => {
    setIsOnboarded(true);
  };

  // Handler for clicking a user in the birthday dropdown
  const handleUserSelect = (userId: number) => {
    setTargetUserIdForProfile(userId);
    setCurrentPage('usuarios');
  };

  // --- RENDER CONTENT ---
  const renderContent = () => {
    if (subscriptionStatus === 'EXPIRED') {
       if (currentPage === 'membresia') {
           return <MembershipPage />;
       }
       return <SubscriptionLockScreen onNavigateToPayment={() => setCurrentPage('membresia')} isExpired={true} />;
    }

    switch(currentPage) {
      case 'inicio': return <Dashboard />;
      case 'monetizacion': return <MonetizationPage />;
      case 'venta_contenido': return <ContentSalesPage />;
      case 'escritorio_remoto': return <RemoteDesktopPage />; // NUEVO
      case 'asignacion_turnos': return <ShiftAssignmentPage />; // NUEVO
      case 'asistencia': return <AttendancePage />;
      case 'cumpleanos': return <BirthdaysPage />;
      case 'membresia': return <MembershipPage />;
      case 'billetera': return <WalletPage />;
      case 'usuarios': return (
        <UsersPage 
          targetUserId={targetUserIdForProfile} 
          onClearTarget={() => setTargetUserIdForProfile(null)} 
        />
      );
      case 'solicitudes': return <RequestsPage onNavigate={handleNavigate} />;
      case 'localizaciones': return <LocationsPage />;
      case 'chat': return <ChatPage />;
      case 'chat_admin': return <ChatPolicyAdmin />;
      case 'control_cuartos': return <RoomControlPage />;
      case 'tienda': return <StorefrontPage />;
      case 'inventario': return <InventoryPage />;
      case 'fotografia': return <PhotographyPage />;
      case 'utilidades': return <UtilityDashboard />; // NUEVO
      case 'liquidacion_modelos': return <ModelPayrollPage />;
      case 'estudios': return <StudiosPage />;
      case 'config_global': return <MasterSettingsPage />;
      case 'control_licencias': return <SubscriptionManagementPage />;
      default: return <Dashboard />;
    }
  };

  if (!isAuthenticated) {
      return <LoginPage onLogin={handleLogin} />;
  }

  if (!isOnboarded) {
    return <Onboarding onComplete={handleCompleteOnboarding} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      {subscriptionStatus === 'ACTIVE' && (
        <Sidebar 
          isOpen={sidebarOpen} 
          isCollapsed={isCollapsed}
          toggleSidebar={toggleSidebar} 
          toggleCollapse={toggleCollapse} 
          onNavigate={handleNavigate} 
          activePage={currentPage} 
        />
      )}
      
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {subscriptionStatus === 'ACTIVE' ? (
          <Header 
            toggleSidebar={toggleSidebar} 
            isCollapsed={isCollapsed} 
            toggleCollapse={toggleCollapse} 
            onLogoutClick={() => setIsLogoutDialogOpen(true)}
            onUserSelect={handleUserSelect}
            onNavigate={handleNavigate}
          />
        ) : (
          <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
             <div className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center">
                    <Crown size={16} className="text-amber-400" />
                 </div>
                 <span className="font-black text-slate-900 tracking-tight">El Castillo</span>
             </div>
             <button onClick={() => setIsLogoutDialogOpen(true)} className="text-sm font-bold text-slate-500 hover:text-slate-900">
                 Cerrar Sesión
             </button>
          </div>
        )}

        {/* Subscription Warning Modal */}
        {subscriptionStatus === 'ACTIVE' && daysUntilDue <= 5 && daysUntilDue > 0 && showWarningModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
              <div className="bg-amber-500 p-6 text-center relative">
                <button 
                  onClick={() => setShowWarningModal(false)}
                  className="absolute top-4 right-4 text-amber-900/50 hover:text-amber-900 transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <AlertTriangle size={32} className="text-amber-500" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">¡Atención!</h2>
                <p className="text-amber-900 font-medium mt-2">Tu licencia está por vencer.</p>
              </div>
              <div className="p-8 text-center space-y-6">
                <p className="text-slate-600">
                  Te quedan <strong className="text-slate-900 font-black text-lg">{daysUntilDue} días</strong> de acceso a la plataforma. 
                  Para evitar interrupciones en tu servicio y el de tus sedes aliadas, por favor renueva tu membresía.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowWarningModal(false)}
                    className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-sm"
                  >
                    Recordarme luego
                  </button>
                  <button 
                    onClick={() => {
                      setShowWarningModal(false);
                      handleNavigate('membresia');
                    }}
                    className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl transition-colors shadow-lg shadow-amber-500/20 text-sm"
                  >
                    Renovar Ahora
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#F8FAFC]">
            {renderContent()}
            
            {subscriptionStatus === 'ACTIVE' && (
              <footer className="p-8 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                  <p>&copy; 2025 El Castillo Group SAS. Todos los derechos reservados.</p>
                  <button 
                    onClick={() => setIsLogoutDialogOpen(true)}
                    className="text-xs font-bold text-red-400 hover:text-red-600 transition-colors uppercase tracking-widest"
                  >
                    Cerrar Sesión Segura
                  </button>
              </footer>
            )}
        </div>
      </div>

      {subscriptionStatus === 'ACTIVE' && <ChatWidget />}

      <LogoutConfirmDialog 
        open={isLogoutDialogOpen}
        onClose={() => setIsLogoutDialogOpen(false)}
        onConfirm={handleLogoutConfirm}
        isLoading={isLoggingOut}
      />
    </div>
  );
}

export default App;
