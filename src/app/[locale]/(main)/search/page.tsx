'use client';

import { Suspense } from 'react';
import { SearchContent } from './SearchContent';

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="animate-pulse h-10 bg-muted rounded w-full max-w-lg" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
