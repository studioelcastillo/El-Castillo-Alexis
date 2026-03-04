import { supabase } from './supabaseClient';
import { WalletBalance, WalletTransaction, ReferralStats } from './types';

const walletKey = (userId: number) => `wallet:${userId}`;
const referralKey = (userId: number) => `referral:${userId}`;

const computeBalance = (transactions: WalletTransaction[]): WalletBalance => {
  const available = transactions
    .filter((t) => t.status === 'AVAILABLE')
    .reduce((acc, t) => acc + (t.amount || 0), 0);
  const pending = transactions
    .filter((t) => t.status === 'PENDING')
    .reduce((acc, t) => acc + (t.amount || 0), 0);

  return { available, pending, currency: 'USD' };
};

const defaultReferral = (userId: number): ReferralStats => {
  const code = `CASTILLO-${String(userId).padStart(4, '0')}`;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return {
    code,
    link: `${origin}/register?ref=${code}`,
    total_invited: 0,
    pending_rewards: 0,
    approved_rewards: 0,
    rejected_count: 0,
    bonus_milestones: [
      { target: 5, reward: 10, achieved: false },
      { target: 10, reward: 10, achieved: false },
    ],
    referred_users: [],
  };
};

const WalletService = {
  async getWalletData(userId: number) {
    const { data } = await supabase
      .from('settings')
      .select('set_value')
      .eq('set_key', walletKey(userId))
      .maybeSingle();

    let transactions: WalletTransaction[] = [];
    if (data?.set_value) {
      try {
        transactions = JSON.parse(data.set_value);
      } catch {
        transactions = [];
      }
    }

    const balance = computeBalance(transactions);

    const { data: referralRow } = await supabase
      .from('settings')
      .select('set_value')
      .eq('set_key', referralKey(userId))
      .maybeSingle();

    let referral = defaultReferral(userId);
    if (referralRow?.set_value) {
      try {
        referral = { ...referral, ...JSON.parse(referralRow.set_value) } as ReferralStats;
      } catch {
        referral = defaultReferral(userId);
      }
    }

    return { balance, transactions, referral };
  },

  async saveTransactions(userId: number, transactions: WalletTransaction[]) {
    await supabase
      .from('settings')
      .upsert(
        [
          {
            set_key: walletKey(userId),
            set_value: JSON.stringify(transactions),
            set_description: 'Wallet transactions',
          },
        ],
        { onConflict: 'set_key' }
      );
  },

  async addTopUp(userId: number, amount: number) {
    const { transactions } = await WalletService.getWalletData(userId);
    const newTx: WalletTransaction = {
      id: `TX-${Date.now()}`,
      type: 'TOP_UP',
      amount,
      status: 'AVAILABLE',
      description: 'Recarga de Saldo',
      date: new Date().toISOString(),
    };
    const updated = [newTx, ...transactions];
    await WalletService.saveTransactions(userId, updated);
    return updated;
  },
};

export default WalletService;
