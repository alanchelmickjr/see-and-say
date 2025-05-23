import { supabase } from '../../../lib/supabaseClient';

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in an existing user
 *     description: Authenticates a user with their email and password.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address.
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password.
 *     responses:
 *       200:
 *         description: User logged in successfully. Returns session and user info.
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
 *                     # other user properties from Supabase
 *                 session:
 *                   type: object
 *                   # Supabase session object structure
 *       400:
 *         description: Bad request (e.g., missing fields).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       401:
 *         description: Unauthorized (e.g., invalid email or password).
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

  const { email, password } = req.body;

  // TEST: Request body must contain email and password
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // TEST: User with the provided email must exist (Supabase handles this)
    // TEST: Provided password must match the stored hash (Supabase handles this)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Log the detailed error for server-side inspection
      console.error('Supabase signInWithPassword error:', error);
      // Supabase typically returns a 400 for "Invalid login credentials"
      // but we'll map it to 401 for semantic correctness in our API.
      if (error.message === 'Invalid login credentials') {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      return res.status(error.status || 500).json({ error: error.message || 'Failed to login' });
    }

    // TEST: Session should be created or updated for the user (Supabase handles this)
    // TEST: Successful login returns a session token and user info
    if (data.user && data.session) {
      return res.status(200).json({ user: data.user, session: data.session });
    }

    // Fallback for unexpected scenarios
    console.error('Supabase signInWithPassword response missing user or session:', data);
    return res.status(500).json({ error: 'Login completed but session data is unavailable.' });

  } catch (err) {
    console.error('Login handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}