import React, { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Search, Pencil, Trash2, X } from 'lucide-react';
import tableService from '../supabase/tableService';
import { getCurrentStudioId } from '../tenant';

type FieldType = 'text' | 'number' | 'boolean' | 'date' | 'datetime' | 'select' | 'textarea' | 'password';

interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  options?: Array<{ label: string; value: string | number }>;
  placeholder?: string;
}

interface ResourceConfig {
  id: string;
  label: string;
  table: string;
  primaryKey: string;
  columns: string[];
  fields: FieldConfig[];
  searchColumns: string[];
  orderBy?: string;
   scopeField?: string;
   accessMode?: 'full' | 'readOnly';
}

const RESOURCES: ResourceConfig[] = [
  {
    id: 'categories',
    label: 'Categorias',
    table: 'categories',
    primaryKey: 'cate_id',
    columns: ['cate_id', 'cate_name', 'created_at'],
    fields: [{ key: 'cate_name', label: 'Nombre', type: 'text' }],
    searchColumns: ['cate_name'],
  },
  {
    id: 'products',
    label: 'Productos',
    table: 'products',
    primaryKey: 'prod_id',
    columns: ['prod_id', 'prod_code', 'prod_name', 'prod_sale_price', 'prod_stock', 'cate_id'],
    fields: [
      { key: 'cate_id', label: 'Categoria ID', type: 'number' },
      { key: 'prod_code', label: 'Codigo', type: 'text' },
      { key: 'prod_name', label: 'Nombre', type: 'text' },
      { key: 'prod_purchase_price', label: 'Precio compra', type: 'number' },
      { key: 'prod_sale_price', label: 'Precio venta', type: 'number' },
      { key: 'prod_stock', label: 'Stock', type: 'number' },
      { key: 'transtype_id', label: 'Tipo transaccion ID', type: 'number' },
    ],
    searchColumns: ['prod_code', 'prod_name'],
  },
  {
    id: 'transaction_types',
    label: 'Tipos Transaccion',
    table: 'transactions_types',
    primaryKey: 'transtype_id',
    columns: ['transtype_id', 'transtype_group', 'transtype_name', 'transtype_value'],
    fields: [
      {
        key: 'transtype_group',
        label: 'Grupo',
        type: 'select',
        options: [
          { label: 'INGRESOS', value: 'INGRESOS' },
          { label: 'EGRESOS', value: 'EGRESOS' },
        ],
      },
      { key: 'transtype_name', label: 'Nombre', type: 'text' },
      { key: 'transtype_behavior', label: 'Comportamiento', type: 'text' },
      { key: 'transtype_value', label: 'Valor', type: 'number' },
      { key: 'transtype_rtefte', label: 'Rtefte', type: 'boolean' },
    ],
    searchColumns: ['transtype_name', 'transtype_group'],
  },
  {
    id: 'accounts',
    label: 'Cuentas Contables',
    table: 'accounts',
    primaryKey: 'accacc_id',
    columns: ['accacc_id', 'accacc_name', 'accacc_number'],
    fields: [
      { key: 'accacc_name', label: 'Nombre', type: 'text' },
      { key: 'accacc_number', label: 'Numero', type: 'text' },
    ],
    searchColumns: ['accacc_name', 'accacc_number'],
  },
  {
    id: 'exchange_rates',
    label: 'Tasas Cambio',
    table: 'exchange_rates',
    primaryKey: 'exrate_id',
    columns: ['exrate_id', 'exrate_date', 'exrate_usd', 'exrate_eur', 'exrate_cop'],
    fields: [
      { key: 'exrate_date', label: 'Fecha', type: 'date' },
      { key: 'exrate_usd', label: 'USD', type: 'number' },
      { key: 'exrate_eur', label: 'EUR', type: 'number' },
      { key: 'exrate_cop', label: 'COP', type: 'number' },
    ],
    searchColumns: ['exrate_date'],
  },
  {
    id: 'periods',
    label: 'Periodos',
    table: 'periods',
    primaryKey: 'period_id',
    columns: ['period_id', 'period_start_date', 'period_end_date', 'period_state'],
    fields: [
      { key: 'period_start_date', label: 'Inicio', type: 'date' },
      { key: 'period_end_date', label: 'Fin', type: 'date' },
      { key: 'period_state', label: 'Estado', type: 'text' },
      { key: 'period_closed_date', label: 'Cierre', type: 'datetime' },
      { key: 'user_id', label: 'Usuario ID', type: 'number' },
      { key: 'period_observation', label: 'Observacion', type: 'textarea' },
    ],
    searchColumns: ['period_state'],
  },
  {
    id: 'bank_accounts',
    label: 'Cuentas Bancarias',
    table: 'bank_accounts',
    primaryKey: 'bacc_id',
    scopeField: 'std_id',
    columns: ['bacc_id', 'bacc_bank', 'bacc_type', 'bacc_number', 'user_id', 'std_id'],
    fields: [
      { key: 'user_id', label: 'Usuario ID', type: 'number' },
      { key: 'std_id', label: 'Estudio ID', type: 'number' },
      { key: 'bacc_bank', label: 'Banco', type: 'text' },
      { key: 'bacc_type', label: 'Tipo', type: 'text' },
      { key: 'bacc_number', label: 'Numero', type: 'text' },
      { key: 'bacc_owner_name', label: 'Titular', type: 'text' },
      { key: 'bacc_owner_id', label: 'Documento titular', type: 'text' },
      { key: 'bacc_active', label: 'Activo', type: 'boolean' },
    ],
    searchColumns: ['bacc_bank', 'bacc_number', 'bacc_owner_name'],
  },
  {
    id: 'commissions',
    label: 'Comisiones',
    table: 'commissions',
    primaryKey: 'com_id',
    scopeField: 'std_id',
    columns: ['com_id', 'com_type', 'com_percentage', 'com_fixed_amount', 'std_id', 'user_id'],
    fields: [
      { key: 'std_id', label: 'Estudio ID', type: 'number' },
      { key: 'user_id', label: 'Usuario ID', type: 'number' },
      { key: 'com_type', label: 'Tipo', type: 'text' },
      { key: 'com_percentage', label: 'Porcentaje', type: 'number' },
      { key: 'com_fixed_amount', label: 'Monto fijo', type: 'number' },
      { key: 'com_currency', label: 'Moneda', type: 'text' },
      { key: 'com_active', label: 'Activo', type: 'boolean' },
      { key: 'period_id', label: 'Periodo ID', type: 'number' },
    ],
    searchColumns: ['com_type', 'com_currency'],
  },
  {
    id: 'payments',
    label: 'Pagos',
    table: 'payments',
    primaryKey: 'pay_id',
    scopeField: 'std_id',
    columns: ['pay_id', 'pay_amount', 'pay_currency', 'pay_status', 'user_id', 'std_id'],
    fields: [
      { key: 'user_id', label: 'Usuario ID', type: 'number' },
      { key: 'std_id', label: 'Estudio ID', type: 'number' },
      { key: 'period_id', label: 'Periodo ID', type: 'number' },
      { key: 'pay_amount', label: 'Monto', type: 'number' },
      { key: 'pay_currency', label: 'Moneda', type: 'text' },
      { key: 'pay_status', label: 'Estado', type: 'text' },
      { key: 'pay_date', label: 'Fecha', type: 'date' },
      { key: 'pay_notes', label: 'Notas', type: 'textarea' },
      { key: 'pay_exchange_rate', label: 'TRM', type: 'number' },
    ],
    searchColumns: ['pay_status', 'pay_currency'],
  },
  {
    id: 'paysheets',
    label: 'Planillas',
    table: 'paysheets',
    primaryKey: 'paysh_id',
    scopeField: 'std_id',
    accessMode: 'readOnly',
    columns: ['paysh_id', 'std_id', 'period_id', 'paysh_total_cop', 'paysh_status'],
    fields: [
      { key: 'std_id', label: 'Estudio ID', type: 'number' },
      { key: 'period_id', label: 'Periodo ID', type: 'number' },
      { key: 'paysh_total_usd', label: 'Total USD', type: 'number' },
      { key: 'paysh_total_eur', label: 'Total EUR', type: 'number' },
      { key: 'paysh_total_cop', label: 'Total COP', type: 'number' },
      { key: 'paysh_status', label: 'Estado', type: 'text' },
      { key: 'paysh_notes', label: 'Notas', type: 'textarea' },
    ],
    searchColumns: ['paysh_status'],
  },
  {
    id: 'studios_accounts',
    label: 'Cuentas Estudio',
    table: 'studios_accounts',
    primaryKey: 'stdacc_id',
    scopeField: 'std_id',
    accessMode: 'readOnly',
    columns: ['stdacc_id', 'std_id', 'stdacc_app', 'stdacc_username', 'stdacc_active'],
    fields: [
      { key: 'std_id', label: 'Estudio ID', type: 'number' },
      { key: 'stdacc_app', label: 'Plataforma', type: 'text' },
      { key: 'stdacc_username', label: 'Usuario', type: 'text' },
      { key: 'stdacc_password', label: 'Password', type: 'password' },
      { key: 'stdacc_apikey', label: 'API Key', type: 'password' },
      { key: 'stdacc_active', label: 'Activo', type: 'boolean' },
    ],
    searchColumns: ['stdacc_app', 'stdacc_username'],
  },
  {
    id: 'studios_rooms',
    label: 'Cuartos',
    table: 'studios_rooms',
    primaryKey: 'stdroom_id',
    scopeField: 'std_id',
    columns: ['stdroom_id', 'std_id', 'stdroom_name', 'stdroom_active', 'stdroom_occupied'],
    fields: [
      { key: 'std_id', label: 'Estudio ID', type: 'number' },
      { key: 'stdroom_name', label: 'Nombre', type: 'text' },
      { key: 'stdroom_consecutive', label: 'Consecutivo', type: 'number' },
      { key: 'stdroom_active', label: 'Activo', type: 'boolean' },
      { key: 'stdroom_occupied', label: 'Ocupado', type: 'boolean' },
    ],
    searchColumns: ['stdroom_name'],
  },
  {
    id: 'studios_shifts',
    label: 'Turnos',
    table: 'studios_shifts',
    primaryKey: 'stdshift_id',
    scopeField: 'std_id',
    columns: ['stdshift_id', 'std_id', 'stdshift_name', 'stdshift_begin_time', 'stdshift_finish_time'],
    fields: [
      { key: 'std_id', label: 'Estudio ID', type: 'number' },
      { key: 'stdshift_name', label: 'Nombre', type: 'text' },
      { key: 'stdshift_begin_time', label: 'Inicio', type: 'text' },
      { key: 'stdshift_finish_time', label: 'Fin', type: 'text' },
      { key: 'stdshift_capacity', label: 'Capacidad', type: 'number' },
    ],
    searchColumns: ['stdshift_name'],
  },
  {
    id: 'studios_models',
    label: 'Contratos',
    table: 'studios_models',
    primaryKey: 'stdmod_id',
    scopeField: 'std_id',
    columns: ['stdmod_id', 'std_id', 'user_id_model', 'stdmod_active', 'stdmod_commission_type'],
    fields: [
      { key: 'std_id', label: 'Estudio ID', type: 'number' },
      { key: 'user_id_model', label: 'Modelo ID', type: 'number' },
      { key: 'stdmod_start_at', label: 'Inicio', type: 'date' },
      { key: 'stdmod_finish_at', label: 'Fin', type: 'date' },
      { key: 'stdmod_active', label: 'Activo', type: 'boolean' },
      { key: 'stdmod_percent', label: 'Porcentaje', type: 'number' },
      { key: 'stdmod_commission_type', label: 'Tipo comision', type: 'text' },
    ],
    searchColumns: ['stdmod_commission_type'],
  },
  {
    id: 'models_accounts',
    label: 'Cuentas Modelos',
    table: 'models_accounts',
    primaryKey: 'modacc_id',
    accessMode: 'readOnly',
    columns: ['modacc_id', 'stdmod_id', 'modacc_app', 'modacc_username', 'modacc_active'],
    fields: [
      { key: 'stdmod_id', label: 'Contrato ID', type: 'number' },
      { key: 'modacc_app', label: 'Plataforma', type: 'text' },
      { key: 'modacc_username', label: 'Usuario', type: 'text' },
      { key: 'modacc_password', label: 'Password', type: 'password' },
      { key: 'modacc_state', label: 'Estado', type: 'text' },
      { key: 'modacc_active', label: 'Activo', type: 'boolean' },
    ],
    searchColumns: ['modacc_app', 'modacc_username'],
  },
  {
    id: 'models_goals',
    label: 'Metas Modelos',
    table: 'models_goals',
    primaryKey: 'modgoal_id',
    columns: ['modgoal_id', 'stdmod_id', 'modgoal_type', 'modgoal_amount', 'modgoal_date'],
    fields: [
      { key: 'stdmod_id', label: 'Contrato ID', type: 'number' },
      { key: 'modgoal_type', label: 'Tipo', type: 'text' },
      { key: 'modgoal_amount', label: 'Monto', type: 'number' },
      { key: 'modgoal_percent', label: 'Porcentaje', type: 'number' },
      { key: 'modgoal_date', label: 'Fecha', type: 'date' },
      { key: 'modgoal_reach_goal', label: 'Cumplida', type: 'boolean' },
    ],
    searchColumns: ['modgoal_type'],
  },
  {
    id: 'models_streams_files',
    label: 'Archivos Streams',
    table: 'models_streams_files',
    primaryKey: 'modstrfile_id',
    accessMode: 'readOnly',
    columns: ['modstrfile_id', 'modstrfile_description', 'modstrfile_filename', 'created_by'],
    fields: [
      { key: 'modstrfile_description', label: 'Descripcion', type: 'text' },
      { key: 'modstrfile_filename', label: 'Archivo', type: 'text' },
      { key: 'modstrfile_template', label: 'Template', type: 'text' },
      { key: 'created_by', label: 'Creado por', type: 'number' },
    ],
    searchColumns: ['modstrfile_description', 'modstrfile_filename'],
  },
  {
    id: 'models_streams_customers',
    label: 'Clientes Streams',
    table: 'models_streams_customers',
    primaryKey: 'modstrcus_id',
    columns: ['modstrcus_id', 'modstr_id', 'modstrcus_name', 'modstrcus_price', 'modstrcus_earnings'],
    fields: [
      { key: 'modstr_id', label: 'Stream ID', type: 'number' },
      { key: 'modstrcus_name', label: 'Nombre', type: 'text' },
      { key: 'modstrcus_account', label: 'Cuenta', type: 'text' },
      { key: 'modstrcus_product', label: 'Producto', type: 'text' },
      { key: 'modstrcus_price', label: 'Precio', type: 'number' },
      { key: 'modstrcus_earnings', label: 'Ganancias', type: 'number' },
      { key: 'modstrcus_received_at', label: 'Recibido', type: 'datetime' },
    ],
    searchColumns: ['modstrcus_name', 'modstrcus_account'],
  },
  {
    id: 'models_transactions',
    label: 'Transacciones Modelo',
    table: 'models_transactions',
    primaryKey: 'modtrans_id',
    columns: ['modtrans_id', 'stdmod_id', 'transtype_id', 'modtrans_date', 'modtrans_amount'],
    fields: [
      { key: 'stdmod_id', label: 'Contrato ID', type: 'number' },
      { key: 'transtype_id', label: 'Tipo transaccion ID', type: 'number' },
      { key: 'modtrans_date', label: 'Fecha', type: 'date' },
      { key: 'modtrans_amount', label: 'Monto', type: 'number' },
      { key: 'modtrans_description', label: 'Descripcion', type: 'text' },
      { key: 'modtrans_quantity', label: 'Cantidad', type: 'number' },
      { key: 'modtrans_rtefte', label: 'Rtefte', type: 'boolean' },
    ],
    searchColumns: ['modtrans_description'],
  },
  {
    id: 'notifications',
    label: 'Notificaciones',
    table: 'notifications',
    primaryKey: 'noti_id',
    columns: ['noti_id', 'noti_title', 'noti_type', 'noti_read', 'user_id_to_notify'],
    fields: [
      { key: 'user_id', label: 'Usuario ID', type: 'number' },
      { key: 'user_id_to_notify', label: 'Usuario destino', type: 'number' },
      { key: 'noti_type', label: 'Tipo', type: 'text' },
      { key: 'noti_title', label: 'Titulo', type: 'text' },
      { key: 'noti_data', label: 'Dato', type: 'text' },
      { key: 'noti_menu', label: 'Menu', type: 'text' },
      { key: 'noti_read', label: 'Leida', type: 'boolean' },
    ],
    searchColumns: ['noti_title', 'noti_type'],
  },
  {
    id: 'logs',
    label: 'Logs',
    table: 'logs',
    primaryKey: 'log_id',
    accessMode: 'readOnly',
    columns: ['log_id', 'log_action', 'log_entity', 'log_entity_id', 'user_id'],
    fields: [
      { key: 'user_id', label: 'Usuario ID', type: 'number' },
      { key: 'log_action', label: 'Accion', type: 'text' },
      { key: 'log_entity', label: 'Entidad', type: 'text' },
      { key: 'log_entity_id', label: 'Entidad ID', type: 'text' },
    ],
    searchColumns: ['log_action', 'log_entity'],
  },
  {
    id: 'login_history',
    label: 'Historial Login',
    table: 'login_history',
    primaryKey: 'lhist_id',
    accessMode: 'readOnly',
    columns: ['lhist_id', 'user_id', 'lhist_ip', 'lhist_device', 'lhist_success'],
    fields: [
      { key: 'user_id', label: 'Usuario ID', type: 'number' },
      { key: 'lhist_ip', label: 'IP', type: 'text' },
      { key: 'lhist_device', label: 'Dispositivo', type: 'text' },
      { key: 'lhist_success', label: 'Exitoso', type: 'boolean' },
    ],
    searchColumns: ['lhist_ip', 'lhist_device'],
  },
  {
    id: 'settings',
    label: 'Configuraciones',
    table: 'settings',
    primaryKey: 'set_id',
    accessMode: 'readOnly',
    columns: ['set_id', 'set_key', 'set_value', 'set_description'],
    fields: [
      { key: 'set_key', label: 'Clave', type: 'text' },
      { key: 'set_value', label: 'Valor', type: 'textarea' },
      { key: 'set_description', label: 'Descripcion', type: 'text' },
    ],
    searchColumns: ['set_key', 'set_value'],
  },
];

const SECTIONS = [
  { title: 'Catalogos', items: ['categories', 'products', 'transaction_types', 'accounts'] },
  { title: 'Finanzas', items: ['exchange_rates', 'periods', 'bank_accounts', 'commissions', 'payments', 'paysheets'] },
  { title: 'Estudios', items: ['studios_accounts', 'studios_rooms', 'studios_shifts', 'studios_models'] },
  { title: 'Modelos', items: ['models_accounts', 'models_goals', 'models_streams_files', 'models_streams_customers', 'models_transactions'] },
  { title: 'Sistema', items: ['settings', 'notifications', 'logs', 'login_history'] },
];

const AdminDataPage: React.FC = () => {
  const isSensitiveField = (key: string) => /(password|apikey|api_key|token|secret)/i.test(key);

  const maskValue = (key: string, value: unknown, row?: Record<string, any>) => {
    if (value === null || value === undefined || value === '') return '--';
    if (key === 'set_value' && row?.set_key && isSensitiveField(String(row.set_key))) return '••••••••';
    if (isSensitiveField(key)) return '••••••••';
    return String(value);
  };

  const resourceMap = useMemo(
    () => new Map(RESOURCES.map((resource) => [resource.id, resource])),
    []
  );

  const [selected, setSelected] = useState<string>(RESOURCES[0].id);
  const resource = resourceMap.get(selected) as ResourceConfig;
  const studioId = getCurrentStudioId();
  const scopedFilters = resource.scopeField && studioId ? { [resource.scopeField]: studioId } : undefined;
  const visibleFields = resource.fields.filter((field) => field.key !== resource.scopeField);
  const isReadOnly = resource.accessMode === 'readOnly';

  const withScope = (payload: Record<string, any>) => {
    if (!resource.scopeField || !studioId) {
      return payload;
    }

    return {
      ...payload,
      [resource.scopeField]: studioId,
    };
  };

  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await tableService.list(resource.table, {
        orderBy: resource.orderBy || resource.primaryKey,
        ascending: false,
        filters: scopedFilters,
        search: search
          ? {
              term: search,
              columns: resource.searchColumns,
            }
          : undefined,
      });
      setRows(response.data);
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar la data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [resource.id]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadData();
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const resetForm = () => {
    setFormValues({});
    setEditing(null);
    setIsCreating(false);
  };

  const startCreate = () => {
    if (isReadOnly) return;
    setIsCreating(true);
    setEditing(null);
    setFormValues(withScope({}));
  };

  const startEdit = (row: any) => {
    if (isReadOnly) return;
    setEditing(row);
    setIsCreating(false);
    const initialValues: Record<string, any> = {};
    visibleFields.forEach((field) => {
      initialValues[field.key] = row[field.key] ?? '';
    });
    setFormValues(initialValues);
  };

  const handleSave = async () => {
    if (isReadOnly) return;
    try {
      const payload: Record<string, any> = {};
      resource.fields.forEach((field) => {
        const value = formValues[field.key];
        if (field.type === 'number') {
          payload[field.key] = value === '' ? null : Number(value);
          return;
        }
        if (field.type === 'boolean') {
          payload[field.key] = Boolean(value);
          return;
        }
        payload[field.key] = value === '' ? null : value;
      });
      const scopedPayload = withScope(payload);

      if (editing) {
        await tableService.update(resource.table, resource.primaryKey, editing[resource.primaryKey], scopedPayload, scopedFilters);
      } else {
        await tableService.insert(resource.table, scopedPayload);
      }

      resetForm();
      loadData();
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    }
  };

  const handleDelete = async (row: any) => {
    if (isReadOnly) return;
    if (!window.confirm(`Eliminar ${resource.label} #${row[resource.primaryKey]}?`)) return;
    try {
      await tableService.remove(resource.table, resource.primaryKey, row[resource.primaryKey], scopedFilters);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar');
    }
  };

  const renderField = (field: FieldConfig) => {
    const value = formValues[field.key] ?? '';
    if (field.type === 'boolean') {
      return (
        <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => setFormValues((prev) => ({ ...prev, [field.key]: e.target.checked }))}
            className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
          />
          {field.label}
        </label>
      );
    }

    if (field.type === 'select') {
      return (
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{field.label}</label>
          <select
            value={value}
            onChange={(e) => setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700"
          >
            <option value="">Seleccione</option>
            {field.options?.map((opt) => (
              <option key={String(opt.value)} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (field.type === 'textarea') {
      return (
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{field.label}</label>
          <textarea
            value={value}
            onChange={(e) => setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700"
            rows={3}
          />
        </div>
      );
    }

    const inputType = field.type === 'date' ? 'date' : field.type === 'datetime' ? 'datetime-local' : field.type;
    return (
      <div className="space-y-1">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{field.label}</label>
        <input
          type={inputType}
          value={value}
          placeholder={field.placeholder}
          onChange={(e) => setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700"
        />
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Administracion de Datos</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Gestion centralizada de catalogos, finanzas y configuracion.</p>
        </div>
        <button
          onClick={loadData}
          className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-xl transition-all"
          title="Recargar"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-700">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{section.title}</p>
              <div className="space-y-1">
                {section.items.map((itemId) => {
                  const item = resourceMap.get(itemId);
                  if (!item) return null;
                  const active = item.id === selected;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelected(item.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        active
                          ? 'bg-amber-500/10 text-amber-600 border border-amber-200'
                          : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col md:flex-row md:items-center gap-3 justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">{resource.label}</p>
              <p className="text-sm text-slate-500">Tabla: {resource.table}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar"
                  className="pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>
              {!isReadOnly && (
                <button
                  onClick={startCreate}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest"
                >
                  <Plus size={14} />
                  Nuevo
                </button>
              )}
            </div>
          </div>

          {(isCreating || editing) && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-black text-slate-900">
                  {editing ? `Editar #${editing[resource.primaryKey]}` : 'Crear registro'}
                </p>
                <button onClick={resetForm} className="text-slate-400 hover:text-slate-700">
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visibleFields.map((field) => (
                  <div key={field.key}>{renderField(field)}</div>
                ))}
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Cancelar
                </button>
                {!isReadOnly && (
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                  >
                    Guardar
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {resource.columns.map((col) => (
                      <th key={col} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {col}
                      </th>
                    ))}
                    {!isReadOnly && (
                      <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={resource.columns.length + (isReadOnly ? 0 : 1)} className="px-4 py-6 text-center text-slate-400">
                        Cargando...
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={resource.columns.length + (isReadOnly ? 0 : 1)} className="px-4 py-6 text-center text-slate-400">
                        Sin registros
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row[resource.primaryKey]} className="hover:bg-slate-50/50">
                        {resource.columns.map((col) => (
                          <td key={col} className="px-4 py-3 text-slate-600">
                            {maskValue(col, row[col], row)}
                          </td>
                        ))}
                        {!isReadOnly && (
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => startEdit(row)}
                                className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900"
                                title="Editar"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => handleDelete(row)}
                                className="p-2 rounded-lg border border-slate-200 text-red-400 hover:text-red-600"
                                title="Eliminar"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDataPage;
