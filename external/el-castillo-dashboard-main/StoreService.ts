
import { api } from './api';
import { 
  StoreProduct, StoreCategory, InventoryLot, StockMovement, 
  InstallmentPlan, LoanRequest, StoreOrder, FinancialRule, 
  Requisition, CostCenter, AnalyticsSummary, SalesSeriesData, 
  ProductPerformance, InventoryAging, PurchaseOrder, ProductVariant,
  CategoryPerformance
} from './types';

// --- MOCK DATABASE GENERATOR (The "Truth" Source) ---

const createImages = (urls: string[]) => urls.map((url, i) => ({
    id: `img-${i}`, url_thumb: `${url}&w=300`, url_medium: `${url}&w=800`, url_original: url, is_main: i===0
}));

let categories: StoreCategory[] = [
  { id: 'c1', name: 'Iluminación', slug: 'iluminacion' },
  { id: 'c2', name: 'Audio', slug: 'audio' },
  { id: 'c3', name: 'Hardware', slug: 'hardware' },
  { id: 'c4', name: 'Lencería', slug: 'lenceria' },
  { id: 'c5', name: 'Consumibles', slug: 'consumibles' }
];

let products: StoreProduct[] = [
  { 
    id: 'p1', studio_id: '1', name: 'Set Lencería Luxury', category_id: 'c4', brand: 'VS', unit: 'UND',
    description_short: 'Conjunto de encaje premium.', description_long: '',
    images: createImages(['https://images.unsplash.com/photo-1596483758364-7c390cb47560?ixlib=rb-1.2.1']), 
    price_base: 120000, min_stock: 5, total_stock: 15, is_active: true, is_new: true, status: 'IN_STOCK',
    tax_rate: 19,
    variants: [
        { id: 'v1a', product_id: 'p1', sku: 'LEN-RED-S', name: 'Rojo / S', attributes: { color: 'Rojo', size: 'S' }, current_stock: 5, status: 'IN_STOCK', price_override: 120000 },
        { id: 'v1b', product_id: 'p1', sku: 'LEN-BLK-M', name: 'Negro / M', attributes: { color: 'Negro', size: 'M' }, current_stock: 10, status: 'IN_STOCK', price_override: 120000 }
    ]
  },
  { 
    id: 'p2', studio_id: '1', name: 'Aro de Luz RGB', category_id: 'c1', brand: 'Neewer', unit: 'UND',
    description_short: 'Iluminación profesional para streaming.', description_long: '',
    images: createImages(['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?ixlib=rb-1.2.1']), 
    price_base: 250000, min_stock: 3, total_stock: 8, is_active: true, status: 'IN_STOCK', tax_rate: 19,
    variants: [{ id: 'v2a', product_id: 'p2', sku: 'RING-18', name: '18 Pulgadas', attributes: { size: '18"' }, current_stock: 8, status: 'IN_STOCK', price_override: 250000 }]
  },
  { 
    id: 'p3', studio_id: '1', name: 'Logitech Brio 4K', category_id: 'c3', brand: 'Logitech', unit: 'UND',
    description_short: 'Webcam Ultra HD HDR.', description_long: '',
    images: createImages(['https://images.unsplash.com/photo-1590845947698-8924d7409b56?ixlib=rb-1.2.1']), 
    price_base: 850000, min_stock: 2, total_stock: 2, is_active: true, status: 'LOW_STOCK', tax_rate: 19,
    variants: [{ id: 'v3a', product_id: 'p3', sku: 'BRIO-4K', name: 'Standard', attributes: {}, current_stock: 2, status: 'LOW_STOCK', price_override: 850000 }]
  },
  { 
    id: 'p4', studio_id: '1', name: 'Lubricante Íntimo', category_id: 'c5', brand: 'Durex', unit: 'UND',
    description_short: 'A base de agua, 100ml.', description_long: '',
    images: createImages(['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?ixlib=rb-1.2.1']), 
    price_base: 35000, min_stock: 10, total_stock: 50, is_active: true, status: 'IN_STOCK', tax_rate: 0,
    variants: [{ id: 'v4a', product_id: 'p4', sku: 'LUB-100', name: '100ml', attributes: { size: '100ml' }, current_stock: 50, status: 'IN_STOCK', price_override: 35000 }]
  }
];

const generateMockData = () => {
    const ordersList: StoreOrder[] = [];
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 90);

    for (let i = 0; i < 150; i++) {
        const date = new Date(startDate.getTime() + Math.random() * (now.getTime() - startDate.getTime()));
        const isCompleted = Math.random() > 0.1;
        
        const numItems = Math.floor(Math.random() * 3) + 1;
        const items: any[] = [];
        let subtotal = 0;
        let tax_total = 0;

        for (let j = 0; j < numItems; j++) {
            const prod = products[Math.floor(Math.random() * products.length)];
            const variant = prod.variants[0];
            const qty = Math.floor(Math.random() * 2) + 1;
            const price = variant.price_override || prod.price_base;
            const tax = (price * (prod.tax_rate || 0)) / 100;
            
            items.push({
                product_id: prod.id,
                variant_id: variant.id,
                product_name: prod.name,
                variant_name: variant.name,
                qty,
                unit_price: price,
                total: price * qty,
                image_url: prod.images[0].url_thumb,
                tax_rate: prod.tax_rate || 0,
                tax_amount: tax * qty,
                cogs_unit: price * 0.6
            });
            
            subtotal += price * qty;
            tax_total += tax * qty;
        }

        ordersList.push({
            id: `ORD-${1000 + i}`,
            studio_id: '1',
            buyer_user_id: 3990,
            buyer_name: 'Jennifer Zuluaga',
            status: isCompleted ? 'DELIVERED' : 'CANCELLED',
            items: items,
            subtotal: subtotal,
            tax_total: tax_total,
            total_amount: subtotal + tax_total,
            payment_method: 'CASH',
            created_at: date.toISOString(),
        });
    }
    return ordersList.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

let orders: StoreOrder[] = generateMockData();
let lots: InventoryLot[] = [
    { id: 'L-101', product_variant_id: 'v1a', received_at: '2025-05-01', unit_cost: 60000, initial_qty: 10, current_qty: 5 },
    { id: 'L-102', product_variant_id: 'v2a', received_at: '2025-05-10', unit_cost: 150000, initial_qty: 10, current_qty: 8 }
];
let movements: StockMovement[] = [];
let loans: InstallmentPlan[] = [];
let requests: LoanRequest[] = [];

const isWithinRange = (dateStr: string, start: string, end: string) => {
    const d = new Date(dateStr).getTime();
    const s = new Date(start);
    s.setHours(0,0,0,0);
    const e = new Date(end);
    e.setHours(23,59,59,999);
    
    return d >= s.getTime() && d <= e.getTime();
};

// --- SERVICE OBJECT ---
const StoreService = {
  getProducts: async () => Promise.resolve([...products]),
  getCategories: async () => Promise.resolve([...categories]),
  getCostCenters: async () => Promise.resolve([{ id: 'cc1', code: 'OP', name: 'Operativo' }, { id: 'cc2', code: 'RH', name: 'Recursos Humanos' }]),
  getInventory: async () => Promise.resolve({ lots, movements }),
  getLoans: async () => Promise.resolve(loans),
  getLoanRequests: async () => Promise.resolve(requests),
  getOrders: async () => Promise.resolve(orders),
  getRequisitions: async () => Promise.resolve([]),
  getFinancialRules: async (roleId: number) => Promise.resolve([]),

  createProduct: async (p: Partial<StoreProduct>) => {
      const newP = { ...p, id: `p-${Date.now()}`, total_stock: 0, variants: p.variants || [] } as StoreProduct;
      products.push(newP);
      return Promise.resolve(newP);
  },
  updateProduct: async (id: string, p: Partial<StoreProduct>) => {
      const idx = products.findIndex(x => x.id === id);
      if (idx > -1) products[idx] = { ...products[idx], ...p };
      return Promise.resolve(products[idx]);
  },
  registerPurchase: async (data: any) => Promise.resolve(true),
  checkout: async (data: Partial<StoreOrder>, config?: any) => {
      const newOrder: StoreOrder = {
          id: `ORD-${Date.now()}`,
          studio_id: '1',
          buyer_user_id: data.buyer_user_id!,
          buyer_name: data.buyer_name!,
          cost_center_id: data.cost_center_id,
          status: 'PENDING_APPROVAL',
          items: data.items || [],
          subtotal: data.subtotal || 0,
          tax_total: 0,
          total_amount: data.total_amount || 0,
          payment_method: data.payment_method || 'CASH',
          created_at: new Date().toISOString(),
          payment_details: config
      };
      orders.unshift(newOrder);
      return Promise.resolve(newOrder);
  },
  requestLoan: async (data: any) => Promise.resolve(true),
  createRequisition: async (data: any) => Promise.resolve(true),
  approveLoan: async (id: string) => Promise.resolve(true),
  rejectLoan: async (id: string) => Promise.resolve(true),
  approveOrder: async (id: string) => Promise.resolve(true),
  rejectOrder: async (id: string) => Promise.resolve(true),

  getAnalyticsSummary: async (start: string, end: string): Promise<AnalyticsSummary> => {
      const filteredOrders = orders.filter(o => 
          isWithinRange(o.created_at, start, end) && 
          ['DELIVERED', 'APPROVED'].includes(o.status)
      );

      let net_sales = 0;
      let tax_collected = 0;
      let gross_sales = 0;
      let cogs = 0;
      let units_sold = 0;

      filteredOrders.forEach(o => {
          net_sales += o.subtotal;
          tax_collected += o.tax_total;
          gross_sales += o.total_amount;
          
          o.items.forEach((item: any) => {
              cogs += (item.cogs_unit || 0) * item.qty;
              units_sold += item.qty;
          });
      });

      const gross_profit = net_sales - cogs;
      const margin_percent = net_sales > 0 ? (gross_profit / net_sales) * 100 : 0;
      const aov = filteredOrders.length > 0 ? gross_sales / filteredOrders.length : 0;

      return Promise.resolve({
          net_sales,
          tax_collected,
          gross_sales,
          cogs,
          gross_profit,
          margin_percent,
          orders_count: filteredOrders.length,
          units_sold,
          aov,
          bad_debt: 0,
          adjusted_profit: gross_profit,
          inventory_turnover: units_sold > 0 ? (units_sold / 50) : 0,
          avg_days_to_sell: 22,
          mom_comparison: { sales: 0, profit: 0, units: 0, margin: 0 }
      });
  },

  getSalesSeries: async (start: string, end: string): Promise<SalesSeriesData[]> => {
      const filteredOrders = orders.filter(o => 
          isWithinRange(o.created_at, start, end) && 
          ['DELIVERED', 'APPROVED'].includes(o.status)
      );

      const grouped: Record<string, SalesSeriesData> = {};
      
      const s = new Date(start);
      const e = new Date(end);
      for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
          const key = d.toISOString().split('T')[0];
          grouped[key] = { date: key, net_sales: 0, gross_profit: 0, units: 0, orders: 0 };
      }

      filteredOrders.forEach(o => {
          const key = o.created_at.split('T')[0];
          if (grouped[key]) {
              grouped[key].net_sales += o.subtotal;
              let orderCogs = 0;
              o.items.forEach((i: any) => orderCogs += (i.cogs_unit || 0) * i.qty);
              grouped[key].gross_profit += (o.subtotal - orderCogs);
              grouped[key].orders += 1;
              grouped[key].units += o.items.reduce((acc, i) => acc + i.qty, 0);
          }
      });

      return Promise.resolve(Object.values(grouped).sort((a,b) => a.date.localeCompare(b.date)));
  },

  getTopSellingProducts: async (start: string, end: string, limit: number): Promise<ProductPerformance[]> => {
      const filteredOrders = orders.filter(o => 
          isWithinRange(o.created_at, start, end) && 
          ['DELIVERED', 'APPROVED'].includes(o.status)
      );

      const productMap: Record<string, ProductPerformance> = {};

      filteredOrders.forEach(o => {
          o.items.forEach((item: any) => {
              if (!productMap[item.product_id]) {
                  const p = products.find(prod => prod.id === item.product_id);
                  productMap[item.product_id] = {
                      id: item.product_id,
                      name: p?.name || item.product_name,
                      sku: p?.variants[0]?.sku || 'UNK',
                      category: categories.find(c => c.id === p?.category_id)?.name || 'General',
                      units_sold: 0,
                      net_sales: 0,
                      cogs: 0,
                      gross_profit: 0,
                      margin_percent: 0,
                      turnover_rate: 0, avg_days_to_sell: 0, stock_current: p?.total_stock || 0, reorder_suggested: false, is_dead_stock: false
                  };
              }
              
              const entry = productMap[item.product_id];
              entry.units_sold += item.qty;
              entry.net_sales += item.unit_price * item.qty;
              const itemCogs = (item.cogs_unit || 0) * item.qty;
              entry.cogs += itemCogs;
              entry.gross_profit += (item.unit_price * item.qty) - itemCogs;
          });
      });

      const result = Object.values(productMap).map(p => ({
          ...p,
          margin_percent: p.net_sales > 0 ? (p.gross_profit / p.net_sales) * 100 : 0
      })).sort((a, b) => b.units_sold - a.units_sold).slice(0, limit);

      return Promise.resolve(result);
  },

  getTopProfitableProducts: async (start: string, end: string, limit: number): Promise<ProductPerformance[]> => {
      const all = await StoreService.getTopSellingProducts(start, end, 1000);
      return all.sort((a,b) => b.gross_profit - a.gross_profit).slice(0, limit);
  },

  getCategorySplit: async (start: string, end: string): Promise<CategoryPerformance[]> => {
      const filteredOrders = orders.filter(o => 
          isWithinRange(o.created_at, start, end) && 
          ['DELIVERED', 'APPROVED'].includes(o.status)
      );

      const catMap: Record<string, number> = {};
      let totalSales = 0;

      filteredOrders.forEach(o => {
          o.items.forEach((item: any) => {
              const p = products.find(prod => prod.id === item.product_id);
              const catName = categories.find(c => c.id === p?.category_id)?.name || 'Otros';
              
              catMap[catName] = (catMap[catName] || 0) + (item.unit_price * item.qty);
              totalSales += (item.unit_price * item.qty);
          });
      });

      return Promise.resolve(Object.entries(catMap).map(([name, net_sales]) => ({
          id: name,
          name,
          net_sales,
          percentage: totalSales > 0 ? (net_sales / totalSales) * 100 : 0
      })).sort((a,b) => b.net_sales - a.net_sales));
  },

  getInventoryAging: async (): Promise<InventoryAging> => {
      return Promise.resolve({
          range_0_30: 5000000,
          range_31_60: 2000000,
          range_61_90: 1000000,
          range_90_plus: 500000,
          total_valuation: 8500000
      });
  },

  getProductAnalytics: async (productId: string) => {
      const product = products.find(p => p.id === productId);
      return Promise.resolve({
          id: productId,
          name: product?.name || 'Unknown',
          total_sold_units: 150,
          total_revenue: 15000000,
          avg_margin: 45,
          turnover_days: 12,
          sales_trend: [],
          variant_breakdown: product?.variants.map(v => ({ name: v.name, sku: v.sku, sold: 50, revenue: 5000000, margin: 45 })) || [],
          fifo_lots: []
      });
  }
};

export default StoreService;