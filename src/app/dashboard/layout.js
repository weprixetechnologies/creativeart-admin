'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import apiClient from '../../lib/api-client';
import {
  LayoutDashboard,
  Package,
  Layers,
  Inbox,
  Kanban,
  Truck,
  Users,
  Settings,
  BarChart3,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  Bell,
  MessageSquare,
  Activity
} from 'lucide-react';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('adminUser');
    const token = localStorage.getItem('adminAccessToken');

    if (!storedUser || !token) {
      localStorage.removeItem('adminAccessToken');
      localStorage.removeItem('adminRefreshToken');
      localStorage.removeItem('adminUser');
      router.push('/login');
      return;
    }

    const userData = JSON.parse(storedUser);
    if (userData.role === 'CUSTOMER') {
      localStorage.removeItem('adminAccessToken');
      localStorage.removeItem('adminRefreshToken');
      localStorage.removeItem('adminUser');
      router.push('/login');
      return;
    }

    setUser(userData);
    setLoading(false);
  }, [router]);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('adminRefreshToken');
      await apiClient.post('/auth/logout', { refreshToken });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('adminAccessToken');
      localStorage.removeItem('adminRefreshToken');
      localStorage.removeItem('adminUser');
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-surface-base)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div className="flip7-spinner" />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', fontWeight: '500', letterSpacing: '0.04em' }}>
            Loading console...
          </p>
        </div>
      </div>
    );
  }

  const allNavItems = [
    { name: 'Dashboard',        href: '/dashboard',                        icon: LayoutDashboard, roles: ['ADMIN', 'STAFF_PRODUCTION', 'STAFF_PACKAGING'], emoji: '🏠' },
    { name: 'Categories',       href: '/dashboard/categories',             icon: Layers,          roles: ['ADMIN'],                                        emoji: '🗂️' },
    { name: 'Catalog Items',    href: '/dashboard/products',               icon: Package,         roles: ['ADMIN'],                                        emoji: '🎨' },
    { name: 'Orders List',      href: '/dashboard/orders',                 icon: Package,         roles: ['ADMIN', 'STAFF_PACKAGING'],                     emoji: '📦' },
    { name: 'Coupons',          href: '/dashboard/coupons',                icon: Layers,          roles: ['ADMIN'],                                        emoji: '🎟️' },
    { name: 'Materials Inbox',  href: '/dashboard/materials',              icon: Inbox,           roles: ['ADMIN', 'STAFF_PRODUCTION'],                    emoji: '📥' },
    { name: 'Production Board', href: '/dashboard/production',             icon: Kanban,          roles: ['ADMIN', 'STAFF_PRODUCTION'],                    emoji: '⚙️' },
    { name: 'Shipments',        href: '/dashboard/shipments',              icon: Truck,           roles: ['ADMIN', 'STAFF_PACKAGING'],                     emoji: '🚚' },
    { name: 'Reports',          href: '/dashboard/reports',                icon: BarChart3,       roles: ['ADMIN'],                                        emoji: '📊' },
    { name: 'Customers',        href: '/dashboard/customers',              icon: Users,           roles: ['ADMIN'],                                        emoji: '👥' },
    { name: 'Affiliates',       href: '/dashboard/affiliates',             icon: Users,           roles: ['ADMIN'],                                        emoji: '🤝' },
    { name: 'Affiliate Payouts', href: '/dashboard/affiliates/payouts',     icon: Layers,          roles: ['ADMIN'],                                        emoji: '💸' },
    { name: 'Reviews Board',    href: '/dashboard/reviews',                icon: MessageSquare,   roles: ['ADMIN'],                                        emoji: '⭐' },
    { name: 'Msg Templates',    href: '/dashboard/notifications/templates',icon: Bell,            roles: ['ADMIN'],                                        emoji: '📝' },
    { name: 'Msg Logs',         href: '/dashboard/notifications/logs',     icon: Activity,        roles: ['ADMIN'],                                        emoji: '📋' },
    { name: 'Staff Management', href: '/dashboard/staff',                  icon: Users,           roles: ['ADMIN'],                                        emoji: '🧑‍💼' },
    { name: 'System Settings',  href: '/dashboard/settings',               icon: Settings,        roles: ['ADMIN'],                                        emoji: '⚙️' },
  ];

  const allowedNavItems = allNavItems.filter((item) => item.roles.includes(user.role));

  const avatarColors = ['#E05C5C','#E07A2F','#C9A227','#5BAD6F','#2A9D8F','#3A7DC9','#6A5ACD','#A855A8','#D45E8A','#5C8A6E'];
  const avatarColor = avatarColors[user.name.charCodeAt(0) % avatarColors.length];

  /* ── Sidebar inner content (shared between mobile overlay + desktop) ── */
  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo / Brand */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '20px 16px 16px',
        borderBottom: '2px dashed rgba(43,168,162,0.15)',
        flexShrink: 0,
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-teal-glow)',
          flexShrink: 0,
        }}>
          <ShieldCheck size={20} color="#FFF8E7" />
        </div>
        <div>
          <p style={{ fontWeight: '800', color: 'var(--color-primary-dark)', fontSize: '15px', letterSpacing: '0.02em', margin: 0 }}>
            CreativeArt
          </p>
          <p style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
            Console v1.0
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {allowedNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              id={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setSidebarOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                fontWeight: isActive ? '700' : '500',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                background: isActive
                  ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))'
                  : 'transparent',
                color: isActive ? '#FFF8E7' : 'var(--color-text-mid)',
                boxShadow: isActive ? 'var(--shadow-teal-glow)' : 'none',
                borderLeft: isActive ? '3px solid var(--color-gold)' : '3px solid transparent',
              }}
            >
              <span style={{ fontSize: '14px', width: '18px', textAlign: 'center', flexShrink: 0, lineHeight: 1 }}>
                {item.emoji}
              </span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer: User + Logout */}
      <div style={{
        padding: '12px 8px 16px',
        borderTop: '2px dashed rgba(43,168,162,0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        flexShrink: 0,
      }}>
        {/* User pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 12px',
          background: 'var(--color-primary-bg)',
          borderRadius: 'var(--radius-md)',
          border: '1.5px solid rgba(43,168,162,0.15)',
        }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: avatarColor,
            color: 'white',
            fontWeight: '800',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}>
            {user.name.charAt(0)}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-text-dark)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.name}
            </p>
            <p style={{ fontSize: '10px', color: 'var(--color-primary)', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
              {user.role}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          id="btn-logout"
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 12px',
            background: 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            fontWeight: '600',
            color: 'var(--color-text-mid)',
            cursor: 'pointer',
            width: '100%',
            transition: 'all 0.15s ease',
            fontFamily: 'inherit',
            textAlign: 'left',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(239,108,74,0.08)';
            e.currentTarget.style.color = 'var(--color-coral-dark)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--color-text-mid)';
          }}
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div id="dashboard-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-surface-base)' }}>

      {/* ── Mobile Header ── */}
      {isMobile && (
        <header
          id="mobile-header"
          style={{
            background: 'var(--color-surface-card)',
            borderBottom: '2px solid rgba(43,168,162,0.12)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '60px',
            padding: '0 20px',
            flexShrink: 0,
            boxShadow: 'var(--shadow-card)',
            position: 'sticky',
            top: 0,
            zIndex: 50,
          }}
        >
          <span style={{
            fontSize: '17px',
            fontWeight: '800',
            color: 'var(--color-primary-dark)',
            letterSpacing: '0.03em',
          }}>
            🎨 CreativeArt
          </span>
          <button
            id="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'var(--color-primary-bg)',
              border: '1.5px solid rgba(43,168,162,0.2)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
            }}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </header>
      )}

      {/* ── Mobile Sidebar Overlay ── */}
      {isMobile && sidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(30,60,60,0.35)',
              zIndex: 39,
              backdropFilter: 'blur(2px)',
            }}
          />
          {/* Drawer */}
          <aside
            id="sidebar-mobile"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: '272px',
              background: 'var(--color-surface-card)',
              borderRight: '2px solid rgba(43,168,162,0.12)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 40,
              overflowY: 'auto',
            }}
          >
            <SidebarContent />
          </aside>
        </>
      )}

      {/* ── Desktop Layout ── */}
      {!isMobile && (
        <div style={{ display: 'flex', flex: 1, height: '100vh', overflow: 'hidden' }}>
          {/* Sidebar (sticky column) */}
          <aside
            id="sidebar-desktop"
            style={{
              width: '264px',
              flexShrink: 0,
              background: 'var(--color-surface-card)',
              borderRight: '2px solid rgba(43,168,162,0.10)',
              boxShadow: 'var(--shadow-card)',
              height: '100vh',
              position: 'sticky',
              top: 0,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <SidebarContent />
          </aside>

          {/* Main content column */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Top Bar */}
            <header
              id="topbar"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                height: '60px',
                borderBottom: '2px solid rgba(43,168,162,0.10)',
                padding: '0 28px',
                background: 'var(--color-surface-card)',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(43,168,162,0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: 'var(--color-success)',
                  boxShadow: '0 0 0 3px rgba(39,174,96,0.2)',
                }} />
                <span style={{ color: 'var(--color-text-mid)', fontSize: '12px', fontWeight: '600', letterSpacing: '0.04em' }}>
                  Active Session Connected
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="badge-teal" id="role-badge">{user.role} VIEW</span>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: avatarColor,
                  color: 'white',
                  fontWeight: '800',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                }}>
                  {user.name.charAt(0)}
                </div>
              </div>
            </header>

            {/* Page Content */}
            <main
              id="main-content"
              style={{
                flex: 1,
                padding: '28px',
                background: 'var(--color-surface-base)',
                overflowY: 'auto',
              }}
            >
              {children}
            </main>
          </div>
        </div>
      )}

      {/* Mobile: main content below header */}
      {isMobile && (
        <main
          id="main-content-mobile"
          style={{
            flex: 1,
            padding: '20px 16px',
            background: 'var(--color-surface-base)',
          }}
        >
          {children}
        </main>
      )}
    </div>
  );
}
