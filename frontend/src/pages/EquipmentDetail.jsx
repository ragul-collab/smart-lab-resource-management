import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getByCode } from '../api/equipmentApi';
import { requestEquipment } from '../api/transactionApi';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import { EmptyState, LoadingState, ErrorState } from '../components/States';

export default function EquipmentDetail() {
  const { equipmentId } = useParams();
  const { user } = useAuth();

  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');

  // Request modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [purpose, setPurpose] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [requestSuccess, setRequestSuccess] = useState(false);

  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const getMaxDateStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  };

  useEffect(() => {
    const fetchEquipment = async () => {
      setLoading(true);
      setError('');
      setNotFound(false);

      try {
        const res = await getByCode(equipmentId);
        if (res && res.success && res.data) {
          setEquipment(res.data);
        } else {
          setNotFound(true);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setNotFound(true);
        } else {
          setError(err.response?.data?.message || err.message || 'Failed to load equipment');
        }
      } finally {
        setLoading(false);
      }
    };

    if (equipmentId) {
      fetchEquipment();
    }
  }, [equipmentId]);

  useEffect(() => {
    if (equipment?.name) {
      document.title = `${equipment.name} | Smart Lab`;
    } else {
      document.title = 'Equipment Details | Smart Lab';
    }
  }, [equipment]);

  const handleOpenModal = () => {
    setQuantity(1);
    setPurpose('');
    setExpectedReturnDate(getTomorrowStr());
    setRequestError('');
    setModalOpen(true);
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setRequestError('');
    setSubmitting(true);

    try {
      await requestEquipment({
        equipmentId: equipment._id,
        quantity: parseInt(quantity, 10),
        purpose: purpose.trim(),
        expectedReturnDate: new Date(expectedReturnDate).toISOString(),
      });
      setModalOpen(false);
      setRequestSuccess(true);
    } catch (err) {
      setRequestError(err.response?.data?.message || err.message || 'Request failed');
    } finally {
      setSubmitting(false);
    }
  };

  const backLink = user?.role === 'staff' ? '/staff/equipment' : '/student/equipment';

  if (loading) {
    return (
      <div className="container">
        <LoadingState inCard={true} />
      </div>
    );
  }

  if (notFound || !equipment) {
    return (
      <div className="container">
        <EmptyState
          inCard={true}
          message={`The requested equipment with ID "${equipmentId}" was not found or is no longer active.`}
          action={
            <Link to={backLink} className="btn btn-secondary btn-sm">
              Back to equipment list
            </Link>
          }
        />
      </div>
    );
  }

  const isAvailable = equipment.status === 'AVAILABLE' && equipment.availableQuantity > 0;
  const isStaff = user?.role === 'staff';

  return (
    <div className="container">
      <PageHeader
        title={equipment.name || 'Equipment'}
        description="Equipment details"
      >
        <Link to={backLink} className="btn btn-secondary">
          Back
        </Link>
      </PageHeader>

      <ErrorState message={error} inCard={false} />

      {/* Two cards side by side (stacks below 800px) */}
      <div className="detail-grid">
        {/* Left card: Details */}
        <div className="card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: '16px' }}>
            Details
          </div>
          <table className="detail-table">
            <tbody>
              <tr>
                <th>ID</th>
                <td className="equipment-id">{equipment.equipmentId}</td>
              </tr>
              <tr>
                <th>Category</th>
                <td>{equipment.category}</td>
              </tr>
              <tr>
                <th>Description</th>
                <td>{equipment.description || '—'}</td>
              </tr>
              <tr>
                <th>Location</th>
                <td>{equipment.location}</td>
              </tr>
              <tr>
                <th>Condition</th>
                <td>
                  <StatusBadge status={equipment.condition} />
                </td>
              </tr>
              <tr>
                <th>Total units</th>
                <td>{equipment.totalQuantity}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Right card: Availability */}
        <div className="card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: '16px' }}>
            Availability
          </div>
          <div style={{ padding: '20px' }}>
            <div
              style={{
                fontSize: '28px',
                fontWeight: 600,
                color: equipment.availableQuantity === 0 ? 'var(--danger)' : 'var(--text)',
                lineHeight: 1.2,
              }}
            >
              {equipment.availableQuantity}
            </div>
            <div
              style={{
                fontSize: '13px',
                color: equipment.availableQuantity === 0 ? 'var(--danger)' : 'var(--muted)',
                marginTop: '4px',
                marginBottom: '16px',
              }}
            >
              {equipment.availableQuantity === 0 ? '0 units available' : 'units available for request'}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <StatusBadge status={equipment.status} />
            </div>

            {requestSuccess ? (
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: '#E6F4EA',
                  border: '1px solid #CEEAD6',
                  borderRadius: '6px',
                }}
              >
                <div style={{ fontWeight: 600, color: '#137333', fontSize: '14px', marginBottom: '4px' }}>
                  Request submitted
                </div>
                <Link
                  to="/student/transactions"
                  style={{ fontSize: '13px', color: '#137333', textDecoration: 'underline' }}
                >
                  View in My Transactions
                </Link>
              </div>
            ) : (
              <>
                {!isAvailable && !isStaff && (
                  <p className="error-text" style={{ marginBottom: '10px' }}>
                    {equipment.status !== 'AVAILABLE'
                      ? `Equipment is currently ${equipment.status.replace(/_/g, ' ')}.`
                      : 'No units currently available.'}
                  </p>
                )}
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  disabled={!isAvailable || isStaff}
                  onClick={handleOpenModal}
                >
                  Request equipment
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Request Modal for Student */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Request ${equipment.name}`}
      >
        <form onSubmit={handleRequestSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="req-qty">Quantity (Available: {equipment.availableQuantity})</label>
            <input
              id="req-qty"
              type="number"
              min="1"
              max={equipment.availableQuantity}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="req-purpose">Purpose</label>
            <textarea
              id="req-purpose"
              rows="3"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Lab experiment, academic research project"
              disabled={submitting}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="req-return-date">Expected Return Date (Max 14 days)</label>
            <input
              id="req-return-date"
              type="date"
              min={getTomorrowStr()}
              max={getMaxDateStr()}
              value={expectedReturnDate}
              onChange={(e) => setExpectedReturnDate(e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          {requestError && <p className="error-text">{requestError}</p>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
