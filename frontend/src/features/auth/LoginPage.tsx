import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { normalizeIndianPhone } from '@/lib/phone';
import { supabase } from '@/lib/supabase';

type LoginForm = {
  phone: string;
  password: string;
};

export function LoginPage() {
  const { t } = useTranslation('auth');
  const { t: tc } = useTranslation();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loginSchema = useMemo(
    () =>
      z.object({
        phone: z
          .string()
          .min(10, t('validation.phone'))
          .max(10, t('validation.phone'))
          .regex(/^\d{10}$/, t('validation.phone')),
        password: z.string().min(1, t('validation.passwordRequired')),
      }),
    [t],
  );

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '', password: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    try {
      const phone = normalizeIndianPhone(values.phone);
      const { error } = await supabase.auth.signInWithPassword({
        phone,
        password: values.password,
      });

      if (error) {
        toast.error(t('invalidCredentials'));
        return;
      }

      const redirectTo = (location.state as { from?: string } | null)?.from;
      if (redirectTo && redirectTo !== '/login') {
        return;
      }
    } catch {
      toast.error(t('invalidCredentials'));
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <img
        src="/assets/hero-temple.jpg"
        alt=""
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-orange-950/80 via-amber-900/70 to-indigo-950/80" />
      <div className="absolute right-4 top-4 z-10">
        <LanguageToggle />
      </div>
      <Card className="relative z-10 w-full max-w-sm border-white/20 bg-white/95 shadow-2xl backdrop-blur-sm dark:bg-card/95">
        <CardHeader className="text-center">
          <img
            src="/assets/logo.png"
            alt={tc('appName')}
            className="mx-auto mb-3 size-16 object-contain"
            width={64}
            height={64}
          />
          <CardTitle className="text-xl">{tc('appName')}</CardTitle>
          <CardDescription>{t('subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('mobileNumber')}</Label>
              <div className="flex">
                <span className="inline-flex h-9 items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                  +91
                </span>
                <Input
                  id="phone"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder={t('mobilePlaceholder')}
                  className="rounded-l-none"
                  {...form.register('phone')}
                />
              </div>
              {form.formState.errors.phone && (
                <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('password')}</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...form.register('password')}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={isSubmitting}>
              {isSubmitting ? t('signingIn') : t('signIn')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
