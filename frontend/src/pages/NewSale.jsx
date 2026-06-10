import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Modal from '../components/Modal';
import api from '../api/axios';
import { formatCurrency } from '../utils/formatters';
import { calculateCartTotals } from '../utils/gstCalculator';
import { Search, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewSale() {
  const navigate = useNavigate();
  const searchRef = useRef(null);

  // Product search
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  // Cart
  const [cart, setCart] = useState([]);

  // Customer
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isWalkIn, setIsWalkIn] = useState(true);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ customer_name: '', phone_number: '', state: '' });

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [discount, setDiscount] = useState(0);

  // Shop settings
  const [shopState, setShopState] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadSettings() {
    try {
      const res = await api.get('/settings');
      setShopState((res.data.shop_state || '').toLowerCase());
    } catch { /* ignore */ }
  }

  async function searchProducts() {
    try {
      const res = await api.get('/products', { params: { search: productSearch, limit: 10 } });
      setSearchResults(res.data.products || []);
      setShowResults(true);
    } catch { /* ignore */ }
  }

  async function searchCustomers() {
    try {
      const res = await api.get('/customers', { params: { search: customerSearch, limit: 10 } });
      setCustomers(res.data.customers || []);
    } catch { /* ignore */ }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => {
    loadSettings();
    searchRef.current?.focus();
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (productSearch.length >= 1) searchProducts();
      else setSearchResults([]);
    }, 200);
    return () => clearTimeout(timer);
  }, [productSearch]);

  function addToCart(product) {
    const existing = cart.find(i => i.product_id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock_quantity) {
        toast.error(`Only ${product.stock_quantity} in stock`); return;
      }
      setCart(cart.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      if (product.stock_quantity <= 0) { toast.error('Out of stock'); return; }
      setCart([...cart, {
        product_id: product.id, product_name: product.product_name, hsn_code: product.hsn_code,
        selling_price: product.selling_price, purchase_price: product.purchase_price,
        gst_percentage: product.gst_percentage, stock_quantity: product.stock_quantity,
        quantity: 1, discount: 0,
      }]);
    }
    setProductSearch('');
    setShowResults(false);
    searchRef.current?.focus();
  }

  function updateCartItem(productId, field, value) {
    setCart(cart.map(i => {
      if (i.product_id !== productId) return i;
      const updated = { ...i, [field]: value };
      if (field === 'quantity' && value > i.stock_quantity) {
        toast.error(`Only ${i.stock_quantity} in stock`); return i;
      }
      if (field === 'quantity' && value < 1) return i;
      return updated;
    }));
  }

  function removeFromCart(productId) {
    setCart(cart.filter(i => i.product_id !== productId));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => {
    if (customerSearch.length >= 1) searchCustomers();
  }, [customerSearch]);

  // Calculate totals
  const isInterState = selectedCustomer
    ? (selectedCustomer.state || '').toLowerCase() !== shopState && (selectedCustomer.state || '').length > 0 && shopState.length > 0
    : false;

  const totals = calculateCartTotals(cart.map(i => ({
    selling_price: i.selling_price, quantity: i.quantity, discount: i.discount, gst_percentage: i.gst_percentage,
  })), isInterState, discount);

  // Submit sale
  async function handleSubmit() {
    if (cart.length === 0) { toast.error('Add items to cart'); return; }
    setSubmitting(true);
    try {
      const saleData = {
        customer_id: isWalkIn ? null : selectedCustomer?.id || null,
        items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity, discount: i.discount })),
        discount_amount: discount,
        payment_method: paymentMethod,
        amount_paid: paymentMethod === 'credit' ? parseFloat(amountPaid) || 0 : null,
        due_date: paymentMethod === 'credit' && dueDate ? dueDate : null,
      };
      const res = await api.post('/sales', saleData);
      toast.success(`Sale completed! ${res.data.invoice_number}`);

      // Download PDF
      try {
        const pdfRes = await api.get(`/invoices/${res.data.id}/pdf`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([pdfRes.data]));
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice_${res.data.invoice_number}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      } catch { console.log('PDF download skipped'); }

      navigate('/sales');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Sale failed');
    }
    setSubmitting(false);
  }

  async function handleCreateCustomer() {
    if (!newCustomer.customer_name) { toast.error('Name required'); return; }
    try {
      const res = await api.post('/customers', newCustomer);
      setSelectedCustomer(res.data);
      setIsWalkIn(false);
      setShowCustomerModal(false);
      setNewCustomer({ customer_name: '', phone_number: '', state: '' });
      toast.success('Customer created');
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
  }

  return (
    <>
      <Header title="New Sale" />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left - Product Search & Cart */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--color-border)' }}>
          {/* Search */}
          <div style={{ padding: 16, borderBottom: '1px solid var(--color-border)', position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                ref={searchRef}
                className="form-input"
                placeholder="Search product by name or barcode... (F2)"
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
                style={{ paddingLeft: 42, fontSize: 15 }}
              />
            </div>

            {/* Search results dropdown */}
            {showResults && searchResults.length > 0 && (
              <div style={{
                position: 'absolute', left: 16, right: 16, top: '100%', zIndex: 50,
                background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', maxHeight: 280, overflowY: 'auto',
              }}>
                {searchResults.map(p => (
                  <div
                    key={p.id}
                    onMouseDown={() => addToCart(p)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 16px', cursor: 'pointer', transition: 'var(--transition)',
                      borderBottom: '1px solid var(--color-border-light)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>{p.product_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{p.brand} {p.barcode ? `| ${p.barcode}` : ''} | GST {p.gst_percentage}%</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-success)' }}>{formatCurrency(p.selling_price)}</div>
                      <div style={{ fontSize: 11, color: p.stock_quantity > 0 ? 'var(--color-text-muted)' : 'var(--color-danger)' }}>
                        {p.stock_quantity > 0 ? `${p.stock_quantity} in stock` : 'Out of stock'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Items */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {cart.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)' }}>
                <ShoppingBag size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
                <p>Search and add products to start billing</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cart.map((item) => (
                  <div key={item.product_id} className="glass-card animate-fade-in" style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{item.product_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                          {formatCurrency(item.selling_price)} × {item.quantity} | GST {item.gst_percentage}%
                          {item.hsn_code ? ` | HSN: ${item.hsn_code}` : ''}
                        </div>
                      </div>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => removeFromCart(item.product_id)} style={{ color: 'var(--color-danger)' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                        <button onClick={() => updateCartItem(item.product_id, 'quantity', item.quantity - 1)} style={{ padding: '6px 10px', background: 'var(--color-surface)', border: 'none', color: 'var(--color-text-primary)', cursor: 'pointer' }}>
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={e => updateCartItem(item.product_id, 'quantity', parseInt(e.target.value) || 1)}
                          style={{ width: 50, textAlign: 'center', border: 'none', background: 'var(--color-surface-elevated)', color: 'var(--color-text-primary)', padding: '6px 4px', fontSize: 14, fontWeight: 600 }}
                        />
                        <button onClick={() => updateCartItem(item.product_id, 'quantity', item.quantity + 1)} style={{ padding: '6px 10px', background: 'var(--color-surface)', border: 'none', color: 'var(--color-text-primary)', cursor: 'pointer' }}>
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="form-group" style={{ flex: 1, gap: 2 }}>
                        <label style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Disc ₹</label>
                        <input className="form-input" type="number" step="0.01" value={item.discount || ''} onChange={e => updateCartItem(item.product_id, 'discount', parseFloat(e.target.value) || 0)} style={{ padding: '6px 10px', fontSize: 13 }} placeholder="0" />
                      </div>
                      <div style={{ textAlign: 'right', minWidth: 80 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                          {formatCurrency((item.selling_price * item.quantity - item.discount) * (1 + item.gst_percentage / 100))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right - Customer, Payment, Totals */}
        <div style={{ width: 380, display: 'flex', flexDirection: 'column', background: 'var(--color-surface)' }}>
          {/* Customer Section */}
          <div style={{ padding: 16, borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer</h4>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className={`btn btn-sm ${isWalkIn ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setIsWalkIn(true); setSelectedCustomer(null); }} style={{ padding: '4px 10px', fontSize: 12 }}>Walk-in</button>
                <button className={`btn btn-sm ${!isWalkIn ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setIsWalkIn(false)} style={{ padding: '4px 10px', fontSize: 12 }}>Select</button>
              </div>
            </div>

            {!isWalkIn && (
              <>
                {selectedCustomer ? (
                  <div style={{ padding: '10px 14px', background: 'var(--color-surface-elevated)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedCustomer.customer_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{selectedCustomer.phone_number || 'No phone'} {selectedCustomer.state ? `| ${selectedCustomer.state}` : ''}</div>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => setSelectedCustomer(null)}>Change</button>
                  </div>
                ) : (
                  <div>
                    <input className="form-input" placeholder="Search customer..." value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} style={{ fontSize: 13, marginBottom: 8 }} />
                    {customers.length > 0 && customerSearch && (
                      <div style={{ maxHeight: 120, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                        {customers.map(c => (
                          <div key={c.id} onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); }} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid var(--color-border-light)', transition: 'var(--transition)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            {c.customer_name} <span style={{ color: 'var(--color-text-muted)' }}>({c.phone_number || 'No phone'})</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowCustomerModal(true)} style={{ marginTop: 6, width: '100%' }}><Plus size={14} /> New Customer</button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Payment Method */}
          <div style={{ padding: 16, borderBottom: '1px solid var(--color-border)' }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Payment</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {['cash', 'upi', 'card', 'credit'].map(m => (
                <button key={m} className={`btn btn-sm ${paymentMethod === m ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPaymentMethod(m)} style={{ textTransform: 'capitalize' }}>
                  {m}
                </button>
              ))}
            </div>
            {paymentMethod === 'credit' && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="form-group" style={{ gap: 4 }}>
                  <label style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Amount Paid Now</label>
                  <input className="form-input" type="number" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} placeholder="0" style={{ fontSize: 13 }} />
                </div>
                <div className="form-group" style={{ gap: 4 }}>
                  <label style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Due Date</label>
                  <input className="form-input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ fontSize: 13 }} />
                </div>
              </div>
            )}
          </div>

          {/* Discount */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
            <div className="form-group" style={{ gap: 4 }}>
              <label style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Overall Discount (₹)</label>
              <input className="form-input" type="number" value={discount || ''} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} placeholder="0" style={{ fontSize: 13 }} />
            </div>
          </div>

          {/* Totals */}
          <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--color-text-secondary)' }}>
                <span>Subtotal</span><span>{formatCurrency(totals.subtotal)}</span>
              </div>
              {isInterState ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  <span>IGST</span><span>{formatCurrency(totals.igst)}</span>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--color-text-secondary)' }}>
                    <span>CGST</span><span>{formatCurrency(totals.cgst)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--color-text-secondary)' }}>
                    <span>SGST</span><span>{formatCurrency(totals.sgst)}</span>
                  </div>
                </>
              )}
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--color-warning)' }}>
                  <span>Discount</span><span>-{formatCurrency(discount)}</span>
                </div>
              )}
              <div style={{ height: 1, background: 'var(--color-border)', margin: '6px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 800, color: 'var(--color-text-primary)' }}>
                <span>Total</span><span className="text-gradient">{formatCurrency(totals.grandTotal)}</span>
              </div>
              {paymentMethod === 'credit' && amountPaid && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--color-danger)', fontWeight: 600 }}>
                  <span>Amount Due</span><span>{formatCurrency(totals.grandTotal - (parseFloat(amountPaid) || 0))}</span>
                </div>
              )}
            </div>

            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={cart.length === 0 || submitting}
              style={{ width: '100%', padding: 14, fontSize: 16, fontWeight: 700 }}
            >
              {submitting ? 'Processing...' : `Complete Sale — ${formatCurrency(totals.grandTotal)}`}
            </button>
          </div>
        </div>
      </div>

      {/* New Customer Modal */}
      <Modal isOpen={showCustomerModal} onClose={() => setShowCustomerModal(false)} title="New Customer" size="sm"
        footer={<button className="btn btn-primary" onClick={handleCreateCustomer}>Create & Select</button>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="form-group"><label className="form-label">Name *</label><input className="form-input" value={newCustomer.customer_name} onChange={e => setNewCustomer(n => ({ ...n, customer_name: e.target.value }))} autoFocus /></div>
          <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={newCustomer.phone_number} onChange={e => setNewCustomer(n => ({ ...n, phone_number: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">State</label><input className="form-input" value={newCustomer.state} onChange={e => setNewCustomer(n => ({ ...n, state: e.target.value }))} placeholder="e.g. Maharashtra" /></div>
        </div>
      </Modal>
    </>
  );
}
