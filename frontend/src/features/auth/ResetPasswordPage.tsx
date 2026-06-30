import { useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
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
import { useAuth } from '@/hooks/useAuth';
import { useMe } from '@/hooks/useMe';
import { apiFetch } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import type { MeResponse } from '@/types/user';

type ResetForm = {
  password: string;
  confirmPassword: string;
};

export function ResetPasswordPage() {
  const { t } = useTranslation('auth');
  const { t: tc } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { data: me, isLoading } = useMe();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetSchema = useMemo(
    () =>
      z
        .object({
          password: z.string().min(8, t('resetPassword.validation.minLength')),
          confirmPassword: z.string(),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: t('resetPassword.validation.mismatch'),
          path: ['confirmPassword'],
        }),
    [t],
  );

  const form = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!isLoading && me && !me.mustResetPassword) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: values.password });
      if (error) {
        toast.error(error.message);
        return;
      }

      const updated = await apiFetch<MeResponse>('/users/me/password-changed', {
        method: 'POST',
      });

      queryClient.setQueryData(['me', session.user.id], updated);
      toast.success(t('resetPassword.success'));
      navigate('/', { replace: true });
    } catch {
      toast.error(t('resetPassword.error'));
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>{t('resetPassword.title')}</CardTitle>
          <CardDescription>{t('resetPassword.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="password">{t('resetPassword.newPassword')}</Label>
              <Input id="password" type="password" autoComplete="new-password" {...form.register('password')} />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('resetPassword.confirmPassword')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                {...form.register('confirmPassword')}
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting || isLoading}>
              {isSubmitting ? tc('saving') : t('resetPassword.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
