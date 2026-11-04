import { useState, useEffect } from 'react';
import { getEquipment, getQr } from '../../api/equipmentApi';
import PageHeader from '../../components/PageHeader';
import { EmptyState, LoadingState, ErrorState } from '../../components/States';

export default function QRLabels() {
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'QR Labels | Smart Lab';
  }, []);

  useEffect(() => {
    const loadLabels = async () => {
      setLoading(true);
      setError('');

      try {
        const res = await getEquipment({ limit: 100 });
        if (res && res.success && Array.isArray(res.data)) {
          const rawItems = res.data;

          // Fetch QR for each item in parallel
          const itemsWithQr = await Promise.all(
            rawItems.map(async (item) => {
              try {
                const qrRes = await getQr(item._id);
                return {
                  ...item,
                  qrDataUrl: qrRes.data?.qrDataUrl,
                };
              } catch (err) {
                return {
                  ...item,
                  qrDataUrl: null,
                };
              }
            })
          );

          setItems(itemsWithQr);
          setSelectedIds(new Set(itemsWithQr.map((i) => i._id)));
        }
      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Failed to load QR labels';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    loadLabels();
  }, []);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i._id)));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container">
      <PageHeader
        title="QR Labels"
        description="Select equipment and print labels"
      >
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleToggleSelectAll}
          disabled={loading || items.length === 0}
        >
          {selectedIds.size === items.length ? 'Clear' : 'Select all'}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handlePrint}
          disabled={loading || selectedIds.size === 0}
        >
          Print Labels
        </button>
      </PageHeader>

      <div className="no-print">
        <ErrorState message={error} inCard={false} />
      </div>

      {loading ? (
        <div className="no-print">
          <LoadingState inCard={true} message="Loading QR labels..." />
        </div>
      ) : items.length === 0 ? (
        <div className="no-print">
          <EmptyState inCard={true} message="No equipment found" />
        </div>
      ) : (
        <>
          {/* Selected count in muted text above the grid */}
          <div className="no-print" style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px' }}>
            {selectedIds.size} of {items.length} selected
          </div>

          {/* Responsive label grid, min 200px columns, 16px gap */}
          <div
            className="print-area"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '16px',
            }}
          >
            {items.map((item) => {
              const isChecked = selectedIds.has(item._id);

              return (
                <div
                  key={item._id}
                  className={`card ${isChecked ? '' : 'no-print'}`}
                  style={{
                    padding: '16px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginBottom: 0,
                    pageBreakInside: 'avoid',
                    border: isChecked ? '1px solid var(--primary)' : '1px solid var(--border)',
                  }}
                >
                  {/* Checkbox top-left (hidden in print) */}
                  <div
                    className="no-print"
                    style={{
                      alignSelf: 'flex-start',
                      marginBottom: '8px',
                    }}
                  >
                    <input
                      type="checkbox"
                      id={`check-${item._id}`}
                      checked={isChecked}
                      onChange={() => toggleSelect(item._id)}
                      aria-label={`Select ${item.name} for printing`}
                      style={{ width: 'auto', height: 'auto', marginBottom: 0, cursor: 'pointer' }}
                    />
                  </div>

                  {/* QR Image */}
                  {item.qrDataUrl ? (
                    <img
                      src={item.qrDataUrl}
                      alt={`QR for ${item.equipmentId}`}
                      style={{
                        width: '140px',
                        height: '140px',
                        display: 'block',
                        margin: '0 auto 10px auto',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '140px',
                        height: '140px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px dashed var(--border)',
                        marginBottom: '10px',
                        fontSize: '12px',
                        color: 'var(--muted)',
                      }}
                    >
                      No QR
                    </div>
                  )}

                  {/* Equipment Info: name (500), Equipment ID (muted 13px), location (muted 12px) */}
                  <div
                    style={{
                      fontWeight: 500,
                      fontSize: '14px',
                      color: 'var(--text)',
                      marginBottom: '2px',
                      lineHeight: 1.3,
                    }}
                  >
                    {item.name}
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      color: 'var(--muted)',
                      marginBottom: '2px',
                    }}
                  >
                    {item.equipmentId}
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '12px' }}>
                    {item.location}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
