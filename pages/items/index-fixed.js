import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { withAuthGuard } from '../../components/auth/AuthGuard';
import { useAuth } from '../../context/AuthContext';

function UserItemsPage() {
  const { user } = useAuth();
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
          limit: 10,
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

    fetchItems();
  }, [queryPage, queryStatus]);

  const handlePageChange = (newPage) => {
    router.push({
      pathname: '/items',
      query: { ...router.query, page: newPage },
    });
  };

  const handleStatusFilterChange = (e) => {
    const newStatus = e.target.value;
    router.push({
      pathname: '/items',
      query: { ...router.query, status: newStatus, page: 1 },
    });
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const res = await fetch(`/api/items/${itemId}`, { method: 'DELETE' });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete item');
      }
      setItems(items.filter(item => item.item_id !== itemId));
    } catch (err) {
      alert(`Error deleting item: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>My Inventory</h1>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/items/scan" style={{
              padding: '10px 15px',
              backgroundColor: '#ff6b35',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '5px',
              fontWeight: 'bold'
            }}>
              📷 Scan Items
          </Link>
          <Link href="/items/new" style={{
              padding: '10px 15px',
              backgroundColor: '#0070f3',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '5px',
              fontWeight: 'bold'
            }}>
              Add New Item
          </Link>
        </div>

        <div>
          <label htmlFor="statusFilter">Filter by status: </label>
          <select id="statusFilter" value={queryStatus} onChange={handleStatusFilterChange} style={{padding: '8px'}}>
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="sold">Sold</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {error ? (
        <p style={{ color: 'red', textAlign: 'center' }}>Error: {error}</p>
      ) : isLoading ? (
        <p style={{ textAlign: 'center' }}>Loading items...</p>
      ) : (
        <div>
          {items.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666' }}>No items found.</p>
          ) : (
            items.map((item) => (
              <div key={item.item_id} style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '15px',
                backgroundColor: '#f9f9f9'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <Link href={`/items/${item.item_id}`} style={{
                      textDecoration: 'none',
                      color: '#0070f3',
                      fontSize: '18px',
                      fontWeight: 'bold'
                    }}>
                      {item.name || 'Untitled Item'}
                    </Link>
                    <p style={{ margin: '5px 0', color: '#666' }}>
                      Category: {item.category || 'Uncategorized'}
                    </p>
                    <p style={{ margin: '5px 0', color: '#666' }}>
                      Condition: {item.condition || 'Unknown'}
                    </p>
                    <p style={{ margin: '5px 0', color: '#666' }}>
                      Status: {item.status || 'draft'}
                    </p>
                    {item.suggested_price && (
                      <p style={{ margin: '5px 0', fontWeight: 'bold' }}>
                        Suggested Price: ${item.suggested_price}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Link href={`/items/${item.item_id}`} style={{
                      padding: '8px 12px',
                      backgroundColor: '#0070f3',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}>
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteItem(item.item_id)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#ff4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {pagination.totalPages > 1 && (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1}
                style={{
                  padding: '8px 16px',
                  margin: '0 5px',
                  backgroundColor: pagination.currentPage <= 1 ? '#ccc' : '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: pagination.currentPage <= 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Previous
              </button>
              <span style={{ margin: '0 10px' }}>
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.totalPages}
                style={{
                  padding: '8px 16px',
                  margin: '0 5px',
                  backgroundColor: pagination.currentPage >= pagination.totalPages ? '#ccc' : '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: pagination.currentPage >= pagination.totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default withAuthGuard(UserItemsPage);
