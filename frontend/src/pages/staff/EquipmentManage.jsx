import { useState, useEffect, useCallback } from 'react';
import { getEquipment, getCategories, deleteEquipment, getQr } from '../../api/equipmentApi';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import EquipmentForm from '../../components/EquipmentForm';
import PageHeader from '../../components/PageHeader';
import { EmptyState, LoadingState, ErrorState } from '../../components/States';

export default function EquipmentManage() {
  const [equipmentList, setEquipmentList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter states
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [availability, setAvailability] = useState('');
  const [condition, setCondition] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });

  // Modal states for Add / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);

  // Modal states for QR
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [selectedItemForQr, setSelectedItemForQr] = useState(null);

  // Debounce search input by 400ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchInput]);

  useEffect(() => {
    document.title = 'Equipment | Smart Lab';
  }, []);

  // Fetch categories on mount
  const fetchCategoryList = async () => {
    try {
      const res = await getCategories();
      if (res && res.success && Array.isArray(res.data)) {
        setCategories(res.data);
      }
    } catch {
      // Silently handle error
    }
  };

  useEffect(() => {
    fetchCategoryList();
  }, []);

  // Fetch equipment list
  const fetchList = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        page,
        limit: 12,
      };
      if (search.trim()) params.search = search.trim();
      if (category) params.category = category;
      if (availability) params.availability = availability;
      if (condition) params.condition = condition;

      const res = await getEquipment(params);
      if (res && res.success) {
        setEquipmentList(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load equipment';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [page, search, category, availability, condition]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Handlers for Add / Edit
  const handleOpenAdd = () => {
    setEditingEquipment(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingEquipment(item);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingEquipment(null);
  };

  const handleFormSuccess = () => {
    handleCloseModal();
    fetchList();
    fetchCategoryList();
  };

  const handleDelete = async (id, name) => {
    const confirmed = window.confirm(`Are you sure you want to retire/delete "${name}"?`);
    if (!confirmed) return;

    try {
      await deleteEquipment(id);
      fetchList();
      fetchCategoryList();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to delete equipment');
    }
  };

  // QR Handlers
  const fetchQrCode = async (id) => {
    setQrLoading(true);
    try {
      const res = await getQr(id);
      if (res && res.success) {
        setQrData(res.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to fetch QR code');
    } finally {
      setQrLoading(false);
    }
  };

  const handleOpenQr = (item) => {
    setSelectedItemForQr(item);
    setQrData(null);
    setQrModalOpen(true);
    fetchQrCode(item._id);
  };

  const handleCloseQrModal = () => {
    setQrModalOpen(false);
    setSelectedItemForQr(null);
    setQrData(null);
  };

  const handleDownloadQr = () => {
    if (!qrData || !qrData.qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrData.qrDataUrl;
    link.download = `${qrData.equipmentId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintQr = () => {
    window.print();
  };

  const handleRegenerateQr = () => {
    if (selectedItemForQr) {
      fetchQrCode(selectedItemForQr._id);
    }
  };

  return (
    <div className="container">
      <PageHeader
        title="Equipment"
        description="Browse and manage laboratory equipment"
      >
        <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
          Add equipment
        </button>
      </PageHeader>

      {/* Error message */}
      <ErrorState message={error} />

      {/* Single Card: Filters row on top, 1px divider, Table, Pagination */}
      <div className="card no-print">
        <div className="filters">
          <div className="filter-item filter-search">
            <label htmlFor="staff-eq-search">Search</label>
            <input
              id="staff-eq-search"
              type="text"
              placeholder="Search by name or ID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="filter-item">
            <label htmlFor="staff-eq-cat">Category</label>
            <select
              id="staff-eq-cat"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="staff-eq-avail">Availability</label>
            <select
              id="staff-eq-avail"
              value={availability}
              onChange={(e) => {
                setAvailability(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Availability</option>
              <option value="available">Available</option>
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="staff-eq-cond">Condition</label>
            <select
              id="staff-eq-cond"
              value={condition}
              onChange={(e) => {
                setCondition(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Conditions</option>
              <option value="GOOD">GOOD</option>
              <option value="FAIR">FAIR</option>
              <option value="NEEDS_REPAIR">NEEDS_REPAIR</option>
            </select>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)' }} />

        {loading ? (
          <LoadingState inCard={false} />
        ) : equipmentList.length === 0 ? (
          <EmptyState
            inCard={false}
            message="No equipment found."
            action={
              <button type="button" className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
                Add equipment
              </button>
            }
          />
        ) : (
          <>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Equipment</th>
                    <th>Category</th>
                    <th>Location</th>
                    <th className="col-numeric">Available</th>
                    <th>Status</th>
                    <th className="col-actions">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {equipmentList.map((item) => (
                    <tr key={item._id}>
                      <td>
                        <div>{item.name}</div>
                        {item.equipmentId && (
                          <div className="secondary-info">
                            {item.equipmentId}
                          </div>
                        )}
                      </td>
                      <td>{item.category}</td>
                      <td>{item.location}</td>
                      <td className="col-numeric">
                        {item.availableQuantity} / {item.totalQuantity}
                      </td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="col-actions">
                        <div className="table-actions">
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenEdit(item)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(item._id, item.name)}
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenQr(item)}
                          >
                            QR
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
              onPageChange={(newPage) => setPage(newPage)}
            />
          </>
        )}
      </div>

      {/* Modal for Add / Edit */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingEquipment ? 'Edit Equipment' : 'Add Equipment'}
      >
        <EquipmentForm
          initialData={editingEquipment}
          onSuccess={handleFormSuccess}
          onCancel={handleCloseModal}
        />
      </Modal>

      {/* Modal for QR Code */}
      <Modal
        isOpen={qrModalOpen}
        onClose={handleCloseQrModal}
        title={`QR Label - ${selectedItemForQr?.equipmentId || ''}`}
      >
        <div>
          {qrLoading ? (
            <LoadingState inCard={false} message="Generating QR Code..." />
          ) : qrData ? (
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  display: 'inline-block',
                  border: '1px solid var(--border)',
                  padding: '16px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--surface)',
                  marginBottom: '16px',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '8px' }}>
                  {qrData.name}
                </div>
                <img
                  src={qrData.qrDataUrl}
                  alt={qrData.equipmentId}
                  style={{ width: '180px', height: '180px', display: 'block', margin: '0 auto' }}
                />
                <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '8px' }}>
                  {qrData.equipmentId}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleDownloadQr}
                >
                  Download PNG
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handlePrintQr}
                >
                  Print
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleRegenerateQr}
                >
                  Regenerate
                </button>
              </div>
            </div>
          ) : (
            <p className="error-text">Failed to load QR code</p>
          )}
        </div>
      </Modal>
    </div>
  );
}
