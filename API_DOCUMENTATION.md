# Polling App Backend API Documentation

This document describes the current REST API surface of the backend project based on the existing Express routes, controllers, middleware, and Mongoose models.

> The backend currently exposes authentication and account-management endpoints under the `/api/auth` namespace. No poll or comment CRUD endpoints are implemented yet.

---

## 1. Base URL

- Development base URL: `http://localhost:3000/api`
- Root server URL: `http://localhost:3000`
- All auth endpoints are mounted under `/api/auth`

---

## 2. Authentication Architecture

### Token format

- The API uses a JWT bearer token.
- Token is generated on successful OTP verification, login, and returned in the response body as:
  - `token: "<jwt>"`

### Token lifecycle

- Tokens are signed with `JWT_SECRET` and expire after 7 days.
- Protected routes require:
  - `Authorization: Bearer <JWT>`
- The `protect` middleware reads the token, verifies it, and attaches `req.userId` for downstream controllers.

### Frontend token handling

- Store the returned token in a secure client-side place such as:
  - `localStorage` for quick development,
  - or an httpOnly cookie in production.
- For subsequent protected requests, attach it as:
  - `Authorization: Bearer <token>`

---

## 3. Global Error Handling Format

All error responses follow this shape unless otherwise noted:

```json
{
  "message": "Human-readable error message"
}
```

Some flows return additional fields such as:

```json
{
  "message": "Please verify your email first",
  "needsVerification": true,
  "email": "user@example.com"
}
```

### Common error status codes

- `400` Bad Request: invalid input, invalid OTP, duplicate username/email, weak password
- `401` Unauthorized: missing or invalid JWT
- `403` Forbidden: email not verified yet
- `404` Not Found: user not found or route not found
- `500` Internal Server Error: unexpected server failure

---

## 4. Shared User Object Shape

The API returns a normalized user object in many responses.

```json
{
  "_id": "64a1...",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "username": "janedoe",
  "avatar": "",
  "bio": ""
}
```

### User model fields

- `name` (string, required)
- `username` (string, required, unique)
- `email` (string, required, unique)
- `password` (string, required, min 6 chars)
- `avatar` (string, optional, default `""`)
- `bio` (string, optional, max 160 chars)
- `bookmarks` (array of Poll IDs)
- `following` (array of User IDs)
- `isVerified` (boolean, default `false`)
- `otp` (string, temporary)
- `otpExpiry` (date, temporary)
- timestamps: `createdAt`, `updatedAt`

---

## 5. Endpoints

### 5.1 Root Endpoints

#### GET `/`

- Overview: Basic health/landing endpoint on the server.
- Authentication: Public
- Content-Type: `text/plain`

##### Request Specification

- No headers required
- No body

##### Response Specification

- Success `200`

```text
Welcome to the root route of polling-app-backend!
```

##### Frontend Implementation Notes

- Use this only as a smoke test during development.
- No auth state changes are required.

---

#### GET `/api`

- Overview: Basic API landing endpoint.
- Authentication: Public
- Content-Type: `text/plain`

##### Request Specification

- No headers required
- No body

##### Response Specification

- Success `200`

```text
Hello from the backend API!
```

##### Frontend Implementation Notes

- Use this as a quick connectivity check when bootstrapping the frontend.

---

#### GET `/api/auth`

- Overview: Auth namespace health check.
- Authentication: Public
- Content-Type: `text/plain`

##### Request Specification

- No headers required
- No body

##### Response Specification

- Success `200`

```text
Welcome to api/auth/
```

##### Frontend Implementation Notes

- Useful for verifying the auth route prefix is mounted correctly.

---

### 5.2 Authentication and Account Management

#### POST `/api/auth/register`

- Overview: Create a new user account and send a one-time password (OTP) to the provided email.
- Authentication: Public
- Content-Type: `multipart/form-data` (recommended) or `application/json` if no image is attached

##### Request Specification

###### Headers

- `Content-Type: multipart/form-data` if sending `image`
- `Content-Type: application/json` if sending JSON body

###### Body Fields

| Field      | Type   | Required | Description                                   |
| ---------- | ------ | -------: | --------------------------------------------- |
| `name`     | string |      Yes | Display name                                  |
| `username` | string |      Yes | Unique account username                       |
| `email`    | string |      Yes | Valid email address                           |
| `password` | string |      Yes | Minimum 6 characters                          |
| `image`    | file   |       No | Optional avatar image; uploaded to Cloudinary |

Example form-data payload:

```text
name=Jane Doe
username=janedoe
email=jane@example.com
password=secret123
image=<file>
```

##### Response Specification

- Success `201`

```json
{
  "needsVerification": true,
  "email": "jane@example.com"
}
```

- Error cases
  - `400`: missing fields, duplicate username/email
  - `500`: server failure

```json
{
  "message": "All fields are required"
}
```

```json
{
  "message": "Username or email already exists"
}
```

##### Frontend Implementation Notes

- Use `FormData` whenever an avatar image is included.
- After success, navigate the user to an OTP verification screen and persist the submitted email in local state.
- Do not set authentication state yet because the account is not verified.

---

#### POST `/api/auth/verify-otp`

- Overview: Verify the email OTP and issue a JWT.
- Authentication: Public
- Content-Type: `application/json`

##### Request Specification

###### Headers

- `Content-Type: application/json`

###### Body Fields

| Field   | Type   | Required | Description                    |
| ------- | ------ | -------: | ------------------------------ |
| `email` | string |      Yes | Email used during registration |
| `otp`   | string |      Yes | 6-digit OTP received by email  |

Example body:

```json
{
  "email": "jane@example.com",
  "otp": "123456"
}
```

##### Response Specification

- Success `200`

```json
{
  "token": "<jwt>",
  "user": {
    "_id": "64a1...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "username": "janedoe",
    "avatar": "",
    "bio": ""
  }
}
```

- Error cases
  - `400`: invalid or expired OTP
  - `404`: user not found
  - `500`: server failure

```json
{
  "message": "Invalid or Expired OTP"
}
```

##### Frontend Implementation Notes

- On success, save the returned token and user in auth state.
- Update the global auth store immediately and redirect to the dashboard or home screen.
- If the request fails, keep the user on the verification screen and show the error message.

---

#### POST `/api/auth/resend-otp`

- Overview: Resend the verification OTP to the provided email.
- Authentication: Public
- Content-Type: `application/json`

##### Request Specification

###### Headers

- `Content-Type: application/json`

###### Body Fields

| Field   | Type   | Required | Description                       |
| ------- | ------ | -------: | --------------------------------- |
| `email` | string |      Yes | Email address tied to the account |

Example body:

```json
{
  "email": "jane@example.com"
}
```

##### Response Specification

- Success `200`

```json
{
  "message": "OTP Sent"
}
```

- Error cases
  - `404`: user not found
  - `500`: server failure

```json
{
  "message": "User not found"
}
```

##### Frontend Implementation Notes

- Use this after a user requests a new OTP.
- Disable the resend button temporarily and show a countdown or “sent” state.

---

#### POST `/api/auth/login`

- Overview: Authenticate an existing user and issue a JWT.
- Authentication: Public
- Content-Type: `application/json`

##### Request Specification

###### Headers

- `Content-Type: application/json`

###### Body Fields

| Field      | Type   | Required | Description         |
| ---------- | ------ | -------: | ------------------- |
| `email`    | string |      Yes | Registered email    |
| `password` | string |      Yes | Plain text password |

Example body:

```json
{
  "email": "jane@example.com",
  "password": "secret123"
}
```

##### Response Specification

- Success `200`

```json
{
  "token": "<jwt>",
  "user": {
    "_id": "64a1...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "username": "janedoe",
    "avatar": "",
    "bio": ""
  }
}
```

- Error cases
  - `401`: invalid email/password
  - `403`: account exists but is not verified yet
  - `500`: server failure

```json
{
  "message": "Invalid email or password"
}
```

```json
{
  "message": "Please verify your email first",
  "needsVerification": true,
  "email": "jane@example.com"
}
```

##### Frontend Implementation Notes

- On success, save the token and user to auth state.
- On `403` with `needsVerification`, route the user to the OTP verification flow.
- Invalidate any stale “guest” state and replace it with the authenticated user.

---

#### GET `/api/auth/me`

- Overview: Fetch the authenticated user profile and basic stats.
- Authentication: Protected via Bearer Token
- Content-Type: `application/json`

##### Request Specification

###### Headers

- `Authorization: Bearer <JWT>`

###### Query Parameters

- None

##### Response Specification

- Success `200`

```json
{
  "user": {
    "_id": "64a1...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "username": "janedoe",
    "avatar": "",
    "bio": ""
  },
  "stats": {
    "created": 3,
    "voted": 7,
    "bookmarked": 2
  }
}
```

- Error cases
  - `401`: missing or invalid token
  - `404`: user not found
  - `500`: server failure

```json
{
  "message": "Unauthorized Access, No token found"
}
```

##### Frontend Implementation Notes

- Call this on app startup after login or when restoring a session.
- Use the returned `user` and `stats` to hydrate global auth/profile state.
- If a `401` is returned, clear auth state and redirect to login.

---

#### POST `/api/auth/forgot-password`

- Overview: Send a password-reset OTP to the user email.
- Authentication: Public
- Content-Type: `application/json`

##### Request Specification

###### Headers

- `Content-Type: application/json`

###### Body Fields

| Field   | Type   | Required | Description               |
| ------- | ------ | -------: | ------------------------- |
| `email` | string |      Yes | Email tied to the account |

Example body:

```json
{
  "email": "jane@example.com"
}
```

##### Response Specification

- Success `200`

```json
{
  "message": "OTP sent to your email"
}
```

- Error cases
  - `404`: no account found for the email
  - `500`: server failure

```json
{
  "message": "No User found with this email"
}
```

##### Frontend Implementation Notes

- Use this on the “forgot password” form.
- After success, transition the user to the OTP verification step.

---

#### POST `/api/auth/verify-reset-otp`

- Overview: Verify a password-reset OTP.
- Authentication: Public
- Content-Type: `application/json`

##### Request Specification

###### Headers

- `Content-Type: application/json`

###### Body Fields

| Field   | Type   | Required | Description               |
| ------- | ------ | -------: | ------------------------- |
| `email` | string |      Yes | Email tied to the account |
| `otp`   | string |      Yes | OTP received by email     |

Example body:

```json
{
  "email": "jane@example.com",
  "otp": "123456"
}
```

##### Response Specification

- Success `200`

```json
{
  "ok": true,
  "message": "OTP verified successfully. You can now reset your password."
}
```

- Error cases
  - `400`: invalid or expired OTP
  - `404`: user not found
  - `500`: server failure

```json
{
  "message": "Invalid or expired OTP"
}
```

##### Frontend Implementation Notes

- If the OTP is verified, enable the password reset form.
- Do not issue a JWT here; this step is only a verification checkpoint.

---

#### POST `/api/auth/reset-password`

- Overview: Reset the password using an email and OTP.
- Authentication: Public
- Content-Type: `application/json`

##### Request Specification

###### Headers

- `Content-Type: application/json`

###### Body Fields

| Field      | Type   | Required | Description                         |
| ---------- | ------ | -------: | ----------------------------------- |
| `email`    | string |      Yes | Email tied to the account           |
| `otp`      | string |      Yes | Verified reset OTP                  |
| `password` | string |      Yes | New password (minimum 6 characters) |

Example body:

```json
{
  "email": "jane@example.com",
  "otp": "123456",
  "password": "newSecret123"
}
```

##### Response Specification

- Success `200`

```json
{
  "message": "Password has been reset successfully"
}
```

- Error cases
  - `400`: password too short or invalid OTP
  - `404`: user not found
  - `500`: server failure

```json
{
  "message": "Password must be atleast 6 characters"
}
```

##### Frontend Implementation Notes

- After success, redirect the user to login and clear any stale password-reset form state.

---

#### PATCH `/api/auth/profile`

- Overview: Update the authenticated user’s name, username, bio, and optional avatar.
- Authentication: Protected via Bearer Token
- Content-Type: `multipart/form-data` (recommended) or `application/json` if no image is attached

##### Request Specification

###### Headers

- `Authorization: Bearer <JWT>`
- `Content-Type: multipart/form-data` if sending `image`
- `Content-Type: application/json` if sending JSON

###### Body Fields

| Field      | Type   | Required | Description                     |
| ---------- | ------ | -------: | ------------------------------- |
| `name`     | string |       No | New display name                |
| `username` | string |       No | New unique username             |
| `bio`      | string |       No | Short biography (max 160 chars) |
| `image`    | file   |       No | New avatar image                |

Example form-data payload:

```text
name=Jane Smith
username=janesmith
bio=Product designer and poll enthusiast
image=<file>
```

##### Response Specification

- Success `200`

```json
{
  "user": {
    "_id": "64a1...",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "username": "janesmith",
    "avatar": "https://res.cloudinary.com/...",
    "bio": "Product designer and poll enthusiast"
  }
}
```

- Error cases
  - `400`: username already taken
  - `401`: missing/invalid token
  - `404`: user not found
  - `500`: server failure

```json
{
  "message": "Username already taken"
}
```

##### Frontend Implementation Notes

- Use `FormData` when changing the avatar.
- On success, replace the current user object in local/global state and update any profile-related UI.
- If the avatar upload fails silently on the backend, the response may still return the existing avatar value.

---

#### PATCH `/api/auth/password`

- Overview: Change the authenticated user’s password.
- Authentication: Protected via Bearer Token
- Content-Type: `application/json`

##### Request Specification

###### Headers

- `Authorization: Bearer <JWT>`
- `Content-Type: application/json`

###### Body Fields

| Field             | Type   |                          Required | Description                    |
| ----------------- | ------ | --------------------------------: | ------------------------------ |
| `userId`          | string | Yes in the current implementation | User ID to target              |
| `currentPassword` | string |                               Yes | Current password               |
| `newPassword`     | string |                               Yes | New password (minimum 6 chars) |

Example body:

```json
{
  "userId": "64a1...",
  "currentPassword": "oldSecret123",
  "newPassword": "newSecret123"
}
```

##### Response Specification

- Success `200`

```json
{
  "message": "Password updated"
}
```

- Error cases
  - `400`: weak new password or incorrect current password
  - `401`: missing/invalid token
  - `404`: user not found
  - `500`: server failure

```json
{
  "message": "Password must be atleast 6 characters"
}
```

```json
{
  "message": "Current Password is incorrect"
}
```

##### Frontend Implementation Notes

- Send the authenticated user’s ID from the current profile state.
- After success, clear the password form and show a success toast.
- Consider forcing the user to log in again if you want a stronger security posture.

---

#### DELETE `/api/auth/account`

- Overview: Delete the authenticated user account and related poll/comment references.
- Authentication: Protected via Bearer Token
- Content-Type: `application/json`

##### Request Specification

###### Headers

- `Authorization: Bearer <JWT>`

###### Body Fields

- No body required

##### Response Specification

- Success `200`

```json
{
  "message": "Account Deleted"
}
```

- Error cases
  - `401`: missing/invalid token
  - `500`: server failure

##### Frontend Implementation Notes

- On success, clear all auth state, persisted token, and local cached user content.
- Redirect the user to the landing/auth screen immedately.

---

## 6. Recommended Frontend State Updates

Use the following state strategy when integrating with a React, Next.js, or similar frontend:

- On login or OTP verification success:
  - Store `token` in auth persistence
  - Store `user` in auth/user state
  - Set `isAuthenticated=true`

- On `GET /api/auth/me` success:
  - Hydrate the profile page and dashboard with the returned `user` and `stats`

- On profile update success:
  - Replace the current user object in the auth store
  - Update profile screens and any components that depend on `avatar`, `name`, or `bio`

- On password change success:
  - Clear password form state
  - Optionally force re-authentication

- On account deletion success:
  - Clear all auth-related state and redirect to login/register

---

## 7. Notes for AI Client Generators / UI Builders

- The current API is auth-first and centered around a single `User` resource.
- For forms that include files, always use `FormData` and send the file under the field name `image`.
- For JSON-based forms, send the body as standard JSON and include the `Authorization` header for protected actions.
- If you need to display a “pending verification” screen, use the `needsVerification` flag from the login and register flows.
- The backend currently does not expose poll or comment endpoints, so those UI flows will require future backend implementation.
