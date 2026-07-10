import { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Package, Users, Truck,
  AlertTriangle, ShoppingCart, ArrowUpRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { useAnalytics, useProducts } from '@/hooks/useDatabase';
import type { DateRange } from '@/types';

const dateRanges: { label: string; value: DateRange }[] = [
  { label: 'Today', value: 'today' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
  { label: 'All', value: 'all' },
];

export default function DashboardPage() {
  const [range, setRange] = useState<DateRange>('week');
  const { getKPIs, getSalesChartData, getTopProducts, getRecentSales } = useAnalytics();
  const { products } = useProducts();
  const [kpis, setKpis] = useState(getKPIs());
  const [chartData, setChartData] = useState(getSalesChartData(range));
  const [topProducts, setTopProducts] = useState(getTopProducts());
  const [recentSales, setRecentSales] = useState(getRecentSales(5));

  useEffect(() => {
    setKpis(getKPIs());
    setChartData(getSalesChartData(range));
    setTopProducts(getTopProducts());
    setRecentSales(getRecentSales(5));
  }, [range, getKPIs, getSalesChartData, getTopProducts, getRecentSales]);

  const lowStock = useMemo(() => products.filter(p => p.stock < 10), [products]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(v);

  const kpiCards = [
    {
      title: 'Total Sales',
      value: formatCurrency(kpis.totalSales),
      icon: ShoppingCart,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      trend: '+12%',
    },
    {
      title: 'Expenses',
      value: formatCurrency(kpis.totalExpenses),
      icon: TrendingDown,
      color: 'text-red-600',
      bg: 'bg-red-50',
      trend: '-5%',
    },
    {
      title: 'Net Profit',
      value: formatCurrency(kpis.netProfit),
      icon: TrendingUp,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
      trend: '+8%',
    },
    {
      title: 'Products',
      value: kpis.totalProducts.toString(),
      icon: Package,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      sub: `${kpis.lowStockCount} low stock`,
    },
    {
      title: 'Customers',
      value: kpis.totalCustomers.toString(),
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      sub: 'Total registered',
    },
    {
      title: 'Suppliers',
      value: kpis.totalSuppliers.toString(),
      icon: Truck,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      sub: 'Active suppliers',
    },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of your business performance</p>
        </div>
        <div className="flex items-center gap-2">
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
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {kpiCards.map((kpi, i) => (
          <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-1">{kpi.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                  {kpi.sub && (
                    <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>
                  )}
                  {kpi.trend && (
                    <div className="flex items-center gap-1 mt-2">
                      <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                      <span className="text-xs text-emerald-600 font-medium">{kpi.trend}</span>
                    </div>
                  )}
                </div>
                <div className={`p-3 rounded-xl ${kpi.bg}`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Sales Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Sales Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Area type="monotone" dataKey="sales" stroke="#2D6A4F" fill="url(#salesGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  No sales data yet. Start making sales in the POS.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts.slice(0, 6)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#9CA3AF" width={100} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="revenue" fill="#2D6A4F" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  No product sales yet. Make your first sale in the POS.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Sales */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            {recentSales.length > 0 ? (
              <div className="space-y-3">
                {recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{sale.receiptNumber}</p>
                      <p className="text-xs text-gray-500">
                        {sale.customerName || 'Walk-in'} · {new Date(sale.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-600">
                      {formatCurrency(sale.total)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">
                No sales recorded yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStock.length > 0 ? (
              <div className="space-y-3">
                {lowStock.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 rounded-lg bg-red-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                        <Package className="w-4 h-4 text-red-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">Below minimum threshold</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-red-600">{product.stock} left</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">
                All products have sufficient stock.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
