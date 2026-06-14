import { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Save, Download, Upload, FileJson, FileSpreadsheet, FileText, AlertTriangle, Loader2, Database, HardDrive } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { isAdmin } = useAuth();
  const [form, setForm] = useState({ shop_name: '', shop_address: '', shop_phone: '', shop_email: '', shop_gstin: '', shop_state: '', invoice_prefix: 'INV' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(null);
  const [importing, setImporting] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

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

  // ---- Backup/Export ----
  async function handleExport(format) {
    setExporting(format);
    try {
      let url = '';
      let filename = '';
      let mimeType = '';

      const today = new Date().toISOString().split('T')[0];

      if (format === 'json') {
        url = '/backup/export/json';
        filename = `retailerp_backup_${today}.json`;
        mimeType = 'application/json';
      } else if (format === 'excel') {
        url = '/backup/export/excel';
        filename = `retailerp_backup_${today}.xlsx`;
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else if (format === 'csv') {
        // Export all tables as separate CSV downloads
        const tables = ['products', 'customers', 'sales', 'suppliers', 'purchases', 'expenses'];
        for (const table of tables) {
          try {
            const res = await api.get(`/backup/export/csv/${table}`, { responseType: 'blob' });
            const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `${table}_${today}.csv`;
            a.click();
            window.URL.revokeObjectURL(blobUrl);
          } catch { /* some tables might not exist */ }
        }
        toast.success('CSV files downloaded!');
        setExporting(null);
        return;
      }

      const res = await api.get(url, { responseType: 'blob' });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: mimeType }));
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      toast.success(`${format.toUpperCase()} backup downloaded!`);
    } catch (err) {
      toast.error(`Export failed: ${err.response?.data?.detail || err.message}`);
    }
    setExporting(null);
  }

  // ---- Restore/Import ----
  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) {
      toast.error('Only .json backup files are supported for restore');
      return;
    }
    setSelectedFile(file);
    setShowRestoreConfirm(true);
  }

  async function handleRestore() {
    if (!selectedFile) return;
    setImporting(true);
    setShowRestoreConfirm(false);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await api.post('/backup/import/json', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.error) {
        toast.error(res.data.error);
      } else {
        toast.success(`Data restored! ${res.data.records_imported || ''} records imported.`);
        loadSettings();
      }
    } catch (err) {
      toast.error(`Restore failed: ${err.response?.data?.detail || err.message}`);
    }
    setImporting(false);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  if (loading) return <><Header title="Settings" /><div style={{ padding: 28 }}><div className="skeleton" style={{ height: 400, width: '100%' }} /></div></>;

  return (
    <>
      <Header title="Settings" />
      <div style={{ padding: 28, flex: 1, overflowY: 'auto' }}>

        {/* Shop Information */}
        <div className="glass-card" style={{ maxWidth: 700, padding: 28, marginBottom: 24 }}>
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

        {/* Backup & Restore */}
        {isAdmin && (
          <div className="glass-card animate-fade-in" style={{ maxWidth: 700, padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <Database size={18} style={{ color: 'var(--color-primary-light)' }} />
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>Backup & Restore</h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 24 }}>
              Export your data for safekeeping or restore from a previous backup.
            </p>

            {/* Export Section */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Download size={14} /> Export Data
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleExport('json')}
                  disabled={!!exporting}
                  style={{
                    flexDirection: 'column', gap: 8, padding: '18px 12px',
                    height: 'auto', fontSize: 13,
                  }}
                >
                  {exporting === 'json' ? <Loader2 size={22} className="animate-spin" /> : <FileJson size={22} style={{ color: 'var(--color-info)' }} />}
                  <span>JSON Backup</span>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 400 }}>Full database</span>
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={() => handleExport('excel')}
                  disabled={!!exporting}
                  style={{
                    flexDirection: 'column', gap: 8, padding: '18px 12px',
                    height: 'auto', fontSize: 13,
                  }}
                >
                  {exporting === 'excel' ? <Loader2 size={22} className="animate-spin" /> : <FileSpreadsheet size={22} style={{ color: 'var(--color-success)' }} />}
                  <span>Excel Export</span>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 400 }}>Multi-sheet workbook</span>
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={() => handleExport('csv')}
                  disabled={!!exporting}
                  style={{
                    flexDirection: 'column', gap: 8, padding: '18px 12px',
                    height: 'auto', fontSize: 13,
                  }}
                >
                  {exporting === 'csv' ? <Loader2 size={22} className="animate-spin" /> : <FileText size={22} style={{ color: 'var(--color-warning)' }} />}
                  <span>CSV Export</span>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 400 }}>Per-table files</span>
                </button>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--color-border)', margin: '0 0 24px' }} />

            {/* Import Section */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Upload size={14} /> Restore Data
              </div>

              <div
                onClick={() => !importing && fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '28px 20px',
                  textAlign: 'center',
                  cursor: importing ? 'not-allowed' : 'pointer',
                  transition: 'var(--transition)',
                  background: 'rgba(255,255,255,0.01)',
                }}
                onMouseEnter={e => {
                  if (!importing) {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                    e.currentTarget.style.background = 'rgba(79,70,229,0.03)';
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.01)';
                }}
              >
                {importing ? (
                  <>
                    <Loader2 size={24} style={{ margin: '0 auto 8px', color: 'var(--color-primary-light)' }} className="animate-spin" />
                    <div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Restoring data...</div>
                  </>
                ) : (
                  <>
                    <HardDrive size={24} style={{ margin: '0 auto 8px', color: 'var(--color-text-muted)' }} />
                    <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                      Click to select a JSON backup file
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      Only .json backup files exported from RetailERP are supported
                    </div>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        )}

        {/* Restore Confirmation Dialog */}
        {showRestoreConfirm && (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            }}
            onClick={() => { setShowRestoreConfirm(false); setSelectedFile(null); }}
          >
            <div
              className="animate-scale-in"
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 440,
                background: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: 28, margin: 20,
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'var(--color-warning-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <AlertTriangle size={20} style={{ color: 'var(--color-warning)' }} />
                </div>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>Confirm Restore</h4>
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>This action may overwrite existing data</p>
                </div>
              </div>

              <div style={{
                padding: '12px 14px', background: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                marginBottom: 20, fontSize: 13, color: 'var(--color-text-secondary)',
              }}>
                <strong>File:</strong> {selectedFile?.name}<br />
                <strong>Size:</strong> {(selectedFile?.size / 1024).toFixed(1)} KB
              </div>

              <div style={{
                padding: '10px 14px', borderRadius: 'var(--radius-md)',
                background: 'var(--color-warning-bg)', marginBottom: 20,
                fontSize: 12, color: 'var(--color-warning)',
              }}>
                ⚠️ This will import data from the backup file. Duplicate entries will be merged. Make sure this is a valid RetailERP backup.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button className="btn btn-secondary" onClick={() => { setShowRestoreConfirm(false); setSelectedFile(null); }}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={handleRestore}>
                  <Upload size={16} /> Restore Now
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
