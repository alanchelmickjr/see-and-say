import Gun from 'gun';
import 'gun/sea';

// Initialize Gun.js with SEA for authentication
const gun = Gun(['http://localhost:8765']);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Log out the current user
 *     description: Invalidates the user's current Gun.js P2P session.
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

  try {
    // Create user reference in Gun.js
    const user = gun.user();
    
    // Gun.js logout - simply leave the current session
    user.leave();

    return res.status(200).json({ 
      message: 'Logged out successfully',
      provider: 'gun-p2p',
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Gun.js logout error:', err);
    return res.status(500).json({ error: 'Logout service unavailable' });
  }
}