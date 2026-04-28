'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  Settings, Building2, User, Bell, Shield, Palette,
  Receipt, Wrench, Clock, Globe, Save, ChevronRight,
  Sun, Moon, Monitor, Printer, Mail, MessageCircle,
  IndianRupee, Percent, MapPin, Phone, FileText,
} from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { Skeleton, SkeletonForm } from '@/components/ui/Skeleton';
import { cn } from '@/utils/cn';
import { useToast } from '@/components/ui/Toast';

type SettingsTab = 'garage' | 'account' | 'billing' | 'notifications' | 'appearance' | 'services';

const tabs: { id: SettingsTab; label: string; icon: typeof Settings }[] = [
  { id: 'garage', label: 'Garage Profile', icon: Building2 },
  { id: 'account', label: 'Account', icon: User },
  { id: 'billing', label: 'Billing & Tax', icon: Receipt },
  { id: 'services', label: 'Services & Labour', icon: Wrench },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
];

function Toggle({ enabled, onChange, label, description }: { enabled: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
        {description && <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors duration-200',
          enabled ? 'bg-red-600' : 'bg-[var(--bg-tertiary)]'
        )}
      >
        <motion.div
          animate={{ x: enabled ? 20 : 2 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('garage');
  const { theme, setTheme } = useTheme();
  const user = useAppSelector((state) => state.auth.user);
  const authLoading = useAppSelector((state) => state.auth.isLoading);
  const toast = useToast();

  // Garage profile state
  const [garageName, setGarageName] = useState('Car Affair');
  const [garagePhone, setGaragePhone] = useState('+91 98765 00000');
  const [garageEmail, setGarageEmail] = useState('info@caraffair.com');
  const [garageAddress, setGarageAddress] = useState('42 MG Road, Bengaluru, Karnataka 560001');
  const [garageGst, setGarageGst] = useState('29AABCU9603R1ZM');
  const [garageWebsite, setGarageWebsite] = useState('www.caraffair.com');
  const [garageHours, setGarageHours] = useState('Mon - Sat: 9:00 AM - 7:00 PM');

  // Billing state
  const [taxRate, setTaxRate] = useState('18');
  const [currency, setCurrency] = useState('INR');
  const [invoicePrefix, setInvoicePrefix] = useState('CA-INV');
  const [paymentTerms, setPaymentTerms] = useState('Due on delivery');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [bankAccount, setBankAccount] = useState('50100123456789');
  const [bankIfsc, setBankIfsc] = useState('HDFC0001234');

  // Services state
  const [labourRate, setLabourRate] = useState('500');
  const [warrantyPeriod, setWarrantyPeriod] = useState('30');
  const [estimateValidity, setEstimateValidity] = useState('7');

  // Notification state
  const [notifyJobCreated, setNotifyJobCreated] = useState(true);
  const [notifyJobCompleted, setNotifyJobCompleted] = useState(true);
  const [notifyPaymentReceived, setNotifyPaymentReceived] = useState(true);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(false);
  const [autoReminder, setAutoReminder] = useState(true);
  const [reminderDays, setReminderDays] = useState('3');

  const handleSave = () => {
    toast.success('Settings Saved', 'Your changes have been saved successfully');
  };

  if (authLoading && !user) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-64 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
          <div className="flex-1">
            <SkeletonForm rows={6} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Settings</h1>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">Manage your garage configuration</p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:w-64 flex-shrink-0"
        >
          <div className="glass rounded-2xl p-2 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200',
                  activeTab === tab.id
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                )}
              >
                <tab.icon className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Content Area */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 min-w-0"
        >
          {/* Garage Profile */}
          {activeTab === 'garage' && (
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Garage Profile</h2>
                  <p className="text-xs text-[var(--text-tertiary)]">Your business information displayed on invoices</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Garage Name" value={garageName} onChange={(e) => setGarageName(e.target.value)} icon={<Building2 className="h-4 w-4" />} />
                  <Input label="Phone Number" value={garagePhone} onChange={(e) => setGaragePhone(e.target.value)} icon={<Phone className="h-4 w-4" />} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Email Address" value={garageEmail} onChange={(e) => setGarageEmail(e.target.value)} icon={<Mail className="h-4 w-4" />} />
                  <Input label="Website" value={garageWebsite} onChange={(e) => setGarageWebsite(e.target.value)} icon={<Globe className="h-4 w-4" />} />
                </div>
                <Input label="Address" value={garageAddress} onChange={(e) => setGarageAddress(e.target.value)} icon={<MapPin className="h-4 w-4" />} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="GST Number" value={garageGst} onChange={(e) => setGarageGst(e.target.value)} icon={<FileText className="h-4 w-4" />} />
                  <Input label="Working Hours" value={garageHours} onChange={(e) => setGarageHours(e.target.value)} icon={<Clock className="h-4 w-4" />} />
                </div>
              </div>

              <div className="flex justify-end mt-6 pt-4 border-t border-[var(--border-color)]">
                <Button onClick={handleSave} icon={<Save className="h-4 w-4" />}>
                  Save Changes
                </Button>
              </div>
            </Card>
          )}

          {/* Account */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <Card>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">Account Details</h2>
                    <p className="text-xs text-[var(--text-tertiary)]">Your login and profile information</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-tertiary)]">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-600/20">
                      <span className="text-xl font-bold text-white">{(user?.name || 'AU').split(' ').map(n => n[0]).join('')}</span>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-[var(--text-primary)]">{user?.name || 'Admin User'}</p>
                      <p className="text-sm text-[var(--text-tertiary)]">{user?.email || 'admin@caraffair.com'}</p>
                      <p className="text-xs text-red-500 font-medium mt-0.5 capitalize">{user?.role || 'admin'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Full Name" defaultValue={user?.name || 'Admin User'} icon={<User className="h-4 w-4" />} />
                    <Input label="Email" defaultValue={user?.email || 'admin@caraffair.com'} icon={<Mail className="h-4 w-4" />} />
                  </div>
                </div>

                <div className="flex justify-end mt-6 pt-4 border-t border-[var(--border-color)]">
                  <Button onClick={handleSave} icon={<Save className="h-4 w-4" />}>
                    Update Profile
                  </Button>
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">Security</h2>
                    <p className="text-xs text-[var(--text-tertiary)]">Password and access settings</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Input label="Current Password" type="password" placeholder="Enter current password" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="New Password" type="password" placeholder="Enter new password" />
                    <Input label="Confirm Password" type="password" placeholder="Confirm new password" />
                  </div>
                </div>

                <div className="flex justify-end mt-6 pt-4 border-t border-[var(--border-color)]">
                  <Button onClick={handleSave} icon={<Shield className="h-4 w-4" />}>
                    Change Password
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Billing & Tax */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <Card>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <Receipt className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">Tax & Invoice</h2>
                    <p className="text-xs text-[var(--text-tertiary)]">Configure tax rates and invoice formatting</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input label="GST Rate (%)" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} type="number" icon={<Percent className="h-4 w-4" />} />
                    <Input label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} icon={<IndianRupee className="h-4 w-4" />} />
                    <Input label="Invoice Prefix" value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value)} icon={<FileText className="h-4 w-4" />} />
                  </div>
                  <Input label="Payment Terms" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
                </div>

                <div className="flex justify-end mt-6 pt-4 border-t border-[var(--border-color)]">
                  <Button onClick={handleSave} icon={<Save className="h-4 w-4" />}>
                    Save Changes
                  </Button>
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <IndianRupee className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">Bank Details</h2>
                    <p className="text-xs text-[var(--text-tertiary)]">Shown on invoices for bank transfers</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Input label="Bank Name" value={bankName} onChange={(e) => setBankName(e.target.value)} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Account Number" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} />
                    <Input label="IFSC Code" value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value)} />
                  </div>
                </div>

                <div className="flex justify-end mt-6 pt-4 border-t border-[var(--border-color)]">
                  <Button onClick={handleSave} icon={<Save className="h-4 w-4" />}>
                    Save Changes
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Services & Labour */}
          {activeTab === 'services' && (
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <Wrench className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Services & Labour</h2>
                  <p className="text-xs text-[var(--text-tertiary)]">Default rates and service policies</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input label="Labour Rate (per hour)" value={labourRate} onChange={(e) => setLabourRate(e.target.value)} type="number" icon={<IndianRupee className="h-4 w-4" />} />
                  <Input label="Warranty Period (days)" value={warrantyPeriod} onChange={(e) => setWarrantyPeriod(e.target.value)} type="number" icon={<Shield className="h-4 w-4" />} />
                  <Input label="Estimate Validity (days)" value={estimateValidity} onChange={(e) => setEstimateValidity(e.target.value)} type="number" icon={<Clock className="h-4 w-4" />} />
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] space-y-1">
                  <p className="text-sm font-medium text-[var(--text-primary)]">Service Categories</p>
                  <p className="text-xs text-[var(--text-tertiary)]">Manage your service catalog from the Inventory page</p>
                </div>
              </div>

              <div className="flex justify-end mt-6 pt-4 border-t border-[var(--border-color)]">
                <Button onClick={handleSave} icon={<Save className="h-4 w-4" />}>
                  Save Changes
                </Button>
              </div>
            </Card>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <Card>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">Event Notifications</h2>
                    <p className="text-xs text-[var(--text-tertiary)]">When to send notifications to customers</p>
                  </div>
                </div>

                <div className="divide-y divide-[var(--border-color)]">
                  <Toggle enabled={notifyJobCreated} onChange={setNotifyJobCreated} label="Job Created" description="Notify customer when a new job is opened" />
                  <Toggle enabled={notifyJobCompleted} onChange={setNotifyJobCompleted} label="Job Completed" description="Notify customer when their vehicle is ready" />
                  <Toggle enabled={notifyPaymentReceived} onChange={setNotifyPaymentReceived} label="Payment Received" description="Send receipt after payment is processed" />
                  <Toggle enabled={autoReminder} onChange={setAutoReminder} label="Auto Service Reminder" description="Remind customers about upcoming service schedules" />
                </div>

                {autoReminder && (
                  <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                    <Input label="Reminder (days before due)" value={reminderDays} onChange={(e) => setReminderDays(e.target.value)} type="number" icon={<Clock className="h-4 w-4" />} />
                  </div>
                )}
              </Card>

              <Card>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">Notification Channels</h2>
                    <p className="text-xs text-[var(--text-tertiary)]">How customers receive notifications</p>
                  </div>
                </div>

                <div className="divide-y divide-[var(--border-color)]">
                  <Toggle enabled={notifyWhatsapp} onChange={setNotifyWhatsapp} label="WhatsApp" description="Send messages via WhatsApp Business API" />
                  <Toggle enabled={notifyEmail} onChange={setNotifyEmail} label="Email" description="Send notifications to customer email" />
                  <Toggle enabled={notifySms} onChange={setNotifySms} label="SMS" description="Send text message alerts" />
                </div>

                <div className="flex justify-end mt-6 pt-4 border-t border-[var(--border-color)]">
                  <Button onClick={handleSave} icon={<Save className="h-4 w-4" />}>
                    Save Preferences
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Appearance */}
          {activeTab === 'appearance' && (
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <Palette className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Appearance</h2>
                  <p className="text-xs text-[var(--text-tertiary)]">Customize the look of your dashboard</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)] mb-3">Theme</p>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { value: 'light', label: 'Light', icon: Sun, desc: 'Clean and bright' },
                      { value: 'dark', label: 'Dark', icon: Moon, desc: 'Easy on the eyes' },
                      { value: 'system', label: 'System', icon: Monitor, desc: 'Match OS setting' },
                    ] as const).map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setTheme(opt.value)}
                        className={cn(
                          'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200',
                          theme === opt.value
                            ? 'bg-red-500/10 border-red-500/30 text-red-500'
                            : 'bg-[var(--bg-tertiary)] border-transparent text-[var(--text-secondary)] hover:border-[var(--border-color)]'
                        )}
                      >
                        <opt.icon className="h-6 w-6" />
                        <span className="text-sm font-medium">{opt.label}</span>
                        <span className="text-[10px] text-[var(--text-tertiary)]">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--border-color)]">
                  <p className="text-sm font-medium text-[var(--text-primary)] mb-3">Invoice Print</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-tertiary)]">
                      <div className="flex items-center gap-3">
                        <Printer className="h-4 w-4 text-[var(--text-tertiary)]" />
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">Print Logo on Invoice</p>
                          <p className="text-xs text-[var(--text-tertiary)]">Show Car Affair logo on printed invoices</p>
                        </div>
                      </div>
                      <Toggle enabled={true} onChange={() => {}} label="" />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-tertiary)]">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-[var(--text-tertiary)]" />
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">Show Terms & Conditions</p>
                          <p className="text-xs text-[var(--text-tertiary)]">Include T&C footer on invoices</p>
                        </div>
                      </div>
                      <Toggle enabled={true} onChange={() => {}} label="" />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}
