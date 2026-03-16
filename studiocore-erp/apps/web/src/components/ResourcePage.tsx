import { useState, type ReactNode } from 'react';
import type { PaginatedResponse } from '@studiocore/contracts';
import { useQuery } from '@tanstack/react-query';
import { RefreshCcw, Search } from 'lucide-react';
import { ApiError } from '../lib/api';
import { pluralize } from '../lib/format';
import { useApiClient } from '../lib/auth';

export type ResourceColumn<T> = {
  key: string;
  header: string;
  cell: (item: T) => ReactNode;
};

type ResourcePageProps<T> = {
  eyebrow: string;
  title: string;
  description: string;
  queryKey: string[];
  buildPath: (search: string) => string;
  columns: Array<ResourceColumn<T>>;
  emptyTitle: string;
  emptyDescription: string;
  searchPlaceholder?: string | null;
  totalLabel?: { singular: string; plural: string };
};

export function ResourcePage<T>({
  eyebrow,
  title,
  description,
  queryKey,
  buildPath,
  columns,
  emptyTitle,
  emptyDescription,
  searchPlaceholder = 'Buscar...',
  totalLabel = { singular: 'registro', plural: 'registros' },
}: ResourcePageProps<T>) {
  const api = useApiClient();
  const [draftSearch, setDraftSearch] = useState('');
  const [search, setSearch] = useState('');

  const query = useQuery({
    queryKey: [...queryKey, search],
    queryFn: () => api.get<PaginatedResponse<T>>(buildPath(search)),
  });

  const items = query.data?.items ?? [];
  const errorMessage = query.error instanceof ApiError ? query.error.message : 'No fue posible cargar la vista.';

  return (
    <>
      <section className="page-hero panel fade-up">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </section>

      <section className="panel fade-up">
        <div className="toolbar-row">
          {searchPlaceholder ? (
            <form
              className="search-form"
              onSubmit={(event) => {
                event.preventDefault();
                setSearch(draftSearch.trim());
              }}
            >
              <label className="input-with-icon">
                <Search size={16} />
                <input
                  value={draftSearch}
                  onChange={(event) => setDraftSearch(event.target.value)}
                  placeholder={searchPlaceholder}
                />
              </label>
              <button type="submit" className="primary-button small-button">
                Filtrar
              </button>
            </form>
          ) : (
            <div />
          )}

          <div className="toolbar-actions">
            <div className="meta-pill">
              {pluralize(query.data?.total ?? 0, totalLabel.singular, totalLabel.plural)}
            </div>
            <button type="button" className="ghost-button small-button" onClick={() => void query.refetch()}>
              <RefreshCcw size={16} className={query.isFetching ? 'spin' : ''} />
              Recargar
            </button>
          </div>
        </div>

        {query.isError ? (
          <div className="inline-error">{errorMessage}</div>
        ) : query.isPending ? (
          <div className="table-skeleton">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="skeleton-line" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <h3>{emptyTitle}</h3>
            <p>{emptyDescription}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column.key}>{column.header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    {columns.map((column) => (
                      <td key={column.key}>{column.cell(item)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
