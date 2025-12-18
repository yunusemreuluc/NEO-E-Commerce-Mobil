'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/products');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-64">
      <div>Yönlendiriliyor...</div>
    </div>
  );
}