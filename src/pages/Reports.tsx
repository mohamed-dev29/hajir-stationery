import { useState, useMemo } from 'react';
import {
  ShoppingCart, Package, Receipt, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { useAnalytics, useProducts, useSales, useExpenses, useCustomers } from '@/hooks/useDatabase';
import type { DateRange } from '@/types';

const dateRanges: { label: string; value: DateRange }[] = [
  { label: 'Today', value: 'today' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
  { label: 'All', value: 'all' },
];

const COLORS = ['#2D6A4F', '#059669', '#0EA5E9', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6B7280'];

export default function ReportsPage() {
  const [range, setRange] = useState<DateRange>('month');
  const [reportTab, setReportTab] = useState<'sales' | 'inventory' | 'financial'>('sales');
  const { getKPIs, getSalesChartData, getTopProducts } = useAnalytics();
  const { products } = useProducts();
  const { sales } = useSales();
  const { expenses } = useExpenses();
  const { customers } = useCustomers();

  const kpis = useMemo(() => getKPIs(), [getKPIs, sales, expenses, products, customers]);
  const chartData = useMemo(() => getSalesChartData(range), [getSalesChartData, range, sales, expenses]);
  const topProducts = useMemo(() => getTopProducts(), [getTopProducts, sales]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(v);

  // Inventory data
  const inventoryValue = useMemo(() => products.reduce((sum, p) => sum + p.price * p.stock, 0), [products]);
  const inventoryCost = useMemo(() => products.reduce((sum, p) => sum + p.costPrice * p.stock, 0), [products]);
  const lowStockProducts = useMemo(() => products.filter(p => p.stock < 10), [products]);

  // Category distribution
  const categoryDist = useMemo(() => {
    const cats: Record<string, number> = {};
    products.forEach(p => {
      cats[p.categoryId] = (cats[p.categoryId] || 0) + p.stock;
    });
    return Object.entries(cats).map(([name, value]) => ({ name: name.slice(0, 8), value }));
  }, [products]);

  const exportCSV = () => {
    let csv = '';
    if (reportTab === 'sales') {
      csv = 'Receipt,Date,Customer,Items,Total,Payment\n';
      sales.forEach(s => {
        csv += `${s.receiptNumber},${new Date(s.createdAt).toLocaleDateString()},${s.customerName},${s.items.length},${s.total},${s.paymentMethod}\n`;
      });
    } else if (reportTab === 'inventory') {
      csv = 'Product,Category,Price,Cost,Stock,Value\n';
      products.forEach(p => {
        csv += `${p.name},${p.categoryId},${p.price},${p.costPrice},${p.stock},${p.price * p.stock}\n`;
      });
    } else {
      csv = 'Title,Category,Amount,Date,Payment\n';
      expenses.forEach(e => {
        csv += `${e.title},${e.category},${e.amount},${new Date(e.date).toLocaleDateString()},${e.paymentMethod}\n`;
      });
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `haajir_${reportTab}_report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Analyze your business data</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-1" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar">
        <Button
          variant={reportTab === 'sales' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setReportTab('sales')}
          className={reportTab === 'sales' ? 'bg-[#2D6A4F] hover:bg-[#1B4D3E]' : ''}
        >
          <ShoppingCart className="w-4 h-4 mr-1" />
          Sales Report
        </Button>
        <Button
          variant={reportTab === 'inventory' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setReportTab('inventory')}
          className={reportTab === 'inventory' ? 'bg-[#2D6A4F] hover:bg-[#1B4D3E]' : ''}
        >
          <Package className="w-4 h-4 mr-1" />
          Inventory Report
        </Button>
        <Button
          variant={reportTab === 'financial' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setReportTab('financial')}
          className={reportTab === 'financial' ? 'bg-[#2D6A4F] hover:bg-[#1B4D3E]' : ''}
        >
          <Receipt className="w-4 h-4 mr-1" />
          Financial Report
        </Button>
      </div>

      {reportTab === 'sales' && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Total Sales</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(kpis.totalSales)}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Orders</p>
                <p className="text-2xl font-bold text-gray-900">{sales.length}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Avg. Order</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(kpis.averageOrderValue)}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Customers</p>
                <p className="text-2xl font-bold text-purple-600">{kpis.totalCustomers}</p>
              </CardContent>
            </Card>
          </div>

          {/* Range Selector */}
          <div className="flex items-center gap-2 mb-4">
            {dateRanges.map((r) => (
              <Button
                key={r.value}
                variant={range === r.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRange(r.value)}
                className={range === r.value ? 'bg-[#2D6A4F] hover:bg-[#1B4D3E]' : ''}
              >
                {r.label}
              </Button>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Sales Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="salesGrad2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                        <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                        <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Area type="monotone" dataKey="sales" stroke="#2D6A4F" fill="url(#salesGrad2)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">No sales data</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Top Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {topProducts.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topProducts.slice(0, 8)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#9CA3AF" width={100} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="revenue" fill="#2D6A4F" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">No product data</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Sales Table */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recent Transactions</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-500 uppercase text-xs">Receipt</th>
                    <th className="px-4 py-3 font-medium text-gray-500 uppercase text-xs">Date</th>
                    <th className="px-4 py-3 font-medium text-gray-500 uppercase text-xs">Customer</th>
                    <th className="px-4 py-3 font-medium text-gray-500 uppercase text-xs">Items</th>
                    <th className="px-4 py-3 font-medium text-gray-500 uppercase text-xs text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.slice(0, 20).map((s) => (
                    <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs">{s.receiptNumber}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">{s.customerName || 'Walk-in'}</td>
                      <td className="px-4 py-3">{s.items.length}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(s.total)}</td>
                    </tr>
                  ))}
                  {sales.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No sales data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {reportTab === 'inventory' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Inventory Value</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(inventoryValue)}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Total Cost</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(inventoryCost)}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Low Stock</p>
                <p className="text-2xl font-bold text-red-600">{lowStockProducts.length}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Category Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {categoryDist.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryDist} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                          {categoryDist.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">No category data</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Low Stock Products</CardTitle>
              </CardHeader>
              <CardContent>
                {lowStockProducts.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {lowStockProducts.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-red-50">
                        <div>
                          <p className="text-sm font-medium">{p.name}</p>
                          <p className="text-xs text-gray-500">Stock: {p.stock}</p>
                        </div>
                        <span className="text-sm font-bold text-red-600">{p.stock}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400 text-sm">All products well stocked</div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {reportTab === 'financial' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Total Sales</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(kpis.totalSales)}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(kpis.totalExpenses)}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Net Profit</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(kpis.netProfit)}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Profit Margin</p>
                <p className="text-2xl font-bold text-purple-600">
                  {kpis.totalSales > 0 ? ((kpis.netProfit / kpis.totalSales) * 100).toFixed(1) : 0}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Profit/Loss Chart */}
          <Card className="border-0 shadow-sm mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Profit / Loss Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                      <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Area type="monotone" dataKey="profit" stroke="#2D6A4F" fill="url(#profitGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">No financial data yet</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Expense Breakdown */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Expense Breakdown</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-500 uppercase text-xs">Title</th>
                    <th className="px-4 py-3 font-medium text-gray-500 uppercase text-xs">Category</th>
                    <th className="px-4 py-3 font-medium text-gray-500 uppercase text-xs">Date</th>
                    <th className="px-4 py-3 font-medium text-gray-500 uppercase text-xs text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.slice(0, 20).map((e) => (
                    <tr key={e.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{e.title}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">{e.category}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{new Date(e.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right font-medium text-red-600">{formatCurrency(e.amount)}</td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No expenses recorded</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
