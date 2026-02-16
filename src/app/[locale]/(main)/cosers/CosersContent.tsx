'use client';

import Link from 'next/link';
import Image from 'next/image';
import { User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CategoryControllerFindAllResponse } from '@/api';

interface Coser {
  id: number;
  name: string;
  description?: string;
  articleCount?: number;
  avatar?: string;
  cover?: string;
}

interface CosersContentProps {
  initialData: CategoryControllerFindAllResponse['data']['data'];
}

export function CosersContent({ initialData }: CosersContentProps) {
  const cosers = initialData || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Coser列表</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {cosers.map((coser, index) => (
          <Link key={coser.id} href={`/cosers/${coser.id}`}>
            <div className="aspect-[3/4] bg-muted relative overflow-hidden rounded-lg group cursor-pointer">
              {coser.cover || coser.avatar ? (
                <Image
                  src={coser.cover || coser.avatar || ''}
                  alt={coser.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                  loading={index < 6 ? 'eager' : 'lazy'}
                  priority={index < 6}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                  <User className="h-16 w-16 text-muted-foreground/50" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h3 className="font-medium text-white truncate">{coser.name}</h3>
                {coser.articleCount !== undefined && (
                  <p className="text-xs text-white/80 mt-1">{coser.articleCount} 套图集</p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
