import { useState } from 'react';
import {
  User, Mail, Phone, Building2, MapPin,
  Save, Trash2, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { useUserProfile } from '@/hooks/useDatabase';
import { toast } from 'sonner';
import { clearTable, notifySupabaseDataChanged } from '@/lib/dbAdapter';

export default function SettingsPage() {
  const { profile, updateProfile } = useUserProfile();
  const [showResetDialog, setShowResetDialog] = useState(false);

  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [businessName, setBusinessName] = useState(profile.businessName);
  const [address, setAddress] = useState(profile.address);

  const handleSave = () => {
    updateProfile({ name, email, phone, businessName, address });
    toast.success('Profile updated successfully');
  };

  const handleReset = () => {
    void (async () => {
      await Promise.all([
        clearTable('products'),
        clearTable('categories'),
        clearTable('sales'),
        clearTable('customers'),
        clearTable('expenses'),
        clearTable('suppliers'),
        clearTable('feedback'),
        clearTable('money_transactions'),
        clearTable('money_accounts'),
        clearTable('user_profile'),
        clearTable('key_values', 'key'),
      ]);
      notifySupabaseDataChanged('products');
      notifySupabaseDataChanged('categories');
      notifySupabaseDataChanged('sales');
      notifySupabaseDataChanged('customers');
      notifySupabaseDataChanged('expenses');
      notifySupabaseDataChanged('suppliers');
      notifySupabaseDataChanged('feedback');
      notifySupabaseDataChanged('money_accounts');
      notifySupabaseDataChanged('money_transactions');
      notifySupabaseDataChanged('user_profile');
      setShowResetDialog(false);
      toast.success('All data has been reset');
      window.location.reload();
    })();
  };

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto animate-fadeIn">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your business profile</p>
      </div>

      {/* Profile Card */}
      <Card className="border-0 shadow-sm mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#E8F5E9] flex items-center justify-center">
              <User className="w-4 h-4 text-[#2D6A4F]" />
            </div>
            Business Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-[#2D6A4F] flex items-center justify-center overflow-hidden">
              <img src="/assets/haajir.png" alt="Haajir" className="w-16 h-16 object-contain" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{businessName || 'Haajir Stationery'}</h3>
              <p className="text-sm text-gray-500">Your business information appears on receipts</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                Business Name
              </label>
              <Input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Your business name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-gray-400" />
                Owner Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                Phone
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+251 92 923 2959"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              Business Address
            </label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Your business address"
            />
          </div>

          <div className="pt-2">
            <Button onClick={handleSave} className="bg-[#2D6A4F] hover:bg-[#1B4D3E]">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-red-500" />
            </div>
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Reset all data to start fresh. This will delete all products, sales, customers, expenses, and other records.
            This action cannot be undone.
          </p>
          <Button
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => setShowResetDialog(true)}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Reset All Data
          </Button>
        </CardContent>
      </Card>

      {/* Reset Confirmation */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Reset All Data
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              This will permanently delete ALL your business data including:
              <ul className="mt-2 space-y-1 text-sm">
                <li>All products and categories</li>
                <li>All sales records</li>
                <li>All customer data</li>
                <li>All expenses</li>
                <li>All suppliers</li>
                <li>All feedback</li>
                <li>All money accounts and transactions</li>
              </ul>
              <p className="mt-3 font-semibold text-red-600">This action cannot be undone!</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} className="bg-red-600 hover:bg-red-700">
              Yes, Reset Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
