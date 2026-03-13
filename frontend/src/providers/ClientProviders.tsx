'use client';

import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import SWRProvider from './SWRProvider';

const ClickProviderWrapper = dynamic(() => import('./ClickProviderWrapper'), { ssr: false });

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <SWRProvider>
      <ClickProviderWrapper>{children}</ClickProviderWrapper>
    </SWRProvider>
  );
}
