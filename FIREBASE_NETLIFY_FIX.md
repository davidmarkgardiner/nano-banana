# Firebase Authentication Fix for Netlify

## Issue
The Netlify deployment at `https://nano-banana-app.netlify.app` is experiencing Firebase authentication errors with the message:
```
Illegal url for new iframe - https://****************.com/__/auth/iframe?...
```

This error occurs because the Netlify domain is not authorized in the Firebase project settings.

## Solution

### Step 1: Add Netlify domain to Firebase authorized domains

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`nano-banana-1758360022`)
3. Navigate to **Authentication** > **Settings** > **Authorized domains**
4. Click **Add domain**
5. Add the following domain:
   ```
   nano-banana-app.netlify.app
   ```
6. Click **Add**

### Step 2: Additional troubleshooting (if Step 1 doesn't work)

If you still see the error after adding the authorized domain, try these additional steps:

#### Option A: Clear browser cache and try incognito mode
1. Clear your browser cache completely
2. Try accessing `https://nano-banana-app.netlify.app` in an incognito/private window
3. Test authentication

#### Option B: Check Firebase Authentication configuration
1. In Firebase Console, go to **Authentication** > **Settings** > **Authorized domains**
2. Verify these domains are listed:
   - `localhost` (for local development)
   - `nano-banana-1758360022.firebaseapp.com` (Firebase hosting domain)
   - `nano-banana-app.netlify.app` (Netlify domain)
   - Your Vercel domain (if working there)

#### Option C: Double-check environment variables
Run this command to verify all Firebase env vars are set:
```bash
netlify env:list | grep FIREBASE
```

#### Option D: Wait for propagation
Firebase configuration changes can take 5-10 minutes to propagate globally. Wait a few minutes and try again.

### Step 2: Verify Environment Variables (Already Done)

The following environment variables are already configured in Netlify:
- ✅ `NEXT_PUBLIC_FIREBASE_API_KEY`
- ✅ `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- ✅ `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- ✅ `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- ✅ `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- ✅ `NEXT_PUBLIC_FIREBASE_APP_ID`

### Step 3: Test Authentication

After adding the domain:
1. Visit `https://nano-banana-app.netlify.app`
2. Try to sign in with Google
3. Authentication should work without errors

## Technical Details

The error occurs because Firebase Security Rules prevent authentication iframes from loading on unauthorized domains. This is a security feature to prevent domain spoofing attacks.

The obfuscated domain in the error (`https://****************.com`) is actually the Firebase Auth domain trying to load in an iframe, but it's being blocked because `nano-banana-app.netlify.app` is not in the authorized domains list.

## Current Status

- ✅ Environment variables configured in Netlify
- ✅ Code deployment successful
- ⏳ Firebase authorized domains need manual update
- ✅ Vercel deployment working (domain already authorized)