import { useState } from 'react';
import {
  Search, Plus, Pencil, Trash2, Truck, Phone, Mail, MapPin, User
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
import { useSuppliers } from '@/hooks/useDatabase';
import { toast } from 'sonner';
import type { Supplier } from '@/types';

export default function SuppliersPage() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useSuppliers();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState<Supplier | null>(null);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.phone.includes(search) ||
    s.contactPerson.toLowerCase().includes(search.toLowerCase())
  );

  const openForm = (supplier?: Supplier) => {
    if (supplier) {
      setEditSupplier(supplier);
      setName(supplier.name);
      setContactPerson(supplier.contactPerson);
      setPhone(supplier.phone);
      setEmail(supplier.email);
      setAddress(supplier.address);
    } else {
      setEditSupplier(null);
      setName('');
      setContactPerson('');
      setPhone('');
      setEmail('');
      setAddress('');
    }
    setShowForm(true);
  };

  const save = () => {
    if (!name) {
      toast.error('Supplier name is required');
      return;
    }
    const data = { name, contactPerson, phone, email, address, products: [] };
    if (editSupplier) {
      updateSupplier(editSupplier.id, data);
      toast.success('Supplier updated');
    } else {
      addSupplier(data);
      toast.success('Supplier added');
    }
    setShowForm(false);
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your supplier directory</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Suppliers</p>
            <p className="text-2xl font-bold text-gray-900">{suppliers.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Active Suppliers</p>
            <p className="text-2xl font-bold text-emerald-600">{suppliers.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Supplies</p>
            <p className="text-2xl font-bold text-blue-600">{suppliers.reduce((sum, s) => sum + s.totalSupplies, 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => openForm()} className="bg-[#2D6A4F] hover:bg-[#1B4D3E]">
          <Plus className="w-4 h-4 mr-1" />
          Add Supplier
        </Button>
      </div>

      {/* Suppliers Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((supplier) => (
            <Card key={supplier.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#E8F5E9] flex items-center justify-center">
                      <Truck className="w-6 h-6 text-[#2D6A4F]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                      {supplier.contactPerson && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {supplier.contactPerson}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openForm(supplier)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(supplier.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {supplier.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{supplier.email}</span>
                    </div>
                  )}
                  {supplier.address && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{supplier.address}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => setShowDetail(supplier)}
                    className="text-xs text-[#2D6A4F] font-medium hover:underline"
                  >
                    View Details
                  </button>
                  <span className="text-xs text-gray-500">
                    {supplier.totalSupplies} supplies
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <Truck className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p>No suppliers yet.</p>
          <p className="text-xs mt-1">Add your suppliers to keep track of your supply chain.</p>
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editSupplier ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Supplier Name *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Company name" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Contact Person</label>
              <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Name of contact" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Phone</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+251..." />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Optional" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Address</label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Optional" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button className="flex-1 bg-[#2D6A4F] hover:bg-[#1B4D3E]" onClick={save}>
                {editSupplier ? 'Update' : 'Add'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!showDetail} onOpenChange={() => setShowDetail(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supplier Details</DialogTitle>
          </DialogHeader>
          {showDetail && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-[#E8F5E9] flex items-center justify-center">
                  <Truck className="w-7 h-7 text-[#2D6A4F]" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{showDetail.name}</p>
                  <p className="text-sm text-gray-500">Since {new Date(showDetail.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="space-y-2">
                {showDetail.contactPerson && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>{showDetail.contactPerson}</span>
                  </div>
                )}
                {showDetail.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{showDetail.phone}</span>
                  </div>
                )}
                {showDetail.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{showDetail.email}</span>
                  </div>
                )}
                {showDetail.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{showDetail.address}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this supplier.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deleteSupplier(deleteId!); setDeleteId(null); toast.success('Deleted'); }} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
