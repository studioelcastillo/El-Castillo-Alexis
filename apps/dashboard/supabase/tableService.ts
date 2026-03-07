import { supabase } from '../supabaseClient';

export interface TableListOptions {
  select?: string;
  orderBy?: string;
  ascending?: boolean;
  filters?: Record<string, any>;
  search?: { term: string; columns: string[] };
  limit?: number;
}

export interface TableGetOptions {
  select?: string;
  filters?: Record<string, any>;
}

const applyFilters = <TQuery extends { eq: (column: string, value: any) => TQuery }>(
  query: TQuery,
  filters?: Record<string, any>,
) => {
  let nextQuery = query;

  if (!filters) {
    return nextQuery;
  }

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    nextQuery = nextQuery.eq(key, value);
  });

  return nextQuery;
};

const list = async (table: string, options: TableListOptions = {}) => {
  let query = supabase.from(table).select(options.select || '*');

  query = applyFilters(query, options.filters);

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

const getOne = async (table: string, options: TableGetOptions = {}) => {
  let query = supabase.from(table).select(options.select || '*');

  query = applyFilters(query, options.filters);

  const { data, error } = await query.single();
  return { data, error };
};

const insert = async (table: string, payload: Record<string, any>) => {
  const { data, error } = await supabase.from(table).insert([payload]).select().single();
  return { data, error };
};

const update = async (
  table: string,
  primaryKey: string,
  id: string | number,
  payload: Record<string, any>,
  filters?: Record<string, any>,
) => {
  let query = supabase
    .from(table)
    .update(payload)
    .eq(primaryKey, id);

  query = applyFilters(query, filters);

  const { data, error } = await query.select().single();
  return { data, error };
};

const remove = async (
  table: string,
  primaryKey: string,
  id: string | number,
  filters?: Record<string, any>,
) => {
  let query = supabase.from(table).delete().eq(primaryKey, id);

  query = applyFilters(query, filters);

  const { error } = await query;
  return { error };
};

const tableService = { list, getOne, insert, update, remove };

export default tableService;
