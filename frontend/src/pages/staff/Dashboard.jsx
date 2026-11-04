import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStats } from '../../api/dashboardApi';
import PageHeader from '../../components/PageHeader';
import StatBox from '../../components/StatBox';
import { LoadingState, ErrorState } from '../../components/States';

export default function StaffDashboard() {
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

  const pendingRequests = stats?.pendingRequests ?? 0;
  const returnRequests = stats?.returnRequests ?? 0;
  const overdue = stats?.overdue ?? 0;

  return (
    <div className="container">
      <PageHeader
        title="Dashboard"
        description="Overview of laboratory resources"
      />

      <ErrorState message={error} />

      {loading ? (
        <LoadingState />
      ) : (
        <>
          {/* Inventory Section */}
          <h2 className="dashboard-section-heading">Inventory</h2>
          <div className="stat-grid">
            <StatBox
              label="Equipment items"
              value={stats?.totalEquipment ?? 0}
              to="/staff/equipment"
            />
            <StatBox
              label="Total units"
              value={stats?.totalUnits ?? 0}
              to="/staff/equipment"
            />
            <StatBox
              label="Available units"
              value={stats?.availableUnits ?? 0}
              to="/staff/equipment"
            />
            <StatBox
              label="Units issued"
              value={stats?.issuedUnits ?? 0}
              to="/staff/equipment"
            />
          </div>

          {/* Needs Attention Section */}
          <h2 className="dashboard-section-heading">Needs attention</h2>
          <div className="stat-grid">
            <StatBox
              label="Pending requests"
              value={pendingRequests}
              to="/staff/requests"
              danger={pendingRequests > 0}
            />
            <StatBox
              label="Return requests"
              value={returnRequests}
              to="/staff/returns"
              danger={returnRequests > 0}
            />
            <StatBox
              label="Overdue"
              value={overdue}
              to="/staff/history"
              danger={overdue > 0}
            />
            <StatBox
              label="In maintenance"
              value={stats?.inMaintenance ?? 0}
              to="/staff/maintenance"
            />
          </div>

          {/* Quick links Section */}
          <h2 className="dashboard-section-heading">Quick links</h2>
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="quick-links-list">
              <Link to="/staff/equipment" className="quick-link-row">
                <span>Add equipment</span>
                <span className="quick-link-action">View</span>
              </Link>
              <Link to="/staff/requests" className="quick-link-row">
                <span>Review requests</span>
                <span className="quick-link-action">View</span>
              </Link>
              <Link to="/staff/returns" className="quick-link-row">
                <span>Confirm returns</span>
                <span className="quick-link-action">View</span>
              </Link>
              <Link to="/staff/qr-labels" className="quick-link-row">
                <span>Print QR labels</span>
                <span className="quick-link-action">View</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
