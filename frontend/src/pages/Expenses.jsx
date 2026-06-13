import { useState, useEffect } from 'react';
import Header from '../components/Header';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatsCard from '../components/StatsCard';
import api from '../api/axios';
import { formatCurrency, formatDate } from '../utils/formatters';
import { IndianRupee, Plus, Filter, Tag, Calendar, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [currentExpense, setCurrentExpense] = useState(null);

  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterCategory, setFilterCategory] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    category_id: '',
    description: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    reference: '',
  });

  const [catFormData, setCatFormData] = useState({ name: '', description: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      // Calculate start and end dates for the selected month
      const startDate = new Date(filterYear, filterMonth - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(filterYear, filterMonth, 0).toISOString().split('T')[0];

      let url = `/expenses?start=${startDate}&end=${endDate}`;
      if (filterCategory) url += `&category_id=${filterCategory}`;

      const [expRes, catRes, sumRes] = await Promise.all([
        api.get(url),
        api.get('/expenses/categories'),
        api.get(`/expenses/summary?month=${filterMonth}&year=${filterYear}`)
      ]);

      setExpenses(expRes.data.expenses);
      setCategories(catRes.data);
      setSummary(sumRes.data);
    } catch (err) {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMonth, filterYear, filterCategory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        category_id: parseInt(formData.category_id),
        amount: parseFloat(formData.amount),
      };

      if (currentExpense) {
        await api.put(`/expenses/${currentExpense.id}`, payload);
        toast.success('Expense updated!');
      } else {
        await api.post('/expenses', payload);
        toast.success('Expense added!');
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save expense');
    }
  };

  const handleCatSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/expenses/categories', catFormData);
      toast.success('Category added!');
      setShowCatModal(false);
      setCatFormData({ name: '', description: '' });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save category');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await api.delete(`/expenses/${id}`);
        toast.success('Expense deleted');
        loadData();
      } catch (err) {
        toast.error('Failed to delete expense');
      }
    }
  };

  const openModal = (expense = null) => {
    setCurrentExpense(expense);
    if (expense) {
      setFormData({
        category_id: expense.category_id,
        description: expense.description,
        amount: expense.amount,
        expense_date: expense.expense_date,
        payment_method: expense.payment_method,
        reference: expense.reference || '',
      });
    } else {
      setFormData({
        category_id: categories.length > 0 ? categories[0].id : '',
        description: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        reference: '',
      });
    }
    setShowModal(true);
  };

  const columns = [
    { header: 'Date', accessor: (row) => formatDate(row.expense_date) },
    { header: 'Category', accessor: 'category_name' },
    { header: 'Description', accessor: 'description' },
    { header: 'Amount', accessor: (row) => <span style={{ fontWeight: 600, color: 'var(--color-danger)' }}>{formatCurrency(row.amount)}</span> },
    { header: 'Payment Method', accessor: (row) => <span style={{ textTransform: 'uppercase', fontSize: 12 }} className="badge badge-neutral">{row.payment_method}</span> },
    {
      header: 'Actions',
      accessor: (row) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => openModal(row)} className="btn-ghost" title="Edit">
            <Pencil size={16} />
          </button>
          <button onClick={() => handleDelete(row.id)} className="btn-ghost" style={{ color: 'var(--color-danger)' }} title="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Header title="Expense Tracking" />

      <div style={{ padding: 28, flex: 1, overflowY: 'auto' }}>
        
        {/* Summary Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
          marginBottom: 24
        }}>
          <StatsCard
            icon={IndianRupee}
            label={`Total Expenses (${new Date(filterYear, filterMonth - 1).toLocaleString('default', { month: 'short' })})`}
            value={summary?.monthly_total || 0}
            prefix="₹"
            color="var(--color-danger)"
          />
          
          <div className="glass-card animate-fade-in" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12, gridColumn: 'span 2' }}>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>Top Expense Categories</div>
            <div style={{ display: 'flex', gap: 16, overflowX: 'auto' }}>
              {summary?.category_breakdown?.slice(0, 4).map((c, i) => (
                <div key={i} style={{ 
                  background: 'var(--color-surface)', padding: '10px 16px', 
                  borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                  minWidth: 140
                }}>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>{c.category}</div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{formatCurrency(c.amount)}</div>
                </div>
              ))}
              {summary?.category_breakdown?.length === 0 && (
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>No expenses recorded this month</div>
              )}
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="glass-card" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', marginBottom: 20, flexWrap: 'wrap', gap: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={16} style={{ color: 'var(--color-text-muted)' }} />
              <select 
                className="form-select" 
                value={filterMonth} 
                onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                style={{ width: 130, padding: '6px 10px', fontSize: 13 }}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}</option>
                ))}
              </select>
              <select 
                className="form-select" 
                value={filterYear} 
                onChange={(e) => setFilterYear(parseInt(e.target.value))}
                style={{ width: 100, padding: '6px 10px', fontSize: 13 }}
              >
                {[...Array(5)].map((_, i) => {
                  const y = new Date().getFullYear() - i;
                  return <option key={y} value={y}>{y}</option>;
                })}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Filter size={16} style={{ color: 'var(--color-text-muted)' }} />
              <select 
                className="form-select" 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{ width: 160, padding: '6px 10px', fontSize: 13 }}
              >
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowCatModal(true)}>
              <Tag size={16} /> New Category
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => openModal()}>
              <Plus size={16} /> Add Expense
            </button>
          </div>
        </div>

        {/* Data Table */}
        <DataTable columns={columns} data={expenses} isLoading={loading} />

      </div>

      {/* Expense Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={currentExpense ? 'Edit Expense' : 'Add Expense'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={formData.category_id}
                onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                required
              >
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              type="text"
              className="form-input"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.expense_date}
                onChange={e => setFormData({ ...formData, expense_date: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select
                className="form-select"
                value={formData.payment_method}
                onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Reference No. (Optional)</label>
            <input
              type="text"
              className="form-input"
              value={formData.reference}
              onChange={e => setFormData({ ...formData, reference: e.target.value })}
              placeholder="Bill No. / UTR"
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Expense</button>
          </div>
        </form>
      </Modal>

      {/* Category Modal */}
      <Modal isOpen={showCatModal} onClose={() => setShowCatModal(false)} title="Add Expense Category">
        <form onSubmit={handleCatSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Category Name</label>
            <input
              type="text"
              className="form-input"
              value={catFormData.name}
              onChange={e => setCatFormData({ ...catFormData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description (Optional)</label>
            <textarea
              className="form-textarea"
              value={catFormData.description}
              onChange={e => setCatFormData({ ...catFormData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowCatModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Category</button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
