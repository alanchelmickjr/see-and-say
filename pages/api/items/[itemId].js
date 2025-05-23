import { supabase } from '../../lib/supabaseClient';

/**
 * @swagger
 * /api/items/{itemId}:
 *   get:
 *     summary: Get a single item's details
 *     description: Retrieves details for a specific item, ensuring it belongs to the authenticated user.
 *     tags: [Items]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the item to retrieve.
 *     responses:
 *       200:
 *         description: Detailed information about the item.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       400:
 *         description: Bad request (e.g., missing itemId).
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Item not found or access denied.
 *       500:
 *         description: Internal server error.
 */
export default async function handler(req, res) {
  const { user } = await supabase.auth.api.getUserByCookie(req);

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { itemId } = req.query;

  if (!itemId) {
    return res.status(400).json({ error: 'itemId is required' });
  }

  const VALID_ITEM_STATUSES = ["new", "inventory", "listed_on_ebay", "sold", "kept", "archived"];

  if (req.method === 'GET') {
    try {
      const { data: item, error } = await supabase
        .from('items')
        .select('*')
        .eq('item_id', itemId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Item not found or access denied' });
        }
        console.error('Supabase error fetching item:', error);
        return res.status(500).json({ error: 'Failed to fetch item', details: error.message });
      }

      if (!item) {
        return res.status(404).json({ error: 'Item not found or access denied' });
      }

      return res.status(200).json(item);
    } catch (error) {
      console.error('Error fetching item:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'PUT') {
    // Update Item Logic
    try {
      const { data: existingItem, error: fetchError } = await supabase
        .from('items')
        .select('item_id')
        .eq('item_id', itemId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !existingItem) {
        return res.status(404).json({ error: 'Item not found or access denied for update' });
      }

      const { itemName, description, status, suggestedPriceRangeMin, suggestedPriceRangeMax } = req.body;
      const updateData = {};

      if (itemName !== undefined) updateData.item_name = itemName;
      if (description !== undefined) updateData.description = description;
      if (status !== undefined) {
        if (!VALID_ITEM_STATUSES.includes(status)) {
          return res.status(400).json({ error: `Invalid status value. Must be one of: ${VALID_ITEM_STATUSES.join(', ')}` });
        }
        updateData.status = status;
      }
      if (suggestedPriceRangeMin !== undefined) updateData.suggested_price_range_min = suggestedPriceRangeMin;
      if (suggestedPriceRangeMax !== undefined) updateData.suggested_price_range_max = suggestedPriceRangeMax;
      
      if (updateData.suggested_price_range_min !== undefined && updateData.suggested_price_range_max !== undefined) {
        if (parseFloat(updateData.suggested_price_range_min) > parseFloat(updateData.suggested_price_range_max)) {
          return res.status(400).json({ error: 'suggestedPriceRangeMin cannot be greater than suggestedPriceRangeMax' });
        }
      } else if (updateData.suggested_price_range_min !== undefined) {
        const currentMax = existingItem.suggested_price_range_max || req.body.suggestedPriceRangeMax; // Check body if max is also being updated
        if (currentMax !== undefined && parseFloat(updateData.suggested_price_range_min) > parseFloat(currentMax)) {
           return res.status(400).json({ error: 'suggestedPriceRangeMin cannot be greater than existing/provided suggestedPriceRangeMax' });
        }
      } else if (updateData.suggested_price_range_max !== undefined) {
        const currentMin = existingItem.suggested_price_range_min || req.body.suggestedPriceRangeMin; // Check body if min is also being updated
         if (currentMin !== undefined && parseFloat(currentMin) > parseFloat(updateData.suggested_price_range_max)) {
           return res.status(400).json({ error: 'existing/provided suggestedPriceRangeMin cannot be greater than suggestedPriceRangeMax' });
        }
      }


      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No valid fields provided for update' });
      }

      updateData.updated_at = new Date().toISOString();

      const { data: updatedItem, error: updateError } = await supabase
        .from('items')
        .update(updateData)
        .eq('item_id', itemId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Supabase error updating item:', updateError);
        return res.status(500).json({ error: 'Failed to update item', details: updateError.message });
      }

      return res.status(200).json(updatedItem);

    } catch (error) {
      console.error('Error updating item:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'DELETE') {
    // Delete Item Logic
    try {
      // 1. Verify item ownership
      const { data: itemToDelete, error: fetchError } = await supabase
        .from('items')
        .select('item_id')
        .eq('item_id', itemId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !itemToDelete) {
        return res.status(404).json({ error: 'Item not found or access denied for deletion' });
      }

      // 2. Delete associated images from storage and DB
      const { data: images, error: imageFetchError } = await supabase
        .from('images')
        .select('storage_url') // In Supabase, this is usually the path within the bucket
        .eq('item_id', itemId);

      if (imageFetchError) {
        console.error('Error fetching images for deletion:', imageFetchError);
        // Non-fatal, proceed with other deletions
      }

      if (images && images.length > 0) {
        const imagePaths = images.map(img => {
          // Assuming storage_url is the path like 'user_id/item_id/filename.jpg'
          // Or if it's a full URL, parse it. For now, let's assume it's the path.
          // Example: "public/user-uuid/item-uuid/image.png"
          // The actual path for `remove` would be "user-uuid/item-uuid/image.png" if bucket is 'item-images'
          // and storage_url stores 'public/user-uuid/item-uuid/image.png'
          // If storage_url is `https://<ref>.supabase.co/storage/v1/object/public/item-images/path/to/image.png`
          // then the path is `path/to/image.png`
          try {
            const url = new URL(img.storage_url);
            // Path is everything after /item-images/ (or the bucket name)
            const pathParts = url.pathname.split('/');
            const bucketNameIndex = pathParts.indexOf('item-images'); // Assuming 'item-images' is the bucket
            if (bucketNameIndex !== -1 && bucketNameIndex < pathParts.length -1) {
                return pathParts.slice(bucketNameIndex + 1).join('/');
            }
            // Fallback if parsing is tricky or URL structure is different
            // This part needs to be robust based on how storage_url is actually stored.
            // For now, a simple split if it's just the path after bucket.
            // If storage_url is just 'userId/itemId/filename.ext'
            return img.storage_url;
          } catch (e) {
             // If storage_url is not a full URL but a path like 'user_id/item_id/filename.jpg'
            return img.storage_url;
          }
        }).filter(Boolean);


        if (imagePaths.length > 0) {
          const { error: storageError } = await supabase.storage
            .from('item-images') // Ensure this is your bucket name
            .remove(imagePaths);
          if (storageError) {
            console.error('Error deleting images from storage:', storageError);
            // Non-fatal
          }
        }

        const { error: dbImageDeleteError } = await supabase
          .from('images')
          .delete()
          .eq('item_id', itemId);
        if (dbImageDeleteError) {
          console.error('Error deleting image records from DB:', dbImageDeleteError);
          // Non-fatal
        }
      }

      // 3. Delete associated PriceData
      const { error: priceDataDeleteError } = await supabase
        .from('price_data')
        .delete()
        .eq('item_id', itemId);
      if (priceDataDeleteError) {
        console.error('Error deleting price_data records:', priceDataDeleteError);
        // Non-fatal
      }

      // 4. Delete associated Listings
      const { error: listingDeleteError } = await supabase
        .from('listings')
        .delete()
        .eq('item_id', itemId);
      if (listingDeleteError) {
        console.error('Error deleting listing records:', listingDeleteError);
        // Non-fatal
      }

      // 5. Delete the Item itself
      const { error: itemDeleteError } = await supabase
        .from('items')
        .delete()
        .eq('item_id', itemId)
        .eq('user_id', user.id);

      if (itemDeleteError) {
        console.error('Supabase error deleting item:', itemDeleteError);
        return res.status(500).json({ error: 'Failed to delete item', details: itemDeleteError.message });
      }

      return res.status(200).json({ message: 'Item deleted successfully' });

    } catch (error) {
      console.error('Error deleting item:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}