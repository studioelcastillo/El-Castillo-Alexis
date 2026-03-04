import { LucideIcon } from 'lucide-react';

// --- SHARED TYPES ---

export interface SidebarItem {
  id: string;
  icon: LucideIcon;
  label: string;
}

export interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

// --- USER & PROFILES ---

export interface User {
  user_id: number;
  user_name: string;
  user_name2?: string;
  user_surname: string;
  user_surname2?: string;
  user_email: string;
  user_personal_email?: string;
  user_identification: string;
  user_identification_type?: string;
  user_issued_in?: string;
  user_telephone?: string;
  user_sex?: string;
  user_birthdate?: string;
  user_address?: string;
  user_rh?: string;
  user_model_category?: string;
  user_bank_entity?: string;
  user_bank_account?: string;
  user_bank_account_type?: string;
  user_beneficiary_name?: string;
  user_beneficiary_document?: string;
  user_beneficiary_document_type?: string;
  user_active: boolean | number;
  user_age?: number;
  /**
   * Added birth_date to User interface to fix BirthdayService.ts error
   */
  birth_date?: string;
  image?: string;
  created_at?: string;
  studios?: string;
  profile?: UserProfileData;
  prof_id?: number;
  city?: {
    city_id: number;
    city_name: string;
    department: {
      dpto_id: number;
      dpto_name: string;
      country: {
        country_id: number;
        country_name: string;
      };
    };
  };
}

export interface UserProfileData {
  prof_id: number;
  prof_name: string;
}

export interface Studio {
  id: string;
  name: string;
  nit: string;
  city: string;
  address: string;
  activeModels: number;
  rooms: number;
  isActive: boolean;
  owner: string;
}

// Tipo para la respuesta del API backend (estructura real de la BD)
export interface StudioApiResponse {
  std_id: number;
  std_name: string;
  std_nit: string;
  std_address: string | null;
  std_active: boolean;
  // ... otros campos según necesidad
}

// --- GEOGRAPHY ---

export interface LocationCity {
  city_id: number;
  city_name: string;
  dpto_id?: number;
}

export interface LocationDepartment {
  dpto_id: number;
  dpto_name: string;
  country_id?: number;
  cities: LocationCity[];
}

export interface LocationCountry {
  country_id: number;
  country_name: string;
  departments: LocationDepartment[];
}

// Legacy interfaces for backward compatibility
export interface LocationState {
  id: string;
  name: string;
  cities: { id: string; name: string }[];
}

// --- BIRTHDAYS ---

export interface BirthdayUser {
  userId: number;
  fullName: string;
  profilePhotoUrl?: string;
  birthDate: string;
  nextBirthday: string;
  daysLeft: number;
  isToday: boolean;
  roleName: string;
}

export type BirthdayChannel = 'IN_APP' | 'EMAIL' | 'WHATSAPP';

export interface BirthdayTemplate {
  isActive: boolean;
  bodyText: string;
  sendTime: string;
  channel: BirthdayChannel;
}

// --- CHAT SYSTEM ---

export type PresenceStatus = 'available' | 'busy' | 'away' | 'offline';

export interface ChatProfile {
  id: string;
  user_id: number;
  display_name: string;
  role_name?: string;
  role_id: number;
  presence_status: PresenceStatus;
  avatar_url?: string;
  avatar_version?: number;
  is_online?: boolean;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: number;
  sender_name: string;
  sender_avatar_url?: string;
  type: string;
  content_text: string;
  status: 'sent' | 'delivered' | 'read';
  created_at: string;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  unread_count: number;
  created_at: string;
  members: ChatProfile[];
  last_message?: ChatMessage;
  avatar_url?: string;
}

export interface RoleChatPolicy {
  from_role_id: number;
  to_role_id: number;
  can_initiate: boolean;
  can_receive: boolean;
}

export interface MessageTemplate {
  id: string;
  name: string;
  category: string;
  body_text: string;
  variables_json: string[];
  attachments_json: any[];
  scope: 'global' | 'role';
  role_id?: number;
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface BroadcastList {
  id: string;
  name: string;
  audience_rules_json: any;
}

export interface BroadcastJob {
  id: string;
  created_by: number;
  mode: 'DM_MASS' | 'GROUP_ANNOUNCEMENT';
  audience_snapshot_json: any;
  message_payload_json: any;
  reason: string;
  status: 'completed' | 'running' | 'failed' | 'cancelled';
  total_targets: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  skipped_count: number;
  created_at: string;
  finished_at?: string;
}

export interface AutomationRule {
  id: string;
  trigger_type: 'event' | 'schedule';
  trigger_event?: string;
  schedule_cron?: string;
  conditions_json: any;
  target_json: any;
  template_id: string;
  is_enabled: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface AutomationJob {
  id: string;
  rule_id: string;
  status: string;
}

export interface ChatSettings {
  sound_incoming: boolean;
  sound_outgoing: boolean;
  sound_mentions: boolean;
  glow_on_new: boolean;
  toast_on_new: boolean;
  show_online_status: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

export interface RoleDefaults {
  settings: Partial<ChatSettings>;
}

// --- ROOM CONTROL ---

export type RoomStatus = 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
export type ShiftType = 'MORNING' | 'AFTERNOON' | 'NIGHT';

export interface Room {
  id: string;
  code: string;
  type: string;
  floor?: string;
  status: RoomStatus;
  notes?: string;
  inventory: InventoryItem[];
  incidents_count: number;
  current_assignment?: RoomAssignment;
}

export interface InventoryItem {
  id: string;
  warehouse_item_id?: string;
  name: string;
  qty: number;
  unit_cost: number;
  condition: 'OK' | 'MISSING' | 'DAMAGED';
}

export interface RoomAssignment {
  id: string;
  room_id: string;
  model_id: number;
  model_name: string;
  model_avatar?: string;
  monitor_id: number;
  monitor_name: string;
  date: string;
  shift: ShiftType;
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED';
  created_at: string;
  isRange?: boolean;
  endDate?: string;
}

export interface RoomTicket {
  id: string;
  assignment_id: string;
  room_id: string;
  type: 'DELIVERY' | 'RETURN';
  status: 'DRAFT' | 'SUBMITTED';
  checklist: InventoryItem[];
  notes?: string;
  rating_model_to_monitor?: number;
  rating_monitor_to_model?: number;
  signed_by_model: boolean;
  signed_by_monitor: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoomAlert {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
  timestamp: string;
}

export interface UserRanking {
  user_id: number;
  name: string;
  role: 'MONITOR' | 'MODELO';
  score: number;
  tickets_count: number;
  disputes_count: number;
  avg_rating: number;
  incidents_count: number;
  trend: 'up' | 'down' | 'neutral';
  bad_streak_current: number;
}

export type StockMovementType = 'PURCHASE_IN' | 'ADJUSTMENT' | 'ASSIGN' | 'DAMAGED' | 'LOST' | 'RETURN';

export interface WarehouseItem {
  id: string;
  name: string;
  category: string;
  brand?: string;
  model?: string;
  unit_cost: number;
  currency: string;
  stock_qty: number;
  is_active: boolean;
  serial_required: boolean;
  updated_at: string;
}

export interface WarehouseMovement {
  id: string;
  item_id: string;
  item_name: string;
  type: StockMovementType;
  qty: number;
  unit_cost_snapshot: number;
  related_room_code?: string;
  date: string;
  user: string;
  notes: string;
}

export interface RoomType {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

export interface SystemAlert {
  id: string;
  alert_type: string;
  subject_user_id: number;
  subject_name: string;
  subject_role: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  status: 'OPEN' | 'RESOLVED';
  streak_count: number;
  message: string;
  metadata_json?: any;
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
}

export interface RankingFilterParams {
  role: 'MONITOR' | 'MODELO';
  startDate?: string;
  endDate?: string;
  shift?: string | 'ALL';
  roomType?: string | 'ALL';
}

export interface RoomDashboardSettings {
  visibleColumns: {
    type: boolean;
    floor: boolean;
    status: boolean;
    assignment: boolean;
    occupancy: boolean;
    inventoryValue: boolean;
  };
  compactMode: boolean;
  defaultFilter: string;
}

// --- STORE & INVENTORY ---

export interface StoreCategory {
  id: string;
  name: string;
  slug: string;
}

export interface VariantAttributes {
  color?: string;
  color_hex?: string;
  size?: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  name: string;
  attributes: VariantAttributes;
  current_stock: number;
  status: string;
  price_override?: number;
}

export interface StoreProduct {
  id: string;
  studio_id: string;
  name: string;
  category_id: string;
  brand?: string;
  unit: string;
  description_short: string;
  description_long: string;
  images: { id: string; url_thumb: string; url_medium: string; url_original: string; is_main: boolean }[];
  price_base: number;
  min_stock: number;
  total_stock: number;
  is_active: boolean;
  is_new?: boolean;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  tax_rate?: number;
  variants: ProductVariant[];
}

export interface InventoryLot {
  id: string;
  product_variant_id: string;
  received_at: string;
  unit_cost: number;
  initial_qty: number;
  current_qty: number;
}

export interface StockMovement {
  id: string;
  variant_id: string;
  type: string;
  qty: number;
  date: string;
}

export interface InstallmentPlan {
  id: string;
  user_name: string;
  total_amount: number;
  monthly_payment: number;
  term_months: number;
}

export interface LoanRequest {
  id: string;
  user_id: number;
  amount: number;
  periods: number;
  reason: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
}

export interface StoreOrder {
  id: string;
  studio_id: string;
  buyer_user_id: number;
  buyer_name: string;
  cost_center_id?: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'DELIVERED' | 'CANCELLED';
  items: any[];
  subtotal: number;
  tax_total: number;
  total_amount: number;
  payment_method: 'CASH' | 'PAYROLL' | 'LOAN' | 'INSTALLMENTS';
  created_at: string;
  payment_details?: any;
}

export interface FinancialRule {
  role_id: number;
  term_type: 'LOAN' | 'PAYROLL';
  allowed: boolean;
  max_amount: number;
  max_periods: number;
  interest_rate: number;
  requires_approval: boolean;
}

export type FinanceTermType = 'LOAN' | 'PAYROLL';

export interface Requisition {
  id: string;
  user_id: number;
  user_name: string;
  product_name: string;
  qty: number;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface CostCenter {
  id: string;
  code: string;
  name: string;
}

export interface AnalyticsSummary {
  net_sales: number;
  tax_collected: number;
  gross_sales: number;
  cogs: number;
  gross_profit: number;
  margin_percent: number;
  orders_count: number;
  units_sold: number;
  aov: number;
  bad_debt: number;
  adjusted_profit: number;
  inventory_turnover: number;
  avg_days_to_sell: number;
  mom_comparison: any;
}

export interface SalesSeriesData {
  date: string;
  net_sales: number;
  gross_profit: number;
  units: number;
  orders: number;
}

export interface ProductPerformance {
  id: string;
  name: string;
  sku: string;
  category: string;
  units_sold: number;
  net_sales: number;
  cogs: number;
  gross_profit: number;
  margin_percent: number;
  turnover_rate: number;
  avg_days_to_sell: number;
  stock_current: number;
  reorder_suggested: boolean;
  is_dead_stock: boolean;
}

export interface InventoryAging {
  range_0_30: number;
  range_31_60: number;
  range_61_90: number;
  range_90_plus: number;
  total_valuation: number;
}

export interface PurchaseOrder {
  id: string;
  supplier: string;
}

export interface CategoryPerformance {
  id: string;
  name: string;
  net_sales: number;
  percentage: number;
}

// --- PHOTOGRAPHY ---

export type PhotoServiceType = 'FOTO' | 'VIDEO' | 'FOTO_VIDEO';
export type PhotoRequestStatus = 'SENT' | 'PENDING_CONFIRMATION' | 'ACCEPTED' | 'CONFIRMED' | 'IN_PROGRESS' | 'DELIVERED' | 'RATED' | 'CLOSED' | 'RESCHEDULE_PROPOSED' | 'REJECTED' | 'CANCELLED';

export interface PhotoAsset {
  id: string;
  request_id: string;
  drive_file_id: string;
  drive_url: string;
  preview_url: string;
  type: 'PHOTO' | 'VIDEO';
  created_at: string;
}

export interface PhotoRequest {
  id: string;
  studio_id: string;
  requester_id: number;
  requester_name: string;
  type: string;
  objective: string;
  location: string;
  proposed_date: string;
  proposed_time: string;
  duration_minutes: number;
  confirmed_date?: string;
  style_references?: string;
  requires_makeup: boolean;
  makeup_artist_id?: number;
  makeup_artist_name?: string;
  photographer_id?: number;
  status: PhotoRequestStatus;
  priority: 'NORMAL' | 'HIGH';
  assets: PhotoAsset[];
  created_at: string;
  updated_at: string;
  history_log: { user: string; action: string; date: string }[];
}

export interface PhotoCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'SHOOT' | 'BLOCK';
  status?: PhotoRequestStatus;
  resourceId?: number;
}

export interface PhotoRating {
  id: string;
  request_id: string;
  from_user_id: number;
  to_user_id: number;
  role_target: string;
  score: number;
  aspects: any;
  comment?: string;
  created_at: string;
}

export interface PhotoDashboardKPI {
  total_requests: number;
  avg_confirmation_time_hours: number;
  avg_delivery_time_hours: number;
  rating_photographer_avg: number;
  rating_makeup_avg: number;
  reschedule_rate: number;
  status_distribution: { name: string; value: number }[];
  top_photographers: { name: string; rating: number; jobs: number }[];
}

// --- MEMBERSHIP & BILLING ---

export interface SubscriptionData {
  status: 'ACTIVE' | 'EXPIRED';
  active_users_count: number;
  current_tier_index: number;
  next_billing_date: string;
  days_until_due: number;
  plan_name: string;
  autopay_enabled: boolean;
  last_payment_method: 'CARD' | 'WALLET';
}

export type BillingCycle = 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'ANNUAL';

export interface InvoiceRecord {
  id: string;
  date: string;
  amount: number;
  cycle: string;
  status: 'PAID' | 'PENDING' | 'FAILED';
  method: string;
}

export interface PricingTier {
  id: string;
  name: string;
  min: number;
  max: number;
  monthly_price: number;
  annual_price: number;
}

export interface WalletBalance {
  available: number;
  pending: number;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  type: 'TOP_UP' | 'SUBSCRIPTION_PAYMENT' | 'REFERRAL_REWARD' | 'REFERRAL_BONUS' | 'PURCHASE';
  amount: number;
  status: 'AVAILABLE' | 'PENDING' | 'REVERSED';
  description: string;
  date: string;
}

export interface ReferredUser {
  id: string;
  name: string;
  studio_name: string;
  date_joined: string;
  status: 'ACTIVE' | 'PENDING_VALIDATION';
  commission_earned: number;
}

export interface ReferralStats {
  code: string;
  link: string;
  total_invited: number;
  pending_rewards: number;
  approved_rewards: number;
  rejected_count: number;
  bonus_milestones: { target: number; reward: number; achieved: boolean }[];
  referred_users: ReferredUser[];
}

export interface PaymentSettings {
  bank_name: string;
  account_type: string;
  account_number: string;
  account_holder: string;
  holder_id: string;
  email_notifications: string;
  instructions: string;
}

export interface GlobalSettings {
  payment: PaymentSettings;
  support: {
    whatsapp_number: string;
    email_support: string;
    hours_operation: string;
    help_center_url: string;
  };
  company: {
    brand_name: string;
    legal_name: string;
    nit: string;
    address: string;
    city: string;
    country: string;
  };
  last_updated: string;
  updated_by: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

// --- ZKTECO ATTENDANCE TYPES ---

export type ZKIntegrationMode = 'BIOTIME_API' | 'PUSH_ADMS';
export type PunchState = 'IN' | 'OUT' | 'BREAK_IN' | 'BREAK_OUT' | 'OVERTIME_IN' | 'OVERTIME_OUT' | 'AUTO';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EARLY_LEAVE' | 'REST_DAY' | 'HOLIDAY';

export interface ZKDevice {
  id: string;
  studio_id: string;
  sn: string;
  alias: string;
  ip_address?: string;
  area_name?: string;
  last_sync_at?: string;
  status: 'ONLINE' | 'OFFLINE';
}

export interface ZKEmployee {
  id: string;
  studio_id: string;
  emp_code: string; // ID en el biométrico
  first_name: string;
  last_name: string;
  department?: string;
  linked_user_id?: number;
  is_active: boolean;
}

export interface ZKTransaction {
  id: string;
  studio_id: string;
  emp_code: string;
  punch_time: string;
  punch_state: PunchState;
  terminal_sn: string;
  verify_type: number;
}

export interface WorkShift {
  id: string;
  studio_id: string;
  name: string;
  start_time: string; // HH:mm
  end_time: string;   // HH:mm
  grace_period_minutes: number;
  is_night_shift: boolean;
  days_of_week: number[]; // 0-6
}

export interface AttendanceDay {
  id: string;
  user_id: number;
  full_name: string;
  role: string;
  date: string;
  shift_name: string;
  check_in?: string;
  check_out?: string;
  worked_minutes: number;
  expected_minutes: number;
  late_minutes: number;
  early_leave_minutes: number;
  overtime_minutes: number;
  debt_minutes: number;
  status: AttendanceStatus;
}

export interface OnSitePresence {
  user_id: number;
  full_name: string;
  role: string;
  check_in_time: string;
  location: string;
  photo_url?: string;
}

export interface TimeValuationSettings {
  minute_debt_price: number;
  hour_debt_price: number;
  overtime_hour_price: number;
  currency: string;
}

// --- CONTENT SALES ---

export type ContentAssetStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
export type ContentTaskStatus = 'PENDING' | 'SCHEDULED' | 'DONE';

export interface ContentPlatform {
  id: string;
  studio_id: string;
  name: string;
  icon: string;
  is_active: boolean;
  color: string;
}

export interface ContentAsset {
  id: string;
  studio_id: string;
  model_user_id: number;
  model_name: string;
  type: 'PHOTO' | 'VIDEO';
  preview_url: string;
  file_url: string;
  status: ContentAssetStatus;
  tags_json: string[];
  created_at: string;
}

export interface ContentTask {
  id: string;
  studio_id: string;
  model_user_id: number;
  model_name: string;
  model_avatar?: string;
  status: ContentTaskStatus;
  streamate_hours: number;
  platforms: string[]; // platform IDs
  scheduled_at?: string;
  created_at: string;
  assigned_to_user_id?: number;
  assigned_name?: string;
  completed_at?: string;
  completed_date?: string;
}

// --- MONETIZATION ---

export interface MonetizationPlatform {
  id: string;
  name: string;
  type: 'USD_DIRECT' | 'TOKENS';
  default_commission_pct: number;
  notes?: string;
}

export interface MonetizationBeneficiary {
  id: string;
  type: 'PERSONA' | 'EMPRESA';
  name: string;
  identification: string;
  legal_note: string;
  retentions_enabled: boolean;
  default_retention_pct?: number;
  default_commission_pct?: number;
  active: boolean;
  bank_info?: {
    bank: string;
    type: string;
    number: string;
  };
}

export interface LiquidationItem {
  id: string;
  platform_id?: string;
  platform_name?: string;
  type: 'USD' | 'TOKENS';
  amount_usd?: number;
  tokens?: number;
  token_value_snapshot: number;
  calculated_usd?: number;
}

export interface LiquidationDiscount {
  id: string;
  description: string;
  amount_cop: number;
}

export interface LiquidationRetention {
  id: string;
  type: string;
  percentage: number;
  base_amount_cop: number;
  calculated_amount_cop: number;
}

export interface Liquidation {
  id: string;
  studio_id: string;
  date: string;
  beneficiary_id: string;
  beneficiary_name?: string;
  beneficiary_doc?: string;
  items: LiquidationItem[];
  trm_pago: number;
  trm_real?: number;
  total_usd: number;
  total_cop_bruto: number;
  commission_percentage: number;
  commission_cop: number;
  discounts: LiquidationDiscount[];
  total_discounts_cop: number;
  retentions: LiquidationRetention[];
  total_retentions_cop: number;
  base_payable_cop: number;
  total_payable_cop: number;
  spread_profit_cop?: number;
  total_real_profit_cop?: number;
  status: 'DRAFT' | 'PAID';
  created_at: string;
}