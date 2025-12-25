'use client';

import { useEffect, useState } from 'react';
import SimpleCommentModeration from '../../components/SimpleCommentModeration';
import { API_BASE_URL } from '../../config/api';

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
      apiBaseUrl={API_BASE_URL}
      authToken={authToken}
    />
  );
}