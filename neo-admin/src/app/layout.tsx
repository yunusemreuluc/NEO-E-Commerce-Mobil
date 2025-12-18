'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const user = localStorage.getItem('admin_user');
    
    if (pathname === '/login') {
      setLoading(false);
      return;
    }

    if (token && user) {
      try {
        const userData = JSON.parse(user);
        if (userData.role === 'admin') {
          setIsAuthenticated(true);
        } else {
          router.push('/login');
        }
      } catch {
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
    
    setLoading(false);
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    router.push('/login');
  };

  if (loading) {
    return (
      <html lang="tr">
        <body className="min-h-screen flex items-center justify-center">
          <div>Yükleniyor...</div>
        </body>
      </html>
    );
  }

  if (pathname === '/login') {
    return (
      <html lang="tr">
        <body className="min-h-screen">
          {children}
        </body>
      </html>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <html lang="tr">
      <body className="min-h-screen">
        <div className="flex min-h-screen">
          <aside className="w-72 bg-zinc-950 border-r border-zinc-800 p-5">
            <div className="text-xl font-extrabold tracking-wide">
              <span className="text-red-500">NEO</span> Admin
            </div>

            <div className="mt-6 space-y-2">
              <Link
                href="/products"
                className="block rounded-lg px-3 py-2 text-zinc-200 hover:bg-zinc-900"
              >
                📦 Ürünler
              </Link>
              <Link
                href="/products/new"
                className="block rounded-lg px-3 py-2 text-zinc-200 hover:bg-zinc-900"
              >
                ➕ Yeni Ürün Ekle
              </Link>
              <Link
                href="/reviews"
                className="block rounded-lg px-3 py-2 text-zinc-200 hover:bg-zinc-900"
              >
                💬 Yorum Yönetimi
              </Link>
              <Link
                href="/users"
                className="block rounded-lg px-3 py-2 text-zinc-200 hover:bg-zinc-900"
              >
                👥 Kullanıcı Yönetimi
              </Link>
            </div>

            <div className="mt-auto pt-10">
              <button
                onClick={handleLogout}
                className="block w-full rounded-lg px-3 py-2 text-zinc-200 hover:bg-zinc-900 text-left"
              >
                🚪 Çıkış Yap
              </button>
              <div className="mt-4 text-xs text-zinc-500">Yönetim Paneli v1.0</div>
            </div>
          </aside>

          <main className="flex-1">
            <div className="border-b border-zinc-800 bg-zinc-950/40 backdrop-blur px-8 py-5">
              <div className="text-sm text-zinc-400">NEO • Yönetim</div>
            </div>

            <div className="p-8">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
