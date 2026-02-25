import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Zap,
  Brain,
  Clock,
  Settings,
  Menu,
  X
} from 'lucide-react';

/**
 * Mobile Navigation Component
 * - Bottom navigation for mobile devices
 * - Hamburger menu for additional links
 * - Touch-optimized (min 44px targets)
 * - ARIA labels for screen readers
 */

const mainNavItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { path: '/agent', icon: Brain, label: 'KAAL AI' },
  { path: '/energy', icon: Zap, label: 'Energy' }
];

const secondaryNavItems = [
  { path: '/focus-session', icon: Brain, label: 'Focus Session' },
  { path: '/timeline', icon: Clock, label: 'Timeline' },
  { path: '/settings', icon: Settings, label: 'Settings' }
];

export function MobileNavigation() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Mobile Bottom Navigation - visible only on mobile */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-area-bottom"
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="flex justify-around items-center px-2 py-2">
          {mainNavItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[64px] min-h-[48px] ${
                isActive(path)
                  ? 'text-[#111827] bg-gray-100'
                  : 'text-[#6B7280] hover:text-[#111827] hover:bg-gray-50'
              }`}
              aria-label={label}
              aria-current={isActive(path) ? 'page' : undefined}
            >
              <Icon 
                className="w-5 h-5" 
                aria-hidden="true"
                strokeWidth={isActive(path) ? 2.5 : 2}
              />
              <span className="text-xs font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                {label}
              </span>
            </Link>
          ))}
          
          {/* Menu Button */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[64px] min-h-[48px] text-[#6B7280] hover:text-[#111827] hover:bg-gray-50"
            aria-label="Open menu"
            aria-expanded={isMenuOpen}
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
            <span className="text-xs font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
              More
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
          role="presentation"
          aria-hidden="true"
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white">
              <h2
                className="text-lg font-semibold text-[#111827]"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Menu
              </h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-xl text-[#6B7280] hover:text-[#111827] hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="px-4 py-4 space-y-2">
              <div className="mb-4">
                <p className="px-3 py-2 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                  Main Navigation
                </p>
                {mainNavItems.map(({ path, icon: Icon, label }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 min-h-[48px] ${
                      isActive(path)
                        ? 'text-[#111827] bg-gray-100 font-medium'
                        : 'text-[#6B7280] hover:text-[#111827] hover:bg-gray-50'
                    }`}
                    aria-current={isActive(path) ? 'page' : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                    <span style={{ fontFamily: 'Inter, sans-serif' }}>{label}</span>
                  </Link>
                ))}
              </div>

              <div>
                <p className="px-3 py-2 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                  Additional Options
                </p>
                {secondaryNavItems.map(({ path, icon: Icon, label }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 min-h-[48px] ${
                      isActive(path)
                        ? 'text-[#111827] bg-gray-100 font-medium'
                        : 'text-[#6B7280] hover:text-[#111827] hover:bg-gray-50'
                    }`}
                    aria-current={isActive(path) ? 'page' : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                    <span style={{ fontFamily: 'Inter, sans-serif' }}>{label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Safe area for iOS */}
            <div className="h-safe-area-bottom" />
          </div>
        </div>
      )}

      {/* Add safe area padding for iOS */}
      <style>{`
        @supports (padding: env(safe-area-inset-bottom)) {
          .safe-area-bottom {
            padding-bottom: env(safe-area-inset-bottom);
          }
          .h-safe-area-bottom {
            height: env(safe-area-inset-bottom);
          }
        }
      `}</style>
    </>
  );
}