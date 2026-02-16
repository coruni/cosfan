'use client';

import { Suspense, use } from 'react';
import { CoserContent } from './CoserContent';

interface CoserPageProps {
  params: Promise<{ id: string }>;
}

export default function CoserPage({ params }: CoserPageProps) {
  const { id } = use(params);

  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="animate-pulse h-8 w-48 bg-muted rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    }>
      <CoserContent id={id} />
    </Suspense>
  );
}
