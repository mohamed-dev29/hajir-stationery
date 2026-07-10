import { useState } from 'react';
import {
  Search, Plus, Pencil, Trash2, Users, Phone, Mail, MapPin,
  ShoppingBag, Star, MessageSquare
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
import { useCustomers, useFeedback } from '@/hooks/useDatabase';
import { toast } from 'sonner';
import type { Customer } from '@/types';

type TabType = 'customers' | 'feedback';

export default function CustomersPage() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const { feedback, addFeedback, deleteFeedback } = useFeedback();
  const [tab, setTab] = useState<TabType>('customers');
  const [search, setSearch] = useState('');
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showCustomerDetail, setShowCustomerDetail] = useState<Customer | null>(null);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'customer' | 'feedback'; id: string } | null>(null);

  // Customer form
  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cAddress, setCAddress] = useState('');

  // Feedback form
  const [fName, setFName] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fRating, setFRating] = useState(5);
  const [fComment, setFComment] = useState('');
  const [fCategory, setFCategory] = useState<'product' | 'service' | 'delivery' | 'other'>('service');

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const openCustomerForm = (customer?: Customer) => {
    if (customer) {
      setEditCustomer(customer);
      setCName(customer.name);
      setCPhone(customer.phone);
      setCEmail(customer.email);
      setCAddress(customer.address);
    } else {
      setEditCustomer(null);
      setCName('');
      setCPhone('');
      setCEmail('');
      setCAddress('');
    }
    setShowCustomerForm(true);
  };

  const saveCustomer = () => {
    if (!cName) {
      toast.error('Customer name is required');
      return;
    }
    const data = { name: cName, phone: cPhone, email: cEmail, address: cAddress };
    if (editCustomer) {
      updateCustomer(editCustomer.id, data);
      toast.success('Customer updated');
    } else {
      addCustomer(data);
      toast.success('Customer added');
    }
    setShowCustomerForm(false);
  };

  const saveFeedback = () => {
    if (!fName || !fComment) {
      toast.error('Name and comment are required');
      return;
    }
    addFeedback({ customerName: fName, customerPhone: fPhone, rating: fRating, comment: fComment, category: fCategory });
    toast.success('Feedback submitted');
    setShowFeedbackForm(false);
    setFName('');
    setFPhone('');
    setFRating(5);
    setFComment('');
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'customer') deleteCustomer(deleteTarget.id);
    else deleteFeedback(deleteTarget.id);
    toast.success('Deleted successfully');
    setDeleteTarget(null);
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage customers and feedback</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={tab === 'customers' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('customers')}
            className={tab === 'customers' ? 'bg-[#2D6A4F] hover:bg-[#1B4D3E]' : ''}
          >
            <Users className="w-4 h-4 mr-1" />
            Customers
          </Button>
          <Button
            variant={tab === 'feedback' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('feedback')}
            className={tab === 'feedback' ? 'bg-[#2D6A4F] hover:bg-[#1B4D3E]' : ''}
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            Feedback ({feedback.length})
          </Button>
        </div>
      </div>

      {tab === 'customers' ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(customers.reduce((sum, c) => sum + c.totalSpent, 0))}
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Avg. per Customer</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(customers.length > 0 ? customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length : 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => openCustomerForm()} className="bg-[#2D6A4F] hover:bg-[#1B4D3E]">
              <Plus className="w-4 h-4 mr-1" />
              Add Customer
            </Button>
          </div>

          {/* Customer Table */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-500 uppercase text-xs tracking-wider">Customer</th>
                    <th className="px-4 py-3 font-medium text-gray-500 uppercase text-xs tracking-wider">Contact</th>
                    <th className="px-4 py-3 font-medium text-gray-500 uppercase text-xs tracking-wider">Purchases</th>
                    <th className="px-4 py-3 font-medium text-gray-500 uppercase text-xs tracking-wider">Total Spent</th>
                    <th className="px-4 py-3 font-medium text-gray-500 uppercase text-xs tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#E8F5E9] flex items-center justify-center">
                              <Users className="w-5 h-5 text-[#2D6A4F]" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{customer.name}</p>
                              {customer.address && (
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {customer.address}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-0.5">
                            {customer.phone && (
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {customer.phone}
                              </p>
                            )}
                            {customer.email && (
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {customer.email}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 text-sm">
                            <ShoppingBag className="w-4 h-4 text-gray-400" />
                            {customer.totalPurchases}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(customer.totalSpent)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setShowCustomerDetail(customer)}
                              className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                            >
                              <Users className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openCustomerForm(customer)}
                              className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ type: 'customer', id: customer.id })}
                              className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                        <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                        <p>No customers yet.</p>
                        <p className="text-xs mt-1">Customers are automatically added from POS sales.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-4">
            <Button onClick={() => setShowFeedbackForm(true)} className="bg-[#2D6A4F] hover:bg-[#1B4D3E]">
              <Plus className="w-4 h-4 mr-1" />
              Add Feedback
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {feedback.map((fb) => (
              <Card key={fb.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#E8F5E9] flex items-center justify-center">
                        <Users className="w-4 h-4 text-[#2D6A4F]" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{fb.customerName}</p>
                        <p className="text-xs text-gray-500">{fb.customerPhone}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setDeleteTarget({ type: 'feedback', id: fb.id })}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < fb.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
                      />
                    ))}
                    <span className="text-xs text-gray-400 ml-2 capitalize">{fb.category}</span>
                  </div>
                  <p className="text-sm text-gray-600">{fb.comment}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(fb.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
            {feedback.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p>No feedback yet.</p>
                <p className="text-xs mt-1">Collect customer feedback to improve your service.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Customer Form */}
      <Dialog open={showCustomerForm} onOpenChange={setShowCustomerForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editCustomer ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Name *</label>
              <Input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Full name" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Phone</label>
              <Input value={cPhone} onChange={(e) => setCPhone(e.target.value)} placeholder="+251..." />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <Input value={cEmail} onChange={(e) => setCEmail(e.target.value)} placeholder="optional@email.com" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Address</label>
              <Input value={cAddress} onChange={(e) => setCAddress(e.target.value)} placeholder="Optional" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCustomerForm(false)}>Cancel</Button>
              <Button className="flex-1 bg-[#2D6A4F] hover:bg-[#1B4D3E]" onClick={saveCustomer}>
                {editCustomer ? 'Update' : 'Add'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feedback Form */}
      <Dialog open={showFeedbackForm} onOpenChange={setShowFeedbackForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Feedback</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Customer Name *</label>
              <Input value={fName} onChange={(e) => setFName(e.target.value)} placeholder="Name" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Phone</label>
              <Input value={fPhone} onChange={(e) => setFPhone(e.target.value)} placeholder="Optional" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Category</label>
              <select
                value={fCategory}
                onChange={(e) => setFCategory(e.target.value as any)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="service">Service</option>
                <option value="product">Product</option>
                <option value="delivery">Delivery</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Rating</label>
              <div className="flex items-center gap-2 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setFRating(star)}>
                    <Star
                      className={`w-6 h-6 transition-colors ${star <= fRating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Comment *</label>
              <textarea
                value={fComment}
                onChange={(e) => setFComment(e.target.value)}
                placeholder="Share your feedback..."
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowFeedbackForm(false)}>Cancel</Button>
              <Button className="flex-1 bg-[#2D6A4F] hover:bg-[#1B4D3E]" onClick={saveFeedback}>Submit</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer Detail */}
      <Dialog open={!!showCustomerDetail} onOpenChange={() => setShowCustomerDetail(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          {showCustomerDetail && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-[#E8F5E9] flex items-center justify-center">
                  <Users className="w-7 h-7 text-[#2D6A4F]" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{showCustomerDetail.name}</p>
                  <p className="text-sm text-gray-500">Customer since {new Date(showCustomerDetail.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="space-y-2">
                {showCustomerDetail.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{showCustomerDetail.phone}</span>
                  </div>
                )}
                {showCustomerDetail.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{showCustomerDetail.email}</span>
                  </div>
                )}
                {showCustomerDetail.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{showCustomerDetail.address}</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-gray-900">{showCustomerDetail.totalPurchases}</p>
                  <p className="text-xs text-gray-500">Purchases</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-emerald-600">{formatCurrency(showCustomerDetail.totalSpent)}</p>
                  <p className="text-xs text-gray-500">Total Spent</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {deleteTarget?.type}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
