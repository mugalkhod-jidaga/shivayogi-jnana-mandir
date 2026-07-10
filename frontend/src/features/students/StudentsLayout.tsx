import { GraduationCap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';
import { ModuleHeroBanner } from '@/components/module-ui/ModuleHeroBanner';
import { StudentsModuleNav } from '@/features/students/components/StudentsModuleNav';

export function StudentsLayout() {
  const { t } = useTranslation('students');

  return (
    <div className="space-y-6">
      <ModuleHeroBanner
        title={t('hero.title')}
        description={t('hero.description')}
        tagline={t('hero.tagline')}
        icon={GraduationCap}
        module="students"
      />
      <StudentsModuleNav />
      <Outlet />
    </div>
  );
}
