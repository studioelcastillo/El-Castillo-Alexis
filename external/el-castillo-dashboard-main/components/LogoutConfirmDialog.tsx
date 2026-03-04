
import React from 'react';
import { LogOut, X, AlertCircle } from 'lucide-react';

interface LogoutConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

const LogoutConfirmDialog: React.FC<LogoutConfirmDialogProps> = ({ open, onClose, onConfirm, isLoading }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
      {/* Backdrop con desenfoque profundo */}
      <div 
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-500"
        onClick={isLoading ? undefined : onClose}
      />
      
      {/* Modal Card */}
      <div className="relative bg-white w-full max-w-[420px] rounded-[40px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.25)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-300">
        
        {/* Close button (top right) */}
        <button 
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all"
        >
          <X size={20} />
        </button>

        <div className="p-10 pb-6 text-center">
          {/* Static Icon Container (Removed Pulse) */}
          <div className="relative mx-auto mb-8 w-20 h-20">
             <div className="relative w-full h-full bg-red-50 text-red-500 rounded-[28px] flex items-center justify-center shadow-sm border border-red-100/50">
               <LogOut size={36} strokeWidth={2.5} />
             </div>
          </div>
          
          <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">¿Finalizar sesión?</h3>
          <p className="text-sm text-slate-500 font-medium leading-relaxed px-4">
            Tu acceso seguro será revocado y deberás ingresar tus credenciales para volver al Castillo.
          </p>
        </div>

        {/* Action Buttons with Improved Sizing */}
        <div className="px-10 pb-10 pt-4 flex flex-col gap-3">
          <button 
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full py-4 bg-slate-900 text-amber-400 font-black rounded-2xl hover:bg-black transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-xl shadow-slate-900/20 disabled:opacity-50 text-[11px] uppercase tracking-[0.2em]"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin"></span>
            ) : (
              <>SÍ, CERRAR SESIÓN <LogOut size={16} /></>
            )}
          </button>
          
          <button 
            onClick={onClose}
            disabled={isLoading}
            className="w-full py-4 text-slate-400 font-bold rounded-2xl hover:bg-slate-50 hover:text-slate-600 transition-all active:scale-[0.98] text-[10px] uppercase tracking-[0.15em]"
          >
            Mantener sesión abierta
          </button>
        </div>

        {/* Security Footer */}
        <div className="bg-slate-50 py-4 px-8 border-t border-slate-100 flex items-center justify-center gap-2">
           <AlertCircle size={14} className="text-amber-500" />
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Seguridad garantizada por El Castillo Group</span>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmDialog;
