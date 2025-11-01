/**
 * Google Sign-In configuration.
 *
 * Update these client IDs with the values from your Google Cloud Console.
 * - webClientId is required to obtain an ID token on Android & iOS.
 * - iosClientId is optional but recommended for native iOS apps.
 */
export const GOOGLE_WEB_CLIENT_ID = '';
export const GOOGLE_IOS_CLIENT_ID = '';

export const isGoogleSignInConfigured = Boolean(GOOGLE_WEB_CLIENT_ID);
