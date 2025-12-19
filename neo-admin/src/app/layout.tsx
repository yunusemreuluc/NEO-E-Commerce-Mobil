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
        <div className="flex min-h-screen bg-gray-50">
          {/* Sidebar */}
          <aside className="w-72 bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="text-2xl font-extrabold tracking-wide flex items-center gap-2">
                <span className="text-3xl">🚀</span>
                <div>
                  <span className="text-red-500">NEO</span>{' '}
                  <span className="text-gray-900">Admin</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">Yönetim Paneli v2.0</p>
            </div>

            <nav className="px-4 py-6">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-3">
                  Ana Menü
                </div>
                <Link
                  href="/products"
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    pathname === '/products' 
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25 transform scale-105' 
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 hover:text-gray-900 hover:shadow-md'
                  }`}
                >
                  <span className="text-xl">📦</span>
                  <span>Ürünler</span>
                  {pathname === '/products' && <span className="ml-auto text-xs">●</span>}
                </Link>
                <Link
                  href="/products/new"
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    pathname === '/products/new' 
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25 transform scale-105' 
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 hover:text-gray-900 hover:shadow-md'
                  }`}
                >
                  <span className="text-xl">➕</span>
                  <span>Yeni Ürün Ekle</span>
                  {pathname === '/products/new' && <span className="ml-auto text-xs">●</span>}
                </Link>
                <Link
                  href="/reviews"
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    pathname === '/reviews' 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 transform scale-105' 
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 hover:text-gray-900 hover:shadow-md'
                  }`}
                >
                  <span className="text-xl">💬</span>
                  <span>Yorum Yönetimi</span>
                  {pathname === '/reviews' && <span className="ml-auto text-xs">●</span>}
                </Link>
                <Link
                  href="/users"
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    pathname === '/users' 
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25 transform scale-105' 
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 hover:text-gray-900 hover:shadow-md'
                  }`}
                >
                  <span className="text-xl">👥</span>
                  <span>Kullanıcı Yönetimi</span>
                  {pathname === '/users' && <span className="ml-auto text-xs">●</span>}
                </Link>
                

              </div>
            </nav>

            <div className="absolute bottom-0 left-0 right-0 w-72 p-4 border-t border-gray-200 bg-gradient-to-t from-gray-50 to-white">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:text-red-700 transition-all duration-200 hover:shadow-md"
              >
                <span className="text-xl">🚪</span>
                <span>Güvenli Çıkış</span>
                <span className="ml-auto text-xs">→</span>
              </button>
              <div className="mt-3 text-xs text-gray-400 text-center font-medium">
                © 2024 NEO Admin Panel
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-8 py-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">NEO Yönetim Paneli</h1>
                  <p className="text-sm text-gray-500">E-ticaret yönetim sistemi</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-500">
                    {new Date().toLocaleDateString('tr-TR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              </div>
            </header>

            {/* Page Content */}
            <div className="flex-1 p-8 bg-gray-50">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
