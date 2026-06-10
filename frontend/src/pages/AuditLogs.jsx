import { useState, useEffect } from 'react';
import Header from '../components/Header';
import DataTable from '../components/DataTable';
import api from '../api/axios';
import { formatDateTime } from '../utils/formatters';
import toast from 'react-hot-toast';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ entity_type: '', action: '' });

  async function loadLogs() {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (filter.entity_type) params.entity_type = filter.entity_type;
      if (filter.action) params.action = filter.action;
      const res = await api.get('/audit-logs', { params });
      setLogs(res.data);
    } catch { toast.error('Failed to load audit logs'); }
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadLogs(); }, [filter]);

  const columns = [
    { key: 'timestamp', label: 'Time', render: r => formatDateTime(r.timestamp) },
    { key: 'username', label: 'User', accessor: 'username' },
    { key: 'action', label: 'Action', render: r => (
      <span className={`badge ${r.action === 'DELETE' || r.action === 'CANCEL' ? 'badge-danger' : r.action === 'CREATE' ? 'badge-success' : r.action === 'RETURN' ? 'badge-warning' : 'badge-info'}`}>{r.action}</span>
    )},
    { key: 'entity_type', label: 'Entity', render: r => <span style={{ textTransform: 'capitalize' }}>{r.entity_type}</span> },
    { key: 'entity_id', label: 'ID', accessor: 'entity_id' },
    { key: 'details', label: 'Changes', render: r => {
      try {
        const oldV = r.old_values ? JSON.parse(r.old_values) : null;
        const newV = r.new_values ? JSON.parse(r.new_values) : null;
        const parts = [];
        if (oldV) parts.push(`Old: ${Object.entries(oldV).map(([k, v]) => `${k}=${v}`).join(', ')}`);
        if (newV) parts.push(`New: ${Object.entries(newV).map(([k, v]) => `${k}=${v}`).join(', ')}`);
        return <span style={{ fontSize: 12, color: 'var(--color-text-muted)', maxWidth: 300, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{parts.join(' → ') || '-'}</span>;
      } catch { return '-'; }
    }},
  ];

  return (
    <>
      <Header title="Audit Logs" />
      <div style={{ padding: 28, flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <select className="form-select" value={filter.entity_type} onChange={e => setFilter(f => ({ ...f, entity_type: e.target.value }))} style={{ maxWidth: 160 }}>
            <option value="">All Entities</option>
            {['product', 'sale', 'customer', 'inventory', 'settings'].map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>)}
          </select>
          <select className="form-select" value={filter.action} onChange={e => setFilter(f => ({ ...f, action: e.target.value }))} style={{ maxWidth: 160 }}>
            <option value="">All Actions</option>
            {['CREATE', 'UPDATE', 'DELETE', 'CANCEL', 'RETURN'].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <DataTable columns={columns} data={logs} loading={loading} searchable={false} emptyMessage="No audit logs yet" />
        </div>
      </div>
    </>
  );
}
