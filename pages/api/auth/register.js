import { supabase } from '../../../lib/supabaseClient';

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account using email and password.
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
 *               - confirmPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address.
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's chosen password (min 6 characters).
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 description: Confirmation of the chosen password.
 *     responses:
 *       201:
 *         description: User registered successfully. Returns session and user info.
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
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                 session:
 *                   type: object
 *                   # Supabase session object structure
 *       400:
 *         description: Bad request (e.g., missing fields, passwords don't match, invalid email, weak password).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       409:
 *         description: Conflict (e.g., user with this email already exists).
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

  const { email, password, confirmPassword } = req.body;

  // TEST: Request body must contain email, password, confirmPassword
  if (!email || !password || !confirmPassword) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // TEST: Email must be a valid format (basic check, Supabase handles more robustly)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // TEST: Password and confirmPassword must match
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  // TEST: Password must meet complexity requirements (Supabase default is min 6 characters)
  // Supabase handles password complexity rules on its end.
  // We could add more client-side or API-side checks if custom rules are stricter than Supabase's.
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    // TEST: User with this email should not already exist (Supabase handles this)
    // TEST: Password hashing must be secure (Supabase handles this)
    // TEST: New user record should be created successfully
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      // Check for specific Supabase errors
      if (error.message.includes('User already registered')) {
        return res.status(409).json({ error: 'User with this email already exists' });
      }
      // Log the detailed error for server-side inspection
      console.error('Supabase signUp error:', error);
      return res.status(error.status || 500).json({ error: error.message || 'Failed to create user' });
    }

    // TEST: Session should be created for the new user (Supabase handles this)
    // TEST: Successful registration returns a session token and user info
    if (data.user && data.session) {
      // Supabase might require email confirmation depending on project settings.
      // If email confirmation is enabled, data.user will exist but data.session might be null
      // until the email is confirmed. The response should reflect this.
      if (data.session) {
         return res.status(201).json({ user: data.user, session: data.session });
      } else if (data.user && !data.session) {
        // Email confirmation pending
        return res.status(201).json({ 
            message: 'Registration successful. Please check your email to confirm your account.',
            user: { id: data.user.id, email: data.user.email } 
        });
      }
    }
    
    // Fallback for unexpected scenarios, though Supabase usually provides clear data/error
    console.error('Supabase signUp response missing user or session:', data);
    return res.status(500).json({ error: 'User registration completed but session data is unavailable. Please try logging in.' });

  } catch (err) {
    console.error('Registration handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}