# Deploying Nano Banana to Vercel

This guide walks you through deploying the **Nano Banana** Next.js application to [Vercel](https://vercel.com). The steps cover everything from collecting environment variables to verifying your production deployment.

## 1. Prerequisites

Before you begin, make sure you have:

- A Vercel account with access to the Git provider that hosts this repository.
- Node.js 18 or newer installed locally.
- Firebase project configured with Authentication and Firestore.
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/) if you plan to enable real image generation.

## 2. Collect Required Environment Variables

Copy `.env.example` to `.env.local` and replace placeholder values with your project secrets. You will provide the same values to Vercel.

| Variable | Required | Description | Source |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | ✅ | Public Firebase web API key | Firebase Console → Project Settings |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | ✅ | Firebase Auth domain (`<project>.firebaseapp.com`) | Firebase Console |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ✅ | Firebase project identifier | Firebase Console |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | ✅ | Cloud Storage bucket | Firebase Console |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ✅ | Firebase messaging sender ID | Firebase Console |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | ✅ | Firebase application ID | Firebase Console |
| `GEMINI_API_KEY` | ⚪️ | Gemini API key for real image generation (optional) | Google AI Studio |
| `NEXT_PUBLIC_USE_REAL_API` | ⚪️ | Set to `true` to call the real Gemini API | Manual toggle |
| `NEXT_PUBLIC_APP_URL` | ⚪️ | Public URL of your deployment, useful for callbacks | Vercel → Domains |

> ℹ️ Leave `NEXT_PUBLIC_USE_REAL_API=false` if you are using mock data while the image API is under development.

## 3. Prepare Firebase and Firestore

1. Enable **Authentication** with Email/Password and Google providers.
2. Create a **Firestore** database in production mode.
3. Optionally apply the security rules in [`firestore.rules`](../../firestore.rules).
4. If you need custom indexes, publish [`firestore.indexes.json`](../../firestore.indexes.json) via the Firebase CLI.

## 4. Deploy through the Vercel Dashboard

1. Log in to Vercel and click **New Project**.
2. Import this Git repository from your Git provider.
3. When prompted for the framework, Vercel should auto-detect **Next.js**. If not, select it manually.
4. In the **Environment Variables** section add the variables from step 2. Use the same names exactly as shown.
5. Leave the default build (`npm run build`) and install (`npm install`) commands unless you need to customize caching.
6. Click **Deploy**. Vercel will build and host the application at a preview URL.
7. Assign a production domain (the default `*.vercel.app` subdomain or a custom domain) and update `NEXT_PUBLIC_APP_URL` accordingly.

## 5. (Optional) Deploy with the Vercel CLI

If you prefer deploying from the command line:

```bash
npm install -g vercel
vercel login            # Authenticate once
vercel link             # Link the local project to a Vercel project
vercel env pull .env.local
vercel env add          # Add/confirm missing variables interactively
vercel --prod           # Trigger a production deployment
```

The `vercel env pull` command keeps your local `.env.local` in sync with the dashboard configuration.

## 6. Post-Deployment Checklist

- Visit the deployed site and confirm authentication flows work.
- Trigger the image generation flow. If you are using the mock API, confirm that the UI shows placeholder responses.
- Verify console output for runtime errors using the Vercel dashboard → **Project** → **Functions / Logs**.
- Configure Firestore indexes and security rules if you have not already.
- Share the deployment URL with stakeholders and update `NEXT_PUBLIC_APP_URL` for environment-specific logic.

## 7. Troubleshooting Tips

- **Build fails with missing environment variables**: Re-check that every required variable is configured for the `Production` environment in Vercel.
- **Authentication redirect errors**: Ensure your Firebase OAuth redirect domain matches the deployed Vercel domain.
- **API 500 errors**: Inspect logs in Vercel and verify that `GEMINI_API_KEY` is valid if you enabled real API calls.

With these steps, your Nano Banana app should be live on Vercel with production-ready settings.
