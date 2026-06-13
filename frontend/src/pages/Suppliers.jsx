import { useState, useEffect } from 'react';
import Header from '../components/Header';
import DataTable from '../components/DataTable';
import SupplierForm from './SupplierForm';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Suppliers() {
  const { isAdmin } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/suppliers', { params: { limit: 100, search: searchTerm } });
      setSuppliers(res.data.suppliers || []);
    } catch (error) {
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadSuppliers();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const handleAdd = () => {
    setEditingSupplier(null);
    setIsFormOpen(true);
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setIsFormOpen(true);
  };

  const handleDelete = async (supplier) => {
    if (window.confirm(`Are you sure you want to delete supplier "${supplier.supplier_name}"?`)) {
      try {
        await api.delete(`/suppliers/${supplier.id}`);
        toast.success('Supplier deleted successfully');
        loadSuppliers();
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Failed to delete supplier');
      }
    }
  };

  const columns = [
    { header: 'Supplier Name', accessor: 'supplier_name' },
    { header: 'Contact Person', accessor: 'contact_person' },
    { header: 'Phone', accessor: 'phone_number' },
    { header: 'GSTIN', accessor: 'gstin' },
    { header: 'State', accessor: 'state' },
    { 
      header: 'Actions', 
      accessor: 'actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button 
            className="p-1.5 text-indigo-400 hover:bg-indigo-400/10 rounded transition-colors"
            onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
            title="Edit Supplier"
          >
            <Edit2 size={16} />
          </button>
          {isAdmin && (
            <button 
              className="p-1.5 text-rose-400 hover:bg-rose-400/10 rounded transition-colors"
              onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
              title="Delete Supplier"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="page-container">
      <Header title="Suppliers" />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search suppliers by name, phone, or GSTIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
          />
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={handleAdd}>
          <Plus size={18} />
          <span>Add Supplier</span>
        </button>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={suppliers}
          loading={loading}
          emptyMessage="No suppliers found."
        />
      </div>

      {isFormOpen && (
        <SupplierForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          supplier={editingSupplier}
          onSaved={loadSuppliers}
        />
      )}
    </div>
  );
}
