import { supabase } from './supabaseClient';
import { normalizeQueryString } from './supabase/queryUtils';
import { getStoredUser } from './session';

export type PetitionStateValue = 'EN PROCESO' | 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
export type PetitionTypeValue = 'CREACIÓN DE CUENTA' | 'CREACION DE CUENTA' | 'REPORTE' | 'ACCOUNT_CREATION';

export interface PetitionDatatableParams {
  start: number;
  length: number;
  sortBy?: string;
  dir?: 'ASC' | 'DESC';
  filter?: string;
  states?: PetitionStateValue[];
  studios?: Array<number | string>;
  userId?: number | string;
  columns?: string[];
}

export interface CreatePetitionPayload {
  ptn_type: PetitionTypeValue;
  ptn_nick: string;
  ptn_password: string;
  ptn_page: string[];
  user_id: number | string;
  stdmod_id?: number | string;
  ptnstate_observation?: string;
}

export interface CreatePetitionStatePayload {
  ptn_id: number | string;
  ptnstate_state: PetitionStateValue;
  ptnstate_observation?: string;
  ptn_nick_final?: string;
  ptn_mail?: string;
  ptn_password_final?: string;
  ptn_payment_pseudonym?: string;
  ptn_linkacc?: string;
}

const DEFAULT_COLUMNS = [
  'petitions.ptn_consecutive',
  'petitions.ptn_type',
  'petitions.ptn_nick_final',
  'petitions.ptn_page',
  'petitions.created_at',
  'petitions.updated_at',
];

const normalizePetitionState = (value?: string | null): PetitionStateValue | null => {
  if (!value) return null;
  const normalized = value.toUpperCase().replace(/\s+/g, ' ').trim();
  switch (normalized) {
    case 'EN PROCESO':
    case 'EN_PROCESO':
    case 'IN PROCESS':
    case 'IN_PROGRESS':
      return 'EN PROCESO';
    case 'PENDIENTE':
    case 'PENDING':
      return 'PENDIENTE';
    case 'APROBADA':
    case 'APPROVED':
      return 'APROBADA';
    case 'RECHAZADA':
    case 'REJECTED':
      return 'RECHAZADA';
    default:
      return null;
  }
};

const normalizeTimeline = (timeline: any[] = []): any[] => {
  if (!Array.isArray(timeline) || timeline.length === 0) return [];
  return timeline
    .map((item) => ({
      ...item,
      user: item?.user || item?.users || null,
      ptnstate_state: normalizePetitionState(item?.ptnstate_state) || item?.ptnstate_state,
    }))
    .sort((a, b) => {
      const aTime = a?.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b?.created_at ? new Date(b.created_at).getTime() : 0;
      return aTime - bTime;
    });
};

const buildTimelineFromRow = (row: any): any[] => {
  const state = normalizePetitionState(row?.ptn_state || row?.ptnstate_state);
  if (!state) return [];
  return [
    {
      ptnstate_state: state,
      ptnstate_observation: row?.ptn_observation || row?.ptnstate_observation || '',
      created_at: row?.updated_at || row?.created_at,
    },
  ];
};

const normalizeStateFilters = (states: string[]): string[] => {
  const normalized = new Set<string>();
  states.forEach((state) => {
    const mapped = normalizePetitionState(state) || state;
    normalized.add(mapped);
    if (mapped === 'PENDIENTE') normalized.add('PENDING');
    if (mapped === 'EN PROCESO') {
      normalized.add('IN PROCESS');
      normalized.add('IN_PROGRESS');
    }
  });
  return Array.from(normalized);
};

const getCurrentUserId = () => {
  const user = getStoredUser();
  return user?.user_id ?? null;
};

const PetitionService = {
  async getPetitions(params: PetitionDatatableParams | string) {
    let queryParams: URLSearchParams;

    if (typeof params === 'string') {
      queryParams = normalizeQueryString(params);
    } else {
      queryParams = new URLSearchParams();
      queryParams.append('start', String(params.start));
      queryParams.append('length', String(params.length));
      queryParams.append('sortby', params.sortBy || 'petitions.updated_at');
      queryParams.append('dir', params.dir || 'DESC');
      queryParams.append('filter', params.filter || '');
      queryParams.append(
        'columns',
        (params.columns && params.columns.length > 0 ? params.columns : DEFAULT_COLUMNS).join(',')
      );

      if (params.studios && params.studios.length > 0) {
        queryParams.append('studios', params.studios.join(','));
      }
      if (params.userId !== undefined && params.userId !== null) {
        queryParams.append('user_id', String(params.userId));
      }
      if (params.states && params.states.length > 0) {
        queryParams.append('states', params.states.join(','));
      }
    }

    let query = supabase
      .from('petitions')
      .select(
        '*, users!user_id(user_id, user_name, user_name2, user_surname, user_surname2, user_identification, user_model_category), studios_models(stdmod_id, studios(std_name)), petition_state:petition_states(ptnstate_state, ptnstate_observation, created_at, users!petition_states_user_id_fkey(user_name, user_name2, user_surname, user_surname2))',
        {
          count: 'exact',
        }
      );

    const filter = (queryParams.get('filter') || '').trim();
    const states = (queryParams.get('states') || '').split(',').filter(Boolean);
    const studios = (queryParams.get('studios') || '').split(',').filter(Boolean);
    const userId = queryParams.get('user_id');
    const sortByRaw = queryParams.get('sortby') || 'petitions.updated_at';
    const dir = (queryParams.get('dir') || 'DESC').toUpperCase();
    const start = Number(queryParams.get('start') || 0);
    const length = Number(queryParams.get('length') || 0);

    if (states.length > 0) {
      query = query.in('ptn_state', normalizeStateFilters(states));
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (studios.length > 0) {
      const ids = studios.map((value) => Number(value)).filter((value) => !Number.isNaN(value));
      if (ids.length > 0) {
        const { data: stdmods } = await supabase
          .from('studios_models')
          .select('stdmod_id')
          .in('std_id', ids);
        const stdmodIds = (stdmods || []).map((row) => row.stdmod_id).filter(Boolean);
        if (stdmodIds.length > 0) {
          query = query.in('stdmod_id', stdmodIds);
        }
      }
    }

    if (filter) {
      query = query.or(
        `ptn_type.ilike.%${filter}%,ptn_nick.ilike.%${filter}%,ptn_nick_final.ilike.%${filter}%,ptn_page.ilike.%${filter}%,ptn_consecutive.ilike.%${filter}%`
      );
    }

    const sortBy = sortByRaw.includes('.') ? sortByRaw.split('.').pop() : sortByRaw;
    query = query.order(sortBy || 'updated_at', { ascending: dir !== 'DESC' });

    if (length > 0) {
      query = query.range(start, start + length - 1);
    }

    const { data, error, count } = await query;
    const normalizedData = (data || []).map((row: any) => {
      const timeline = normalizeTimeline(row?.petition_state || row?.petition_states);
      return {
        ...row,
        ptn_state: normalizePetitionState(row?.ptn_state) || row?.ptn_state,
        petition_state: timeline.length > 0 ? timeline : buildTimelineFromRow(row),
      };
    });
    return {
      data: {
        data: normalizedData,
        recordsTotal: count || 0,
        recordsFiltered: count || 0,
      },
      error,
    };
  },

  async getPetition(id: number | string) {
    const { data, error } = await supabase
      .from('petitions')
      .select(
        '*, users!user_id(user_id, user_name, user_name2, user_surname, user_surname2, user_identification, user_model_category), studios_models(stdmod_id, studios(std_name)), petition_state:petition_states(ptnstate_state, ptnstate_observation, created_at, users!petition_states_user_id_fkey(user_name, user_name2, user_surname, user_surname2))'
      )
      .eq('ptn_id', id)
      .single();

    const normalizedRow = data
      ? {
          ...data,
          ptn_state: normalizePetitionState(data?.ptn_state) || data?.ptn_state,
          petition_state:
            normalizeTimeline(data?.petition_state || data?.petition_states).length > 0
              ? normalizeTimeline(data?.petition_state || data?.petition_states)
              : buildTimelineFromRow(data),
        }
      : null;

    return { data: { data: normalizedRow ? [normalizedRow] : [] }, error };
  },

  async addPetition(payload: CreatePetitionPayload) {
    const { ptnstate_observation, ...rest } = payload;
    const { data, error } = await supabase
      .from('petitions')
      .insert([
        {
          ...rest,
          ptn_state: 'EN PROCESO',
          ptn_observation: ptnstate_observation,
          ptn_page: Array.isArray(payload.ptn_page) ? payload.ptn_page.join(',') : payload.ptn_page,
        },
      ])
      .select()
      .single();

    if (error || !data) {
      return { data: { data, status: 'Error' }, error };
    }

    const { error: stateError } = await supabase.from('petition_states').insert([
      {
        ptn_id: data.ptn_id,
        user_id: getCurrentUserId(),
        ptnstate_state: 'EN PROCESO',
        ptnstate_observation: ptnstate_observation || null,
      },
    ]);

    return { data: { data, status: stateError ? 'Error' : 'Success' }, error: stateError || error };
  },

  async addPetitionState(payload: CreatePetitionStatePayload) {
    const { ptn_id, ptnstate_state, ...rest } = payload;
    const { data, error } = await supabase
      .from('petitions')
      .update({
        ptn_state: ptnstate_state,
        ptn_observation: rest.ptnstate_observation,
        ptn_nick_final: rest.ptn_nick_final,
        ptn_mail: rest.ptn_mail,
        ptn_password_final: rest.ptn_password_final,
        ptn_payment_pseudonym: rest.ptn_payment_pseudonym,
        ptn_linkacc: rest.ptn_linkacc,
        updated_at: new Date().toISOString(),
      })
      .eq('ptn_id', ptn_id)
      .select()
      .single();

    if (error) {
      return { data: { data, status: 'Error' }, error };
    }

    const { error: stateError } = await supabase.from('petition_states').insert([
      {
        ptn_id,
        user_id: getCurrentUserId(),
        ptnstate_state,
        ptnstate_observation: rest.ptnstate_observation || null,
      },
    ]);

    return { data: { data, status: stateError ? 'Error' : 'Success' }, error: stateError };
  },

  async deletePetition(id: number | string) {
    const { error } = await supabase.from('petitions').delete().eq('ptn_id', id);
    return { data: { status: error ? 'Error' : 'Success' }, error };
  },

  async getAccountCreations(userId: number | string) {
    const { data, error } = await supabase
      .from('petitions')
      .select('ptn_page')
      .eq('user_id', userId)
      .in('ptn_state', ['EN PROCESO', 'PENDIENTE', 'PENDING', 'IN PROCESS', 'IN_PROGRESS'])
      .in('ptn_type', ['CREACIÓN DE CUENTA', 'CREACION DE CUENTA', 'ACCOUNT_CREATION']);

    const pages = (data || []).flatMap((row) =>
      String(row?.ptn_page || '')
        .split(',')
        .map((page) => page.trim())
        .filter(Boolean)
    );

    const uniquePages = Array.from(new Set(pages));

    return { data: { data: uniquePages }, error };
  },

  async checkModelStudio(userId: number | string) {
    const { data, error } = await supabase
      .from('studios_models')
      .select('stdmod_id')
      .eq('user_id_model', userId);

    if (error) {
      return { data: { status: 'fail', data: [] }, error };
    }

    return { data: { status: (data || []).length > 0 ? 'success' : 'fail', data: data || [] } };
  },

  async getStudiosModelsByModel(userId: number | string) {
    const { data, error } = await supabase
      .from('studios_models')
      .select('*, studios(std_name)')
      .eq('user_id_model', userId);

    return { data: { data: data || [] }, error };
  },

  async getPreviousObservations(search: string) {
    const { data, error } = await supabase
      .from('petition_states')
      .select('ptnstate_observation')
      .ilike('ptnstate_observation', `%${search}%`)
      .limit(10);

    const observations = Array.from(
      new Set(
        (data || [])
          .map((row: any) => row?.ptnstate_observation)
          .filter((value: string) => Boolean(value))
      )
    );

    return { data: { data: observations }, error };
  },
};

export default PetitionService;
