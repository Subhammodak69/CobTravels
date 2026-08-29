# Mobile Auth and Referral Implementation Context

## Repository

Target repository:

`C:\Users\modak\OneDrive\Desktop\CobTravels`

This is the mobile app repository. It is a React Native TypeScript project with native Android and iOS folders.

Important: do not implement this work in the `CobTravelsWeb` repository.

## Current Request

Next implementation should update the mobile authentication screen and add Google Sign-In using the native React Native Google SDK. The mobile UI should follow the visual language of existing mobile screens and should not copy the current web auth design.

Use a clean, mobile-first auth screen with:

- Native-feeling spacing and controls
- Clear login and registration states
- OTP authentication
- Google Sign-In button
- Loading, error, and disabled states
- Referral-link awareness without exposing the raw referral code
- Keyboard-safe layout and accessibility labels

## Google Sign-In

Android web client ID:

`61755144915-du89t9h135q0c7iif4moo803ctc1icfq.apps.googleusercontent.com`

The expected native package is:

`@react-native-google-signin/google-signin`

The Google SDK should be configured with the Android client ID, and the returned Google ID token must be sent to the backend as `id_token`.

Do not put the client ID directly in a visible UI string. Use the project’s environment/configuration convention where possible. Verify Android Gradle configuration and SHA/package setup before testing native sign-in.

## Backend API

Base API used by the existing app:

`https://coochbehar-travels.onrender.com`

### OTP Request

`POST /api/v1/auth/otp/request`

JSON body:

```json
{
  "identifier": "mobile number or email",
  "purpose": "LOGIN",
  "visitor_id": "optional visitor id",
  "referral_code": "optional validated referral code"
}
```

### OTP Verify / Login / Registration

`POST /api/v1/auth/otp/verify`

JSON body:

```json
{
  "identifier": "mobile number or email",
  "otp": "six digit otp",
  "name": "required for registration, empty for login",
  "purpose": "LOGIN",
  "visitor_id": "optional visitor id",
  "referral_code": "optional validated referral code"
}
```

The same screen can support login and registration. Registration is selected when the user enters a name or when the screen is opened in signup mode.

### Google Login / Registration

`POST /api/v1/auth/google`

JSON body:

```json
{
  "id_token": "Google credential token",
  "visitor_id": "optional visitor id",
  "referral_code": "optional validated referral code"
}
```

Google authentication may create a new account or log in an existing user. After success, persist the returned access/refresh session using the mobile app’s existing auth/session mechanism.

## Referral Flow

### Logged-in User Referral Code

`GET /api/v1/referrals/code`

Authorization:

`Bearer YOUR_SECRET_TOKEN`

Response:

```json
{
  "success": true,
  "message": "string",
  "data": {
    "referral_code": "string"
  }
}
```

The logged-in user may use this code to generate an invite link. The raw referral code should not be displayed in the UI. The link should contain an encoded or opaque URL value.

### Validate Invite Link

`GET /api/v1/referrals/invite/{referral_code}`

Response:

```json
{
  "success": true,
  "message": "string",
  "data": {
    "referral_code": "string",
    "referrer_name": "string"
  }
}
```

When the mobile app opens from an invite link:

1. Read the encoded referral value from the deep link or initial URL.
2. Decode it locally.
3. Call the public invite validation endpoint.
4. If valid, store only the validated raw `referral_code` in secure/persistent local storage used by the auth flow.
5. Do not display the raw code.
6. Pass the stored referral code internally in OTP verify and Google auth payloads.
7. Preserve the referral code while navigating between login and signup.
8. Clear it after successful authentication or when it expires, according to the app’s storage conventions.

The public invite link should open a public app route/screen first, then allow the user to continue to login or registration.

## Referral History

`GET /api/v1/referrals`

Authorization:

`Bearer YOUR_SECRET_TOKEN`

Response data contains referral records:

```json
{
  "id": "uuid",
  "referral_code": "string",
  "status": "PENDING",
  "reward_amount": "string",
  "reward_issued_at": "timestamp or null",
  "converted_at": "timestamp or null",
  "created_at": "timestamp",
  "referred_customer": {
    "id": "uuid",
    "customer_code": "string",
    "name": "string",
    "email": "string",
    "mobile": "string"
  }
}
```

A future mobile referrals screen can show referral status/history without exposing the current user’s raw referral code.

## Implementation Notes

- First inspect the mobile project’s existing navigation, API client, auth context/store, storage utility, deep-link setup, and current auth screen.
- Reuse existing mobile patterns instead of importing web Tailwind/layout assumptions.
- Keep API calls centralized in the mobile API layer.
- Ensure Google SDK callbacks are not allowed to mutate React-owned DOM; this warning applies to web only, but native SDK lifecycle should still be cleaned up correctly.
- Handle cancellation separately from actual Google sign-in errors.
- Show a clear retry state when Google Play Services or the SDK is unavailable.
- Do not commit secrets or refresh tokens to source control. The Google client ID is not a secret, but keep it in the project’s expected config/env location.
- After implementation, validate with the mobile project’s TypeScript/lint checks and an Android build if the environment supports it.

## Acceptance Criteria

- Login screen supports OTP login.
- Signup screen supports name plus OTP registration.
- Google Sign-In button is visible and functional on both login and signup.
- Google `id_token` reaches `/api/v1/auth/google`.
- Referral code reaches both OTP verify and Google auth when the app was opened from a valid invite link.
- Invalid referral links do not block normal login/signup.
- Referral code is never shown as readable UI text.
- Loading, error, cancellation, and success states are handled.
- UI is designed for mobile screens and matches existing mobile app styling.
- Web repository remains unchanged for this mobile task.
