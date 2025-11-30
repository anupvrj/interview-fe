# 🔑 Clerk Setup Instructions

## Current Status

✅ Clerk SDK installed correctly (@clerk/nextjs)  
✅ Middleware configured properly  
✅ ClerkProvider added to layout  
⚠️ **Environment variables needed**

---

## Step 1: Get Your Clerk Keys (2 minutes)

1. **Visit Clerk Dashboard**

   - Go to: https://dashboard.clerk.com/last-active?path=api-keys
   - Or sign up at: https://clerk.com (free tier available)

2. **Create Application** (if you haven't already)

   - Click "Add Application"
   - Name: "Hello Interview"
   - Choose your auth methods (Email + Google recommended)

3. **Copy Your Keys**
   - **Publishable Key**: Starts with `pk_test_...`
   - **Secret Key**: Starts with `sk_test_...`

---

## Step 2: Create Environment File

Create a file named `.env.local` in the `frontend` directory:

```bash
cd /Users/anupkumar/projects/ai-agent/frontend

# Create the file
touch .env.local
```

Then add the following content (replace with your actual keys):

```env
# Clerk Authentication
# Get your keys from: https://dashboard.clerk.com/last-active?path=api-keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_PASTE_YOUR_ACTUAL_KEY_HERE
CLERK_SECRET_KEY=sk_test_PASTE_YOUR_ACTUAL_SECRET_HERE

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5004/api

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

---

## Step 3: Restart Development Server

After creating `.env.local`:

```bash
# Stop the current server (Ctrl + C in the terminal)
# Then restart:
cd /Users/anupkumar/projects/ai-agent/frontend
npm run dev
```

The server should now start without errors!

---

## ✅ Verification

Once the server starts, you should see:

```
▲ Next.js 15.0.3
- Local:        http://localhost:3000
✓ Ready in ~2s
```

**No more Clerk errors!**

---

## 🎯 What's Configured (Following Official Clerk Guidelines)

### ✅ Middleware (middleware.ts)

```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth().protect();
  }
});
```

### ✅ Layout (app/layout.tsx)

```typescript
import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

### ✅ Auth Pages

- Sign In: `/app/(auth)/sign-in/[[...sign-in]]/page.tsx`
- Sign Up: `/app/(auth)/sign-up/[[...sign-up]]/page.tsx`

---

## 🔒 Security Notes

- ✅ `.env.local` is in `.gitignore` (your keys are safe)
- ✅ Never commit `.env.local` to version control
- ✅ Use different keys for development and production
- ✅ `NEXT_PUBLIC_*` variables are exposed to browser (safe for publishable key)
- ✅ `CLERK_SECRET_KEY` stays server-side only

---

## 🐛 Troubleshooting

### "Missing publishableKey" error persists

1. Ensure `.env.local` is in the `frontend` folder (not root)
2. Verify no typos in variable names
3. Restart dev server after creating `.env.local`
4. Check keys don't have extra spaces or quotes

### "Invalid key format"

- Publishable key should start with `pk_test_` or `pk_live_`
- Secret key should start with `sk_test_` or `sk_live_`
- Copy keys directly from Clerk Dashboard

### Can't find Clerk Dashboard

Visit directly: https://dashboard.clerk.com/

---

## 📚 Official Resources

- **Clerk Docs**: https://clerk.com/docs
- **Next.js Quickstart**: https://clerk.com/docs/quickstarts/nextjs
- **API Keys**: https://dashboard.clerk.com/last-active?path=api-keys

---

## ✨ What Happens After Setup

Once Clerk is configured:

1. Visit http://localhost:3000
2. Click "Get Started Free" or "Sign In"
3. Sign up with email or Google
4. You'll be redirected to the dashboard
5. Your user data is automatically synced with backend

**Ready to test your Hello Interview platform!** 🚀
