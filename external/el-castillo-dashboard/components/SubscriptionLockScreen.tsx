
import React from 'react';
import { ShieldAlert, CreditCard, Lock, ArrowRight, Phone } from 'lucide-react';

interface SubscriptionLockScreenProps {
  onNavigateToPayment: () => void;
  isExpired: boolean;
}

const SubscriptionLockScreen: React.FC<SubscriptionLockScreenProps> = ({ onNavigateToPayment, isExpired }) => {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#0B1120] flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-red-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-amber-600/10 blur-[100px] rounded-full"></div>
      </div>

      <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] max-w-lg w-full p-10 text-center shadow-2xl animate-in zoom-in-95 duration-500">
        
        <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-red-500/20">
          <Lock size={48} className="text-white" strokeWidth={2} />
        </div>

        <h1 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
          {isExpired ? 'Membresía Vencida' : 'Acceso Restringido'}
        </h1>
        
        <p className="text-slate-400 text-sm md:text-base mb-8 leading-relaxed font-medium">
          El periodo de suscripción de tu estudio ha finalizado. Para continuar operando y recuperar el acceso inmediato a todos los módulos, por favor actualiza tu método de pago.
        </p>

        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-8 flex items-center gap-3 text-left">
           <ShieldAlert className="text-red-400 shrink-0" size={24} />
           <div>
              <p className="text-red-200 text-xs font-bold uppercase tracking-widest">Estado Crítico</p>
              <p className="text-red-100 text-xs mt-0.5">Tus datos están seguros, pero el acceso al dashboard está bloqueado temporalmente.</p>
           </div>
        </div>

        <div className="space-y-3">
          <button 
            onClick={onNavigateToPayment}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-amber-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
          >
            <CreditCard size={18} /> Renovar Ahora
          </button>
          
          <button className="w-full py-4 bg-white/5 border border-white/10 text-slate-300 font-bold uppercase tracking-widest text-xs rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-2">
            <Phone size={14} /> Contactar Soporte
          </button>
        </div>

        <p className="mt-8 text-[10px] text-slate-600 uppercase tracking-widest font-black">
          ID Cliente: #ST-8842 • El Castillo Group SAS
        </p>
      </div>
    </div>
  );
};

export default SubscriptionLockScreen;
