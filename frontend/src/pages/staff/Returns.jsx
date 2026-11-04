import { useState, useEffect, useCallback } from 'react';
import { getAllTransactions, confirmReturn } from '../../api/transactionApi';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import { EmptyState, LoadingState, ErrorState } from '../../components/States';
import { formatDate } from '../../utils/formatDate';

export default function Returns() {
  const [returnRequests, setReturnRequests] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Confirm Return modal states
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [returnCondition, setReturnCondition] = useState('GOOD');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    document.title = 'Returns | Smart Lab';
  }, []);

  const fetchReturnRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAllTransactions({ status: 'RETURN_REQUESTED', page, limit: 10 });
      if (res && res.success) {
        setReturnRequests(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load return requests');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchReturnRequests();
  }, [fetchReturnRequests]);

  const handleOpenConfirm = (item) => {
    setSelectedTransaction(item);
    setReturnCondition('GOOD');
    setRemarks('');
    setModalError('');
    setConfirmModalOpen(true);
  };

  const handleCloseConfirm = () => {
    setConfirmModalOpen(false);
    setSelectedTransaction(null);
    setReturnCondition('GOOD');
    setRemarks('');
    setModalError('');
  };

  const handleConfirmSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError('');

    try {
      await confirmReturn(selectedTransaction._id, {
        returnCondition,
        remarks: remarks.trim(),
      });
      handleCloseConfirm();
      fetchReturnRequests();
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Failed to confirm return');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <PageHeader
        title="Returns"
        description="Confirm equipment returned by students"
      />

      <ErrorState message={error} />

      <div className="card">
        {loading ? (
          <LoadingState inCard={false} />
        ) : returnRequests.length === 0 ? (
          <EmptyState inCard={false} message="No return requests." />
        ) : (
          <>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Equipment</th>
                    <th className="col-numeric">Qty</th>
                    <th>Issued on</th>
                    <th>Due date</th>
                    <th className="col-actions">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {returnRequests.map((item) => (
                    <tr key={item._id}>
                      <td>
                        <div>{item.student?.name || '—'}</div>
                        {(item.student?.registerNumber || item.student?.department) && (
                          <div className="secondary-info">
                            {item.student?.registerNumber || item.student?.department}
                          </div>
                        )}
                      </td>
                      <td>
                        <div>{item.equipment?.name || '—'}</div>
                        {item.equipment?.equipmentId && (
                          <div className="secondary-info">
                            {item.equipment?.equipmentId}
                          </div>
                        )}
                      </td>
                      <td className="col-numeric" style={{ fontWeight: 600 }}>
                        {item.quantity}
                      </td>
                      <td>{formatDate(item.issuedAt)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span>{formatDate(item.dueDate)}</span>
                          {item.isOverdue && <StatusBadge status="OVERDUE" label="Overdue" />}
                        </div>
                      </td>
                      <td className="col-actions">
                        <div className="table-actions">
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleOpenConfirm(item)}
                          >
                            Confirm Return
                          </button>
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

      {/* Confirm Return Modal */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={handleCloseConfirm}
        title="Confirm Equipment Return"
      >
        <form onSubmit={handleConfirmSubmit}>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '12px' }}>
            Confirming return of <strong>{selectedTransaction?.equipment?.name}</strong> (Qty:{' '}
            {selectedTransaction?.quantity}) returned by{' '}
            <strong>{selectedTransaction?.student?.name}</strong>.
          </p>

          <div>
            <label htmlFor="return-condition">Condition on return *</label>
            <select
              id="return-condition"
              value={returnCondition}
              onChange={(e) => setReturnCondition(e.target.value)}
              disabled={submitting}
              style={{ marginBottom: '4px' }}
            >
              <option value="GOOD">GOOD</option>
              <option value="FAIR">FAIR</option>
              <option value="NEEDS_REPAIR">NEEDS_REPAIR</option>
            </select>
            <div className="form-hint" style={{ marginBottom: '12px' }}>
              Choose NEEDS_REPAIR if the item is damaged.
            </div>
          </div>

          <div>
            <label htmlFor="return-remarks">Remarks</label>
            <textarea
              id="return-remarks"
              rows="3"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Returned with all cables and accessories, minor wear"
              disabled={submitting}
            />
          </div>

          {modalError && (
            <p className="error-text" style={{ margin: '8px 0 12px 0' }}>
              {modalError}
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCloseConfirm}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Confirming...' : 'Confirm return'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
