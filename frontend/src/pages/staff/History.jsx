import { useState, useEffect, useCallback } from 'react';
import { getAllTransactions } from '../../api/transactionApi';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import PageHeader from '../../components/PageHeader';
import { EmptyState, LoadingState, ErrorState } from '../../components/States';
import { formatDate } from '../../utils/formatDate';

export default function History() {
  const [transactions, setTransactions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [studentInput, setStudentInput] = useState('');
  const [studentFilter, setStudentFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'History | Smart Lab';
  }, []);

  // Debounce student search input by 400ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setStudentFilter(studentInput);
      setPage(1);
    }, 400);

    return () => clearTimeout(handler);
  }, [studentInput]);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 10,
      };
      if (statusFilter) params.status = statusFilter;
      if (studentFilter.trim()) params.student = studentFilter.trim();
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const res = await getAllTransactions(params);
      if (res && res.success) {
        setTransactions(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, studentFilter, fromDate, toDate]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleClearFilters = () => {
    setStatusFilter('');
    setStudentInput('');
    setStudentFilter('');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const renderNotes = (item) => {
    const badges = [];
    const textNotes = [];
    if (item.isOverdue) badges.push(<StatusBadge key="overdue" status="OVERDUE" label="Overdue" />);
    if (item.isLate) badges.push(<StatusBadge key="late" status="RETURNED_LATE" label="Returned late" />);
    if (item.rejectionReason) textNotes.push(`Reason: ${item.rejectionReason}`);
    if (item.returnCondition) textNotes.push(`Condition: ${item.returnCondition}`);
    if (item.returnRemarks) textNotes.push(`Remarks: ${item.returnRemarks}`);

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
            {textNotes.join('; ')}
          </div>
        )}
      </div>
    );
  };

  const handleDownloadCsv = () => {
    if (transactions.length === 0) {
      alert('No transactions available to download');
      return;
    }

    const headers = [
      'Student Name',
      'Register Number',
      'Department',
      'Equipment Name',
      'Equipment ID',
      'Quantity',
      'Status',
      'Requested On',
      'Issued On',
      'Due Date',
      'Returned On',
      'Notes',
    ];

    const escapeCsv = (val) => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = transactions.map((item) => [
      escapeCsv(item.student?.name || ''),
      escapeCsv(item.student?.registerNumber || ''),
      escapeCsv(item.student?.department || ''),
      escapeCsv(item.equipment?.name || ''),
      escapeCsv(item.equipment?.equipmentId || ''),
      escapeCsv(item.quantity),
      escapeCsv(item.status),
      escapeCsv(formatDate(item.requestedAt)),
      escapeCsv(formatDate(item.issuedAt)),
      escapeCsv(formatDate(item.dueDate)),
      escapeCsv(formatDate(item.returnedAt)),
      escapeCsv(
        [
          item.isOverdue ? 'Overdue' : '',
          item.isLate ? 'Returned late' : '',
          item.rejectionReason ? `Reason: ${item.rejectionReason}` : '',
          item.returnCondition ? `Condition: ${item.returnCondition}` : '',
          item.returnRemarks ? `Remarks: ${item.returnRemarks}` : '',
        ]
          .filter(Boolean)
          .join('; ') || '—'
      ),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `transaction_history_page_${page}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container">
      <PageHeader
        title="History"
        description="All equipment transactions"
      >
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleDownloadCsv}
          disabled={loading || transactions.length === 0}
        >
          Download CSV
        </button>
      </PageHeader>

      <ErrorState message={error} />

      {/* Single Card: Filters row on top, 1px divider, Table, Pagination */}
      <div className="card">
        <div className="filters">
          <div className="filter-item filter-search">
            <label htmlFor="filter-student">Student Search</label>
            <input
              id="filter-student"
              type="text"
              placeholder="Name or Register No..."
              value={studentInput}
              onChange={(e) => setStudentInput(e.target.value)}
            />
          </div>

          <div className="filter-item">
            <label htmlFor="filter-status">Status</label>
            <select
              id="filter-status"
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

          <div className="filter-item">
            <label htmlFor="filter-from">From Date</label>
            <input
              id="filter-from"
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="filter-item">
            <label htmlFor="filter-to">To Date</label>
            <input
              id="filter-to"
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="filter-item" style={{ alignSelf: 'flex-end' }}>
            <button
              type="button"
              className="btn-text"
              onClick={handleClearFilters}
              style={{ height: '38px', display: 'flex', alignItems: 'center' }}
            >
              Clear filters
            </button>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)' }} />

        {loading ? (
          <LoadingState inCard={false} />
        ) : transactions.length === 0 ? (
          <EmptyState inCard={false} message="No transactions match these filters." />
        ) : (
          <>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Equipment</th>
                    <th className="col-numeric">Qty</th>
                    <th>Status</th>
                    <th>Requested</th>
                    <th>Issued</th>
                    <th>Due</th>
                    <th>Returned</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((item) => (
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
                      <td className="col-numeric">{item.quantity}</td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                      <td>{formatDate(item.requestedAt)}</td>
                      <td>{formatDate(item.issuedAt)}</td>
                      <td>{formatDate(item.dueDate)}</td>
                      <td>{formatDate(item.returnedAt)}</td>
                      <td>{renderNotes(item)}</td>
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
