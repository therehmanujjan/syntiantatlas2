'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api-client';
import type { UserAddress, BankAccount } from '@/types';
import {
  FiUser,
  FiLock,
  FiSave,
  FiLoader,
  FiCheckCircle,
  FiAlertCircle,
  FiMapPin,
  FiCreditCard,
  FiShield,
  FiBell,
  FiDollarSign,
  FiPlus,
  FiTrash2,
} from 'react-icons/fi';
import { ConfirmModal } from '@/components/ui/confirm-modal';

/* ─── Shared Helpers ─── */
function FeedbackMessage({ type, message }: { type: 'success' | 'error'; message: string }) {
  return (
    <div
      className={`flex items-center gap-2 text-sm rounded-lg px-4 py-3 ${
        type === 'success'
          ? 'bg-green-50 border border-green-200 text-green-700'
          : 'bg-red-50 border border-red-200 text-red-700'
      }`}
    >
      {type === 'success' ? <FiCheckCircle className="text-base flex-shrink-0" /> : <FiAlertCircle className="text-base flex-shrink-0" />}
      {message}
    </div>
  );
}

function InputField({
  label,
  type = 'text',
  disabled = false,
  error,
  ...props
}: {
  label: string;
  type?: string;
  disabled?: boolean;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        disabled={disabled}
        className={`w-full border rounded-lg px-4 py-2.5 text-sm outline-none transition
          ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-200' : 'border-gray-300 focus:ring-2 focus:ring-dao-blue/30 focus:border-dao-blue'}
          ${error ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : ''}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-lg bg-dao-blue/10 flex items-center justify-center text-dao-blue">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="card animate-pulse space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-gray-100" />
        <div>
          <div className="h-5 w-40 bg-gray-100 rounded mb-1" />
          <div className="h-3 w-56 bg-gray-50 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="h-4 w-20 bg-gray-100 rounded mb-2" />
            <div className="h-10 w-full bg-gray-100 rounded-lg" />
          </div>
        ))}
      </div>
      <div className="h-10 w-32 bg-gray-100 rounded-lg" />
    </div>
  );
}

/* ─── 1. Profile Section ─── */
const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email(),
  phone: z.string().optional(),
});
type ProfileFormData = z.infer<typeof profileSchema>;

function ProfileSection() {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const { data: profile, isLoading } = useQuery({ queryKey: ['profile'], queryFn: () => api.getProfile() });
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: '', lastName: '', email: '', phone: '' },
  });

  useEffect(() => {
    if (profile) reset({ firstName: profile.firstName ?? '', lastName: profile.lastName ?? '', email: profile.email ?? '', phone: profile.phone ?? '' });
  }, [profile, reset]);

  const mutation = useMutation({
    mutationFn: (data: { firstName?: string; lastName?: string; phone?: string }) => api.updateProfile(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['profile'] }); setFeedback({ type: 'success', message: 'Profile updated.' }); },
    onError: (err: any) => { setFeedback({ type: 'error', message: err?.response?.data?.message ?? 'Failed to update profile.' }); },
  });

  const onSubmit = (data: ProfileFormData) => { setFeedback(null); mutation.mutate({ firstName: data.firstName, lastName: data.lastName, phone: data.phone }); };

  if (isLoading) return <FormSkeleton />;

  return (
    <div className="card">
      <SectionHeader icon={<FiUser className="text-xl" />} title="Profile Information" subtitle="Update your personal details." />
      {feedback && <div className="mb-4"><FeedbackMessage type={feedback.type} message={feedback.message} /></div>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="First Name" placeholder="Enter first name" error={errors.firstName?.message} {...register('firstName')} />
          <InputField label="Last Name" placeholder="Enter last name" error={errors.lastName?.message} {...register('lastName')} />
          <InputField label="Email Address" type="email" disabled error={errors.email?.message} {...register('email')} />
          <InputField label="Phone Number" type="tel" placeholder="e.g. +92 300 1234567" error={errors.phone?.message} {...register('phone')} />
        </div>
        <button type="submit" disabled={mutation.isPending || !isDirty} className="btn-blue flex items-center gap-2 !px-5 !py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
          {mutation.isPending ? <FiLoader className="animate-spin" /> : <FiSave />}
          {mutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

/* ─── 2. Password Section ─── */
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmNewPassword, { message: 'Passwords do not match', path: ['confirmNewPassword'] });
type PasswordFormData = z.infer<typeof passwordSchema>;

function PasswordSection() {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) });
  const mutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) => api.changePassword(data),
    onSuccess: () => { setFeedback({ type: 'success', message: 'Password updated.' }); reset(); },
    onError: (err: any) => { setFeedback({ type: 'error', message: err?.response?.data?.message ?? 'Failed to change password.' }); },
  });
  const onSubmit = (data: PasswordFormData) => { setFeedback(null); mutation.mutate({ currentPassword: data.currentPassword, newPassword: data.newPassword }); };

  return (
    <div className="card">
      <SectionHeader icon={<FiLock className="text-xl" />} title="Change Password" subtitle="Update your password to keep your account secure." />
      {feedback && <div className="mb-4"><FeedbackMessage type={feedback.type} message={feedback.message} /></div>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <InputField label="Current Password" type="password" placeholder="Enter current password" error={errors.currentPassword?.message} {...register('currentPassword')} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="New Password" type="password" placeholder="Minimum 8 characters" error={errors.newPassword?.message} {...register('newPassword')} />
          <InputField label="Confirm New Password" type="password" placeholder="Re-enter new password" error={errors.confirmNewPassword?.message} {...register('confirmNewPassword')} />
        </div>
        <button type="submit" disabled={mutation.isPending} className="btn-blue flex items-center gap-2 !px-5 !py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
          {mutation.isPending ? <FiLoader className="animate-spin" /> : <FiLock />}
          {mutation.isPending ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}

/* ─── 3. Address Section ─── */
const addressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
});
type AddressFormData = z.infer<typeof addressSchema>;

function AddressSection() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const { data: addresses = [], isLoading } = useQuery({ queryKey: ['addresses'], queryFn: () => api.getAddresses() });
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddressFormData>({ resolver: zodResolver(addressSchema) });

  const createMutation = useMutation({
    mutationFn: (data: AddressFormData) => api.createAddress({ ...data, country: data.country || 'Pakistan', isDefault: addresses.length === 0 }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['addresses'] }); reset(); setShowForm(false); setFeedback({ type: 'success', message: 'Address added.' }); },
    onError: () => setFeedback({ type: 'error', message: 'Failed to add address.' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteAddress(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['addresses'] }); setFeedback({ type: 'success', message: 'Address removed.' }); },
  });

  if (isLoading) return <FormSkeleton />;

  return (
    <div className="card">
      <SectionHeader icon={<FiMapPin className="text-xl" />} title="Address" subtitle="Manage your addresses for correspondence." />
      {feedback && <div className="mb-4"><FeedbackMessage type={feedback.type} message={feedback.message} /></div>}

      {addresses.length > 0 && (
        <div className="space-y-3 mb-4">
          {(addresses as UserAddress[]).map((addr) => (
            <div key={addr.id} className="flex items-start justify-between p-3 rounded-lg bg-gray-50 text-sm">
              <div>
                <p className="text-gray-800 font-medium">{addr.street}</p>
                <p className="text-gray-500 text-xs">{addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.postalCode ?? ''}</p>
                <p className="text-gray-400 text-xs">{addr.country}</p>
                {addr.isDefault && <span className="text-xs text-dao-blue font-medium">Default</span>}
              </div>
              <button onClick={() => setDeleteTarget(addr.id)} className="text-gray-400 hover:text-red-500"><FiTrash2 /></button>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Street" placeholder="House/Building, Street" error={errors.street?.message} {...register('street')} />
            <InputField label="City" placeholder="e.g. Lahore" error={errors.city?.message} {...register('city')} />
            <InputField label="State / Province" placeholder="e.g. Punjab" {...register('state')} />
            <InputField label="Postal Code" placeholder="e.g. 54000" {...register('postalCode')} />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={createMutation.isPending} className="btn-blue text-sm !px-4 !py-2 flex items-center gap-2 disabled:opacity-50">
              {createMutation.isPending ? <FiLoader className="animate-spin" /> : <FiSave />} Save Address
            </button>
            <button type="button" onClick={() => { setShowForm(false); reset(); }} className="btn-secondary text-sm !px-4 !py-2">Cancel</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowForm(true)} className="btn-secondary text-sm !px-4 !py-2 flex items-center gap-2"><FiPlus /> Add Address</button>
      )}

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete Address"
        message="Are you sure you want to remove this address?"
        destructive
        confirmLabel="Delete"
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

/* ─── 4. Bank Details Section ─── */
const bankSchema = z.object({
  bankName: z.string().min(1, 'Bank name is required'),
  accountTitle: z.string().min(1, 'Account title is required'),
  iban: z.string().min(1, 'IBAN is required'),
  branchCode: z.string().optional(),
});
type BankFormData = z.infer<typeof bankSchema>;

function BankDetailsSection() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const { data: accounts = [], isLoading } = useQuery({ queryKey: ['bank-accounts'], queryFn: () => api.getBankAccounts() });
  const { register, handleSubmit, reset, formState: { errors } } = useForm<BankFormData>({ resolver: zodResolver(bankSchema) });

  const createMutation = useMutation({
    mutationFn: (data: BankFormData) => api.createBankAccount({ ...data, isDefault: accounts.length === 0 }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bank-accounts'] }); reset(); setShowForm(false); setFeedback({ type: 'success', message: 'Bank account added.' }); },
    onError: () => setFeedback({ type: 'error', message: 'Failed to add bank account.' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteBankAccount(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bank-accounts'] }); setFeedback({ type: 'success', message: 'Bank account removed.' }); },
  });

  if (isLoading) return <FormSkeleton />;

  return (
    <div className="card">
      <SectionHeader icon={<FiCreditCard className="text-xl" />} title="Bank Details" subtitle="Manage bank accounts for withdrawals and payouts." />
      {feedback && <div className="mb-4"><FeedbackMessage type={feedback.type} message={feedback.message} /></div>}

      {accounts.length > 0 && (
        <div className="space-y-3 mb-4">
          {(accounts as BankAccount[]).map((acc) => (
            <div key={acc.id} className="flex items-start justify-between p-3 rounded-lg bg-gray-50 text-sm">
              <div>
                <p className="text-gray-800 font-medium">{acc.bankName}</p>
                <p className="text-gray-500 text-xs">{acc.accountTitle}</p>
                <p className="text-gray-500 text-xs font-mono">{acc.iban}</p>
                {acc.isDefault && <span className="text-xs text-dao-blue font-medium">Default</span>}
              </div>
              <button onClick={() => setDeleteTarget(acc.id)} className="text-gray-400 hover:text-red-500"><FiTrash2 /></button>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Bank Name" placeholder="e.g. HBL, Meezan Bank" error={errors.bankName?.message} {...register('bankName')} />
            <InputField label="Account Title" placeholder="Full name on account" error={errors.accountTitle?.message} {...register('accountTitle')} />
            <InputField label="IBAN" placeholder="PK00XXXX0000000000000000" error={errors.iban?.message} {...register('iban')} />
            <InputField label="Branch Code" placeholder="Optional" {...register('branchCode')} />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={createMutation.isPending} className="btn-blue text-sm !px-4 !py-2 flex items-center gap-2 disabled:opacity-50">
              {createMutation.isPending ? <FiLoader className="animate-spin" /> : <FiSave />} Save Account
            </button>
            <button type="button" onClick={() => { setShowForm(false); reset(); }} className="btn-secondary text-sm !px-4 !py-2">Cancel</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowForm(true)} className="btn-secondary text-sm !px-4 !py-2 flex items-center gap-2"><FiPlus /> Add Bank Account</button>
      )}

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete Bank Account"
        message="Are you sure you want to remove this bank account?"
        destructive
        confirmLabel="Delete"
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

/* ─── 5. Legal Information Section ─── */
function LegalInfoSection() {
  return (
    <div className="card">
      <SectionHeader icon={<FiShield className="text-xl" />} title="Legal Information" subtitle="Your identity and tax documents." />
      <p className="text-sm text-gray-500 mb-4">
        Legal information is managed through KYC verification. Please visit the KYC page to submit or update your identity documents.
      </p>
      <a href="/kyc" className="btn-secondary text-sm !px-4 !py-2 inline-flex items-center gap-2">
        <FiShield /> Go to KYC Verification
      </a>
    </div>
  );
}

/* ─── 6. Notification Preferences Section ─── */
function NotificationsSection() {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [emailDigest, setEmailDigest] = useState('daily');

  const mutation = useMutation({
    mutationFn: (data: { pushEnabled?: boolean; smsEnabled?: boolean; emailDigest?: string }) => api.updateNotificationPreferences(data),
    onSuccess: () => setFeedback({ type: 'success', message: 'Preferences saved.' }),
    onError: () => setFeedback({ type: 'error', message: 'Failed to save preferences.' }),
  });

  const handleSave = () => { setFeedback(null); mutation.mutate({ pushEnabled, smsEnabled, emailDigest }); };

  function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
    return (
      <label className="flex items-center justify-between cursor-pointer py-2">
        <span className="text-sm text-gray-700">{label}</span>
        <button
          type="button"
          onClick={() => onChange(!checked)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-dao-blue' : 'bg-gray-200'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </label>
    );
  }

  return (
    <div className="card">
      <SectionHeader icon={<FiBell className="text-xl" />} title="Notification Preferences" subtitle="Choose how and when you receive notifications." />
      {feedback && <div className="mb-4"><FeedbackMessage type={feedback.type} message={feedback.message} /></div>}

      <div className="space-y-1 mb-4">
        <Toggle checked={pushEnabled} onChange={setPushEnabled} label="Push Notifications" />
        <Toggle checked={smsEnabled} onChange={setSmsEnabled} label="SMS Notifications" />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Email Digest</label>
        <select
          value={emailDigest}
          onChange={(e) => setEmailDigest(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-dao-blue/30 focus:border-dao-blue"
        >
          <option value="realtime">Real-time</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="none">None</option>
        </select>
      </div>

      <button onClick={handleSave} disabled={mutation.isPending} className="btn-blue flex items-center gap-2 !px-5 !py-2.5 text-sm disabled:opacity-50">
        {mutation.isPending ? <FiLoader className="animate-spin" /> : <FiSave />}
        {mutation.isPending ? 'Saving...' : 'Save Preferences'}
      </button>
    </div>
  );
}

/* ─── 7. Wallet Info Section ─── */
function WalletInfoSection() {
  const { data: wallet } = useQuery({ queryKey: ['wallet'], queryFn: () => api.getWallet() });

  return (
    <div className="card">
      <SectionHeader icon={<FiDollarSign className="text-xl" />} title="Wallet Information" subtitle="Your wallet balance and address." />
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
          <div>
            <p className="text-xs text-gray-400">Balance</p>
            <p className="text-lg font-bold text-gray-900">PKR {wallet?.balance ? parseFloat(wallet.balance).toLocaleString('en-PK', { minimumFractionDigits: 2 }) : '0.00'}</p>
          </div>
          <a href="/wallet" className="btn-secondary text-xs !px-3 !py-1.5">Manage Wallet</a>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Settings Content ─── */
export function SettingsPageContent() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your profile, security, and account preferences.
        </p>
      </div>

      <ProfileSection />
      <PasswordSection />
      <AddressSection />
      <BankDetailsSection />
      <LegalInfoSection />
      <NotificationsSection />
      <WalletInfoSection />
    </div>
  );
}
