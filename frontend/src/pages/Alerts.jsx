import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAlerts, markRead, markAllRead } from '../api/alertApi';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import { EmptyState, LoadingState, ErrorState } from '../components/States';

function formatDateTime(dateString) {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export default function Alerts() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchAlertList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAlerts();
      if (res && res.success) {
        setAlerts(res.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Alerts | Smart Lab';
  }, []);

  useEffect(() => {
    fetchAlertList();
  }, [fetchAlertList]);

  const notifyBellRefresh = () => {
    window.dispatchEvent(new Event('alerts-updated'));
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    setError('');
    try {
      await markAllRead();
      await fetchAlertList();
      notifyBellRefresh();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  };

  const handleMarkRead = async (id) => {
    setActionLoadingId(id);
    setError('');
    try {
      await markRead(id);
      await fetchAlertList();
      notifyBellRefresh();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to mark alert as read');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleView = async (alert) => {
    // If not read yet, mark as read
    if (!alert.isRead) {
      try {
        await markRead(alert._id);
        notifyBellRefresh();
      } catch {
        // Silently handle error
      }
    }

    // Determine target path
    let targetPath = '/';
    if (user?.role === 'student') {
      targetPath = '/student/transactions';
    } else if (user?.role === 'staff') {
      const type = alert.type || '';
      if (type === 'NEW_REQUEST' || type === 'REQUEST_CANCELLED') {
        targetPath = '/staff/requests';
      } else if (type === 'RETURN_REQUESTED') {
        targetPath = '/staff/returns';
      } else if (type.startsWith('MAINTENANCE_')) {
        targetPath = '/staff/maintenance';
      } else if (type === 'OVERDUE') {
        targetPath = '/staff/history';
      } else {
        targetPath = '/staff';
      }
    }

    navigate(targetPath);
  };

  const unreadAlertsExist = alerts.some((a) => !a.isRead);

  return (
    <div className="container">
      <PageHeader
        title="Alerts"
        description="Notifications about your activity"
      >
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleMarkAllRead}
          disabled={markingAll || !unreadAlertsExist}
        >
          {markingAll ? 'Updating...' : 'Mark all as read'}
        </button>
      </PageHeader>

      <ErrorState message={error} inCard={false} />

      {loading ? (
        <LoadingState inCard={true} />
      ) : alerts.length === 0 ? (
        <EmptyState inCard={true} message="You have no alerts." />
      ) : (
        /* One card with a list instead of a table */
        <div className="card">
          {alerts.map((alert, index) => {
            const isUnread = !alert.isRead;
            return (
              <div
                key={alert._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  padding: '14px 16px',
                  borderBottom: index === alerts.length - 1 ? 'none' : '1px solid var(--border)',
                  borderLeft: isUnread ? '3px solid var(--primary)' : '3px solid transparent',
                  backgroundColor: isUnread ? '#F5F8FF' : 'var(--surface)',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: isUnread ? 600 : 400,
                      color: 'var(--text)',
                      lineHeight: 1.4,
                    }}
                  >
                    {alert.message}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                    {formatDateTime(alert.createdAt)}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleView(alert)}
                  >
                    View
                  </button>
                  {isUnread && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleMarkRead(alert._id)}
                      disabled={actionLoadingId === alert._id}
                    >
                      {actionLoadingId === alert._id ? 'Updating...' : 'Mark read'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
