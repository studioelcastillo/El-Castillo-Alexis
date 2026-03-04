import { supabase } from "../../supabaseClient";

const DEFAULT_STUDIO_ID = 1;

const toNumber = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

const slugify = (value) =>
  (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const mapVariant = (row) => ({
  id: String(row.variant_id),
  product_id: String(row.prod_id),
  sku: row.variant_sku || "",
  name: row.variant_name || "Default",
  attributes: row.attributes_json || {},
  current_stock: toNumber(row.variant_stock),
  status: row.variant_status || "IN_STOCK",
  price_override: row.price_override ?? undefined,
});

const mapProduct = (row) => {
  const images = (row.product_images || []).map((img) => ({
    id: String(img.prod_image_id),
    url_thumb: img.url_thumb || img.url_original || "",
    url_medium: img.url_medium || img.url_original || "",
    url_original: img.url_original || "",
    is_main: img.is_main === true,
  }));

  const variants = (row.product_variants || []).map(mapVariant);

  const totalStock =
    row.prod_stock ?? variants.reduce((acc, v) => acc + toNumber(v.variant_stock), 0);
  const minStock = toNumber(row.prod_min_stock);
  let status = row.prod_status;
  if (!status) {
    status = totalStock <= 0 ? "OUT_OF_STOCK" : totalStock <= minStock ? "LOW_STOCK" : "IN_STOCK";
  }

  return {
    id: String(row.prod_id),
    studio_id: String(row.std_id || DEFAULT_STUDIO_ID),
    name: row.prod_name,
    category_id: String(row.cate_id),
    brand: row.prod_brand || undefined,
    unit: row.prod_unit || "UND",
    description_short: row.prod_description_short || "",
    description_long: row.prod_description_long || "",
    images,
    price_base: toNumber(row.prod_sale_price),
    min_stock: minStock,
    total_stock: toNumber(totalStock),
    is_active: row.prod_is_active !== false,
    status,
    tax_rate: toNumber(row.prod_tax_rate),
    variants,
  };
};

export default {
  async getProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*, product_variants(*), product_images(*)")
      .eq("std_id", DEFAULT_STUDIO_ID)
      .order("prod_name", { ascending: true });

    return { data: { data: (data || []).map(mapProduct) }, error };
  },

  async getCategories() {
    const { data, error } = await supabase
      .from("categories")
      .select("cate_id, cate_name")
      .order("cate_name", { ascending: true });

    const rows = (data || []).map((row) => ({
      id: String(row.cate_id),
      name: row.cate_name,
      slug: slugify(row.cate_name || ""),
    }));

    return { data: { data: rows }, error };
  },

  async getCostCenters() {
    const { data, error } = await supabase
      .from("cost_centers")
      .select("*")
      .eq("std_id", DEFAULT_STUDIO_ID)
      .order("cost_center_name", { ascending: true });

    const rows = (data || []).map((row) => ({
      id: String(row.cost_center_id),
      code: row.cost_center_code,
      name: row.cost_center_name,
    }));

    return { data: { data: rows }, error };
  },

  async getInventory() {
    const { data: lotsRows, error: lotsError } = await supabase
      .from("inventory_lots")
      .select("*")
      .order("received_at", { ascending: false });

    const { data: movRows, error: movError } = await supabase
      .from("inventory_movements")
      .select("*")
      .order("movement_date", { ascending: false });

    const lots = (lotsRows || []).map((row) => ({
      id: String(row.lot_id),
      product_variant_id: String(row.variant_id),
      received_at: row.received_at,
      unit_cost: toNumber(row.unit_cost),
      initial_qty: toNumber(row.initial_qty),
      current_qty: toNumber(row.current_qty),
    }));

    const movements = (movRows || []).map((row) => ({
      id: String(row.movement_id),
      variant_id: String(row.variant_id),
      type: row.movement_type,
      qty: toNumber(row.qty),
      date: row.movement_date || row.created_at,
    }));

    return { data: { data: { lots, movements } }, error: lotsError || movError || null };
  },

  async getLoans() {
    const { data, error } = await supabase
      .from("installment_plans")
      .select("*, users(user_name, user_surname)")
      .order("created_at", { ascending: false });

    const rows = (data || []).map((row) => ({
      id: String(row.plan_id),
      user_name: `${row.users?.user_name || ""} ${row.users?.user_surname || ""}`.trim(),
      total_amount: toNumber(row.total_amount),
      monthly_payment: toNumber(row.monthly_payment),
      term_months: row.term_months,
    }));

    return { data: { data: rows }, error };
  },

  async getLoanRequests() {
    const { data, error } = await supabase
      .from("loan_requests")
      .select("*")
      .order("created_at", { ascending: false });

    const rows = (data || []).map((row) => ({
      id: String(row.loan_request_id),
      user_id: row.user_id,
      amount: toNumber(row.amount),
      periods: row.periods,
      reason: row.reason || "",
      status: row.status,
    }));

    return { data: { data: rows }, error };
  },

  async getOrders() {
    const { data, error } = await supabase
      .from("store_orders")
      .select("*, store_order_items(*)")
      .order("created_at", { ascending: false });

    const rows = (data || []).map((row) => ({
      id: String(row.order_id),
      studio_id: String(row.std_id || DEFAULT_STUDIO_ID),
      buyer_user_id: row.buyer_user_id,
      buyer_name: row.buyer_name || "",
      cost_center_id: row.cost_center_id ? String(row.cost_center_id) : undefined,
      status: row.order_status,
      items: row.store_order_items || [],
      subtotal: toNumber(row.subtotal),
      tax_total: toNumber(row.tax_total),
      total_amount: toNumber(row.total_amount),
      payment_method: row.payment_method,
      created_at: row.created_at,
      payment_details: row.payment_details || undefined,
    }));

    return { data: { data: rows }, error };
  },

  async getRequisitions() {
    const { data, error } = await supabase
      .from("requisitions")
      .select("*")
      .order("created_at", { ascending: false });

    const rows = (data || []).map((row) => ({
      id: String(row.requisition_id),
      user_id: row.user_id,
      user_name: row.user_name || "",
      product_name: row.product_name,
      qty: toNumber(row.qty),
      urgency: row.urgency,
    }));

    return { data: { data: rows }, error };
  },

  async getFinancialRules(params) {
    const roleId = params?.roleId ?? params?.role_id ?? params;
    const { data, error } = await supabase
      .from("financial_rules")
      .select("*")
      .eq("role_id", roleId);

    const rows = (data || []).map((row) => ({
      role_id: row.role_id,
      term_type: row.term_type,
      allowed: row.allowed !== false,
      max_amount: toNumber(row.max_amount),
      max_periods: row.max_periods,
      interest_rate: toNumber(row.interest_rate),
      requires_approval: row.requires_approval === true,
    }));

    return { data: { data: rows }, error };
  },

  async createProduct(params) {
    const p = params || {};
    const payload = {
      std_id: DEFAULT_STUDIO_ID,
      cate_id: p.category_id ? Number(p.category_id) : null,
      prod_code: p.name ? slugify(p.name).toUpperCase() : "NEW",
      prod_name: p.name || "Nuevo Producto",
      prod_purchase_price: 0,
      prod_sale_price: p.price_base || 0,
      prod_stock: p.total_stock || 0,
      prod_brand: p.brand || null,
      prod_unit: p.unit || "UND",
      prod_description_short: p.description_short || "",
      prod_description_long: p.description_long || "",
      prod_min_stock: p.min_stock || 0,
      prod_is_active: p.is_active !== false,
      prod_status: p.status || null,
      prod_tax_rate: p.tax_rate || 0,
    };

    const { data: row, error } = await supabase
      .from("products")
      .insert([payload])
      .select("*")
      .single();

    const prodId = row?.prod_id;

    if (prodId && p.images && p.images.length) {
      await supabase.from("product_images").insert(
        p.images.map((img) => ({
          prod_id: prodId,
          url_thumb: img.url_thumb,
          url_medium: img.url_medium,
          url_original: img.url_original,
          is_main: img.is_main === true,
        }))
      );
    }

    if (prodId && p.variants && p.variants.length) {
      await supabase.from("product_variants").insert(
        p.variants.map((v) => ({
          prod_id: prodId,
          variant_sku: v.sku,
          variant_name: v.name,
          attributes_json: v.attributes || {},
          variant_stock: v.current_stock || 0,
          variant_status: v.status || "IN_STOCK",
          price_override: v.price_override ?? null,
        }))
      );
    }

    const mapped = row
      ? mapProduct({ ...row, product_images: p.images || [], product_variants: p.variants || [] })
      : null;

    return { data: { data: mapped, status: error ? "Error" : "Success" }, error };
  },

  async updateProduct(params) {
    const id = params?.id || params?.prod_id;
    const p = params || {};
    const payload = {
      cate_id: p.category_id ? Number(p.category_id) : undefined,
      prod_name: p.name,
      prod_sale_price: p.price_base,
      prod_stock: p.total_stock,
      prod_brand: p.brand,
      prod_unit: p.unit,
      prod_description_short: p.description_short,
      prod_description_long: p.description_long,
      prod_min_stock: p.min_stock,
      prod_is_active: p.is_active,
      prod_status: p.status,
      prod_tax_rate: p.tax_rate,
      updated_at: new Date().toISOString(),
    };

    const { data: row, error } = await supabase
      .from("products")
      .update(payload)
      .eq("prod_id", id)
      .select("*")
      .single();

    if (p.images) {
      await supabase.from("product_images").delete().eq("prod_id", id);
      if (p.images.length) {
        await supabase.from("product_images").insert(
          p.images.map((img) => ({
            prod_id: id,
            url_thumb: img.url_thumb,
            url_medium: img.url_medium,
            url_original: img.url_original,
            is_main: img.is_main === true,
          }))
        );
      }
    }

    if (p.variants) {
      await supabase.from("product_variants").delete().eq("prod_id", id);
      if (p.variants.length) {
        await supabase.from("product_variants").insert(
          p.variants.map((v) => ({
            prod_id: id,
            variant_sku: v.sku,
            variant_name: v.name,
            attributes_json: v.attributes || {},
            variant_stock: v.current_stock || 0,
            variant_status: v.status || "IN_STOCK",
            price_override: v.price_override ?? null,
          }))
        );
      }
    }

    const mapped = row
      ? mapProduct({ ...row, product_images: p.images || [], product_variants: p.variants || [] })
      : null;

    return { data: { data: mapped, status: error ? "Error" : "Success" }, error };
  },

  async registerPurchase(params) {
    const purchaseData = params || {};
    if (!purchaseData.variant_id || !purchaseData.qty) {
      return { data: { status: "Success" }, error: null };
    }

    const qty = toNumber(purchaseData.qty);
    const unitCost = toNumber(purchaseData.unit_cost || 0);
    const variantId = Number(purchaseData.variant_id);

    const { data: variant } = await supabase
      .from("product_variants")
      .select("*")
      .eq("variant_id", variantId)
      .single();

    if (!variant) {
      return { data: { status: "Success" }, error: null };
    }

    await supabase.from("inventory_lots").insert([
      {
        variant_id: variantId,
        received_at: purchaseData.received_at || new Date().toISOString().split("T")[0],
        unit_cost: unitCost,
        initial_qty: qty,
        current_qty: qty,
      },
    ]);

    await supabase.from("inventory_movements").insert([
      {
        variant_id: variantId,
        movement_type: "PURCHASE_IN",
        qty,
        unit_cost_snapshot: unitCost,
        notes: purchaseData.notes || "Compra registrada",
      },
    ]);

    await supabase
      .from("product_variants")
      .update({ variant_stock: toNumber(variant.variant_stock) + qty })
      .eq("variant_id", variantId);

    if (variant.prod_id) {
      const { data: product } = await supabase
        .from("products")
        .select("prod_stock")
        .eq("prod_id", variant.prod_id)
        .single();
      const currentStock = toNumber(product?.prod_stock);
      await supabase
        .from("products")
        .update({ prod_stock: currentStock + qty })
        .eq("prod_id", variant.prod_id);
    }

    return { data: { status: "Success" }, error: null };
  },

  async checkout(params) {
    const data = params || {};
    const payload = {
      std_id: DEFAULT_STUDIO_ID,
      buyer_user_id: data.buyer_user_id,
      buyer_name: data.buyer_name,
      cost_center_id: data.cost_center_id ? Number(data.cost_center_id) : null,
      order_status: "PENDING_APPROVAL",
      subtotal: data.subtotal || 0,
      tax_total: data.tax_total || 0,
      total_amount: data.total_amount || 0,
      payment_method: data.payment_method || "CASH",
      payment_details: data.payment_details || data.config || null,
    };

    const { data: order, error } = await supabase
      .from("store_orders")
      .insert([payload])
      .select("*")
      .single();

    const items = data.items || [];
    if (order && items.length) {
      await supabase.from("store_order_items").insert(
        items.map((item) => ({
          order_id: order.order_id,
          prod_id: item.product_id ? Number(item.product_id) : null,
          variant_id: item.variant_id ? Number(item.variant_id) : null,
          product_name: item.product_name,
          variant_name: item.variant_name,
          qty: item.qty,
          unit_price: item.unit_price,
          total: item.total,
          tax_rate: item.tax_rate || 0,
          tax_amount: item.tax_amount || 0,
          cogs_unit: item.cogs_unit || 0,
          image_url: item.image_url || null,
        }))
      );

      for (const item of items) {
        if (item.variant_id) {
          const { data: variant } = await supabase
            .from("product_variants")
            .select("variant_stock, prod_id")
            .eq("variant_id", item.variant_id)
            .single();
          if (variant) {
            const newStock = Math.max(0, toNumber(variant.variant_stock) - toNumber(item.qty));
            await supabase
              .from("product_variants")
              .update({ variant_stock: newStock })
              .eq("variant_id", item.variant_id);

            if (variant.prod_id) {
              const { data: product } = await supabase
                .from("products")
                .select("prod_stock")
                .eq("prod_id", variant.prod_id)
                .single();
              const prodStock = Math.max(0, toNumber(product?.prod_stock) - toNumber(item.qty));
              await supabase
                .from("products")
                .update({ prod_stock: prodStock })
                .eq("prod_id", variant.prod_id);
            }
          }
        }
      }
    }

    if (data.payment_method === "LOAN" || data.payment_method === "INSTALLMENTS") {
      const config = data.config || {};
      await supabase.from("loan_requests").insert([
        {
          user_id: data.buyer_user_id,
          amount: data.total_amount || 0,
          periods: config.periods || 1,
          reason: "Compra en tienda",
          status: "PENDING_APPROVAL",
        },
      ]);
    }

    const mapped = order
      ? {
          id: String(order.order_id),
          studio_id: String(order.std_id || DEFAULT_STUDIO_ID),
          buyer_user_id: order.buyer_user_id,
          buyer_name: order.buyer_name,
          cost_center_id: order.cost_center_id ? String(order.cost_center_id) : undefined,
          status: order.order_status,
          items,
          subtotal: toNumber(order.subtotal),
          tax_total: toNumber(order.tax_total),
          total_amount: toNumber(order.total_amount),
          payment_method: order.payment_method,
          created_at: order.created_at,
          payment_details: order.payment_details || undefined,
        }
      : null;

    return { data: { data: mapped, status: error ? "Error" : "Success" }, error };
  },

  async requestLoan(params) {
    const data = params || {};
    const { error } = await supabase.from("loan_requests").insert([
      {
        user_id: data.user_id,
        amount: data.amount,
        periods: data.periods,
        reason: data.reason,
        status: "PENDING_APPROVAL",
      },
    ]);

    return { data: { status: error ? "Error" : "Success" }, error };
  },

  async createRequisition(params) {
    const data = params || {};
    const { error } = await supabase.from("requisitions").insert([
      {
        user_id: data.user_id,
        user_name: data.user_name,
        product_name: data.product_name,
        qty: data.qty,
        urgency: data.urgency || "MEDIUM",
        status: "OPEN",
      },
    ]);

    return { data: { status: error ? "Error" : "Success" }, error };
  },

  async approveLoan(params) {
    const id = params?.id || params;
    const { error } = await supabase
      .from("loan_requests")
      .update({ status: "APPROVED" })
      .eq("loan_request_id", id);
    return { data: { status: error ? "Error" : "Success" }, error };
  },

  async rejectLoan(params) {
    const id = params?.id || params;
    const { error } = await supabase
      .from("loan_requests")
      .update({ status: "REJECTED" })
      .eq("loan_request_id", id);
    return { data: { status: error ? "Error" : "Success" }, error };
  },

  async approveOrder(params) {
    const id = params?.id || params;
    const { error } = await supabase
      .from("store_orders")
      .update({ order_status: "APPROVED" })
      .eq("order_id", id);
    return { data: { status: error ? "Error" : "Success" }, error };
  },

  async rejectOrder(params) {
    const id = params?.id || params;
    const { error } = await supabase
      .from("store_orders")
      .update({ order_status: "CANCELLED" })
      .eq("order_id", id);
    return { data: { status: error ? "Error" : "Success" }, error };
  },

  async getAnalyticsSummary(params) {
    const start = params?.start || params?.from || "";
    const end = params?.end || params?.to || "";
    const { data: orders, error } = await supabase
      .from("store_orders")
      .select("order_id, subtotal, tax_total, total_amount, order_status, created_at")
      .gte("created_at", `${start}T00:00:00`)
      .lte("created_at", `${end}T23:59:59`);

    const validOrders = (orders || []).filter((o) => ["DELIVERED", "APPROVED"].includes(o.order_status));

    const orderIds = validOrders.map((o) => o.order_id);
    const { data: items } = orderIds.length
      ? await supabase.from("store_order_items").select("*").in("order_id", orderIds)
      : { data: [] };

    let net_sales = 0;
    let tax_collected = 0;
    let gross_sales = 0;
    let cogs = 0;
    let units_sold = 0;

    validOrders.forEach((o) => {
      net_sales += toNumber(o.subtotal);
      tax_collected += toNumber(o.tax_total);
      gross_sales += toNumber(o.total_amount);
    });

    (items || []).forEach((item) => {
      units_sold += toNumber(item.qty);
      cogs += toNumber(item.cogs_unit) * toNumber(item.qty);
    });

    const gross_profit = net_sales - cogs;
    const margin_percent = net_sales > 0 ? (gross_profit / net_sales) * 100 : 0;
    const orders_count = validOrders.length;
    const aov = orders_count > 0 ? gross_sales / orders_count : 0;

    const summary = {
      net_sales,
      tax_collected,
      gross_sales,
      cogs,
      gross_profit,
      margin_percent,
      orders_count,
      units_sold,
      aov,
      bad_debt: 0,
      adjusted_profit: gross_profit,
      inventory_turnover: units_sold > 0 ? units_sold / 50 : 0,
      avg_days_to_sell: 22,
      mom_comparison: { sales: 0, profit: 0, units: 0, margin: 0 },
    };

    return { data: { data: summary }, error };
  },

  async getSalesSeries(params) {
    const start = params?.start || params?.from || "";
    const end = params?.end || params?.to || "";
    const { data: orders, error } = await supabase
      .from("store_orders")
      .select("order_id, subtotal, total_amount, order_status, created_at")
      .gte("created_at", `${start}T00:00:00`)
      .lte("created_at", `${end}T23:59:59`);

    const validOrders = (orders || []).filter((o) => ["DELIVERED", "APPROVED"].includes(o.order_status));

    const orderIds = validOrders.map((o) => o.order_id);
    const { data: items } = orderIds.length
      ? await supabase.from("store_order_items").select("*").in("order_id", orderIds)
      : { data: [] };

    const grouped = {};
    const s = new Date(start);
    const e = new Date(end);
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split("T")[0];
      grouped[key] = { date: key, net_sales: 0, gross_profit: 0, units: 0, orders: 0 };
    }

    validOrders.forEach((o) => {
      const key = o.created_at.split("T")[0];
      if (grouped[key]) {
        grouped[key].net_sales += toNumber(o.subtotal);
        grouped[key].orders += 1;
      }
    });

    (items || []).forEach((item) => {
      const order = validOrders.find((o) => o.order_id === item.order_id);
      if (!order) return;
      const key = order.created_at.split("T")[0];
      if (!grouped[key]) return;
      const itemCogs = toNumber(item.cogs_unit) * toNumber(item.qty);
      grouped[key].gross_profit += toNumber(item.unit_price) * toNumber(item.qty) - itemCogs;
      grouped[key].units += toNumber(item.qty);
    });

    const series = Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
    return { data: { data: series }, error };
  },

  async getTopSellingProducts(params) {
    const start = params?.start || params?.from || "";
    const end = params?.end || params?.to || "";
    const limit = Number(params?.limit || 5);
    const [products, categories] = await Promise.all([this.getProducts(), this.getCategories()]);
    const productList = products?.data?.data || [];
    const categoryList = categories?.data?.data || [];

    const { data: orders, error } = await supabase
      .from("store_orders")
      .select("order_id, order_status, created_at")
      .gte("created_at", `${start}T00:00:00`)
      .lte("created_at", `${end}T23:59:59`);

    const validOrders = (orders || []).filter((o) => ["DELIVERED", "APPROVED"].includes(o.order_status));
    const orderIds = validOrders.map((o) => o.order_id);

    const { data: items } = orderIds.length
      ? await supabase.from("store_order_items").select("*").in("order_id", orderIds)
      : { data: [] };

    const productMap = {};

    (items || []).forEach((item) => {
      const product = productList.find((p) => p.id === String(item.prod_id)) || productList.find((p) => p.id === String(item.product_id));
      const categoryName = categoryList.find((c) => c.id === product?.category_id)?.name || "General";

      const key = String(item.prod_id || item.product_id || product?.id);
      if (!productMap[key]) {
        productMap[key] = {
          id: key,
          name: product?.name || item.product_name || "Producto",
          sku: product?.variants?.[0]?.sku || "UNK",
          category: categoryName,
          units_sold: 0,
          net_sales: 0,
          cogs: 0,
          gross_profit: 0,
          margin_percent: 0,
          turnover_rate: 0,
          avg_days_to_sell: 0,
          stock_current: product?.total_stock || 0,
          reorder_suggested: false,
          is_dead_stock: false,
        };
      }

      const entry = productMap[key];
      entry.units_sold += toNumber(item.qty);
      entry.net_sales += toNumber(item.unit_price) * toNumber(item.qty);
      const itemCogs = toNumber(item.cogs_unit) * toNumber(item.qty);
      entry.cogs += itemCogs;
      entry.gross_profit += toNumber(item.unit_price) * toNumber(item.qty) - itemCogs;
    });

    const result = Object.values(productMap)
      .map((p) => ({
        ...p,
        margin_percent: p.net_sales > 0 ? (p.gross_profit / p.net_sales) * 100 : 0,
      }))
      .sort((a, b) => b.units_sold - a.units_sold)
      .slice(0, limit);

    return { data: { data: result }, error };
  },

  async getTopProfitableProducts(params) {
    const start = params?.start || params?.from || "";
    const end = params?.end || params?.to || "";
    const limit = Number(params?.limit || 5);
    const all = await this.getTopSellingProducts({ start, end, limit: 1000 });
    const data = (all?.data?.data || []).sort((a, b) => b.gross_profit - a.gross_profit).slice(0, limit);
    return { data: { data }, error: all?.error || null };
  },

  async getCategorySplit(params) {
    const start = params?.start || params?.from || "";
    const end = params?.end || params?.to || "";
    const [categories, products] = await Promise.all([this.getCategories(), this.getProducts()]);
    const categoryList = categories?.data?.data || [];
    const productList = products?.data?.data || [];

    const { data: orders, error } = await supabase
      .from("store_orders")
      .select("order_id, order_status, created_at")
      .gte("created_at", `${start}T00:00:00`)
      .lte("created_at", `${end}T23:59:59`);

    const validOrders = (orders || []).filter((o) => ["DELIVERED", "APPROVED"].includes(o.order_status));
    const orderIds = validOrders.map((o) => o.order_id);
    const { data: items } = orderIds.length
      ? await supabase.from("store_order_items").select("*").in("order_id", orderIds)
      : { data: [] };

    const catMap = {};
    let totalSales = 0;

    (items || []).forEach((item) => {
      const product = productList.find((p) => p.id === String(item.prod_id));
      const categoryName = categoryList.find((c) => c.id === product?.category_id)?.name || "Otros";
      const amount = toNumber(item.unit_price) * toNumber(item.qty);
      catMap[categoryName] = (catMap[categoryName] || 0) + amount;
      totalSales += amount;
    });

    const result = Object.entries(catMap)
      .map(([name, net_sales]) => ({
        id: name,
        name,
        net_sales,
        percentage: totalSales > 0 ? (net_sales / totalSales) * 100 : 0,
      }))
      .sort((a, b) => b.net_sales - a.net_sales);

    return { data: { data: result }, error };
  },

  async getInventoryAging() {
    const { data: lots, error } = await supabase.from("inventory_lots").select("*");
    const now = Date.now();

    const ranges = { range_0_30: 0, range_31_60: 0, range_61_90: 0, range_90_plus: 0 };
    (lots || []).forEach((lot) => {
      const received = new Date(lot.received_at).getTime();
      const days = Math.floor((now - received) / 86400000);
      const value = toNumber(lot.current_qty) * toNumber(lot.unit_cost);
      if (days <= 30) ranges.range_0_30 += value;
      else if (days <= 60) ranges.range_31_60 += value;
      else if (days <= 90) ranges.range_61_90 += value;
      else ranges.range_90_plus += value;
    });

    const total_valuation =
      ranges.range_0_30 + ranges.range_31_60 + ranges.range_61_90 + ranges.range_90_plus;

    return { data: { data: { ...ranges, total_valuation } }, error };
  },

  async getProductAnalytics(params) {
    const productId = params?.id || params?.productId || params;
    const { data: items, error } = await supabase
      .from("store_order_items")
      .select("*")
      .eq("prod_id", productId);

    const total_sold_units = (items || []).reduce((acc, item) => acc + toNumber(item.qty), 0);
    const total_revenue = (items || []).reduce(
      (acc, item) => acc + toNumber(item.unit_price) * toNumber(item.qty),
      0
    );

    const analytics = {
      id: productId,
      name: items?.[0]?.product_name || "Producto",
      total_sold_units,
      total_revenue,
      avg_margin: 0,
      turnover_days: 0,
      sales_trend: [],
      variant_breakdown: [],
      fifo_lots: [],
    };

    return { data: { data: analytics }, error };
  },
};
