# Frontend Production Deployment Fix

## Problem
Frontend deployed to Vercel is showing:
- 404 errors
- No backend data loading
- Redirects to login on every page change
- Stats not showing

## Root Cause
Missing `NEXT_PUBLIC_API_URL` environment variable in Vercel, causing frontend to try connecting to `localhost:3001` instead of the production GCP backend.

## Solution

### Option 1: Using Vercel Dashboard (Recommended)

1. Go to https://vercel.com/sophies-projects-9fc67a21/educode-adaptive-platform/settings/environment-variables

2. Add the following environment variables for **Production**:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `NEXT_PUBLIC_API_URL` | `https://educode-backend-162585155042.us-central1.run.app` | Production |
   | `NEXT_PUBLIC_USE_MOCK_DATA` | `false` | Production |
   | `NEXT_PUBLIC_USE_MOCK_AUTH` | `false` | Production |
   | `NEXT_PUBLIC_USE_MOCK_PROBLEMS` | `false` | Production |
   | `NEXT_PUBLIC_USE_MOCK_ANALYTICS` | `false` | Production |

3. After adding variables, trigger a redeploy:
   - Go to Deployments tab
   - Click the three dots (•••) on the latest deployment
   - Select "Redeploy"
   - Check "Use existing Build Cache" = OFF (to force rebuild with new env vars)

### Option 2: Using Vercel CLI

```bash
# Run the automated setup script
./scripts/setup-vercel-env.sh

# Then trigger redeploy
git commit --allow-empty -m "Trigger redeploy with env vars"
git push origin main
```

Or manually:
```bash
cd apps/frontend

# Login to Vercel
vercel login

# Set each variable
vercel env add NEXT_PUBLIC_API_URL production
# When prompted, enter: https://educode-backend-162585155042.us-central1.run.app

vercel env add NEXT_PUBLIC_USE_MOCK_DATA production
# When prompted, enter: false

vercel env add NEXT_PUBLIC_USE_MOCK_AUTH production
# When prompted, enter: false

vercel env add NEXT_PUBLIC_USE_MOCK_PROBLEMS production
# When prompted, enter: false

vercel env add NEXT_PUBLIC_USE_MOCK_ANALYTICS production
# When prompted, enter: false

# Verify
vercel env ls

# Trigger redeploy
cd ../..
git commit --allow-empty -m "Trigger redeploy"
git push origin main
```

## Verification

After redeployment (takes ~2-3 minutes):

1. **Check environment in browser console:**
   ```javascript
   // Open https://educode-adaptive-platform.vercel.app
   // Open DevTools Console (F12)
   // Look for log: "🔧 Frontend Configuration"
   // Should show: apiUrl: "https://educode-backend-162585155042.us-central1.run.app"
   ```

2. **Test login:**
   - Go to https://educode-adaptive-platform.vercel.app/login
   - Login with: `test@example.com` / `password123`
   - Should redirect to `/dashboard` without 404
   - Check localStorage has `educode_token` and `educode_user`

3. **Test navigation:**
   - Click between Dashboard, Problems, Profile
   - Should NOT redirect to login
   - Should persist user state

4. **Test instructor features:**
   - Login with: `instructor@example.com` / `instructor123`
   - Should redirect to `/dashboard/instructor`
   - Should show CS201-FALL2025 class data
   - Should display KC mastery, at-risk students, analytics

5. **Check backend connectivity:**
   ```bash
   # Check backend health from frontend
   curl https://educode-adaptive-platform.vercel.app/api/health
   # Should return backend response, not 404
   
   # Or check directly
   curl https://educode-backend-162585155042.us-central1.run.app/health
   # Should return: {"status":"ok","service":"backend"}
   ```

## Backend CORS Configuration

Backend already allows Vercel deployments:
```typescript
// apps/backend/src/app.ts
app.use(cors({ 
  origin: [
    "http://localhost:3000", 
    "http://localhost:3001",
    /\.vercel\.app$/,  // ✅ Allows all Vercel domains
  ],
  credentials: true 
}));
```

## Troubleshooting

### If still getting 404s after redeploy:

1. **Check Vercel build logs:**
   - Go to Deployments → Latest Deployment → Building
   - Look for "Using environment variables"
   - Should list NEXT_PUBLIC_API_URL

2. **Check browser network tab:**
   - Open DevTools → Network tab
   - Try logging in
   - Look for API requests
   - Should go to `educode-backend-162585155042.us-central1.run.app`, not `localhost:3001`

3. **Clear browser cache:**
   - Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
   - Or clear site data in DevTools → Application → Clear storage

### If auth still redirects:

1. **Check localStorage:**
   - DevTools → Application → Local Storage
   - Should have `educode_token` and `educode_user`
   - If missing, token might be expiring

2. **Check auth-context.tsx:**
   - Verify `checkAuthStatus()` is restoring from localStorage
   - Verify `login()` is saving user data

3. **Check backend auth middleware:**
   - Ensure JWT tokens are valid
   - Check token expiration (currently 7 days)

## Files Reference

- Environment template: `apps/frontend/.env.production.example`
- Setup script: `scripts/setup-vercel-env.sh`
- Auth context: `apps/frontend/lib/auth-context.tsx`
- API config: `apps/frontend/lib/config.ts`
- Backend CORS: `apps/backend/src/app.ts`

## Expected Timeline

- Setting env vars: 2 minutes
- Vercel redeploy: 2-3 minutes
- Total: ~5 minutes to fix

## Next Steps After Fix

1. ✅ Test student login and dashboard
2. ✅ Test instructor login and analytics
3. ✅ Verify no re-login on navigation
4. ✅ Confirm stats and metrics load from backend
5. ✅ Test problem submission flow
6. 📝 Document for presentation demo
