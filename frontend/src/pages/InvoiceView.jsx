import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import api from '../api/axios';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { numberToWords } from '../utils/formatters';
import { Download, Printer, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InvoiceView() {
  const { saleId } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [saleRes, settingsRes] = await Promise.all([
          api.get(`/sales/${saleId}`),
          api.get('/settings'),
        ]);
        setSale(saleRes.data);
        setSettings(settingsRes.data);
      } catch {
        toast.error('Failed to load invoice');
        navigate('/sales');
      }
      setLoading(false);
    }
    loadData();
  }, [saleId, navigate]);

  async function downloadPdf() {
    try {
      const res = await api.get(`/invoices/${saleId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice_${sale.invoice_number}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch {
      toast.error('PDF download failed');
    }
  }

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <>
        <Header title="Invoice" />
        <div style={{ padding: 28 }}>
          <div className="skeleton" style={{ height: 600, width: '100%' }} />
        </div>
      </>
    );
  }

  if (!sale) return null;

  const hasIGST = sale.igst > 0;
  const items = sale.items || [];

  return (
    <>
      <Header title={`Invoice ${sale.invoice_number}`} />
      <div style={{ padding: 28, flex: 1, overflowY: 'auto' }}>
        {/* Action Bar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Back
          </button>
          <div style={{ flex: 1 }} />
          <button className="btn btn-secondary btn-sm print-hide" onClick={handlePrint}>
            <Printer size={16} /> Print
          </button>
          <button className="btn btn-primary btn-sm print-hide" onClick={downloadPdf}>
            <Download size={16} /> Download PDF
          </button>
        </div>

        {/* Invoice Content */}
        <div
          id="invoice-content"
          style={{
            maxWidth: 800,
            margin: '0 auto',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '28px 32px 20px',
            textAlign: 'center',
            borderBottom: '2px solid var(--color-primary)',
          }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 4 }}>
              {settings?.shop_name || 'Retail Store'}
            </h2>
            {settings?.shop_address && (
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                {settings.shop_address}
              </p>
            )}
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              {[
                settings?.shop_phone && `Phone: ${settings.shop_phone}`,
                settings?.shop_email && `Email: ${settings.shop_email}`,
              ].filter(Boolean).join(' | ')}
            </p>
            {settings?.shop_gstin && (
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                GSTIN: {settings.shop_gstin}
              </p>
            )}
          </div>

          {/* Tax Invoice Banner */}
          <div style={{
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))',
            color: 'white',
            padding: '8px 0',
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            Tax Invoice
          </div>

          {/* Invoice Meta + Customer Info */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20,
            padding: '20px 32px',
            borderBottom: '1px solid var(--color-border)',
          }}>
            <div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>Invoice No:</span>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text-primary)' }}>{sale.invoice_number}</div>
              </div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>Date:</span>
                <div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>{formatDateTime(sale.created_at)}</div>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>Payment Method:</span>
                <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>{sale.payment_method}</div>
              </div>
            </div>
            <div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>Customer:</span>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--color-text-primary)' }}>{sale.customer_name || 'Walk-in Customer'}</div>
              </div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>Status:</span>
                <div>
                  <span className={`badge badge-${sale.status === 'completed' ? 'success' : sale.status === 'returned' ? 'warning' : 'danger'}`}>
                    {sale.status}
                  </span>
                  {' '}
                  <span className={`badge badge-${sale.payment_status === 'paid' ? 'success' : sale.payment_status === 'partial' ? 'warning' : 'danger'}`}>
                    {sale.payment_status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Product Table */}
          <div style={{ padding: '0 32px' }}>
            <table className="data-table" style={{ marginTop: 16 }}>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Item</th>
                  <th>HSN</th>
                  <th style={{ textAlign: 'right' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Rate</th>
                  <th style={{ textAlign: 'right' }}>Disc</th>
                  <th style={{ textAlign: 'right' }}>GST%</th>
                  {hasIGST ? (
                    <th style={{ textAlign: 'right' }}>IGST</th>
                  ) : (
                    <>
                      <th style={{ textAlign: 'right' }}>CGST</th>
                      <th style={{ textAlign: 'right' }}>SGST</th>
                    </>
                  )}
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td>{idx + 1}</td>
                    <td style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{item.product_name}</td>
                    <td>{item.hsn_code || '-'}</td>
                    <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.unit_price)}</td>
                    <td style={{ textAlign: 'right' }}>{item.discount > 0 ? formatCurrency(item.discount) : '-'}</td>
                    <td style={{ textAlign: 'right' }}>{item.gst_percentage}%</td>
                    {hasIGST ? (
                      <td style={{ textAlign: 'right' }}>{formatCurrency(item.igst)}</td>
                    ) : (
                      <>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(item.cgst)}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(item.sgst)}</td>
                      </>
                    )}
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-text-primary)' }}>{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div style={{ padding: '20px 32px', display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ minWidth: 280 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14, color: 'var(--color-text-secondary)' }}>
                <span>Subtotal</span>
                <span>{formatCurrency(sale.subtotal)}</span>
              </div>
              {sale.discount_amount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14, color: 'var(--color-warning)' }}>
                  <span>Discount</span>
                  <span>-{formatCurrency(sale.discount_amount)}</span>
                </div>
              )}
              {hasIGST ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14, color: 'var(--color-text-secondary)' }}>
                  <span>IGST</span>
                  <span>{formatCurrency(sale.igst)}</span>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14, color: 'var(--color-text-secondary)' }}>
                    <span>CGST</span>
                    <span>{formatCurrency(sale.cgst)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14, color: 'var(--color-text-secondary)' }}>
                    <span>SGST</span>
                    <span>{formatCurrency(sale.sgst)}</span>
                  </div>
                </>
              )}
              <div style={{
                height: 2,
                background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary-light))',
                margin: '8px 0',
                borderRadius: 2,
              }} />
              <div style={{
                display: 'flex', justifyContent: 'space-between', padding: '8px 0',
                fontSize: 20, fontWeight: 800, color: 'var(--color-text-primary)',
              }}>
                <span>Grand Total</span>
                <span className="text-gradient">{formatCurrency(sale.total_amount)}</span>
              </div>
              {sale.payment_method === 'credit' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 14, color: 'var(--color-success)' }}>
                    <span>Amount Paid</span>
                    <span>{formatCurrency(sale.amount_paid)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 14, fontWeight: 700, color: 'var(--color-danger)' }}>
                    <span>Amount Due</span>
                    <span>{formatCurrency(sale.amount_due)}</span>
                  </div>
                  {sale.due_date && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
                      <span>Due Date</span>
                      <span>{sale.due_date}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Amount in Words */}
          <div style={{
            padding: '12px 32px',
            borderTop: '1px solid var(--color-border)',
            fontSize: 13,
            color: 'var(--color-text-muted)',
          }}>
            <strong>Amount in words:</strong> {numberToWords(sale.total_amount)}
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            padding: '20px 32px 28px',
            borderTop: '1px solid var(--color-border)',
          }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              <p>Terms: Goods once sold will not be taken back.</p>
              <p>All disputes subject to local jurisdiction.</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 160, borderBottom: '1px solid var(--color-border)', marginBottom: 6 }} />
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Authorized Signature</span>
            </div>
          </div>

          {/* Thank You */}
          <div style={{
            textAlign: 'center',
            padding: '16px 32px',
            background: 'rgba(79, 70, 229, 0.05)',
            borderTop: '1px solid var(--color-border)',
            color: 'var(--color-primary)',
            fontWeight: 600,
            fontSize: 14,
          }}>
            Thank you for your business!
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .print-hide { display: none !important; }
          body { background: white; color: #1e293b; }
          #invoice-content {
            border: none !important;
            box-shadow: none !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </>
  );
}
