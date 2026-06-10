import { useState, useEffect } from 'react';
import Header from '../components/Header';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';

export default function Settings() {
  const [form, setForm] = useState({ shop_name: '', shop_address: '', shop_phone: '', shop_email: '', shop_gstin: '', shop_state: '', invoice_prefix: 'INV' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadSettings() {
    try {
      const res = await api.get('/settings');
      setForm(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadSettings(); }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings', form);
      toast.success('Settings saved!');
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
    setSaving(false);
  }

  if (loading) return <><Header title="Settings" /><div style={{ padding: 28 }}><div className="skeleton" style={{ height: 400, width: '100%' }} /></div></>;

  return (
    <>
      <Header title="Settings" />
      <div style={{ padding: 28, flex: 1, overflowY: 'auto' }}>
        <div className="glass-card" style={{ maxWidth: 700, padding: 28 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: 'var(--color-text-primary)' }}>Shop Information</h3>
          <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Shop Name</label>
              <input className="form-input" value={form.shop_name} onChange={e => setForm(f => ({ ...f, shop_name: e.target.value }))} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Address</label>
              <textarea className="form-input" value={form.shop_address} onChange={e => setForm(f => ({ ...f, shop_address: e.target.value }))} rows={2} />
            </div>
            <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.shop_phone} onChange={e => setForm(f => ({ ...f, shop_phone: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={form.shop_email} onChange={e => setForm(f => ({ ...f, shop_email: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">GSTIN</label><input className="form-input" value={form.shop_gstin} onChange={e => setForm(f => ({ ...f, shop_gstin: e.target.value }))} placeholder="22AAAAA0000A1Z5" /></div>
            <div className="form-group"><label className="form-label">State</label><input className="form-input" value={form.shop_state} onChange={e => setForm(f => ({ ...f, shop_state: e.target.value }))} placeholder="e.g. Maharashtra" /></div>
            <div className="form-group"><label className="form-label">Invoice Prefix</label><input className="form-input" value={form.invoice_prefix} onChange={e => setForm(f => ({ ...f, invoice_prefix: e.target.value }))} /></div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}><Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
