import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { withAuthGuard } from '../../components/auth/AuthGuard';
import { useAuth } from '../../context/AuthContext';

function NewItemPage() {
  const { user } = useAuth(); // Get user from context
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('new'); // Default status
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!itemName.trim()) {
      setError('Item name is required.');
      return;
    }
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemName, description, status }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create item');
      }

      const newItem = await res.json();
      // Redirect to the new item's detail page or the list page
      router.push(`/items/${newItem.item_id}`); 
      // Or router.push('/items');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
      <Link href="/items" legacyBehavior>
        <a style={{ display: 'inline-block', marginBottom: '20px' }}>&larr; Back to Inventory</a>
      </Link>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Add New Item</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="itemName" style={{ display: 'block', marginBottom: '5px' }}>Item Name:</label>
          <input
            type="text"
            id="itemName"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="description" style={{ display: 'block', marginBottom: '5px' }}>Description (Optional):</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="4"
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="status" style={{ display: 'block', marginBottom: '5px' }}>Status:</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ width: '100%', padding: '10px' }}
          >
            <option value="new">New</option>
            <option value="inventory">Inventory</option>
            {/* Other statuses can be added if they make sense at creation time */}
            {/* <option value="listed_on_ebay">Listed on eBay</option> */}
            {/* <option value="sold">Sold</option> */}
            {/* <option value="kept">Kept</option> */}
            {/* <option value="archived">Archived</option> */}
          </select>
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: isSubmitting ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer'
          }}
        >
          {isSubmitting ? 'Creating Item...' : 'Create Item'}
        </button>
      </form>
    </div>
  );
}

export default withAuthGuard(NewItemPage);