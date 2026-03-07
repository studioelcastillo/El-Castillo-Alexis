import { WalletBalance, WalletTransaction, ReferralStats } from './types';
import { getCurrentStudioId } from './tenant';
import { getTenantJsonSetting, upsertTenantSetting } from './tenantSettings';

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
    const transactions = await getTenantJsonSetting<WalletTransaction[]>(walletKey(userId), [], getCurrentStudioId());

    const balance = computeBalance(transactions);

    let referral = defaultReferral(userId);
    const referralData = await getTenantJsonSetting<Partial<ReferralStats>>(referralKey(userId), {}, getCurrentStudioId());
    referral = { ...referral, ...referralData } as ReferralStats;

    return { balance, transactions, referral };
  },

  async saveTransactions(userId: number, transactions: WalletTransaction[]) {
    await upsertTenantSetting(walletKey(userId), transactions, 'Wallet transactions', getCurrentStudioId());
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
