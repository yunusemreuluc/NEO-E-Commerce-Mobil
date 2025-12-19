'use client';

import SimpleCommentModeration from '@/components/SimpleCommentModeration';
import { useEffect, useState } from 'react';

export default function ReviewsPage() {
  const [authToken, setAuthToken] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      setAuthToken(token);
    }
  }, []);

  if (!authToken) {
    return (
      <div className="neo-card p-12 text-center">
        <div className="text-gray-500">Yetkilendirme yapılıyor...</div>
      </div>
    );
  }

  return (
    <SimpleCommentModeration 
      apiBaseUrl="http://localhost:4000"
      authToken={authToken}
    />
  );
}