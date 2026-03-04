
import { 
  MonetizationPlatform, MonetizationBeneficiary, Liquidation 
} from './types';

// Mock Databases
let platforms: MonetizationPlatform[] = [
  { id: 'p1', name: 'Paxum', type: 'USD_DIRECT', default_commission_pct: 10, notes: 'Pagos directos USD' },
  { id: 'p2', name: 'Streamate', type: 'USD_DIRECT', default_commission_pct: 15 },
  { id: 'p3', name: 'Tokens', type: 'TOKENS', default_commission_pct: 10, notes: 'Conversión 0.05' },
  { id: 'p4', name: 'Cosmo', type: 'USD_DIRECT', default_commission_pct: 12 },
];

let beneficiaries: MonetizationBeneficiary[] = [
  { 
    id: 'b1', type: 'PERSONA', name: 'Jennifer Zuluaga', identification: '12345678', 
    legal_note: 'Régimen Simplificado', retentions_enabled: true, default_retention_pct: 4, active: true,
    bank_info: { bank: 'Bancolombia', type: 'Ahorros', number: '123-456789-00' }
  },
  { 
    id: 'b2', type: 'EMPRESA', name: 'Studio Satelite SAS', identification: '900.111.222-3', 
    legal_note: 'Responsable de IVA', retentions_enabled: true, default_retention_pct: 11, active: true,
    bank_info: { bank: 'Davivienda', type: 'Corriente', number: '999-888777-11' }
  },
  { 
    id: 'b3', type: 'PERSONA', name: 'Ana Acero', identification: '87654321', 
    legal_note: 'Persona Natural', retentions_enabled: false, active: true
  }
];

let liquidations: Liquidation[] = [
  {
    id: 'LIQ-1001', studio_id: '1', date: '2025-05-25', beneficiary_id: 'b1', beneficiary_name: 'Jennifer Zuluaga', beneficiary_doc: '12345678',
    items: [
        { id: 'i1', platform_id: 'p1', platform_name: 'Paxum', type: 'USD', amount_usd: 500, token_value_snapshot: 0.05, calculated_usd: 500 },
        { id: 'i2', platform_id: 'p3', platform_name: 'Tokens', type: 'TOKENS', tokens: 2000, token_value_snapshot: 0.05, calculated_usd: 100 }
    ],
    trm_pago: 3800, trm_real: 4000,
    total_usd: 600, total_cop_bruto: 2280000,
    commission_percentage: 10, commission_cop: 228000,
    discounts: [], total_discounts_cop: 0,
    retentions: [{ id: 'r1', type: 'Retefuente (4%)', percentage: 4, base_amount_cop: 2052000, calculated_amount_cop: 82080 }],
    total_retentions_cop: 82080,
    base_payable_cop: 2052000,
    total_payable_cop: 1969920,
    spread_profit_cop: 120000, // (4000-3800)*600
    total_real_profit_cop: 348000,
    status: 'PAID', created_at: '2025-05-25T10:00:00Z'
  }
];

const MonetizationService = {
  // Config
  getTokenValue: () => 0.05,
  
  // CRUD Platforms
  getPlatforms: async () => {
    await new Promise(r => setTimeout(r, 400));
    return [...platforms];
  },
  
  // CRUD Beneficiaries
  getBeneficiaries: async () => {
    await new Promise(r => setTimeout(r, 400));
    return [...beneficiaries];
  },

  // CRUD Liquidations
  getLiquidations: async () => {
    await new Promise(r => setTimeout(r, 600));
    return [...liquidations].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  saveLiquidation: async (liq: Partial<Liquidation>) => {
    await new Promise(r => setTimeout(r, 800));
    const newLiq = { 
        ...liq, 
        id: liq.id || `LIQ-${Date.now()}`,
        created_at: liq.created_at || new Date().toISOString(),
        status: liq.status || 'DRAFT'
    } as Liquidation;
    
    // Update or Create
    const idx = liquidations.findIndex(l => l.id === newLiq.id);
    if (idx >= 0) {
        liquidations[idx] = newLiq;
    } else {
        liquidations.unshift(newLiq);
    }
    return newLiq;
  },

  calculateLiquidation: (data: Partial<Liquidation>): Partial<Liquidation> => {
      // 1. Calculate Total USD
      let totalUSD = 0;
      const processedItems = data.items?.map(item => {
          let lineUSD = 0;
          if (item.type === 'USD') lineUSD = item.amount_usd || 0;
          if (item.type === 'TOKENS') lineUSD = (item.tokens || 0) * item.token_value_snapshot;
          totalUSD += lineUSD;
          return { ...item, calculated_usd: lineUSD };
      }) || [];

      // 2. COP Bruto
      const trm = data.trm_pago || 0;
      const copBruto = totalUSD * trm;

      // 3. Commission
      const commPct = data.commission_percentage || 0;
      const commissionCOP = copBruto * (commPct / 100);
      const basePayable = copBruto - commissionCOP;

      // 4. Retentions
      // Logic: If manual retentions passed, recalculate? Or standard.
      // Assuming simple calculation based on basePayable if enabled.
      // For this mock, we assume the UI passes calculated retentions array or we sum it up.
      const totalRetentions = data.retentions?.reduce((acc, r) => acc + r.calculated_amount_cop, 0) || 0;

      // 5. Discounts
      const totalDiscounts = data.discounts?.reduce((acc, d) => acc + d.amount_cop, 0) || 0;

      // 6. Final
      const totalPayable = basePayable - totalRetentions - totalDiscounts;

      // 7. Private Spread
      const trmReal = data.trm_real || trm;
      const spreadProfit = (trmReal - trm) * totalUSD;
      const totalRealProfit = commissionCOP + spreadProfit;

      return {
          ...data,
          items: processedItems,
          total_usd: totalUSD,
          total_cop_bruto: copBruto,
          commission_cop: commissionCOP,
          base_payable_cop: basePayable,
          total_retentions_cop: totalRetentions,
          total_discounts_cop: totalDiscounts,
          total_payable_cop: totalPayable,
          spread_profit_cop: spreadProfit,
          total_real_profit_cop: totalRealProfit
      };
  }
};

export default MonetizationService;
