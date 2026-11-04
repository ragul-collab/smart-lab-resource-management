import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUnreadCount } from '../api/alertApi';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getUnreadCount();
      if (res && res.success && res.data) {
        setUnreadCount(res.data.count || 0);
      }
    } catch (err) {
      // Ignore background fetch errors
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    fetchCount();
    const interval = setInterval(fetchCount, 30000);

    const handleAlertsUpdated = () => {
      fetchCount();
    };
    window.addEventListener('alerts-updated', handleAlertsUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener('alerts-updated', handleAlertsUpdated);
    };
  }, [user, fetchCount]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/staff' || path === '/student') {
      return location.pathname === path;
    }
    if (path === '/staff/equipment' || path === '/student/equipment') {
      return location.pathname === path || location.pathname.startsWith('/equipment/');
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const staffGroups = [
    {
      title: 'Overview',
      items: [{ label: 'Dashboard', path: '/staff' }],
    },
    {
      title: 'Inventory',
      items: [
        { label: 'Equipment', path: '/staff/equipment' },
        { label: 'QR Labels', path: '/staff/qr-labels' },
      ],
    },
    {
      title: 'Transactions',
      items: [
        { label: 'Requests', path: '/staff/requests' },
        { label: 'Returns', path: '/staff/returns' },
        { label: 'History', path: '/staff/history' },
      ],
    },
    {
      title: 'Maintenance',
      items: [{ label: 'Maintenance', path: '/staff/maintenance' }],
    },
    {
      title: 'Alerts',
      items: [{ label: 'Alerts', path: '/alerts', isAlerts: true }],
    },
  ];

  const studentGroups = [
    {
      title: 'Overview',
      items: [{ label: 'Dashboard', path: '/student' }],
    },
    {
      title: 'Equipment',
      items: [
        { label: 'Equipment', path: '/student/equipment' },
        { label: 'Scan QR', path: '/student/scan' },
      ],
    },
    {
      title: 'Transactions',
      items: [{ label: 'My Transactions', path: '/student/transactions' }],
    },
    {
      title: 'Alerts',
      items: [{ label: 'Alerts', path: '/alerts', isAlerts: true }],
    },
  ];

  const groups = user?.role === 'staff' ? staffGroups : studentGroups;

  const renderNav = (onItemClick) => (
    <nav className="sidebar-nav">
      {groups.map((group) => (
        <div key={group.title} className="sidebar-group">
          <div className="sidebar-group-title">{group.title}</div>
          {group.items.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-link ${active ? 'active' : ''}`}
                onClick={onItemClick}
              >
                <span>{item.label}</span>
                {item.isAlerts && unreadCount > 0 && (
                  <span className="sidebar-alerts-pill">{unreadCount}</span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="layout-root">
      {/* Mobile Top Bar (visible below 800px) */}
      <header className="mobile-top-bar no-print">
        <div className="mobile-brand">Smart Lab</div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
        >
          Menu
        </button>
      </header>

      {/* Mobile Menu Dropdown (below mobile bar) */}
      {mobileMenuOpen && (
        <div className="mobile-menu-dropdown no-print">
          {renderNav(() => setMobileMenuOpen(false))}
          <div className="sidebar-bottom">
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role">{user?.role}</div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Desktop Fixed Left Sidebar */}
      <aside className="sidebar no-print">
        <div className="sidebar-top">
          <div className="sidebar-brand-title">Smart Lab</div>
          <div className="sidebar-brand-desc">Resource Management</div>
        </div>

        <div className="sidebar-body">
          {renderNav()}
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-user-name" title={user?.name}>
            {user?.name}
          </div>
          <div className="sidebar-user-role">{user?.role}</div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-area">
        <div className="main-content-inner">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
}

