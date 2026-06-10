import { useState, useEffect } from 'react';
import Header from '../components/Header';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import api from '../api/axios';
import { formatDateTime } from '../utils/formatters';
import { Plus, Power } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StaffManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'staff' });
  const [saving, setSaving] = useState(false);

  async function loadUsers() {
    setLoading(true);
    try { const res = await api.get('/auth/users'); setUsers(res.data); } catch { toast.error('Failed'); }
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadUsers(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) { toast.error('All fields required'); return; }
    setSaving(true);
    try { await api.post('/auth/staff', form); toast.success('Staff created'); setModalOpen(false); setForm({ username: '', email: '', password: '', role: 'staff' }); loadUsers(); }
    catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
    setSaving(false);
  }

  async function toggleUser(user) {
    try { await api.put(`/auth/users/${user.id}/toggle`); toast.success(`${user.is_active ? 'Deactivated' : 'Activated'} ${user.username}`); loadUsers(); }
    catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
  }

  const columns = [
    { key: 'username', label: 'Username', accessor: 'username' },
    { key: 'email', label: 'Email', accessor: 'email' },
    { key: 'role', label: 'Role', render: r => <span className={`badge ${r.role === 'admin' ? 'badge-info' : 'badge-neutral'}`} style={{ textTransform: 'capitalize' }}>{r.role}</span> },
    { key: 'is_active', label: 'Status', render: r => <span className={`badge ${r.is_active ? 'badge-success' : 'badge-danger'}`}>{r.is_active ? 'Active' : 'Inactive'}</span> },
    { key: 'created_at', label: 'Created', render: r => formatDateTime(r.created_at) },
  ];

  return (
    <>
      <Header title="Staff Management" />
      <div style={{ padding: 28, flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}><Plus size={16} /> Add Staff</button>
        </div>
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <DataTable columns={columns} data={users} loading={loading} searchable={false}
            actions={row => (
              <button className="btn btn-ghost btn-icon btn-sm" title={row.is_active ? 'Deactivate' : 'Activate'} onClick={e => { e.stopPropagation(); toggleUser(row); }} style={{ color: row.is_active ? 'var(--color-warning)' : 'var(--color-success)' }}><Power size={14} /></button>
            )}
          />
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Staff" size="sm"
        footer={<><button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn btn-primary" onClick={handleCreate} disabled={saving}>{saving ? 'Creating...' : 'Create'}</button></>}>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group"><label className="form-label">Username *</label><input className="form-input" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} autoFocus /></div>
          <div className="form-group"><label className="form-label">Email *</label><input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Password *</label><input className="form-input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Role</label>
            <select className="form-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="staff">Staff</option><option value="admin">Admin</option>
            </select>
          </div>
        </form>
      </Modal>
    </>
  );
}
