import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getEquipment, getCategories } from '../../api/equipmentApi';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import PageHeader from '../../components/PageHeader';
import { EmptyState, LoadingState, ErrorState } from '../../components/States';

export default function StudentEquipment() {
  const [searchParams, setSearchParams] = useSearchParams();

  const searchFromUrl = searchParams.get('search') || '';
  const categoryFromUrl = searchParams.get('category') || '';
  const availabilityFromUrl = searchParams.get('availability') || '';
  const conditionFromUrl = searchParams.get('condition') || '';
  const pageFromUrl = parseInt(searchParams.get('page') || '1', 10);

  const [equipmentList, setEquipmentList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: pageFromUrl, limit: 12, total: 0, pages: 1 });

  const [searchInput, setSearchInput] = useState(searchFromUrl);

  // Set document title
  useEffect(() => {
    document.title = 'Equipment | Smart Lab';
  }, []);

  // Sync search input if URL changes directly
  useEffect(() => {
    setSearchInput(searchFromUrl);
  }, [searchFromUrl]);

  // Debounce search input to URL query params
  useEffect(() => {
    const handler = setTimeout(() => {
      const currentParam = searchParams.get('search') || '';
      if (searchInput !== currentParam) {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          if (searchInput.trim()) {
            next.set('search', searchInput.trim());
          } else {
            next.delete('search');
          }
          next.set('page', '1');
          return next;
        });
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [searchInput, searchParams, setSearchParams]);

  // Load distinct categories on mount
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await getCategories();
        if (res && res.success && Array.isArray(res.data)) {
          setCategories(res.data);
        }
      } catch {
        // Silently handle error
      }
    };
    fetchCats();
  }, []);

  // Fetch equipment matching URL query params
  const fetchEquipmentList = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        page: pageFromUrl,
        limit: 12,
      };
      if (searchFromUrl.trim()) params.search = searchFromUrl.trim();
      if (categoryFromUrl) params.category = categoryFromUrl;
      if (availabilityFromUrl) params.availability = availabilityFromUrl;
      if (conditionFromUrl) params.condition = conditionFromUrl;

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
  }, [pageFromUrl, searchFromUrl, categoryFromUrl, availabilityFromUrl, conditionFromUrl]);

  useEffect(() => {
    fetchEquipmentList();
  }, [fetchEquipmentList]);

  const handleFilterChange = (key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      next.set('page', '1');
      return next;
    });
  };

  const handlePageChange = (newPage) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(newPage));
      return next;
    });
  };

  return (
    <div className="container">
      <PageHeader
        title="Equipment"
        description="Browse available laboratory equipment"
      >
        <Link to="/student/scan">
          <button type="button" className="btn btn-primary">Scan QR</button>
        </Link>
      </PageHeader>

      <ErrorState message={error} />

      {/* Single Card: Filters row on top, 1px divider, Table, Pagination */}
      <div className="card">
        <div className="filters">
          <div className="filter-item filter-search">
            <label htmlFor="student-eq-search">Search</label>
            <input
              id="student-eq-search"
              type="text"
              placeholder="Search by name or ID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="filter-item">
            <label htmlFor="student-eq-cat">Category</label>
            <select
              id="student-eq-cat"
              value={categoryFromUrl}
              onChange={(e) => handleFilterChange('category', e.target.value)}
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
            <label htmlFor="student-eq-avail">Availability</label>
            <select
              id="student-eq-avail"
              value={availabilityFromUrl}
              onChange={(e) => handleFilterChange('availability', e.target.value)}
            >
              <option value="">All Availability</option>
              <option value="available">Available</option>
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="student-eq-cond">Condition</label>
            <select
              id="student-eq-cond"
              value={conditionFromUrl}
              onChange={(e) => handleFilterChange('condition', e.target.value)}
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
          <EmptyState inCard={false} message="No equipment found." />
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
                          <Link
                            to={`/equipment/${item.equipmentId}`}
                            className="btn btn-secondary btn-sm"
                          >
                            View
                          </Link>
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
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  );
}
