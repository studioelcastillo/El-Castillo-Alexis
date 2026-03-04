import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit2,
  Eye,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  X,
  XCircle
} from 'lucide-react';
import PetitionService, { PetitionStateValue, PetitionTypeValue } from '../PetitionService';
import UserService from '../UserService';
import { studioService } from '../api';

interface RequestsPageProps {
  onNavigate?: (id: string) => void;
}

interface SessionUser {
  user_id: number;
  prof_id?: number;
  profile?: {
    prof_id?: number;
  };
}

interface PetitionStateRow {
  ptnstate_state: PetitionStateValue;
  ptnstate_observation?: string;
  created_at?: string;
  user?: {
    user_name?: string;
    user_name2?: string;
    user_surname?: string;
    user_surname2?: string;
  };
}

interface PetitionRow {
  ptn_id: number;
  ptn_consecutive?: string;
  ptn_type?: string;
  ptn_nick?: string;
  ptn_nick_final?: string;
  ptn_page?: string;
  created_at?: string;
  updated_at?: string;
  user?: {
    user_id?: number;
    user_name?: string;
    user_name2?: string;
    user_surname?: string;
    user_surname2?: string;
  };
  petition_state?: PetitionStateRow[];
}

interface StudioOption {
  value: number | string;
  label: string;
}

interface ModelOption {
  value: number | string;
  label: string;
}

interface ContractOption {
  value: number | string;
  label: string;
}

interface PetitionModalProps {
  mode: 'create' | 'show' | 'edit';
  petitionId?: number;
  user: SessionUser | null;
  permissions: {
    canCreateAny: boolean;
    canCreateOwn: boolean;
    canShow: boolean;
    canEdit: boolean;
  };
  onClose: () => void;
  onSaved: () => void;
}

const GATES: Record<string, number[]> = {
  petitions: [1, 2, 4, 5, 6, 13],
  'create-petition-own': [5],
  'create-petitions': [1, 2, 6, 13],
  'show-petitions': [1, 2, 4, 5, 6, 13],
  'edit-petitions': [1, 6, 13]
};

const STATUS_LABELS: Record<PetitionStateValue, string> = {
  'EN PROCESO': 'ABIERTO',
  PENDIENTE: 'EN PROCESO',
  APROBADA: 'APROBADA',
  RECHAZADA: 'RECHAZADA'
};

const STATUS_STYLES: Record<PetitionStateValue, string> = {
  'EN PROCESO': 'bg-amber-50 text-amber-700 border-amber-100',
  PENDIENTE: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  APROBADA: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  RECHAZADA: 'bg-red-50 text-red-700 border-red-100'
};

const REQUEST_TYPES: PetitionTypeValue[] = ['CREACI\u00d3N DE CUENTA', 'REPORTE'];

const PAGE_GROUPS = [
  {
    title: 'Paginas privadas',
    pages: ['LIVEJASMIN', 'STREAMATE', 'IMLIVE', 'FLIRT4FREE', 'SKYPRIVATE', 'XLOVECAM', 'STREAMRAY', 'ADULTWORK', 'SAKURALIVE', 'DESIRECAST']
  },
  {
    title: 'Paginas de tokens',
    pages: ['CHATURBATE', 'CHATURBATE(2)', 'BONGACAMS', 'CAM4', 'CAMSODA', 'CAMSODA ALIADOS', 'MYDIRTYHOBBY', 'STRIPCHAT', 'CHERRY', 'DREAMCAM']
  },
  {
    title: 'Paginas de contenido',
    pages: ['ONLYFANS', 'ONLYFANS_VIP', 'F2F', 'FANSLY', 'FANCENTRO', 'XHAMSTER', 'SWIPEY.AI', 'CHARMS', 'PORNHUB', 'SEXCOM', 'LOYALFANS', 'LOVERFANS', 'MANYVIDS']
  },
  {
    title: 'Redes sociales',
    pages: ['MYLINKDROP', 'INSTAGRAM', 'X', 'TIKTOK', 'TELEGRAM', 'REDDIT', 'LOVENSE', 'AMAZON', 'TWITCH', 'DISCORD']
  }
];

const PAGE_OPTIONS = PAGE_GROUPS.flatMap((group) => group.pages);

const SORT_MAP: Record<string, string> = {
  ptn_consecutive: 'ptn_consecutive',
  ptn_type: 'ptn_type',
  user: 'updated_at',
  state: 'updated_at',
  ptn_nick_final: 'ptn_nick_final',
  ptn_page: 'ptn_page',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

const getSessionUser = (): SessionUser | null => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

const getProfileId = (user: SessionUser | null): number => {
  if (!user) return 0;
  const profileId = user.prof_id ?? user.profile?.prof_id ?? 0;
  return Number(profileId || 0);
};

const hasGate = (gate: keyof typeof GATES, profileId: number): boolean => {
  return GATES[gate]?.includes(profileId) || false;
};

const fullName = (user?: PetitionRow['user'] | PetitionStateRow['user']): string => {
  if (!user) return '---';
  return [user.user_name, user.user_name2, user.user_surname, user.user_surname2].filter(Boolean).join(' ') || '---';
};

const getCurrentState = (row: PetitionRow): PetitionStateValue | null => {
  const last = row.petition_state?.[row.petition_state.length - 1];
  return (last?.ptnstate_state as PetitionStateValue) || null;
};

const formatDateTime = (value?: string): string => {
  if (!value) return '---';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getErrorMessage = (err: any, fallback: string): string => {
  return err?.response?.data?.message || err?.response?.data?.error?.message || fallback;
};

const PetitionModal: React.FC<PetitionModalProps> = ({
  mode,
  petitionId,
  user,
  permissions,
  onClose,
  onSaved
}) => {
  const [localMode, setLocalMode] = useState<'create' | 'show' | 'edit'>(mode);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [detail, setDetail] = useState<any | null>(null);
  const [timeline, setTimeline] = useState<PetitionStateRow[]>([]);
  const [additionalModels, setAdditionalModels] = useState<any[]>([]);

  const [requestType, setRequestType] = useState<PetitionTypeValue>('CREACI\u00d3N DE CUENTA');
  const [nick, setNick] = useState('');
  const [password, setPassword] = useState('');
  const [observation, setObservation] = useState('');
  const [singlePage, setSinglePage] = useState('');
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [pageError, setPageError] = useState<string | null>(null);
  const [pendingPetitionsCount, setPendingPetitionsCount] = useState(0);
  const [notAllowedPages, setNotAllowedPages] = useState<string[]>([]);

  const [modelSearch, setModelSearch] = useState('');
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelOption | null>(null);

  const [contracts, setContracts] = useState<ContractOption[]>([]);
  const [selectedContract, setSelectedContract] = useState<ContractOption | null>(null);
  const [modelStudioNotFound, setModelStudioNotFound] = useState(false);

  const [stateForm, setStateForm] = useState({
    ptn_nick_final: '',
    ptn_mail: '',
    ptn_password_final: '',
    ptn_payment_pseudonym: '',
    ptnstate_observation: '',
    ptn_linkacc: ''
  });
  const [previousObservations, setPreviousObservations] = useState<string[]>([]);

  const isCreate = localMode === 'create';
  const showStateManager = permissions.canEdit && localMode === 'edit';
  const currentState = timeline[timeline.length - 1]?.ptnstate_state;
  const maxPagesAllowed = Math.max(0, 4 - pendingPetitionsCount);

  useEffect(() => {
    setLocalMode(mode);
    setError(null);
  }, [mode, petitionId]);

  const loadContracts = useCallback(async (userId: number | string) => {
    const response = await PetitionService.getStudiosModelsByModel(userId);
    const data = response.data?.data || [];
    const mapped = data.map((contract: any) => {
      if (contract?.value !== undefined && contract?.label) {
        return { value: contract.value, label: contract.label };
      }
      const value = contract?.stdmod_id ?? contract?.id;
      const stdName = contract?.studio?.std_name || contract?.std_name || '';
      return {
        value,
        label: `${value} ${stdName}`.trim()
      };
    });
    setContracts(mapped);
    setSelectedContract(mapped[0] || null);
  }, []);

  const loadPendingPetitions = useCallback(async (userId: number | string) => {
    const response = await PetitionService.getAccountCreations(userId);
    const pending = response.data?.data || [];
    setPendingPetitionsCount(pending.length);
    setNotAllowedPages(pending);
    setSelectedPages([]);
  }, []);

  const loadDetail = useCallback(async () => {
    if (!petitionId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await PetitionService.getPetition(petitionId);
      const petition = response.data?.data?.[0];
      if (!petition) {
        setError('No se encontro la solicitud.');
        return;
      }

      setDetail(petition);
      setTimeline(petition.petition_state || []);
      setAdditionalModels(petition?.user?.additional_models || []);

      setStateForm({
        ptn_nick_final: petition.ptn_nick_final || '',
        ptn_mail: petition.ptn_mail || '',
        ptn_password_final: petition.ptn_password_final || '',
        ptn_payment_pseudonym: petition.ptn_payment_pseudonym || '',
        ptnstate_observation: '',
        ptn_linkacc: petition.ptn_linkacc || ''
      });
    } catch (err: any) {
      setError(getErrorMessage(err, 'No se pudo cargar la solicitud.'));
    } finally {
      setLoading(false);
    }
  }, [petitionId]);

  useEffect(() => {
    if (!isCreate) {
      loadDetail();
      return;
    }

    const currentUserId = user?.user_id;
    if (!currentUserId) return;

    if (permissions.canCreateOwn && !permissions.canCreateAny) {
      PetitionService.checkModelStudio(currentUserId)
        .then((res) => {
          setModelStudioNotFound(res.data?.status === 'fail');
        })
        .catch(() => {
          setModelStudioNotFound(false);
        });

      loadContracts(currentUserId).catch(() => {
        setContracts([]);
        setSelectedContract(null);
      });
      loadPendingPetitions(currentUserId).catch(() => {
        setPendingPetitionsCount(0);
        setNotAllowedPages([]);
      });
    }
  }, [isCreate, user?.user_id, permissions.canCreateOwn, permissions.canCreateAny, loadContracts, loadPendingPetitions, loadDetail]);

  const searchModels = useCallback(
    async (rawTerm: string) => {
      if (!isCreate || !permissions.canCreateAny) return;
      const term = rawTerm.trim();
      if (term.length < 3) {
        setModelOptions([]);
        return;
      }

      setModelsLoading(true);
      try {
        const response = await UserService.getModelsByOwnerStudio({
          search: term,
          profIds: [4, 5]
        });
        const data = response.data?.data || [];
        const mapped = data.map((model: any) => {
          if (model?.value !== undefined && model?.label) {
            return { value: model.value, label: model.label };
          }
          const label = [model?.user_name, model?.user_name2, model?.user_surname, model?.user_surname2].filter(Boolean).join(' ');
          return {
            value: model?.user_id ?? model?.id,
            label: `${label} (${model?.user_identification || 'sin documento'})`
          };
        });
        setModelOptions(mapped);
      } catch {
        setModelOptions([]);
      } finally {
        setModelsLoading(false);
      }
    },
    [isCreate, permissions.canCreateAny, user?.user_id]
  );

  useEffect(() => {
    if (!showStateManager) return;
    const search = stateForm.ptnstate_observation.trim();
    if (!search) {
      setPreviousObservations([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        const response = await PetitionService.getPreviousObservations(search);
        setPreviousObservations(response.data?.data || []);
      } catch {
        setPreviousObservations([]);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [showStateManager, stateForm.ptnstate_observation]);

  const handleModelSelect = async (model: ModelOption) => {
    setSelectedModel(model);
    setModelSearch(model.label);
    setModelOptions([]);
    try {
      await Promise.all([loadContracts(model.value), loadPendingPetitions(model.value)]);
    } catch {
      setContracts([]);
      setSelectedContract(null);
      setPendingPetitionsCount(0);
      setNotAllowedPages([]);
    }
  };

  const togglePage = (page: string) => {
    setPageError(null);
    setSelectedPages((prev) => {
      if (prev.includes(page)) {
        return prev.filter((item) => item !== page);
      }
      if (prev.length >= maxPagesAllowed) {
        setPageError(`Maximo ${maxPagesAllowed} paginas disponibles para esta modelo.`);
        return prev;
      }
      return [...prev, page];
    });
  };

  const handleCreate = async () => {
    setError(null);

    if (modelStudioNotFound) {
      setError('No hay contrato activo para generar esta solicitud.');
      return;
    }
    if (!requestType) {
      setError('Selecciona el tipo de solicitud.');
      return;
    }
    if (!nick.trim() || !password.trim()) {
      setError('Nick y clave son obligatorios.');
      return;
    }
    if (!selectedContract?.value) {
      setError('Selecciona un contrato.');
      return;
    }

    const canCreateForOthers = permissions.canCreateAny;
    const targetUserId = canCreateForOthers ? selectedModel?.value : user?.user_id;
    if (!targetUserId) {
      setError('Selecciona una modelo.');
      return;
    }

    if (requestType === 'REPORTE' && !singlePage) {
      setError('Selecciona una pagina para el reporte.');
      return;
    }
    if (requestType === 'CREACI\u00d3N DE CUENTA' && selectedPages.length === 0) {
      setError('Debes seleccionar al menos una pagina.');
      return;
    }

    const pages = requestType === 'REPORTE' ? [singlePage] : selectedPages;

    setSaving(true);
    try {
      await PetitionService.addPetition({
        ptn_type: requestType,
        ptn_nick: nick.trim(),
        ptn_password: password.trim(),
        ptn_page: pages,
        user_id: targetUserId,
        stdmod_id: selectedContract.value,
        ptnstate_observation: observation.trim()
      });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(getErrorMessage(err, 'No se pudo crear la solicitud.'));
    } finally {
      setSaving(false);
    }
  };

  const handleStateTransition = async (action: 'approve' | 'reject') => {
    if (!detail) return;
    setError(null);

    let targetState: PetitionStateValue | null = null;
    if (action === 'reject') {
      targetState = 'RECHAZADA';
    } else if (currentState === 'EN PROCESO') {
      targetState = 'PENDIENTE';
    } else if (currentState === 'PENDIENTE') {
      targetState = 'APROBADA';
    }

    if (!targetState) {
      setError('La solicitud ya no tiene una transición disponible.');
      return;
    }

    if (
      action === 'approve' &&
      (!stateForm.ptn_nick_final.trim() ||
        !stateForm.ptn_mail.trim() ||
        !stateForm.ptn_password_final.trim() ||
        !stateForm.ptn_payment_pseudonym.trim())
    ) {
      setError('Completa nick, correo, clave y seudonimo de pago para avanzar.');
      return;
    }

    if (detail?.ptn_page === 'XLOVECAM' && !stateForm.ptn_linkacc.trim() && action === 'approve') {
      setError('El link de cuenta es obligatorio para XLOVECAM.');
      return;
    }

    setSaving(true);
    try {
      await PetitionService.addPetitionState({
        ptn_id: detail.ptn_id,
        ptnstate_state: targetState,
        ptnstate_observation: stateForm.ptnstate_observation,
        ptn_nick_final: stateForm.ptn_nick_final,
        ptn_mail: stateForm.ptn_mail,
        ptn_password_final: stateForm.ptn_password_final,
        ptn_payment_pseudonym: stateForm.ptn_payment_pseudonym,
        ptn_linkacc: stateForm.ptn_linkacc
      });

      setStateForm((prev) => ({ ...prev, ptnstate_observation: '' }));
      onSaved();
      await loadDetail();
      setLocalMode('show');
    } catch (err: any) {
      setError(getErrorMessage(err, 'No se pudo actualizar el estado.'));
    } finally {
      setSaving(false);
    }
  };

  const headerTitle =
    localMode === 'create'
      ? 'Nueva solicitud'
      : localMode === 'edit'
      ? 'Gestionar solicitud'
      : 'Detalle solicitud';

  const statusLabel = currentState ? STATUS_LABELS[currentState] : '---';

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-6xl bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900">{headerTitle}</h2>
            {!isCreate && (
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
                #{detail?.ptn_consecutive || detail?.ptn_id || petitionId} · {statusLabel}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500">
            <X size={18} />
          </button>
        </div>

        {(error || loading) && (
          <div className="px-6 pt-4">
            {loading && (
              <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-600 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Cargando solicitud...
              </div>
            )}
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {isCreate && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Datos de la solicitud</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tipo</label>
                      <select
                        value={requestType}
                        onChange={(e) => {
                          setRequestType(e.target.value as PetitionTypeValue);
                          setSelectedPages([]);
                          setSinglePage('');
                          setPageError(null);
                        }}
                        className="mt-1 w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-amber-400"
                      >
                        {REQUEST_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Contrato</label>
                      <select
                        value={selectedContract?.value ?? ''}
                        onChange={(e) => {
                          const selected = contracts.find((contract) => String(contract.value) === e.target.value) || null;
                          setSelectedContract(selected);
                        }}
                        className="mt-1 w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-amber-400"
                      >
                        <option value="">Selecciona contrato</option>
                        {contracts.map((contract) => (
                          <option key={contract.value} value={contract.value}>
                            {contract.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {permissions.canCreateAny && (
                    <div className="relative">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Modelo</label>
                      <input
                        value={modelSearch}
                        onChange={(e) => {
                          const value = e.target.value;
                          setModelSearch(value);
                          setSelectedModel(null);
                          searchModels(value);
                        }}
                        onFocus={() => searchModels(modelSearch)}
                        placeholder="Buscar modelo (min 3 caracteres)"
                        className="mt-1 w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-amber-400"
                      />
                      {modelsLoading && <Loader2 size={14} className="absolute right-3 top-[38px] animate-spin text-slate-400" />}
                      {modelOptions.length > 0 && (
                        <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-52 overflow-y-auto">
                          {modelOptions.map((model) => (
                            <button
                              key={model.value}
                              onClick={() => handleModelSelect(model)}
                              className="w-full text-left px-3 py-2.5 text-sm text-slate-700 hover:bg-amber-50 border-b border-slate-50 last:border-0"
                            >
                              {model.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nick</label>
                      <input
                        value={nick}
                        onChange={(e) => setNick(e.target.value)}
                        className="mt-1 w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Clave</label>
                      <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Observacion</label>
                    <textarea
                      value={observation}
                      onChange={(e) => setObservation(e.target.value)}
                      rows={3}
                      className="mt-1 w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {requestType === 'REPORTE' && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-4">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pagina</label>
                    <select
                      value={singlePage}
                      onChange={(e) => setSinglePage(e.target.value)}
                      className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-amber-400"
                    >
                      <option value="">Selecciona una pagina</option>
                      {PAGE_OPTIONS.map((page) => (
                        <option key={page} value={page}>
                          {page}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {requestType === 'CREACI\u00d3N DE CUENTA' && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Paginas</h4>
                      <span className="text-xs font-bold text-slate-500">
                        En curso: {pendingPetitionsCount} / 4 · Max nuevo: {maxPagesAllowed}
                      </span>
                    </div>
                    {pageError && (
                      <div className="px-3 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-semibold">{pageError}</div>
                    )}
                    <div className="space-y-4">
                      {PAGE_GROUPS.map((group) => (
                        <div key={group.title}>
                          <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">{group.title}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {group.pages
                              .filter((page) => !notAllowedPages.includes(page))
                              .map((page) => (
                                <label
                                  key={page}
                                  className={`px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                                    selectedPages.includes(page)
                                      ? 'bg-amber-50 border-amber-200 text-amber-700'
                                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-amber-200'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedPages.includes(page)}
                                    onChange={() => togglePage(page)}
                                    className="mr-2"
                                  />
                                  {page}
                                </label>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="bg-slate-900 text-amber-400 rounded-2xl p-4 border border-slate-800">
                  <h4 className="text-sm font-black uppercase tracking-wider">Resumen</h4>
                  <div className="mt-3 space-y-2 text-xs font-semibold">
                    <p>Tipo: <span className="text-white">{requestType}</span></p>
                    <p>Modelo: <span className="text-white">{selectedModel?.label || (permissions.canCreateOwn ? `ID ${user?.user_id || '---'}` : 'No seleccionada')}</span></p>
                    <p>Contrato: <span className="text-white">{selectedContract?.label || 'No seleccionado'}</span></p>
                    <p>Paginas: <span className="text-white">{requestType === 'REPORTE' ? singlePage || 'No seleccionada' : selectedPages.length}</span></p>
                  </div>
                </div>

                {modelStudioNotFound && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800 text-sm font-semibold">
                    No se encontro ningun estudio con contrato activo para esta modelo.
                  </div>
                )}

                <button
                  onClick={handleCreate}
                  disabled={saving || modelStudioNotFound}
                  className="w-full px-4 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-[#0B1120] rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {saving ? 'Guardando...' : 'Crear solicitud'}
                </button>
              </div>
            </div>
          )}

          {!isCreate && detail && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-3">Datos solicitud</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2.5">
                      <p className="text-[11px] uppercase text-slate-400 font-bold">Tipo</p>
                      <p className="font-bold text-slate-700">{detail.ptn_type || '---'}</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2.5">
                      <p className="text-[11px] uppercase text-slate-400 font-bold">Pagina</p>
                      <p className="font-bold text-slate-700">{detail.ptn_page || '---'}</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2.5">
                      <p className="text-[11px] uppercase text-slate-400 font-bold">Nick sugerido</p>
                      <p className="font-bold text-slate-700">{detail.ptn_nick || '---'}</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2.5">
                      <p className="text-[11px] uppercase text-slate-400 font-bold">Clave sugerida</p>
                      <p className="font-bold text-slate-700">{detail.ptn_password || '---'}</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 md:col-span-2">
                      <p className="text-[11px] uppercase text-slate-400 font-bold">Solicitante</p>
                      <p className="font-bold text-slate-700">{fullName(detail.user)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-3">Modelo</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                      <p className="text-[11px] uppercase text-slate-400 font-bold">Nombre</p>
                      <p className="font-bold text-slate-700">{fullName(detail.user)}</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                      <p className="text-[11px] uppercase text-slate-400 font-bold">Documento</p>
                      <p className="font-bold text-slate-700">{detail?.user?.user_identification || '---'}</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                      <p className="text-[11px] uppercase text-slate-400 font-bold">Categoria</p>
                      <p className="font-bold text-slate-700">{detail?.user?.user_model_category || '---'}</p>
                    </div>
                  </div>

                  {additionalModels.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Compañeros asociados</p>
                      <div className="space-y-2">
                        {additionalModels.map((item, index) => (
                          <div key={index} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-700">
                            {item?.usraddmod_name || 'Sin nombre'} · {item?.usraddmod_identification || 'sin documento'} · {item?.usraddmod_birthdate || 'sin fecha'}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-4">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-3">Estados</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {timeline.map((item, index) => {
                      const style = STATUS_STYLES[item.ptnstate_state] || 'bg-slate-50 text-slate-700 border-slate-200';
                      return (
                        <div key={`${item.ptnstate_state}-${index}`} className={`border rounded-xl px-3 py-2 ${style}`}>
                          <p className="text-[11px] font-black uppercase tracking-wider">{STATUS_LABELS[item.ptnstate_state]}</p>
                          <p className="text-xs mt-1">{item.ptnstate_observation || 'Sin observacion'}</p>
                          <p className="text-[10px] mt-1 opacity-80">{fullName(item.user)} · {formatDateTime(item.created_at)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {permissions.canEdit && localMode === 'show' && currentState && !['APROBADA', 'RECHAZADA'].includes(currentState) && (
                  <button
                    onClick={() => setLocalMode('edit')}
                    className="w-full px-4 py-3 bg-slate-900 hover:bg-black text-amber-400 rounded-xl text-xs font-black uppercase tracking-widest"
                  >
                    Gestionar solicitud
                  </button>
                )}

                {showStateManager && currentState && !['APROBADA', 'RECHAZADA'].includes(currentState) && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Siguiente estado</h4>

                    <input
                      value={stateForm.ptn_nick_final}
                      onChange={(e) => setStateForm((prev) => ({ ...prev, ptn_nick_final: e.target.value }))}
                      placeholder="Nick final"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-amber-400"
                    />
                    <input
                      value={stateForm.ptn_mail}
                      onChange={(e) => setStateForm((prev) => ({ ...prev, ptn_mail: e.target.value }))}
                      placeholder="Correo"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-amber-400"
                    />
                    <input
                      value={stateForm.ptn_password_final}
                      onChange={(e) => setStateForm((prev) => ({ ...prev, ptn_password_final: e.target.value }))}
                      placeholder="Clave final"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-amber-400"
                    />
                    <input
                      value={stateForm.ptn_payment_pseudonym}
                      onChange={(e) => setStateForm((prev) => ({ ...prev, ptn_payment_pseudonym: e.target.value }))}
                      placeholder="Seudonimo de pago"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-amber-400"
                    />
                    {detail?.ptn_page === 'XLOVECAM' && (
                      <input
                        value={stateForm.ptn_linkacc}
                        onChange={(e) => setStateForm((prev) => ({ ...prev, ptn_linkacc: e.target.value }))}
                        placeholder="Link de cuenta"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-amber-400"
                      />
                    )}
                    <textarea
                      value={stateForm.ptnstate_observation}
                      onChange={(e) => setStateForm((prev) => ({ ...prev, ptnstate_observation: e.target.value }))}
                      placeholder="Observacion"
                      rows={3}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-amber-400"
                    />

                    {previousObservations.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {previousObservations.map((item, index) => (
                          <button
                            key={index}
                            onClick={() => setStateForm((prev) => ({ ...prev, ptnstate_observation: item }))}
                            className="px-2.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-bold"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleStateTransition('approve')}
                        disabled={saving}
                        className="px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider disabled:opacity-60"
                      >
                        {saving ? 'Guardando...' : currentState === 'EN PROCESO' ? 'Procesar' : 'Aprobar'}
                      </button>
                      <button
                        onClick={() => handleStateTransition('reject')}
                        disabled={saving}
                        className="px-3 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider disabled:opacity-60"
                      >
                        Rechazar
                      </button>
                    </div>

                    <button
                      onClick={() => setLocalMode('show')}
                      className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-wider"
                    >
                      Cancelar gestion
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const RequestsPage: React.FC<RequestsPageProps> = ({ onNavigate }) => {
  const [sessionUser] = useState<SessionUser | null>(() => getSessionUser());
  const profileId = getProfileId(sessionUser);

  const permissions = useMemo(
    () => ({
      canAccess: hasGate('petitions', profileId),
      canCreateAny: hasGate('create-petitions', profileId),
      canCreateOwn: hasGate('create-petition-own', profileId),
      canShow: hasGate('show-petitions', profileId),
      canEdit: hasGate('edit-petitions', profileId)
    }),
    [profileId]
  );

  const [rows, setRows] = useState<PetitionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statesFilter, setStatesFilter] = useState<PetitionStateValue[]>(['EN PROCESO', 'PENDIENTE']);
  const [studiosFilter, setStudiosFilter] = useState<string[]>([]);
  const [studioOptions, setStudioOptions] = useState<StudioOption[]>([]);

  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(20);
  const [totalRows, setTotalRows] = useState(0);
  const [sortBy, setSortBy] = useState('updated_at');
  const [descending, setDescending] = useState(true);

  const [modal, setModal] = useState<{
    open: boolean;
    mode: 'create' | 'show' | 'edit';
    petitionId?: number;
  }>({
    open: false,
    mode: 'create'
  });

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!permissions.canEdit) return;
    studioService
      .getAll()
      .then((response) => {
        const data = response.data?.data || [];
        setStudioOptions(
          data.map((item: any) => ({
            value: item.std_id,
            label: item.std_name
          }))
        );
      })
      .catch(() => setStudioOptions([]));
  }, [permissions.canEdit]);

  const loadData = useCallback(async () => {
    if (!permissions.canAccess) return;

    setLoading(true);
    setError(null);

    try {
      const response = await PetitionService.getPetitions({
        start: (page - 1) * rowsPerPage,
        length: rowsPerPage,
        sortBy: `petitions.${SORT_MAP[sortBy] || 'updated_at'}`,
        dir: descending ? 'DESC' : 'ASC',
        filter: debouncedSearch,
        states: statesFilter,
        studios: studiosFilter,
        userId: !permissions.canEdit ? sessionUser?.user_id : undefined
      });

      setRows(response.data?.data || []);
      setTotalRows(response.data?.recordsTotal || response.data?.recordsFiltered || 0);
    } catch (err: any) {
      setError(getErrorMessage(err, 'No se pudo cargar solicitudes.'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [
    permissions.canAccess,
    permissions.canEdit,
    page,
    rowsPerPage,
    sortBy,
    descending,
    debouncedSearch,
    statesFilter,
    studiosFilter,
    sessionUser?.user_id
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleState = (state: PetitionStateValue) => {
    setPage(1);
    setStatesFilter((prev) => {
      if (prev.includes(state)) return prev.filter((item) => item !== state);
      return [...prev, state];
    });
  };

  const toggleSort = (column: string) => {
    setPage(1);
    if (sortBy === column) {
      setDescending((prev) => !prev);
      return;
    }
    setSortBy(column);
    setDescending(false);
  };

  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));

  const handleDelete = async (row: PetitionRow) => {
    if (!window.confirm(`¿Eliminar la solicitud #${row.ptn_consecutive || row.ptn_id}?`)) return;

    try {
      await PetitionService.deletePetition(row.ptn_id);
      await loadData();
    } catch (err: any) {
      setError(getErrorMessage(err, 'No fue posible eliminar la solicitud.'));
    }
  };

  if (!permissions.canAccess) {
    return (
      <div className="p-8">
        <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-xl p-8 text-center">
          <XCircle size={36} className="mx-auto text-red-500" />
          <h2 className="mt-3 text-xl font-black text-slate-900">Sin acceso a solicitudes</h2>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            Este usuario no tiene permisos para ingresar al modulo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Solicitudes</h1>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 text-[10px] font-bold uppercase tracking-widest">
              {totalRows} Registros
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 font-medium">Migrado desde legacy: listado, gestion de estados y creacion de solicitudes.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadData}
            className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-xl transition-all"
            title="Recargar"
          >
            <Loader2 size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => onNavigate?.('fotografia')}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest"
          >
            <Camera size={14} />
            Ver fotografia
          </button>
          {(permissions.canCreateAny || permissions.canCreateOwn) && (
            <button
              onClick={() => setModal({ open: true, mode: 'create' })}
              className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-[#0B1120] rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-amber-500/20"
            >
              <Plus size={14} />
              Nueva solicitud
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm space-y-2">
        <div className="flex flex-col xl:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Buscar por usuario, nick o consecutivo..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border-transparent rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-amber-500/5 focus:border-amber-400 transition-all font-medium"
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl gap-1 overflow-x-auto no-scrollbar">
            {(['EN PROCESO', 'PENDIENTE', 'APROBADA', 'RECHAZADA'] as PetitionStateValue[]).map((state) => (
              <button
                key={state}
                onClick={() => toggleState(state)}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold tracking-widest transition-all whitespace-nowrap ${
                  statesFilter.includes(state) ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {STATUS_LABELS[state]}
              </button>
            ))}
          </div>

          {permissions.canEdit && (
            <div className="relative min-w-[220px]">
              <select
                value={studiosFilter[0] || ''}
                onChange={(e) => {
                  setPage(1);
                  setStudiosFilter(e.target.value ? [e.target.value] : []);
                }}
                className="w-full appearance-none bg-white border border-slate-100 rounded-xl px-4 py-2.5 pr-8 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all outline-none"
              >
                <option value="">Todos los estudios</option>
                {studioOptions.map((studio) => (
                  <option key={studio.value} value={studio.value}>
                    {studio.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th onClick={() => toggleSort('ptn_consecutive')} className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer">Cns.</th>
                <th onClick={() => toggleSort('ptn_type')} className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer">Tipo</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuario</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                <th onClick={() => toggleSort('ptn_nick_final')} className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer">Nick</th>
                <th onClick={() => toggleSort('ptn_page')} className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer">Pagina</th>
                <th onClick={() => toggleSort('created_at')} className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer">Creada</th>
                <th onClick={() => toggleSort('updated_at')} className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer">Actualizada</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={9} className="px-6 py-4">
                      <div className="h-12 bg-slate-50 rounded-xl" />
                    </td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-14 text-center">
                    <AlertCircle size={28} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-500">No hay solicitudes para los filtros actuales.</p>
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const state = getCurrentState(row);
                  const stateStyle = state ? STATUS_STYLES[state] : 'bg-slate-50 text-slate-600 border-slate-200';
                  const stateLabel = state ? STATUS_LABELS[state] : 'Sin estado';
                  return (
                    <tr key={row.ptn_id} className="hover:bg-slate-50/40 transition-all group">
                      <td className="px-6 py-4 text-xs font-black text-slate-400">#{row.ptn_consecutive || row.ptn_id}</td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-800">{row.ptn_type || '---'}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700">{fullName(row.user)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${stateStyle}`}>
                          {state === 'APROBADA' && <CheckCircle2 size={12} />}
                          {state === 'RECHAZADA' && <XCircle size={12} />}
                          {state === 'EN PROCESO' && <Clock3 size={12} />}
                          {state === 'PENDIENTE' && <AlertCircle size={12} />}
                          {stateLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-700">{row.ptn_nick_final || row.ptn_nick || '---'}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-600">{row.ptn_page || '---'}</td>
                      <td className="px-6 py-4 text-xs text-slate-600">{formatDateTime(row.created_at)}</td>
                      <td className="px-6 py-4 text-xs text-slate-600">{formatDateTime(row.updated_at)}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          {permissions.canShow && (
                            <button
                              onClick={() => setModal({ open: true, mode: 'show', petitionId: row.ptn_id })}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Ver"
                            >
                              <Eye size={16} />
                            </button>
                          )}
                          {permissions.canEdit && (
                            <button
                              onClick={() => setModal({ open: true, mode: 'edit', petitionId: row.ptn_id })}
                              className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                              title="Gestionar"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                          {permissions.canEdit && (
                            <button
                              onClick={() => handleDelete(row)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-500">
            Pagina {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {modal.open && (
        <PetitionModal
          mode={modal.mode}
          petitionId={modal.petitionId}
          user={sessionUser}
          permissions={permissions}
          onClose={() => setModal({ open: false, mode: 'create' })}
          onSaved={() => {
            loadData();
          }}
        />
      )}
    </div>
  );
};

export default RequestsPage;
