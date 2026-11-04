import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStats } from '../../api/dashboardApi';
import { formatDate } from '../../utils/formatDate';
import PageHeader from '../../components/PageHeader';
import StatBox from '../../components/StatBox';
import StatusBadge from '../../components/StatusBadge';
import { EmptyState, LoadingState, ErrorState } from '../../components/States';

export default function Student() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Dashboard | Smart Lab';
  }, []);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getStats();
        if (res && res.success) {
          setStats(res.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const overdue = stats?.overdue ?? 0;

  const renderDueCell = (dueDateStr) => {
    if (!dueDateStr) return '—';
    const due = new Date(dueDateStr);
    const now = new Date();
    const diffTime = due.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const formattedDate = formatDate(dueDateStr);

    if (diffDays <= 1) {
      const daysText = diffDays <= 0 ? 'Due in 0 days' : `Due in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span>{formattedDate}</span>
          <StatusBadge status="OVERDUE" label={daysText} />
        </div>
      );
    }

    return formattedDate;
  };

  return (
    <div className="container">
      <PageHeader
        title="Dashboard"
        description="Your equipment activity"
      />

      <ErrorState message={error} />

      {loading ? (
        <LoadingState />
      ) : (
        <>
          {/* Overview Section */}
          <h2 className="dashboard-section-heading">Overview</h2>
          <div className="stat-grid">
            <StatBox
              label="Pending"
              value={stats?.pending ?? 0}
              to="/student/transactions"
            />
            <StatBox
              label="Issued"
              value={stats?.issued ?? 0}
              to="/student/transactions"
            />
            <StatBox
              label="Overdue"
              value={overdue}
              to="/student/transactions"
              danger={overdue > 0}
            />
            <StatBox
              label="Returned"
              value={stats?.returned ?? 0}
              to="/student/transactions"
            />
          </div>

          {/* Due Soon Section */}
          <h2 className="dashboard-section-heading">Due soon</h2>
          {!stats?.dueSoon || stats.dueSoon.length === 0 ? (
            <EmptyState message="Nothing due soon." />
          ) : (
            <div className="card">
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Equipment</th>
                      <th className="col-numeric">Qty</th>
                      <th>Due date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.dueSoon.map((item) => (
                      <tr key={item._id}>
                        <td>
                          <div>{item.equipmentName}</div>
                          {item.equipmentId && (
                            <div className="secondary-info">
                              {item.equipmentId}
                            </div>
                          )}
                        </td>
                        <td className="col-numeric">{item.quantity}</td>
                        <td>{renderDueCell(item.dueDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Quick links Section */}
          <h2 className="dashboard-section-heading">Quick links</h2>
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="quick-links-list">
              <Link to="/student/equipment" className="quick-link-row">
                <span>Browse equipment</span>
                <span className="quick-link-action">View</span>
              </Link>
              <Link to="/student/scan" className="quick-link-row">
                <span>Scan a QR code</span>
                <span className="quick-link-action">View</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
