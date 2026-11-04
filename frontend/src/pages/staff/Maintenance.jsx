import { useState, useEffect, useCallback } from 'react';
import {
  getMaintenance,
  createMaintenance,
  startMaintenance,
  completeMaintenance,
} from '../../api/maintenanceApi';
import { getEquipment } from '../../api/equipmentApi';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import PageHeader from '../../components/PageHeader';
import { EmptyState, LoadingState, ErrorState } from '../../components/States';
import { formatDate } from '../../utils/formatDate';

export default function Maintenance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Add Record Modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [eqSearch, setEqSearch] = useState('');
  const [equipmentOptions, setEquipmentOptions] = useState([]);
  const [eqLoading, setEqLoading] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [type, setType] = useState('REPAIR');
  const [issue, setIssue] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [markUnavailable, setMarkUnavailable] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  // Complete Modal state
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [completeRemarks, setCompleteRemarks] = useState('');
  const [completeCondition, setCompleteCondition] = useState('GOOD');
  const [completeLoading, setCompleteLoading] = useState(false);
  const [completeError, setCompleteError] = useState('');

  // Fetch maintenance records
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setPageError('');
    try {
      const params = { page, limit: 10 };
      if (statusFilter) {
        params.status = statusFilter;
      }
      const res = await getMaintenance(params);
      if (res && res.success) {
        setRecords(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      setPageError(err.response?.data?.message || err.message || 'Failed to load maintenance records');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    document.title = 'Maintenance | Smart Lab';
  }, []);

  // Fetch equipment options for picker
  const fetchEquipmentOptions = useCallback(async (searchQuery = '') => {
    setEqLoading(true);
    try {
      const params = { limit: 50 };
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      const res = await getEquipment(params);
      if (res && res.success) {
        setEquipmentOptions(res.data || []);
      }
    } catch {
      // Silently handle error
    } finally {
      setEqLoading(false);
    }
  }, []);

  // Debounced equipment search in Add Modal
  useEffect(() => {
    if (!addModalOpen) return;
    const timer = setTimeout(() => {
      fetchEquipmentOptions(eqSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [eqSearch, addModalOpen, fetchEquipmentOptions]);

  const handleOpenAddModal = () => {
    setEqSearch('');
    setSelectedEquipment('');
    setType('REPAIR');
    setIssue('');
    setScheduledDate('');
    setMarkUnavailable(false);
    setAddError('');
    setAddModalOpen(true);
    fetchEquipmentOptions('');
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setAddError('');

    if (!selectedEquipment) {
      setAddError('Please select an equipment item from the list');
      return;
    }

    if (!issue.trim()) {
      setAddError('Issue description is required');
      return;
    }

    setAddLoading(true);
    try {
      const payload = {
        equipment: selectedEquipment,
        type,
        issue: issue.trim(),
        scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : undefined,
        markUnavailable,
      };

      await createMaintenance(payload);
      setAddModalOpen(false);
      fetchRecords();
    } catch (err) {
      setAddError(err.response?.data?.message || err.message || 'Failed to create maintenance record');
    } finally {
      setAddLoading(false);
    }
  };

  const handleStart = async (id) => {
    setActionLoadingId(id);
    setPageError('');
    try {
      await startMaintenance(id);
      fetchRecords();
    } catch (err) {
      setPageError(err.response?.data?.message || err.message || 'Failed to start maintenance');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenComplete = (record) => {
    setSelectedRecord(record);
    setCompleteRemarks('');
    setCompleteCondition('GOOD');
    setCompleteError('');
    setCompleteModalOpen(true);
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRecord) return;

    setCompleteError('');
    setCompleteLoading(true);
    try {
      await completeMaintenance(selectedRecord._id, {
        remarks: completeRemarks.trim(),
        condition: completeCondition,
      });
      setCompleteModalOpen(false);
      fetchRecords();
    } catch (err) {
      setCompleteError(err.response?.data?.message || err.message || 'Failed to complete maintenance');
    } finally {
      setCompleteLoading(false);
    }
  };

  const selectedEquipmentObj = equipmentOptions.find((eq) => eq._id === selectedEquipment);

  return (
    <div className="container">
      <PageHeader
        title="Maintenance"
        description="Track repairs and calibration"
      >
        <button type="button" className="btn btn-primary" onClick={handleOpenAddModal}>
          Add Record
        </button>
      </PageHeader>

      <ErrorState message={pageError} inCard={false} />

      {/* One card: filters row, divider, table, Pagination */}
      <div className="card">
        <div className="filters">
          <div className="filter-item">
            <label htmlFor="status-filter">Status</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All</option>
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)' }} />

        {loading ? (
          <LoadingState inCard={false} />
        ) : records.length === 0 ? (
          <EmptyState inCard={false} message="No maintenance records." />
        ) : (
          <>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Equipment</th>
                    <th>Type</th>
                    <th>Issue</th>
                    <th>Scheduled</th>
                    <th>Status</th>
                    <th>Equipment unavailable</th>
                    <th>Completed on</th>
                    <th className="col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec) => (
                    <tr key={rec._id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{rec.equipment?.name || '—'}</div>
                        {rec.equipment?.equipmentId && (
                          <div className="secondary-info">
                            {rec.equipment.equipmentId}
                          </div>
                        )}
                      </td>
                      <td>{rec.type}</td>
                      <td style={{ maxWidth: '240px', wordBreak: 'break-word' }}>{rec.issue}</td>
                      <td>{formatDate(rec.scheduledDate)}</td>
                      <td>
                        <StatusBadge status={rec.status} />
                      </td>
                      <td>
                        {rec.markedUnavailable ? (
                          <span
                            style={{
                              display: 'inline-block',
                              borderRadius: '999px',
                              padding: '2px 10px',
                              fontSize: '12px',
                              fontWeight: 500,
                              backgroundColor: '#F1F3F4',
                              color: '#5F6368',
                              whiteSpace: 'nowrap',
                              lineHeight: '1.4',
                            }}
                          >
                            Unavailable
                          </span>
                        ) : (
                          <span style={{ color: 'var(--muted)' }}>—</span>
                        )}
                      </td>
                      <td>{rec.completedAt ? formatDate(rec.completedAt) : <span style={{ color: 'var(--muted)' }}>—</span>}</td>
                      <td className="col-actions">
                        <div className="table-actions">
                          {rec.status === 'OPEN' && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleStart(rec._id)}
                              disabled={actionLoadingId === rec._id}
                            >
                              {actionLoadingId === rec._id ? 'Starting...' : 'Start'}
                            </button>
                          )}
                          {(rec.status === 'OPEN' || rec.status === 'IN_PROGRESS') && (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => handleOpenComplete(rec)}
                            >
                              Complete
                            </button>
                          )}
                          {rec.status === 'COMPLETED' && (
                            <span style={{ color: 'var(--muted)', fontSize: '13px' }}>—</span>
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
              onPageChange={(newPage) => setPage(newPage)}
            />
          </>
        )}
      </div>

      {/* Add Record Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Maintenance Record"
      >
        <form onSubmit={handleCreateSubmit}>
          {/* Equipment Search & Selection */}
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="eq-search">
              Equipment{' '}
              {selectedEquipmentObj && (
                <span style={{ color: 'var(--primary)', fontWeight: 500 }}>
                  — Selected: {selectedEquipmentObj.name} ({selectedEquipmentObj.equipmentId})
                </span>
              )}
            </label>
            <input
              id="eq-search"
              type="text"
              placeholder="Search by equipment name or ID..."
              value={eqSearch}
              onChange={(e) => setEqSearch(e.target.value)}
              disabled={addLoading}
              style={{ marginBottom: '8px' }}
            />
            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: '6px',
                maxHeight: '160px',
                overflowY: 'auto',
                backgroundColor: 'var(--surface)',
              }}
            >
              {eqLoading ? (
                <div style={{ padding: '12px', fontSize: '13px', color: 'var(--muted)', textAlign: 'center' }}>
                  Searching equipment...
                </div>
              ) : equipmentOptions.length === 0 ? (
                <div style={{ padding: '12px', fontSize: '13px', color: 'var(--muted)', textAlign: 'center' }}>
                  No equipment found
                </div>
              ) : (
                equipmentOptions.map((eq) => {
                  const isSelected = selectedEquipment === eq._id;
                  return (
                    <div
                      key={eq._id}
                      onClick={() => setSelectedEquipment(eq._id)}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? '#EEF2FF' : 'transparent',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = '#F9FAFB';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: isSelected ? 600 : 500, color: 'var(--text)' }}>
                          {eq.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                          {eq.equipmentId}
                        </div>
                      </div>
                      <StatusBadge status={eq.status} />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Two-column grid for short fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label htmlFor="rec-type">Type</label>
              <select
                id="rec-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
                disabled={addLoading}
              >
                <option value="REPAIR">REPAIR</option>
                <option value="CALIBRATION">CALIBRATION</option>
                <option value="SERVICE">SERVICE</option>
              </select>
            </div>

            <div>
              <label htmlFor="rec-scheduled">Scheduled Date</label>
              <input
                id="rec-scheduled"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                disabled={addLoading}
              />
            </div>
          </div>

          {/* Issue textarea */}
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="rec-issue">Issue</label>
            <textarea
              id="rec-issue"
              rows="3"
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="Describe the issue or required maintenance..."
              required
              disabled={addLoading}
            />
          </div>

          {/* Checkbox with helper text */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '13px',
                marginBottom: '2px',
              }}
            >
              <input
                type="checkbox"
                checked={markUnavailable}
                onChange={(e) => setMarkUnavailable(e.target.checked)}
                style={{ width: 'auto', height: 'auto', marginBottom: 0 }}
                disabled={addLoading}
              />
              Mark equipment unavailable
            </label>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginLeft: '24px' }}>
              New student requests are blocked until maintenance is completed.
            </div>
          </div>

          {addError && (
            <p className="error-text" style={{ marginBottom: '16px' }}>
              {addError}
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setAddModalOpen(false)}
              disabled={addLoading}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={addLoading}>
              {addLoading ? 'Saving...' : 'Save record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Complete Maintenance Modal */}
      <Modal
        isOpen={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        title="Complete Maintenance"
      >
        <form onSubmit={handleCompleteSubmit}>
          {selectedRecord && (
            <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px' }}>
              Equipment: <strong style={{ color: 'var(--text)' }}>{selectedRecord.equipment?.name}</strong> ({selectedRecord.equipment?.equipmentId})
            </p>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="comp-condition">Condition</label>
            <select
              id="comp-condition"
              value={completeCondition}
              onChange={(e) => setCompleteCondition(e.target.value)}
              required
              disabled={completeLoading}
            >
              <option value="GOOD">GOOD</option>
              <option value="FAIR">FAIR</option>
              <option value="NEEDS_REPAIR">NEEDS_REPAIR</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="comp-remarks">Remarks</label>
            <textarea
              id="comp-remarks"
              rows="3"
              value={completeRemarks}
              onChange={(e) => setCompleteRemarks(e.target.value)}
              placeholder="Enter remarks or service details..."
              disabled={completeLoading}
            />
          </div>

          {completeError && (
            <p className="error-text" style={{ marginBottom: '16px' }}>
              {completeError}
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setCompleteModalOpen(false)}
              disabled={completeLoading}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={completeLoading}>
              {completeLoading ? 'Completing...' : 'Mark as completed'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
