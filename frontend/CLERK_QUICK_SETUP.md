# Clerk Quick Setup Guide

## ✅ What's Already Done

- ✅ API keys configured in `.env.local`
- ✅ Allowed origins set via API
- ✅ Instance verified: `ins_35kLBDP9yYI0I1q4pgsxoy9iC53`
- ✅ Application: **axiomic-voice**

---

## 🎯 Complete These Steps in Clerk Dashboard

### Step 1: Open Clerk Dashboard

Go to: **https://dashboard.clerk.com**

Select your application: **axiomic-voice**

---

### Step 2: Configure Webhooks (REQUIRED - 5 minutes)

**Navigation**: Clerk Dashboard → **Configure** → **Webhooks**

Or try these direct links:
- https://dashboard.clerk.com (then select axiomic-voice → Configure → Webhooks)
- https://clerk.com/dashboard

**Steps:**

1. Click **"Add Endpoint"** or **"Create Endpoint"**

2. **Endpoint URL**:
   ```
   https://voice.axiomic.com.cy/api/webhooks/clerk
   ```

3. **Description** (optional):
   ```
   Vexa user sync webhook
   ```

4. **Subscribe to events** - Select these:
   - ☑️ `user.created`
   - ☑️ `user.updated`
   - ☑️ `user.deleted`

5. Click **"Create"** or **"Add endpoint"**

6. **IMPORTANT**: Copy the **Signing Secret**
   - It starts with `whsec_...`
   - You'll need this immediately!

7. **Add to `.env.local`**:
   ```bash
   cd /Users/leonid/Documents/vexa-production/frontend

   # Open .env.local and add:
   CLERK_WEBHOOK_SECRET=whsec_YOUR_COPIED_SECRET_HERE
   ```

---

### Step 3: Configure Domains & URLs (2 minutes)

**Navigation**: Clerk Dashboard → **Configure** → **Domains** or **URLs**

**Set these values:**

| Setting | Value |
|---------|-------|
| **Home URL** | `https://voice.axiomic.com.cy` |
| **Sign in URL** | `https://voice.axiomic.com.cy/sign-in` |
| **Sign up URL** | `https://voice.axiomic.com.cy/sign-up` |
| **After sign in** | `https://voice.axiomic.com.cy/meetings` |
| **After sign up** | `https://voice.axiomic.com.cy/meetings` |

**For development, also add:**
- `http://localhost:3000`

---

### Step 4: Enable Social Connections (Optional - 3 minutes)

**Navigation**: Clerk Dashboard → **User & Authentication** → **Social Connections**

**Recommended to enable:**

1. **Google**
   - Toggle on
   - Click "Apply"
   - No additional setup needed for test mode

2. **Microsoft** (for Teams integration)
   - Toggle on
   - Click "Apply"

---

### Step 5: Configure Paths (1 minute)

**Navigation**: Clerk Dashboard → **Paths** or **Components**

Verify these paths are set:

```
Sign-in path: /sign-in
Sign-up path: /sign-up
```

---

## 🧪 Test Locally

After completing Dashboard configuration:

```bash
cd /Users/leonid/Documents/vexa-production/frontend

# 1. Verify environment variables
cat .env.local

# Should show:
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
# CLERK_SECRET_KEY=sk_test_...
# CLERK_WEBHOOK_SECRET=whsec_...  ← Make sure this is set!

# 2. Install dependencies (if not done)
npm install

# 3. Start dev server
npm run dev

# 4. Open browser
open http://localhost:3000
```

**Test checklist:**
- [ ] Homepage loads
- [ ] Click "Sign In" or "Sign Up"
- [ ] Clerk modal appears
- [ ] Create a test account
- [ ] Redirects to `/meetings` after signup
- [ ] `UserButton` appears in header
- [ ] Can sign out and sign back in

---

## 🔧 If Webhook Creation Doesn't Work in UI

You can use Svix CLI or test without webhook temporarily:

### Option 1: Test Without Webhook (Temporary)

The app will work without webhook, but users won't sync to your backend database.

### Option 2: Use Svix Portal Directly

1. In Clerk Dashboard, look for **"Svix Portal"** or **"Webhook Portal"** link
2. Click it to open Svix dashboard
3. Create endpoint there

### Option 3: Create Webhook via Backend API

We can create a simple script to register webhook through Clerk Backend API.

---

## 📋 Quick Checklist

- [ ] Open https://dashboard.clerk.com
- [ ] Select application: **axiomic-voice**
- [ ] Go to **Configure** → **Webhooks**
- [ ] Create endpoint: `https://voice.axiomic.com.cy/api/webhooks/clerk`
- [ ] Select events: user.created, user.updated, user.deleted
- [ ] Copy webhook signing secret (whsec_...)
- [ ] Add `CLERK_WEBHOOK_SECRET` to `.env.local`
- [ ] Configure domains/URLs
- [ ] Set paths: /sign-in, /sign-up
- [ ] Enable social auth (optional)
- [ ] Test locally with `npm run dev`

---

## 🚀 Production Deployment

Once local testing works:

```bash
# 1. Build Docker image
docker build -t ghcr.io/adminitbcomcy/vexa-frontend:1.0.0 .
docker push ghcr.io/adminitbcomcy/vexa-frontend:1.0.0

# 2. Add secrets to Kubernetes
ssh root@212.47.66.31

# Add Clerk secrets (replace YOUR_WEBHOOK_SECRET with actual value)
kubectl patch secret vexa-secrets -n vexa --type='json' -p='[
  {"op":"add","path":"/data/clerk-publishable-key","value":"'$(echo -n "pk_test_ZG9taW5hbnQtcmFtLTQ3LmNsZXJrLmFjY291bnRzLmRldiQ" | base64)'"},
  {"op":"add","path":"/data/clerk-secret-key","value":"'$(echo -n "sk_test_qBeSaR5jRlNhE7A544epxNvse5hGPJtLAnyV8rk7Ci" | base64)'"},
  {"op":"add","path":"/data/clerk-webhook-secret","value":"'$(echo -n "YOUR_WEBHOOK_SECRET" | base64)'"}
]'

# 3. Deploy frontend
helm upgrade vexa /root/helm/vexa-official -n vexa -f /root/helm/custom-values.yaml

# 4. Check deployment
kubectl get pods -n vexa | grep frontend
kubectl logs -n vexa -l app.kubernetes.io/component=frontend --tail=50
```

---

## 🆘 Troubleshooting

### Can't Find Webhooks in Dashboard?

Try these locations:
1. **Configure** → **Webhooks**
2. **Settings** → **Webhooks**
3. **Developers** → **Webhooks**
4. Look for **"Svix"** or **"Webhook Portal"** button

### Webhook Secret Not Working?

Make sure it's in the correct format:
```bash
CLERK_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

No quotes, no spaces, just the key starting with `whsec_`.

### Sign In Not Working?

1. Check browser console for errors
2. Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set
3. Check that domain is allowed in Clerk Dashboard
4. Try clearing browser cache and cookies

---

## 📞 Need Help?

- **Clerk Docs**: https://clerk.com/docs
- **Clerk Support**: https://clerk.com/support
- **Clerk Discord**: https://clerk.com/discord

---

## ✅ Summary

**Application**: axiomic-voice
**Instance**: ins_35kLBDP9yYI0I1q4pgsxoy9iC53
**Domain**: voice.axiomic.com.cy

**Status:**
- ✅ API configured
- ⚠️ Webhook setup required (in Dashboard UI)
- ⚠️ Domain URLs configuration required
- ⚠️ Testing required

**Estimated time to complete**: 10-15 minutes

**Ready to go!** 🚀
