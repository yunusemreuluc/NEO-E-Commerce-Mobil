'use client';

import ImageUploadTest from '@/components/ImageUploadTest';

export default function ImageTestPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Resim Upload Test</h1>
        <p className="text-gray-600 mt-1">Masaüstü ve mobil cihazlardan resim yükleme testi</p>
      </div>
      
      <ImageUploadTest />
    </div>
  );
}