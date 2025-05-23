import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { withAuthGuard } from '../../components/auth/AuthGuard';
import { useAuth } from '../../context/AuthContext';
// It's good practice to have a central place for API calls or use a library like SWR/React Query
// For simplicity, we'll use fetch directly here.


function UserItemsPage() {
  const { user } = useAuth(); // Get user from context
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  const { page: queryPage = 1, status: queryStatus = '' } = router.query;

  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: queryPage,
          limit: 10, // Or make this configurable
        });
        if (queryStatus) {
          params.append('status', queryStatus);
        }

        const res = await fetch(`/api/items?${params.toString()}`);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to fetch items');
        }
        const data = await res.json();
        setItems(data.items);
        setPagination(data.pagination);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) { // Only fetch if user is confirmed
      fetchItems();
    }
  }, [user, queryPage, queryStatus]);

  const handlePageChange = (newPage) => {
    router.push(`/items?page=${newPage}${queryStatus ? `&status=${queryStatus}` : ''}`);
  };

  const handleStatusFilterChange = (event) => {
    const newStatus = event.target.value;
    router.push(`/items?page=1${newStatus ? `&status=${newStatus}` : ''}`);
  };

  if (isLoading) return <div>Loading your items...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>My Inventory</h1>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Link href="/items/new" legacyBehavior>
          <a style={{
            padding: '10px 15px',
            backgroundColor: '#0070f3',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '5px'
          }}>
            + Add New Item
          </a>
        </Link>
        <div>
          <label htmlFor="statusFilter">Filter by status: </label>
          <select id="statusFilter" value={queryStatus} onChange={handleStatusFilterChange} style={{padding: '8px'}}>
            <option value="">All</option>
            <option value="new">New</option>
            <option value="inventory">Inventory</option>
            <option value="listed_on_ebay">Listed on eBay</option>
            <option value="sold">Sold</option>
            <option value="kept">Kept</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {items.length === 0 ? (
        <p>You haven't added any items yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {items.map((item) => (
            <li key={item.item_id} style={{
              border: '1px solid #ddd',
              padding: '15px',
              marginBottom: '10px',
              borderRadius: '5px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{ margin: '0 0 5px 0' }}>
                  <Link href={`/items/${item.item_id}`} legacyBehavior>
                    <a>{item.item_name}</a>
                  </Link>
                </h2>
                <p style={{ margin: 0, color: '#555' }}>Status: {item.status}</p>
                {/* Placeholder for primary image */}
              </div>
              {/* Add edit/delete buttons later */}
            </li>
          ))}
        </ul>
      )}

      {pagination.totalPages > 1 && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            style={{marginRight: '10px', padding: '8px 12px'}}
          >
            Previous
          </button>
          <span>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            style={{marginLeft: '10px', padding: '8px 12px'}}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default withAuthGuard(UserItemsPage);