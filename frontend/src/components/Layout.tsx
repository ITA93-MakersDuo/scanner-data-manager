import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Scan, Upload, FolderOpen, Menu, X, LogOut, User } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const navItems = [
    { path: '/', label: 'スキャン一覧', icon: Scan },
    { path: '/upload', label: 'アップロード', icon: Upload },
    { path: '/projects', label: 'プロジェクト', icon: FolderOpen },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 rounded-md hover:bg-indigo-500"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <Link to="/" className="flex items-center space-x-2 ml-2 md:ml-0">
                <Scan size={28} />
                <span className="font-bold text-xl hidden sm:inline">3Dスキャナー管理</span>
              </Link>
            </div>
            <nav className="hidden md:flex space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-indigo-700 text-white'
                      : 'text-indigo-100 hover:bg-indigo-500'
                  }`}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
            {/* User info */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 text-indigo-100 text-sm">
                <User size={16} />
                <span className="hidden sm:inline">{user?.name}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-1 px-2 py-1.5 rounded-md text-sm text-indigo-100 hover:bg-indigo-500 transition-colors"
                title="ログアウト"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">ログアウト</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}>
          <nav className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 space-y-2">
              <div className="pb-3 mb-3 border-b text-sm text-gray-600 flex items-center space-x-2">
                <User size={16} />
                <span>{user?.name}</span>
              </div>
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </Link>
              ))}
              <button
                onClick={() => { logout(); setSidebarOpen(false); }}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 w-full"
              >
                <LogOut size={18} />
                <span>ログアウト</span>
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
          &copy; {new Date().getFullYear()} Makers DUO. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
