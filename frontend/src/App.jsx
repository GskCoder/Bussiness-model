import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers';
import NewSale from './pages/NewSale';
import Sales from './pages/Sales';
import Invoices from './pages/Invoices';
import AuditLogs from './pages/AuditLogs';
import Settings from './pages/Settings';
import StaffManagement from './pages/StaffManagement';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1E293B',
              color: '#F8FAFC',
              border: '1px solid #334155',
              borderRadius: '8px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#10B981', secondary: '#F8FAFC' } },
            error: { iconTheme: { primary: '#F43F5E', secondary: '#F8FAFC' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Protected routes with sidebar layout */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/sales/new" element={<NewSale />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/invoices" element={<Invoices />} />

            {/* Admin-only routes */}
            <Route path="/audit-logs" element={<ProtectedRoute requiredRole="admin"><AuditLogs /></ProtectedRoute>} />
            <Route path="/staff" element={<ProtectedRoute requiredRole="admin"><StaffManagement /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute requiredRole="admin"><Settings /></ProtectedRoute>} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
