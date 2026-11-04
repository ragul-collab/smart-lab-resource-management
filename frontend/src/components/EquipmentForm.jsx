import { useState, useEffect } from 'react';
import { createEquipment, updateEquipment } from '../api/equipmentApi';

export default function EquipmentForm({ initialData, onSuccess, onCancel }) {
  const isEdit = Boolean(initialData?._id);

  const [equipmentId, setEquipmentId] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [totalQuantity, setTotalQuantity] = useState(1);
  const [condition, setCondition] = useState('GOOD');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setEquipmentId(initialData.equipmentId || '');
      setName(initialData.name || '');
      setCategory(initialData.category || '');
      setLocation(initialData.location || '');
      setTotalQuantity(initialData.totalQuantity ?? 1);
      setCondition(initialData.condition || 'GOOD');
      setDescription(initialData.description || '');
    } else {
      setEquipmentId('');
      setName('');
      setCategory('');
      setLocation('');
      setTotalQuantity(1);
      setCondition('GOOD');
      setDescription('');
    }
    setError('');
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isEdit) {
        await updateEquipment(initialData._id, {
          name: name.trim(),
          category: category.trim(),
          location: location.trim(),
          totalQuantity: parseInt(totalQuantity, 10),
          condition,
          description: description.trim(),
        });
      } else {
        await createEquipment({
          equipmentId: equipmentId.trim().toUpperCase(),
          name: name.trim(),
          category: category.trim(),
          location: location.trim(),
          totalQuantity: parseInt(totalQuantity, 10),
          condition,
          description: description.trim(),
        });
      }
      onSuccess();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save equipment';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="eq-id">Equipment ID</label>
        <input
          id="eq-id"
          type="text"
          value={equipmentId}
          onChange={(e) => setEquipmentId(e.target.value)}
          required
          disabled={isEdit || submitting}
          placeholder="e.g. OSC-001"
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="eq-name">Name</label>
        <input
          id="eq-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={submitting}
          placeholder="e.g. Digital Storage Oscilloscope"
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="eq-category">Category</label>
        <input
          id="eq-category"
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          disabled={submitting}
          placeholder="e.g. Electronics, Optics, Chemistry"
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="eq-location">Location</label>
        <input
          id="eq-location"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
          disabled={submitting}
          placeholder="e.g. Lab 2, Shelf B"
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="eq-total-qty">Total Quantity</label>
        <input
          id="eq-total-qty"
          type="number"
          min="1"
          value={totalQuantity}
          onChange={(e) => setTotalQuantity(e.target.value)}
          required
          disabled={submitting}
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="eq-condition">Condition</label>
        <select
          id="eq-condition"
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          disabled={submitting}
        >
          <option value="GOOD">GOOD</option>
          <option value="FAIR">FAIR</option>
          <option value="NEEDS_REPAIR">NEEDS_REPAIR</option>
        </select>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="eq-desc">Description</label>
        <textarea
          id="eq-desc"
          rows="3"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={submitting}
          placeholder="Optional equipment specifications, details, or notes"
        />
      </div>

      {error && <p className="error-text">{error}</p>}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
        {onCancel && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Equipment'}
        </button>
      </div>
    </form>
  );
}
