import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { configureApi } from '@/lib/api';

export function ApiSetup() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { getAccessToken, signOut } = useAuth();

  useEffect(() => {
    configureApi(getAccessToken, () => {
      void (async () => {
        await signOut();
        queryClient.clear();
        navigate('/login', { replace: true });
      })();
    });
  }, [getAccessToken, navigate, queryClient, signOut]);

  return null;
}
