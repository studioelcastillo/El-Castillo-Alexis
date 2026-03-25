import { supabase } from './supabaseClient';
import { getCurrentStudioId } from './tenant';
import { getTenantSettingValue } from './tenantSettings';
import {
  MonetizationPlatform,
  MonetizationBeneficiary,
  Liquidation,
  LiquidationItem,
  LiquidationDiscount,
  LiquidationRetention,
} from './types';

const TOKEN_VALUE_KEY = 'monetization_token_value';

const toNumber = (value: any) => (Number.isFinite(Number(value)) ? Number(value) : 0);

const MonetizationService = {
  async getTokenValue(): Promise<number | null> {
    const value = await getTenantSettingValue(TOKEN_VALUE_KEY, getCurrentStudioId());

    if (value) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }

    return null;
  },

  async getPlatforms(): Promise<MonetizationPlatform[]> {
    const { data, error } = await supabase
      .from('monetization_platforms')
      .select('*')
      .order('platform_name', { ascending: true });

    if (error) {
      console.error('Monetization platforms error', error);
      return [];
    }

    return (data || [])
      .filter((row: any) => row.is_active !== false)
      .map((row: any) => ({
        id: String(row.platform_id),
        name: row.platform_name,
        type: row.platform_type,
        default_commission_pct: toNumber(row.default_commission_pct),
        notes: row.notes || undefined,
      }));
  },

  async savePlatform(platform: Partial<MonetizationPlatform>) {
    const payload: any = {
      platform_name: platform.name,
      platform_type: platform.type,
      default_commission_pct: platform.default_commission_pct || 0,
      notes: platform.notes || null,
      is_active: true,
    };

    if (platform.id) {
      await supabase
        .from('monetization_platforms')
        .update(payload)
        .eq('platform_id', platform.id);
      return { ...platform } as MonetizationPlatform;
    }

    const { data } = await supabase
      .from('monetization_platforms')
      .insert([payload])
      .select('*')
      .single();

    return data
      ? {
          id: String(data.platform_id),
          name: data.platform_name,
          type: data.platform_type,
          default_commission_pct: toNumber(data.default_commission_pct),
          notes: data.notes || undefined,
        }
      : (platform as MonetizationPlatform);
  },

  async getBeneficiaries(): Promise<MonetizationBeneficiary[]> {
    const { data, error } = await supabase
      .from('monetization_beneficiaries')
      .select('*')
      .order('beneficiary_name', { ascending: true });

    if (error) {
      console.error('Monetization beneficiaries error', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: String(row.beneficiary_id),
      type: row.beneficiary_type,
      name: row.beneficiary_name,
      identification: row.beneficiary_identification,
      legal_note: row.beneficiary_legal_note || '',
      retentions_enabled: row.retentions_enabled === true,
      default_retention_pct: toNumber(row.default_retention_pct),
      default_commission_pct: toNumber(row.default_commission_pct),
      active: row.beneficiary_active !== false,
      bank_info: row.bank_info || undefined,
    }));
  },

  async saveBeneficiary(beneficiary: Partial<MonetizationBeneficiary>) {
    const payload: any = {
      beneficiary_type: beneficiary.type,
      beneficiary_name: beneficiary.name,
      beneficiary_identification: beneficiary.identification,
      beneficiary_legal_note: beneficiary.legal_note || null,
      retentions_enabled: beneficiary.retentions_enabled === true,
      default_retention_pct: beneficiary.default_retention_pct || 0,
      default_commission_pct: beneficiary.default_commission_pct || 0,
      beneficiary_active: beneficiary.active !== false,
      bank_info: beneficiary.bank_info || null,
    };

    if (beneficiary.id) {
      await supabase
        .from('monetization_beneficiaries')
        .update(payload)
        .eq('beneficiary_id', beneficiary.id);
      return { ...beneficiary } as MonetizationBeneficiary;
    }

    const { data } = await supabase
      .from('monetization_beneficiaries')
      .insert([payload])
      .select('*')
      .single();

    return data
      ? {
          id: String(data.beneficiary_id),
          type: data.beneficiary_type,
          name: data.beneficiary_name,
          identification: data.beneficiary_identification,
          legal_note: data.beneficiary_legal_note || '',
          retentions_enabled: data.retentions_enabled === true,
          default_retention_pct: toNumber(data.default_retention_pct),
          default_commission_pct: toNumber(data.default_commission_pct),
          active: data.beneficiary_active !== false,
          bank_info: data.bank_info || undefined,
        }
      : (beneficiary as MonetizationBeneficiary);
  },

  async deleteBeneficiary(id: string) {
    const { error } = await supabase
      .from('monetization_beneficiaries')
      .delete()
      .eq('beneficiary_id', id);
    if (error) throw error;
  },

  async getLiquidations(): Promise<Liquidation[]> {
    const { data, error } = await supabase
      .from('monetization_liquidations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Monetization liquidations error', error);
      return [];
    }

    const ids = (data || []).map((row: any) => row.liquidation_id).filter(Boolean);
    const { data: itemsRows } = ids.length
      ? await supabase.from('monetization_liquidation_items').select('*').in('liquidation_id', ids)
      : { data: [] };
    const { data: discountRows } = ids.length
      ? await supabase.from('monetization_liquidation_discounts').select('*').in('liquidation_id', ids)
      : { data: [] };
    const { data: retentionRows } = ids.length
      ? await supabase.from('monetization_liquidation_retentions').select('*').in('liquidation_id', ids)
      : { data: [] };

    const itemsByLiquidation = new Map<number, LiquidationItem[]>();
    (itemsRows || []).forEach((row: any) => {
      const list = itemsByLiquidation.get(row.liquidation_id) || [];
      list.push({
        id: String(row.liquidation_item_id),
        platform_id: row.platform_id ? String(row.platform_id) : undefined,
        platform_name: row.platform_name || undefined,
        type: row.item_type,
        amount_usd: toNumber(row.amount_usd),
        tokens: toNumber(row.tokens),
        token_value_snapshot: toNumber(row.token_value_snapshot),
        calculated_usd: toNumber(row.calculated_usd),
      });
      itemsByLiquidation.set(row.liquidation_id, list);
    });

    const discountsByLiquidation = new Map<number, LiquidationDiscount[]>();
    (discountRows || []).forEach((row: any) => {
      const list = discountsByLiquidation.get(row.liquidation_id) || [];
      list.push({
        id: String(row.liquidation_discount_id),
        description: row.description,
        amount_cop: toNumber(row.amount_cop),
      });
      discountsByLiquidation.set(row.liquidation_id, list);
    });

    const retentionsByLiquidation = new Map<number, LiquidationRetention[]>();
    (retentionRows || []).forEach((row: any) => {
      const list = retentionsByLiquidation.get(row.liquidation_id) || [];
      list.push({
        id: String(row.liquidation_retention_id),
        type: row.retention_type,
        percentage: toNumber(row.percentage),
        base_amount_cop: toNumber(row.base_amount_cop),
        calculated_amount_cop: toNumber(row.calculated_amount_cop),
      });
      retentionsByLiquidation.set(row.liquidation_id, list);
    });

    return (data || []).map((row: any) => ({
      id: String(row.liquidation_id),
      studio_id: String(row.std_id || ''),
      date: row.liquidation_date,
      beneficiary_id: row.beneficiary_id ? String(row.beneficiary_id) : '',
      beneficiary_name: row.beneficiary_name || undefined,
      beneficiary_doc: row.beneficiary_doc || undefined,
      items: itemsByLiquidation.get(row.liquidation_id) || [],
      trm_pago: toNumber(row.trm_pago),
      trm_real: toNumber(row.trm_real),
      total_usd: toNumber(row.total_usd),
      total_cop_bruto: toNumber(row.total_cop_bruto),
      commission_percentage: toNumber(row.commission_percentage),
      commission_cop: toNumber(row.commission_cop),
      discounts: discountsByLiquidation.get(row.liquidation_id) || [],
      total_discounts_cop: toNumber(row.total_discounts_cop),
      retentions: retentionsByLiquidation.get(row.liquidation_id) || [],
      total_retentions_cop: toNumber(row.total_retentions_cop),
      base_payable_cop: toNumber(row.base_payable_cop),
      total_payable_cop: toNumber(row.total_payable_cop),
      spread_profit_cop: toNumber(row.spread_profit_cop),
      total_real_profit_cop: toNumber(row.total_real_profit_cop),
      status: row.liquidation_status === 'PAID' ? 'PAID' : 'DRAFT',
      created_at: row.created_at || new Date().toISOString(),
    }));
  },

  async saveLiquidation(liq: Partial<Liquidation>) {
    const payload: any = {
      std_id: liq.studio_id ? Number(liq.studio_id) : null,
      liquidation_date: liq.date,
      beneficiary_id: liq.beneficiary_id ? Number(liq.beneficiary_id) : null,
      beneficiary_name: liq.beneficiary_name || null,
      beneficiary_doc: liq.beneficiary_doc || null,
      trm_pago: liq.trm_pago || 0,
      trm_real: liq.trm_real || 0,
      total_usd: liq.total_usd || 0,
      total_cop_bruto: liq.total_cop_bruto || 0,
      commission_percentage: liq.commission_percentage || 0,
      commission_cop: liq.commission_cop || 0,
      total_discounts_cop: liq.total_discounts_cop || 0,
      total_retentions_cop: liq.total_retentions_cop || 0,
      base_payable_cop: liq.base_payable_cop || 0,
      total_payable_cop: liq.total_payable_cop || 0,
      spread_profit_cop: liq.spread_profit_cop || 0,
      total_real_profit_cop: liq.total_real_profit_cop || 0,
      liquidation_status: liq.status || 'DRAFT',
    };

    let liquidationId = liq.id ? Number(liq.id) : null;

    if (liquidationId) {
      await supabase
        .from('monetization_liquidations')
        .update(payload)
        .eq('liquidation_id', liquidationId);
    } else {
      const { data } = await supabase
        .from('monetization_liquidations')
        .insert([payload])
        .select('liquidation_id')
        .single();
      liquidationId = data?.liquidation_id || null;
    }

    if (!liquidationId) return liq as Liquidation;

    await supabase.from('monetization_liquidation_items').delete().eq('liquidation_id', liquidationId);
    await supabase.from('monetization_liquidation_discounts').delete().eq('liquidation_id', liquidationId);
    await supabase.from('monetization_liquidation_retentions').delete().eq('liquidation_id', liquidationId);

    if (liq.items && liq.items.length) {
      await supabase.from('monetization_liquidation_items').insert(
        liq.items.map((item) => ({
          liquidation_id: liquidationId,
          platform_id: item.platform_id ? Number(item.platform_id) : null,
          platform_name: item.platform_name || null,
          item_type: item.type,
          amount_usd: item.amount_usd || 0,
          tokens: item.tokens || 0,
          token_value_snapshot: item.token_value_snapshot || 0,
          calculated_usd: item.calculated_usd || 0,
        }))
      );
    }

    if (liq.discounts && liq.discounts.length) {
      await supabase.from('monetization_liquidation_discounts').insert(
        liq.discounts.map((disc) => ({
          liquidation_id: liquidationId,
          description: disc.description,
          amount_cop: disc.amount_cop || 0,
        }))
      );
    }

    if (liq.retentions && liq.retentions.length) {
      await supabase.from('monetization_liquidation_retentions').insert(
        liq.retentions.map((ret) => ({
          liquidation_id: liquidationId,
          retention_type: ret.type,
          percentage: ret.percentage || 0,
          base_amount_cop: ret.base_amount_cop || 0,
          calculated_amount_cop: ret.calculated_amount_cop || 0,
        }))
      );
    }

    return { ...(liq as Liquidation), id: String(liquidationId) };
  },

  async deleteLiquidation(id: string) {
    // Delete items, discounts, retentions first if they are not cascaded (though Supabase usually handles FK delete)
    // Actually, it's safer to delete them explicitly if not sure about cascade config
    await supabase.from('monetization_liquidation_items').delete().eq('liquidation_id', id);
    await supabase.from('monetization_liquidation_discounts').delete().eq('liquidation_id', id);
    await supabase.from('monetization_liquidation_retentions').delete().eq('liquidation_id', id);
    
    const { error } = await supabase
      .from('monetization_liquidations')
      .delete()
      .eq('liquidation_id', id);
    if (error) throw error;
  },

  calculateLiquidation(data: Partial<Liquidation>): Partial<Liquidation> {
    let totalUSD = 0;
    let totalCommissionCOP = 0;
    const trm = data.trm_pago || 0;

    const processedItems = data.items?.map((item) => {
      let lineUSD = 0;
      if (item.type === 'USD') lineUSD = item.amount_usd || 0;
      if (item.type === 'TOKENS') lineUSD = (item.tokens || 0) * item.token_value_snapshot;
      
      const lineCOP = lineUSD * trm;
      const lineCommPct = item.commission_percentage ?? data.commission_percentage ?? 0;
      const lineCommCOP = lineCOP * (lineCommPct / 100);
      
      totalUSD += lineUSD;
      totalCommissionCOP += lineCommCOP;
      
      return { ...item, calculated_usd: lineUSD } as LiquidationItem;
    }) || [];

    const copBruto = totalUSD * trm;
    const basePayable = copBruto - totalCommissionCOP;
    const totalRetentions = data.retentions?.reduce((acc, r) => acc + (r.calculated_amount_cop || 0), 0) || 0;
    const totalDiscounts = data.discounts?.reduce((acc, d) => acc + (d.amount_cop || 0), 0) || 0;
    const totalPayable = basePayable - totalRetentions - totalDiscounts;
    const trmReal = data.trm_real || trm;
    const spreadProfit = (trmReal - trm) * totalUSD;
    const totalRealProfit = totalCommissionCOP + spreadProfit;

    return {
      ...data,
      items: processedItems,
      total_usd: totalUSD,
      total_cop_bruto: copBruto,
      commission_cop: totalCommissionCOP,
      base_payable_cop: basePayable,
      total_retentions_cop: totalRetentions,
      total_discounts_cop: totalDiscounts,
      total_payable_cop: totalPayable,
      spread_profit_cop: spreadProfit,
      total_real_profit_cop: totalRealProfit,
    };
  },

  async getDashboardData() {
    const now = new Date();
    const months: string[] = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    const { data: liquidations } = await supabase
      .from('monetization_liquidations')
      .select('*')
      .gte('liquidation_date', `${months[0]}-01`);

    const itemsByMonth: Record<string, { income: number; profit: number }> = {};
    months.forEach((m) => { itemsByMonth[m] = { income: 0, profit: 0 }; });

    (liquidations || []).forEach((row: any) => {
      const monthKey = row.liquidation_date?.slice(0, 7);
      if (itemsByMonth[monthKey]) {
        itemsByMonth[monthKey].income += toNumber(row.total_cop_bruto);
        itemsByMonth[monthKey].profit += toNumber(row.total_real_profit_cop || row.commission_cop);
      }
    });

    const monthlyStats = months.map((m) => ({
      month: m.split('-')[1],
      income: itemsByMonth[m].income,
      profit: itemsByMonth[m].profit,
    }));

    const { data: items } = await supabase
      .from('monetization_liquidation_items')
      .select('*');

    const platformMap: Record<string, number> = {};
    (items || []).forEach((item: any) => {
      const name = item.platform_name || 'Otro';
      platformMap[name] = (platformMap[name] || 0) + toNumber(item.calculated_usd || item.amount_usd || 0);
    });

    const platformStats = Object.entries(platformMap).map(([name, value]) => ({ name, value }));

    const beneficiaryMap: Record<string, number> = {};
    (liquidations || []).forEach((row: any) => {
      const name = row.beneficiary_name || 'Beneficiario';
      beneficiaryMap[name] = (beneficiaryMap[name] || 0) + toNumber(row.total_payable_cop);
    });

    const topBeneficiaries = Object.entries(beneficiaryMap)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return {
      monthlyStats,
      platformStats,
      topBeneficiaries,
      totals: {
        totalUSD: (liquidations || []).reduce((acc: number, row: any) => acc + toNumber(row.total_usd), 0),
        totalProfitCOP: (liquidations || []).reduce((acc: number, row: any) => acc + toNumber(row.total_real_profit_cop), 0),
        pendingLiquidations: (liquidations || []).filter((row: any) => row.liquidation_status !== 'PAID').length,
      },
    };
  },
};

export default MonetizationService;
