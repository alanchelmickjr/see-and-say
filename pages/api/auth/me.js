import { supabase } from '../../../lib/supabaseClient';

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     description: Retrieves the details of the currently authenticated user based on their session token.
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: [] # Indicates that this endpoint requires a Bearer token
 *     responses:
 *       200:
 *         description: Successfully retrieved user information.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     email:
 *                       type: string
 *                       format: email
 *                     # other user properties from Supabase, excluding sensitive ones
 *                     app_metadata:
 *                       type: object
 *                     user_metadata:
 *                       type: object
 *                     aud:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized (e.g., no session token, invalid token, or session expired).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // Supabase client library handles token from cookies or Authorization header automatically.
  // The supabase.auth.getUser() method will attempt to retrieve the user based on
  // the JWT found in the Authorization header (if provided) or in a cookie.

  try {
    // TEST: Request must contain a valid session token (Supabase client handles extraction)
    // TEST: Session token must correspond to an active, non-expired session (Supabase handles this)
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      // Log the detailed error for server-side inspection
      console.error('Supabase getUser error:', error);
      // This error typically means the token is invalid, expired, or not present.
      return res.status(401).json({ error: error.message || 'Unauthorized: Invalid or missing token' });
    }

    // TEST: User associated with the session must exist
    if (!user) {
      // This case should ideally be caught by the error above,
      // but as a safeguard:
      return res.status(401).json({ error: 'Unauthorized: No active session found' });
    }

    // TEST: Current user info (excluding sensitive data) is returned
    // Supabase's user object by default doesn't include overly sensitive data like password hashes.
    // We can further sanitize if needed, but for now, the default user object is fine.
    return res.status(200).json({ user });

  } catch (err) {
    console.error('Get current user handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}