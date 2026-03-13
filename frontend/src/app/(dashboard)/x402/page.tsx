'use client';

import dynamic from 'next/dynamic';

const X402Page = dynamic(() => import('@/dashboard/pages/X402Page'), { ssr: false });

export default function X402Route() {
  return <X402Page />;
}
