import { useState } from 'react';
import {
  Wallet, Plus, Pencil, Trash2, ArrowDownLeft, ArrowUpRight,
  Landmark, Smartphone, Banknote, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { useMoneyAccounts, useMoneyTransactions } from '@/hooks/useDatabase';
import { toast } from 'sonner';
import type { MoneyAccount } from '@/types';

const accountTypeIcons: Record<string, any> = {
  cash: Banknote,
  bank: Landmark,
  mobile: Smartphone,
};

const accountTypeLabels: Record<string, string> = {
  cash: 'Cash',
  bank: 'Bank Account',
  mobile: 'Mobile Money',
};

export default function MoneyPage() {
  const { accounts, addAccount, updateAccount, deleteAccount } = useMoneyAccounts();
  const { transactions, addTransaction, deleteTransaction } = useMoneyTransactions();
  const [tab, setTab] = useState<'accounts' | 'transactions'>('accounts');
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editAccount, setEditAccount] = useState<MoneyAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'account' | 'transaction'; id: string } | null>(null);

  // Account form
  const [aName, setAName] = useState('');
  const [aType, setAType] = useState<'cash' | 'bank' | 'mobile'>('cash');
  const [aBalance, setABalance] = useState('');
  const [aDesc, setADesc] = useState('');

  // Transaction form
  const [tAccount, setTAccount] = useState('');
  const [tType, setTType] = useState<'income' | 'expense' | 'transfer'>('income');
  const [tAmount, setTAmount] = useState('');
  const [tDesc, setTDesc] = useState('');
  const [tCategory, setTCategory] = useState('');
  const [tDate, setTDate] = useState(new Date().toISOString().split('T')[0]);

  const openAccountForm = (account?: MoneyAccount) => {
    if (account) {
      setEditAccount(account);
      setAName(account.name);
      setAType(account.type);
      setABalance(account.balance.toString());
      setADesc(account.description);
    } else {
      setEditAccount(null);
      setAName('');
      setAType('cash');
      setABalance('');
      setADesc('');
    }
    setShowAccountForm(true);
  };

  const saveAccount = () => {
    if (!aName) {
      toast.error('Account name is required');
      return;
    }
    const data = { name: aName, type: aType, balance: parseFloat(aBalance) || 0, description: aDesc };
    if (editAccount) {
      updateAccount(editAccount.id, data);
      toast.success('Account updated');
    } else {
      addAccount(data);
      toast.success('Account created');
    }
    setShowAccountForm(false);
  };

  const saveTransaction = () => {
    if (!tAccount || !tAmount || !tCategory || !tDate) {
      toast.error('Please fill all required fields');
      return;
    }
    addTransaction({
      accountId: tAccount,
      type: tType,
      amount: parseFloat(tAmount),
      description: tDesc,
      category: tCategory,
      date: tDate,
      reference: `TXN-${Date.now().toString(36).toUpperCase()}`,
    });
    toast.success('Transaction recorded');
    setShowTransactionForm(false);
    setTAmount('');
    setTDesc('');
    setTCategory('');
  };

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 2 }).format(v);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Money Management</h1>
          <p className="text-sm text-gray-500 mt-1">Track accounts and transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={tab === 'accounts' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('accounts')}
            className={tab === 'accounts' ? 'bg-[#2D6A4F] hover:bg-[#1B4D3E]' : ''}
          >
            <Wallet className="w-4 h-4 mr-1" />
            Accounts
          </Button>
          <Button
            variant={tab === 'transactions' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('transactions')}
            className={tab === 'transactions' ? 'bg-[#2D6A4F] hover:bg-[#1B4D3E]' : ''}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Transactions
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Balance</p>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalBalance)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Income</p>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalIncome)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Net Flow</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalIncome - totalExpense)}</p>
          </CardContent>
        </Card>
      </div>

      {tab === 'accounts' ? (
        <>
          <div className="flex items-center gap-3 mb-4">
            <Button onClick={() => openAccountForm()} className="bg-[#2D6A4F] hover:bg-[#1B4D3E]">
              <Plus className="w-4 h-4 mr-1" />
              Add Account
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {accounts.map((account) => {
              const Icon = accountTypeIcons[account.type] || Wallet;
              const accountTxns = transactions.filter(t => t.accountId === account.id);
              return (
                <Card key={account.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-[#E8F5E9] flex items-center justify-center">
                          <Icon className="w-6 h-6 text-[#2D6A4F]" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{account.name}</h3>
                          <p className="text-xs text-gray-500">{accountTypeLabels[account.type]}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openAccountForm(account)}
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ type: 'account', id: account.id })}
                          className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-2">{formatCurrency(account.balance)}</p>
                    {account.description && (
                      <p className="text-xs text-gray-500 mb-3">{account.description}</p>
                    )}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-500">{accountTxns.length} transactions</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-[#2D6A4F] h-7 px-2"
                        onClick={() => { setTab('transactions'); }}
                      >
                        View All
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-4">
            <Button onClick={() => setShowTransactionForm(true)} className="bg-[#2D6A4F] hover:bg-[#1B4D3E]">
              <Plus className="w-4 h-4 mr-1" />
              Record Transaction
            </Button>
          </div>

          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-500 uppercase text-xs">Type</th>
                    <th className="px-4 py-3 font-medium text-gray-500 uppercase text-xs">Account</th>
                    <th className="px-4 py-3 font-medium text-gray-500 uppercase text-xs">Description</th>
                    <th className="px-4 py-3 font-medium text-gray-500 uppercase text-xs">Category</th>
                    <th className="px-4 py-3 font-medium text-gray-500 uppercase text-xs">Date</th>
                    <th className="px-4 py-3 font-medium text-gray-500 uppercase text-xs text-right">Amount</th>
                    <th className="px-4 py-3 font-medium text-gray-500 uppercase text-xs text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const account = accounts.find(a => a.id === tx.accountId);
                    return (
                      <tr key={tx.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            tx.type === 'income'
                              ? 'bg-emerald-50 text-emerald-700'
                              : tx.type === 'expense'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}>
                            {tx.type === 'income' ? <ArrowDownLeft className="w-3 h-3" /> :
                             tx.type === 'expense' ? <ArrowUpRight className="w-3 h-3" /> :
                             <RefreshCw className="w-3 h-3" />}
                            {tx.type}
                          </span>
                        </td>
                        <td className="px-4 py-3">{account?.name || 'Unknown'}</td>
                        <td className="px-4 py-3 text-sm">{tx.description || '-'}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">{tx.category}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{new Date(tx.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right font-medium">
                          <span className={tx.type === 'income' ? 'text-emerald-600' : tx.type === 'expense' ? 'text-red-600' : 'text-blue-600'}>
                            {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}{formatCurrency(tx.amount)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setDeleteTarget({ type: 'transaction', id: tx.id })}
                            className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                        <RefreshCw className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                        <p>No transactions yet.</p>
                        <p className="text-xs mt-1">Record your first transaction.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Account Form */}
      <Dialog open={showAccountForm} onOpenChange={setShowAccountForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editAccount ? 'Edit Account' : 'Add Account'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Account Name *</label>
              <Input value={aName} onChange={(e) => setAName(e.target.value)} placeholder="e.g., Main Cash" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Account Type</label>
              <div className="flex gap-2 mt-1">
                {(['cash', 'bank', 'mobile'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setAType(type)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${
                      aType === type ? 'bg-[#2D6A4F] text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {accountTypeLabels[type]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Initial Balance</label>
              <Input type="number" value={aBalance} onChange={(e) => setABalance(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Description</label>
              <Input value={aDesc} onChange={(e) => setADesc(e.target.value)} placeholder="Optional" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowAccountForm(false)}>Cancel</Button>
              <Button className="flex-1 bg-[#2D6A4F] hover:bg-[#1B4D3E]" onClick={saveAccount}>
                {editAccount ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction Form */}
      <Dialog open={showTransactionForm} onOpenChange={setShowTransactionForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Record Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Account *</label>
              <select
                value={tAccount}
                onChange={(e) => setTAccount(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select account</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance)})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Transaction Type</label>
              <div className="flex gap-2 mt-1">
                {(['income', 'expense', 'transfer'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setTType(type)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${
                      tType === type ? 'bg-[#2D6A4F] text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Amount *</label>
                <Input type="number" value={tAmount} onChange={(e) => setTAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Date *</label>
                <Input type="date" value={tDate} onChange={(e) => setTDate(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Category *</label>
              <Input value={tCategory} onChange={(e) => setTCategory(e.target.value)} placeholder="e.g., Sales, Rent" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Description</label>
              <Input value={tDesc} onChange={(e) => setTDesc(e.target.value)} placeholder="Optional notes" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowTransactionForm(false)}>Cancel</Button>
              <Button className="flex-1 bg-[#2D6A4F] hover:bg-[#1B4D3E]" onClick={saveTransaction}>Record</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this {deleteTarget?.type}.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget?.type === 'account') deleteAccount(deleteTarget.id);
                else deleteTransaction(deleteTarget!.id);
                setDeleteTarget(null);
                toast.success('Deleted');
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
