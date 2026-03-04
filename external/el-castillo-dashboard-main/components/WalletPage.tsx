
import React, { useState, useEffect } from 'react';
import { 
  Wallet, TrendingUp, Plus, ArrowUpRight, ArrowDownLeft, 
  History, Clock, CheckCircle2, AlertCircle, Copy, Gift,
  CreditCard, DollarSign, RefreshCw, ChevronRight, X, Trophy, Users, Star, Lock, Unlock,
  Landmark
} from 'lucide-react';
import { WalletBalance, WalletTransaction, ReferralStats, PaymentSettings } from '../types';
import MasterSettingsService from '../MasterSettingsService';

// Mock Data
const MOCK_WALLET: WalletBalance = {
  available: 125.00,
  pending: 10.00,
  currency: 'USD'
};

const MOCK_TRANSACTIONS: WalletTransaction[] = [
  { id: 'TX-105', type: 'REFERRAL_BONUS', amount: 10, status: 'AVAILABLE', description: 'Bono Hito: 5 Referidos', date: '2025-05-24 10:00' },
  { id: 'TX-101', type: 'TOP_UP', amount: 50, status: 'AVAILABLE', description: 'Recarga con Tarjeta', date: '2025-05-20 10:00' },
  { id: 'TX-102', type: 'SUBSCRIPTION_PAYMENT', amount: -45, status: 'AVAILABLE', description: 'Pago Mensualidad (Plan Ciudadela)', date: '2025-05-20 10:05' },
  { id: 'TX-103', type: 'REFERRAL_REWARD', amount: 10, status: 'AVAILABLE', description: 'Comisión: Studio Blue (Validado)', date: '2025-05-22 14:00' },
  { id: 'TX-104', type: 'PURCHASE', amount: -5, status: 'AVAILABLE', description: 'Compra Tienda: Aro de Luz', date: '2025-05-23 09:00' }
];

const MOCK_REFERRAL: ReferralStats = {
  code: 'CASTILLO-8842',
  link: 'https://elcastillo.app/register?ref=CASTILLO-8842',
  total_invited: 6, 
  pending_rewards: 10,
  approved_rewards: 60,
  rejected_count: 1,
  bonus_milestones: [
    { target: 5, reward: 10, achieved: true },
    { target: 10, reward: 10, achieved: false }
  ],
  referred_users: [
      { id: '1', name: 'Studio Blue', studio_name: 'Blue Room', date_joined: '2025-05-01', status: 'ACTIVE', commission_earned: 10 },
      { id: '2', name: 'Jorge Perez', studio_name: 'JP Models', date_joined: '2025-05-05', status: 'ACTIVE', commission_earned: 10 },
      { id: '3', name: 'Ana Maria', studio_name: 'Pink House', date_joined: '2025-05-10', status: 'PENDING_VALIDATION', commission_earned: 0 },
      { id: '4', name: 'Carlos D', studio_name: 'CD Studios', date_joined: '2025-05-12', status: 'ACTIVE', commission_earned: 10 },
      { id: '5', name: 'Luisa F', studio_name: 'Lulu Cam', date_joined: '2025-05-15', status: 'ACTIVE', commission_earned: 10 },
      { id: '6', name: 'Mario G', studio_name: 'MG Web', date_joined: '2025-05-20', status: 'ACTIVE', commission_earned: 10 },
  ]
};

const WalletPage: React.FC = () => {
  const [balance, setBalance] = useState<WalletBalance>(MOCK_WALLET);
  const [transactions, setTransactions] = useState<WalletTransaction[]>(MOCK_TRANSACTIONS);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<string>('50');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Payment Config State
  const [paymentInfo, setPaymentInfo] = useState<PaymentSettings | null>(null);
  const [showBankDetails, setShowBankDetails] = useState(false);

  useEffect(() => {
    // Load Global Settings when wallet is accessed
    MasterSettingsService.getSettings().then(data => {
        setPaymentInfo(data.payment);
    });
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(MOCK_REFERRAL.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTopUp = () => {
    if (!topUpAmount || Number(topUpAmount) < 10) {
        alert("El monto mínimo de recarga es $10 USD");
        return;
    }
    
    setIsProcessing(true);
    
    // Simulate API Call
    setTimeout(() => {
        const amount = Number(topUpAmount);
        const newTx: WalletTransaction = {
            id: `TX-${Date.now()}`,
            type: 'TOP_UP',
            amount: amount,
            status: 'AVAILABLE',
            description: 'Recarga de Saldo',
            date: new Date().toISOString()
        };
        setTransactions([newTx, ...transactions]);
        setBalance(prev => ({ ...prev, available: prev.available + amount }));
        setIsProcessing(false);
        setIsTopUpOpen(false);
        setTopUpAmount('50');
        alert("Recarga exitosa. Tu saldo ha sido actualizado.");
    }, 2000);
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'AVAILABLE': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
          case 'PENDING': return 'text-amber-600 bg-amber-50 border-amber-100';
          case 'REVERSED': return 'text-slate-400 bg-slate-50 border-slate-100 line-through';
          default: return 'text-slate-500';
      }
  };

  // Progress Calculation for Bonus
  const progressPercent = Math.min((MOCK_REFERRAL.total_invited / 10) * 100, 100);

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <Wallet className="text-amber-500" size={32} />
             Billetera & Referidos
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">Gestiona tus fondos, recargas y monitorea tus ganancias por referidos.</p>
        </div>
        <button 
            onClick={() => setIsTopUpOpen(true)}
            className="px-6 py-3 bg-slate-900 text-amber-400 font-black rounded-2xl shadow-xl shadow-slate-900/20 active:scale-95 transition-all text-[10px] uppercase tracking-[0.2em] flex items-center gap-2"
        >
            <Plus size={16} /> Recargar Saldo
        </button>
      </div>

      {/* Main Cards Row */}
      {/* ... (Existing Stats Cards Code) ... */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl flex flex-col justify-between h-64">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
              <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4 text-emerald-400">
                      <Wallet size={20} />
                      <p className="text-[10px] font-black uppercase tracking-widest">Saldo Total</p>
                  </div>
                  <h2 className="text-5xl font-black tracking-tighter mb-2">${balance.available.toFixed(2)}</h2>
                  <p className="text-xs text-slate-400 font-medium">Disponible para uso inmediato</p>
              </div>
              <div className="relative z-10 mt-auto pt-6 border-t border-white/10">
                  <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-300">Pendiente: ${balance.pending.toFixed(2)}</span>
                      <button onClick={() => setIsTopUpOpen(true)} className="text-[10px] font-black uppercase tracking-widest text-amber-400 hover:text-amber-300">
                          + Añadir
                      </button>
                  </div>
              </div>
          </div>

          <div className="md:col-span-2 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-900/20">
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row gap-8 h-full">
                  <div className="flex-1 flex flex-col justify-between">
                      <div>
                          <div className="flex items-center gap-2 mb-4 text-amber-400">
                              <Trophy size={20} />
                              <p className="text-[10px] font-black uppercase tracking-widest">Programa de Referidos</p>
                          </div>
                          <div className="flex items-baseline gap-2">
                              <h2 className="text-5xl font-black tracking-tighter">${MOCK_REFERRAL.approved_rewards}</h2>
                              <span className="text-sm font-bold text-slate-400">Ganados</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-2 max-w-xs">
                              Recibes $10 por cada referido validado. ¡Desbloquea bonos extra al llegar a 5 y 10 referidos!
                          </p>
                      </div>
                      
                      <div className="mt-6 flex gap-3">
                          <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10">
                              <span className="block text-[9px] font-black uppercase text-slate-300">Invitados</span>
                              <span className="text-xl font-bold">{MOCK_REFERRAL.total_invited}</span>
                          </div>
                          <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10">
                              <span className="block text-[9px] font-black uppercase text-amber-300">Pendientes</span>
                              <span className="text-xl font-bold text-amber-400">${MOCK_REFERRAL.pending_rewards}</span>
                          </div>
                      </div>
                  </div>

                  <div className="flex-1 bg-white/5 rounded-2xl p-6 border border-white/10 flex flex-col justify-center">
                      <h3 className="text-sm font-bold text-white mb-4 flex justify-between">
                          <span>Tu Progreso</span>
                          <span className="text-amber-400">{MOCK_REFERRAL.total_invited} / 10</span>
                      </h3>
                      
                      <div className="relative pt-6 pb-2">
                          <div className="h-3 bg-slate-700 rounded-full overflow-hidden relative">
                              <div 
                                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${progressPercent}%` }}
                              ></div>
                          </div>

                          <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-lg transition-all z-10 ${MOCK_REFERRAL.total_invited >= 5 ? 'bg-amber-500 border-amber-400 text-white scale-110' : 'bg-slate-800 border-slate-600 text-slate-500'}`}>
                                  <span className="text-xs font-black">5</span>
                              </div>
                              <div className={`mt-2 px-2 py-1 rounded text-[8px] font-black uppercase tracking-wide border ${MOCK_REFERRAL.total_invited >= 5 ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                                  +$10 USD
                              </div>
                          </div>

                          <div className="absolute top-0 right-0 translate-x-1/4 flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-lg transition-all z-10 ${MOCK_REFERRAL.total_invited >= 10 ? 'bg-amber-500 border-amber-400 text-white scale-110' : 'bg-slate-800 border-slate-600 text-slate-500'}`}>
                                  <span className="text-xs font-black">10</span>
                              </div>
                              <div className={`mt-2 px-2 py-1 rounded text-[8px] font-black uppercase tracking-wide border ${MOCK_REFERRAL.total_invited >= 10 ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                                  +$10 USD
                              </div>
                          </div>
                      </div>
                      
                      <div className="mt-6">
                          <p className="text-[10px] text-slate-400 text-center font-medium">
                              {MOCK_REFERRAL.total_invited < 5 
                                ? `Invita a ${5 - MOCK_REFERRAL.total_invited} estudios más para tu primer bono.` 
                                : MOCK_REFERRAL.total_invited < 10 
                                    ? `¡Genial! ${10 - MOCK_REFERRAL.total_invited} más para el siguiente bono.` 
                                    : "¡Has completado el ciclo de bonos! Sigue sumando."
                              }
                          </p>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Transactions List */}
          <div className="lg:col-span-2 bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                  <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                      <History size={20} className="text-slate-400" /> Historial de Movimientos
                  </h3>
                  <button className="text-slate-400 hover:text-slate-900 transition-colors"><RefreshCw size={18} /></button>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left">
                      <thead className="bg-slate-50/50">
                          <tr>
                              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo / Detalle</th>
                              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Fecha</th>
                              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Monto</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                          {transactions.map(tx => (
                              <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-8 py-5">
                                      <div className="flex items-center gap-4">
                                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tx.amount > 0 ? (tx.type === 'REFERRAL_BONUS' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-50 text-emerald-600') : 'bg-slate-100 text-slate-500'}`}>
                                              {tx.type === 'REFERRAL_BONUS' ? <Star size={20} fill="currentColor" /> : tx.amount > 0 ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                                          </div>
                                          <div>
                                              <p className="text-sm font-bold text-slate-900">{tx.type.replace('_', ' ')}</p>
                                              <p className="text-xs text-slate-500">{tx.description}</p>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="px-8 py-5 text-center">
                                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusColor(tx.status)}`}>
                                          {tx.status}
                                      </span>
                                  </td>
                                  <td className="px-8 py-5 text-right text-xs font-bold text-slate-500">
                                      {new Date(tx.date).toLocaleDateString()}
                                  </td>
                                  <td className="px-8 py-5 text-right">
                                      <span className={`text-sm font-black font-mono ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                                          {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)} USD
                                      </span>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>

          {/* Referral Link & List */}
          <div className="space-y-6">
              <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
                  <h3 className="font-black text-slate-900 text-lg mb-4">Invita y Gana</h3>
                  <p className="text-xs text-slate-500 mb-6 font-medium leading-relaxed">
                      Comparte este enlace. Cuando un nuevo estudio se registre y valide su cuenta, recibirás <span className="text-emerald-600 font-bold">$10 USD</span> automáticamente.
                  </p>
                  
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6 flex items-center justify-between">
                      <code className="text-xs font-bold text-slate-700 truncate">{MOCK_REFERRAL.link}</code>
                      <button 
                        onClick={handleCopyLink}
                        className="ml-2 p-2 bg-white border border-slate-200 rounded-xl hover:text-amber-600 transition-colors"
                      >
                          {copied ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                      </button>
                  </div>

                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Últimos Referidos</h4>
                  <div className="space-y-3">
                      {MOCK_REFERRAL.referred_users.slice(0, 4).map(user => (
                          <div key={user.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 font-bold text-xs border border-slate-200">
                                      {user.studio_name.substring(0,2).toUpperCase()}
                                  </div>
                                  <div>
                                      <p className="text-xs font-bold text-slate-800">{user.studio_name}</p>
                                      <p className="text-[9px] text-slate-400 font-bold uppercase">{user.status === 'ACTIVE' ? 'Validado' : 'Pendiente'}</p>
                                  </div>
                              </div>
                              <span className={`text-xs font-black ${user.commission_earned > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                                  +${user.commission_earned}
                              </span>
                          </div>
                      ))}
                  </div>
              </div>

              <div className="bg-indigo-50 border border-indigo-100 rounded-[32px] p-6 flex gap-4 items-start">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                      <AlertCircle size={20} />
                  </div>
                  <div>
                      <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wide">Política de Pagos</h4>
                      <p className="text-[10px] text-indigo-700 mt-1 leading-relaxed font-medium">
                          Las comisiones por referidos se liberan 15 días después de que el referido realice su primer pago de membresía.
                      </p>
                  </div>
              </div>
          </div>
      </div>

      {/* Top Up Modal */}
      {isTopUpOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in" onClick={() => setIsTopUpOpen(false)} />
              <div className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl p-8 animate-in zoom-in-95 overflow-y-auto max-h-[90vh]">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-black text-slate-900">Recargar Billetera</h3>
                      <button onClick={() => setIsTopUpOpen(false)}><X size={24} className="text-slate-400 hover:text-slate-900" /></button>
                  </div>

                  <div className="space-y-6">
                      <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Monto a Recargar (USD)</label>
                          <div className="relative">
                              <DollarSign size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input 
                                type="number" 
                                min="10"
                                value={topUpAmount}
                                onChange={(e) => setTopUpAmount(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-2xl font-black text-slate-900 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all"
                              />
                          </div>
                      </div>

                      <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Método de Pago</label>
                          <div className="flex flex-col gap-3">
                              <button 
                                onClick={() => setShowBankDetails(false)}
                                className={`flex-1 py-4 border-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${!showBankDetails ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}
                              >
                                  <CreditCard size={16} /> Tarjeta de Crédito
                              </button>
                              <button 
                                onClick={() => setShowBankDetails(true)}
                                className={`flex-1 py-4 border rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${showBankDetails ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-500 border-slate-200'}`}
                              >
                                  <Landmark size={16} /> PSE / Transferencia
                              </button>
                          </div>
                      </div>

                      {showBankDetails && paymentInfo ? (
                          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 animate-in fade-in">
                              <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                                  <div>
                                      <p className="text-[10px] font-black text-slate-400 uppercase">Banco</p>
                                      <p className="font-bold text-slate-800">{paymentInfo.bank_name}</p>
                                  </div>
                                  <div className="text-right">
                                      <p className="text-[10px] font-black text-slate-400 uppercase">Tipo</p>
                                      <p className="font-bold text-slate-800">{paymentInfo.account_type}</p>
                                  </div>
                              </div>
                              <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200">
                                  <span className="font-mono font-bold text-slate-700 text-sm tracking-wider">{paymentInfo.account_number}</span>
                                  <button onClick={() => navigator.clipboard.writeText(paymentInfo.account_number)} className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"><Copy size={14}/></button>
                              </div>
                              <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Titular</p>
                                  <p className="text-xs font-bold text-slate-800">{paymentInfo.account_holder}</p>
                                  <p className="text-[10px] text-slate-500">{paymentInfo.holder_id}</p>
                              </div>
                              <div className="p-3 bg-blue-50 text-blue-700 text-[10px] rounded-lg border border-blue-100 leading-relaxed font-medium">
                                  {paymentInfo.instructions || 'Envía el comprobante a soporte para validación.'}
                              </div>
                          </div>
                      ) : !showBankDetails && (
                          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
                              <AlertCircle size={20} className="text-blue-500 shrink-0" />
                              <p className="text-xs text-blue-700 font-medium leading-relaxed">
                                  El saldo recargado no tiene vencimiento y puede usarse para pagar mensualidades o productos de la tienda.
                              </p>
                          </div>
                      )}

                      {!showBankDetails && (
                        <button 
                            onClick={handleTopUp}
                            disabled={isProcessing}
                            className="w-full py-4 bg-emerald-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isProcessing ? 'Procesando...' : `Pagar $${Number(topUpAmount || 0).toFixed(2)}`}
                        </button>
                      )}
                      
                      {showBankDetails && (
                          <button 
                            onClick={() => { setIsTopUpOpen(false); alert("Comprobante reportado. Validaremos en breve."); }}
                            className="w-full py-4 bg-slate-900 text-amber-400 font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-900/20 hover:bg-black transition-all active:scale-95"
                          >
                              Reportar Transferencia Realizada
                          </button>
                      )}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default WalletPage;
