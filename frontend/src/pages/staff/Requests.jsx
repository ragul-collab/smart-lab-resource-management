import { useState, useEffect, useCallback } from 'react';
import { getAllTransactions, approve, reject } from '../../api/transactionApi';
import { getEquipment } from '../../api/equipmentApi';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import PageHeader from '../../components/PageHeader';
import { EmptyState, LoadingState, ErrorState } from '../../components/States';
import { formatDate } from '../../utils/formatDate';

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [equipmentMap, setEquipmentMap] = useState({});
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');

  // Reject modal states
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [rejectError, setRejectError] = useState('');

  useEffect(() => {
    document.title = 'Requests | Smart Lab';
  }, []);

  // Fetch equipment available quantities map
  const fetchEquipmentMap = async () => {
    try {
      const res = await getEquipment({ limit: 100 });
      if (res && res.success && Array.isArray(res.data)) {
        const map = {};
        res.data.forEach((eq) => {
          map[eq._id] = eq.availableQuantity;
        });
        setEquipmentMap(map);
      }
    } catch {
      // Silently handle error
    }
  };

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setActionError('');
    try {
      const res = await getAllTransactions({ status: 'PENDING', page, limit: 10 });
      if (res && res.success) {
        setRequests(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchEquipmentMap();
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (id) => {
    const confirmed = window.confirm('Approve this equipment request?');
    if (!confirmed) return;

    setActionError('');
    try {
      await approve(id);
      fetchRequests();
      fetchEquipmentMap();
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'Failed to approve request');
    }
  };

  const handleOpenReject = (item) => {
    setSelectedRequest(item);
    setRejectReason('');
    setRejectError('');
    setRejectModalOpen(true);
  };

  const handleCloseReject = () => {
    setRejectModalOpen(false);
    setSelectedRequest(null);
    setRejectReason('');
    setRejectError('');
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      setRejectError('Rejection reason is required');
      return;
    }

    setRejecting(true);
    setRejectError('');
    try {
      await reject(selectedRequest._id, rejectReason.trim());
      handleCloseReject();
      fetchRequests();
    } catch (err) {
      setRejectError(err.response?.data?.message || err.message || 'Failed to reject request');
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className="container">
      <PageHeader
        title="Requests"
        description="Review pending student requests"
      />

      <ErrorState message={actionError} />

      <div className="card">
        {loading ? (
          <LoadingState inCard={false} />
        ) : requests.length === 0 ? (
          <EmptyState inCard={false} message="No pending requests." />
        ) : (
          <>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Equipment</th>
                    <th className="col-numeric">Qty</th>
                    <th className="col-numeric">Available now</th>
                    <th>Purpose</th>
                    <th>Due date</th>
                    <th>Requested</th>
                    <th className="col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((item) => {
                    const availableCount =
                      item.equipment?._id && equipmentMap[item.equipment._id] !== undefined
                        ? equipmentMap[item.equipment._id]
                        : item.equipment?.availableQuantity ?? '—';
                    const isShortage =
                      typeof availableCount === 'number' && availableCount < item.quantity;

                    return (
                      <tr key={item._id}>
                        <td>
                          <div>{item.student?.name || '—'}</div>
                          {item.student?.registerNumber && (
                            <div className="secondary-info">
                              {item.student.registerNumber}
                            </div>
                          )}
                        </td>
                        <td>
                          <div>{item.equipment?.name || '—'}</div>
                          {item.equipment?.equipmentId && (
                            <div className="secondary-info">
                              {item.equipment.equipmentId}
                            </div>
                          )}
                        </td>
                        <td className="col-numeric" style={{ fontWeight: 600 }}>
                          {item.quantity}
                        </td>
                        <td
                          className="col-numeric"
                          style={isShortage ? { color: 'var(--danger)', fontWeight: 600 } : {}}
                        >
                          {availableCount}
                        </td>
                        <td>{item.purpose || '—'}</td>
                        <td>{formatDate(item.dueDate)}</td>
                        <td>{formatDate(item.requestedAt)}</td>
                        <td className="col-actions">
                          <div className="table-actions">
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => handleApprove(item._id)}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => handleOpenReject(item)}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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

      {/* Reject Reason Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={handleCloseReject}
        title="Reject Equipment Request"
      >
        <form onSubmit={handleRejectSubmit}>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '12px' }}>
            Rejecting request for <strong>{selectedRequest?.equipment?.name}</strong> by{' '}
            <strong>{selectedRequest?.student?.name}</strong>.
          </p>

          <div>
            <label htmlFor="reject-reason">Reason for rejection</label>
            <textarea
              id="reject-reason"
              rows="3"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Insufficient units available, required for lab exam"
              required
              disabled={rejecting}
              style={{ marginBottom: '4px' }}
            />
            <div className="form-hint" style={{ marginBottom: '12px' }}>
              The student will see this reason.
            </div>
          </div>

          {rejectError && (
            <p className="error-text" style={{ margin: '8px 0 12px 0' }}>
              {rejectError}
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCloseReject}
              disabled={rejecting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-danger" disabled={rejecting}>
              {rejecting ? 'Rejecting...' : 'Reject request'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
