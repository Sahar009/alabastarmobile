/**
 * Google Sign-In configuration for Firebase Authentication.
 *
 * IMPORTANT: Since the backend uses Firebase Admin SDK, you must use OAuth 2.0 client IDs
 * from the SAME Google Cloud project that your Firebase project uses.
 *
 * Steps:
 * 1. Go to Firebase Console > Project Settings > Your Apps
 * 2. Select your Firebase project (the same one configured in the backend)
 * 3. In Google Cloud Console, ensure OAuth 2.0 credentials are created for:
 *    - Web application (for the Web Client ID)
 *    - iOS application (optional, for better iOS integration)
 *    - Android application (package name: com.alabastarmobile)
 *
 * 4. Get your Web Client ID from Firebase Console or Google Cloud Console
 * 5. Add it below
 *
 * Note: The backend will verify Google ID tokens using Firebase Admin SDK, so the token
 * must come from the same Google Cloud project as your Firebase configuration.
 *
 * Client ID format: ends with `.apps.googleusercontent.com`
 */

// Required: Web Client ID from your Firebase project (works for both Android and iOS)
// This should be the same OAuth client ID that your Firebase web app uses
export const GOOGLE_WEB_CLIENT_ID = '1048488946889-nj8dffvsv67ee5lp86af099l1304ec4k.apps.googleusercontent.com';

// Optional: iOS-specific Client ID from your Firebase project (recommended for iOS)
// If not provided, iOS will fallback to GOOGLE_WEB_CLIENT_ID
export const GOOGLE_IOS_CLIENT_ID = '';

/**
 * Check if Google Sign-In is configured.
 * Returns true if at least the Web Client ID is set.
 */
export const isGoogleSignInConfigured = Boolean(GOOGLE_WEB_CLIENT_ID);
