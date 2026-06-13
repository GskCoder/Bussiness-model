import { useState, useEffect } from 'react';
import Header from '../components/Header';
import StatsCard from '../components/StatsCard';
import api from '../api/axios';
import { formatCurrency } from '../utils/formatters';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, IndianRupee, Package, Users, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const PERIODS = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: '1y', label: 'Last Year' },
];

export default function Analytics() {
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [
          overviewRes,
          revenueRes,
          productsRes,
          customersRes,
          paymentsRes,
          categoriesRes
        ] = await Promise.all([
          api.get(`/analytics/overview?period=${period}`),
          api.get(`/analytics/revenue-trend?period=${period}`),
          api.get(`/analytics/top-products?period=${period}&limit=5`),
          api.get(`/analytics/top-customers?period=${period}&limit=5`),
          api.get(`/analytics/by-payment-method?period=${period}`),
          api.get(`/analytics/by-category?period=${period}`)
        ]);

        setOverview(overviewRes.data);
        setRevenueTrend(revenueRes.data);
        setTopProducts(productsRes.data);
        setTopCustomers(customersRes.data);
        setPaymentMethods(paymentsRes.data);
        setCategoryBreakdown(categoriesRes.data);
      } catch (err) {
        toast.error('Failed to load analytics data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [period]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'var(--color-surface-elevated)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '12px',
          boxShadow: 'var(--shadow-md)',
          color: 'var(--color-text-primary)'
        }}>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color, fontSize: 13, margin: '4px 0' }}>
              {entry.name}: {entry.name.toLowerCase().includes('count') || entry.name.toLowerCase().includes('orders') ? entry.value : formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Header title="Analytics Dashboard" />

      <div style={{ padding: 28, flex: 1, overflowY: 'auto' }}>
        {/* Period Selector */}
        <div className="glass-card" style={{
          display: 'inline-flex', padding: '4px', borderRadius: 'var(--radius-lg)',
          marginBottom: 24,
        }}>
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                background: period === p.value ? 'var(--color-surface-elevated)' : 'transparent',
                color: period === p.value ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                fontWeight: period === p.value ? 600 : 500,
                fontSize: 13,
                border: 'none',
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {loading && !overview ? (
          <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 120 }} />)}
          </div>
        ) : (
          <div className="animate-fade-in">
            {/* Overview Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
              marginBottom: 24
            }}>
              <StatsCard
                icon={IndianRupee}
                label="Revenue"
                value={overview?.revenue || 0}
                prefix="₹"
                trend={overview?.revenue_trend}
                color="var(--color-success)"
              />
              <StatsCard
                icon={TrendingUp}
                label="Profit"
                value={overview?.profit || 0}
                prefix="₹"
                trend={overview?.profit_trend}
                color="var(--color-primary)"
              />
              <StatsCard
                icon={Package}
                label="Orders"
                value={overview?.orders || 0}
                trend={overview?.orders_trend}
                color="var(--color-info)"
              />
              <StatsCard
                icon={Users}
                label="Avg Order Value"
                value={overview?.avg_order || 0}
                prefix="₹"
                color="var(--color-warning)"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 24 }}>
              
              {/* Revenue Trend Chart */}
              <div className="glass-card" style={{ gridColumn: 'span 8', padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Revenue & Profit Trend</h3>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
                      <XAxis dataKey="label" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area type="monotone" dataKey="revenue" name="Revenue" stroke="var(--color-success)" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                      <Area type="monotone" dataKey="profit" name="Profit" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Payment Methods Chart */}
              <div className="glass-card" style={{ gridColumn: 'span 4', padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Sales by Payment Method</h3>
                <div style={{ height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <ResponsiveContainer width="100%" height="80%">
                    <PieChart>
                      <Pie
                        data={paymentMethods}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {paymentMethods.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 10 }}>
                    {paymentMethods.map(method => (
                      <div key={method.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: method.fill }} />
                        <span style={{ color: 'var(--color-text-secondary)' }}>{method.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top Products */}
              <div className="glass-card" style={{ gridColumn: 'span 6', padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Top Products (by Revenue)</h3>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" horizontal={false} />
                      <XAxis type="number" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                      <YAxis type="category" dataKey="name" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} width={100} />
                      <Tooltip content={<CustomTooltip />} cursor={{fill: 'var(--color-surface-hover)'}} />
                      <Bar dataKey="revenue" name="Revenue" fill="var(--color-info)" radius={[0, 4, 4, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Sales by Category */}
              <div className="glass-card" style={{ gridColumn: 'span 6', padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Sales by Category</h3>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryBreakdown} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                      <Tooltip content={<CustomTooltip />} cursor={{fill: 'var(--color-surface-hover)'}} />
                      <Bar dataKey="value" name="Revenue" radius={[4, 4, 0, 0]} barSize={40}>
                        {categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Customers */}
              <div className="glass-card" style={{ gridColumn: 'span 12', padding: 24, marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Top Customers</h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Customer Name</th>
                      <th style={{ textAlign: 'right' }}>Orders</th>
                      <th style={{ textAlign: 'right' }}>Total Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCustomers.map((c, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 500 }}>{c.name}</td>
                        <td style={{ textAlign: 'right' }}>{c.orders}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-success)' }}>
                          {formatCurrency(c.total)}
                        </td>
                      </tr>
                    ))}
                    {topCustomers.length === 0 && (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-muted)' }}>
                          No customer sales in this period
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
