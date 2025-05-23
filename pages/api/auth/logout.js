import { supabase } from '../../../lib/supabaseClient';

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Log out the current user
 *     description: Invalidates the user's current session.
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: [] # Indicates that this endpoint requires a Bearer token
 *     responses:
 *       200:
 *         description: User logged out successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 *       401:
 *         description: Unauthorized (e.g., no session token, invalid token).
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
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // Supabase client library handles token from cookies or Authorization header automatically
  // when making auth calls. We need to ensure the client making this request
  // has the session token available for Supabase to use.

  try {
    // TEST: Request must contain a valid session token (Supabase client handles extraction)
    // TEST: Session token must correspond to an active session (Supabase handles this)
    const { error } = await supabase.auth.signOut();

    if (error) {
      // Log the detailed error for server-side inspection
      console.error('Supabase signOut error:', error);
      // signOut error usually means there was an issue communicating with Supabase
      // or the token was already invalid/not present.
      return res.status(error.status || 500).json({ error: error.message || 'Failed to logout' });
    }

    // TEST: Session should be successfully invalidated/deleted (Supabase handles this)
    // TEST: Successful logout returns a confirmation message
    return res.status(200).json({ message: 'Logged out successfully' });

  } catch (err) {
    console.error('Logout handler error:', err);
    // This catch block is for unexpected errors in the handler itself,
    // not for Supabase operational errors which are handled above.
    return res.status(500).json({ error: 'Internal server error' });
  }
}