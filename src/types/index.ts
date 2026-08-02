export interface Category {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  price: number;
  costPrice: number;
  stock: number;
  barcode: string;
  image: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  cashPaid: number;
  change: number;
  customerName: string;
  customerPhone: string;
  paymentMethod: "cash" | "card" | "transfer";
  createdAt: string;
  receiptNumber: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  totalPurchases: number;
  totalSpent: number;
  lastPurchaseDate: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  paymentMethod: "cash" | "card" | "transfer";
  description: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  products: string[];
  totalSupplies: number;
  createdAt: string;
}

export interface Feedback {
  id: string;
  customerName: string;
  customerPhone: string;
  rating: number;
  comment: string;
  category: "product" | "service" | "delivery" | "other";
  createdAt: string;
}

export interface MoneyAccount {
  id: string;
  name: string;
  type: "cash" | "bank" | "mobile";
  balance: number;
  description: string;
  createdAt: string;
}

export interface MoneyTransaction {
  id: string;
  accountId: string;
  type: "income" | "expense" | "transfer";
  amount: number;
  description: string;
  category: string;
  date: string;
  reference: string;
  createdAt: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  businessName: string;
  address: string;
}

export type UserRole = "admin" | "manager" | "sales";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export type DateRange = "today" | "week" | "month" | "year" | "all";

export interface DashboardKPI {
  totalSales: number;
  totalExpenses: number;
  netProfit: number;
  totalProducts: number;
  lowStockCount: number;
  totalCustomers: number;
  totalSuppliers: number;
  averageOrderValue: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  sales?: number;
  expenses?: number;
  profit?: number;
}
