# Phase 3: Pseudocode for User Authentication

This document outlines the pseudocode for the User Authentication feature in ebay-helper.

## 1. User Registration (Email/Password)

**Endpoint:** `POST /api/auth/register`

**Inputs:** `email`, `password`, `confirmPassword`

**Outputs:** `sessionToken` or `error`

```pseudocode
FUNCTION handle_registration(request):
  // TEST: Request body must contain email, password, confirmPassword
  VALIDATE request.body for required fields (email, password, confirmPassword)
  IF validation_fails:
    RETURN error_response("Missing required fields", 400)

  email = request.body.email
  password = request.body.password
  confirmPassword = request.body.confirmPassword

  // TEST: Email must be a valid format
  VALIDATE email_format(email)
  IF invalid_email_format:
    RETURN error_response("Invalid email format", 400)

  // TEST: Password and confirmPassword must match
  IF password != confirmPassword:
    RETURN error_response("Passwords do not match", 400)

  // TEST: Password must meet complexity requirements (e.g., length, characters)
  VALIDATE password_complexity(password)
  IF password_too_weak:
    RETURN error_response("Password does not meet complexity requirements", 400)

  // TEST: User with this email should not already exist
  existingUser = find_user_by_email(email)
  IF existingUser:
    RETURN error_response("User with this email already exists", 409) // 409 Conflict

  // TEST: Password hashing must be secure (e.g., bcrypt, Argon2)
  passwordHash = hash_password(password)

  // TEST: New user record should be created successfully
  newUser = create_user_record(email, passwordHash, "email")
  IF creation_fails:
    RETURN error_response("Failed to create user", 500)

  // TEST: Session should be created for the new user
  session = create_session_for_user(newUser.userId)
  IF session_creation_fails:
    RETURN error_response("Failed to create session", 500)

  // TEST: Successful registration returns a session token and user info (excluding sensitive data)
  RETURN success_response({ sessionToken: session.token, user: { userId: newUser.userId, email: newUser.email } }, 201)

```

## 2. User Login (Email/Password)

**Endpoint:** `POST /api/auth/login`

**Inputs:** `email`, `password`

**Outputs:** `sessionToken` or `error`

```pseudocode
FUNCTION handle_login(request):
  // TEST: Request body must contain email and password
  VALIDATE request.body for required fields (email, password)
  IF validation_fails:
    RETURN error_response("Missing required fields", 400)

  email = request.body.email
  password = request.body.password

  // TEST: User with the provided email must exist
  user = find_user_by_email(email)
  IF NOT user:
    RETURN error_response("Invalid email or password", 401) // Unauthorized

  // TEST: Provided password must match the stored hash
  IF NOT verify_password(password, user.passwordHash):
    RETURN error_response("Invalid email or password", 401)

  // TEST: Session should be created or updated for the user
  session = create_session_for_user(user.userId)
  IF session_creation_fails:
    RETURN error_response("Failed to create session", 500)

  // TEST: Successful login returns a session token and user info
  RETURN success_response({ sessionToken: session.token, user: { userId: user.userId, email: user.email } }, 200)
```

## 3. User Logout

**Endpoint:** `POST /api/auth/logout`

**Inputs:** `sessionToken` (usually via Authorization header or cookie)

**Outputs:** `success_message` or `error`

```pseudocode
FUNCTION handle_logout(request):
  // TEST: Request must contain a valid session token
  sessionToken = get_session_token_from_request(request)
  IF NOT sessionToken:
    RETURN error_response("No session token provided", 401)

  // TEST: Session token must correspond to an active session
  session = find_session_by_token(sessionToken)
  IF NOT session OR session_is_expired(session):
    RETURN error_response("Invalid or expired session", 401)

  // TEST: Session should be successfully invalidated/deleted
  delete_session(sessionToken)
  IF deletion_fails:
    RETURN error_response("Failed to logout", 500)

  // TEST: Successful logout returns a confirmation message
  RETURN success_response({ message: "Logged out successfully" }, 200)
```

## 4. Get Current User (Session Check)

**Endpoint:** `GET /api/auth/me`

**Inputs:** `sessionToken` (usually via Authorization header or cookie)

**Outputs:** `user_info` or `error`

```pseudocode
FUNCTION get_current_user(request):
  // TEST: Request must contain a valid session token
  sessionToken = get_session_token_from_request(request)
  IF NOT sessionToken:
    RETURN error_response("No session token provided", 401)

  // TEST: Session token must correspond to an active, non-expired session
  session = find_session_by_token(sessionToken)
  IF NOT session OR session_is_expired(session):
    RETURN error_response("Invalid or expired session", 401)

  // TEST: User associated with the session must exist
  user = find_user_by_id(session.userId)
  IF NOT user:
    RETURN error_response("User not found for session", 404) // Or 500 if this indicates data inconsistency

  // TEST: Current user info (excluding sensitive data) is returned
  RETURN success_response({ user: { userId: user.userId, email: user.email } }, 200)
```

## Helper Functions (Conceptual)

```pseudocode
FUNCTION find_user_by_email(email):
  // Database lookup for user by email
  // TEST: Returns user object or null

FUNCTION find_user_by_id(userId):
  // Database lookup for user by ID
  // TEST: Returns user object or null

FUNCTION hash_password(password):
  // Uses a strong hashing algorithm (e.g., bcrypt, Argon2)
  // TEST: Returns a secure hash

FUNCTION verify_password(password, hash):
  // Compares password with stored hash
  // TEST: Returns true if match, false otherwise

FUNCTION create_user_record(email, passwordHash, provider):
  // Inserts new user into database
  // TEST: Returns new user object or error

FUNCTION create_session_for_user(userId):
  // Generates a secure session token, stores it with expiry
  // TEST: Returns session object (token, userId, expiresAt)

FUNCTION get_session_token_from_request(request):
  // Extracts token from Authorization header or cookie
  // TEST: Returns token string or null

FUNCTION find_session_by_token(sessionToken):
  // Retrieves session from database/cache by token
  // TEST: Returns session object or null

FUNCTION session_is_expired(session):
  // Checks if session.expiresAt is in the past
  // TEST: Returns true if expired, false otherwise

FUNCTION delete_session(sessionToken):
  // Removes session from database/cache
  // TEST: Returns success or error
```

## OAuth Integration (Conceptual - High Level)

- **Flow:**
  1. Client initiates OAuth with provider (e.g., Google).
  2. Provider redirects to app with authorization code.
  3. App exchanges code for access token and user profile from provider.
  4. App checks if user with `provider_email` or `provider_user_id` exists.
     - IF exists: Log them in (create session).
     - IF NOT exists: Create new user record with provider details, then log them in.
  // TEST: OAuth login creates new user if not exists.
  // TEST: OAuth login links to existing user if email matches.
  // TEST: OAuth login handles provider errors gracefully.