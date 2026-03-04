import { supabase } from '../supabaseClient';

export interface TableListOptions {
  select?: string;
  orderBy?: string;
  ascending?: boolean;
  filters?: Record<string, any>;
  search?: { term: string; columns: string[] };
  limit?: number;
}

const list = async (table: string, options: TableListOptions = {}) => {
  let query = supabase.from(table).select(options.select || '*');

  if (options.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      query = query.eq(key, value);
    });
  }

  if (options.search?.term) {
    const term = options.search.term.trim();
    if (term) {
      const orFilters = options.search.columns
        .map((column) => `${column}.ilike.%${term}%`)
        .join(',');
      query = query.or(orFilters);
    }
  }

  if (options.orderBy) {
    query = query.order(options.orderBy, { ascending: options.ascending ?? true });
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  return { data: data || [], error };
};

const insert = async (table: string, payload: Record<string, any>) => {
  const { data, error } = await supabase.from(table).insert([payload]).select().single();
  return { data, error };
};

const update = async (table: string, primaryKey: string, id: string | number, payload: Record<string, any>) => {
  const { data, error } = await supabase
    .from(table)
    .update(payload)
    .eq(primaryKey, id)
    .select()
    .single();
  return { data, error };
};

const remove = async (table: string, primaryKey: string, id: string | number) => {
  const { error } = await supabase.from(table).delete().eq(primaryKey, id);
  return { error };
};

const tableService = { list, insert, update, remove };

export default tableService;
