import { useState, useEffect } from 'react';
import Header from '../components/Header';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';
import { Plus, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const GST_OPTIONS = [0, 5, 12, 18, 28];

const emptyProduct = {
  product_name: '', category_id: '', supplier_id: '', brand: '', barcode: '', hsn_code: '',
  gst_percentage: 18, purchase_price: '', selling_price: '', stock_quantity: 0, minimum_stock: 10, expiry_date: '',
};

export default function Products() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ search: '', category_id: '', stock_status: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [showCatModal, setShowCatModal] = useState(false);

  async function loadProducts() {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (filter.search) params.search = filter.search;
      if (filter.category_id) params.category_id = filter.category_id;
      if (filter.stock_status) params.stock_status = filter.stock_status;
      const res = await api.get('/products', { params });
      setProducts(res.data.products || []);
    } catch { toast.error('Failed to load products'); }
    setLoading(false);
  }

  async function loadCategories() {
    try { const res = await api.get('/products/categories'); setCategories(res.data); } catch { /* ignore */ }
  }

  async function loadSuppliers() {
    try { const res = await api.get('/suppliers', { params: { limit: 100 } }); setSuppliers(res.data.suppliers || []); } catch { /* ignore */ }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { loadProducts(); loadCategories(); loadSuppliers(); }, [filter]);

  function openAdd() { setEditingProduct(null); setForm(emptyProduct); setModalOpen(true); }
  function openEdit(product) {
    setEditingProduct(product);
    setForm({ ...product, category_id: product.category_id || '', supplier_id: product.supplier_id || '', expiry_date: product.expiry_date || '' });
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.product_name || !form.selling_price) { toast.error('Name and selling price are required'); return; }
    setSaving(true);
    try {
      const data = { ...form, purchase_price: parseFloat(form.purchase_price) || 0, selling_price: parseFloat(form.selling_price), stock_quantity: parseInt(form.stock_quantity) || 0, minimum_stock: parseInt(form.minimum_stock) || 10, gst_percentage: parseFloat(form.gst_percentage), category_id: form.category_id || null, supplier_id: form.supplier_id || null, expiry_date: form.expiry_date || null, barcode: form.barcode || null };
      if (editingProduct) { await api.put(`/products/${editingProduct.id}`, data); toast.success('Product updated'); }
      else { await api.post('/products', data); toast.success('Product added'); }
      setModalOpen(false); loadProducts();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to save'); }
    setSaving(false);
  }

  async function handleDelete(product) {
    if (!confirm(`Delete "${product.product_name}"?`)) return;
    try { await api.delete(`/products/${product.id}`); toast.success('Product deleted'); loadProducts(); }
    catch (err) { toast.error(err.response?.data?.detail || 'Failed to delete'); }
  }

  async function handleAddCategory() {
    if (!newCategory.trim()) return;
    try { await api.post('/products/categories', { name: newCategory.trim() }); toast.success('Category added'); setNewCategory(''); setShowCatModal(false); loadCategories(); }
    catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
  }

  const columns = [
    { key: 'product_name', label: 'Product', accessor: 'product_name' },
    { key: 'category', label: 'Category', render: r => r.category_name || '-' },
    { key: 'brand', label: 'Brand', accessor: 'brand' },
    { key: 'selling_price', label: 'Price', render: r => formatCurrency(r.selling_price) },
    { key: 'gst_percentage', label: 'GST', render: r => `${r.gst_percentage}%` },
    {
      key: 'stock_quantity', label: 'Stock', render: r => (
        <span className={`badge ${r.stock_quantity <= 0 ? 'badge-danger' : r.stock_quantity <= r.minimum_stock ? 'badge-warning' : 'badge-success'}`}>
          {r.stock_quantity <= 0 ? 'Out of Stock' : r.stock_quantity}
        </span>
      )
    },
    { key: 'hsn_code', label: 'HSN', accessor: 'hsn_code' },
  ];

  return (
    <>
      <Header title="Products" />
      <div style={{ padding: 28, flex: 1, overflowY: 'auto' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <input className="form-input" placeholder="Search products..." value={filter.search} onChange={e => setFilter(f => ({ ...f, search: e.target.value }))} style={{ maxWidth: 280 }} />
          <select className="form-select" value={filter.category_id} onChange={e => setFilter(f => ({ ...f, category_id: e.target.value }))} style={{ maxWidth: 180 }}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="form-select" value={filter.stock_status} onChange={e => setFilter(f => ({ ...f, stock_status: e.target.value }))} style={{ maxWidth: 160 }}>
            <option value="">All Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
          <div style={{ flex: 1 }} />
          {isAdmin && (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowCatModal(true)}>+ Category</button>
              <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Product</button>
            </>
          )}
        </div>

        {/* Table */}
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <DataTable
            columns={columns} data={products} loading={loading}
            searchable={false}
            actions={isAdmin ? (row) => (
              <>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={(e) => { e.stopPropagation(); openEdit(row); }}><Edit size={14} /></button>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={(e) => { e.stopPropagation(); handleDelete(row); }} style={{ color: 'var(--color-danger)' }}><Trash2 size={14} /></button>
              </>
            ) : null}
          />
        </div>
      </div>

      {/* Product Form Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingProduct ? 'Edit Product' : 'Add Product'} size="lg"
        footer={<><button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></>}
      >
        <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Product Name *</label>
            <input className="form-input" value={form.product_name} onChange={e => setForm(f => ({ ...f, product_name: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
              <option value="">None</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Supplier</label>
            <select className="form-select" value={form.supplier_id} onChange={e => setForm(f => ({ ...f, supplier_id: e.target.value }))}>
              <option value="">None</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.supplier_name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Brand</label>
            <input className="form-input" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Barcode</label>
            <input className="form-input" value={form.barcode || ''} onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">HSN Code</label>
            <input className="form-input" value={form.hsn_code} onChange={e => setForm(f => ({ ...f, hsn_code: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">GST %</label>
            <select className="form-select" value={form.gst_percentage} onChange={e => setForm(f => ({ ...f, gst_percentage: e.target.value }))}>
              {GST_OPTIONS.map(g => <option key={g} value={g}>{g}%</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Purchase Price</label>
            <input className="form-input" type="number" step="0.01" value={form.purchase_price} onChange={e => setForm(f => ({ ...f, purchase_price: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Selling Price *</label>
            <input className="form-input" type="number" step="0.01" value={form.selling_price} onChange={e => setForm(f => ({ ...f, selling_price: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Stock Quantity</label>
            <input className="form-input" type="number" value={form.stock_quantity} onChange={e => setForm(f => ({ ...f, stock_quantity: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Minimum Stock</label>
            <input className="form-input" type="number" value={form.minimum_stock} onChange={e => setForm(f => ({ ...f, minimum_stock: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Expiry Date</label>
            <input className="form-input" type="date" value={form.expiry_date || ''} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} />
          </div>
        </form>
      </Modal>

      {/* Category Modal */}
      <Modal isOpen={showCatModal} onClose={() => setShowCatModal(false)} title="Add Category" size="sm"
        footer={<button className="btn btn-primary" onClick={handleAddCategory}>Add</button>}
      >
        <div className="form-group">
          <label className="form-label">Category Name</label>
          <input className="form-input" value={newCategory} onChange={e => setNewCategory(e.target.value)} autoFocus />
        </div>
      </Modal>
    </>
  );
}
