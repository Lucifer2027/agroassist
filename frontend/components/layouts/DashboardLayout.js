'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sprout,
  LayoutDashboard,
  Tractor,
  Scan,
  Clock,
  CloudSun,
  Activity,
  ShieldAlert,
  BarChart3,
  FileText,
  Menu,
  X,
  LogOut,
  User,
  Settings,
  Bell,
  ChevronDown,
  Server,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { Dropdown } from '@/components/ui/Dropdown';
import { Badge } from '@/components/ui/Badge';
import { fetchApi } from '@/lib/api/client';

const topNavItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Farms', href: '/farms', icon: Tractor },
  { label: 'Crops', href: '/crops', icon: Sprout },
  { label: 'Disease Analysis', href: '/analysis', icon: Scan },
  { label: 'History', href: '/history', icon: Clock },
  { label: 'Weather', href: '/weather', icon: CloudSun },
  { label: 'Risk', href: '/risk', icon: Activity },
  { label: 'Recommendations', href: '/recommendations', icon: ShieldAlert },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Reports', href: '/reports', icon: FileText },
];

const bottomNavItems = [
  { label: 'Profile', href: '/profile', icon: User },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [apiHealthStatus, setApiHealthStatus] = useState('checking'); // 'healthy', 'offline', 'checking'

  // Redirect to login if unauthenticated after initial auth check
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Periodic API Health check
  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        await fetchApi('/health');
        if (isMounted) setApiHealthStatus('healthy');
      } catch {
        if (isMounted) setApiHealthStatus('offline');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070a12] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 animate-pulse">
            <Sprout className="w-8 h-8" />
          </div>
          <p className="text-xs text-slate-400 font-medium">Loading AgroAssist Pro...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex bg-[#070a12] text-slate-100">
      {/* Desktop Sidebar (Fixed) */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-800/80 bg-slate-950/90 backdrop-blur-md fixed inset-y-0 left-0 z-30 justify-between">
        <div className="flex flex-col min-h-0 flex-1">
          {/* Logo & Header */}
          <div className="p-5 border-b border-slate-800/80 flex items-center gap-3 shrink-0">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg shadow-emerald-950/40 border border-emerald-400/30">
              <Sprout className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-slate-100">
                AgroAssist <span className="text-emerald-400">Pro</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">AI Agriculture Suite</span>
            </div>
          </div>

          {/* Top Nav Items */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {topNavItems.map((item, idx) => {
              const Icon = item.icon;
              // Avoid ambiguity for My Farms & Crops sharing /farms
              const isActive =
                item.label === 'Crops'
                  ? pathname?.includes('/crops')
                  : item.label === 'My Farms'
                  ? pathname === '/farms' || (pathname?.startsWith('/farms/') && !pathname?.includes('/crops'))
                  : pathname === item.href || (pathname?.startsWith(`${item.href}/`) && item.href !== '/');
              return (
                <Link
                  key={`${item.href}-${idx}`}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                    isActive
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 hover:translate-x-0.5'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section (Profile, Settings, Logout + Health) */}
        <div className="p-3 border-t border-slate-800/80 space-y-1 bg-slate-950/40 shrink-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-3 py-1">
            Account & Preferences
          </div>
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                  isActive
                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 hover:translate-x-0.5'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-rose-500/50"
          >
            <LogOut className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110 text-rose-400" />
            <span>Logout</span>
          </button>

          {/* System Health Status Footer */}
          <div className="pt-2 mt-2 border-t border-slate-800/60 flex items-center justify-between px-2 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Server className="w-3.5 h-3.5" />
              <span>Backend REST</span>
            </div>
            <Badge variant={apiHealthStatus === 'healthy' ? 'success' : 'danger'} size="sm">
              {apiHealthStatus === 'healthy' ? 'Online' : 'Offline'}
            </Badge>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer (Slide-out) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative flex flex-col w-72 max-w-full bg-slate-950 border-r border-slate-800 p-4 shadow-2xl z-10 animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Sprout className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-sm text-slate-100">AgroAssist Pro</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-colors"
                aria-label="Close Navigation Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto">
              {topNavItems.map((item, idx) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={`mobile-${item.href}-${idx}`}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 font-semibold'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <div className="pt-3 mt-3 border-t border-slate-800 space-y-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-3 py-1">
                  Account
                </div>
                {bottomNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={`mobile-bottom-${item.href}`}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 font-semibold'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-950/30 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-20 h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-colors"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-medium bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Backend API Connected</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications Button */}
            <button
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 transition-colors relative focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
            </button>

            {/* User Profile Dropdown */}
            <Dropdown
              trigger={
                <div className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-900/80 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/40">
                  <Avatar name={`${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.email} size="sm" />
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs font-semibold text-slate-200">
                      {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Farmer User'}
                    </span>
                    <span className="text-[10px] text-slate-400 capitalize">{user?.role || 'Farmer'}</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
                </div>
              }
              items={[
                { label: user?.email || 'user@agroassist.com', disabled: true },
                { type: 'divider' },
                { label: 'Profile Settings', icon: <User className="w-4 h-4" />, onClick: () => router.push('/profile') },
                { label: 'App Settings', icon: <Settings className="w-4 h-4" />, onClick: () => router.push('/settings') },
                { type: 'divider' },
                { label: 'Sign Out', icon: <LogOut className="w-4 h-4" />, danger: true, onClick: handleLogout },
              ]}
            />
          </div>
        </header>

        {/* Dashboard Page View Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export function AuthenticatedLayout({ children }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}

