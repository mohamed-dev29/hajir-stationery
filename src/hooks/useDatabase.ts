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

import {
  fetchTable,
  upsertMany,
  deleteById,
  notifySupabaseDataChanged,
  onSupabaseDataChanged,
} from "@/lib/dbAdapter";

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

function useRemoteArrayState<T>(table: string, initialValue: T[] = []) {
  const [value, setValue] = useState<T[]>(initialValue);

  const load = useCallback(async () => {
    const remote = await fetchTable<T>(table);
    setValue(remote);
  }, [table]);

  useEffect(() => {
    void load();
    return onSupabaseDataChanged((changedTable) => {
      if (changedTable === table) void load();
    });
  }, [load, table]);

  return [value, setValue, load] as const;
}

function useRemoteSingletonState<T>(table: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);

  const load = useCallback(async () => {
    const remote = await fetchTable<T>(table);
    if (remote.length > 0) {
      setValue(remote[0]);
    }
  }, [table]);

  useEffect(() => {
    void load();
    return onSupabaseDataChanged((changedTable) => {
      if (changedTable === table) void load();
    });
  }, [load, table]);

  return [value, setValue, load] as const;
}

// ---- Categories ----
export function useCategories() {
  const [categories, setCategories] = useRemoteArrayState<Category>(TABLE_MAP.categories, []);

  const addCategory = useCallback((cat: Omit<Category, "id" | "createdAt">) => {
    const newCat: Category = {
      ...cat,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setCategories((prev) => [...prev, newCat]);
    void (async () => {
      await upsertMany(TABLE_MAP.categories, [newCat]);
      notifySupabaseDataChanged(TABLE_MAP.categories);
    })();
    return newCat;
  }, []);

  const updateCategory = useCallback(
    (id: string, updates: Partial<Category>) => {
      let updatedCategory: Category | null = null;
      setCategories((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          updatedCategory = { ...c, ...updates };
          return updatedCategory;
        }),
      );
      if (updatedCategory) {
        void (async () => {
          await upsertMany(TABLE_MAP.categories, [updatedCategory!]);
          notifySupabaseDataChanged(TABLE_MAP.categories);
        })();
      }
    },
    [],
  );

  const deleteCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    void (async () => {
      await deleteById(TABLE_MAP.categories, id);
      notifySupabaseDataChanged(TABLE_MAP.categories);
      notifySupabaseDataChanged(TABLE_MAP.products);
    })();
  }, []);

  return { categories, addCategory, updateCategory, deleteCategory };
}

// ---- Products ----
export function useProducts() {
  const [products, setProducts] = useRemoteArrayState<Product>(TABLE_MAP.products, []);

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
      void (async () => {
        await upsertMany(TABLE_MAP.products, [newProd]);
        notifySupabaseDataChanged(TABLE_MAP.products);
      })();
      return newProd;
    },
    [],
  );

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    let updatedProduct: Product | null = null;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        updatedProduct = { ...p, ...updates, updatedAt: new Date().toISOString() };
        return updatedProduct;
      }),
    );
    if (updatedProduct) {
      void (async () => {
        await upsertMany(TABLE_MAP.products, [updatedProduct!]);
        notifySupabaseDataChanged(TABLE_MAP.products);
      })();
    }
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    void (async () => {
      await deleteById(TABLE_MAP.products, id);
      const sales = await fetchTable<Sale>(TABLE_MAP.sales);
      const removedSaleIds = sales
        .filter((sale) => sale.items.some((item) => item.productId === id))
        .map((sale) => sale.id);
      await Promise.all(removedSaleIds.map((saleId) => deleteById(TABLE_MAP.sales, saleId)));
      notifySupabaseDataChanged(TABLE_MAP.products);
      if (removedSaleIds.length > 0) notifySupabaseDataChanged(TABLE_MAP.sales);
    })();
  }, []);

  return { products, addProduct, updateProduct, deleteProduct };
}

// ---- Sales ----
export function useSales() {
  const [sales, setSales] = useRemoteArrayState<Sale>(TABLE_MAP.sales, []);

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

      void (async () => {
        await upsertMany(TABLE_MAP.sales, [newSale]);

        if (sale.customerPhone || sale.customerName) {
          const customers = await fetchTable<Customer>(TABLE_MAP.customers);
          const existingIndex = customers.findIndex(
            (customer) => sale.customerPhone && customer.phone === sale.customerPhone,
          );
          if (existingIndex >= 0) {
            customers[existingIndex] = {
              ...customers[existingIndex],
              totalPurchases: customers[existingIndex].totalPurchases + 1,
              totalSpent: customers[existingIndex].totalSpent + sale.total,
              lastPurchaseDate: new Date().toISOString(),
            };
            await upsertMany(TABLE_MAP.customers, [customers[existingIndex]]);
          } else if (sale.customerName) {
            const newCustomer: Customer = {
              id: generateId(),
              name: sale.customerName,
              phone: sale.customerPhone || "",
              email: "",
              address: "",
              totalPurchases: 1,
              totalSpent: sale.total,
              lastPurchaseDate: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            };
            await upsertMany(TABLE_MAP.customers, [newCustomer]);
          }
          notifySupabaseDataChanged(TABLE_MAP.customers);
        }

        const products = await fetchTable<Product>(TABLE_MAP.products);
        const changedProducts = products
          .map((product) => {
            const soldItem = sale.items.find((item) => item.productId === product.id);
            if (!soldItem) return null;
            return { ...product, stock: Math.max(0, product.stock - soldItem.quantity) };
          })
          .filter((product): product is Product => product !== null);
        if (changedProducts.length > 0) {
          await upsertMany(TABLE_MAP.products, changedProducts);
          notifySupabaseDataChanged(TABLE_MAP.products);
        }

        const accounts = await fetchTable<MoneyAccount>(TABLE_MAP.moneyAccounts);
        const cashAccount = accounts.find((account) => account.type === "cash");
        if (cashAccount) {
          const updatedAccount = { ...cashAccount, balance: cashAccount.balance + sale.total };
          const transaction: MoneyTransaction = {
            id: generateId(),
            accountId: cashAccount.id,
            type: "income",
            amount: sale.total,
            description: `Sale ${receiptNumber}`,
            category: "Sales",
            date: new Date().toISOString().split("T")[0],
            reference: receiptNumber,
            createdAt: new Date().toISOString(),
          };
          await upsertMany(TABLE_MAP.moneyAccounts, [updatedAccount]);
          await upsertMany(TABLE_MAP.moneyTransactions, [transaction]);
          notifySupabaseDataChanged(TABLE_MAP.moneyAccounts);
          notifySupabaseDataChanged(TABLE_MAP.moneyTransactions);
        }

        notifySupabaseDataChanged(TABLE_MAP.sales);
      })();

      return newSale;
    },
    [],
  );

  const deleteSale = useCallback((id: string) => {
    setSales((prev) => prev.filter((s) => s.id !== id));
    void (async () => {
      await deleteById(TABLE_MAP.sales, id);
      notifySupabaseDataChanged(TABLE_MAP.sales);
    })();
  }, []);

  return { sales, addSale, deleteSale };
}

// ---- Customers ----
export function useCustomers() {
  const [customers, setCustomers] = useRemoteArrayState<Customer>(TABLE_MAP.customers, []);

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
      void (async () => {
        await upsertMany(TABLE_MAP.customers, [newCust]);
        notifySupabaseDataChanged(TABLE_MAP.customers);
      })();
      return newCust;
    },
    [],
  );

  const updateCustomer = useCallback(
    (id: string, updates: Partial<Customer>) => {
      let updatedCustomer: Customer | null = null;
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          updatedCustomer = { ...c, ...updates };
          return updatedCustomer;
        }),
      );
      if (updatedCustomer) {
        void (async () => {
          await upsertMany(TABLE_MAP.customers, [updatedCustomer!]);
          notifySupabaseDataChanged(TABLE_MAP.customers);
        })();
      }
    },
    [],
  );

  const deleteCustomer = useCallback((id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    void (async () => {
      await deleteById(TABLE_MAP.customers, id);
      notifySupabaseDataChanged(TABLE_MAP.customers);
    })();
  }, []);

  return { customers, addCustomer, updateCustomer, deleteCustomer };
}

// ---- Expenses ----
export function useExpenses() {
  const [expenses, setExpenses] = useRemoteArrayState<Expense>(TABLE_MAP.expenses, []);

  const addExpense = useCallback((exp: Omit<Expense, "id" | "createdAt">) => {
    const newExp: Expense = {
      ...exp,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [newExp, ...prev]);
    void (async () => {
      await upsertMany(TABLE_MAP.expenses, [newExp]);

      const accounts = await fetchTable<MoneyAccount>(TABLE_MAP.moneyAccounts);
      const cashAccount = accounts.find((account) => account.type === "cash");
      if (cashAccount) {
        const updatedAccount = { ...cashAccount, balance: cashAccount.balance - exp.amount };
        const transaction: MoneyTransaction = {
          id: generateId(),
          accountId: cashAccount.id,
          type: "expense",
          amount: exp.amount,
          description: exp.title,
          category: exp.category,
          date: exp.date,
          reference: `EXP-${Date.now().toString(36).toUpperCase()}`,
          createdAt: new Date().toISOString(),
        };
        await upsertMany(TABLE_MAP.moneyAccounts, [updatedAccount]);
        await upsertMany(TABLE_MAP.moneyTransactions, [transaction]);
        notifySupabaseDataChanged(TABLE_MAP.moneyAccounts);
        notifySupabaseDataChanged(TABLE_MAP.moneyTransactions);
      }

      notifySupabaseDataChanged(TABLE_MAP.expenses);
    })();

    return newExp;
  }, []);

  const updateExpense = useCallback((id: string, updates: Partial<Expense>) => {
    let updatedExpense: Expense | null = null;
    setExpenses((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        updatedExpense = { ...e, ...updates };
        return updatedExpense;
      }),
    );
    if (updatedExpense) {
      void (async () => {
        await upsertMany(TABLE_MAP.expenses, [updatedExpense!]);
        notifySupabaseDataChanged(TABLE_MAP.expenses);
      })();
    }
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    void (async () => {
      await deleteById(TABLE_MAP.expenses, id);
      notifySupabaseDataChanged(TABLE_MAP.expenses);
    })();
  }, []);

  return { expenses, addExpense, updateExpense, deleteExpense };
}

// ---- Suppliers ----
export function useSuppliers() {
  const [suppliers, setSuppliers] = useRemoteArrayState<Supplier>(TABLE_MAP.suppliers, []);

  const addSupplier = useCallback(
    (sup: Omit<Supplier, "id" | "createdAt" | "totalSupplies">) => {
      const newSup: Supplier = {
        ...sup,
        id: generateId(),
        totalSupplies: 0,
        createdAt: new Date().toISOString(),
      };
      setSuppliers((prev) => [...prev, newSup]);
      void (async () => {
        await upsertMany(TABLE_MAP.suppliers, [newSup]);
        notifySupabaseDataChanged(TABLE_MAP.suppliers);
      })();
      return newSup;
    },
    [],
  );

  const updateSupplier = useCallback(
    (id: string, updates: Partial<Supplier>) => {
      let updatedSupplier: Supplier | null = null;
      setSuppliers((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          updatedSupplier = { ...s, ...updates };
          return updatedSupplier;
        }),
      );
      if (updatedSupplier) {
        void (async () => {
          await upsertMany(TABLE_MAP.suppliers, [updatedSupplier!]);
          notifySupabaseDataChanged(TABLE_MAP.suppliers);
        })();
      }
    },
    [],
  );

  const deleteSupplier = useCallback((id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    void (async () => {
      await deleteById(TABLE_MAP.suppliers, id);
      notifySupabaseDataChanged(TABLE_MAP.suppliers);
    })();
  }, []);

  return { suppliers, addSupplier, updateSupplier, deleteSupplier };
}

// ---- Feedback ----
export function useFeedback() {
  const [feedback, setFeedback] = useRemoteArrayState<Feedback>(TABLE_MAP.feedback, []);

  const addFeedback = useCallback((fb: Omit<Feedback, "id" | "createdAt">) => {
    const newFb: Feedback = {
      ...fb,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setFeedback((prev) => [newFb, ...prev]);
    void (async () => {
      await upsertMany(TABLE_MAP.feedback, [newFb]);
      notifySupabaseDataChanged(TABLE_MAP.feedback);
    })();
    return newFb;
  }, []);

  const deleteFeedback = useCallback((id: string) => {
    setFeedback((prev) => prev.filter((f) => f.id !== id));
    void (async () => {
      await deleteById(TABLE_MAP.feedback, id);
      notifySupabaseDataChanged(TABLE_MAP.feedback);
    })();
  }, []);

  return { feedback, addFeedback, deleteFeedback };
}

// ---- Money Accounts ----
export function useMoneyAccounts() {
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
  const [accounts, setAccounts] = useRemoteArrayState<MoneyAccount>(TABLE_MAP.moneyAccounts, defaultAccounts);

  const addAccount = useCallback(
    (acc: Omit<MoneyAccount, "id" | "createdAt">) => {
      const newAcc: MoneyAccount = {
        ...acc,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      setAccounts((prev) => [...prev, newAcc]);
      void (async () => {
        await upsertMany(TABLE_MAP.moneyAccounts, [newAcc]);
        notifySupabaseDataChanged(TABLE_MAP.moneyAccounts);
      })();
      return newAcc;
    },
    [],
  );

  const updateAccount = useCallback(
    (id: string, updates: Partial<MoneyAccount>) => {
      let updatedAccount: MoneyAccount | null = null;
      setAccounts((prev) =>
        prev.map((a) => {
          if (a.id !== id) return a;
          updatedAccount = { ...a, ...updates };
          return updatedAccount;
        }),
      );
      if (updatedAccount) {
        void (async () => {
          await upsertMany(TABLE_MAP.moneyAccounts, [updatedAccount!]);
          notifySupabaseDataChanged(TABLE_MAP.moneyAccounts);
        })();
      }
    },
    [],
  );

  const deleteAccount = useCallback((id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    void (async () => {
      await deleteById(TABLE_MAP.moneyAccounts, id);
      notifySupabaseDataChanged(TABLE_MAP.moneyAccounts);
      notifySupabaseDataChanged(TABLE_MAP.moneyTransactions);
    })();
  }, []);

  return { accounts, addAccount, updateAccount, deleteAccount };
}

// ---- Money Transactions ----
export function useMoneyTransactions() {
  const [transactions, setTransactions] = useRemoteArrayState<MoneyTransaction>(TABLE_MAP.moneyTransactions, []);

  const addTransaction = useCallback(
    (tx: Omit<MoneyTransaction, "id" | "createdAt">) => {
      const newTx: MoneyTransaction = {
        ...tx,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      setTransactions((prev) => [newTx, ...prev]);
      void (async () => {
        await upsertMany(TABLE_MAP.moneyTransactions, [newTx]);

        const accounts = await fetchTable<MoneyAccount>(TABLE_MAP.moneyAccounts);
        const account = accounts.find((entry) => entry.id === tx.accountId);
        if (account) {
          const updatedAccount = {
            ...account,
            balance:
              tx.type === "income"
                ? account.balance + tx.amount
                : tx.type === "expense"
                  ? account.balance - tx.amount
                  : account.balance,
          };
          await upsertMany(TABLE_MAP.moneyAccounts, [updatedAccount]);
          notifySupabaseDataChanged(TABLE_MAP.moneyAccounts);
        }

        notifySupabaseDataChanged(TABLE_MAP.moneyTransactions);
      })();

      return newTx;
    },
    [],
  );

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    void (async () => {
      await deleteById(TABLE_MAP.moneyTransactions, id);
      notifySupabaseDataChanged(TABLE_MAP.moneyTransactions);
    })();
  }, []);

  return { transactions, addTransaction, deleteTransaction };
}

// ---- User Profile ----
export function useUserProfile() {
  const [profile, setProfile] = useRemoteSingletonState<UserProfile>(TABLE_MAP.userProfile, {
    name: "",
    email: "",
    phone: "+251 92 923 2959",
    businessName: "Haajir Stationery",
    address: "",
  });

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      void (async () => {
        await upsertMany(TABLE_MAP.userProfile, [next]);
        notifySupabaseDataChanged(TABLE_MAP.userProfile);
      })();
      return next;
    });
  }, []);

  return { profile, updateProfile };
}

// ---- Analytics ----
export function useAnalytics() {
  const [sales] = useRemoteArrayState<Sale>(TABLE_MAP.sales, []);
  const [expenses] = useRemoteArrayState<Expense>(TABLE_MAP.expenses, []);
  const [products] = useRemoteArrayState<Product>(TABLE_MAP.products, []);
  const [customers] = useRemoteArrayState<Customer>(TABLE_MAP.customers, []);
  const [suppliers] = useRemoteArrayState<Supplier>(TABLE_MAP.suppliers, []);

  const getSalesByDateRange = useCallback((range: string): Sale[] => {
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
