
import React, { useState } from 'react';
import { 
  Crown, Camera, Users, ArrowRight, Check, 
  Shield, Zap, Rocket, Building2, UploadCloud 
} from 'lucide-react';

interface OnboardingProps {
  onComplete: (data: any) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [studioName, setStudioName] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [modelCount, setModelCount] = useState(5);

  const plans = [
    {
      id: 'fortaleza',
      name: 'Plan Fortaleza',
      range: '1-10 modelos',
      price: '$49',
      icon: Shield,
      color: 'bg-slate-100 text-slate-600',
      activeColor: 'ring-slate-900 bg-slate-50',
      threshold: [1, 10]
    },
    {
      id: 'ciudadela',
      name: 'Plan Ciudadela',
      range: '11-50 modelos',
      price: '$99',
      icon: Zap,
      color: 'bg-amber-100 text-amber-600',
      activeColor: 'ring-amber-500 bg-amber-50',
      threshold: [11, 50]
    },
    {
      id: 'imperio',
      name: 'Plan Imperio',
      range: '51+ modelos',
      price: '$199',
      icon: Rocket,
      color: 'bg-indigo-100 text-indigo-600',
      activeColor: 'ring-indigo-600 bg-indigo-50',
      threshold: [51, 1000]
    }
  ];

  const currentPlan = plans.find(p => modelCount >= p.threshold[0] && modelCount <= p.threshold[1]) || plans[2];

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogo(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-4 overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-amber-500/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-indigo-500/10 blur-[100px] rounded-full"></div>
      </div>

      <div className="w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Left Sidebar Info (Onboarding Context) */}
        <div className="md:w-1/3 bg-slate-900 p-8 md:p-12 text-white flex flex-col justify-between border-r border-white/5">
          <div>
            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-900 shadow-lg shadow-amber-500/20 mb-8">
              <Crown size={28} />
            </div>
            <h2 className="text-3xl font-black tracking-tight mb-4 leading-tight">Bienvenido al Castillo.</h2>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">
              Estás a pocos pasos de centralizar tu operación con el sistema de gestión de modelos más potente del mercado.
            </p>
          </div>

          <div className="space-y-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s ? 'bg-amber-500 text-slate-900 scale-110 shadow-lg shadow-amber-500/20' : 
                  step > s ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'
                }`}>
                  {step > s ? <Check size={14} /> : s}
                </div>
                <span className={`text-xs font-bold uppercase tracking-widest ${step === s ? 'text-white' : 'text-slate-500'}`}>
                  {s === 1 ? 'Identidad' : s === 2 ? 'Escalabilidad' : 'Confirmación'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Content Area (Step Forms) */}
        <div className="flex-1 p-8 md:p-16 flex flex-col justify-center min-h-[500px]">
          
          {step === 1 && (
            <div className="animate-in slide-in-from-right-8 duration-300">
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-2 block">Paso 01</span>
              <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Identifica tu Estudio</h3>
              
              <div className="space-y-8">
                <div className="flex flex-col items-center gap-6">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full border-4 border-slate-50 bg-slate-100 flex items-center justify-center overflow-hidden shadow-inner relative">
                      {logo ? (
                        <img src={logo} alt="Logo preview" className="w-full h-full object-cover" />
                      ) : (
                        <Building2 size={40} className="text-slate-300" />
                      )}
                      <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <Camera size={24} className="text-white" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                      </label>
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-slate-900 border-4 border-white shadow-lg">
                      <UploadCloud size={16} />
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sube el logo de tu marca</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre del Estudio</label>
                  <input 
                    type="text"
                    placeholder="Ej: Red Dreams Studio"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all"
                    value={studioName}
                    onChange={(e) => setStudioName(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in slide-in-from-right-8 duration-300">
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-2 block">Paso 02</span>
              <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Capacidad de Operación</h3>
              <p className="text-sm text-slate-500 font-medium mb-12">Desliza para seleccionar cuántas modelos gestionarás.</p>
              
              <div className="space-y-12">
                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <span className="text-4xl font-black text-slate-900 tracking-tighter">
                      {modelCount} <span className="text-lg text-slate-400 font-bold">Modelos</span>
                    </span>
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${currentPlan.color}`}>
                      {currentPlan.name}
                    </div>
                  </div>
                  <input 
                    type="range"
                    min="1"
                    max="100"
                    value={modelCount}
                    onChange={(e) => setModelCount(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                    <span>1 Modelo</span>
                    <span>50 Modelos</span>
                    <span>100+ Modelos</span>
                  </div>
                </div>

                {/* Plans Overview */}
                <div className="grid grid-cols-1 gap-3">
                  {plans.map((plan) => {
                    const isActive = currentPlan.id === plan.id;
                    const Icon = plan.icon;
                    return (
                      <div 
                        key={plan.id}
                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                          isActive ? `ring-2 ${plan.activeColor} border-transparent shadow-lg shadow-slate-200/50` : 'border-slate-100 bg-white opacity-40'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${plan.color}`}>
                          <Icon size={20} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{plan.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{plan.range}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-slate-900">{plan.price}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">/ mes</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in slide-in-from-right-8 duration-300 text-center">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                <Check size={40} strokeWidth={3} />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">¡Todo Listo!</h3>
              <p className="text-sm text-slate-500 font-medium mb-12 max-w-xs mx-auto">
                Tu castillo ha sido configurado. El estudio <span className="text-slate-900 font-bold">"{studioName}"</span> está listo para despegar.
              </p>

              <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100 space-y-4 mb-8">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-400 uppercase tracking-widest">Plan Seleccionado</span>
                  <span className="text-slate-900">{currentPlan.name}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-400 uppercase tracking-widest">Capacidad</span>
                  <span className="text-slate-900">{modelCount} Modelos</span>
                </div>
                <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Mensual</span>
                  <span className="text-2xl font-black text-amber-600">{currentPlan.price}</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-auto pt-12 flex gap-4">
            {step > 1 && (
              <button 
                onClick={prevStep}
                className="px-8 py-4 bg-white border border-slate-200 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 transition-all active:scale-95 text-xs uppercase tracking-widest"
              >
                Atrás
              </button>
            )}
            <button 
              disabled={step === 1 && !studioName}
              onClick={step === 3 ? () => onComplete({ studioName, modelCount, plan: currentPlan.id }) : nextStep}
              className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 text-amber-400 font-bold rounded-2xl hover:bg-black transition-all shadow-xl shadow-slate-900/10 active:scale-95 disabled:opacity-50 text-xs uppercase tracking-widest"
            >
              {step === 3 ? 'ENTRAR AL DASHBOARD' : 'SIGUIENTE PASO'}
              <ArrowRight size={18} />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Onboarding;
