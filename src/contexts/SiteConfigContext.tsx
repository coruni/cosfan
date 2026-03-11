'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { ConfigControllerGetPublicConfigsResponse } from '@/api/types.gen';

type SiteConfigData = NonNullable<ConfigControllerGetPublicConfigsResponse['data']>;

interface SiteConfigContextType {
  config: SiteConfigData | null;
  siteName: string;
}

const SiteConfigContext = createContext<SiteConfigContextType | undefined>(undefined);

interface SiteConfigProviderProps {
  children: ReactNode;
  config: SiteConfigData | null;
}

export function SiteConfigProvider({ children, config }: SiteConfigProviderProps) {
  const value: SiteConfigContextType = {
    config,
    siteName: config?.site_name || 'PicArt',
  };

  return (
    <SiteConfigContext.Provider value={value}>
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig() {
  const context = useContext(SiteConfigContext);
  if (context === undefined) {
    throw new Error('useSiteConfig must be used within a SiteConfigProvider');
  }
  return context;
}