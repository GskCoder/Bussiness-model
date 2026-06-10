import { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function DataTable({
  columns, data, loading, onRowClick,
  searchable = true, searchPlaceholder = 'Search...',
  pageSize = 10, emptyMessage = 'No data found',
  actions,
}) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!search || !data) return data || [];
    const term = search.toLowerCase();
    return data.filter(row =>
      columns.some(col => {
        const val = col.accessor ? (typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor]) : '';
        return String(val || '').toLowerCase().includes(term);
      })
    );
  }, [data, search, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const col = columns.find(c => c.key === sortKey);
      const accessor = col?.accessor;
      const aVal = typeof accessor === 'function' ? accessor(a) : a[accessor || sortKey];
      const bVal = typeof accessor === 'function' ? accessor(b) : b[accessor || sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'number') return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      return sortDir === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
    });
  }, [filtered, sortKey, sortDir, columns]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 20 }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 44, width: '100%' }} />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Search bar */}
      {searchable && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border-light)' }}>
          <div style={{ position: 'relative', maxWidth: 320 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder={searchPlaceholder}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              style={{ paddingLeft: 36, fontSize: 13 }}
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  style={{ cursor: col.sortable !== false ? 'pointer' : 'default', whiteSpace: 'nowrap', ...(col.headerStyle || {}) }}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span style={{ marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              ))}
              {actions && <th style={{ width: 120, textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paged.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  onClick={() => onRowClick?.(row)}
                  style={{ cursor: onRowClick ? 'pointer' : 'default', animationDelay: `${idx * 30}ms` }}
                  className="animate-fade-in"
                >
                  {columns.map(col => (
                    <td key={col.key} style={col.cellStyle || {}}>
                      {col.render
                        ? col.render(row)
                        : typeof col.accessor === 'function'
                          ? col.accessor(row)
                          : row[col.accessor || col.key]
                      }
                    </td>
                  ))}
                  {actions && (
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        {actions(row)}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderTop: '1px solid var(--color-border-light)',
          fontSize: 13, color: 'var(--color-text-muted)',
        }}>
          <span>Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} of {sorted.length}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn-ghost btn-icon btn-sm" onClick={() => setPage(0)} disabled={page === 0}><ChevronsLeft size={14} /></button>
            <button className="btn-ghost btn-icon btn-sm" onClick={() => setPage(p => p - 1)} disabled={page === 0}><ChevronLeft size={14} /></button>
            <span style={{ padding: '4px 12px', fontSize: 13 }}>Page {page + 1} of {totalPages}</span>
            <button className="btn-ghost btn-icon btn-sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}><ChevronRight size={14} /></button>
            <button className="btn-ghost btn-icon btn-sm" onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}><ChevronsRight size={14} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
