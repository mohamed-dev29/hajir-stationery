import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, ShoppingCart, Package, Users, Receipt,
  Truck, Settings, BarChart3, Wallet, Menu, X, LogOut, ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Toaster } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types';
import DashboardPage from './pages/Dashboard';
import POSPage from './pages/POS';
import ProductsPage from './pages/Products';
import CustomersPage from './pages/Customers';
import ExpensesPage from './pages/Expenses';
import SuppliersPage from './pages/Suppliers';
import ReportsPage from './pages/Reports';
import MoneyPage from './pages/Money';
import SettingsPage from './pages/Settings';

const allNavItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'sales'] as const },
  { path: '/pos', label: 'POS', icon: ShoppingCart, roles: ['admin', 'manager', 'sales'] as const },
  { path: '/products', label: 'Products', icon: Package, roles: ['admin', 'manager'] as const },
  { path: '/customers', label: 'Customers', icon: Users, roles: ['admin', 'manager', 'sales'] as const },
  { path: '/expenses', label: 'Expenses', icon: Receipt, roles: ['admin', 'manager'] as const },
  { path: '/suppliers', label: 'Suppliers', icon: Truck, roles: ['admin', 'manager'] as const },
  { path: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'manager', 'sales'] as const },
  { path: '/money', label: 'Money', icon: Wallet, roles: ['admin', 'manager'] as const },
  { path: '/settings', label: 'Settings', icon: Settings, roles: ['admin'] as const },
];

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: UserRole[] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return allowedRoles.includes(user.role) ? <>{children}</> : <Navigate to="/" replace />;
}

function LoginScreen() {
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      if (mode === 'sign-in') {
        await signIn(email, password);
      } else {
        const signedIn = await signUp(email, password, name);
        if (!signedIn) {
          setMode('sign-in');
          setMessage('Account created. Check your email to confirm your account, then sign in.');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F6F8] p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-[#2D6A4F] p-3 text-white"><ShieldCheck className="h-6 w-6" /></div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Haajir Stationery</h1>
            <p className="text-sm text-gray-500">Sign in or create an account</p>
          </div>
        </div>

        <div className="mb-4 flex rounded-xl border border-gray-200 p-1">
          {/* <button type="button" className={`flex-1 rounded-lg px-3 py-2 text-sm ${mode === 'sign-in' ? 'bg-[#2D6A4F] text-white' : 'text-gray-600'}`} onClick={() => setMode('sign-in')}>Sign In</button> */}
          {/* <button type="button" className={`flex-1 rounded-lg px-3 py-2 text-sm ${mode === 'sign-up' ? 'bg-[#2D6A4F] text-white' : 'text-gray-600'}`} onClick={() => setMode('sign-up')}>Sign Up</button> */}
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === 'sign-up' && (
            <>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2" placeholder="Full name" />
            </>
          )}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2" placeholder="Email" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2" placeholder="Password" required />
          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-700">{message}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#2D6A4F] px-4 py-2.5 font-semibold text-white disabled:opacity-70">
            {loading ? 'Please wait...' : mode === 'sign-in' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, logout, canAccess, roleLabel } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!user) return;
    if (!canAccess(location.pathname)) {
      navigate('/');
    }
  }, [location.pathname, user, canAccess, navigate]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#F5F6F8] text-sm text-gray-600">Loading session…</div>;
  }

  if (!user) {
    return <LoginScreen />;
  }

  const navItems = allNavItems.filter((item) =>
    item.roles.some((role) => role === user.role),
  );

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
        <div className="px-4 py-4 border-t border-gray-800 space-y-3">
          <div className="rounded-lg bg-gray-900/80 p-2 text-xs text-gray-400">
            <div className="font-semibold text-gray-200">{user.name}</div>
            <div className="mt-1">{roleLabel(user.role)}</div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
          <div className="text-[10px] text-gray-500">Haajir Stationery v1.0</div>
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
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/" element={<ProtectedRoute allowedRoles={['admin','manager','sales']}><DashboardPage /></ProtectedRoute>} />
            <Route path="/pos" element={<ProtectedRoute allowedRoles={['admin','manager','sales']}><POSPage /></ProtectedRoute>} />
            <Route path="/products" element={<ProtectedRoute allowedRoles={['admin','manager']}><ProductsPage /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute allowedRoles={['admin','manager','sales']}><CustomersPage /></ProtectedRoute>} />
            <Route path="/expenses" element={<ProtectedRoute allowedRoles={['admin','manager']}><ExpensesPage /></ProtectedRoute>} />
            <Route path="/suppliers" element={<ProtectedRoute allowedRoles={['admin','manager']}><SuppliersPage /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute allowedRoles={['admin','manager','sales']}><ReportsPage /></ProtectedRoute>} />
            <Route path="/money" element={<ProtectedRoute allowedRoles={['admin','manager']}><MoneyPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute allowedRoles={['admin']}><SettingsPage /></ProtectedRoute>} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
