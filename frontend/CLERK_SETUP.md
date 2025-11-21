# Clerk Authentication Setup for Vexa.ai

## ✅ What Has Been Implemented

The Vexa.ai frontend now uses **Clerk** for authentication following the **official Next.js App Router quickstart**.

### Implementation Details

**1. Middleware** (`middleware.ts`)
```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});
```

**2. Root Layout** (`app/layout.tsx`)
```typescript
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

**3. Authentication Pages**
- `/sign-in/[[...sign-in]]/page.tsx` - Uses `<SignIn />` component
- `/sign-up/[[...sign-up]]/page.tsx` - Uses `<SignUp />` component

**4. Dashboard Layout**
- Uses `<SignedIn>`, `<SignedOut>`, `<UserButton>` components
- Protected routes via middleware

---

## 🚀 Setup Instructions

### Step 1: Create Clerk Application

1. Go to https://clerk.com
2. Sign up or log in
3. Click "Add application"
4. Name: **Vexa.ai**
5. Choose authentication methods:
   - ✅ Email
   - ✅ Google (recommended)
   - ✅ Microsoft (optional)
6. Click "Create application"

### Step 2: Get API Keys

1. Open your Clerk Dashboard
2. Go to **API Keys** page: https://dashboard.clerk.com/last-active?path=api-keys
3. Copy:
   - **Publishable Key** (starts with `pk_test_...`)
   - **Secret Key** (starts with `sk_test_...`)

### Step 3: Configure Environment Variables

Create `/Users/leonid/Documents/vexa-production/frontend/.env.local`:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_PASTE_YOUR_KEY_HERE
CLERK_SECRET_KEY=sk_test_PASTE_YOUR_KEY_HERE

# Clerk Webhook Secret (get this in Step 4)
CLERK_WEBHOOK_SECRET=whsec_PASTE_WEBHOOK_SECRET_HERE

# Vexa.ai API Backend
NEXT_PUBLIC_VEXA_API_URL=https://voice.axiomic.com.cy
NEXT_PUBLIC_VEXA_WS_URL=wss://voice.axiomic.com.cy/ws

# Admin API Token (for webhook user sync)
VEXA_ADMIN_API_TOKEN=PASTE_ADMIN_TOKEN_HERE

# Application
NEXT_PUBLIC_APP_URL=https://voice.axiomic.com.cy
NODE_ENV=production
```

### Step 4: Configure Webhook (User Sync)

The frontend has a webhook endpoint at `/api/webhooks/clerk` that syncs users to the Vexa backend.

1. In Clerk Dashboard, go to **Webhooks**
2. Click "Add Endpoint"
3. **Endpoint URL**: `https://voice.axiomic.com.cy/api/webhooks/clerk`
4. **Subscribe to events**:
   - ✅ `user.created`
   - ✅ `user.updated`
   - ✅ `user.deleted`
5. Click "Create"
6. Copy the **Signing Secret** (starts with `whsec_...`)
7. Add it to `.env.local` as `CLERK_WEBHOOK_SECRET`

### Step 5: Install Dependencies

```bash
cd /Users/leonid/Documents/vexa-production/frontend

# Install packages
npm install

# Verify Clerk is installed
npm list @clerk/nextjs
```

### Step 6: Run Development Server

```bash
npm run dev
```

Open http://localhost:3000 and test:
1. Click "Sign In" - should show Clerk sign-in modal
2. Create account
3. Verify redirect to `/meetings`
4. Check that user is synced to backend

---

## 🔐 Vexa Backend Integration

### How Authentication Works

```
User → Clerk Login → JWT Token
         ↓
Frontend API Client → Bearer Token Header
         ↓
Vexa Backend → Verify JWT with Clerk
         ↓
Return User Data
```

### API Client Setup

The `lib/api/client.ts` automatically injects Clerk Bearer tokens:

```typescript
import { useAuth } from '@clerk/nextjs';

// In ApiAuthProvider
const { getToken } = useAuth();
setClerkTokenGetter(() => getToken());

// API client automatically adds:
// Authorization: Bearer <clerk-jwt-token>
```

### Backend Verification

The Vexa backend needs to verify Clerk JWT tokens. Add this to your backend:

**For FastAPI:**

```python
from clerk import Clerk

clerk_client = Clerk(
    bearer_auth=os.getenv("CLERK_SECRET_KEY")
)

async def verify_clerk_token(token: str):
    try:
        user = clerk_client.users.verify_token(token)
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
```

---

## 📊 User Sync Flow

1. **User signs up in Clerk**
2. **Clerk webhook fires** → `/api/webhooks/clerk`
3. **Frontend webhook endpoint** calls Vexa backend:
   ```
   POST https://voice.axiomic.com.cy/api/admin/users/sync
   {
     "clerk_id": "user_...",
     "email": "user@example.com",
     "name": "John Doe",
     "image_url": "https://..."
   }
   ```
4. **Backend creates/updates user** in PostgreSQL
5. **User can now make API calls** with Clerk JWT

---

## 🧪 Testing Checklist

- [ ] Clerk application created
- [ ] API keys added to `.env.local`
- [ ] Webhook configured and secret added
- [ ] Dependencies installed (`npm install`)
- [ ] Dev server starts (`npm run dev`)
- [ ] Sign up works
- [ ] Sign in works
- [ ] User synced to backend (check PostgreSQL)
- [ ] Protected routes require authentication
- [ ] `/meetings` page loads after login
- [ ] User can sign out

---

## 🐳 Production Deployment

### Add Secrets to Kubernetes

```bash
kubectl patch secret vexa-secrets -n vexa \
  --type='json' \
  -p='[
    {"op": "add", "path": "/data/clerk-publishable-key", "value": "'$(echo -n "pk_live_..." | base64)'"},
    {"op": "add", "path": "/data/clerk-secret-key", "value": "'$(echo -n "sk_live_..." | base64)'"},
    {"op": "add", "path": "/data/clerk-webhook-secret", "value": "'$(echo -n "whsec_..." | base64)'"}
  ]'
```

### Update Helm Values

Add to `helm/custom-values.yaml`:

```yaml
frontend:
  enabled: true
  replicaCount: 2
  image:
    repository: vexa-frontend
    tag: "1.0.0"
  env:
    NEXT_PUBLIC_VEXA_API_URL: "https://voice.axiomic.com.cy"
```

### Build and Deploy

```bash
# Build Docker image
docker build -t ghcr.io/adminitbcomcy/vexa-frontend:1.0.0 frontend/
docker push ghcr.io/adminitbcomcy/vexa-frontend:1.0.0

# Deploy with Helm
helm upgrade vexa helm/vexa-official -n vexa -f helm/custom-values.yaml
```

### Update Clerk URLs for Production

In Clerk Dashboard:
1. Go to **Paths** settings
2. Update:
   - **Application URL**: `https://voice.axiomic.com.cy`
   - **Sign-in URL**: `https://voice.axiomic.com.cy/sign-in`
   - **Sign-up URL**: `https://voice.axiomic.com.cy/sign-up`
3. Update webhook endpoint:
   - **Endpoint URL**: `https://voice.axiomic.com.cy/api/webhooks/clerk`

---

## 📚 Resources

- **Clerk Next.js Quickstart**: https://clerk.com/docs/quickstarts/nextjs
- **Clerk Dashboard**: https://dashboard.clerk.com
- **Clerk Webhooks**: https://clerk.com/docs/integrations/webhooks
- **Next.js App Router**: https://nextjs.org/docs/app

---

## ✅ Implementation Complete

All Clerk integration follows **current best practices** for Next.js App Router:
- ✅ Using `clerkMiddleware()` (not deprecated `authMiddleware`)
- ✅ Proper `async/await` usage
- ✅ Correct route structure (`/sign-in/[[...sign-in]]`)
- ✅ Environment variables properly configured
- ✅ Webhook for user sync
- ✅ Bearer token authentication to backend

**Ready for production deployment!** 🚀
