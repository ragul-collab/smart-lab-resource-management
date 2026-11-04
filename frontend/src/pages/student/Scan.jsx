import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import PageHeader from '../../components/PageHeader';
import { ErrorState } from '../../components/States';

export default function Scan() {
  const navigate = useNavigate();
  const scannerRef = useRef(null);

  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [manualId, setManualId] = useState('');

  useEffect(() => {
    document.title = 'Scan QR | Smart Lab';
  }, []);

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch {
        // Silently handle error
      }
    }
    setIsScanning(false);
  };

  const handleScanSuccess = async (scannedText) => {
    await stopScanner();
    const trimmed = (scannedText || '').trim();
    // Take the last path segment (works for full URL http://.../equipment/EQ-001 or just EQ-001)
    const segments = trimmed.replace(/\/+$/, '').split('/');
    const code = segments[segments.length - 1];
    if (code) {
      navigate(`/equipment/${encodeURIComponent(code)}`);
    }
  };

  const startScanner = async () => {
    setScannerError('');
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('reader');
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {
          // ignore routine frame decode errors
        }
      );
      setIsScanning(true);
    } catch (err) {
      const errStr = String(err);
      if (errStr.includes('NotAllowedError') || errStr.includes('Permission')) {
        setScannerError('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (errStr.includes('NotFoundError') || errStr.includes('DevicesNotFoundError')) {
        setScannerError('No camera found on this device.');
      } else {
        setScannerError(`Camera error: ${errStr}`);
      }
      setIsScanning(false);
    }
  };

  // Always stop the camera when leaving the page
  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualId.trim()) {
      stopScanner();
      navigate(`/equipment/${encodeURIComponent(manualId.trim())}`);
    }
  };

  return (
    <div className="container">
      <PageHeader
        title="Scan QR Code"
        description="Scan an equipment label to view its details"
      />

      {/* Two cards (stack below 800px) */}
      <div className="scan-grid">
        {/* Left card: Camera */}
        <div className="card" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
            Camera
          </h2>

          <div
            id="reader"
            style={{
              maxWidth: '360px',
              width: '100%',
              minHeight: '260px',
              margin: '0 auto 16px auto',
              backgroundColor: '#F9FAFB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            {!isScanning && (
              <p style={{ color: 'var(--muted)', margin: 0, padding: '16px', fontSize: '13px' }}>
                Camera is off
              </p>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={startScanner}
              disabled={isScanning}
            >
              Start
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={stopScanner}
              disabled={!isScanning}
            >
              Stop
            </button>
          </div>

          {scannerError && (
            <div style={{ marginTop: '16px' }}>
              <ErrorState message={scannerError} inCard={false} />
            </div>
          )}
        </div>

        {/* Right card: Enter equipment ID */}
        <div className="card" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
            Enter equipment ID
          </h2>

          <form onSubmit={handleManualSubmit}>
            <div style={{ marginBottom: '6px' }}>
              <label htmlFor="manual-id">Equipment ID</label>
              <input
                id="manual-id"
                type="text"
                placeholder="e.g. OSC-001"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                style={{ marginBottom: 0 }}
              />
            </div>

            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '16px' }}>
              Use this if the camera is not available.
            </div>

            <button type="submit" className="btn btn-primary">
              Go
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
