import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import ProfileContent from './ProfileContent';

function ProfileSkeleton() {
  return (
    <div className="container py-6">
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-muted rounded-lg" />
        <div className="h-32 bg-muted rounded-lg" />
        <div className="h-64 bg-muted rounded-lg" />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent />
    </Suspense>
  );
}
