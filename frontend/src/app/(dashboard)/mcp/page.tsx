'use client';

import dynamic from 'next/dynamic';

const McpPage = dynamic(() => import('@/dashboard/pages/McpPage'), { ssr: false });

export default function McpRoute() {
  return <McpPage />;
}
