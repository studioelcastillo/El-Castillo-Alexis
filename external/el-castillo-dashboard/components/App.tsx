
import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Dashboard from './Dashboard';
import UsersPage from './UsersPage';
import RequestsPage from './RequestsPage';
import LocationsPage from './LocationsPage';
import ModelPayrollPage from './ModelPayrollPage';
import StudiosPage from './StudiosPage';
import Onboarding from './Onboarding';
import LoginPage from './LoginPage';
import ChatPage from './ChatPage';
import ChatPolicyAdmin from './ChatPolicyAdmin';
import ChatWidget from './ChatWidget';
import RoomControlPage from './RoomControlPage';
import StorefrontPage from './StorefrontPage';
import InventoryPage from './InventoryPage';
import PhotographyPage from './PhotographyPage'; 
import MembershipPage from './MembershipPage'; 
import WalletPage from './WalletPage'; 
import MasterSettingsPage from './MasterSettingsPage'; 
import BirthdaysPage from './BirthdaysPage'; 
import AttendancePage from './AttendancePage'; // NUEVO
import MonetizationPage from './MonetizationPage';
import ContentSalesPage from './ContentSalesPage';
import SubscriptionLockScreen from './SubscriptionLockScreen'; 
import LogoutConfirmDialog from './LogoutConfirmDialog';
import AuthService from '../AuthService';
import { Lock } from 'lucide-react'; 

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('user');
  });
  
  const [isOnboarded, setIsOnboarded] = useState(() => {
     return !!localStorage.getItem('user');
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState('inicio');
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'ACTIVE' | 'EXPIRED'>('ACTIVE');
  
  const [targetUserIdForProfile, setTargetUserIdForProfile] = useState<number | null>(null);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);
  
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
      localStorage.removeItem('token');
      localStorage.removeItem('dashboardMode');
      window.location.href = '/login';
    }
  };

  const handleCompleteOnboarding = (data: any) => {
    setIsOnboarded(true);
  };

  const handleUserSelect = (userId: number) => {
    setTargetUserIdForProfile(userId);
    setCurrentPage('usuarios');
  };

  const renderContent = () => {
    if (subscriptionStatus === 'EXPIRED') {
       return <SubscriptionLockScreen onNavigateToPayment={() => { setSubscriptionStatus('ACTIVE'); setCurrentPage('membresia'); }} isExpired={true} />;
    }

    switch(currentPage) {
      case 'inicio': return <Dashboard />;
      case 'asistencia': return <AttendancePage />; // NUEVO
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
      case 'monetizacion': return <MonetizationPage />;
      case 'venta_contenido': return <ContentSalesPage />;
      case 'tienda': return <StorefrontPage />;
      case 'inventario': return <InventoryPage />;
      case 'fotografia': return <PhotographyPage />;
      case 'liquidacion_modelos': return <ModelPayrollPage />;
      case 'estudios': return <StudiosPage />;
      case 'config_global': return <MasterSettingsPage />;
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
        {subscriptionStatus === 'ACTIVE' && (
          <Header 
            toggleSidebar={toggleSidebar} 
            isCollapsed={isCollapsed} 
            toggleCollapse={toggleCollapse} 
            onLogoutClick={() => setIsLogoutDialogOpen(true)}
            onUserSelect={handleUserSelect}
            onNavigate={handleNavigate}
          />
        )}
        
        <button 
           onClick={() => setSubscriptionStatus(prev => prev === 'ACTIVE' ? 'EXPIRED' : 'ACTIVE')}
           className="fixed top-20 right-4 z-[9999] p-2 bg-red-500 text-white rounded-full opacity-20 hover:opacity-100 transition-opacity"
           title="Toggle Subscription Lock (QA)"
        >
           <Lock size={16} />
        </button>

        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#F8FAFC]">
            {renderContent()}
            
            {subscriptionStatus === 'ACTIVE' && (
              <footer className="p-8 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                  <p>&copy; 2025 El Castillo Group SAS. Todos los derechos reservados.</p>
                  <button onClick={() => setIsLogoutDialogOpen(true)} className="text-xs font-bold text-red-400 hover:text-red-600 transition-colors uppercase tracking-widest">Cerrar Sesión Segura</button>
              </footer>
            )}
        </div>
      </div>

      {subscriptionStatus === 'ACTIVE' && <ChatWidget />}

      <LogoutConfirmDialog open={isLogoutDialogOpen} onClose={() => setIsLogoutDialogOpen(false)} onConfirm={handleLogoutConfirm} isLoading={isLoggingOut} />
    </div>
  );
}

export default App;
