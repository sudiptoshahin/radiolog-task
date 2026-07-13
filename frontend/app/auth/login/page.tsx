"use client";

import { useState, ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';
import FormField from '../../../components/auth/FormField';
import { LoginFormValues } from '@/models/auth';
import ApiService from '@/services/ApiService';
import useUserStore from '@/store/useUserStore';
import { toast } from "react-toastify";
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';


type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;


// Validators
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(value: string): string | undefined {
  if (!value.trim()) return 'Email is required';
  if (!EMAIL_REGEX.test(value)) return 'Enter a valid email address';
  return undefined;
}

function validatePassword(value: string): string | undefined {
  if (!value) return 'Password is required';
  return undefined;
}

function validateField(name: keyof LoginFormValues, value: string): string | undefined {
  switch (name) {
    case 'email':
      return validateEmail(value);
    case 'password':
      return validatePassword(value);
    default:
      return undefined;
  }
}

function validateAll(values: LoginFormValues): LoginFormErrors {
  return {
    email: validateEmail(values.email),
    password: validatePassword(values.password),
  };
}

function hasErrors(errors: LoginFormErrors): boolean {
  return Object.values(errors).some(Boolean);
}


const initialValues: LoginFormValues = { email: '', password: '' };

export default function LoginPage() {
  const router = useRouter();
  const [values, setValues] = useState<LoginFormValues>(initialValues);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof LoginFormValues, boolean>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const fieldName = name as keyof LoginFormValues;

    setValues((prev) => ({ ...prev, [fieldName]: value }));

    // Only live-validate a field once the user has already blurred it once,
    // so errors don't appear while they're still typing for the first time.
    if (touched[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: validateField(fieldName, value) }));
    }
  };

  const handleBlur = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const fieldName = name as keyof LoginFormValues;

    setTouched((prev) => ({ ...prev, [fieldName]: true }));
    setErrors((prev) => ({ ...prev, [fieldName]: validateField(fieldName, value) }));
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateAll(values);
    setErrors(nextErrors);
    setTouched({ email: true, password: true });

    if (hasErrors(nextErrors)) return;

    setIsSubmitting(true);
    try {
      const res = await ApiService.LOGIN(values);
      if (res.code !== 200) {
        toast.warning('Something went wrong!', { closeButton: false, style: { color: 'black' } });
        return
      }
      useUserStore.getState().setUser(res.data);
      toast.warning('You are successfully logged in.', { closeButton: false, style: { color: 'black' } });
      router.push('/kanaban');
      return;

    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppLayout>
      <div className="min-h-screen w-full bg-[#F7F2EA] flex">
        {/* Right panel — the form */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 sm:px-12">
          <div className="w-full max-w-[380px]">
            <h2 className="font-['Fraunces'] text-[1.75rem] text-[#26211C] mb-1">Sign in</h2>
            <p className="font-['Inter'] text-sm text-[#8B7E6E] mb-8">
              New here?{' '}
              <Link href="/auth/registration" className="text-[#4F6F5C] hover:underline font-medium">
                Create an account
              </Link>
            </p>

            <form onSubmit={handleSubmit} noValidate>
              <FormField
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.email}
              />

              <div className="relative">
                <FormField
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-[2.35rem] font-['Inter'] text-xs text-[#8B7E6E] hover:text-[#26211C]"
                  tabIndex={-1}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              <div className="flex justify-end mb-6 -mt-2">
                <Link href="/auth/forgot-password" className="font-['Inter'] text-xs text-[#8B7E6E] hover:text-[#26211C]">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md bg-[#26211C] py-2.75 px-4 font-['Inter'] text-[0.95rem] font-medium text-[#F7F2EA] transition-colors duration-150 hover:bg-[#3A332C] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}