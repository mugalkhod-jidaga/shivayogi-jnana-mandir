import { HeartPulse } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';
import { ModuleHeroBanner } from '@/components/module-ui/ModuleHeroBanner';
import { HealthModuleNav } from '@/features/health/components/HealthModuleNav';

export function HealthLayout() {
  const { t } = useTranslation('health');

  return (
    <div className="space-y-6">
      <ModuleHeroBanner
        title={t('hero.title')}
        description={t('hero.description')}
        tagline={t('hero.tagline')}
        icon={HeartPulse}
        module="health"
      />
      <HealthModuleNav />
      <Outlet />
    </div>
  );
}
