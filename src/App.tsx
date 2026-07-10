import { Routes, Route, useLocation, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, ShoppingCart, Package, Users, Receipt,
  Truck, Settings, BarChart3, Wallet, Menu, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Toaster } from 'sonner';
import DashboardPage from './pages/Dashboard';
import POSPage from './pages/POS';
import ProductsPage from './pages/Products';
import CustomersPage from './pages/Customers';
import ExpensesPage from './pages/Expenses';
import SuppliersPage from './pages/Suppliers';
import ReportsPage from './pages/Reports';
import MoneyPage from './pages/Money';
import SettingsPage from './pages/Settings';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/pos', label: 'POS', icon: ShoppingCart },
  { path: '/products', label: 'Products', icon: Package },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/expenses', label: 'Expenses', icon: Receipt },
  { path: '/suppliers', label: 'Suppliers', icon: Truck },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/money', label: 'Money', icon: Wallet },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F5F6F8]">
      <Toaster position="top-right" richColors />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#111827] text-white flex flex-col transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <img
              src="/assets/haajir.png"
              alt="Haajir Stationery"
              className="h-10 w-10 object-contain rounded-lg"
            />
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">HAAJIR</h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Stationery</p>
            </div>
          </div>
          <button
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-[#2D6A4F] text-white shadow-lg shadow-[#2D6A4F]/20'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-gray-800">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>Haajir Stationery v1.0</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <img
            src="/assets/haajir.png"
            alt="Haajir Stationery"
            className="h-8 object-contain"
          />
          <div className="w-9" />
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/pos" element={<POSPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/suppliers" element={<SuppliersPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/money" element={<MoneyPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
