
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginPage from './components/LoginPage';
import Onboarding from './components/Onboarding';
import RecoveryPasswordPage from './components/RecoveryPasswordPage';
import AuthCallbackPage from './components/AuthCallbackPage';
import LogoutConfirmDialog from './components/LogoutConfirmDialog';
import AuthService from './AuthService';
import { AlertTriangle, X, Crown } from 'lucide-react';
import { getStoredUser } from './session';
import { clearAuthSession } from './utils/session';
import { isAdminUser } from './utils/permissions';
import BillingService from './BillingService';
import { buildAppUrl } from './utils/baseUrl';
import { supabase } from './supabaseClient';
const ChatWidget = lazy(() => import('./components/ChatWidget'));
import { PAGE_TO_PATH, PATH_ALIASES, getLegacyLabel, getPageFromPath, renderAppPage } from './appRoutes';

const PageFallback = () => (
  <div className="p-8 text-center text-slate-400 text-sm">Cargando...</div>
);


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!getStoredUser();
  });

  const [isOnboarded, setIsOnboarded] = useState(() => {
     return !!getStoredUser();
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'ACTIVE' | 'EXPIRED' | null>(null);

  const [daysUntilDue, setDaysUntilDue] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);

  // State for navigating to specific user profile from header/alerts
  const [targetUserIdForProfile, setTargetUserIdForProfile] = useState<number | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const currentPage = getPageFromPath(location.pathname);
  const legacyLabel = getLegacyLabel(location.pathname);
  const isPublicRoute = ['/login', '/recovery-password', '/auth/callback'].some((path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  });

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  const isSubscriptionActive = subscriptionStatus !== 'EXPIRED';
  const currentUser = getStoredUser();
  const isAdmin = isAdminUser(currentUser);

  const redirectToLogin = () => {
    const loginUrl = buildAppUrl('login');
    try {
      const target = window.top ?? window;
      target.location.href = loginUrl;
    } catch (error) {
      window.location.href = loginUrl;
    }
  };

  useEffect(() => {
    const loadSubscription = async () => {
      const sub = await BillingService.getSubscription();
      if (!sub) {
        setSubscriptionStatus(null);
        setDaysUntilDue(0);
        setShowWarningModal(false);
        return;
      }
      if (!sub.status) {
        setSubscriptionStatus(null);
        setDaysUntilDue(0);
        setShowWarningModal(false);
        return;
      }
      setSubscriptionStatus(sub.status);
      setDaysUntilDue(sub.days_until_due || 0);
      setShowWarningModal((sub.days_until_due || 0) <= 5 && (sub.days_until_due || 0) > 0);
    };
    loadSubscription();
  }, []);

  useEffect(() => {
    if (!isAuthenticated && !isPublicRoute) {
      navigate('/login', { replace: true });
    }
    if (isAuthenticated && location.pathname.startsWith('/login')) {
      navigate(PAGE_TO_PATH.inicio, { replace: true });
    }
    const aliasTarget = PATH_ALIASES[location.pathname as keyof typeof PATH_ALIASES];
    if (aliasTarget && location.pathname !== aliasTarget) {
      navigate(aliasTarget, { replace: true });
    }
  }, [isAuthenticated, isPublicRoute, location.pathname, navigate]);

  useEffect(() => {
    if (location.pathname.startsWith('/logout') && !isLoggingOut) {
      handleLogoutConfirm();
    }
  }, [isLoggingOut, location.pathname]);

  useEffect(() => {
    let active = true;

    const syncSession = async () => {
      const user = await AuthService.syncStoredSession();
      if (!active) return;
      const hasUser = !!user;
      setIsAuthenticated(hasUser);
      setIsOnboarded(hasUser);
    };

    void syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (!session) {
        clearAuthSession();
        setIsAuthenticated(false);
        setIsOnboarded(false);
        return;
      }
      void syncSession();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleNavigate = (id: string) => {
    const target = PAGE_TO_PATH[id] || PAGE_TO_PATH.inicio;
    navigate(target);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleLogin = () => {
      setIsAuthenticated(true);
      setIsOnboarded(true);
      navigate(PAGE_TO_PATH.inicio, { replace: true });
  };

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await AuthService.logout();
    } catch (error) {
      console.error('Error during API logout:', error);
    } finally {
      clearAuthSession();
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
    handleNavigate('usuarios');
  };

  if (location.pathname.startsWith('/auth/callback')) {
    return <AuthCallbackPage />;
  }

  if (location.pathname.startsWith('/recovery-password')) {
    return <RecoveryPasswordPage />;
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (!isOnboarded) {
    return <Onboarding onComplete={handleCompleteOnboarding} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      {isSubscriptionActive && (
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
        {isSubscriptionActive ? (
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
        {isSubscriptionActive && daysUntilDue <= 5 && daysUntilDue > 0 && showWarningModal && (
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
            <Suspense fallback={<PageFallback />}>
              {renderAppPage({
                currentPage,
                legacyLabel,
                isAdmin,
                subscriptionStatus,
                onNavigate: handleNavigate,
                targetUserIdForProfile,
                onClearTargetUser: () => setTargetUserIdForProfile(null),
              })}
            </Suspense>

            {isSubscriptionActive && (
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

      {isSubscriptionActive && (
        <Suspense fallback={null}>
          <ChatWidget />
        </Suspense>
      )}

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
