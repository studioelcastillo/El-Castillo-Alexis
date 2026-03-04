import { supabase } from "../../supabaseClient";

const toNumber = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

export default {
  getTokenValue() {
    return 0.05;
  },

  async getPlatforms() {
    const { data, error } = await supabase
      .from("monetization_platforms")
      .select("*")
      .eq("is_active", true)
      .order("platform_name", { ascending: true });

    const rows = (data || []).map((row) => ({
      id: String(row.platform_id),
      name: row.platform_name,
      type: row.platform_type,
      default_commission_pct: toNumber(row.default_commission_pct),
      notes: row.notes || undefined,
    }));

    return { data: { data: rows }, error };
  },

  async getBeneficiaries() {
    const { data, error } = await supabase
      .from("monetization_beneficiaries")
      .select("*")
      .order("beneficiary_name", { ascending: true });

    const rows = (data || []).map((row) => ({
      id: String(row.beneficiary_id),
      type: row.beneficiary_type,
      name: row.beneficiary_name,
      identification: row.beneficiary_identification,
      legal_note: row.beneficiary_legal_note || "",
      retentions_enabled: row.retentions_enabled === true,
      default_retention_pct: toNumber(row.default_retention_pct),
      default_commission_pct: toNumber(row.default_commission_pct),
      active: row.beneficiary_active !== false,
      bank_info: row.bank_info || undefined,
    }));

    return { data: { data: rows }, error };
  },

  async getLiquidations() {
    const { data: liquidations, error } = await supabase
      .from("monetization_liquidations")
      .select("*")
      .order("created_at", { ascending: false });

    const ids = (liquidations || []).map((row) => row.liquidation_id);

    const [itemsRes, discountsRes, retentionsRes] = await Promise.all([
      ids.length
        ? supabase
            .from("monetization_liquidation_items")
            .select("*")
            .in("liquidation_id", ids)
        : { data: [] },
      ids.length
        ? supabase
            .from("monetization_liquidation_discounts")
            .select("*")
            .in("liquidation_id", ids)
        : { data: [] },
      ids.length
        ? supabase
            .from("monetization_liquidation_retentions")
            .select("*")
            .in("liquidation_id", ids)
        : { data: [] },
    ]);

    const itemsBy = new Map();
    (itemsRes.data || []).forEach((row) => {
      const list = itemsBy.get(row.liquidation_id) || [];
      list.push(row);
      itemsBy.set(row.liquidation_id, list);
    });

    const discountsBy = new Map();
    (discountsRes.data || []).forEach((row) => {
      const list = discountsBy.get(row.liquidation_id) || [];
      list.push(row);
      discountsBy.set(row.liquidation_id, list);
    });

    const retentionsBy = new Map();
    (retentionsRes.data || []).forEach((row) => {
      const list = retentionsBy.get(row.liquidation_id) || [];
      list.push(row);
      retentionsBy.set(row.liquidation_id, list);
    });

    const rows = (liquidations || []).map((row) => ({
      id: String(row.liquidation_id),
      studio_id: String(row.std_id || ""),
      date: row.liquidation_date,
      beneficiary_id: String(row.beneficiary_id || ""),
      beneficiary_name: row.beneficiary_name || undefined,
      beneficiary_doc: row.beneficiary_doc || undefined,
      items: (itemsBy.get(row.liquidation_id) || []).map((item) => ({
        id: String(item.liquidation_item_id),
        platform_id: item.platform_id ? String(item.platform_id) : undefined,
        platform_name: item.platform_name || undefined,
        type: item.item_type,
        amount_usd: toNumber(item.amount_usd),
        tokens: toNumber(item.tokens),
        token_value_snapshot: toNumber(item.token_value_snapshot),
        calculated_usd: toNumber(item.calculated_usd),
      })),
      trm_pago: toNumber(row.trm_pago),
      trm_real: toNumber(row.trm_real),
      total_usd: toNumber(row.total_usd),
      total_cop_bruto: toNumber(row.total_cop_bruto),
      commission_percentage: toNumber(row.commission_percentage),
      commission_cop: toNumber(row.commission_cop),
      discounts: (discountsBy.get(row.liquidation_id) || []).map((d) => ({
        id: String(d.liquidation_discount_id),
        description: d.description,
        amount_cop: toNumber(d.amount_cop),
      })),
      total_discounts_cop: toNumber(row.total_discounts_cop),
      retentions: (retentionsBy.get(row.liquidation_id) || []).map((r) => ({
        id: String(r.liquidation_retention_id),
        type: r.retention_type,
        percentage: toNumber(r.percentage),
        base_amount_cop: toNumber(r.base_amount_cop),
        calculated_amount_cop: toNumber(r.calculated_amount_cop),
      })),
      total_retentions_cop: toNumber(row.total_retentions_cop),
      base_payable_cop: toNumber(row.base_payable_cop),
      total_payable_cop: toNumber(row.total_payable_cop),
      spread_profit_cop: toNumber(row.spread_profit_cop),
      total_real_profit_cop: toNumber(row.total_real_profit_cop),
      status: row.liquidation_status || "DRAFT",
      created_at: row.created_at || new Date().toISOString(),
    }));

    return { data: { data: rows }, error };
  },

  async saveLiquidation(params) {
    const liq = params || {};
    const idNum = liq.id ? Number(liq.id) : null;
    const payload = {
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
      liquidation_status: liq.status || "DRAFT",
    };

    let row;
    let error;
    if (idNum) {
      const res = await supabase
        .from("monetization_liquidations")
        .update(payload)
        .eq("liquidation_id", idNum)
        .select("*")
        .single();
      row = res.data;
      error = res.error;
    } else {
      const res = await supabase
        .from("monetization_liquidations")
        .insert([payload])
        .select("*")
        .single();
      row = res.data;
      error = res.error;
    }

    if (!row) {
      return { data: { status: "Error", message: "No se pudo guardar la liquidacion" }, error: error || new Error("No se pudo guardar la liquidacion") };
    }

    const liquidationId = row.liquidation_id;

    await Promise.all([
      supabase.from("monetization_liquidation_items").delete().eq("liquidation_id", liquidationId),
      supabase.from("monetization_liquidation_discounts").delete().eq("liquidation_id", liquidationId),
      supabase.from("monetization_liquidation_retentions").delete().eq("liquidation_id", liquidationId),
    ]);

    if (liq.items && liq.items.length) {
      await supabase.from("monetization_liquidation_items").insert(
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
      await supabase.from("monetization_liquidation_discounts").insert(
        liq.discounts.map((d) => ({
          liquidation_id: liquidationId,
          description: d.description,
          amount_cop: d.amount_cop || 0,
        }))
      );
    }

    if (liq.retentions && liq.retentions.length) {
      await supabase.from("monetization_liquidation_retentions").insert(
        liq.retentions.map((r) => ({
          liquidation_id: liquidationId,
          retention_type: r.type,
          percentage: r.percentage || 0,
          base_amount_cop: r.base_amount_cop || 0,
          calculated_amount_cop: r.calculated_amount_cop || 0,
        }))
      );
    }

    return {
      data: {
        data: {
          ...liq,
          id: String(liquidationId),
          created_at: row.created_at || new Date().toISOString(),
          status: row.liquidation_status || "DRAFT",
        },
        status: error ? "Error" : "Success",
      },
      error,
    };
  },

  calculateLiquidation(data) {
    let totalUSD = 0;
    const processedItems =
      data.items?.map((item) => {
        let lineUSD = 0;
        if (item.type === "USD") lineUSD = item.amount_usd || 0;
        if (item.type === "TOKENS") lineUSD = (item.tokens || 0) * item.token_value_snapshot;
        totalUSD += lineUSD;
        return { ...item, calculated_usd: lineUSD };
      }) || [];

    const trm = data.trm_pago || 0;
    const copBruto = totalUSD * trm;
    const commPct = data.commission_percentage || 0;
    const commissionCOP = copBruto * (commPct / 100);
    const basePayable = copBruto - commissionCOP;

    const totalRetentions = data.retentions?.reduce((acc, r) => acc + r.calculated_amount_cop, 0) || 0;
    const totalDiscounts = data.discounts?.reduce((acc, d) => acc + d.amount_cop, 0) || 0;

    const totalPayable = basePayable - totalRetentions - totalDiscounts;
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
      total_real_profit_cop: totalRealProfit,
    };
  },
};
