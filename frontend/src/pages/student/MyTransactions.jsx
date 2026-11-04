import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getMyTransactions, cancelRequest, requestReturn } from '../../api/transactionApi';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import PageHeader from '../../components/PageHeader';
import { EmptyState, LoadingState, ErrorState } from '../../components/States';
import { formatDate } from '../../utils/formatDate';

export default function MyTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'My Transactions | Smart Lab';
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;

      const res = await getMyTransactions(params);
      if (res && res.success) {
        setTransactions(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleCancel = async (id) => {
    const confirmed = window.confirm('Are you sure you want to cancel this request?');
    if (!confirmed) return;

    try {
      await cancelRequest(id);
      fetchTransactions();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to cancel request');
    }
  };

  const handleRequestReturn = async (id) => {
    const confirmed = window.confirm('Are you sure you want to request return for this equipment?');
    if (!confirmed) return;

    try {
      await requestReturn(id);
      fetchTransactions();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to request return');
    }
  };

  const renderDetails = (item) => {
    const badges = [];
    const textNotes = [];
    if (item.isOverdue) badges.push(<StatusBadge key="overdue" status="OVERDUE" label="Overdue" />);
    if (item.isLate) badges.push(<StatusBadge key="late" status="RETURNED_LATE" label="Returned late" />);
    if (item.status === 'REJECTED' && item.rejectionReason) {
      textNotes.push(`Reason: ${item.rejectionReason}`);
    }

    if (badges.length === 0 && textNotes.length === 0) return '—';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {badges.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {badges}
          </div>
        )}
        {textNotes.length > 0 && (
          <div className="secondary-info">
            {textNotes.join(', ')}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container">
      <PageHeader
        title="My Transactions"
        description="Track your equipment requests and returns"
      />

      <ErrorState message={error} />

      {/* Single Card: Filters row on top, 1px divider, Table, Pagination */}
      <div className="card">
        <div className="filters">
          <div className="filter-item">
            <label htmlFor="tx-filter-status">Status</label>
            <select
              id="tx-filter-status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="ISSUED">ISSUED</option>
              <option value="RETURN_REQUESTED">RETURN_REQUESTED</option>
              <option value="RETURNED">RETURNED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)' }} />

        {loading ? (
          <LoadingState inCard={false} />
        ) : transactions.length === 0 ? (
          <EmptyState
            inCard={false}
            message="You have no transactions yet."
            action={
              <Link to="/student/equipment" className="btn btn-primary btn-sm">
                Browse equipment
              </Link>
            }
          />
        ) : (
          <>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Equipment</th>
                    <th className="col-numeric">Qty</th>
                    <th>Purpose</th>
                    <th>Requested</th>
                    <th>Due date</th>
                    <th>Status</th>
                    <th>Details</th>
                    <th className="col-actions">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((item) => (
                    <tr key={item._id}>
                      <td>
                        <div>{item.equipment?.name || '—'}</div>
                        {item.equipment?.equipmentId && (
                          <div className="secondary-info">
                            {item.equipment?.equipmentId}
                          </div>
                        )}
                      </td>
                      <td className="col-numeric">{item.quantity}</td>
                      <td>{item.purpose || '—'}</td>
                      <td>{formatDate(item.requestedAt)}</td>
                      <td>{formatDate(item.dueDate)}</td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                      <td>{renderDetails(item)}</td>
                      <td className="col-actions">
                        <div className="table-actions">
                          {item.status === 'PENDING' && (
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => handleCancel(item._id)}
                            >
                              Cancel
                            </button>
                          )}
                          {item.status === 'ISSUED' && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleRequestReturn(item._id)}
                            >
                              Request Return
                            </button>
                          )}
                          {item.status !== 'PENDING' && item.status !== 'ISSUED' && (
                            <span style={{ color: 'var(--muted)' }}>-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={pagination.page}
              pages={pagination.pages}
              onPageChange={(p) => setPage(p)}
            />
          </>
        )}
      </div>
    </div>
  );
}
