import { useState, useEffect } from 'react';
import Header from '../components/Header';
import DataTable from '../components/DataTable';
import api from '../api/axios';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Purchases() {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPurchases = async () => {
    setLoading(true);
    try {
      const res = await api.get('/purchases', { params: { limit: 100 } });
      setPurchases(res.data.purchases || []);
    } catch (error) {
      toast.error('Failed to load purchases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPurchases();
  }, []);

  const columns = [
    { header: 'Invoice No.', accessor: 'supplier_invoice_number' },
    { header: 'Date', render: (row) => formatDateTime(row.purchase_date) },
    { header: 'Supplier', accessor: 'supplier_name' },
    { header: 'Total Amount', render: (row) => formatCurrency(row.total_amount) },
    { 
      header: 'Payment Status', 
      render: (row) => (
        <span className={`badge ${
          row.payment_status === 'paid' ? 'badge-success' : 
          row.payment_status === 'partial' ? 'badge-warning' : 'badge-danger'
        }`}>
          {row.payment_status.toUpperCase()}
        </span>
      )
    }
  ];

  return (
    <div className="page-container">
      <Header title="Purchases" />
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-slate-100">Purchase History</h2>
        <button 
          className="btn-primary flex items-center gap-2"
          onClick={() => navigate('/purchases/new')}
        >
          <Plus size={18} />
          <span>Record New Purchase</span>
        </button>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={purchases}
          loading={loading}
          emptyMessage="No purchases recorded yet."
        />
      </div>
    </div>
  );
}
