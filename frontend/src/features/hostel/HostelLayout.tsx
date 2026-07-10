// import { BedDouble } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';
import { ModuleHeroBanner } from '@/components/module-ui/ModuleHeroBanner';
import { HostelModuleNav } from '@/features/hostel/components/HostelModuleNav';

export function HostelLayout() {
  const { t } = useTranslation('hostel');

  return (
    <div className="space-y-6">
      <ModuleHeroBanner
        title={t('title')}
        // description={t('description')}
        // tagline={t('hero.tagline')}
        // icon={BedDouble}
        module="temple"
        imageSrc="/assets/banner.jpg"
        variant="brand"
      />
      <HostelModuleNav />
      <Outlet />
    </div>
  );
}
