'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, User as UserIcon, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAppDispatch } from '@/store/hooks';
import { registerUser } from '@/features/auth/authSlice';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const result = await dispatch(registerUser(data));
      if (registerUser.rejected.match(result)) {
        toast.error('Registration failed', result.payload ?? 'Could not create account');
        return;
      }
      toast.success('Account created', `Welcome, ${data.name}`);
      const role = result.payload?.role;
      router.push(role === 'admin' || role === 'staff' ? '/admin' : '/me');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-[var(--bg-primary)]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md space-y-6 p-8 rounded-2xl glass-strong border border-[var(--border-color)]"
      >
        <div className="text-center space-y-3">
          <Image src="/logo.png" alt="Car Affair" width={1024} height={200} className="w-48 mx-auto h-auto logo-adaptive" priority />
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Create your account</h2>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">Get started managing your garage</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            {...register('name')}
            id="name"
            label="Full Name"
            placeholder="Eswar Prasad"
            icon={<UserIcon className="h-4 w-4" />}
            error={errors.name?.message}
          />
          <Input
            {...register('email')}
            id="email"
            label="Email"
            type="email"
            placeholder="you@caraffair.com"
            icon={<Mail className="h-4 w-4" />}
            error={errors.email?.message}
          />
          <div className="relative">
            <Input
              {...register('password')}
              id="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 6 characters"
              icon={<Lock className="h-4 w-4" />}
              error={errors.password?.message}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-[38px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            isLoading={isLoading}
            icon={!isLoading ? <ArrowRight className="h-4 w-4" /> : undefined}
          >
            Create account
          </Button>
        </form>

        <p className="text-center text-sm text-[var(--text-secondary)]">
          Already have an account?{' '}
          <Link href="/admin/login" className="text-red-500 hover:text-red-400 font-medium">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
