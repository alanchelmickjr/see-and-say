import { supabase } from '../../lib/supabaseClient';

const VALID_STATUSES = ["new", "inventory", "listed_on_ebay", "sold", "kept", "archived"];

/**
 * @swagger
 * /api/items:
 *   post:
 *     summary: Create a new item
 *     description: Creates a new item for the authenticated user.
 *     tags: [Items]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemName
 *             properties:
 *               itemName:
 *                 type: string
 *                 description: Name of the item.
 *               description:
 *                 type: string
 *                 description: Description of the item.
 *               status:
 *                 type: string
 *                 enum: ["new", "inventory", "listed_on_ebay", "sold", "kept", "archived"]
 *                 description: Initial status of the item (defaults to "new").
 *     responses:
 *       201:
 *         description: Item created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       400:
 *         description: Bad request (e.g., missing itemName, invalid status).
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Internal server error.
 *   get:
 *     summary: Get user's inventory items
 *     description: Retrieves a paginated list of items belonging to the authenticated user, with optional filtering.
 *     tags: [Items]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: ["new", "inventory", "listed_on_ebay", "sold", "kept", "archived"]
 *         description: Filter items by status.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page (max 100).
 *     responses:
 *       200:
 *         description: A list of items with pagination info.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Item'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     itemsPerPage:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Internal server error.
 */
export default async function handler(req, res) {
  const { user } = await supabase.auth.api.getUserByCookie(req);

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    // Create a new item
    const { itemName, description, status } = req.body;

    if (!itemName) {
      return res.status(400).json({ error: 'itemName is required' });
    }

    const itemStatus = status || 'new';
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status value. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    try {
      const { data, error } = await supabase
        .from('items')
        .insert([{
          user_id: user.id,
          item_name: itemName,
          description: description || null,
          status: itemStatus,
          // ai_recognized_item, suggested_price_range_min, suggested_price_range_max will be null/default
        }])
        .select()
        .single(); // Expecting a single record back after insert

      if (error) {
        console.error('Supabase error creating item:', error);
        return res.status(500).json({ error: 'Failed to create item', details: error.message });
      }

      return res.status(201).json(data);
    } catch (error) {
      console.error('Error creating item:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }

  } else if (req.method === 'GET') {
    // Get user's inventory items
    const page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 20;
    if (limit > 100) limit = 100; // Max limit
    const offset = (page - 1) * limit;
    const statusFilter = req.query.status;

    if (statusFilter && !VALID_STATUSES.includes(statusFilter)) {
      return res.status(400).json({ error: `Invalid status filter value. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    try {
      let query = supabase
        .from('items')
        .select('*', { count: 'exact' }) // Request count for pagination
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data: items, error, count } = await query;

      if (error) {
        console.error('Supabase error fetching items:', error);
        return res.status(500).json({ error: 'Failed to fetch items', details: error.message });
      }

      const totalPages = Math.ceil(count / limit);

      return res.status(200).json({
        items,
        pagination: {
          currentPage: page,
          itemsPerPage: limit,
          totalItems: count,
          totalPages,
        },
      });
    } catch (error) {
      console.error('Error fetching items:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }

  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Item:
 *       type: object
 *       properties:
 *         item_id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the item.
 *         user_id:
 *           type: string
 *           format: uuid
 *           description: Identifier of the user who owns the item.
 *         item_name:
 *           type: string
 *           description: Name of the item.
 *         description:
 *           type: string
 *           nullable: true
 *           description: Description of the item.
 *         ai_recognized_item:
 *           type: object
 *           nullable: true
 *           description: Raw AI recognition data.
 *         suggested_price_range_min:
 *           type: number
 *           format: decimal
 *           nullable: true
 *           description: Minimum suggested price.
 *         suggested_price_range_max:
 *           type: number
 *           format: decimal
 *           nullable: true
 *           description: Maximum suggested price.
 *         status:
 *           type: string
 *           enum: ["new", "inventory", "listed_on_ebay", "sold", "kept", "archived"]
 *           description: Current status of the item.
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Timestamp of when the item was created.
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Timestamp of when the item was last updated.
 *   securitySchemes:
 *     cookieAuth:
 *       type: apiKey
 *       in: cookie
 *       name: sb-access-token # Adjust if your Supabase token cookie name is different
 */