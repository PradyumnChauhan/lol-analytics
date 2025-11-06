'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Trophy, 
  Search, 
  Gamepad2, 
  BarChart3, 
  Menu, 
  X,
  Home,
  Activity,
  Crown,
  Database,
  Share2,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Player Search', href: '/player', icon: Search },
  { name: 'Featured Games', href: '/featured-games', icon: Gamepad2 },
  { name: 'Analytics Dashboard', href: '/analytics', icon: BarChart3 },
  // Note: AI Dashboard requires player context - accessible via player page
  { name: 'Server Status', href: '/server-status', icon: Activity },
  { name: 'Champion Rotation', href: '/champion-rotation', icon: Crown },
  { name: 'Advanced Analytics', href: '/advanced-analytics', icon: Database },
  { name: 'Export & Share', href: '/export-share', icon: Share2 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:bg-slate-900 lg:border-r lg:border-slate-700">
        <div className="flex-1 flex flex-col min-h-0">
          {/* Logo */}
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-slate-800">
            <Trophy className="h-8 w-8 text-yellow-500" />
            <span className="ml-2 text-xl font-bold text-white">LoL Analytics</span>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'mr-3 h-5 w-5 flex-shrink-0',
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                      )}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="flex-shrink-0 px-4 py-4 border-t border-slate-700">
              <div className="text-xs text-slate-400">
                <p>LoL Analytics v1.0</p>
                <p className="mt-1">Not affiliated with Riot Games</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        {/* Mobile menu button */}
        <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between h-16 px-4 bg-slate-900 border-b border-slate-700">
          <div className="flex items-center">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <span className="ml-2 text-lg font-bold text-white">LoL Analytics</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-30 lg:hidden">
            <div className="fixed inset-0 bg-slate-900 bg-opacity-75" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed top-16 left-0 right-0 bottom-0 w-full bg-slate-900 border-r border-slate-700">
              <nav className="px-2 py-4 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors',
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'mr-3 h-6 w-6 flex-shrink-0',
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                        )}
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}
      </div>
    </>
  );
}