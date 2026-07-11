import { MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';
import { ModuleHeroBanner } from '@/components/module-ui/ModuleHeroBanner';
import { RemarksModuleNav } from '@/features/remarks/components/RemarksModuleNav';

export function RemarksLayout() {
  const { t } = useTranslation('remarks');

  return (
    <div className="space-y-6">
      <ModuleHeroBanner
        title={t('hero.title')}
        description={t('hero.description')}
        tagline={t('hero.tagline')}
        icon={MessageSquare}
        module="remarks"
      />
      <RemarksModuleNav />
      <Outlet />
    </div>
  );
}
