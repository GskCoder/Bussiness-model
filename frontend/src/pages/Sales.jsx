import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { Eye, Download, RotateCcw, XCircle, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Sales() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', payment_status: '' });
  const [detailModal, setDetailModal] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  async function loadSales() {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (filter.status) params.status = filter.status;
      if (filter.payment_status) params.payment_status = filter.payment_status;
      const res = await api.get('/sales', { params });
      setSales(res.data.sales || []);
    } catch { toast.error('Failed to load sales'); }
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadSales(); }, [filter]);

  async function downloadPdf(sale) {
    try {
      const res = await api.get(`/invoices/${sale.id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url; link.download = `invoice_${sale.invoice_number}.pdf`; link.click();
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch { toast.error('PDF download failed'); }
  }

  async function handleReturn(sale) {
    if (!confirm(`Return sale ${sale.invoice_number}? Stock will be restored.`)) return;
    try { await api.post(`/sales/${sale.id}/return`); toast.success('Sale returned'); loadSales(); }
    catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
  }

  async function handleCancel(sale) {
    if (!confirm(`Cancel sale ${sale.invoice_number}? Stock will be restored.`)) return;
    try { await api.post(`/sales/${sale.id}/cancel`); toast.success('Sale cancelled'); loadSales(); }
    catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
  }

  async function handleRecordPayment() {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) { toast.error('Enter valid amount'); return; }
    try {
      await api.post(`/sales/${paymentModal.id}/payment`, { amount: parseFloat(paymentAmount) });
      toast.success('Payment recorded');
      setPaymentModal(null); setPaymentAmount(''); loadSales();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
  }

  const statusBadge = (status) => {
    const map = { completed: 'success', returned: 'warning', cancelled: 'danger' };
    return <span className={`badge badge-${map[status] || 'neutral'}`}>{status}</span>;
  };

  const paymentBadge = (status) => {
    const map = { paid: 'success', partial: 'warning', unpaid: 'danger' };
    return <span className={`badge badge-${map[status] || 'neutral'}`}>{status}</span>;
  };

  const columns = [
    { key: 'invoice_number', label: 'Invoice #', accessor: 'invoice_number' },
    { key: 'sale_date', label: 'Date', render: r => formatDateTime(r.created_at) },
    { key: 'customer', label: 'Customer', render: r => r.customer_name || 'Walk-in' },
    { key: 'total_amount', label: 'Amount', render: r => <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>{formatCurrency(r.total_amount)}</span> },
    { key: 'payment_method', label: 'Payment', render: r => <span style={{ textTransform: 'uppercase', fontSize: 12, fontWeight: 500 }}>{r.payment_method}</span> },
    { key: 'payment_status', label: 'Pay Status', render: r => paymentBadge(r.payment_status) },
    { key: 'status', label: 'Status', render: r => statusBadge(r.status) },
  ];

  return (
    <>
      <Header title="Sales" />
      <div style={{ padding: 28, flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <select className="form-select" value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))} style={{ maxWidth: 160 }}>
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="returned">Returned</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select className="form-select" value={filter.payment_status} onChange={e => setFilter(f => ({ ...f, payment_status: e.target.value }))} style={{ maxWidth: 160 }}>
            <option value="">All Payments</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>

        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <DataTable columns={columns} data={sales} loading={loading} searchable={false}
            actions={row => (
              <>
                <button className="btn btn-ghost btn-icon btn-sm" title="View" onClick={e => { e.stopPropagation(); navigate(`/invoices/${row.id}`); }}><Eye size={14} /></button>
                <button className="btn btn-ghost btn-icon btn-sm" title="Download PDF" onClick={e => { e.stopPropagation(); downloadPdf(row); }}><Download size={14} /></button>
                {row.payment_status !== 'paid' && row.status === 'completed' && (
                  <button className="btn btn-ghost btn-icon btn-sm" title="Record Payment" onClick={e => { e.stopPropagation(); setPaymentModal(row); setPaymentAmount(''); }} style={{ color: 'var(--color-info)' }}><CreditCard size={14} /></button>
                )}
                {isAdmin && row.status === 'completed' && (
                  <>
                    <button className="btn btn-ghost btn-icon btn-sm" title="Return" onClick={e => { e.stopPropagation(); handleReturn(row); }} style={{ color: 'var(--color-warning)' }}><RotateCcw size={14} /></button>
                    <button className="btn btn-ghost btn-icon btn-sm" title="Cancel" onClick={e => { e.stopPropagation(); handleCancel(row); }} style={{ color: 'var(--color-danger)' }}><XCircle size={14} /></button>
                  </>
                )}
              </>
            )}
          />
        </div>
      </div>

      {/* Sale Detail Modal */}
      <Modal isOpen={!!detailModal} onClose={() => setDetailModal(null)} title={`Sale ${detailModal?.invoice_number}`} size="lg">
        {detailModal && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div><span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>Customer</span><div style={{ fontWeight: 600 }}>{detailModal.customer_name || 'Walk-in'}</div></div>
              <div><span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>Date</span><div>{formatDateTime(detailModal.created_at)}</div></div>
              <div><span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>Payment</span><div style={{ textTransform: 'uppercase' }}>{detailModal.payment_method}</div></div>
              <div><span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>Status</span><div>{statusBadge(detailModal.status)} {paymentBadge(detailModal.payment_status)}</div></div>
            </div>
            <table className="data-table" style={{ marginBottom: 16 }}>
              <thead><tr><th>Item</th><th>HSN</th><th>Qty</th><th>Rate</th><th>GST%</th><th>Total</th></tr></thead>
              <tbody>
                {(detailModal.items || []).map((item, i) => (
                  <tr key={i}><td>{item.product_name}</td><td>{item.hsn_code}</td><td>{item.quantity}</td><td>{formatCurrency(item.unit_price)}</td><td>{item.gst_percentage}%</td><td>{formatCurrency(item.total)}</td></tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Subtotal: {formatCurrency(detailModal.subtotal)}</div>
              {detailModal.cgst > 0 && <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>CGST: {formatCurrency(detailModal.cgst)}</div>}
              {detailModal.sgst > 0 && <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>SGST: {formatCurrency(detailModal.sgst)}</div>}
              {detailModal.igst > 0 && <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>IGST: {formatCurrency(detailModal.igst)}</div>}
              {detailModal.discount_amount > 0 && <div style={{ fontSize: 13, color: 'var(--color-warning)' }}>Discount: -{formatCurrency(detailModal.discount_amount)}</div>}
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text-primary)' }}>Total: {formatCurrency(detailModal.total_amount)}</div>
              {detailModal.amount_due > 0 && <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-danger)' }}>Due: {formatCurrency(detailModal.amount_due)}</div>}
            </div>
          </div>
        )}
      </Modal>

      {/* Record Payment Modal */}
      <Modal isOpen={!!paymentModal} onClose={() => setPaymentModal(null)} title="Record Payment" size="sm"
        footer={<button className="btn btn-primary" onClick={handleRecordPayment}>Record Payment</button>}>
        {paymentModal && (
          <div>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 12 }}>
              Invoice: <strong>{paymentModal.invoice_number}</strong><br />
              Total: <strong>{formatCurrency(paymentModal.total_amount)}</strong> | Paid: <strong>{formatCurrency(paymentModal.amount_paid)}</strong> | Due: <strong style={{ color: 'var(--color-danger)' }}>{formatCurrency(paymentModal.amount_due)}</strong>
            </p>
            <div className="form-group">
              <label className="form-label">Payment Amount (₹)</label>
              <input className="form-input" type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} autoFocus placeholder={`Max: ${paymentModal.amount_due}`} />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
