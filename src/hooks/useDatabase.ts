import { useState, useEffect, useCallback } from "react";
import type {
  Product,
  Category,
  Sale,
  Customer,
  Expense,
  Supplier,
  Feedback,
  MoneyAccount,
  MoneyTransaction,
  UserProfile,
} from "@/types";

const DB_KEYS = {
  products: "haajir_products",
  categories: "haajir_categories",
  sales: "haajir_sales",
  customers: "haajir_customers",
  expenses: "haajir_expenses",
  suppliers: "haajir_suppliers",
  feedback: "haajir_feedback",
  moneyAccounts: "haajir_money_accounts",
  moneyTransactions: "haajir_money_transactions",
  userProfile: "haajir_user_profile",
} as const;

import { getItem, setItem, fetchTable, upsertMany } from "@/lib/dbAdapter";

const TABLE_MAP: Record<keyof typeof DB_KEYS, string> = {
  products: 'products',
  categories: 'categories',
  sales: 'sales',
  customers: 'customers',
  expenses: 'expenses',
  suppliers: 'suppliers',
  feedback: 'feedback',
  moneyAccounts: 'money_accounts',
  moneyTransactions: 'money_transactions',
  userProfile: 'user_profile',
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ---- Categories ----
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(() =>
    getItem(DB_KEYS.categories, []),
  );

  // fetch remote categories on mount if available
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const remote = await fetchTable<Category>(TABLE_MAP.categories);
        if (mounted && remote && remote.length > 0) {
          setCategories(remote);
          setItem(DB_KEYS.categories, remote);
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setItem(DB_KEYS.categories, categories);
    (async () => { try { await upsertMany(TABLE_MAP.categories, categories); } catch {} })();
  }, [categories]);

  const addCategory = useCallback((cat: Omit<Category, "id" | "createdAt">) => {
    const newCat: Category = {
      ...cat,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setCategories((prev) => [...prev, newCat]);
    return newCat;
  }, []);

  const updateCategory = useCallback(
    (id: string, updates: Partial<Category>) => {
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      );
    },
    [],
  );

  const deleteCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    const products = getItem<Product[]>(DB_KEYS.products, []);
    setItem(
      DB_KEYS.products,
      products.filter((p) => p.categoryId !== id),
    );
  }, []);

  return { categories, addCategory, updateCategory, deleteCategory };
}

// ---- Products ----
export function useProducts() {
  const [products, setProducts] = useState<Product[]>(() =>
    getItem(DB_KEYS.products, []),
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const remote = await fetchTable<Product>(TABLE_MAP.products);
        if (mounted && remote && remote.length > 0) {
          setProducts(remote);
          setItem(DB_KEYS.products, remote);
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setItem(DB_KEYS.products, products);
    (async () => { try { await upsertMany(TABLE_MAP.products, products); } catch {} })();
  }, [products]);

  const addProduct = useCallback(
    (prod: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString();
      const newProd: Product = {
        ...prod,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      setProducts((prev) => [...prev, newProd]);
      return newProd;
    },
    [],
  );

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, ...updates, updatedAt: new Date().toISOString() }
          : p,
      ),
    );
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    const sales = getItem<Sale[]>(DB_KEYS.sales, []);
    setItem(
      DB_KEYS.sales,
      sales.filter((s) => s.items.every((i) => i.productId !== id)),
    );
  }, []);

  return { products, addProduct, updateProduct, deleteProduct };
}

// ---- Sales ----
export function useSales() {
  const [sales, setSales] = useState<Sale[]>(() => getItem(DB_KEYS.sales, []));

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const remote = await fetchTable<Sale>(TABLE_MAP.sales);
        if (mounted && remote && remote.length > 0) {
          setSales(remote);
          setItem(DB_KEYS.sales, remote);
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setItem(DB_KEYS.sales, sales);
    (async () => { try { await upsertMany(TABLE_MAP.sales, sales); } catch {} })();
  }, [sales]);

  const addSale = useCallback(
    (sale: Omit<Sale, "id" | "createdAt" | "receiptNumber">) => {
      const receiptNumber = `REC-${Date.now().toString(36).toUpperCase()}`;
      const newSale: Sale = {
        ...sale,
        id: generateId(),
        createdAt: new Date().toISOString(),
        receiptNumber,
      };
      setSales((prev) => [newSale, ...prev]);

      // Update customer if exists
      if (sale.customerPhone || sale.customerName) {
        const customers = getItem<Customer[]>(DB_KEYS.customers, []);
        const existingIndex = customers.findIndex(
          (c) => sale.customerPhone && c.phone === sale.customerPhone,
        );
        if (existingIndex >= 0) {
          customers[existingIndex].totalPurchases += 1;
          customers[existingIndex].totalSpent += sale.total;
          customers[existingIndex].lastPurchaseDate = new Date().toISOString();
        } else if (sale.customerName) {
          customers.push({
            id: generateId(),
            name: sale.customerName,
            phone: sale.customerPhone || "",
            email: "",
            address: "",
            totalPurchases: 1,
            totalSpent: sale.total,
            lastPurchaseDate: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          });
        }
        setItem(DB_KEYS.customers, customers);
      }

      // Update product stock
      const products = getItem<Product[]>(DB_KEYS.products, []);
      const updatedProducts = products.map((p) => {
        const soldItem = sale.items.find((i) => i.productId === p.id);
        if (soldItem) {
          return { ...p, stock: Math.max(0, p.stock - soldItem.quantity) };
        }
        return p;
      });
      setItem(DB_KEYS.products, updatedProducts);

      // Add money transaction
      const accounts = getItem<MoneyAccount[]>(DB_KEYS.moneyAccounts, []);
      const cashAccount = accounts.find((a) => a.type === "cash");
      if (cashAccount) {
        const transactions = getItem<MoneyTransaction[]>(
          DB_KEYS.moneyTransactions,
          [],
        );
        transactions.push({
          id: generateId(),
          accountId: cashAccount.id,
          type: "income",
          amount: sale.total,
          description: `Sale ${receiptNumber}`,
          category: "Sales",
          date: new Date().toISOString().split("T")[0],
          reference: receiptNumber,
          createdAt: new Date().toISOString(),
        });
        cashAccount.balance += sale.total;
        setItem(DB_KEYS.moneyAccounts, accounts);
        setItem(DB_KEYS.moneyTransactions, transactions);
      }

      return newSale;
    },
    [],
  );

  const deleteSale = useCallback((id: string) => {
    setSales((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { sales, addSale, deleteSale };
}

// ---- Customers ----
export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>(() =>
    getItem(DB_KEYS.customers, []),
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const remote = await fetchTable<Customer>(TABLE_MAP.customers);
        if (mounted && remote && remote.length > 0) {
          setCustomers(remote);
          setItem(DB_KEYS.customers, remote);
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setItem(DB_KEYS.customers, customers);
    (async () => { try { await upsertMany(TABLE_MAP.customers, customers); } catch {} })();
  }, [customers]);

  const addCustomer = useCallback(
    (
      cust: Omit<
        Customer,
        | "id"
        | "createdAt"
        | "totalPurchases"
        | "totalSpent"
        | "lastPurchaseDate"
      >,
    ) => {
      const newCust: Customer = {
        ...cust,
        id: generateId(),
        totalPurchases: 0,
        totalSpent: 0,
        lastPurchaseDate: "",
        createdAt: new Date().toISOString(),
      };
      setCustomers((prev) => [...prev, newCust]);
      return newCust;
    },
    [],
  );

  const updateCustomer = useCallback(
    (id: string, updates: Partial<Customer>) => {
      setCustomers((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      );
    },
    [],
  );

  const deleteCustomer = useCallback((id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { customers, addCustomer, updateCustomer, deleteCustomer };
}

// ---- Expenses ----
export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>(() =>
    getItem(DB_KEYS.expenses, []),
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const remote = await fetchTable<Expense>(TABLE_MAP.expenses);
        if (mounted && remote && remote.length > 0) {
          setExpenses(remote);
          setItem(DB_KEYS.expenses, remote);
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setItem(DB_KEYS.expenses, expenses);
    (async () => { try { await upsertMany(TABLE_MAP.expenses, expenses); } catch {} })();
  }, [expenses]);

  const addExpense = useCallback((exp: Omit<Expense, "id" | "createdAt">) => {
    const newExp: Expense = {
      ...exp,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [newExp, ...prev]);

    // Deduct from cash account
    const accounts = getItem<MoneyAccount[]>(DB_KEYS.moneyAccounts, []);
    const cashAccount = accounts.find((a) => a.type === "cash");
    if (cashAccount) {
      const transactions = getItem<MoneyTransaction[]>(
        DB_KEYS.moneyTransactions,
        [],
      );
      transactions.push({
        id: generateId(),
        accountId: cashAccount.id,
        type: "expense",
        amount: exp.amount,
        description: exp.title,
        category: exp.category,
        date: exp.date,
        reference: `EXP-${Date.now().toString(36).toUpperCase()}`,
        createdAt: new Date().toISOString(),
      });
      cashAccount.balance -= exp.amount;
      setItem(DB_KEYS.moneyAccounts, accounts);
      setItem(DB_KEYS.moneyTransactions, transactions);
    }

    return newExp;
  }, []);

  const updateExpense = useCallback((id: string, updates: Partial<Expense>) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    );
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { expenses, addExpense, updateExpense, deleteExpense };
}

// ---- Suppliers ----
export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(() =>
    getItem(DB_KEYS.suppliers, []),
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const remote = await fetchTable<Supplier>(TABLE_MAP.suppliers);
        if (mounted && remote && remote.length > 0) {
          setSuppliers(remote);
          setItem(DB_KEYS.suppliers, remote);
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setItem(DB_KEYS.suppliers, suppliers);
    (async () => { try { await upsertMany(TABLE_MAP.suppliers, suppliers); } catch {} })();
  }, [suppliers]);

  const addSupplier = useCallback(
    (sup: Omit<Supplier, "id" | "createdAt" | "totalSupplies">) => {
      const newSup: Supplier = {
        ...sup,
        id: generateId(),
        totalSupplies: 0,
        createdAt: new Date().toISOString(),
      };
      setSuppliers((prev) => [...prev, newSup]);
      return newSup;
    },
    [],
  );

  const updateSupplier = useCallback(
    (id: string, updates: Partial<Supplier>) => {
      setSuppliers((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      );
    },
    [],
  );

  const deleteSupplier = useCallback((id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { suppliers, addSupplier, updateSupplier, deleteSupplier };
}

// ---- Feedback ----
export function useFeedback() {
  const [feedback, setFeedback] = useState<Feedback[]>(() =>
    getItem(DB_KEYS.feedback, []),
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const remote = await fetchTable<Feedback>(TABLE_MAP.feedback);
        if (mounted && remote && remote.length > 0) {
          setFeedback(remote);
          setItem(DB_KEYS.feedback, remote);
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setItem(DB_KEYS.feedback, feedback);
    (async () => { try { await upsertMany(TABLE_MAP.feedback, feedback); } catch {} })();
  }, [feedback]);

  const addFeedback = useCallback((fb: Omit<Feedback, "id" | "createdAt">) => {
    const newFb: Feedback = {
      ...fb,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setFeedback((prev) => [newFb, ...prev]);
    return newFb;
  }, []);

  const deleteFeedback = useCallback((id: string) => {
    setFeedback((prev) => prev.filter((f) => f.id !== id));
  }, []);

  return { feedback, addFeedback, deleteFeedback };
}

// ---- Money Accounts ----
export function useMoneyAccounts() {
  const [accounts, setAccounts] = useState<MoneyAccount[]>(() => {
    const stored = getItem<MoneyAccount[]>(DB_KEYS.moneyAccounts, []);
    if (stored.length === 0) {
      const defaultAccounts: MoneyAccount[] = [
        {
          id: generateId(),
          name: "Cash in Hand",
          type: "cash",
          balance: 0,
          description: "Main cash register",
          createdAt: new Date().toISOString(),
        },
        {
          id: generateId(),
          name: "Bank Account",
          type: "bank",
          balance: 0,
          description: "Primary bank account",
          createdAt: new Date().toISOString(),
        },
        {
          id: generateId(),
          name: "Mobile Money",
          type: "mobile",
          balance: 0,
          description: "Mobile payment wallet",
          createdAt: new Date().toISOString(),
        },
      ];
      setItem(DB_KEYS.moneyAccounts, defaultAccounts);
      return defaultAccounts;
    }
    return stored;
  });

  useEffect(() => {
    setItem(DB_KEYS.moneyAccounts, accounts);
    (async () => { try { await upsertMany(TABLE_MAP.moneyAccounts, accounts); } catch {} })();
  }, [accounts]);

  const addAccount = useCallback(
    (acc: Omit<MoneyAccount, "id" | "createdAt">) => {
      const newAcc: MoneyAccount = {
        ...acc,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      setAccounts((prev) => [...prev, newAcc]);
      return newAcc;
    },
    [],
  );

  const updateAccount = useCallback(
    (id: string, updates: Partial<MoneyAccount>) => {
      setAccounts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...updates } : a)),
      );
    },
    [],
  );

  const deleteAccount = useCallback((id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return { accounts, addAccount, updateAccount, deleteAccount };
}

// ---- Money Transactions ----
export function useMoneyTransactions() {
  const [transactions, setTransactions] = useState<MoneyTransaction[]>(() =>
    getItem(DB_KEYS.moneyTransactions, []),
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const remote = await fetchTable<MoneyTransaction>(TABLE_MAP.moneyTransactions);
        if (mounted && remote && remote.length > 0) {
          setTransactions(remote);
          setItem(DB_KEYS.moneyTransactions, remote);
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setItem(DB_KEYS.moneyTransactions, transactions);
    (async () => { try { await upsertMany(TABLE_MAP.moneyTransactions, transactions); } catch {} })();
  }, [transactions]);

  const addTransaction = useCallback(
    (tx: Omit<MoneyTransaction, "id" | "createdAt">) => {
      const newTx: MoneyTransaction = {
        ...tx,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      setTransactions((prev) => [newTx, ...prev]);

      // Update account balance
      const accounts = getItem<MoneyAccount[]>(DB_KEYS.moneyAccounts, []);
      const account = accounts.find((a) => a.id === tx.accountId);
      if (account) {
        if (tx.type === "income") account.balance += tx.amount;
        else if (tx.type === "expense") account.balance -= tx.amount;
        setItem(DB_KEYS.moneyAccounts, accounts);
      }

      return newTx;
    },
    [],
  );

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { transactions, addTransaction, deleteTransaction };
}

// ---- User Profile ----
export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile>(() =>
    getItem(DB_KEYS.userProfile, {
      name: "",
      email: "",
      phone: "+251 92 923 2959",
      businessName: "Haajir Stationery",
      address: "",
    }),
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const remote = await fetchTable<UserProfile>(TABLE_MAP.userProfile);
        if (mounted && remote && remote.length > 0) {
          setProfile(remote[0] as UserProfile);
          setItem(DB_KEYS.userProfile, remote[0]);
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setItem(DB_KEYS.userProfile, profile);
    (async () => { try { await upsertMany(TABLE_MAP.userProfile, [profile]); } catch {} })();
  }, [profile]);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  }, []);

  return { profile, updateProfile };
}

// ---- Analytics ----
export function useAnalytics() {
  const getSalesByDateRange = useCallback((range: string): Sale[] => {
    const sales = getItem<Sale[]>(DB_KEYS.sales, []);
    const now = new Date();
    const start = new Date();

    switch (range) {
      case "today":
        start.setHours(0, 0, 0, 0);
        break;
      case "week":
        start.setDate(now.getDate() - 7);
        break;
      case "month":
        start.setMonth(now.getMonth() - 1);
        break;
      case "year":
        start.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return sales;
    }

    return sales.filter((s) => new Date(s.createdAt) >= start);
  }, []);

  const getKPIs = useCallback(() => {
    const sales = getItem<Sale[]>(DB_KEYS.sales, []);
    const expenses = getItem<Expense[]>(DB_KEYS.expenses, []);
    const products = getItem<Product[]>(DB_KEYS.products, []);
    const customers = getItem<Customer[]>(DB_KEYS.customers, []);
    const suppliers = getItem<Supplier[]>(DB_KEYS.suppliers, []);

    const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalSales - totalExpenses;
    const lowStockCount = products.filter((p) => p.stock < 10).length;
    const avgOrderValue = sales.length > 0 ? totalSales / sales.length : 0;

    return {
      totalSales,
      totalExpenses,
      netProfit,
      totalProducts: products.length,
      lowStockCount,
      totalCustomers: customers.length,
      totalSuppliers: suppliers.length,
      averageOrderValue: avgOrderValue,
    };
  }, []);

  const getSalesChartData = useCallback(
    (range: string) => {
      const sales = getSalesByDateRange(range);
      const data: Record<
        string,
        { name: string; sales: number; expenses: number; profit: number }
      > = {};

      sales.forEach((s) => {
        const date = new Date(s.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        if (!data[date])
          data[date] = { name: date, sales: 0, expenses: 0, profit: 0 };
        data[date].sales += s.total;
        data[date].profit +=
          s.total -
          s.items.reduce((sum, i) => sum + i.unitPrice * 0.6 * i.quantity, 0);
      });

      const expenses = getItem<Expense[]>(DB_KEYS.expenses, []);
      expenses.forEach((e) => {
        const date = new Date(e.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        if (!data[date])
          data[date] = { name: date, sales: 0, expenses: 0, profit: 0 };
        data[date].expenses += e.amount;
        data[date].profit -= e.amount;
      });

      return Object.values(data).slice(-30);
    },
    [getSalesByDateRange],
  );

  const getTopProducts = useCallback(() => {
    const sales = getItem<Sale[]>(DB_KEYS.sales, []);
    const productSales: Record<
      string,
      { name: string; quantity: number; revenue: number }
    > = {};

    sales.forEach((s) => {
      s.items.forEach((i) => {
        if (!productSales[i.productName]) {
          productSales[i.productName] = {
            name: i.productName,
            quantity: 0,
            revenue: 0,
          };
        }
        productSales[i.productName].quantity += i.quantity;
        productSales[i.productName].revenue += i.totalPrice;
      });
    });

    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, []);

  const getRecentSales = useCallback((limit = 10) => {
    const sales = getItem<Sale[]>(DB_KEYS.sales, []);
    return sales.slice(0, limit);
  }, []);

  return {
    getSalesByDateRange,
    getKPIs,
    getSalesChartData,
    getTopProducts,
    getRecentSales,
  };
}
