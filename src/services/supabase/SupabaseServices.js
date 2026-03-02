/**
 * Supabase CRUD - Generado automáticamente para El Castillo
 * Cubre todas las entidades del sistema
 */
import { supabase } from "../../boot/supabase";

// ── Helper genérico ──────────────────────────────────────────
const crudFor = (table, select = "*") => ({
  async getAll(query = {}) {
    let req = supabase.from(table).select(select);
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null) req = req.eq(k, v);
    });
    return req;
  },
  async getById(id, idColumn = table.replace(/s$/, "") + "_id") {
    return supabase.from(table).select(select).eq(idColumn, id).single();
  },
  async create(data) {
    return supabase.from(table).insert([data]).select().single();
  },
  async update(id, data, idColumn = table.replace(/s$/, "") + "_id") {
    return supabase.from(table).update(data).eq(idColumn, id).select().single();
  },
  async remove(id, idColumn = table.replace(/s$/, "") + "_id") {
    return supabase.from(table).delete().eq(idColumn, id);
  },
});

// ── STUDIOS ──────────────────────────────────────────────────
export const StudioService = {
  ...crudFor(
    "studios",
    "*, locations(*), users!owner_user_id(user_name, user_surname)"
  ),
  async getAll(query = {}) {
    let req = supabase
      .from("studios")
      .select("*, locations(*), users!owner_user_id(user_name, user_surname)");
    if (query.std_id) req = req.eq("std_id", query.std_id);
    if (query.std_active !== undefined)
      req = req.eq("std_active", query.std_active);
    return req;
  },
  async uploadImage(std_id, file) {
    const path = `studios/${std_id}/${file.name}`;
    const { data, error } = await supabase.storage
      .from("el-castillo")
      .upload(path, file, { upsert: true });
    if (error) return { data: null, error };
    const { data: urlData } = supabase.storage
      .from("el-castillo")
      .getPublicUrl(path);
    return supabase
      .from("studios")
      .update({ std_photo_url: urlData.publicUrl })
      .eq("std_id", std_id);
  },
  async getSedes(parent_std_id) {
    return supabase
      .from("studios")
      .select("*")
      .eq("parent_std_id", parent_std_id);
  },
};

// ── TERCEROS ─────────────────────────────────────────────────
export const TerceroService = crudFor("terceros");

// ── STUDIO ROOMS ─────────────────────────────────────────────
export const StudioRoomService = {
  ...crudFor("studio_rooms"),
  async getByStudio(std_id) {
    return supabase.from("studio_rooms").select("*").eq("std_id", std_id);
  },
};

// ── STUDIO SHIFTS ────────────────────────────────────────────
export const StudioShiftService = {
  ...crudFor("studio_shifts"),
  async getByStudio(std_id) {
    return supabase.from("studio_shifts").select("*").eq("std_id", std_id);
  },
};

// ── STUDIO ACCOUNTS ──────────────────────────────────────────
export const StudioAccountService = {
  ...crudFor("studio_accounts"),
  async getByStudio(std_id) {
    return supabase.from("studio_accounts").select("*").eq("std_id", std_id);
  },
};

// ── STUDIO MODELS ────────────────────────────────────────────
export const StudioModelService = {
  ...crudFor(
    "studio_models",
    "*, users(user_name, user_surname, user_identification, user_email), studios(std_name), studio_rooms(room_name), studio_shifts(shift_name)"
  ),
  async getByStudio(std_id) {
    return supabase
      .from("studio_models")
      .select(
        "*, users(user_name, user_surname, user_identification), studios(std_name)"
      )
      .eq("std_id", std_id)
      .eq("stdmod_active", true);
  },
  async getByUser(user_id) {
    return supabase
      .from("studio_models")
      .select("*, studios(std_name), studio_rooms(room_name)")
      .eq("user_id", user_id);
  },
};

// ── USERS ────────────────────────────────────────────────────
export const UserService = {
  ...crudFor("users", "*, profiles(prof_name, prof_description)"),
  async getAll(query = {}) {
    let req = supabase.from("users").select("*, profiles(prof_name)");
    if (query.prof_id) req = req.eq("prof_id", query.prof_id);
    if (query.user_active !== undefined)
      req = req.eq("user_active", query.user_active);
    if (query.search) req = req.ilike("user_name", `%${query.search}%`);
    return req;
  },
  async getByProfile(prof_name) {
    return supabase
      .from("users")
      .select("*, profiles(prof_name)")
      .eq("profiles.prof_name", prof_name)
      .eq("user_active", true);
  },
  async uploadImage(user_id, file) {
    const path = `users/${user_id}/${file.name}`;
    const { data, error } = await supabase.storage
      .from("el-castillo")
      .upload(path, file, { upsert: true });
    if (error) return { data: null, error };
    const { data: urlData } = supabase.storage
      .from("el-castillo")
      .getPublicUrl(path);
    return supabase
      .from("users")
      .update({ user_photo_url: urlData.publicUrl })
      .eq("user_id", user_id);
  },
};

// ── PAYMENTS ─────────────────────────────────────────────────
export const PaymentService = {
  ...crudFor(
    "payments",
    "*, users(user_name, user_surname), studios(std_name), periods(per_name)"
  ),
  async getAll(query = {}) {
    let req = supabase
      .from("payments")
      .select(
        "*, users(user_name, user_surname), studios(std_name), periods(per_name)"
      );
    if (query.per_id) req = req.eq("per_id", query.per_id);
    if (query.std_id) req = req.eq("std_id", query.std_id);
    if (query.user_id) req = req.eq("user_id", query.user_id);
    return req;
  },
};

// ── PAYMENT FILES ────────────────────────────────────────────
export const PaymentFileService = {
  ...crudFor("payment_files"),
  async getByPayment(pay_id) {
    return supabase.from("payment_files").select("*").eq("pay_id", pay_id);
  },
};

// ── PAYSHEETS ────────────────────────────────────────────────
export const PaysheetService = {
  ...crudFor("paysheets", "*, studios(std_name), periods(per_name)"),
  async getAll(query = {}) {
    let req = supabase
      .from("paysheets")
      .select("*, studios(std_name), periods(per_name)");
    if (query.per_id) req = req.eq("per_id", query.per_id);
    if (query.std_id) req = req.eq("std_id", query.std_id);
    return req;
  },
};

// ── PERIODS ──────────────────────────────────────────────────
export const PeriodService = {
  ...crudFor("periods"),
  async getActive() {
    return supabase
      .from("periods")
      .select("*")
      .eq("per_active", true)
      .order("per_start_date", { ascending: false });
  },
};

// ── CATEGORIES ───────────────────────────────────────────────
export const CategoryService = crudFor("categories");

// ── BANK ACCOUNTS ────────────────────────────────────────────
export const BankAccountService = {
  ...crudFor("bank_accounts"),
  async getByUser(user_id) {
    return supabase.from("bank_accounts").select("*").eq("user_id", user_id);
  },
};

// ── COMMISSIONS ──────────────────────────────────────────────
export const CommissionService = {
  ...crudFor(
    "commissions",
    "*, studios(std_name), users(user_name, user_surname), periods(per_name)"
  ),
};

// ── EXCHANGE RATES ───────────────────────────────────────────
export const ExchangeRateService = {
  ...crudFor("exchange_rates"),
  async getLatest() {
    return supabase
      .from("exchange_rates")
      .select("*")
      .order("exrate_date", { ascending: false })
      .limit(1)
      .single();
  },
};

// ── LOCATIONS ────────────────────────────────────────────────
export const LocationService = crudFor("locations");

// ── TRANSACTIONS ─────────────────────────────────────────────
export const TransactionService = {
  ...crudFor(
    "transactions",
    "*, transaction_types(ttype_name), categories(cat_name), users(user_name, user_surname), studios(std_name), periods(per_name)"
  ),
};

// ── TRANSACTION TYPES ────────────────────────────────────────
export const TransactionTypeService = crudFor("transaction_types");

// ── MODEL STREAMS ────────────────────────────────────────────
export const ModelStreamService = {
  ...crudFor(
    "model_streams",
    "*, users(user_name, user_surname), studios(std_name)"
  ),
  async getByModel(user_id) {
    return supabase
      .from("model_streams")
      .select("*, studios(std_name)")
      .eq("user_id", user_id)
      .order("modstr_date", { ascending: false });
  },
  async getAll(query = {}) {
    let req = supabase
      .from("model_streams")
      .select("*, users(user_name, user_surname), studios(std_name)");
    if (query.user_id) req = req.eq("user_id", query.user_id);
    if (query.std_id) req = req.eq("std_id", query.std_id);
    return req;
  },
};

// ── MODEL STREAM FILES ───────────────────────────────────────
export const ModelStreamFileService = {
  ...crudFor("model_stream_files"),
  async getByStream(modstr_id) {
    return supabase
      .from("model_stream_files")
      .select("*")
      .eq("modstr_id", modstr_id);
  },
};

// ── MODEL STREAM CUSTOMERS ───────────────────────────────────
export const ModelStreamCustomerService = {
  ...crudFor("model_stream_customers"),
  async getByStream(modstr_id) {
    return supabase
      .from("model_stream_customers")
      .select("*")
      .eq("modstr_id", modstr_id)
      .order("modstrc_tokens", { ascending: false });
  },
};

// ── MODEL ACCOUNTS ───────────────────────────────────────────
export const ModelAccountService = {
  ...crudFor("model_accounts"),
  async getByUser(user_id) {
    return supabase.from("model_accounts").select("*").eq("user_id", user_id);
  },
};

// ── MODEL GOALS ──────────────────────────────────────────────
export const ModelGoalService = {
  ...crudFor(
    "model_goals",
    "*, users(user_name, user_surname), studios(std_name), periods(per_name)"
  ),
  async getByUser(user_id) {
    return supabase
      .from("model_goals")
      .select("*, periods(per_name), studios(std_name)")
      .eq("user_id", user_id);
  },
};

// ── MODEL TRANSACTIONS ───────────────────────────────────────
export const ModelTransactionService = {
  ...crudFor(
    "model_transactions",
    "*, users(user_name, user_surname), studios(std_name), periods(per_name)"
  ),
};

// ── NOTIFICATIONS ────────────────────────────────────────────
export const NotificationService = {
  ...crudFor("notifications"),
  async getByUser(user_id) {
    return supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });
  },
  async markAsRead(notif_id) {
    return supabase
      .from("notifications")
      .update({ notif_read: true })
      .eq("notif_id", notif_id);
  },
};

// ── PETITIONS ────────────────────────────────────────────────
export const PetitionService = {
  ...crudFor("petitions", "*, users!user_id(user_name, user_surname)"),
  async getPending() {
    return supabase
      .from("petitions")
      .select("*, users!user_id(user_name, user_surname)")
      .eq("pet_status", "PENDING")
      .order("created_at", { ascending: false });
  },
};

// ── LOGS ─────────────────────────────────────────────────────
export const LogService = crudFor("logs", "*, users(user_name, user_surname)");

// ── SETTINGS ─────────────────────────────────────────────────
export const SettingService = {
  ...crudFor("settings"),
  async getByKey(key) {
    return supabase.from("settings").select("*").eq("set_key", key).single();
  },
};

// ── PRODUCTS ─────────────────────────────────────────────────
export const ProductService = crudFor("products");
