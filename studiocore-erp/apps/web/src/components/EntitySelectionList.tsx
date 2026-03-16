import type { ReactNode } from 'react';
import { RefreshCcw, Search } from 'lucide-react';
import { ActionButton, EmptyState, InlineMessage, SectionHeading } from '@studiocore/ui';

type EntitySelectionListProps<T> = {
  eyebrow?: string;
  title: string;
  description: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  items: T[];
  selectedId: string | number | null;
  getId: (item: T) => string | number;
  renderTitle: (item: T) => ReactNode;
  renderDescription: (item: T) => ReactNode;
  renderMeta?: (item: T) => ReactNode;
  emptyTitle: string;
  emptyDescription: string;
  loading: boolean;
  error?: string | null;
  onRefresh: () => void;
  onSelect: (item: T) => void;
  action?: ReactNode;
};

export function EntitySelectionList<T>({
  eyebrow,
  title,
  description,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  items,
  selectedId,
  getId,
  renderTitle,
  renderDescription,
  renderMeta,
  emptyTitle,
  emptyDescription,
  loading,
  error,
  onRefresh,
  onSelect,
  action,
}: EntitySelectionListProps<T>) {
  return (
    <div className="entity-list-shell">
      <SectionHeading eyebrow={eyebrow} title={title} description={description} actions={action} />

      <div className="entity-list-toolbar">
        <label className="input-with-icon entity-search">
          <Search size={16} />
          <input value={searchValue} onChange={(event) => onSearchChange(event.target.value)} placeholder={searchPlaceholder} />
        </label>
        <ActionButton variant="secondary" className="small-button" onClick={onRefresh}>
          <RefreshCcw size={16} className={loading ? 'spin' : ''} />
          Recargar
        </ActionButton>
      </div>

      {error ? <InlineMessage tone="error">{error}</InlineMessage> : null}

      {loading ? (
        <div className="table-skeleton">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="skeleton-line" />
          ))}
        </div>
      ) : items.length ? (
        <div className="entity-card-list">
          {items.map((item) => {
            const id = getId(item);
            const isSelected = selectedId === id;

            return (
              <button
                key={String(id)}
                type="button"
                className={`entity-card ${isSelected ? 'is-selected' : ''}`}
                onClick={() => onSelect(item)}
              >
                <div className="entity-card__header">{renderTitle(item)}</div>
                <div className="entity-card__body">{renderDescription(item)}</div>
                {renderMeta ? <div className="entity-card__meta">{renderMeta(item)}</div> : null}
              </button>
            );
          })}
        </div>
      ) : (
        <EmptyState title={emptyTitle} description={emptyDescription} compact />
      )}
    </div>
  );
}
