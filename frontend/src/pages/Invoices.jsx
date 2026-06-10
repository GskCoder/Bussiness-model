import Header from '../components/Header';
import DataTable from '../components/DataTable';
import { useState, useEffect } from 'react';
import api from '../api/axios';
import { formatDateTime } from '../utils/formatters';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadInvoices() {
    setLoading(true);
    try { const res = await api.get('/invoices'); setInvoices(res.data); } catch { toast.error('Failed'); }
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadInvoices(); }, []);

  async function downloadPdf(inv) {
    try {
      const res = await api.get(`/invoices/${inv.sale_id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a'); link.href = url; link.download = `invoice_${inv.invoice_number}.pdf`; link.click();
      window.URL.revokeObjectURL(url); toast.success('Downloaded');
    } catch { toast.error('Download failed'); }
  }

  const columns = [
    { key: 'invoice_number', label: 'Invoice #', accessor: 'invoice_number' },
    { key: 'sale_id', label: 'Sale ID', accessor: 'sale_id' },
    { key: 'generated_at', label: 'Generated', render: r => formatDateTime(r.generated_at) },
  ];

  return (
    <><Header title="Invoices" />
      <div style={{ padding: 28, flex: 1, overflowY: 'auto' }}>
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <DataTable columns={columns} data={invoices} loading={loading}
            actions={row => <button className="btn btn-ghost btn-icon btn-sm" onClick={e => { e.stopPropagation(); downloadPdf(row); }}><Download size={14} /></button>}
          />
        </div>
      </div>
    </>
  );
}
