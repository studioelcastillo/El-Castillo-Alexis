
import React from 'react';
import { Menu, X, ChevronRight, Crown, PanelLeftClose, PanelLeft } from 'lucide-react';
import { SIDEBAR_SECTIONS } from '../constants';
import { getStoredUser } from '../session';
import { filterSidebarSections, isAdminUser } from '../utils/permissions';

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  toggleSidebar: () => void;
  toggleCollapse: () => void;
  onNavigate: (id: string) => void;
  activePage: string;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, isCollapsed, toggleSidebar, toggleCollapse, onNavigate, activePage }) => {
  const currentUser = getStoredUser();
  const isAdmin = isAdminUser(currentUser);
  const sections = filterSidebarSections(SIDEBAR_SECTIONS, isAdmin);
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`
          fixed top-0 left-0 h-full bg-[#0B1120] text-slate-400 z-50 
          ${isCollapsed ? 'w-20' : 'w-72'} transform transition-all duration-300 ease-in-out border-r border-slate-800/50
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static flex flex-col shadow-2xl
        `}
      >
        {/* Logo Area */}
        <div className={`h-20 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-6'} bg-[#0B1120] border-b border-slate-800/50 relative overflow-hidden transition-all`}>
          <div className="absolute top-0 left-0 w-20 h-20 bg-amber-500/10 blur-3xl rounded-full pointer-events-none"></div>
          
          <div className="flex items-center gap-3 relative z-10">
            <div className={`w-10 h-10 min-w-[40px] rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center text-[#0B1120] shadow-lg shadow-amber-500/20`}>
              <Crown size={22} strokeWidth={2.5} />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-300">
                <span className="font-bold text-white tracking-wide text-lg leading-none">EL CASTILLO</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-amber-500 font-semibold mt-1">Group SAS</span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button onClick={toggleSidebar} className="lg:hidden text-slate-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-8 custom-scrollbar">
          {sections.map((section, idx) => (
            <div key={idx}>
              {!isCollapsed && (
                <h3 className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 font-sans animate-in fade-in duration-500">
                  {section.title}
                </h3>
              )}
              <nav className="space-y-1">
                {section.items.map((item, itemIdx) => {
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={itemIdx}
                      onClick={() => onNavigate(item.id)}
                      title={isCollapsed ? item.label : ''}
                      className={`
                        w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-3'} py-3 rounded-xl text-sm font-medium transition-all duration-300 group relative
                        ${isActive 
                          ? 'bg-amber-500/10 text-amber-400 shadow-inner' 
                          : 'hover:bg-white/5 hover:text-white text-slate-400'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon 
                          size={18} 
                          className={`transition-all duration-300 ${isActive ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)] scale-110' : 'text-slate-500 group-hover:text-slate-300'}`} 
                        />
                        {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-1 duration-300">{item.label}</span>}
                      </div>
                      {!isCollapsed && isActive && <ChevronRight size={14} className="text-amber-500/50" />}
                      
                      {/* Status indicator for collapsed state */}
                      {isCollapsed && isActive && (
                        <div className="absolute right-0 w-1 h-6 bg-amber-500 rounded-l-full"></div>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Footer Area - Updated (Removed collapse button) */}
        <div className="p-4 border-t border-slate-800/50 bg-[#080c17]/50">
          {!isCollapsed ? (
            <div className="px-3 animate-in fade-in duration-500">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                <span className="text-xs text-slate-400 font-medium tracking-tight">Sistema Activo</span>
              </div>
              <p className="text-[10px] text-slate-600 uppercase tracking-widest font-black">v1.15.0 © 2025</p>
            </div>
          ) : (
             <div className="flex justify-center">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" title="Sistema Activo"></div>
             </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
