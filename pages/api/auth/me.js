import Gun from 'gun';
import 'gun/sea';

// Initialize Gun.js with SEA for authentication
const gun = Gun(['http://localhost:8765']);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     description: Retrieves the details of the currently authenticated user from Gun.js P2P session.
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
    // Create user reference in Gun.js
    const user = gun.user();
    
    // Check if user is authenticated
    if (user.is) {
      // User is authenticated, return user info
      const userInfo = {
        id: user.is.pub,
        email: user.is.alias || 'unknown',
        authenticated: true,
        provider: 'gun-p2p',
        session_created: new Date().toISOString(),
        pub_key: user.is.pub
      };

      return res.status(200).json({ user: userInfo });
    } else {
      // No active session
      return res.status(401).json({ error: 'Unauthorized: No active session found' });
    }

  } catch (err) {
    console.error('Gun.js get user error:', err);
    return res.status(500).json({ error: 'Authentication service unavailable' });
  }
}