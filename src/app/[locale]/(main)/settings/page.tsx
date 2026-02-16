import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import SettingsContent from './SettingsContent';

function SettingsSkeleton() {
  return (
    <div className="container py-6 max-w-2xl">
      <div className="animate-pulse space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}
